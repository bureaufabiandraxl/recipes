import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

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

const generatedDataPath = join(root, "src/data/directus-recipes.generated.json");
const generatedArtifactsPath = join(root, "src/data/directus-artifacts.generated.json");
const generatedImagesDir = join(root, "public/images/directus");

const fields = [
  "id",
  "slug",
  "register_letter",
  "entry_type",
  "title",
  "card_color",
  "story",
  "author",
  "original_card_image",
  "photo_image",
  "servings_default",
  "servings_unit",
  "preparation_time",
  "difficulty",
  "category",
  "category_icon",
  "ingredients",
  "steps",
  "tips",
].join(",");

const artifactFields = [
  "id",
  "slug",
  "register_letter",
  "entry_type",
  "title",
  "artifact_description",
  "artifact_image",
  "artifact_secondary_image",
  "artifact_caption",
  "artifact_caption_link",
  "artifact_class",
  "category_icon",
].join(",");

function extensionFromContentType(contentType, fallback = ".bin") {
  if (contentType.includes("image/svg+xml")) return ".svg";
  if (contentType.includes("image/png")) return ".png";
  if (contentType.includes("image/jpeg")) return ".jpg";
  if (contentType.includes("image/webp")) return ".webp";
  return fallback;
}

async function directusFetch(pathname, options = {}) {
  const response = await fetch(`${directusUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${directusToken}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Directus request failed (${response.status}) for ${pathname}`);
  }

  return response;
}

async function downloadAsset(fileId) {
  const resolvedFileId = fileId && typeof fileId === "object" ? fileId.id : fileId;

  if (!resolvedFileId) return undefined;

  const response = await directusFetch(`/assets/${resolvedFileId}`);
  const contentType = response.headers.get("content-type") ?? "";
  const extension = extensionFromContentType(contentType, extname(resolvedFileId));
  const fileName = `${resolvedFileId}${extension}`;
  const publicPath = `/images/directus/${fileName}`;
  const targetPath = join(generatedImagesDir, fileName);
  const buffer = Buffer.from(await response.arrayBuffer());

  writeFileSync(targetPath, buffer);

  return publicPath;
}

function normalizeTips(tips) {
  if (!Array.isArray(tips)) return [];

  return tips
    .map((tip) => (typeof tip === "string" ? tip : tip?.text))
    .filter(Boolean);
}

function slugify(value, fallback) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return [];

  return ingredients.map((ingredient) => ({
    ...ingredient,
    amount:
      ingredient?.amount === "" || ingredient?.amount === null || ingredient?.amount === undefined
        ? 0
      : Number(ingredient.amount),
  }));
}

function normalizeColor(value) {
  const color = String(value ?? "").trim();

  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) {
    return color.toLowerCase();
  }

  return undefined;
}

function normalizeArtifactSize(value) {
  const size = String(value ?? "").trim().toUpperCase();

  return ["S", "M", "L", "XL"].includes(size) ? size : "M";
}

function normalizeArtifactType(value) {
  const type = String(value ?? "").trim();

  if (type === "originalrezept_bild" || type === "bild" || type === "fundstueck") {
    return type;
  }

  if (type === "notiz") {
    return "fundstueck";
  }

  return "fundstueck";
}

function optionalString(value) {
  const stringValue = String(value ?? "").trim();

  return stringValue || undefined;
}

function encodeFilter(filter) {
  return encodeURIComponent(JSON.stringify(filter));
}

async function main() {
  mkdirSync(join(root, "src/data"), { recursive: true });
  mkdirSync(generatedImagesDir, { recursive: true });

  if (!directusToken) {
    writeFileSync(generatedDataPath, "[]\n");
    writeFileSync(generatedArtifactsPath, "[]\n");
    console.log("No DIRECTUS_TOKEN found. Wrote empty generated Directus data.");
    return;
  }

  const recipeFilter = encodeFilter({
    status: { _eq: "published" },
    entry_type: { _in: ["rezept", "rezeptkarte"] },
  });
  const response = await directusFetch(
    `/items/recipes?filter=${recipeFilter}&sort=sort,title&limit=-1&fields=${fields}`,
  );
  const result = await response.json();

  const recipes = await Promise.all(
    result.data.map(async (recipe) => {
      const isRecipeCardOnly = recipe.entry_type === "rezeptkarte";
      const originalCardImage = await downloadAsset(recipe.original_card_image);
      const photoImage = isRecipeCardOnly ? undefined : await downloadAsset(recipe.photo_image);
      const preparationTime = isRecipeCardOnly ? 0 : recipe.preparation_time ?? 0;
      const category = isRecipeCardOnly ? undefined : recipe.category ?? undefined;
      const slug = slugify(recipe.slug ?? recipe.title, recipe.id);

      return {
        id: recipe.id,
        slug,
        registerLetter: recipe.register_letter ?? recipe.title?.charAt(0).toUpperCase() ?? "A",
        author: recipe.author ?? "Marianne",
        authorNote: "",
        entryType: recipe.entry_type ?? "rezept",
        title: recipe.title ?? "Ohne Titel",
        cardColor: isRecipeCardOnly ? undefined : normalizeColor(recipe.card_color),
        shortDescription: "",
        story: recipe.story ?? "",
        originalCardImage: optionalString(originalCardImage) ?? "/images/recipes/eiskonfekt.svg",
        photoImage,
        coverImage: optionalString(originalCardImage),
        galleryImages: [],
        servingsDefault: recipe.servings_default ?? 1,
        servingsUnit: recipe.servings_unit ?? undefined,
        preparationTime,
        prepTime: preparationTime,
        cookTime: 0,
        totalTime: preparationTime,
        difficulty: isRecipeCardOnly ? "einfach" : recipe.difficulty ?? "einfach",
        category,
        categoryIcon: recipe.category_icon ?? undefined,
        categories: category ? [category] : [],
        tags: [],
        collectedItems: [],
        ingredients: isRecipeCardOnly ? [] : normalizeIngredients(recipe.ingredients),
        steps: isRecipeCardOnly ? [] : recipe.steps ?? [],
        tips: isRecipeCardOnly ? [] : normalizeTips(recipe.tips),
        notesFromOriginal: [],
        featured: false,
      };
    }),
  );

  writeFileSync(generatedDataPath, `${JSON.stringify(recipes, null, 2)}\n`);

  const artifactFilter = encodeFilter({
    status: { _eq: "published" },
    entry_type: { _in: ["notiz", "originalrezept_bild", "bild", "fundstueck"] },
  });
  const artifactResponse = await directusFetch(
    `/items/recipes?filter=${artifactFilter}&sort=sort,title&limit=-1&fields=${artifactFields}`,
  );
  const artifactResult = await artifactResponse.json();
  const artifacts = await Promise.all(
    artifactResult.data.map(async (artifact) => ({
      id: artifact.slug ?? artifact.id,
      registerLetter: artifact.register_letter ?? artifact.title?.charAt(0).toUpperCase() ?? "A",
      type: normalizeArtifactType(artifact.entry_type),
      title: artifact.title ?? "Ohne Titel",
      description: artifact.artifact_description ?? "",
      caption: artifact.artifact_caption ?? undefined,
      captionLink: artifact.artifact_caption_link ?? undefined,
      image: (await downloadAsset(artifact.artifact_image)) ?? "",
      secondaryImage: await downloadAsset(artifact.artifact_secondary_image),
      size: normalizeArtifactSize(artifact.artifact_class),
      categoryIcon: artifact.category_icon ?? undefined,
    })),
  );

  writeFileSync(generatedArtifactsPath, `${JSON.stringify(artifacts, null, 2)}\n`);
  console.log(`Synced ${recipes.length} Directus recipes and ${artifacts.length} artifacts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
