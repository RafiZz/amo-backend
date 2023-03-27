import { Controller, Get, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('/api/v1')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('/leads')
  getLeads(@Query('query') query?) {
    if (query && typeof query === 'string' && query.length > 2) {
      return this.leadsService.getLeadsWithContacts({ query });
    }
    return this.leadsService.getLeadsWithContacts();
  }
}
