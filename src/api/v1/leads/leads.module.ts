import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [HttpModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
