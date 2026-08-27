"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const [, , packageArgument, versionArgument, privateKeyArgument] = process.argv;
if (!packageArgument || !versionArgument) {
  console.error("Usage: node release/create-update-manifest.cjs <package> <version> [private-key.pem]");
  process.exitCode = 2;
  return;
}

const packagePath = path.resolve(packageArgument);
const packageName = path.basename(packagePath);
const data = fs.readFileSync(packagePath);
const sha256 = crypto.createHash("sha256").update(data).digest("hex");
const manifest = {
  kind: "openclasscraft-update-manifest",
  version: versionArgument,
  platform: process.platform,
  arch: process.arch,
  package: packageName,
  sha256,
  createdAt: new Date().toISOString(),
};

if (privateKeyArgument) {
  const signed = [manifest.version, manifest.platform, manifest.arch, manifest.sha256, manifest.package].join("\n");
  manifest.signature = crypto.sign(null, Buffer.from(signed), fs.readFileSync(path.resolve(privateKeyArgument), "utf8")).toString("base64");
}

const manifestPath = `${packagePath}.manifest.json`;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
console.log(manifestPath);
