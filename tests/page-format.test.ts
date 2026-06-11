import { describe, expect, it } from "vitest";
import {
  parseMarkdownBody,
  serializeMarkdownBody,
  validateMetadata,
} from "../src/core/page-format.js";
import type { WikiPage } from "../src/core/types.js";

describe("page format", () => {
  it("round-trips an Obsidian-friendly markdown body", () => {
    const page: WikiPage = {
      metadata: {
        id: "page_synthesis_example",
        type: "synthesis",
        title: "Example",
        created_at: "2026-06-10T00:00:00Z",
        updated_at: "2026-06-10T00:00:00Z",
        sources: [],
        confidence: "unknown",
        status: "draft",
        links: [],
      },
      body: "# Example\n",
    };

    const markdown = serializeMarkdownBody(page);
    const parsed = parseMarkdownBody(markdown);

    expect(parsed.properties.id).toBe("page_synthesis_example");
    expect(parsed.properties.type).toBe("synthesis");
    expect(parsed.body).toBe("# Example\n");
  });

  it("rejects metadata without required fields", () => {
    expect(() => validateMetadata({ id: "page_bad" })).toThrow(/missing required field/i);
  });
});
