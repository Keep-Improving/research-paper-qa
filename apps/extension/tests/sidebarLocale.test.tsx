import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LanguageToggle } from "../src/sidebar/LanguageToggle";
import { SidebarLocaleProvider, useSidebarLocale } from "../src/sidebar/sidebarLocale";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function LocaleProbe() {
  const { t } = useSidebarLocale();
  return <h1>{t("sidebar.title")}</h1>;
}

describe("extension sidebar locale", () => {
  it("switches between English and Chinese and persists the choice", async () => {
    const set = vi.fn(async () => undefined);
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async () => ({ "paperqa:locale": "en-US" })),
          set
        }
      }
    });

    render(
      <SidebarLocaleProvider>
        <LanguageToggle />
        <LocaleProbe />
      </SidebarLocaleProvider>
    );

    expect(await screen.findByRole("heading", { name: "Research Paper Q&A" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "中文" }));

    expect(screen.getByRole("heading", { name: "科研文献问答" })).toBeInTheDocument();
    await waitFor(() => expect(set).toHaveBeenCalledWith({ "paperqa:locale": "zh-CN" }));
  });
});
