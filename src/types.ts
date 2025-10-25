export enum MembershipTier {
  PUBLIC = "Public",
  LEVEL_1 = "Level 1 Member",
  LEVEL_2 = "Level 2 Member",
  LEVEL_3 = "Level 3 Member",
}

export interface Stream { id: string; name: string; }
export interface Paper { id: string; name: string; streamIds: string[]; }
export interface ContentItem { id: string; title: string; url: string; paperId: string; tier: MembershipTier; type: 'video' | 'test' | 'form'; }
export interface CustomPage { id: string; title: string; content: string; slug: string; isVisible: boolean; }
export interface SimpleUser { uid: string; email: string | null; }

export interface AppSettings {
  siteTitle: string;
  logoUrl: string;
  adminEmail: string;
  backgroundColor: string;
  cardColor: string;
  bodyTextColor: string;
  accentColor: string;
  primaryHeadingColor: string;
  secondaryHeadingColor: string;
}

export const COLOR_OPTIONS = [ 'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose' ] as const;
export type CollectionName = 'streams' | 'papers' | 'contentItems' | 'pages';
