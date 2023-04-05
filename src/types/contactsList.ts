import type contactsList from '../fixtures/contactsList.json';

export type ContactsListResponseData = typeof contactsList;

export type ContactItem =
  ContactsListResponseData['_embedded']['contacts'][number];
