import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadsController } from './api/v1/leads/leads.controller';
import { LeadsService } from './api/v1/leads/leads.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [AppController, LeadsController],
  providers: [AppService, LeadsService],
})
export class AppModule {}
