import { Module } from '@nestjs/common';
import { SpiderService } from './spider.service';
import { PrismaService } from '../../prisma/prismaService';

@Module({
  providers: [SpiderService,PrismaService],
  exports: [SpiderService],
})
export class SpiderModule {}
