import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const directusUrl = process.env.DIRECTUS_URL ?? "https://rezeptschatz-cms.fabiandraxl.com";
const tokenPath = "/private/tmp/rezeptschatz-directus-token";
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
  "artifact_caption",
  "artifact_caption_link",
  "artifact_class",
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
  if (!fileId) return undefined;

  const response = await directusFetch(`/assets/${fileId}`);
  const contentType = response.headers.get("content-type") ?? "";
  const extension = extensionFromContentType(contentType, extname(fileId));
  const fileName = `${fileId}${extension}`;
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

async function main() {
  mkdirSync(join(root, "src/data"), { recursive: true });
  mkdirSync(generatedImagesDir, { recursive: true });

  if (!directusToken) {
    writeFileSync(generatedDataPath, "[]\n");
    writeFileSync(generatedArtifactsPath, "[]\n");
    console.log("No DIRECTUS_TOKEN found. Wrote empty generated Directus data.");
    return;
  }

  const response = await directusFetch(
    `/items/recipes?filter[status][_eq]=published&filter[entry_type][_eq]=rezept&sort=sort,title&limit=-1&fields=${fields}`,
  );
  const result = await response.json();

  const recipes = await Promise.all(
    result.data.map(async (recipe) => {
      const originalCardImage = await downloadAsset(recipe.original_card_image);
      const photoImage = await downloadAsset(recipe.photo_image);
      const preparationTime = recipe.preparation_time ?? 0;
      const category = recipe.category ?? undefined;

      return {
        id: recipe.id,
        slug: recipe.slug,
        registerLetter: recipe.register_letter ?? recipe.title?.charAt(0).toUpperCase() ?? "A",
        author: recipe.author ?? "Marianne",
        authorNote: "",
        entryType: recipe.entry_type ?? "rezept",
        title: recipe.title ?? "Ohne Titel",
        shortDescription: "",
        story: recipe.story ?? "",
        originalCardImage: originalCardImage ?? "",
        photoImage,
        coverImage: originalCardImage ?? "",
        galleryImages: [],
        servingsDefault: recipe.servings_default ?? 1,
        servingsUnit: recipe.servings_unit ?? undefined,
        preparationTime,
        prepTime: preparationTime,
        cookTime: 0,
        totalTime: preparationTime,
        difficulty: recipe.difficulty ?? "einfach",
        category,
        categoryIcon: recipe.category_icon ?? undefined,
        categories: category ? [category] : [],
        tags: [],
        collectedItems: [],
        ingredients: recipe.ingredients ?? [],
        steps: recipe.steps ?? [],
        tips: normalizeTips(recipe.tips),
        notesFromOriginal: [],
        featured: false,
      };
    }),
  );

  writeFileSync(generatedDataPath, `${JSON.stringify(recipes, null, 2)}\n`);

  const artifactResponse = await directusFetch(
    `/items/recipes?filter[status][_eq]=published&filter[entry_type][_neq]=rezept&sort=sort,title&limit=-1&fields=${artifactFields}`,
  );
  const artifactResult = await artifactResponse.json();
  const artifacts = await Promise.all(
    artifactResult.data.map(async (artifact) => ({
      id: artifact.slug ?? artifact.id,
      registerLetter: artifact.register_letter ?? artifact.title?.charAt(0).toUpperCase() ?? "A",
      type: artifact.entry_type ?? "fundstueck",
      title: artifact.title ?? "Ohne Titel",
      description: artifact.artifact_description ?? "",
      caption: artifact.artifact_caption ?? undefined,
      captionLink: artifact.artifact_caption_link ?? undefined,
      image: (await downloadAsset(artifact.artifact_image)) ?? "",
      artifactClass: artifact.artifact_class ?? undefined,
    })),
  );

  writeFileSync(generatedArtifactsPath, `${JSON.stringify(artifacts, null, 2)}\n`);
  console.log(`Synced ${recipes.length} Directus recipes and ${artifacts.length} artifacts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
