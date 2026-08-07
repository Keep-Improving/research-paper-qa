import { expect, test } from "@playwright/test";

test("author claim page supports role selection, evidence submission, and claim state display", async ({
  page
}) => {
  await page.goto("/author/claims");

  await expect(page.getByRole("heading", { name: "Author certification" })).toBeVisible();
  await page.getByLabel("Paper", { exact: true }).selectOption("paper-transformer");
  await page.getByLabel("Paper role", { exact: true }).selectOption("corresponding_author");
  await page.getByLabel("Evidence type", { exact: true }).selectOption("institutional_email");
  await page.getByLabel("Evidence detail", { exact: true }).fill("vaswani@example.edu");
  await page.getByRole("button", { name: "Submit claim" }).click();

  const submittedClaim = page.getByText("Claim submitted for review").locator("..");
  await expect(submittedClaim).toBeVisible();
  await expect(submittedClaim.getByText("Corresponding author")).toBeVisible();
  await expect(submittedClaim.getByText("Pending review")).toBeVisible();
  await expect(submittedClaim.getByText("vaswani@example.edu")).toBeVisible();
});

test("author workbench shows permitted author response action and high-heat unanswered questions", async ({
  page
}) => {
  await page.goto("/author/workbench");

  await expect(page.getByRole("heading", { name: "Author workbench" })).toBeVisible();
  await expect(page.getByText("Author response permission: Approved")).toBeVisible();
  await expect(page.getByRole("button", { name: "Author response" })).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Are the residual paths in Figure 1 applied before or after normalization?"
    })
  ).toBeVisible();
  await expect(page.getByText("Heat 104")).toBeVisible();
  await expect(page.getByText("Figure 1 model architecture")).toBeVisible();
});

test("author workbench hides author response action without first or corresponding approval", async ({
  page
}) => {
  await page.goto("/author/workbench?claim=co_author");

  await expect(page.getByText("Author response permission: Not eligible")).toBeVisible();
  await expect(page.getByRole("button", { name: "Author response" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Ask as reader" })).toBeVisible();
});
