import { test, expect, type Page } from "@playwright/test";

const users = {
  admin: { id: "11111111-1111-4111-8111-111111111111", email: "admin@hfos.test", user_metadata: { display_name: "Dadi Buboy" } },
  rasha: { id: "22222222-2222-4222-8222-222222222222", email: "rasha@hfos.test", user_metadata: { display_name: "Rasha" } },
  lyn: { id: "33333333-3333-4333-8333-333333333333", email: "lyn@hfos.test", user_metadata: { display_name: "Lyn" } },
};
type Identity = keyof typeof users;
function token(identity: Identity) {
  return [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: users[identity].id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url"),
    "synthetic-signature",
  ].join(".");
}
function session(identity: Identity) {
  return { access_token: token(identity), refresh_token: `test-refresh-${identity}`,
    token_type: "bearer", expires_in: 3600,
    user: { ...users[identity], aud: "authenticated", role: "authenticated", created_at: "2026-01-01T00:00:00Z" } };
}

async function fakeAuth(page: Page) {
  const requests: { path: string; method: string; body: unknown }[] = [];
  await page.route("https://**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== "auth.hfos-test.invalid") return route.abort();
    const body = request.postData() ? request.postDataJSON() : undefined;
    requests.push({ path: url.pathname, method: request.method(), body });
    const headers = { "access-control-allow-origin": "*", "content-type": "application/json" };
    const reply = (data: unknown, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(data) });
    if (url.pathname.endsWith("/token")) {
      const identity = (Object.keys(users) as Identity[]).find((key) => users[key].email === body?.email);
      if (!identity || body.password !== "test-password-only") {
        return reply({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
      }
      return reply(session(identity));
    }
    if (url.pathname.endsWith("/user")) {
      const auth = request.headers().authorization;
      const identity = (Object.keys(users) as Identity[]).find((key) => auth === `Bearer ${token(key)}`);
      // JWT timestamps may differ by a second; the subject is the authoritative fixture identity.
      const payload = auth?.split(".")[1];
      const sub = payload ? JSON.parse(Buffer.from(payload, "base64url").toString()).sub : "";
      const resolved = identity ?? (Object.keys(users) as Identity[]).find((key) => users[key].id === sub);
      return resolved ? reply(session(resolved).user) : reply({ message: "No user" }, 401);
    }
    if (url.pathname.endsWith("/recover") || url.pathname.endsWith("/otp") || url.pathname.endsWith("/logout")) return reply({});
    if (url.pathname.startsWith("/rest/v1/")) return reply([]);
    return reply({});
  });
  return requests;
}

for (const scenario of ["owner", "admin", "multiple"] as const) {
  const role = scenario === "admin" ? "admin" : "owner";
  test(`fresh ${scenario} login restores existing household and finance records without backup`, async ({ page }, testInfo) => {
    await fakeAuth(page);
    const householdId = "44444444-4444-4444-8444-444444444444";
    const memberId = "55555555-5555-4555-8555-555555555555";
    const date = "2026-10-01T00:00:00Z";
    const writes: string[] = [];
    await page.route("https://auth.hfos-test.invalid/rest/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith("/household_memberships")) data = [{
        id: "membership-owner", household_id: householdId, user_id: users.admin.id,
        member_id: memberId, member: { display_name: "Dadi Buboy", local_record_id: null },
        role, status: "active", created_at: date, updated_at: date,
      }];
      else if (path.endsWith("/household_members")) data = [{
        id: memberId, household_id: householdId, linked_user_id: users.admin.id,
        display_name: "Dadi Buboy", role, status: "active", created_at: date, updated_at: date,
      }];
      else if (path.endsWith("/load_household_preferences")) data = {
        household_id: householdId, household_name: "Existing Household", country: "PH",
        currency: "PHP", timezone: "Asia/Manila", status: "active", owner_member_id: memberId,
      };
      else if (path.endsWith("/load_household_core_snapshot")) data = {
        household_id: householdId, accounts: [], expense_allocations: [], provider_bills: [],
        transactions: [{ id: "existing-transaction", householdId, visibility: "household",
          type: "expense", amount: 75, category: "Groceries", description: "Existing market receipt",
          notes: "", transactionDate: "2026-10-01", isActive: true, attachments: [],
          createdAt: date, updatedAt: date }],
      };
      else if (["POST", "PATCH", "PUT", "DELETE"].includes(route.request().method())) writes.push(path);
      if (scenario === "multiple" && path.endsWith("/household_memberships")) {
        data = [{ ...(data as object[])[0], id: "other-membership", household_id: "66666666-6666-4666-8666-666666666666" }, ...(data as object[])];
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    });
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(users.admin.email);
    await page.getByLabel("Password", { exact: true }).fill("test-password-only");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).not.toHaveURL(/\/login$/);
    if (scenario === "multiple") {
      await expect(page.getByLabel("Selected household")).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem("hfos.v1.transactions"))).toBeNull();
      await page.getByLabel("Selected household").selectOption(householdId);
      await page.getByRole("button", { name: "Open Household" }).click();
    }
    await expect.poll(() => page.evaluate(() => localStorage.getItem("hfos.v1.transactions"))).toContain("existing-transaction");
    await page.goto("/app/household-members");
    await expect(page.getByText("No household members are available.")).not.toBeVisible();
    await expect(page.getByText("Dadi Buboy", { exact: true }).first()).toBeVisible();
    await page.reload();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("hfos.v1.transactions"))).toContain("existing-transaction");
    if (scenario === "multiple") {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/app/settings");
      await expect(page.getByLabel("Selected household")).toHaveValue(householdId);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath("household-selector.png"), fullPage: true });
    }
    expect(writes).toEqual([]);
  });
}

for (const theme of ["light", "dark"] as const) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`${theme} login is readable and fits ${viewport.width}px`, async ({ page }, testInfo) => {
      await fakeAuth(page);
      await page.setViewportSize(viewport);
      await page.addInitScript((value) => localStorage.setItem("hfos.themePreference", value), theme);
      await page.goto("/login");
      await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
      await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
      await expect(page.getByRole("img", { name: "Home Finance OS", exact: true })).toBeVisible();
      expect(await page.locator(".auth-screen__brand img:visible").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const colors = await page.getByLabel("Email", { exact: true }).evaluate((el) => {
        const style = getComputedStyle(el);
        return { text: style.color, background: style.backgroundColor };
      });
      expect(colors.text).not.toBe(colors.background);
      const recoveryStyle = await page.getByRole("button", { name: "Forgot password?" }).evaluate((el) => {
        const style = getComputedStyle(el);
        return { text: style.color, background: style.backgroundColor };
      });
      expect(recoveryStyle.background).toBe("rgba(0, 0, 0, 0)");
      expect(recoveryStyle.text).toBe(colors.text);
      await page.getByLabel("Email", { exact: true }).focus();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath("login.png"), fullPage: true });
    });
  }
}

test("wrong password remains on login without false success", async ({ page }) => {
  await fakeAuth(page);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(users.rasha.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to sign in");
  await expect(page).toHaveURL(/\/login$/);
});

for (const theme of ["light", "dark"] as const) {
  test(`${theme} settings separates account controls from diagnostics and destructive actions`, async ({ page }, testInfo) => {
    const requests = await fakeAuth(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((value) => localStorage.setItem("hfos.themePreference", value), theme);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(users.rasha.email);
    await page.getByLabel("Password", { exact: true }).fill("test-password-only");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).not.toHaveURL(/\/login$/);
    await page.goto("/app/settings");
    await expect(page.getByRole("tab", { name: "Account", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: "Set or Change Password" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Auth Diagnostics" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Reset All Application Data" })).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("settings-account.png"), fullPage: true });
    await page.getByRole("tab", { name: "Account", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Preferences", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("Theme", { exact: true })).toBeVisible();
    expect(requests.filter((request) => request.path.startsWith("/rest/") && request.method !== "GET")).toHaveLength(0);
    await page.getByRole("tab", { name: "Status & Tests" }).click();
    await expect(page.getByRole("heading", { name: "Auth Diagnostics" })).toBeVisible();
    await page.getByRole("tab", { name: "Account", exact: true }).click();
    await page.getByRole("button", { name: "Set or Change Password" }).click();
    await expect(page).toHaveURL(/\/account\/password$/);
    const diagnosticCalls = requests.filter((request) => request.path.startsWith("/rest/") && request.method !== "GET");
    expect(diagnosticCalls.length).toBeGreaterThan(0);
    for (const request of diagnosticCalls) {
      expect(request.body).toMatchObject({ target_household_id: "00000000-0000-0000-0000-000000000000" });
    }
  });
}

test("same-browser Admin Rasha Lyn Admin login preserves Auth identity on refresh", async ({ page }) => {
  const requests = await fakeAuth(page);
  for (const identity of ["admin", "rasha", "lyn", "admin"] as const) {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(users[identity].email);
    await page.getByLabel("Password", { exact: true }).fill("test-password-only");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).not.toHaveURL(/\/login$/);
    await page.goto("/login");
    await expect(page.getByText(`Signed in as ${users[identity].email}`)).toBeVisible();
    await page.reload();
    await expect(page.getByText(`Signed in as ${users[identity].email}`)).toBeVisible();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  }
  expect(requests.filter((request) => request.path.startsWith("/rest/") && request.method !== "GET")).toHaveLength(0);
});

test("recovery requests target the dedicated callback; expired callbacks fail closed", async ({ page }) => {
  const requests = await fakeAuth(page);
  await page.goto("/login?mode=recovery");
  await page.getByLabel("Email", { exact: true }).fill(users.rasha.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If this email has an account");
  expect(requests.some((request) => request.path.endsWith("/recover"))).toBe(true);
  await page.goto("/reset-password#error=access_denied&error_code=otp_expired");
  await expect(page.getByRole("alert")).toContainText("invalid or expired");
  await expect(page.getByLabel("New password", { exact: true })).toHaveCount(0);
});

test("actual SDK recovery event is guarded across refresh until password confirmation", async ({ page }, testInfo) => {
  const requests = await fakeAuth(page);
  const recovery = new URLSearchParams({ access_token: token("rasha"), refresh_token: "test-refresh-rasha",
    expires_in: "3600", token_type: "bearer", type: "recovery" });
  await page.goto(`/reset-password#${recovery}`);
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel("New password", { exact: true }).fill("updated-test-password");
  await page.getByLabel("Confirm password", { exact: true }).fill("mismatched-test-password");
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page.getByRole("alert")).toContainText("Passwords do not match");
  await page.getByLabel("Confirm password", { exact: true }).fill("updated-test-password");
  await page.screenshot({ path: testInfo.outputPath("recovery.png"), fullPage: true });
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  expect(requests.filter((request) => request.path.endsWith("/user") && request.method === "PUT")).toHaveLength(1);
  expect(await page.evaluate(() => sessionStorage.getItem("hfos-password-recovery-user"))).toBeNull();
});
