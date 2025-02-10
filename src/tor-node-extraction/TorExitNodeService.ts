import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { PrismaService } from '../../prisma/prismaService';

@Injectable()
export class TorExitNodeService {
  private readonly logger = new Logger(TorExitNodeService.name);
  private torExitNodeListUrls: string[] = [
    'https://check.torproject.org/torbulkexitlist',
    'https://www.dan.me.uk/torlist/?exit',
  ];
  private torFullNodeListUrl: string = 'https://www.dan.me.uk/torlist/?full';
  private readonly batchSize: number = 100;
  private readonly batchDelayMs: number = 100;

  constructor(private readonly prisma: PrismaService) {}

  async fetchTorExitNodeList(): Promise<void> {
    try {
      const responses: AxiosResponse<string>[] = await Promise.all(
        this.torExitNodeListUrls.map((url: string) =>
          axios.get<string>(url, { timeout: 5000 }).catch((error: Error) => {
            this.logger.error(`Error fetching from ${url}: ${error.message}`);
            return { data: '' } as AxiosResponse<string>;
          }),
        ),
      );
      let torExitNodeLines: string[] = [];
      for (const response of responses) {
        if (response.data) {
          const lines: string[] = response.data
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string): boolean => {
              if (!line) return false;
              const firstField = this.getFirstField(line);
              return firstField !== '' && this.isValidIP(firstField);
            });
          torExitNodeLines = torExitNodeLines.concat(lines);
        }
      }
      torExitNodeLines = Array.from(new Set(torExitNodeLines));
      this.logger.log(`Fetched ${torExitNodeLines.length} unique Tor exit node entries.`);
      const torExitNodes: any[] = this.fetchNodeDetails(torExitNodeLines);
      await this.updateTorExitNodeDatabase(torExitNodes);
    } catch (error) {
      this.logger.error('Error in fetchTorExitNodeList:', error);
    }
  }

  async fetchTorFullNodeList(): Promise<void> {
    try {
      const response: AxiosResponse<string> = await axios.get<string>(this.torFullNodeListUrl, { timeout: 5000 });
      const lines: string[] = response.data
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string): boolean => {
          if (!line) return false;
          const firstField = this.getFirstField(line);
          return firstField !== '' && this.isValidIP(firstField);
        });
      const uniqueLines: string[] = Array.from(new Set(lines));
      this.logger.log(`Fetched ${uniqueLines.length} unique Tor full node entries.`);
      const torFullNodes: any[] = uniqueLines.map((line: string) => this.parseNodeLine(line));
      await this.updateTorFullNodeDatabase(torFullNodes);
    } catch (error) {
      this.logger.error('Error in fetchTorFullNodeList:', error);
    }
  }

  private getFirstField(line: string): string {
    let parts: string[];
    if (line.includes(',')) {
      parts = line.split(',').map((s: string) => s.trim());
    } else {
      parts = line.split(/\s+/);
    }
    return parts[0] || '';
  }

  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    return ipv4Regex.test(ip);
  }

  private fetchNodeDetails(lines: string[]): any[] {
    return lines.map((line: string) => this.parseNodeLine(line));
  }

  private parseNodeLine(line: string): any {
    let parts: string[];
    if (line.includes(',')) {
      parts = line.split(',').map((s: string) => s.trim());
    } else {
      parts = line.split(/\s+/);
    }
    return {
      ip: parts[0] || '',
      name: parts[1] || '',
      onion: parts[2] || '',
      port: parts[3] || '',
      directory: parts[4] || '',
      flags: parts[5] || '',
      uptime: parts[6] || '',
      version: parts[7] || '',
      contact: parts[8] || '',
    };
  }

  private async updateTorExitNodeDatabase(torExitNodes: any[]): Promise<void> {
    try {
      const existingRecords = await this.prisma.torExitNode.findMany({ select: { ip: true } });
      const existingIPSet = new Set(existingRecords.map((record: { ip: string }) => record.ip));
      const nodesToUpsert: any[] = torExitNodes.filter((node: any) => !existingIPSet.has(node.ip));
      if (nodesToUpsert.length > 0) {
        await this.upsertNodesInBatches(nodesToUpsert, this.prisma.torExitNode);
        this.logger.log(`Added/Updated ${nodesToUpsert.length} new Tor exit nodes.`);
      } else {
        this.logger.log('No new Tor exit nodes to update.');
      }
    } catch (error) {
      this.logger.error('Error updating Tor exit node database:', error);
    }
  }

  private async updateTorFullNodeDatabase(torFullNodes: any[]): Promise<void> {
    try {
      const existingRecords = await this.prisma.torFullNode.findMany({ select: { ip: true } });
      const existingIPSet = new Set(existingRecords.map((record: { ip: string }) => record.ip));
      const nodesToUpsert: any[] = torFullNodes.filter((node: any) => !existingIPSet.has(node.ip));
      if (nodesToUpsert.length > 0) {
        await this.upsertNodesInBatches(nodesToUpsert, this.prisma.torFullNode);
        this.logger.log(`Added/Updated ${nodesToUpsert.length} new Tor full nodes.`);
      } else {
        this.logger.log('No new Tor full nodes to update.');
      }
    } catch (error) {
      this.logger.error('Error updating Tor full node database:', error);
    }
  }

  private async upsertNodesInBatches<T>(
    nodes: T[],
    model: { upsert: (args: { where: { ip: string }; create: T; update: T }) => Promise<any> }
  ): Promise<void> {
    const batches = this.chunkArray(nodes, this.batchSize);
    for (const batch of batches) {
      for (const node of batch) {
        try {
          await model.upsert({
            where: { ip: (node as any).ip },
            create: node,
            update: node,
          });
        } catch (error) {
          this.logger.error(`Error upserting node ${(node as any).ip}:`, error);
        }
      }
      await this.delay(this.batchDelayMs);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
