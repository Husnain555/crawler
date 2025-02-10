import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TorExitNodeService } from './TorExitNodeService';

@Injectable()
export class TorExitNodeCronService {
  private readonly logger = new Logger(TorExitNodeCronService.name);

  constructor(private readonly torExitNodeService: TorExitNodeService) {}

  // Run every 30 minutes
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleExitNodeCron() {
    this.logger.log('Running cron job to update Tor exit nodes...');
    await this.torExitNodeService.fetchTorExitNodeList();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleFullNodeCron() {
    this.logger.log('Running cron job to update Tor full nodes...');
    await this.torExitNodeService.fetchTorFullNodeList();
  }
}
