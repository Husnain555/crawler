import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from '../../prisma/prismaService';
import { detectProxyType, detectProxyPort } from './vpn-proxy-check';
import { entryPoints, loadProxyPorts } from './entry-points-open-ports';
import {
  getHeaders,
  randomDelay,
  extractSafeLinks,
  getCpuUsage,
  getMemoryUsage,
  handleResponse,
} from './humize-look';
import { verifyProxy } from './proxy-verification';

@Injectable()
export class SpiderService implements OnModuleInit {
  private readonly logger = new Logger(SpiderService.name);
  private readonly visitedUrls = new Set<string>();
  private readonly proxyIpSet = new Set<string>();
  private queue: string[] = [];
  private openProxyPorts: number[] = [];
  private maxConcurrentCrawlers = 5;
  private currentQueueSize = 0;
  private readonly maxCrawlersLimit = 50;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('🚀 Spider is starting...');

    // Load open proxy ports
    this.openProxyPorts = await loadProxyPorts();

    this.queue.push(...entryPoints);
    this.startCrawling();
    this.logCrawlerStats();
    this.autoAdjustCrawlers();
  }

  private startCrawling() {
    setInterval(async () => {
      while (this.queue.length > 0 && this.currentQueueSize < this.maxConcurrentCrawlers) {
        const url = this.queue.shift();
        if (url && !this.visitedUrls.has(url)) {
          this.visitedUrls.add(url);
          this.currentQueueSize++;
          this.crawl(url);
        }
      }
    }, 1000);
  }

  private async crawl(url: string) {
    try {
      this.logger.log(`🔍 Crawling: ${url}`);
      await randomDelay();
      const response = await axios.get(url, {
        headers: getHeaders(),
        timeout: 10000,
      });

      await handleResponse(response.status, url);

      if (response.status !== 200) {
        this.logger.warn(`⚠️ Skipping ${url}, received status ${response.status}`);
        return;
      }

      const $ = cheerio.load(response.data);
      extractSafeLinks($, url, this.visitedUrls, this.queue);
      await this.extractProxies(response.data, url);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to crawl ${url}: ${error.message}`);
    } finally {
      this.currentQueueSize--;
    }
  }

  private async extractProxies(html: string, source: string) {
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const foundIps = html.match(ipRegex);

    if (!foundIps) return;

    for (const ip of foundIps) {
      if (!this.proxyIpSet.has(ip)) {
        this.proxyIpSet.add(ip);
        const proxyType = await detectProxyType(ip, source);
        const port = await detectProxyPort(ip, this.openProxyPorts);
        if (port) {
          // Perform strict verification before skipping
          const verified = await verifyProxy(ip, port);
          if (verified) {
            await this.saveProxyIp(ip, proxyType, source, port);
          }
        }
      }
    }
  }

  private async saveProxyIp(ip: string, type: string, source: string, port: number) {
    try {
      await this.prisma.aggregatedProxy2.upsert({
        where: { ip },
        update: { lastSeen: new Date(), port, type },
        create: { ip, type, source, port, firstSeen: new Date() },
      });
      this.logger.log(`✅ Proxy IP saved: ${ip} (Type: ${type}, Port: ${port}, Source: ${source})`);
    } catch (error) {
      this.logger.error(`❌ Failed to save proxy IP ${ip}: ${error.message}`);
    }
  }

  private async autoAdjustCrawlers() {
    setInterval(() => {
      const queueLength = this.queue.length;
      const activeCrawlers = this.currentQueueSize;
      const cpuUsage = getCpuUsage();
      const memoryUsage = getMemoryUsage();

      if (queueLength > 100 && activeCrawlers < this.maxCrawlersLimit && cpuUsage < 80 && memoryUsage < 80) {
        this.maxConcurrentCrawlers = Math.min(activeCrawlers + 5, this.maxCrawlersLimit);
      } else if (queueLength < 20 || cpuUsage > 90 || memoryUsage > 90) {
        this.maxConcurrentCrawlers = Math.max(activeCrawlers - 3, 5);
      }

      this.logger.log(`🤖 AI adjusted crawlers to: ${this.maxConcurrentCrawlers}`);
    }, 5000);
  }

  private logCrawlerStats() {
    setInterval(() => {
      this.logger.log(`🕒 Active crawlers: ${this.currentQueueSize}`);
    }, 10000);
  }
}
