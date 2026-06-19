import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("extension sidebar app", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("stores a submitted question and shows it in the discussion list", async () => {
    const storage: Record<string, unknown> = {};
    const set = vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(storage, items);
    });

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn()
      },
      storage: {
        local: {
          get: vi.fn(async (keys: string[]) => {
            return Object.fromEntries(keys.map((key) => [key, storage[key]]));
          }),
          set
        }
      }
    });

    document.body.innerHTML = '<div id="root"></div>';
    await import("../src/sidebar/main");

    fireEvent.change(await screen.findByLabelText("Question body"), {
      target: { value: "Does the selected evidence support this conclusion?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit question" }));

    expect(await screen.findByText("Does the selected evidence support this conclusion?")).toBeInTheDocument();
    expect(set).toHaveBeenCalledWith({
      "paperqa:discussions:detected-paper": expect.arrayContaining([
        expect.objectContaining({
          body: "Does the selected evidence support this conclusion?",
          kind: "question",
          paperId: "detected-paper",
          status: "open"
        })
      ])
    });
  });
});
