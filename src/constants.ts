import type { Stream, Paper, ContentItem, CustomPage, AppSettings } from './types';
import { MembershipTiers, type TierKey } from './types';

export const DEFAULT_STREAMS: Stream[] = [ { id: 'stream-1', name: 'General Stream' }, { id: 'stream-2', name: 'Technical Stream' } ];
export const DEFAULT_PAPERS: Paper[] = [ { id: 'paper-1', name: 'PC-01: Office Procedure', streamIds: ['stream-1'] } ];
export const DEFAULT_CONTENT_ITEMS: ContentItem[] = [ { id: 'content-1', title: 'Intro to Office Procedure', url: 'https://youtube.com', paperIds: ['paper-1'], tier: 'PUBLIC', type: 'video' } ];
export const DEFAULT_PAGES: CustomPage[] = [ { id: 'page-1', slug: 'about', title: 'About Us', content: '## Welcome', isVisible: true } ];

export const DEFAULT_SETTINGS: AppSettings = {
    siteTitle: 'The Stolen Notes',
    logoUrl: '',
    adminEmail: 'admin@example.com',
    backgroundColor: 'slate',
	cardColor: 'white',
	bodyTextColor: 'gray',
    accentColor: 'indigo',
    primaryHeadingColor: 'slate',
    secondaryHeadingColor: 'gray',
};