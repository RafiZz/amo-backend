import leadsList from './leadsList.json';

export type LeadsListResponseData = typeof leadsList;

export type LeadItem = LeadsListResponseData['_embedded']['leads'][number];
