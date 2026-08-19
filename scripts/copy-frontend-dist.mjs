import {
  cpSync,
  existsSync,
  rmSync,
} from "node:fs";
import {
  resolve,
} from "node:path";

const source = resolve(
  "frontend",
  "dist"
);
const target = resolve("dist");

if (!existsSync(source)) {
  throw new Error(
    "frontend/dist does not exist. Run the frontend build before copying output."
  );
}

if (existsSync(target)) {
  rmSync(target, {
    recursive: true,
    force: true,
  });
}

cpSync(source, target, {
  recursive: true,
});
