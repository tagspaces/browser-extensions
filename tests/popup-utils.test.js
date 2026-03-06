import { describe, it, expect, beforeEach } from "vitest";
import { extractFileExtFromUrl, generateFileName } from "../src/ui/popup.js";

// ---------------------------------------------------------------------------
// extractFileExtFromUrl
//
// NOTE: The function uses a module-level <a> element (currentTabURLParser)
// to detect query strings. That element is only populated when init() runs
// on DOMContentLoaded (i.e. in the real extension). In tests, DOMContentLoaded
// is not dispatched, so the query-stripping branch is inactive. Tests here
// cover the common cases that do not depend on that module state.
// ---------------------------------------------------------------------------
describe("extractFileExtFromUrl", () => {
  it("returns the extension from a plain URL", () => {
    expect(extractFileExtFromUrl("https://example.com/report.pdf")).toBe("pdf");
  });

  it("returns the extension lowercased", () => {
    expect(extractFileExtFromUrl("https://example.com/photo.PNG")).toBe("png");
  });

  it("returns empty string for a URL with no file extension", () => {
    expect(extractFileExtFromUrl("https://example.com/page")).toBe("");
  });

  it("returns empty string for a URL ending with a trailing slash", () => {
    expect(extractFileExtFromUrl("https://example.com/dir/")).toBe("");
  });

  it("handles common media extensions", () => {
    const cases = [
      ["https://example.com/video.mp4", "mp4"],
      ["https://example.com/audio.mp3", "mp3"],
      ["https://example.com/image.webp", "webp"],
      ["https://example.com/doc.html", "html"],
    ];
    for (const [url, expected] of cases) {
      expect(extractFileExtFromUrl(url)).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// generateFileName
//
// The function reads title and tags from DOM elements, so we set those up
// in beforeEach.
// ---------------------------------------------------------------------------
describe("generateFileName", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="title" value="My Article" />
      <input id="tags"  value="" />
    `;
  });

  it("generates a simple filename with the given extension", () => {
    expect(generateFileName("html")).toBe("My Article.html");
  });

  it("includes comma-separated tags in brackets", () => {
    document.getElementById("tags").value = "tag1, tag2";
    expect(generateFileName("html")).toBe("My Article [tag1 tag2].html");
  });

  it("ignores tags shorter than 2 characters", () => {
    document.getElementById("tags").value = "a, valid, x";
    expect(generateFileName("html")).toBe("My Article [valid].html");
  });

  it("converts type=mht to the .mhtml extension", () => {
    expect(generateFileName("mht", "mht")).toBe("My Article.mhtml");
  });

  it("converts type=pdf to the .pdf extension", () => {
    expect(generateFileName("pdf", "pdf")).toBe("My Article.pdf");
  });

  it("strips an existing short extension from the title before adding the new one", () => {
    // Extensions of ≤3 chars (e.g. .jpg, .pdf) are stripped from the title
    document.getElementById("title").value = "My Report.pdf";
    expect(generateFileName("html")).toBe("My Report.html");
  });

  it("replaces characters that are invalid in filenames", () => {
    document.getElementById("title").value = 'Article: A/B?C*D|E"F<G>H';
    expect(generateFileName("html")).toBe("Article- A-B-C-D-E-F-G-H.html");
  });

  it("trims leading whitespace from the final filename", () => {
    // The function trims the assembled filename string; leading/trailing spaces in the
    // raw title that appear before the extension dot are not additionally stripped.
    document.getElementById("title").value = "  Padded Title";
    expect(generateFileName("html")).toBe("Padded Title.html");
  });

  it("adds screenshot tag and date when type is screenshot", () => {
    const result = generateFileName("png", "screenshot");
    // Should contain the 'screenshot' literal tag and a date-like string
    expect(result).toContain("[");
    expect(result).toContain("screenshot");
    expect(result).toMatch(/\d{8}/); // date as YYYYMMDD
    expect(result).toMatch(/\.png$/);
  });
});
