import { Module } from '@nestjs/common';
import { AggregatedProxyService } from './proxy-extraction/aggregated-proxy.service';
import { SpiderModule } from './crawler/spider.module';
import { PrismaService } from '../prisma/prismaService';

@Module({
  imports: [SpiderModule],
  controllers: [],
  providers: [AggregatedProxyService,PrismaService],
})
export class AppModule {}
