import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ContactItem, ContactsListResponseData } from 'src/mocks/contactsList';

import { LeadItem, LeadsListResponseData } from 'src/mocks/leadsList';

type LeadContactWithData = LeadItem['_embedded']['contacts'][number] & {
  data: ContactItem;
};

type LeadWithContacts = LeadItem & {
  _embedded: {
    contacts: LeadContactWithData[];
  };
};

type ContactsMap = { [key: ContactItem['id']]: ContactItem };

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly httpService: HttpService) {}

  async getLeadsWithContacts(
    { query }: { query: string } = { query: '' },
  ): Promise<LeadWithContacts[]> {
    const leadsResponse = await this._getLeads({
      query,
    });

    const contactIds = Array.from(
      new Set(
        leadsResponse.data._embedded.leads.flatMap((l) =>
          l._embedded.contacts.map((c) => c.id),
        ),
      ),
    );

    let contactsResponse: Awaited<
      ReturnType<LeadsService['_getContacts']>
    > | null = null;
    let contactsMap: ContactsMap | null = null;

    if (contactIds.length) {
      contactsResponse = await this._getContacts({ contactIds });
      contactsMap = contactsResponse?.data._embedded.contacts.reduce(
        (c: ContactItem, acc: ContactsMap) => {
          acc[c.id] = c;
          return acc;
        },
        {},
      );
    }

    const leads = leadsResponse?.data._embedded?.leads.map((l) => ({
      ...l,
      _embedded: {
        ...l._embedded,
        contacts: l._embedded.contacts.map((c) => ({
          ...c,
          data: contactsMap ? contactsMap[c.id] : null,
        })),
      },
    }));

    return leads;
  }

  _requestAMOCRM<T>(extraConfig: AxiosRequestConfig = {}) {
    return this.httpService.request<T>({
      method: extraConfig?.method || 'GET',
      headers: {
        Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}`,
        ...(extraConfig?.headers || {}),
      },
      baseURL: extraConfig?.baseURL || process.env.AMOCRM_URL,
      url: extraConfig.url,
      params: extraConfig.params,
    });
  }

  _getLeads({ query }: { query: string } = { query: '' }) {
    const params: { [key: string]: string | number } = {
      with: 'contacts',
    };

    if (query) {
      params.query = query;
    }

    return firstValueFrom(
      this._requestAMOCRM<LeadsListResponseData>({
        url: '/api/v4/leads',
        params,
      }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw error;
        }),
      ),
    );
  }

  _getContacts({ contactIds }: { contactIds: number[] } = { contactIds: [] }) {
    const params: AxiosRequestConfig['params'] = {
      filter: {
        id: contactIds,
      },
    };

    return firstValueFrom(
      this._requestAMOCRM<ContactsListResponseData>({
        url: '/api/v4/contacts',
        params,
      }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw error;
        }),
      ),
    );
  }
}
