import type contactsList from './contactsList.json';

export type ContactsListResponseData = typeof contactsList;

export type ContactItem =
  ContactsListResponseData['_embedded']['contacts'][number];
