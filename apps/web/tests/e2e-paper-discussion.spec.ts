import { expect, test } from "@playwright/test";

test("reader can search a paper, inspect anchored discussions, filter author responses, and save paper", async ({
  page
}) => {
  await page.goto("/");

  await page.getByRole("searchbox", { name: "Search papers and discussions" }).fill("transformer");
  await page.getByRole("link", { name: /Attention Is All You Need/ }).click();

  await expect(page.getByRole("heading", { name: "Attention Is All You Need" })).toBeVisible();
  await page.getByRole("button", { name: "Add to collection" }).click();
  await expect(page.getByText("Sample UI data")).toBeVisible();
  await page.goto("/anchors/anchor-equation-scale");
  await expect(page.getByRole("heading", { name: "Equation 1 attention scaling" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Related discussions" })).toBeVisible();

  await page.goto("/papers/paper-transformer");

  await page.getByRole("button", { name: "Author responses" }).click();
  await expect(
    page.getByRole("link", { name: "Why does scaled dot-product attention divide by sqrt(dk)?" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Are the residual paths in Figure 1 applied before or after normalization?"
    })
  ).toBeHidden();

});
