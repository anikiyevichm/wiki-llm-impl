#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  addSourceRef,
  appendSection,
  checkWorkspace,
  linkPage,
  listPages,
  readWikiPage,
  searchPages,
  seedProject,
} from "../core/index.js";

const defaultWikiPath = process.env.WIKI_LLM_PATH ?? "my-wiki";

const server = new McpServer({
  name: "wiki-llm-memory",
  version: "0.1.0",
});

server.registerTool(
  "wiki_check",
  {
    title: "Check Wiki",
    description: "Validate the local wiki workspace.",
    inputSchema: z.object({
      wikiPath: z.string().optional().describe("Path to the local wiki workspace."),
    }),
  },
  async ({ wikiPath }) => {
    const result = await checkWorkspace(wikiPath ?? defaultWikiPath);
    return textResult(JSON.stringify(result, null, 2));
  },
);

server.registerTool(
  "wiki_list_pages",
  {
    title: "List Wiki Pages",
    description: "List pages in the local wiki so an agent can choose where memory belongs.",
    inputSchema: z.object({
      wikiPath: z.string().optional().describe("Path to the local wiki workspace."),
    }),
  },
  async ({ wikiPath }) => {
    const pages = await listPages(wikiPath ?? defaultWikiPath);
    return textResult(JSON.stringify(pages, null, 2));
  },
);

server.registerTool(
  "wiki_read_page",
  {
    title: "Read Wiki Page",
    description: "Read a local wiki page body and metadata.",
    inputSchema: z.object({
      page: z.string().describe("Workspace-relative Markdown page path."),
      wikiPath: z.string().optional().describe("Path to the local wiki workspace."),
    }),
  },
  async ({ page, wikiPath }) => {
    const result = await readWikiPage(wikiPath ?? defaultWikiPath, page);
    return textResult(JSON.stringify(result, null, 2));
  },
);

server.registerTool(
  "wiki_search",
  {
    title: "Search Wiki",
    description: "Lexically search local wiki pages and return candidate pages with snippets.",
    inputSchema: z.object({
      query: z.string(),
      wikiPath: z.string().optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  },
  async ({ query, wikiPath, limit }) => {
    const results = await searchPages({
      wikiPath: wikiPath ?? defaultWikiPath,
      query,
      ...(limit === undefined ? {} : { limit }),
    });
    return textResult(JSON.stringify(results, null, 2));
  },
);

server.registerTool(
  "wiki_remember",
  {
    title: "Remember Context",
    description:
      "Write context into a named Markdown section of a local wiki page. Creates or replaces the section and updates page metadata.",
    inputSchema: z.object({
      page: z.string().describe("Workspace-relative Markdown page path, e.g. pages/project/gonka24.md."),
      heading: z.string().describe("Section heading to write."),
      content: z.string().describe("Markdown content to store."),
      wikiPath: z.string().optional().describe("Path to the local wiki workspace."),
      mode: z.enum(["replace", "append"]).optional().describe("Whether to replace or append to the section."),
      level: z.number().int().min(1).max(6).optional().describe("Markdown heading level. Defaults to 2."),
    }),
  },
  async ({ page, heading, content, wikiPath, mode, level }) => {
    const filePath = await appendSection({
      wikiPath: wikiPath ?? defaultWikiPath,
      page,
      heading,
      content,
      ...(mode === undefined ? {} : { mode }),
      ...(level === undefined ? {} : { level }),
    });
    return textResult(`Remembered '${heading}' in ${filePath}`);
  },
);

server.registerTool(
  "wiki_append_section",
  {
    title: "Append Section",
    description: "Append or replace a Markdown section in a local wiki page.",
    inputSchema: z.object({
      page: z.string(),
      heading: z.string(),
      content: z.string(),
      wikiPath: z.string().optional(),
      mode: z.enum(["replace", "append"]).optional(),
      level: z.number().int().min(1).max(6).optional(),
    }),
  },
  async ({ page, heading, content, wikiPath, mode, level }) => {
    const filePath = await appendSection({
      wikiPath: wikiPath ?? defaultWikiPath,
      page,
      heading,
      content,
      ...(mode === undefined ? {} : { mode }),
      ...(level === undefined ? {} : { level }),
    });
    return textResult(`Updated section '${heading}' in ${filePath}`);
  },
);

server.registerTool(
  "wiki_link_page",
  {
    title: "Link Page",
    description: "Add a machine link and optional Obsidian wiki link between two local wiki pages.",
    inputSchema: z.object({
      from: z.string(),
      to: z.string(),
      wikiPath: z.string().optional(),
      linkType: z.string().optional(),
      section: z.string().optional(),
      markdown: z.boolean().optional(),
      sectionLevel: z.number().int().min(1).max(6).optional(),
    }),
  },
  async ({ from, to, wikiPath, linkType, section, markdown, sectionLevel }) => {
    const filePath = await linkPage({
      wikiPath: wikiPath ?? defaultWikiPath,
      from,
      to,
      ...(linkType === undefined ? {} : { linkType }),
      ...(section === undefined ? {} : { section }),
      ...(markdown === undefined ? {} : { markdown }),
      ...(sectionLevel === undefined ? {} : { sectionLevel }),
    });
    return textResult(`Linked ${from} -> ${to} in ${filePath}`);
  },
);

server.registerTool(
  "wiki_add_source_ref",
  {
    title: "Add Source Ref",
    description: "Attach a source reference to a local wiki page without duplicating refs.",
    inputSchema: z.object({
      page: z.string(),
      sourceId: z.string(),
      wikiPath: z.string().optional(),
      spanId: z.string().optional(),
    }),
  },
  async ({ page, sourceId, wikiPath, spanId }) => {
    const filePath = await addSourceRef({
      wikiPath: wikiPath ?? defaultWikiPath,
      page,
      sourceId,
      ...(spanId === undefined ? {} : { spanId }),
    });
    return textResult(`Added source '${sourceId}' to ${filePath}`);
  },
);

server.registerTool(
  "wiki_seed_project",
  {
    title: "Seed Project",
    description: "Create or update a non-work project seed page and link it from owner/task pages.",
    inputSchema: z.object({
      title: z.string(),
      wikiPath: z.string().optional(),
      ownerPage: z.string().optional(),
      tasksPage: z.string().optional(),
      status: z.enum(["active", "draft", "stale", "disputed"]).optional(),
      confidence: z.enum(["high", "medium", "low", "unknown"]).optional(),
    }),
  },
  async ({ title, wikiPath, ownerPage, tasksPage, status, confidence }) => {
    const result = await seedProject({
      wikiPath: wikiPath ?? defaultWikiPath,
      title,
      ...(ownerPage === undefined ? {} : { ownerPage }),
      ...(tasksPage === undefined ? {} : { tasksPage }),
      ...(status === undefined ? {} : { status }),
      ...(confidence === undefined ? {} : { confidence }),
    });
    return textResult(`${result.created ? "Seeded" : "Updated"} project page ${result.pagePath}`);
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function textResult(text: string): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text }],
  };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
