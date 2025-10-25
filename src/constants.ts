import type { Stream, Paper, ContentItem, CustomPage, AppSettings } from './types';
import { MembershipTier } from './types';

// --- THESE ARE THE DEFAULTS FOR YOUR DATA ---
export const DEFAULT_STREAMS: Stream[] = [ { id: 'stream-1', name: 'General Stream' }, { id: 'stream-2', name: 'Technical Stream' } ];
export const DEFAULT_PAPERS: Paper[] = [ { id: 'paper-1', name: 'PC-01: Office Procedure', streamIds: ['stream-1'] } ];
export const DEFAULT_CONTENT_ITEMS: ContentItem[] = [ { id: 'content-1', title: 'Intro to Office Procedure', url: 'https://youtube.com', paperId: 'paper-1', tier: MembershipTier.PUBLIC, type: 'video' } ];
export const DEFAULT_PAGES: CustomPage[] = [ { id: 'page-1', slug: 'about', title: 'About Us', content: '## Welcome', isVisible: true } ];

// --- THIS IS YOUR NEW, HARDCODED THEME ---
export const THEME_COLORS = {
    backgroundColor: '#F8F9FA',      // Very Light Gray
    darkBackgroundColor: '#121826',  // Dark Charcoal Blue
    cardColor: '#FFFFFF',          // White
    darkCardColor: '#1F2937',      // Dark Slate Gray
    bodyTextColor: '#4B5563',      // Medium Dark Gray
    darkBodyTextColor: '#D1D5DB',  // Light Gray
    primaryHeadingColor: '#1F2937',  // Almost Black
    darkPrimaryHeadingColor: '#F9FAFB',// Almost White
    secondaryHeadingColor: '#4B5563',// Medium Dark Gray
    darkSecondaryHeadingColor: '#D1D5DB', // Light Gray
    accentColor: '#3B82F6',          // Vibrant Blue
};

// --- WE KEEP THIS HERE FOR OTHER PARTS OF THE APP THAT MIGHT NEED IT ---
// --- BUT IT IS NO LONGER USED FOR THE THEME ---
export const DEFAULT_SETTINGS: AppSettings = {
    siteTitle: 'The Stolen Notes',
    logoUrl: '',
    adminEmail: 'admin@example.com',
    // The color values below are no longer used for styling
    backgroundColor: 'slate',
	cardColor: 'white',
	bodyTextColor: 'gray',
    accentColor: 'indigo',
    primaryHeadingColor: 'slate',
    secondaryHeadingColor: 'gray',
};