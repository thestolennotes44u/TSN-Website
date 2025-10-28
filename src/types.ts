export const MembershipTiers = {
    PUBLIC:  { name: 'Public',  level: 0 },
    LEVEL_1: { name: 'Level 1', level: 1 },
    LEVEL_2: { name: 'Level 2', level: 2 },
    LEVEL_3: { name: 'Level 3', level: 3 },
};

export type TierKey = keyof typeof MembershipTiers;

export interface HomepageContent {
    id: string; // Should always be 'main'
    welcomeTitle: string;
    welcomeText: string;
    showExtraSection: boolean;
    extraSectionTitle: string;
    extraSectionContent: string; // Markdown
}

export interface Stream { id: string; name: string; order?: number; }
export interface Paper { id: string; name: string; streamIds: string[]; order?: number; }
export interface ContentItem { id: string; title: string; url: string; paperIds: string[]; tier: TierKey; type: 'video' | 'test' | 'form'; order?: number; }
export interface CustomPage { id: string; title: string; slug: string; content: string; isVisible: boolean; order?: number; }

export interface AppSettings {
    siteTitle: string;
    logoUrl: string;
    adminEmail: string;
    showByPaperTab: boolean;
    showByTierTab: boolean;
    showTestsTab: boolean;
    showFormsTab: boolean;
    backgroundColor: string;
	cardColor: string;
	bodyTextColor: string;
    accentColor: string;
    primaryHeadingColor: string;
    secondaryHeadingColor: string;
}

export type CollectionName = 'streams' | 'papers' | 'contentItems' | 'pages';