
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { PrismaService } from '../../prisma/prismaService';

interface ProxyData {
  proxiesRange: string;
  source: string;
}

axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => retryCount * 2000,
  retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

@Injectable()
export class AggregatedProxyService {
  private readonly logger = new Logger(AggregatedProxyService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async fetchData(url: string, parseFn: (data: string) => ProxyData[]): Promise<ProxyData[]> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Prevent API rate-limiting
      const { data } = await axios.get(url, { timeout: 15000 });
      return parseFn(data);
    } catch (error) {
      this.logger.error(`Error fetching data from ${url}: ${error.message}`);
      return [];
    }
  }

  private sanitizeData(data: string): string {
    return data.replace(/\x00/g, '').trim(); // Remove null bytes
  }

  private parseFireholData(data: string): ProxyData[] {
    return this.sanitizeData(data).split('\n').filter((line) => line && !line.startsWith('#')).map((proxiesRange) => ({ proxiesRange, source: 'firehol' }));
  }

  private parseTorData(data: string): ProxyData[] {
    return this.sanitizeData(data).split('\n').filter((line) => line.startsWith('ExitAddress')).map((line) => ({ proxiesRange: line.split(' ')[1], source: 'tor' }));
  }

  private parseProxyScrapeData(data: string): ProxyData[] {
    return this.sanitizeData(data).split('\n').filter(Boolean).map((proxiesRange) => ({ proxiesRange, source: 'proxyscrape' }));
  }

  private parseStopForumSpamData(data: string): ProxyData[] {
    return this.sanitizeData(data).split('\n').filter(Boolean).map((proxiesRange) => ({ proxiesRange, source: 'stopforumspam' }));
  }

  private parseIp2ProxyLiteData(data: string): ProxyData[] {
    return this.sanitizeData(data).split('\n').filter(Boolean).map((proxiesRange) => ({ proxiesRange, source: 'ip2proxylite' }));
  }

  private deduplicateData(data: ProxyData[]): ProxyData[] {
    const unique = new Map<string, ProxyData>();
    data.forEach((entry) => {
      unique.set(entry.proxiesRange, { proxiesRange: entry.proxiesRange, source: unique.has(entry.proxiesRange) ? unique.get(entry.proxiesRange)!.source + ',' + entry.source : entry.source });
    });
    return Array.from(unique.values());
  }

  async updateAggregatedProxies(): Promise<void> {
    const sources = [
      { url: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset', parseFn: this.parseFireholData },
      { url: 'https://check.torproject.org/exit-addresses', parseFn: this.parseTorData },
      { url: 'https://api.proxyscrape.com/?request=getproxies&proxytype=http&timeout=10000&ssl=yes', parseFn: this.parseProxyScrapeData },
      { url: 'https://www.stopforumspam.com/downloads/listed_ip_30.zip', parseFn: this.parseStopForumSpamData },
      { url: 'https://www.ip2location.com/download?token=free&file=PX2LITE', parseFn: this.parseIp2ProxyLiteData },
    ];

    const fetchedData = (await Promise.all(sources.map(({ url, parseFn }) => this.fetchData(url, parseFn)))).flat();
    const dedupedData = this.deduplicateData(fetchedData);

    if (!dedupedData.length) {
      this.logger.warn('No new proxy data to update.');
      return;
    }

    try {
      await this.prisma.$transaction(
        dedupedData.map((entry) =>
          this.prisma.scrapperDetection.upsert({
            where: { proxiesRange: entry.proxiesRange },
            update: { source: entry.source },
            create: entry,
          })
        )
      );
      this.logger.log(`Successfully upserted ${dedupedData.length} proxy records.`);
    } catch (error) {
      this.logger.error(`Database update failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_10_HOURS)
  async handleCron(): Promise<void> {
    this.logger.log('Cron job started: Updating aggregated proxy database.');
    await this.updateAggregatedProxies();
    this.logger.log('Cron job completed.');
  }
}