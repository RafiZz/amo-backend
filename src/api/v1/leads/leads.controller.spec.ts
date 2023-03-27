import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller';
import { LeadsService, LeadWithContacts } from './leads.service';

describe('LeadsController', () => {
  let leadsController: LeadsController;
  let leadsService: LeadsService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [LeadsController],
      providers: [LeadsService],
    }).compile();

    leadsController = app.get<LeadsController>(LeadsController);
    leadsService = app.get<LeadsService>(LeadsService);
  });

  describe('root', () => {
    it('/api/v1/leads', async () => {
      jest
        .spyOn(leadsService, '_getLeads')
        .mockImplementation(() => import('../../../mocks/leadsList.json'));
      jest
        .spyOn(leadsService, '_getContacts')
        .mockImplementation(() => import('../../../mocks/contactsList.json'));

      const leads = await leadsController.getLeads();

      expect(leadsService._getLeads).toHaveBeenCalledTimes(1);
      expect(leadsService._getContacts).toHaveBeenCalledTimes(1);

      expect(Array.isArray(leads)).toBeTruthy();
      expect(leads.every((l) => l._embedded.contacts.length)).toBeTruthy();

      // данные контакта имеются и каждый контакт правильно сопоставлен по id
      const isContactsExists = leads.every((l) => {
        return l._embedded.contacts.every(
          (c: LeadWithContacts['_embedded']['contacts'][number]) =>
            c.data && c.id === c.data.id,
        );
      });
      expect(isContactsExists).toBeTruthy();
    });
  });
});
