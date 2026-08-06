import assert from "node:assert/strict";
import test from "node:test";

import {
  navigationSections,
} from "../src/app/Sidebar/navigation.ts";
import {
  publicBetaSmokeRoutes,
} from "../src/app/router/publicBetaSmokeRoutes.ts";
import {
  evaluateAuthRouteAccess,
} from "../src/features/auth/services/authRouteAccess.ts";

test(
  "public beta smoke routes cover startup and every first-class sidebar route",
  () => {
    const sidebarRoutes =
      navigationSections.flatMap(
        (section) =>
          section.items.map(
            (item) => item.path
          )
      );

    assert.deepEqual(
      publicBetaSmokeRoutes,
      [
        "/",
        ...sidebarRoutes,
      ]
    );
  }
);

test(
  "public beta smoke routes keep signed-in admin access open",
  () => {
    const appRoutes =
      publicBetaSmokeRoutes.filter(
        (route) =>
          route.startsWith("/app")
      );

    appRoutes.forEach((route) => {
      const result =
        evaluateAuthRouteAccess({
          authEnabled: true,
          pathname: route,
          sessionStatus:
            "signed-in",
          role: "admin",
        });

      assert.equal(
        result.isAllowed,
        true,
        route
      );
    });
  }
);

test(
  "public beta smoke routes keep signed-out cloud data routes blocked",
  () => {
    const signedOutAllowedRoutes =
      new Set([
        "/app/settings",
      ]);
    const appRoutes =
      publicBetaSmokeRoutes.filter(
        (route) =>
          route.startsWith("/app")
      );

    appRoutes.forEach((route) => {
      const result =
        evaluateAuthRouteAccess({
          authEnabled: true,
          pathname: route,
          sessionStatus:
            "signed-out",
        });

      assert.equal(
        result.isAllowed,
        signedOutAllowedRoutes.has(
          route
        ),
        route
      );
    });
  }
);

test(
  "public beta smoke routes keep member access to transparency pages",
  () => {
    const memberAllowedRoutes =
      new Set([
        "/app",
        "/app/household-members",
        "/app/accounts",
        "/app/transactions",
        "/app/utilities",
        "/app/settlements",
        "/app/savings",
        "/app/analytics",
        "/app/help-center",
        "/app/settings",
      ]);
    const appRoutes =
      publicBetaSmokeRoutes.filter(
        (route) =>
          route.startsWith("/app")
      );

    appRoutes.forEach((route) => {
      const result =
        evaluateAuthRouteAccess({
          authEnabled: true,
          pathname: route,
          sessionStatus:
            "signed-in",
          role: "member",
        });

      assert.equal(
        result.isAllowed,
        memberAllowedRoutes.has(
          route
        ),
        route
      );
    });
  }
);

test(
  "public beta smoke routes keep viewer access read-only and transparent",
  () => {
    const viewerAllowedRoutes =
      new Set([
        "/app",
        "/app/household-members",
        "/app/accounts",
        "/app/transactions",
        "/app/utilities",
        "/app/settlements",
        "/app/savings",
        "/app/analytics",
        "/app/help-center",
        "/app/settings",
      ]);
    const appRoutes =
      publicBetaSmokeRoutes.filter(
        (route) =>
          route.startsWith("/app")
      );

    appRoutes.forEach((route) => {
      const result =
        evaluateAuthRouteAccess({
          authEnabled: true,
          pathname: route,
          sessionStatus:
            "signed-in",
          role: "viewer",
        });

      assert.equal(
        result.isAllowed,
        viewerAllowedRoutes.has(
          route
        ),
        route
      );
    });
  }
);
