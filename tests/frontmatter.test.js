import { describe, it, expect } from "vitest";
import { escapeYamlString, injectFrontMatter } from "../src/ui/popup.js";

// ---------------------------------------------------------------------------
// escapeYamlString
// ---------------------------------------------------------------------------
describe("escapeYamlString", () => {
  it("returns a plain string unchanged", () => {
    expect(escapeYamlString("hello world")).toBe("hello world");
  });

  it("escapes double quotes", () => {
    expect(escapeYamlString('say "hello"')).toBe('say \\"hello\\"');
  });

  it("escapes backslashes", () => {
    expect(escapeYamlString("path\\to\\file")).toBe("path\\\\to\\\\file");
  });

  it("escapes newlines", () => {
    expect(escapeYamlString("line1\nline2")).toBe("line1\\nline2");
  });

  it("escapes all special characters together", () => {
    expect(escapeYamlString('"a\\b\nc"')).toBe('\\"a\\\\b\\nc\\"');
  });
});

// ---------------------------------------------------------------------------
// injectFrontMatter — new front matter
// ---------------------------------------------------------------------------
describe("injectFrontMatter — create new", () => {
  it("adds front matter with url and date", () => {
    const result = injectFrontMatter("# Hello", {
      url: "https://example.com",
      date: "2026-04-07T12:00:00.000Z",
    });
    expect(result).toContain("---\n");
    expect(result).toContain('url: "https://example.com"');
    expect(result).toContain('date: "2026-04-07T12:00:00.000Z"');
    expect(result).toContain("---\n\n# Hello");
  });

  it("adds tags as a YAML list", () => {
    const result = injectFrontMatter("content", {
      tags: "pkm, ai, workflow",
    });
    expect(result).toContain("tags:\n");
    expect(result).toContain('  - "pkm"');
    expect(result).toContain('  - "ai"');
    expect(result).toContain('  - "workflow"');
  });

  it("escapes special characters in url", () => {
    const result = injectFrontMatter("content", {
      url: 'https://example.com/?q="test"',
    });
    expect(result).toContain('url: "https://example.com/?q=\\"test\\""');
  });

  it("escapes special characters in tag values", () => {
    const result = injectFrontMatter("content", {
      tags: 'tag"with"quotes',
    });
    expect(result).toContain('  - "tag\\"with\\"quotes"');
  });
});

// ---------------------------------------------------------------------------
// injectFrontMatter — existing front matter
// ---------------------------------------------------------------------------
describe("injectFrontMatter — update existing", () => {
  it("appends new keys to existing front matter", () => {
    const existing = '---\ntitle: "My Post"\n---\n\n# Hello';
    const result = injectFrontMatter(existing, {
      url: "https://example.com",
    });
    expect(result).toContain('title: "My Post"');
    expect(result).toContain('url: "https://example.com"');
  });

  it("does not duplicate existing keys", () => {
    const existing = '---\nurl: "https://old.com"\n---\n\ncontent';
    const result = injectFrontMatter(existing, {
      url: "https://new.com",
    });
    // Should keep the old one, not add a duplicate
    expect(result).toContain('url: "https://old.com"');
    expect(result).not.toContain('url: "https://new.com"');
  });

  it("adds tags list to existing front matter", () => {
    const existing = '---\ntitle: "Post"\n---\n\ncontent';
    const result = injectFrontMatter(existing, {
      tags: "tag1, tag2",
    });
    expect(result).toContain("tags:\n");
    expect(result).toContain('  - "tag1"');
    expect(result).toContain('  - "tag2"');
  });
});
