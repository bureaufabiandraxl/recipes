import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outDir = join(root, "out");
const indexPath = join(outDir, "index.html");
const sshKeyPath = join(homedir(), ".ssh/rezeptschatz_serverpilot_ed25519");
const remoteHost = "46.101.192.163";
const remoteUser = "rezeptschatz";
const remotePath = "/srv/users/rezeptschatz/apps/rezeptschatz/public/";
const liveUrl = "https://rezeptschatz.fabiandraxl.com";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (!existsSync(sshKeyPath)) {
  console.error(`Missing SSH key: ${sshKeyPath}`);
  process.exit(1);
}

console.log("Building current Directus-backed static export...");
run("npm", ["run", "build"]);

if (!existsSync(indexPath)) {
  console.error("Build did not create out/index.html.");
  process.exit(1);
}

const indexHtml = readFileSync(indexPath, "utf8");
const buildId = indexHtml.match(/<!--([^>]+)-->/)?.[1];

console.log("Deploying out/ to ServerPilot...");
run("rsync", [
  "-avz",
  "--delete",
  "-e",
  `ssh -i ${sshKeyPath} -o BatchMode=yes -o ConnectTimeout=10`,
  "out/",
  `${remoteUser}@${remoteHost}:${remotePath}`,
]);

console.log("Verifying live site...");
const verify = spawnSync(
  "curl",
  ["-fsSL", "--max-time", "20", "-H", "Cache-Control: no-cache", liveUrl],
  { cwd: root, encoding: "utf8" },
);

if (verify.status !== 0) {
  console.error("Deploy finished, but live verification request failed.");
  process.exit(verify.status ?? 1);
}

if (buildId && !verify.stdout.includes(buildId)) {
  console.error(`Deploy finished, but live site did not return build ${buildId}.`);
  process.exit(1);
}

console.log(`Live deploy complete: ${liveUrl}`);
if (buildId) {
  console.log(`Verified build: ${buildId}`);
}
