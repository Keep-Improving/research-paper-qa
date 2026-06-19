import { expect, test } from "@playwright/test";

test("search page finds papers, questions, author responses, and anchors", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search papers and discussions" })).toBeVisible();
  await expect(page.getByText("Sample UI data")).toBeVisible();

  await page.getByRole("searchbox", { name: "Search papers and discussions" }).fill("transformer");

  await expect(page.getByRole("link", { name: /Attention Is All You Need/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Why does scaled dot-product attention divide/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Author responses" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Equation 1 attention scaling/ })).toBeVisible();
});

test("paper detail page shows metadata, filters, discussions, anchors, and priority sections", async ({
  page
}) => {
  await page.goto("/papers/paper-transformer");

  await expect(page.getByRole("heading", { name: "Attention Is All You Need" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to collection" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Discussion filters" })).toBeVisible();

  await page.getByRole("button", { name: "Author responses" }).click();
  await expect(page.getByText("Verified author response")).toBeVisible();
  await expect(page.getByText("Anchor groups")).toBeVisible();
  await expect(page.getByText("Text anchors")).toBeVisible();
  await expect(page.getByText("Figure anchors")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Author responses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hot discussions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unanswered questions" })).toBeVisible();
});

test("discussion detail page displays question detail, anchor, answers, comments, and author response area", async ({
  page
}) => {
  await page.goto("/discussions/discussion-attention-scale");

  await expect(
    page.getByRole("heading", { name: "Why does scaled dot-product attention divide by sqrt(dk)?" })
  ).toBeVisible();
  await expect(page.getByText("Equation 1 attention scaling")).toBeVisible();
  await expect(page.getByText(/softmax gradients in a usable range/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Related answers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Author response area" })).toBeVisible();
});

test("anchor detail page displays quote, image, position info, and related discussions", async ({ page }) => {
  await page.goto("/anchors/anchor-figure-caption");

  await expect(page.getByRole("heading", { name: "Figure 1 model architecture" })).toBeVisible();
  await expect(page.getByText("Anchor type: Figure")).toBeVisible();
  await expect(page.getByText("Page 3")).toBeVisible();
  await expect(page.getByRole("img", { name: "Transformer architecture diagram anchor" })).toBeVisible();
  await expect(page.getByText(/The Transformer follows this overall architecture/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Related discussions" })).toBeVisible();
});

test("empty and error states render", async ({ page }) => {
  await page.goto("/?q=zzzz-no-results");

  await expect(page.getByText("No records match this search")).toBeVisible();
  await expect(page.getByText(/Records appear after papers are collected or detected/)).toBeVisible();

  await page.goto("/papers/missing-paper");

  await expect(page.getByRole("heading", { name: "Paper not found" })).toBeVisible();
  await expect(page.getByText("We could not find sample UI data for this paper.")).toBeVisible();
});
