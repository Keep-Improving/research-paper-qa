import { expect, test } from "@playwright/test";

test("collections page shows saved papers, discussions, anchors, and archived state", async ({
  page
}) => {
  await page.goto("/collections");

  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();
  await expect(page.getByText("Saved papers")).toBeVisible();
  await expect(page.getByRole("link", { name: "Attention Is All You Need" })).toBeVisible();
  await expect(page.getByText("Saved discussions")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Why does scaled dot-product attention divide by sqrt(dk)?" })
  ).toBeVisible();
  await expect(page.getByText("Saved anchors")).toBeVisible();
  await expect(page.getByRole("link", { name: "Equation 1 attention scaling" })).toBeVisible();
  await expect(page.getByText("Archived", { exact: true })).toBeVisible();
});

test("moderation page shows queue, risk labels, and non-destructive actions", async ({ page }) => {
  await page.goto("/moderation");

  await expect(page.getByRole("heading", { name: "Moderation queue" })).toBeVisible();
  await expect(page.getByText("needs_factual_review")).toBeVisible();
  await expect(page.getByText("possible_duplicate")).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark disputed" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Link duplicate" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Delete/i })).toHaveCount(0);
});
