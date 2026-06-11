import type { PageMetadata, WikiPage } from "./types.js";

const delimiter = "---";
const requiredMetadataFields = [
  "id",
  "type",
  "title",
  "created_at",
  "updated_at",
  "sources",
  "confidence",
  "status",
  "links",
] as const;

export function parseMarkdownBody(markdown: string): { body: string; properties: Record<string, string> } {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0] !== delimiter) {
    return { body: normalized, properties: {} };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === delimiter);
  if (closingIndex === -1) {
    throw new Error("Markdown page has an opening frontmatter delimiter without a closing delimiter.");
  }

  const rawProperties = lines.slice(1, closingIndex);
  const body = lines.slice(closingIndex + 1).join("\n").replace(/^\n/, "");

  return {
    body,
    properties: parseSimpleYamlProperties(rawProperties),
  };
}

export function serializeMarkdownBody(page: WikiPage): string {
  validateMetadata(page.metadata);

  const properties = [
    `id: ${page.metadata.id}`,
    `type: ${page.metadata.type}`,
    `title: ${escapeYamlScalar(page.metadata.title)}`,
    `status: ${page.metadata.status}`,
    `confidence: ${page.metadata.confidence}`,
  ].join("\n");
  const body = page.body.endsWith("\n") ? page.body : `${page.body}\n`;

  return `${delimiter}\n${properties}\n${delimiter}\n\n${body}`;
}

export function validateMetadata(value: unknown): asserts value is PageMetadata {
  if (!isRecord(value)) {
    throw new Error("Page metadata must be a JSON object.");
  }

  for (const field of requiredMetadataFields) {
    if (!(field in value)) {
      throw new Error(`Page metadata is missing required field '${field}'.`);
    }
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Page metadata field 'id' must be a non-empty string.");
  }
  if (!["source", "entity", "synthesis", "correction"].includes(String(value.type))) {
    throw new Error("Page metadata field 'type' is invalid.");
  }
  if (typeof value.title !== "string" || value.title.length === 0) {
    throw new Error("Page metadata field 'title' must be a non-empty string.");
  }
  if (!Array.isArray(value.sources)) {
    throw new Error("Page metadata field 'sources' must be an array.");
  }
  if (!["high", "medium", "low", "unknown"].includes(String(value.confidence))) {
    throw new Error("Page metadata field 'confidence' is invalid.");
  }
  if (!["active", "draft", "stale", "disputed"].includes(String(value.status))) {
    throw new Error("Page metadata field 'status' is invalid.");
  }
  if (!Array.isArray(value.links)) {
    throw new Error("Page metadata field 'links' must be an array.");
  }
}

export function metadataPathForPage(pagePath: string): string {
  return pagePath.replace(/\.md$/i, ".meta.json");
}

function parseSimpleYamlProperties(lines: string[]): Record<string, string> {
  const properties: Record<string, string> = {};
  for (const line of lines) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }
    const key = match[1];
    if (key === undefined) {
      continue;
    }
    const value = match[2] ?? "";
    properties[key] = unquoteYamlScalar(value.trim());
  }
  return properties;
}

function escapeYamlScalar(value: string): string {
  if (/^[A-Za-z0-9 _.-]+$/.test(value)) {
    return value;
  }
  return JSON.stringify(value);
}

function unquoteYamlScalar(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value) as string;
    } catch {
      return value;
    }
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
