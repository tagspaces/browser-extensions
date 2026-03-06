import { vi } from "vitest";

// Stub the chrome extension API before any module that references it loads.
// Popup.js and options-manager.js detect `chrome` at module evaluation time,
// so this must run via setupFiles (before test file imports).
vi.stubGlobal("chrome", {
  tabs: {
    query: vi.fn().mockResolvedValue([
      { id: 1, url: "https://example.com/page", title: "Example Page" },
    ]),
    captureVisibleTab: vi.fn(),
  },
  runtime: {
    id: "tagspaces-webclipper",
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  i18n: { getMessage: vi.fn().mockReturnValue("") },
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({
        enableScreenshotEmbedding: false,
        enableOpenLocationCode: false,
        enableAutomaticScreenshotTagging: false,
      }),
      set: vi.fn(),
    },
    onChanged: { addListener: vi.fn() },
  },
  downloads: { download: vi.fn() },
  pageCapture: { saveAsMHTML: vi.fn() },
  scripting: { executeScript: vi.fn() },
});

// Stub globals injected by vendor scripts in the built HTML
vi.stubGlobal("saveAs", vi.fn());
vi.stubGlobal("OpenLocationCode", {
  encode: vi.fn().mockReturnValue("8FWH4HXP+"),
});
