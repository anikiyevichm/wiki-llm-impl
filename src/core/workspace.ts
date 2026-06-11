import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  metadataPathForPage,
  parseMarkdownBody,
  serializeMarkdownBody,
  validateMetadata,
} from "./page-format.js";
import type {
  AddSourceRefOptions,
  AppendSectionOptions,
  InitWorkspaceOptions,
  LinkPageOptions,
  NewPageOptions,
  PageMetadata,
  PageSummary,
  ReadWikiPageResult,
  SearchPagesOptions,
  SearchResult,
  SeedProjectOptions,
  SeedProjectResult,
  WikiPage,
  WorkspaceCheck,
  WorkspaceConfig,
} from "./types.js";

const workspaceDirs = [
  "pages",
  "pages/person",
  "pages/project",
  "pages/source",
  "pages/synthesis",
  "pages/tasks",
  "sources",
  "sources/manifests",
  "sources/raw",
  "indexes",
  "error-book",
  "error-book/entries",
  "runs",
  "runs/ingest",
  "runs/retrieval",
];

export async function initWorkspace(options: InitWorkspaceOptions): Promise<WorkspaceConfig> {
  const wikiPath = path.resolve(options.wikiPath);
  for (const dir of workspaceDirs) {
    await mkdir(path.join(wikiPath, dir), { recursive: true });
  }

  const configPath = path.join(wikiPath, "config.json");
  const now = nowIso();
  const config: WorkspaceConfig = {
    schema_version: 1,
    workspace_id: options.workspaceId ?? makeStableId("wiki", wikiPath),
    title: options.title ?? "Local LLM Wiki",
    default_language: "mixed",
    privacy_mode: "personal",
    created_at: now,
    updated_at: now,
    notes: "Local wiki workspace for wiki-llm-impl.",
  };

  try {
    const existing = await readJson<WorkspaceConfig>(configPath);
    return existing;
  } catch {
    await writeJsonAtomic(configPath, config);
    return config;
  }
}

export async function readPage(filePath: string): Promise<WikiPage> {
  const markdown = await readFile(filePath, "utf8");
  const metadata = await readJson<PageMetadata>(metadataPathForPage(filePath));
  validateMetadata(metadata);
  const { body } = parseMarkdownBody(markdown);
  return { metadata, body };
}

export async function writePage(filePath: string, page: WikiPage): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFileAtomic(filePath, serializeMarkdownBody(page));
  await writeJsonAtomic(metadataPathForPage(filePath), page.metadata);
}

export async function createPage(options: NewPageOptions): Promise<string> {
  const type = options.type ?? "synthesis";
  const folder = options.folder ?? `pages/${type}`;
  const slug = slugify(options.title);
  const filePath = path.resolve(options.wikiPath, folder, `${slug}.md`);
  const now = nowIso();
  const metadata: PageMetadata = {
    id: `page_${type}_${slug.replaceAll("-", "_")}`,
    type,
    title: options.title,
    created_at: now,
    updated_at: now,
    sources: [],
    confidence: options.confidence ?? "unknown",
    status: options.status ?? "draft",
    links: [],
  };

  await writePage(filePath, {
    metadata,
    body: `# ${options.title}\n\n## Notes\n\n- TODO\n`,
  });

  return filePath;
}

export async function ensurePage(options: NewPageOptions): Promise<{ pagePath: string; created: boolean }> {
  const type = options.type ?? "synthesis";
  const folder = options.folder ?? `pages/${type}`;
  const slug = slugify(options.title);
  const filePath = path.resolve(options.wikiPath, folder, `${slug}.md`);

  if (await pathExists(filePath)) {
    return { pagePath: filePath, created: false };
  }

  return {
    pagePath: await createPage(options),
    created: true,
  };
}

export async function checkWorkspace(wikiPath: string): Promise<WorkspaceCheck> {
  const resolvedWikiPath = path.resolve(wikiPath);
  const errors: string[] = [];
  let pageCount = 0;

  try {
    await readJson<WorkspaceConfig>(path.join(resolvedWikiPath, "config.json"));
  } catch (error) {
    errors.push(`Invalid or missing config.json: ${errorMessage(error)}`);
  }

  const pagePaths = await listMarkdownFiles(path.join(resolvedWikiPath, "pages"));
  pageCount = pagePaths.length;

  for (const pagePath of pagePaths) {
    try {
      const page = await readPage(pagePath);
      validateMetadata(page.metadata);
    } catch (error) {
      errors.push(`${pagePath}: ${errorMessage(error)}`);
    }
  }

  return {
    ok: errors.length === 0,
    pageCount,
    errors,
  };
}

export async function listPages(wikiPath: string): Promise<PageSummary[]> {
  const resolvedWikiPath = path.resolve(wikiPath);
  const pagePaths = await listMarkdownFiles(path.join(resolvedWikiPath, "pages"));
  const summaries: PageSummary[] = [];

  for (const pagePath of pagePaths) {
    const page = await readPage(pagePath);
    summaries.push(toPageSummary(resolvedWikiPath, pagePath, page.metadata));
  }

  return summaries;
}

export async function readWikiPage(wikiPath: string, page: string): Promise<ReadWikiPageResult> {
  const resolvedWikiPath = path.resolve(wikiPath);
  const pagePath = resolvePagePath(wikiPath, page);
  const wikiPage = await readPage(pagePath);
  return {
    ...toPageSummary(resolvedWikiPath, pagePath, wikiPage.metadata),
    body: wikiPage.body,
    sources: wikiPage.metadata.sources,
    links: wikiPage.metadata.links,
  };
}

export async function searchPages(options: SearchPagesOptions): Promise<SearchResult[]> {
  const resolvedWikiPath = path.resolve(options.wikiPath);
  const query = options.query.trim().toLowerCase();
  if (query.length === 0) {
    return [];
  }

  const terms = query.split(/\s+/u).filter((term) => term.length > 0);
  const pagePaths = await listMarkdownFiles(path.join(resolvedWikiPath, "pages"));
  const results: SearchResult[] = [];

  for (const pagePath of pagePaths) {
    const page = await readPage(pagePath);
    const haystack = [
      page.metadata.title,
      page.metadata.id,
      page.metadata.type,
      page.metadata.status,
      page.body,
    ].join("\n");
    const searchable = haystack.toLowerCase();
    const score = terms.reduce((total, term) => {
      const titleScore = page.metadata.title.toLowerCase().includes(term) ? 5 : 0;
      const bodyMatches = countOccurrences(searchable, term);
      return total + titleScore + bodyMatches;
    }, 0);

    if (score > 0) {
      results.push({
        ...toPageSummary(resolvedWikiPath, pagePath, page.metadata),
        score,
        snippet: makeSnippet(page.body, terms),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, options.limit ?? 10);
}

export async function appendSection(options: AppendSectionOptions): Promise<string> {
  const pagePath = resolvePagePath(options.wikiPath, options.page);
  const page = await readPage(pagePath);
  const level = options.level ?? 2;
  const mode = options.mode ?? "replace";

  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new Error("Section heading level must be an integer between 1 and 6.");
  }

  const heading = options.heading.trim();
  if (heading.length === 0) {
    throw new Error("Section heading cannot be empty.");
  }

  const nextBody = writeSection(page.body, {
    heading,
    content: options.content,
    level,
    mode,
  });

  page.body = nextBody;
  page.metadata.updated_at = nowIso();
  await writePage(pagePath, page);

  return pagePath;
}

export async function linkPage(options: LinkPageOptions): Promise<string> {
  const fromPath = resolvePagePath(options.wikiPath, options.from);
  const toPath = resolvePagePath(options.wikiPath, options.to);
  const fromPage = await readPage(fromPath);
  const toPage = await readPage(toPath);
  const link = options.linkType
    ? { page_id: toPage.metadata.id, type: options.linkType }
    : { page_id: toPage.metadata.id };
  const hasLink = fromPage.metadata.links.some(
    (existingLink) => existingLink.page_id === link.page_id && existingLink.type === link.type,
  );

  if (!hasLink) {
    fromPage.metadata.links.push(link);
  }

  if (options.markdown ?? true) {
    const section = options.section ?? "Links";
    const wikiLink = `- [[${toPage.metadata.title}]]`;
    if (!fromPage.body.includes(`[[${toPage.metadata.title}]]`)) {
      fromPage.body = writeSection(fromPage.body, {
        heading: section,
        content: wikiLink,
        level: options.sectionLevel ?? 2,
        mode: "append",
      });
    }
  }

  fromPage.metadata.updated_at = nowIso();
  await writePage(fromPath, fromPage);

  return fromPath;
}

export async function addSourceRef(options: AddSourceRefOptions): Promise<string> {
  const pagePath = resolvePagePath(options.wikiPath, options.page);
  const page = await readPage(pagePath);
  const sourceRef = options.spanId
    ? { source_id: options.sourceId, span_id: options.spanId }
    : { source_id: options.sourceId };
  const hasSource = page.metadata.sources.some(
    (existingSource) =>
      existingSource.source_id === sourceRef.source_id && existingSource.span_id === sourceRef.span_id,
  );

  if (!hasSource) {
    page.metadata.sources.push(sourceRef);
  }

  page.metadata.updated_at = nowIso();
  await writePage(pagePath, page);
  return pagePath;
}

export async function seedProject(options: SeedProjectOptions): Promise<SeedProjectResult> {
  const { pagePath, created } = await ensurePage({
    wikiPath: options.wikiPath,
    title: options.title,
    type: "entity",
    folder: "pages/project",
    status: options.status ?? "active",
    confidence: options.confidence ?? "medium",
  });
  const page = path.relative(path.resolve(options.wikiPath), pagePath).replaceAll("\\", "/");

  await appendSection({
    wikiPath: options.wikiPath,
    page,
    heading: "Notes",
    content: [
      "Seed page for a non-work project. Keep this page separate from Mikita's main work context.",
      "",
      "Do not add work/client/employer details here unless Mikita explicitly says they belong in personal local memory.",
    ].join("\n"),
  });
  await appendSection({
    wikiPath: options.wikiPath,
    page,
    heading: "Known",
    content: [
      `- \`${options.title}\` is one of Mikita's non-work projects.`,
      "- It should be kept separate from Mikita's main work context.",
      "- The project details are not known yet.",
      "",
      "This page is a seed page. It should be expanded only with information Mikita explicitly shares or approves for local memory.",
    ].join("\n"),
  });
  await appendSection({
    wikiPath: options.wikiPath,
    page,
    heading: "Unknowns",
    content: [
      `- What is \`${options.title}\`?`,
      "- Current status is unknown.",
      "- Goals, users, repository, stack, and next tasks are unknown.",
    ].join("\n"),
  });
  await appendSection({
    wikiPath: options.wikiPath,
    page,
    heading: "Next Questions",
    content: [
      "- Ask Mikita for a one-paragraph description.",
      "- Capture current status: idea, prototype, active, paused, shipped.",
      "- Capture why it matters to Mikita.",
      "- Link related notes only if they are non-work and approved for `my-wiki`.",
    ].join("\n"),
  });

  if (options.ownerPage) {
    await linkPage({
      wikiPath: options.wikiPath,
      from: options.ownerPage,
      to: page,
      section: "Non-Work Projects",
      linkType: "owns",
    });
  }
  if (options.tasksPage) {
    await linkPage({
      wikiPath: options.wikiPath,
      from: options.tasksPage,
      to: page,
      section: "Non-Work Projects",
      linkType: "tracks",
    });
  }

  return { pagePath, created };
}

export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "page";
}

interface WriteSectionOptions {
  heading: string;
  content: string;
  level: number;
  mode: "replace" | "append";
}

export function writeSection(body: string, options: WriteSectionOptions): string {
  const normalizedBody = body.replace(/\r\n/g, "\n").replace(/\s+$/u, "");
  const normalizedContent = options.content.replace(/\r\n/g, "\n").trim();
  const sectionMarkdown = [
    `${"#".repeat(options.level)} ${options.heading}`,
    "",
    normalizedContent,
  ].join("\n");
  const headingPattern = new RegExp(
    `^${"#".repeat(options.level)}\\s+${escapeRegExp(options.heading)}\\s*$`,
    "im",
  );
  const match = headingPattern.exec(normalizedBody);

  if (!match || match.index === undefined) {
    return `${normalizedBody}\n\n${sectionMarkdown}\n`;
  }

  const sectionStart = match.index;
  const contentStart = sectionStart + match[0].length;
  const rest = normalizedBody.slice(contentStart);
  const nextHeadingPattern = new RegExp(`\\n#{1,${options.level}}\\s+`, "m");
  const nextMatch = nextHeadingPattern.exec(rest);
  const sectionEnd = nextMatch?.index === undefined ? normalizedBody.length : contentStart + nextMatch.index;
  const before = normalizedBody.slice(0, sectionStart).replace(/\s+$/u, "");
  const existingContent = normalizedBody.slice(contentStart, sectionEnd).trim();
  const after = normalizedBody.slice(sectionEnd).replace(/^\s+/u, "");
  const newContent =
    options.mode === "append" && existingContent.length > 0
      ? `${existingContent}\n\n${normalizedContent}`
      : normalizedContent;
  const replacement = [`${"#".repeat(options.level)} ${options.heading}`, "", newContent].join("\n");

  return [before, replacement, after].filter((part) => part.length > 0).join("\n\n") + "\n";
}

function resolvePagePath(wikiPath: string, page: string): string {
  if (path.isAbsolute(page)) {
    return page;
  }

  const normalizedPage = page.endsWith(".md") ? page : `${page}.md`;
  return path.resolve(wikiPath, normalizedPage);
}

async function listMarkdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(entryPath);
      }
    }
  }

  await visit(root);
  return files.sort();
}

function toPageSummary(wikiPath: string, pagePath: string, metadata: PageMetadata): PageSummary {
  return {
    path: path.relative(wikiPath, pagePath).replaceAll("\\", "/"),
    id: metadata.id,
    title: metadata.title,
    type: metadata.type,
    status: metadata.status,
    confidence: metadata.confidence,
    updated_at: metadata.updated_at,
  };
}

function countOccurrences(value: string, term: string): number {
  let count = 0;
  let index = value.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = value.indexOf(term, index + term.length);
  }
  return count;
}

function makeSnippet(body: string, terms: string[]): string {
  const normalized = body.replace(/\s+/gu, " ").trim();
  if (normalized.length <= 220) {
    return normalized;
  }

  const lower = normalized.toLowerCase();
  const firstTermIndex = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = firstTermIndex === undefined ? 0 : Math.max(0, firstTermIndex - 80);
  const end = Math.min(normalized.length, start + 220);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await writeFileAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeFileAtomic(filePath: string, contents: string): Promise<void> {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, filePath);
}

function makeStableId(prefix: string, value: string): string {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 12);
  return `${prefix}_${hash}`;
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
