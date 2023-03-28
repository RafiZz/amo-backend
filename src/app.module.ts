import { Module } from '@nestjs/common';
import { LeadsController } from './api/v1/leads/leads.controller';
import { LeadsService } from './api/v1/leads/leads.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './api/v1/auth/auth.controller';
import { AuthService } from './api/v1/auth/auth.service';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [LeadsController, AuthController],
  providers: [LeadsService, AuthService],
})
export class AppModule {}
