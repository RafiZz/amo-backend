import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

import type {
  ContactItem,
  ContactsListResponseData,
} from 'src/types/contactsList';
import type { LeadItem, LeadsListResponseData } from 'src/types/leadsList';

type LeadContactWithData = LeadItem['_embedded']['contacts'][number] & {
  data: ContactItem;
};

type LeadItemEmbedded = LeadItem['_embedded'] & {
  contacts: LeadContactWithData[];
};

export type LeadWithContacts = LeadItem & {
  _embedded: LeadItemEmbedded;
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
        leadsResponse._embedded.leads.flatMap((l) =>
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
      contactsMap = contactsResponse?._embedded.contacts.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});
    }

    // добавляем к каждому контакту дополнительное поле "data" с информацией
    const leads = leadsResponse?._embedded.leads.map((l) => ({
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

  async _getLeads({ query }: { query: string } = { query: '' }) {
    const params: { [key: string]: string | number } = {
      with: 'contacts',
    };

    if (query) {
      params.query = query;
    }

    const { data } = await firstValueFrom(
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

    return data;
  }

  async _getContacts(
    { contactIds }: { contactIds: number[] } = { contactIds: [] },
  ) {
    const params: AxiosRequestConfig['params'] = {
      filter: {
        id: contactIds,
      },
    };

    const { data } = await firstValueFrom(
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

    return data;
  }
}
