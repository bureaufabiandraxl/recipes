import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const localEnvPath = join(root, ".env.local");
const tokenPath = "/private/tmp/rezeptschatz-directus-token";

function loadLocalEnv() {
  if (!existsSync(localEnvPath)) return;

  const lines = readFileSync(localEnvPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const directusUrl = process.env.DIRECTUS_URL ?? "https://rezeptschatz-cms.fabiandraxl.com";
const directusToken =
  process.env.DIRECTUS_TOKEN ?? (existsSync(tokenPath) ? readFileSync(tokenPath, "utf8").trim() : "");

const entryTypeChoices = [
  { text: "Nachgekocht", value: "rezept" },
  { text: "Originalrezept (Bild)", value: "originalrezept_bild" },
  { text: "Originalrezept (Karte)", value: "rezeptkarte" },
  { text: "Fundstück", value: "fundstueck" },
  { text: "Bild", value: "bild" },
];

function encodeFilter(filter) {
  return encodeURIComponent(JSON.stringify(filter));
}

async function directusFetch(pathname, options = {}) {
  const response = await fetch(`${directusUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${directusToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Directus request failed (${response.status}) for ${pathname}: ${body}`);
  }

  return response;
}

async function updateEntryTypeChoices() {
  const fieldResponse = await directusFetch("/fields/recipes/entry_type");
  const fieldResult = await fieldResponse.json();
  const currentMeta = fieldResult.data?.meta ?? {};
  const currentOptions = currentMeta.options ?? {};

  await directusFetch("/fields/recipes/entry_type", {
    method: "PATCH",
    body: JSON.stringify({
      meta: {
        ...currentMeta,
        options: {
          ...currentOptions,
          choices: entryTypeChoices,
        },
      },
    }),
  });
}

async function migrateLegacyNotes() {
  const filter = encodeFilter({ entry_type: { _eq: "notiz" } });
  const response = await directusFetch(`/items/recipes?filter=${filter}&fields=id,title&limit=-1`);
  const result = await response.json();
  const legacyNotes = result.data ?? [];

  for (const item of legacyNotes) {
    await directusFetch(`/items/recipes/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ entry_type: "fundstueck" }),
    });
  }

  return legacyNotes.length;
}

async function main() {
  if (!directusToken) {
    throw new Error("No DIRECTUS_TOKEN found.");
  }

  await updateEntryTypeChoices();
  const migratedCount = await migrateLegacyNotes();

  console.log(`Updated Directus entry type choices. Migrated ${migratedCount} legacy notiz item(s) to fundstueck.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
