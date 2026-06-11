export type PageType = "source" | "entity" | "synthesis" | "correction";
export type Confidence = "high" | "medium" | "low" | "unknown";
export type PageStatus = "active" | "draft" | "stale" | "disputed";

export interface SourceRef {
  source_id: string;
  span_id?: string;
}

export interface PageLink {
  page_id: string;
  type?: string;
}

export interface PageMetadata {
  id: string;
  type: PageType;
  title: string;
  created_at: string;
  updated_at: string;
  sources: SourceRef[];
  confidence: Confidence;
  status: PageStatus;
  links: PageLink[];
}

export interface WikiPage {
  metadata: PageMetadata;
  body: string;
}

export interface PageSummary {
  path: string;
  id: string;
  title: string;
  type: PageType;
  status: PageStatus;
  confidence: Confidence;
  updated_at: string;
}

export interface ReadWikiPageResult extends PageSummary {
  body: string;
  sources: SourceRef[];
  links: PageLink[];
}

export interface SearchPagesOptions {
  wikiPath: string;
  query: string;
  limit?: number;
}

export interface SearchResult extends PageSummary {
  score: number;
  snippet: string;
}

export interface WorkspaceConfig {
  schema_version: number;
  workspace_id: string;
  title: string;
  default_language: string;
  privacy_mode: "personal" | "shared" | "mixed";
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface InitWorkspaceOptions {
  wikiPath: string;
  title?: string;
  workspaceId?: string;
}

export interface NewPageOptions {
  wikiPath: string;
  title: string;
  type?: PageType;
  folder?: string;
  status?: PageStatus;
  confidence?: Confidence;
}

export interface SeedProjectOptions {
  wikiPath: string;
  title: string;
  ownerPage?: string;
  tasksPage?: string;
  status?: PageStatus;
  confidence?: Confidence;
}

export interface SeedProjectResult {
  pagePath: string;
  created: boolean;
}

export type SectionWriteMode = "replace" | "append";

export interface AppendSectionOptions {
  wikiPath: string;
  page: string;
  heading: string;
  content: string;
  level?: number;
  mode?: SectionWriteMode;
}

export interface LinkPageOptions {
  wikiPath: string;
  from: string;
  to: string;
  linkType?: string;
  markdown?: boolean;
  section?: string;
  sectionLevel?: number;
}

export interface AddSourceRefOptions {
  wikiPath: string;
  page: string;
  sourceId: string;
  spanId?: string;
}

export interface WorkspaceCheck {
  ok: boolean;
  pageCount: number;
  errors: string[];
}
