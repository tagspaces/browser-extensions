import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatDateTime,
  getHighestResUrl,
  extractLatLong,
  getBase64ImagePromise,
} from "../src/lib/utils.js";

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------
describe("formatDateTime", () => {
  it("formats date only by default", () => {
    const d = new Date(2024, 5, 15); // June 15 2024
    expect(formatDateTime(d)).toBe("2024-06-15");
  });

  it("pads single-digit month and day with zeros", () => {
    const d = new Date(2024, 0, 5); // Jan 5
    expect(formatDateTime(d)).toBe("2024-01-05");
  });

  it("formats date with time when withTime is true", () => {
    const d = new Date(2024, 5, 15, 9, 7, 3);
    expect(formatDateTime(d, { withTime: true })).toBe("2024-06-15T09:07:03");
  });

  it("respects a custom splitter between date and time", () => {
    const d = new Date(2024, 5, 15, 9, 7, 3);
    expect(formatDateTime(d, { withTime: true, splitter: "_" })).toBe(
      "2024-06-15_09:07:03",
    );
  });

  it("respects custom dateDelimiter and timeDelimiter", () => {
    const d = new Date(2024, 5, 15, 9, 7, 3);
    expect(
      formatDateTime(d, {
        withTime: true,
        dateDelimiter: "",
        timeDelimiter: "",
        splitter: "-",
      }),
    ).toBe("20240615-090703");
  });

  it("accepts a date string as input", () => {
    expect(formatDateTime("2024-06-15")).toBe("2024-06-15");
  });

  it("defaults to today when called with no arguments", () => {
    const result = formatDateTime();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// getHighestResUrl
// ---------------------------------------------------------------------------
describe("getHighestResUrl", () => {
  const baseUrl = "https://example.com/page/";

  function makeImg(src, srcset) {
    const el = document.createElement("img");
    if (src) el.setAttribute("src", src);
    if (srcset) el.setAttribute("srcset", srcset);
    return el;
  }

  it("returns the src when there is no srcset", () => {
    const el = makeImg("image.png");
    expect(getHighestResUrl(el, baseUrl)).toBe(
      "https://example.com/page/image.png",
    );
  });

  it("resolves an absolute src URL unchanged", () => {
    const el = makeImg("https://cdn.example.com/photo.jpg");
    expect(getHighestResUrl(el, baseUrl)).toBe(
      "https://cdn.example.com/photo.jpg",
    );
  });

  it("picks the highest width descriptor from srcset", () => {
    const el = makeImg(
      "small.jpg",
      "small.jpg 400w, medium.jpg 800w, large.jpg 1200w",
    );
    expect(getHighestResUrl(el, baseUrl)).toBe(
      "https://example.com/page/large.jpg",
    );
  });

  it("picks the highest density descriptor from srcset", () => {
    const el = makeImg(
      "img.jpg",
      "img.jpg 1x, img@2x.jpg 2x, img@3x.jpg 3x",
    );
    expect(getHighestResUrl(el, baseUrl)).toBe(
      "https://example.com/page/img@3x.jpg",
    );
  });

  it("prefers a w-descriptor candidate over an x-descriptor candidate", () => {
    const el = makeImg("img.jpg", "img.jpg 1x, img-large.jpg 800w");
    expect(getHighestResUrl(el, baseUrl)).toBe(
      "https://example.com/page/img-large.jpg",
    );
  });

  it("returns null when neither src nor srcset is present", () => {
    const el = document.createElement("img");
    expect(getHighestResUrl(el, baseUrl)).toBeNull();
  });

  it("returns null when src is an absolute URL with an invalid format", () => {
    // new URL() throws for absolute URLs with malformed syntax (e.g. unclosed IPv6)
    const el = makeImg("http://[invalid");
    expect(getHighestResUrl(el, baseUrl)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getBase64ImagePromise
// ---------------------------------------------------------------------------
describe("getBase64ImagePromise", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a data URL on a successful fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(["fake"], { type: "image/png" })),
      }),
    );
    const mockResult = "data:image/png;base64,ZmFrZQ==";
    function MockReader() {
      this.onloadend = null;
      this.result = null;
      this.readAsDataURL = function () {
        this.result = mockResult;
        this.onloadend();
      };
    }
    vi.stubGlobal("FileReader", MockReader);

    const result = await getBase64ImagePromise("https://example.com/img.png");
    expect(result).toBe(mockResult);
  });

  it("returns null when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );
    const result = await getBase64ImagePromise("https://example.com/bad.png");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractLatLong
// ---------------------------------------------------------------------------
describe("extractLatLong", () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="tags" value="" />';
    // Reset the mock so each test starts clean
    OpenLocationCode.encode.mockReturnValue("8FWH4HXP+");
  });

  it("extracts coordinates from a Google Maps URL and writes a geo tag", () => {
    extractLatLong("https://www.google.com/maps/@48.1401285,11.5732137,15z");
    expect(document.getElementById("tags").value.trim()).toBe("8FWH4HXP+");
  });

  it("extracts coordinates from an OpenStreetMap URL", () => {
    extractLatLong(
      "https://www.openstreetmap.org/#map=17/48.13504/11.59057",
    );
    expect(document.getElementById("tags").value.trim()).toBe("8FWH4HXP+");
  });

  it("extracts coordinates from a Here Maps URL", () => {
    extractLatLong("https://wego.here.com/?map=-20.80625,-49.37421,16,normal");
    expect(document.getElementById("tags").value.trim()).toBe("8FWH4HXP+");
  });

  it("does not modify the tags field for a non-map URL", () => {
    extractLatLong("https://example.com/some-article");
    expect(document.getElementById("tags").value).toBe("");
  });

  it("does not throw when passed null", () => {
    expect(() => extractLatLong(null)).not.toThrow();
  });

  it("does not throw when passed an empty string", () => {
    expect(() => extractLatLong("")).not.toThrow();
  });

  it("appends the geo tag to any existing tag content", () => {
    document.getElementById("tags").value = "existingtag";
    extractLatLong("https://www.google.com/maps/@48.14,11.57,15z");
    expect(document.getElementById("tags").value).toContain("existingtag");
    expect(document.getElementById("tags").value).toContain("8FWH4HXP+");
  });
});
