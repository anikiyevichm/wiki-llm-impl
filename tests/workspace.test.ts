import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addSourceRef,
  appendSection,
  checkWorkspace,
  createPage,
  initWorkspace,
  linkPage,
  listPages,
  readWikiPage,
  searchPages,
  seedProject,
} from "../src/core/workspace.js";

describe("workspace", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), "wiki-llm-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("initializes and validates a workspace", async () => {
    await initWorkspace({ wikiPath: tempRoot, title: "Test Wiki" });
    await createPage({ wikiPath: tempRoot, title: "First Page" });

    const result = await checkWorkspace(tempRoot);

    expect(result.ok).toBe(true);
    expect(result.pageCount).toBe(1);
  });

  it("creates a page with Obsidian properties and sidecar metadata", async () => {
    await initWorkspace({ wikiPath: tempRoot });
    const pagePath = await createPage({
      wikiPath: tempRoot,
      title: "Storage Core",
      type: "entity",
      folder: "pages/project",
      status: "active",
      confidence: "medium",
    });

    const content = await readFile(pagePath, "utf8");
    const metadata = await readFile(pagePath.replace(/\.md$/, ".meta.json"), "utf8");

    expect(content).toContain("type: entity");
    expect(content).toContain("# Storage Core");
    expect(metadata).toContain('"type": "entity"');
    expect(metadata).toContain('"sources": []');
  });

  it("adds and replaces a markdown section", async () => {
    await initWorkspace({ wikiPath: tempRoot });
    const pagePath = await createPage({ wikiPath: tempRoot, title: "Working Style" });

    await appendSection({
      wikiPath: tempRoot,
      page: "pages/synthesis/working-style.md",
      heading: "Automation",
      content: "- First version",
    });
    await appendSection({
      wikiPath: tempRoot,
      page: "pages/synthesis/working-style.md",
      heading: "Automation",
      content: "- Replaced version",
    });

    const content = await readFile(pagePath, "utf8");
    expect(content).toContain("## Automation");
    expect(content).toContain("- Replaced version");
    expect(content).not.toContain("- First version");
  });

  it("appends to an existing markdown section and touches metadata", async () => {
    await initWorkspace({ wikiPath: tempRoot });
    const pagePath = await createPage({ wikiPath: tempRoot, title: "Dogfood" });
    const metadataPath = pagePath.replace(/\.md$/, ".meta.json");
    const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as { updated_at: string };
    metadata.updated_at = "2000-01-01T00:00:00Z";
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

    await appendSection({
      wikiPath: tempRoot,
      page: "pages/synthesis/dogfood.md",
      heading: "Notes",
      content: "- Added by append-section",
      mode: "append",
    });

    const content = await readFile(pagePath, "utf8");
    const afterMetadata = JSON.parse(await readFile(metadataPath, "utf8")) as { updated_at: string };

    expect(content).toContain("- TODO");
    expect(content).toContain("- Added by append-section");
    expect(afterMetadata.updated_at).not.toBe("2000-01-01T00:00:00Z");
  });

  it("links pages in metadata and markdown without duplicates", async () => {
    await initWorkspace({ wikiPath: tempRoot });
    const fromPath = await createPage({ wikiPath: tempRoot, title: "Mikita", type: "entity" });
    await createPage({ wikiPath: tempRoot, title: "Working Style", type: "synthesis" });

    await linkPage({
      wikiPath: tempRoot,
      from: "pages/entity/mikita.md",
      to: "pages/synthesis/working-style.md",
      section: "Known Links",
      linkType: "related",
    });
    await linkPage({
      wikiPath: tempRoot,
      from: "pages/entity/mikita.md",
      to: "pages/synthesis/working-style.md",
      section: "Known Links",
      linkType: "related",
    });

    const content = await readFile(fromPath, "utf8");
    const metadata = JSON.parse(await readFile(fromPath.replace(/\.md$/, ".meta.json"), "utf8")) as {
      links: Array<{ page_id: string; type?: string }>;
    };

    expect(content.match(/\[\[Working Style\]\]/g)).toHaveLength(1);
    expect(metadata.links).toEqual([{ page_id: "page_synthesis_working_style", type: "related" }]);
  });

  it("seeds a non-work project page and links it from owner and tasks pages", async () => {
    await initWorkspace({ wikiPath: tempRoot });
    const ownerPath = await createPage({
      wikiPath: tempRoot,
      title: "Mikita",
      type: "entity",
      folder: "pages/person",
    });
    const tasksPath = await createPage({
      wikiPath: tempRoot,
      title: "Current Tasks",
      type: "synthesis",
      folder: "pages/tasks",
    });

    const first = await seedProject({
      wikiPath: tempRoot,
      title: "Gonka24",
      ownerPage: "pages/person/mikita.md",
      tasksPage: "pages/tasks/current-tasks.md",
    });
    const second = await seedProject({
      wikiPath: tempRoot,
      title: "Gonka24",
      ownerPage: "pages/person/mikita.md",
      tasksPage: "pages/tasks/current-tasks.md",
    });

    const projectContent = await readFile(first.pagePath, "utf8");
    const ownerContent = await readFile(ownerPath, "utf8");
    const tasksContent = await readFile(tasksPath, "utf8");
    const ownerMetadata = JSON.parse(await readFile(ownerPath.replace(/\.md$/, ".meta.json"), "utf8")) as {
      links: Array<{ page_id: string; type?: string }>;
    };

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(projectContent).toContain("## Known");
    expect(projectContent).toContain("## Unknowns");
    expect(ownerContent.match(/\[\[Gonka24\]\]/g)).toHaveLength(1);
    expect(tasksContent.match(/\[\[Gonka24\]\]/g)).toHaveLength(1);
    expect(ownerMetadata.links).toContainEqual({ page_id: "page_entity_gonka24", type: "owns" });
  });

  it("adds source refs without duplicates", async () => {
    await initWorkspace({ wikiPath: tempRoot });
    const pagePath = await createPage({ wikiPath: tempRoot, title: "Research Page" });

    await addSourceRef({
      wikiPath: tempRoot,
      page: "pages/synthesis/research-page.md",
      sourceId: "source_gonka_ai_research_2026_06_11",
    });
    await addSourceRef({
      wikiPath: tempRoot,
      page: "pages/synthesis/research-page.md",
      sourceId: "source_gonka_ai_research_2026_06_11",
    });

    const metadata = JSON.parse(await readFile(pagePath.replace(/\.md$/, ".meta.json"), "utf8")) as {
      sources: Array<{ source_id: string }>;
    };

    expect(metadata.sources).toEqual([{ source_id: "source_gonka_ai_research_2026_06_11" }]);
  });

  it("lists, reads, and searches wiki pages", async () => {
    await initWorkspace({ wikiPath: tempRoot });
    await createPage({ wikiPath: tempRoot, title: "Gonka24", type: "entity", folder: "pages/project" });
    await appendSection({
      wikiPath: tempRoot,
      page: "pages/project/gonka24.md",
      heading: "Business Thesis",
      content: "Sell inference at a discount to OpenRouter-equivalent pricing.",
    });

    const pages = await listPages(tempRoot);
    const page = await readWikiPage(tempRoot, "pages/project/gonka24.md");
    const results = await searchPages({ wikiPath: tempRoot, query: "OpenRouter inference" });

    expect(pages).toHaveLength(1);
    expect(pages[0]?.path).toBe("pages/project/gonka24.md");
    expect(page.body).toContain("Business Thesis");
    expect(results[0]?.title).toBe("Gonka24");
    expect(results[0]?.snippet).toContain("OpenRouter");
  });
});
