#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
  addSourceRef,
  appendSection,
  createPage,
  checkWorkspace,
  initWorkspace,
  linkPage,
  listPages,
  readWikiPage,
  rebuildWikiIndex,
  searchPages,
  seedProject,
} from "../core/index.js";
import type {
  AddSourceRefOptions,
  AppendSectionOptions,
  Confidence,
  NewPageOptions,
  PageStatus,
  PageType,
  SectionWriteMode,
  LinkPageOptions,
  SeedProjectOptions,
} from "../core/index.js";

async function main(argv: string[]): Promise<void> {
  const [command, ...args] = argv;
  const flags = parseFlags(args);

  switch (command) {
    case "init": {
      const wikiPath = flags.path ?? "my-wiki";
      const title = flags.title ?? "Local LLM Wiki";
      const config = await initWorkspace({ wikiPath, title });
      console.log(`Initialized ${config.title} at ${wikiPath}`);
      return;
    }

    case "check": {
      const wikiPath = flags.path ?? "my-wiki";
      const result = await checkWorkspace(wikiPath);
      if (!result.ok) {
        for (const error of result.errors) {
          console.error(error);
        }
        process.exitCode = 1;
        return;
      }
      console.log(`Wiki validation passed: ${result.pageCount} page(s).`);
      return;
    }

    case "list-pages": {
      const pages = await listPages(flags.path ?? "my-wiki");
      console.log(JSON.stringify(pages, null, 2));
      return;
    }

    case "read-page": {
      const page = flags.page;
      if (!page) {
        throw new Error("Missing required flag: --page");
      }
      const result = await readWikiPage(flags.path ?? "my-wiki", page);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    case "search": {
      const query = flags.query;
      if (!query) {
        throw new Error("Missing required flag: --query");
      }
      const limit = parsePositiveInt(flags.limit);
      const results = await searchPages({
        wikiPath: flags.path ?? "my-wiki",
        query,
        ...(limit === undefined ? {} : { limit }),
      });
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    case "rebuild-index": {
      const indexPath = await rebuildWikiIndex(flags.path ?? "my-wiki");
      console.log(`Rebuilt index at ${indexPath}`);
      return;
    }

    case "new-page": {
      const title = flags.title;
      if (!title) {
        throw new Error("Missing required flag: --title");
      }
      const wikiPath = flags.path ?? "my-wiki";
      const pageOptions: NewPageOptions = {
        wikiPath,
        title,
      };
      const type = parsePageType(flags.type);
      const status = parsePageStatus(flags.status);
      const confidence = parseConfidence(flags.confidence);

      if (type !== undefined) {
        pageOptions.type = type;
      }
      if (flags.folder !== undefined) {
        pageOptions.folder = flags.folder;
      }
      if (status !== undefined) {
        pageOptions.status = status;
      }
      if (confidence !== undefined) {
        pageOptions.confidence = confidence;
      }

      const filePath = await createPage(pageOptions);
      console.log(`Created page ${filePath}`);
      return;
    }

    case "append-section": {
      const page = flags.page;
      const heading = flags.heading;
      if (!page) {
        throw new Error("Missing required flag: --page");
      }
      if (!heading) {
        throw new Error("Missing required flag: --heading");
      }

      const content = await readContent(flags);
      const sectionOptions: AppendSectionOptions = {
        wikiPath: flags.path ?? "my-wiki",
        page,
        heading,
        content,
      };
      const level = parseLevel(flags.level);
      const mode = parseSectionWriteMode(flags.mode);

      if (level !== undefined) {
        sectionOptions.level = level;
      }
      if (mode !== undefined) {
        sectionOptions.mode = mode;
      }

      const filePath = await appendSection(sectionOptions);
      console.log(`Updated section '${heading}' in ${filePath}`);
      return;
    }

    case "link-page": {
      const from = flags.from;
      const to = flags.to;
      if (!from) {
        throw new Error("Missing required flag: --from");
      }
      if (!to) {
        throw new Error("Missing required flag: --to");
      }

      const linkOptions: LinkPageOptions = {
        wikiPath: flags.path ?? "my-wiki",
        from,
        to,
      };
      const sectionLevel = parseLevel(flags.level);
      if (flags.type !== undefined) {
        linkOptions.linkType = flags.type;
      }
      if (flags.section !== undefined) {
        linkOptions.section = flags.section;
      }
      if (sectionLevel !== undefined) {
        linkOptions.sectionLevel = sectionLevel;
      }
      if (flags["no-markdown"] !== undefined) {
        linkOptions.markdown = false;
      }

      const filePath = await linkPage(linkOptions);
      console.log(`Linked ${from} -> ${to} in ${filePath}`);
      return;
    }

    case "add-source-ref": {
      const page = flags.page;
      const sourceId = flags["source-id"];
      if (!page) {
        throw new Error("Missing required flag: --page");
      }
      if (!sourceId) {
        throw new Error("Missing required flag: --source-id");
      }

      const sourceOptions: AddSourceRefOptions = {
        wikiPath: flags.path ?? "my-wiki",
        page,
        sourceId,
      };
      if (flags["span-id"] !== undefined) {
        sourceOptions.spanId = flags["span-id"];
      }

      const filePath = await addSourceRef(sourceOptions);
      console.log(`Added source '${sourceId}' to ${filePath}`);
      return;
    }

    case "seed-project": {
      const title = flags.title;
      if (!title) {
        throw new Error("Missing required flag: --title");
      }
      const seedOptions: SeedProjectOptions = {
        wikiPath: flags.path ?? "my-wiki",
        title,
        ownerPage: flags["owner-page"] ?? "pages/person/mikita.md",
        tasksPage: flags["tasks-page"] ?? "pages/tasks/current-tasks.md",
      };
      const status = parsePageStatus(flags.status);
      const confidence = parseConfidence(flags.confidence);
      if (status !== undefined) {
        seedOptions.status = status;
      }
      if (confidence !== undefined) {
        seedOptions.confidence = confidence;
      }

      const result = await seedProject(seedOptions);
      const action = result.created ? "Seeded" : "Updated";
      console.log(`${action} project page ${result.pagePath}`);
      return;
    }

    default:
      printHelp();
      if (command) {
        process.exitCode = 1;
      }
  }
}

function parseFlags(args: string[]): Record<string, string | undefined> {
  const flags: Record<string, string | undefined> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg?.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = "true";
      continue;
    }
    flags[key] = next;
    index += 1;
  }
  return flags;
}

function parsePageType(value: string | undefined): PageType | undefined {
  return parseEnum(value, ["source", "entity", "synthesis", "correction"], "type");
}

function parsePageStatus(value: string | undefined): PageStatus | undefined {
  return parseEnum(value, ["active", "draft", "stale", "disputed"], "status");
}

function parseConfidence(value: string | undefined): Confidence | undefined {
  return parseEnum(value, ["high", "medium", "low", "unknown"], "confidence");
}

function parseSectionWriteMode(value: string | undefined): SectionWriteMode | undefined {
  return parseEnum(value, ["replace", "append"], "mode");
}

function parseLevel(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const level = Number.parseInt(value, 10);
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new Error(`Invalid level: ${value}`);
  }
  return level;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid positive integer: ${value}`);
  }
  return parsed;
}

async function readContent(flags: Record<string, string | undefined>): Promise<string> {
  if (flags.content !== undefined && flags["content-file"] !== undefined) {
    throw new Error("Use either --content or --content-file, not both.");
  }
  if (flags["content-file"] !== undefined) {
    return readFile(flags["content-file"], "utf8");
  }
  if (flags.content !== undefined) {
    return flags.content;
  }
  throw new Error("Missing required flag: --content or --content-file");
}

function parseEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  label: string,
): T | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (allowed.includes(value as T)) {
    return value as T;
  }
  throw new Error(`Invalid ${label}: ${value}`);
}

function printHelp(): void {
  console.log(`wiki-llm

Commands:
  init --path <wikiPath> --title <title>
  check --path <wikiPath>
  list-pages --path <wikiPath>
  read-page --path <wikiPath> --page <page.md>
  search --path <wikiPath> --query <query> [--limit 10]
  rebuild-index --path <wikiPath>
  new-page --path <wikiPath> --title <title> [--type synthesis] [--folder pages/synthesis]
  append-section --path <wikiPath> --page <pages/.../page.md> --heading <heading> --content <markdown>
  append-section --path <wikiPath> --page <pages/.../page.md> --heading <heading> --content-file <file> [--mode replace|append] [--level 2]
  link-page --path <wikiPath> --from <page.md> --to <page.md> [--section Links] [--type related] [--no-markdown]
  add-source-ref --path <wikiPath> --page <page.md> --source-id <source_id> [--span-id <span_id>]
  seed-project --path <wikiPath> --title <title> [--owner-page pages/person/mikita.md] [--tasks-page pages/tasks/current-tasks.md]
`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
