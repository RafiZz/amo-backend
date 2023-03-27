import { Module } from '@nestjs/common';
import { LeadsController } from './api/v1/leads/leads.controller';
import { LeadsService } from './api/v1/leads/leads.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class AppModule {}
