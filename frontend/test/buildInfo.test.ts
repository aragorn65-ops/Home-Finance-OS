import assert from "node:assert/strict";
import test from "node:test";

import {
  createBuildInfo,
} from "../src/config/buildInfo.ts";

test(
  "build info formats Cloudflare build metadata",
  () => {
    const buildInfo =
      createBuildInfo({
        VITE_HFOS_BUILD_COMMIT:
          "abac0b6ef1234567890",
        VITE_HFOS_BUILD_BRANCH:
          "main",
        VITE_HFOS_BUILD_TIME:
          "2026-07-30T12:00:00.000Z",
      });

    assert.equal(
      buildInfo.commit,
      "abac0b6ef1234567890"
    );
    assert.equal(
      buildInfo.shortCommit,
      "abac0b6"
    );
    assert.equal(
      buildInfo.branch,
      "main"
    );
    assert.equal(
      buildInfo.builtAt,
      "2026-07-30T12:00:00.000Z"
    );
  }
);

test(
  "build info falls back for local or missing build metadata",
  () => {
    const buildInfo =
      createBuildInfo({});

    assert.deepEqual(
      buildInfo,
      {
        commit: "local",
        shortCommit: "local",
        branch: "local",
        builtAt: "unknown",
      }
    );
  }
);
