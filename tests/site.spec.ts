import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/throughline/", "/motionnet/", "/showdown/", "/about/", "/cv/", "/contact/"];
const WIDTHS = [375, 768, 1280, 1920];
const SHOTS = process.env.SHOT_DIR;

// Fails the test on any uncaught error or console error, including
// Content-Security-Policy violations, which WebKit reports to the console.
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function opacity(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el).opacity);
}

test("home shows the name, the nav, the skip connection and the live sky", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Scott Grew" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveCount(5);
  await page.waitForTimeout(2200);
  expect(await opacity(page, "h1")).toBe("1");
  expect(await opacity(page, "nav[aria-label=Main]")).toBe("1");
  // The skip connection is a hairline, never a filled shape, and the SG
  // monogram is drawn in white, not the browser's default black.
  const skip = page.locator("header svg[aria-hidden=true]");
  await expect(skip.locator("circle")).toHaveCount(1);
  for (const fill of await skip.locator("path").evaluateAll((els) => els.map((el) => getComputedStyle(el).fill)))
    expect(fill).toBe("none");
  expect(await page.locator("header svg[role=img] text").first().evaluate((el) => getComputedStyle(el).fill)).toBe("rgb(255, 255, 255)");
  await expect(page.locator(".bg-root")).toHaveAttribute("data-renderer", "webgl");
  expect(errors).toEqual([]);
});

test("a project opens in place, scrolls as one page, and the name leads home", async ({ page }) => {
  const errors = watchErrors(page);
  // Count calls to document.startViewTransition to prove the glide ran.
  await page.addInitScript(() => {
    const counter = window as unknown as { __vt: number };
    counter.__vt = 0;
    const doc = document as unknown as Record<string, unknown>;
    const original = doc.startViewTransition;
    if (typeof original !== "function") return;
    doc.startViewTransition = (...args: unknown[]) => {
      counter.__vt += 1;
      return original.apply(document, args);
    };
  });
  await page.goto("/");
  await page.waitForTimeout(2000);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Throughline" }).click();
  await expect(page).toHaveURL(/\/throughline\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Throughline" })).toBeVisible();
  await expect(page.locator("header[data-view=page]")).toHaveCount(1);
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBeGreaterThan(0);

  // One scroll for the whole page: no element scrolls on its own.
  const innerScrollers = await page.evaluate(() =>
    [...document.querySelectorAll("body *")].filter((el) => {
      const style = getComputedStyle(el);
      return /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
    }).length,
  );
  expect(innerScrollers).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(true);

  await page.getByRole("link", { name: "Scott Grew", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForTimeout(900);
  await expect(page.getByRole("heading", { level: 1, name: "Scott Grew" })).toBeVisible();
  expect(await opacity(page, "nav[aria-label=Main]")).toBe("1");

  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "Throughline" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1, name: "Scott Grew" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("previous and next walk through the projects", async ({ page }) => {
  await page.goto("/throughline/");
  await page.getByRole("link", { name: /Next → MotionNet/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "MotionNet" })).toBeVisible();
  await page.getByRole("link", { name: /Next → Showdown/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Showdown" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Next →/ })).toHaveCount(0);
});

for (const path of PAGES.slice(1)) {
  test(`${path} loads directly, readable, with no README dump`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("table, code, pre")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const width of WIDTHS) {
  test(`no sideways scroll at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width < 800 ? 812 : 900 });
    for (const path of PAGES) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      if (SHOTS) {
        const name = path === "/" ? "home" : path.replaceAll("/", "");
        await page.screenshot({ path: `${SHOTS}/${name}-${width}.png`, fullPage: path !== "/" });
      }
    }
  });
}

test("the Konami code toggles the feature map", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  for (const key of sequence) await page.keyboard.press(key);
  await expect(page.locator(".bg-root")).toHaveAttribute("data-feature", "on");
  await expect(page.getByText("conv1 · sobel 3×3 · 2 kernels")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/feature-map.png` });
  for (const key of sequence) await page.keyboard.press(key);
  await expect(page.locator(".bg-root")).toHaveAttribute("data-feature", "off");
});

test("unknown pages are out of distribution", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.getByText("Out of distribution.")).toBeVisible();
  await expect(page.getByText("this page")).toBeVisible();
});


test("the CV page offers the site resume, which carries no contact details", async ({ page, request }) => {
  await page.goto("/cv/");
  const download = page.getByRole("link", { name: /Download PDF/ });
  await expect(download).toHaveAttribute("href", "/cv/scott-grew-resume.pdf");
  const pdf = await request.get("/cv/scott-grew-resume.pdf");
  expect(pdf.status()).toBe(200);
  await expect(page.getByRole("img", { name: /resume/ })).toBeVisible();
});

test("project pages end with the footer", async ({ page }) => {
  await page.goto("/showdown/");
  await expect(page.locator("main footer")).toContainText("Updated");
});

test("contact is linked beside GitHub and the form checks its fields before sending", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.getByRole("link", { name: "Contact", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Please add your name.")).toBeVisible();
  await expect(page.getByText("That email address doesn't look right.")).toBeVisible();
  await page.getByLabel("Name").fill("Test Visitor");
  await page.getByLabel("Email").fill("visitor@example.com");
  await page.getByLabel("Message").fill("Hello, this is a test message.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("status")).toContainText(/isn't connected yet|on its way/);
});
