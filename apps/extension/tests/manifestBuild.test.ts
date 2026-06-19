import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const distDir = join(process.cwd(), "dist");

describe("Chrome extension build output", () => {
  it("emits a Manifest V3 package Chrome can load as an unpacked extension", () => {
    const manifestPath = join(distDir, "manifest.json");

    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(manifest).toMatchObject({
      manifest_version: 3,
      name: "Research Paper Q&A",
      side_panel: {
        default_path: "src/sidebar/index.html"
      },
      background: {
        service_worker: "assets/background.js",
        type: "module"
      }
    });
    expect(manifest.permissions).toEqual(
      expect.arrayContaining(["activeTab", "scripting", "sidePanel", "storage"])
    );
    expect(manifest.content_scripts[0].js).toEqual(["assets/content.js"]);
    expect(existsSync(join(distDir, "src/sidebar/index.html"))).toBe(true);
    expect(existsSync(join(distDir, "assets/background.js"))).toBe(true);
    expect(existsSync(join(distDir, "assets/content.js"))).toBe(true);
    expect(readFileSync(join(distDir, "assets/content.js"), "utf8")).not.toMatch(/^import/m);
  });
});
