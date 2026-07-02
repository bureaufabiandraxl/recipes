"use client";

import Image from "next/image";
import {
  BookOpen,
  ChefHat,
  CircleUser,
  Clock3,
  Cookie,
  ImageIcon,
  ListOrdered,
  Martini,
  Minimize2,
  Minus,
  Plus,
  ReceiptText,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { collectedBookItems } from "@/data/recipes";
import generatedArtifacts from "@/data/directus-artifacts.generated.json";
import type { Recipe } from "@/types/recipe";

type ArtifactSize = "S" | "M" | "L" | "XL";
type ArtifactType = "originalrezept_bild" | "bild" | "fundstueck";
type LegacyArtifactType = ArtifactType | "notiz";

interface CollectedBookItem {
  id: string;
  registerLetter: string;
  type: LegacyArtifactType;
  title: string;
  description: string;
  caption?: string;
  captionLink?: string;
  image?: string;
  secondaryImage?: string;
  size?: ArtifactSize;
  categoryIcon?: string;
}

interface RecipeRegisterBookProps {
  recipes: Recipe[];
}

interface BoardPosition {
  x: number;
  y: number;
}

type BoardItem =
  | {
      id: string;
      kind: "recipe";
      registerLetter: string;
      title: string;
      color: string;
      rotation: number;
      image: string;
      recipe: Recipe;
      position: BoardPosition;
      layerIndex: number;
    }
  | {
      id: string;
      kind: "recipe-card";
      registerLetter: string;
      title: string;
      color: string;
      rotation: number;
      image: string;
      recipe: Recipe;
      position: BoardPosition;
      layerIndex: number;
    }
  | {
      id: string;
      kind: "artifact";
      registerLetter: string;
      title: string;
      description: string;
      caption?: string;
      captionLink?: string;
      color: string;
      rotation: number;
      image: string;
      secondaryImage?: string;
      size: ArtifactSize;
      categoryIcon?: string;
      artifactType: ArtifactType;
      position: BoardPosition;
      layerIndex: number;
    };

interface SearchableRegisterItem {
  id: string;
  itemId: string;
  href: string;
  title: string;
  description: string;
  registerLetter: string;
  typeLabel: string;
  color: string;
  icon: LucideIcon;
  metaParts: string[];
  searchText: string;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  startPosition: BoardPosition;
  itemWidth: number;
  itemHeight: number;
  moved: boolean;
}

interface ZoomPoint {
  x: number;
  y: number;
}

type RegisterEntry =
  { id: string; label: string; type: "letter" };

interface RegisterRouteState {
  activeLetter: string;
  selectedItemId: string | null;
}

type FloatingPanelType = "intro" | "search";

const cardColors = ["#fec8ff", "#deffc8", "#fff36e", "#e3fdff", "#ffb5e5", "#ff9e66"];
const recipeCardOnlyColor = "#d9e7ff";
const fallbackRecipeImage = "/images/recipes/eiskonfekt.svg";
const syncedCollectedBookItems = generatedArtifacts as CollectedBookItem[];
const recipeColorOverrides: Record<string, string> = {
  kirchtagskrapfen: "#fff36e",
};
const artifactSearchColors: Record<ArtifactType, string> = {
  originalrezept_bild: "#f1eadf",
  bild: "#dff3ff",
  fundstueck: "#ece7dd",
};
const registerPageBaseHeight = 900;
const registerPagePadding = 80;
const registerLineHeight = 32;
const registerContentHeight = registerPageBaseHeight - registerPagePadding * 2;
const mobileMinimumVisibleRatio = 0.38;
const defaultPositions: BoardPosition[] = [
  { x: 6.4, y: 32.4 },
  { x: 54.4, y: 69.2 },
  { x: 46, y: 17 },
  { x: 19, y: 67 },
  { x: 34, y: 35 },
];
const designRegisterLetters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "Sch",
  "St",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
const registerEntries: RegisterEntry[] = [
  ...designRegisterLetters.map((letter) => ({ id: letter, label: letter, type: "letter" }) as RegisterEntry),
];
const liquidGlassRuntimeStyleId = "marianne-liquid-glass-backdrop-filter";
const liquidGlassRuntimeSelectors = [
  ".recipe-detail-backdrop::before",
  ".recipe-view-toolbar",
  ".recipe-view-chip",
  ".recipe-view-close",
  ".zoomable-image-controls",
  ".recipe-view-mode-switch",
  ".recipe-view-intro",
  ".recipe-content-panel",
  ".recipe-detail-facts > span",
  ".recipe-detail-facts .servings-controls",
  ".servings-controls",
  ".recipe-detail-original",
  ".artifact-detail-image",
  ".artifact-lightbox-caption",
  ".artifact-view-toolbar",
  ".artifact-view-chip",
  ".artifact-view-close",
  ".artifact-view-side-button",
  ".artifact-view-caption",
  ".register-floating-menu",
  ".register-floating-menu button",
  ".register-floating-panel-backdrop",
  ".register-floating-panel",
  ".register-floating-panel-close",
  ".register-search-input-shell",
  ".register-search-result",
  ".register-search-empty",
].join(",\n");

function resolveImageSrc(src: string | null | undefined, fallback = fallbackRecipeImage) {
  const resolvedSrc = src?.trim();

  return resolvedSrc || fallback;
}

const introParagraphs = [
  "Mariannes Rezeptschatz ist ein digitales Registerbuch aus handschriftlichen Rezeptkarten, losen Fundstücken und kleinen Erinnerungen aus Omas Küche.",
  "Die Originale bleiben sichtbar: als Scans, Fotos und Artefakte, die auf den linierten Seiten liegen und sich entdecken lassen. Daneben gibt es lesbare Rezeptfassungen, Tipps und Hinweise zu Gastautorinnen.",
  "Das Projekt ist bewusst wie ein altes Registerbuch aufgebaut. Du kannst nach Buchstaben blättern, Karten verschieben, Details öffnen und die Originale vergrößern.",
];
const imprintSections = [
  {
    title: "Medieninhaber und Kontakt",
    items: [
      "Mariannes Rezeptschatz ist ein privates digitales Archivprojekt von Mag.art. Fabian Draxl.",
      "Mag.art. Fabian Draxl, Reznicekgasse 10/17, 1090 Wien, Österreich",
      "Telefon: +43 660 2537369",
      "E-Mail: mail@anita.vision",
    ],
  },
  {
    title: "Unternehmensangaben",
    items: [
      "Umsatzsteuer-Identifikationsnummer: ATU75306848",
      "GLN: 9110013474024",
      "Mitgliedschaften: Design Austria, Bildrecht und IG Kunst",
      "Gewerbebehörde: Magistrat der Stadt Wien, MA 63",
      "Tätigkeitsbereich: Designstudio / künstlerische und gestalterische Projekte",
    ],
  },
  {
    title: "Verantwortung für Inhalte",
    items: [
      "Für die redaktionellen Inhalte dieses Projekts ist Fabian Draxl verantwortlich, sofern bei einzelnen Beiträgen keine andere Person genannt wird.",
      "Die Rezepttexte, Hinweise und Begleitinformationen werden sorgfältig aufbereitet. Eine Gewähr für Vollständigkeit, Fehlerfreiheit oder jederzeitige Aktualität kann trotzdem nicht übernommen werden.",
    ],
  },
  {
    title: "Urheberrecht und Bildnachweise",
    items: [
      "Texte, Gestaltung, Fotografien, Scans, Grafiken und sonstige Inhalte dieser Seite unterliegen dem Urheberrecht oder den Rechten der jeweils genannten Rechteinhaberinnen und Rechteinhaber.",
      "Familienfotos, Rezeptscans und private Archivstücke werden im Rahmen dieses Erinnerungsprojekts gezeigt. Externe Bildquellen werden, sofern vorhanden, direkt beim jeweiligen Artefakt genannt.",
      "Die im Projekt verwendete Schrift Anita Sans wurde von David Einwaller und Jakob Mayr für Anita entwickelt.",
    ],
  },
  {
    title: "Links und Hinweise",
    items: [
      "Verweise auf externe Webseiten wurden zum Zeitpunkt der Einbindung geprüft. Für spätere Änderungen und Inhalte außerhalb dieses Projekts liegt die Verantwortung bei den jeweiligen Betreiberinnen und Betreibern.",
      "Falls dir ein problematischer Inhalt, eine fehlerhafte Quellenangabe oder ein Rechtsverstoß auffällt, schreib bitte eine kurze Nachricht. Berechtigte Hinweise werden zeitnah geprüft.",
    ],
  },
  {
    title: "Text und Data Mining",
    items: [
      "Die automatisierte Nutzung, Auswertung oder Übernahme der Inhalte dieses Projekts für KI-Training, maschinelle Lernsysteme oder vergleichbare Verfahren ist nur mit vorheriger schriftlicher Zustimmung erlaubt.",
    ],
  },
  {
    title: "Streitbeilegung",
    items: [
      "Die Plattform der Europäischen Kommission zur Online-Streitbeilegung ist unter ec.europa.eu/consumers/odr erreichbar.",
      "Eine Teilnahme an einem Verfahren vor einer Verbraucherschlichtungsstelle ist nicht vorgesehen und nicht verpflichtend.",
    ],
  },
];
const desktopRegisterTabPath =
  "M 6.3203125 46.3203125 C 2.82978892326355 46.32051032302843 0.00019835762213915586 49.15010118484497 0 52.640625 L 0 0 C 0.00019797560526058078 3.49052357673645 2.8297886848449707 6.320114294954692 6.3203125 6.3203125 L 24 6.3203125 C 28.418277740478516 6.3203125 31.999999935572284 9.902034759521484 32 14.3203125 L 32 38.3203125 C 32 42.738590240478516 28.418277740478516 46.3203125 24 46.3203125 L 6.3203125 46.3203125 Z";
const desktopIntroRegisterTabPath =
  "M 6.3203125 66.3203125 C 2.82978892326355 66.32051032302843 0.00019835762213915586 69.15010118484497 0 72.640625 L 0 0 C 0.00019797560526058078 3.49052357673645 2.8297886848449707 6.320114294954692 6.3203125 6.3203125 L 24 6.3203125 C 28.418277740478516 6.3203125 31.999999935572284 9.902034759521484 32 14.3203125 L 32 58.3203125 C 32 62.738590240478516 28.418277740478516 66.3203125 24 66.3203125 L 6.3203125 66.3203125 Z";
const mobileRegisterTabPath =
  "M 25.0634765625 0 C 27.27261519432068 2.577024815764162e-7 29.0634765625 1.7908611297607422 29.0634765625 4 L 29.0634765625 26.9736328125 C 29.083194626495242 29.75284194946289 31.34119963645935 31.999763020823593 34.125 32 L 0 32 C 2.7960927486419678 32.000001143993245 5.063238508286304 29.733537197113037 5.0634765625 26.9375 L 5.0634765625 4 C 5.0634765625 1.7908611297607422 6.854337692260742 6.44256274995314e-8 9.0634765625 0 L 25.0634765625 0 Z";
const mobileWideRegisterTabPath =
  "M 35.0634765625 0 C 37.27261519432068 2.577024815764162e-7 39.0634765625 1.7908611297607422 39.0634765625 4 L 39.0634765625 26.9736328125 C 39.08319462649524 29.75284194946289 41.34119963645935 31.999763020823593 44.125 32 L 0 32 C 2.7960927486419678 32.000001143993245 5.063238508286304 29.733537197113037 5.0634765625 26.9375 L 5.0634765625 4 C 5.0634765625 1.7908611297607422 6.854337692260742 6.44256274995314e-8 9.0634765625 0 L 35.0634765625 0 Z";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(minutes: number) {
  if (minutes < 60) {
    return `${minutes} Min.`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

function getCardTimeLabel(recipe: Recipe) {
  return formatTime(recipe.preparationTime ?? recipe.totalTime);
}

function getServingsUnit(recipe: Recipe) {
  return recipe.servingsUnit ?? "Portionen";
}

function getRecipeAuthorLabel(recipe: Recipe) {
  return recipe.author.replace(/^Gastautorin\s+/i, "").replace(/^Gastautor\s+/i, "");
}

function getRecipeCategoryLabel(recipe: Recipe) {
  return recipe.category ?? recipe.categories[0] ?? recipe.entryType;
}

function getLucideIconByName(iconName: string | null | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) {
    return fallback;
  }

  const Icon = (LucideIcons as Record<string, unknown>)[iconName];

  return typeof Icon === "function" ? (Icon as LucideIcon) : fallback;
}

function getRecipeIcon(recipe: Recipe): LucideIcon {
  return getLucideIconByName(recipe.categoryIcon, recipe.slug === "eierlikoer" ? Martini : Cookie);
}

function normalizeArtifactType(type: LegacyArtifactType | null | undefined): ArtifactType {
  if (type === "originalrezept_bild" || type === "bild" || type === "fundstueck") {
    return type;
  }

  return "fundstueck";
}

function getRecipeEntryTypeLabel(recipe: Recipe) {
  switch (recipe.entryType) {
    case "rezeptkarte":
      return "Originalrezept";
    case "originalrezept_bild":
      return "Originalrezept";
    case "bild":
      return "Bild";
    case "fundstueck":
      return "Fundstück";
    case "rezept":
    default:
      return "Nachgekocht";
  }
}

function getArtifactTypeLabel(type: LegacyArtifactType) {
  switch (normalizeArtifactType(type)) {
    case "originalrezept_bild":
      return "Originalrezept";
    case "bild":
      return "Bild";
    case "fundstueck":
    default:
      return "Fundstück";
  }
}

function getArtifactColor(type: LegacyArtifactType) {
  return artifactSearchColors[normalizeArtifactType(type)] ?? artifactSearchColors.fundstueck;
}

function getRecipeEntryTypeIcon(recipe: Recipe): LucideIcon {
  switch (recipe.entryType) {
    case "rezeptkarte":
      return ReceiptText;
    case "originalrezept_bild":
      return ReceiptText;
    case "bild":
      return ImageIcon;
    case "fundstueck":
      return StickyNote;
    case "rezept":
    default:
      return ListOrdered;
  }
}

function getArtifactTypeIcon(type: LegacyArtifactType): LucideIcon {
  switch (normalizeArtifactType(type)) {
    case "originalrezept_bild":
      return ReceiptText;
    case "bild":
      return ImageIcon;
    case "fundstueck":
    default:
      return StickyNote;
  }
}

function getBoardItemTypeIcon(item: BoardItem): LucideIcon {
  if (item.kind === "artifact") {
    return getArtifactTypeIcon(item.artifactType);
  }

  if (item.kind === "recipe") {
    return getRecipeIcon(item.recipe);
  }

  return getRecipeEntryTypeIcon(item.recipe);
}

function getArtifactTitleIcon(item: Extract<BoardItem, { kind: "artifact" }>): LucideIcon | null {
  return item.categoryIcon ? getLucideIconByName(item.categoryIcon, StickyNote) : null;
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("de-AT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getRecipeSearchText(recipe: Recipe) {
  return normalizeSearchText(
    [
      recipe.title,
      getRecipeEntryTypeLabel(recipe),
      recipe.entryType,
      recipe.shortDescription,
      recipe.story,
      recipe.author,
      recipe.category,
      ...recipe.categories,
      ...recipe.tags,
      ...recipe.ingredients.flatMap((ingredient) => [ingredient.name, ingredient.unit, ingredient.note ?? ""]),
      ...recipe.steps.map((step) => step.instruction),
      ...recipe.tips,
      ...recipe.notesFromOriginal,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getArtifactSearchText(item: CollectedBookItem) {
  const artifactType = normalizeArtifactType(item.type);

  return normalizeSearchText(
    [item.title, getArtifactTypeLabel(artifactType), artifactType, item.description, item.caption ?? "", item.registerLetter]
      .filter(Boolean)
      .join(" "),
  );
}

function getIngredientMatches(recipe: Recipe, normalizedQuery: string) {
  if (!normalizedQuery) {
    return recipe.ingredients.slice(0, 4).map((ingredient) => ingredient.name);
  }

  return recipe.ingredients
    .filter((ingredient) =>
      normalizeSearchText([ingredient.name, ingredient.unit, ingredient.note ?? ""].join(" ")).includes(normalizedQuery),
    )
    .slice(0, 4)
    .map((ingredient) => ingredient.name);
}

function getDifficultyLabel(recipe: Recipe) {
  if (recipe.difficulty === "mittel") {
    return "Fortgeschritten";
  }

  if (recipe.difficulty === "anspruchsvoll") {
    return "Nonna";
  }

  return "Einfach";
}

function getDifficultyLevel(recipe: Recipe) {
  if (recipe.difficulty === "anspruchsvoll") {
    return 3;
  }

  if (recipe.difficulty === "mittel") {
    return 2;
  }

  return 1;
}

function formatAmount(amount: number, multiplier: number) {
  const value = amount * multiplier;

  if (Number.isInteger(value)) {
    return value.toString();
  }

  const rounded = Math.round(value * 4) / 4;

  return rounded.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function getLettersWithEntries(recipes: Recipe[]) {
  const letters = new Set(recipes.map((recipe) => recipe.registerLetter));
  const artifactItems = syncedCollectedBookItems.length ? syncedCollectedBookItems : collectedBookItems;
  artifactItems.forEach((item) => letters.add(item.registerLetter));
  return letters;
}

function getRegisterHash(letter: string) {
  return `#/register/${encodeURIComponent(letter)}`;
}

function getItemHash(item: BoardItem) {
  const registerHash = getRegisterHash(item.registerLetter);

  if (item.kind === "recipe") {
    return `${registerHash}/recipe/${encodeURIComponent(item.recipe.slug)}`;
  }

  if (item.kind === "recipe-card") {
    return `${registerHash}/card/${encodeURIComponent(item.recipe.slug)}`;
  }

  return `${registerHash}/artifact/${encodeURIComponent(item.id.replace(/^artifact-/, ""))}`;
}

function createSearchableRegisterItems(recipes: Recipe[], normalizedQuery: string): SearchableRegisterItem[] {
  const recipeItems = recipes.map<SearchableRegisterItem>((recipe) => {
    const isRecipeCardOnly = recipe.entryType === "rezeptkarte";
    const typeLabel = getRecipeEntryTypeLabel(recipe);
    const ingredientMatches = getIngredientMatches(recipe, normalizedQuery);
    const categoryLabel = recipe.entryType === "rezept" ? getRecipeCategoryLabel(recipe) : recipe.category;
    const metaParts = [typeLabel, categoryLabel, ...ingredientMatches].filter(Boolean) as string[];
    const color = isRecipeCardOnly
      ? recipe.cardColor ?? recipeCardOnlyColor
      : recipe.cardColor ?? recipeColorOverrides[recipe.slug] ?? cardColors[0];

    return {
      id: `${isRecipeCardOnly ? "recipe-card" : "recipe"}-${recipe.slug}`,
      itemId: `${isRecipeCardOnly ? "recipe-card" : "recipe"}-${recipe.slug}`,
      href: `${getRegisterHash(recipe.registerLetter)}/${isRecipeCardOnly ? "card" : "recipe"}/${encodeURIComponent(recipe.slug)}`,
      title: recipe.title,
      description: recipe.shortDescription || recipe.story || typeLabel,
      registerLetter: recipe.registerLetter,
      typeLabel,
      color,
      icon: getRecipeEntryTypeIcon(recipe),
      metaParts,
      searchText: getRecipeSearchText(recipe),
    };
  });

  const artifactItems = (syncedCollectedBookItems.length ? syncedCollectedBookItems : collectedBookItems).map<
    SearchableRegisterItem
  >((item) => {
    const artifactType = normalizeArtifactType(item.type);
    const typeLabel = getArtifactTypeLabel(artifactType);

    return {
      id: `artifact-${item.id}`,
      itemId: `artifact-${item.id}`,
      href: `${getRegisterHash(item.registerLetter)}/artifact/${encodeURIComponent(item.id)}`,
      title: item.title,
      description: item.description || item.caption || typeLabel,
      registerLetter: item.registerLetter,
      typeLabel,
      color: getArtifactColor(artifactType),
      icon: getArtifactTypeIcon(artifactType),
      metaParts: [typeLabel, item.caption ?? ""].filter(Boolean),
      searchText: getArtifactSearchText(item),
    };
  });

  return [...recipeItems, ...artifactItems].sort((itemA, itemB) => itemA.title.localeCompare(itemB.title, "de-AT"));
}

function parseRegisterHash(hash: string, fallbackLetter: string): RegisterRouteState {
  const fallbackRoute: RegisterRouteState = {
    activeLetter: fallbackLetter,
    selectedItemId: null,
  };
  const segments = hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  if (segments.length === 0) {
    return fallbackRoute;
  }

  if (segments[0] !== "register" || !segments[1]) {
    return fallbackRoute;
  }

  const activeLetter = segments[1];
  const itemType = segments[2];
  const itemSlug = segments[3];

  if (itemType === "recipe" && itemSlug) {
    return {
      activeLetter,
      selectedItemId: `recipe-${itemSlug}`,
    };
  }

  if (itemType === "card" && itemSlug) {
    return {
      activeLetter,
      selectedItemId: `recipe-card-${itemSlug}`,
    };
  }

  if (itemType === "artifact" && itemSlug) {
    return {
      activeLetter,
      selectedItemId: `artifact-${itemSlug}`,
    };
  }

  return {
    activeLetter,
    selectedItemId: null,
  };
}

function replaceRegisterHash(hash: string) {
  window.history.replaceState(null, "", hash);
}

function pushRegisterHash(hash: string) {
  window.history.pushState(null, "", hash);
}

function registerEntryHasContent(entry: RegisterEntry, lettersWithEntries: Set<string>) {
  if (lettersWithEntries.has(entry.id)) {
    return true;
  }

  if ((entry.id === "I" || entry.id === "J") && lettersWithEntries.has("I/J")) {
    return true;
  }

  if ((entry.id === "X" || entry.id === "Y") && lettersWithEntries.has("X/Y")) {
    return true;
  }

  return false;
}

function getSeededRandom(seed: string, key: string) {
  let hash = 2166136261;
  const source = `${seed}:${key}`;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function getRandomizedBoardItem(item: BoardItem, seed: string, index: number): BoardItem {
  if (!seed) {
    return item;
  }

  const isRecipeLike = item.kind === "recipe" || item.kind === "recipe-card";
  const xOffset = (getSeededRandom(seed, `${item.id}:x`) - 0.5) * (isRecipeLike ? 12 : 16);
  const yOffset = (getSeededRandom(seed, `${item.id}:y`) - 0.5) * (isRecipeLike ? 18 : 24);
  const rotationOffset = (getSeededRandom(seed, `${item.id}:rotation`) - 0.5) * (isRecipeLike ? 3 : 5);

  return {
    ...item,
    rotation: item.rotation + rotationOffset,
    position: {
      x: clamp(item.position.x + xOffset, 3, isRecipeLike ? 62 : 78),
      y: clamp(item.position.y + yOffset + index * 0.6, 0, 160),
    },
  };
}

function applyRandomizedBoardLayout(items: BoardItem[], seed: string) {
  const randomizedItems = items.map((item, index) => getRandomizedBoardItem(item, seed, index));

  if (!seed) {
    return randomizedItems;
  }

  const randomLayerOrder = [...randomizedItems].sort((itemA, itemB) => {
    return getSeededRandom(seed, `${itemA.id}:layer`) - getSeededRandom(seed, `${itemB.id}:layer`);
  });
  const layerIndexes = new Map(randomLayerOrder.map((item, index) => [item.id, index + 1]));

  return randomizedItems.map((item) => ({
    ...item,
    layerIndex: layerIndexes.get(item.id) ?? item.layerIndex,
  }));
}

function createBoardItems(recipes: Recipe[], activeLetter: string, layoutSeed = ""): BoardItem[] {
  const recipesForLetter = recipes
    .filter((recipe) => recipe.registerLetter === activeLetter)
    .sort((recipeA, recipeB) => {
      if (activeLetter !== "E") {
        return 0;
      }

      const order = ["eiskonfekt", "eierlikoer"];

      return order.indexOf(recipeA.slug) - order.indexOf(recipeB.slug);
    });

  const recipeItems = recipesForLetter
    .map<BoardItem>((recipe, index) => {
      const isRecipeCardOnly = recipe.entryType === "rezeptkarte";

      return {
        id: `${isRecipeCardOnly ? "recipe-card" : "recipe"}-${recipe.slug}`,
        kind: isRecipeCardOnly ? "recipe-card" : "recipe",
        registerLetter: recipe.registerLetter,
        title: recipe.title,
        color: isRecipeCardOnly
          ? recipeCardOnlyColor
          : recipe.cardColor ?? recipeColorOverrides[recipe.slug] ?? cardColors[index % cardColors.length],
        rotation: 0,
        image: resolveImageSrc(recipe.originalCardImage),
        recipe,
        layerIndex: index + 1,
        position: defaultPositions[index] ?? {
          x: 8 + (index % 3) * 24,
          y: 14 + Math.floor(index / 3) * 24,
        },
      };
    });

  const artifactItems = syncedCollectedBookItems.length ? syncedCollectedBookItems : collectedBookItems;
  const collectedArtifactItems = artifactItems
    .filter((item) => item.registerLetter === activeLetter)
    .map<BoardItem>((item, index) => {
      const fallbackRecipe = recipes[(index + 1) % recipes.length] ?? recipes[0];
      const artifactType = normalizeArtifactType(item.type);

      return {
        id: `artifact-${item.id}`,
        kind: "artifact",
        registerLetter: item.registerLetter,
        title: item.title,
        description: item.description,
        caption: item.caption,
        captionLink: item.captionLink,
        color: index % 2 === 0 ? "#fff6df" : "#e7f3ef",
        rotation: 0,
        image: resolveImageSrc(item.image ?? fallbackRecipe?.originalCardImage),
        secondaryImage: item.secondaryImage ? resolveImageSrc(item.secondaryImage) : undefined,
        size: normalizeArtifactSize(item.size),
        categoryIcon: item.categoryIcon,
        artifactType,
        layerIndex: recipeItems.length + index + 1,
        position: defaultPositions[index + recipeItems.length] ?? {
          x: 18 + (index % 3) * 22,
          y: 54 + Math.floor(index / 3) * 22,
        },
      };
    });

  const exampleArtifactItems: BoardItem[] =
    !syncedCollectedBookItems.length && activeLetter === "E"
      ? [
          {
            id: "artifact-christus-ikone",
            kind: "artifact",
            registerLetter: "E",
            title: "Jesus Karte",
            description: "Auf der Rückseite stand: Immer schön fromm und fröhlich sein.",
            caption: "Ikonenbild, lose zwischen den E-Rezepten abgelegt.",
            captionLink: "https://commons.wikimedia.org/wiki/File:Spas_vsederzhitel_sinay.jpg",
            color: "#ffffff",
            rotation: 0,
            image: "/images/artifacts/jesus.png",
            size: "M",
            categoryIcon: "Image",
            artifactType: "bild",
            layerIndex: recipeItems.length + 1,
            position: { x: 46.8, y: 15.5 },
          },
          {
            id: "artifact-backin-packung",
            kind: "artifact",
            registerLetter: "E",
            title: "Backin Packung",
            description:
              "Ein ausgeschnittener Packungsrücken mit Eierlikörkuchen-Rezept, als Küchenfundstück eingeklebt.",
            caption: "Beispiel-Artefakt: Backpulver-Packung mit Eierlikörkuchen-Rezept.",
            color: "#ffffff",
            rotation: 0,
            image: "/images/artifacts/backin.png",
            size: "M",
            categoryIcon: "StickyNote",
            artifactType: "fundstueck",
            layerIndex: recipeItems.length + 2,
            position: { x: 15.6, y: 102.3 },
          },
        ]
      : [];

  return applyRandomizedBoardLayout([...recipeItems, ...exampleArtifactItems, ...collectedArtifactItems], layoutSeed);
}

function getEstimatedItemHeight(item: BoardItem) {
  if (item.kind === "recipe" || item.kind === "recipe-card") {
    return 430;
  }

  if (getArtifactDisplayClass(item) === "artifact-image") {
    return 520;
  }

  return 430;
}

function getArtifactDisplayClass(item: BoardItem) {
  if (item.kind !== "artifact") {
    return "";
  }

  return "artifact-image";
}

function normalizeArtifactSize(size: CollectedBookItem["size"]): ArtifactSize {
  return size === "S" || size === "L" || size === "XL" ? size : "M";
}

function getArtifactSizeClass(item: BoardItem) {
  if (item.kind !== "artifact") {
    return "";
  }

  return `artifact-size-${item.size.toLowerCase()}`;
}

function getItemTopPx(position: BoardPosition) {
  return Math.round(registerPagePadding + (position.y / 100) * registerContentHeight);
}

function getItemYFromTopPx(top: number) {
  return ((top - registerPagePadding) / registerContentHeight) * 100;
}

function getRegisterPageHeight(requiredHeight: number) {
  const contentHeight = Math.max(0, requiredHeight - registerPagePadding * 2);

  return registerPagePadding * 2 + Math.ceil(contentHeight / registerLineHeight) * registerLineHeight;
}

function getPointDistance(pointA: ZoomPoint, pointB: ZoomPoint) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function getPointCenter(pointA: ZoomPoint, pointB: ZoomPoint): ZoomPoint {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}

function RegisterSideTabShape({ isIntro = false }: { isIntro?: boolean }) {
  const path = isIntro ? desktopIntroRegisterTabPath : desktopRegisterTabPath;
  const viewBox = isIntro ? "0 0 32 72.640625" : "0 0 32 52.640625";

  return (
    <svg
      aria-hidden="true"
      className="register-side-tab-shape"
      focusable="false"
      preserveAspectRatio="none"
      viewBox={viewBox}
    >
      <path d={path} />
    </svg>
  );
}

function RegisterMobileTabShape({ isWide = false }: { isWide?: boolean }) {
  const path = isWide ? mobileWideRegisterTabPath : mobileRegisterTabPath;
  const viewBox = isWide ? "0 0 44.125 32" : "0 0 34.125 32";

  return (
    <svg
      aria-hidden="true"
      className="register-mobile-tab-shape"
      focusable="false"
      preserveAspectRatio="none"
      viewBox={viewBox}
    >
      <path d={path} />
    </svg>
  );
}

function RegisterCover({
  isOpening,
  onOpen,
}: {
  isOpening: boolean;
  onOpen: () => void;
}) {
  const dragStartRef = useRef<ZoomPoint | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragStartRef.current || isOpening) {
      return;
    }

    const dragDistance = Math.hypot(
      event.clientX - dragStartRef.current.x,
      event.clientY - dragStartRef.current.y,
    );

    if (dragDistance > 10) {
      dragStartRef.current = null;
      onOpen();
    }
  }

  function handlePointerUp() {
    dragStartRef.current = null;
  }

  return (
    <div
      className={["register-launch-cover", isOpening ? "register-launch-cover-opening" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        aria-label="Registerbuch öffnen"
        className="register-launch-cover-button"
        disabled={isOpening}
        onClick={onOpen}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        type="button"
      >
        <span className="register-launch-book">
          <span className="register-launch-pages" aria-hidden="true" />
          <span className="register-launch-spine" aria-hidden="true" />
          <span className="register-launch-front">
            <span className="register-launch-linen-corner register-launch-linen-corner-top" aria-hidden="true" />
            <span className="register-launch-linen-corner register-launch-linen-corner-bottom" aria-hidden="true" />
            <Image
              alt="Register-Buch, Mariannes Rezeptschatz"
              className="register-launch-label"
              draggable={false}
              height={1395}
              priority
              src="/images/brand/register-book-label.png"
              width={2222}
            />
          </span>
        </span>
      </button>
    </div>
  );
}

function RegisterFloatingMenu({
  onIntro,
  onSearch,
}: {
  onIntro: () => void;
  onSearch: () => void;
}) {
  return (
    <nav className="register-floating-menu" aria-label="Projektmenü">
      <button aria-label="Intro und Impressum öffnen" onClick={onIntro} type="button">
        <BookOpen aria-hidden="true" size={17} strokeWidth={1.9} />
        Intro
      </button>
      <button aria-label="Suche öffnen" onClick={onSearch} type="button">
        <Search aria-hidden="true" size={17} strokeWidth={1.9} />
        Suche
      </button>
    </nav>
  );
}

function RegisterIntroPanel() {
  return (
    <section className="register-intro-panel" aria-label="Intro und Impressum">
      <div className="register-intro-hero">
        <span>Intro & Impressum</span>
        <h2>Mariannes Rezeptschatz</h2>
        <div className="register-intro-copy">
          {introParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="register-info-sections register-intro-imprint">
        {imprintSections.map((section) => (
          <section className="register-info-section" key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function RegisterSearchPanel({
  onQueryChange,
  onSelectItem,
  query,
  recipes,
}: {
  onQueryChange: (query: string) => void;
  onSelectItem: (item: SearchableRegisterItem) => void;
  query: string;
  recipes: Recipe[];
}) {
  const normalizedQuery = normalizeSearchText(query.trim());
  const searchResults = useMemo(() => {
    const searchableItems = createSearchableRegisterItems(recipes, normalizedQuery);

    if (!normalizedQuery) {
      return searchableItems;
    }

    return searchableItems.filter((item) => item.searchText.includes(normalizedQuery));
  }, [normalizedQuery, recipes]);

  return (
    <section className="register-search-panel" aria-label="Suche">
      <div className="register-search-heading">
        <span>Suche</span>
        <h2>Einträge finden</h2>
      </div>

      <form className="register-search-form" onSubmit={(event) => event.preventDefault()} role="search">
        <label className="register-search-input-shell">
          <Search aria-hidden="true" size={20} strokeWidth={1.9} />
          <input
            autoFocus
            aria-label="Nach Zutaten oder Gerichten suchen"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Zutat, Gericht, Objekt"
            type="search"
            value={query}
          />
        </label>
      </form>

      <div className="register-search-results" aria-live="polite">
        <span className="register-search-count">
          {searchResults.length === 1 ? "1 Treffer" : `${searchResults.length} Treffer`}
        </span>

        {searchResults.length ? (
          <div className="register-search-result-list">
            {searchResults.map((item) => {
              const resultStyle = {
                "--search-result-color": item.color,
              } as CSSProperties;

              return (
                <button
                  className="register-search-result"
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  style={resultStyle}
                  type="button"
                >
                  <span className="register-search-result-icon">
                    {createElement(item.icon, { "aria-hidden": "true", size: 20, strokeWidth: 1.9 })}
                  </span>
                  <span className="register-search-result-body">
                    <strong>{item.title}</strong>
                    {item.description ? <span>{item.description}</span> : null}
                    {item.metaParts.length ? (
                      <small className="register-search-result-meta">
                        {item.metaParts.map((part) => (
                          <span key={part}>{part}</span>
                        ))}
                      </small>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="register-search-empty">Keine passenden Einträge gefunden.</p>
        )}
      </div>
    </section>
  );
}

function RegisterFloatingPanel({
  onClose,
  onQueryChange,
  onSelectItem,
  query,
  recipes,
  type,
}: {
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelectItem: (item: SearchableRegisterItem) => void;
  query: string;
  recipes: Recipe[];
  type: FloatingPanelType;
}) {
  return (
    <div className="register-floating-panel-backdrop" onClick={onClose} role="presentation">
      <article
        className={["register-floating-panel", `register-floating-panel-${type}`].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Fenster schließen"
          className="register-floating-panel-close"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.1} />
        </button>
        {type === "intro" ? (
          <RegisterIntroPanel />
        ) : (
          <RegisterSearchPanel
            onQueryChange={onQueryChange}
            onSelectItem={onSelectItem}
            query={query}
            recipes={recipes}
          />
        )}
      </article>
    </div>
  );
}

function ZoomableImage({
  alt,
  className,
  controlsAddon,
  priority,
  sizes,
  src,
}: {
  alt: string;
  className?: string;
  controlsAddon?: ReactNode;
  priority?: boolean;
  sizes: string;
  src: string;
}) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, ZoomPoint>());
  const lastDragPointRef = useRef<ZoomPoint | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<ZoomPoint | null>(null);

  function resetInteraction() {
    pointersRef.current.clear();
    lastDragPointRef.current = null;
    lastPinchDistanceRef.current = null;
    lastPinchCenterRef.current = null;
  }

  function resetZoom() {
    resetInteraction();
    setTransform({ scale: 1, x: 0, y: 0 });
  }

  function changeZoom(multiplier: number) {
    resetInteraction();
    setTransform((current) => ({
      ...current,
      scale: clamp(current.scale * multiplier, 1, 5),
    }));
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      pointersRef.current.clear();
      lastDragPointRef.current = null;
      lastPinchDistanceRef.current = null;
      lastPinchCenterRef.current = null;
      setTransform({ scale: 1, x: 0, y: 0 });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [src]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const points = Array.from(pointersRef.current.values());

    if (points.length === 1) {
      lastDragPointRef.current = points[0];
      lastPinchDistanceRef.current = null;
      lastPinchCenterRef.current = null;
    }

    if (points.length === 2) {
      lastPinchDistanceRef.current = getPointDistance(points[0], points[1]);
      lastPinchCenterRef.current = getPointCenter(points[0], points[1]);
      lastDragPointRef.current = null;
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) {
      return;
    }

    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(pointersRef.current.values());

    if (points.length === 1 && lastDragPointRef.current) {
      const nextPoint = points[0];
      const deltaX = nextPoint.x - lastDragPointRef.current.x;
      const deltaY = nextPoint.y - lastDragPointRef.current.y;

      lastDragPointRef.current = nextPoint;
      setTransform((current) => ({
        ...current,
        x: current.x + deltaX,
        y: current.y + deltaY,
      }));
    }

    if (points.length === 2 && lastPinchDistanceRef.current && lastPinchCenterRef.current) {
      const nextDistance = getPointDistance(points[0], points[1]);
      const nextCenter = getPointCenter(points[0], points[1]);
      const scaleDelta = nextDistance / lastPinchDistanceRef.current;
      const centerDeltaX = nextCenter.x - lastPinchCenterRef.current.x;
      const centerDeltaY = nextCenter.y - lastPinchCenterRef.current.y;

      lastPinchDistanceRef.current = nextDistance;
      lastPinchCenterRef.current = nextCenter;
      setTransform((current) => ({
        scale: clamp(current.scale * scaleDelta, 1, 5),
        x: current.x + centerDeltaX,
        y: current.y + centerDeltaY,
      }));
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pointersRef.current.delete(event.pointerId);
    const points = Array.from(pointersRef.current.values());

    if (points.length === 1) {
      lastDragPointRef.current = points[0];
      lastPinchDistanceRef.current = null;
      lastPinchCenterRef.current = null;
      return;
    }

    if (points.length === 2) {
      lastPinchDistanceRef.current = getPointDistance(points[0], points[1]);
      lastPinchCenterRef.current = getPointCenter(points[0], points[1]);
      lastDragPointRef.current = null;
      return;
    }

    resetInteraction();
  }

  const zoomControls = (
    <div className="zoomable-image-controls">
      <button aria-label="Verkleinern" onClick={() => changeZoom(0.82)} type="button">
        <Minus aria-hidden="true" size={17} strokeWidth={2.2} />
      </button>
      <button aria-label="Zoom zurücksetzen und zentrieren" onClick={resetZoom} type="button">
        <Minimize2 aria-hidden="true" size={17} strokeWidth={2.1} />
      </button>
      <button aria-label="Vergrößern" onClick={() => changeZoom(1.22)} type="button">
        <Plus aria-hidden="true" size={17} strokeWidth={2.2} />
      </button>
    </div>
  );

  return (
    <div
      aria-label={`${alt} vergrößern und verschieben`}
      className={["zoomable-image", className].filter(Boolean).join(" ")}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="group"
    >
      <div className="zoomable-image-motion">
        <div
          className="zoomable-image-visual"
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          }}
        >
          <Image
            alt={alt}
            className="zoomable-image-media"
            draggable={false}
            fill
            priority={priority}
            sizes={sizes}
            src={src}
          />
        </div>
      </div>

      {controlsAddon ? (
        <div
          className="zoomable-image-tool-row"
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {zoomControls}
          {controlsAddon}
        </div>
      ) : (
        <div
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {zoomControls}
        </div>
      )}
    </div>
  );
}

export function RecipeRegisterBook({ recipes }: RecipeRegisterBookProps) {
  const lettersWithEntries = useMemo(() => getLettersWithEntries(recipes), [recipes]);
  const firstAvailableRegisterLetter =
    registerEntries.find((entry) => entry.type === "letter" && registerEntryHasContent(entry, lettersWithEntries))?.id ??
    "E";
  const [activeLetter, setActiveLetter] = useState<string>(firstAvailableRegisterLetter);
  const [layoutSeed, setLayoutSeed] = useState("");
  const [isCoverVisible, setIsCoverVisible] = useState(true);
  const [isCoverOpening, setIsCoverOpening] = useState(false);
  const [floatingPanel, setFloatingPanel] = useState<FloatingPanelType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [positions, setPositions] = useState<Record<string, BoardPosition>>({});
  const [zIndexes, setZIndexes] = useState<Record<string, number>>({});
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [selectedItemIdFromRoute, setSelectedItemIdFromRoute] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const zIndexCounterRef = useRef(1000);
  const lastInteractionMovedRef = useRef(false);
  const coverOpenTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const previousStyle = document.getElementById(liquidGlassRuntimeStyleId);

    if (previousStyle) {
      previousStyle.remove();
    }

    const style = document.createElement("style");
    style.id = liquidGlassRuntimeStyleId;
    style.textContent = `
${liquidGlassRuntimeSelectors} {
  backdrop-filter: blur(20px) saturate(1.16) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.16) !important;
}

.recipe-detail-backdrop::before,
.register-floating-panel-backdrop {
  backdrop-filter: blur(20px) saturate(1.16) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.16) !important;
}
`;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLayoutSeed(`${Date.now()}-${Math.random()}`);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    return () => {
      if (coverOpenTimeoutRef.current) {
        window.clearTimeout(coverOpenTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function applyRouteFromHash() {
      const hash = window.location.hash;
      const routeKey = hash.replace(/^#\/?/, "").split("/").filter(Boolean)[0];

      if (!hash || hash === "#" || hash === "#/") {
        setActiveLetter(firstAvailableRegisterLetter);
        setIsCoverVisible(true);
        setIsCoverOpening(false);
        setFloatingPanel(null);
        setSelectedItem(null);
        setSelectedItemIdFromRoute(null);
        return;
      }

      if (routeKey === "intro") {
        setActiveLetter(firstAvailableRegisterLetter);
        setIsCoverVisible(false);
        setIsCoverOpening(false);
        setFloatingPanel("intro");
        setSelectedItem(null);
        setSelectedItemIdFromRoute(null);
        return;
      }

      if (routeKey === "info") {
        replaceRegisterHash("#/intro");
        setActiveLetter(firstAvailableRegisterLetter);
        setIsCoverVisible(false);
        setIsCoverOpening(false);
        setFloatingPanel("intro");
        setSelectedItem(null);
        setSelectedItemIdFromRoute(null);
        return;
      }

      if (routeKey === "search") {
        setActiveLetter(firstAvailableRegisterLetter);
        setIsCoverVisible(false);
        setIsCoverOpening(false);
        setFloatingPanel("search");
        setSelectedItem(null);
        setSelectedItemIdFromRoute(null);
        return;
      }

      const route = parseRegisterHash(hash, firstAvailableRegisterLetter);
      const nextEntry = registerEntries.find((entry) => entry.id === route.activeLetter);

      if (!nextEntry || !registerEntryHasContent(nextEntry, lettersWithEntries)) {
        replaceRegisterHash(getRegisterHash(firstAvailableRegisterLetter));
        setActiveLetter(firstAvailableRegisterLetter);
        setIsCoverVisible(false);
        setIsCoverOpening(false);
        setFloatingPanel(null);
        setSelectedItem(null);
        setSelectedItemIdFromRoute(null);
        return;
      }

      setActiveLetter(route.activeLetter);
      setIsCoverVisible(false);
      setIsCoverOpening(false);
      setFloatingPanel(null);
      setSelectedItemIdFromRoute(route.selectedItemId);

      if (!route.selectedItemId) {
        setSelectedItem(null);
      }
    }

    applyRouteFromHash();
    window.addEventListener("hashchange", applyRouteFromHash);
    window.addEventListener("popstate", applyRouteFromHash);

    return () => {
      window.removeEventListener("hashchange", applyRouteFromHash);
      window.removeEventListener("popstate", applyRouteFromHash);
    };
  }, [firstAvailableRegisterLetter, lettersWithEntries]);

  const boardItems = useMemo(
    () => createBoardItems(recipes, activeLetter, layoutSeed),
    [activeLetter, layoutSeed, recipes],
  );

  useEffect(() => {
    if (!selectedItemIdFromRoute) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const routedItem = boardItems.find((item) => item.id === selectedItemIdFromRoute);
      setSelectedItem(routedItem ?? null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [boardItems, selectedItemIdFromRoute]);
  const activeRegisterBackground = "#fffffa";
  const activeOverscrollBackground =
    selectedItem?.kind === "recipe" || selectedItem?.kind === "recipe-card"
      ? selectedItem.color
      : selectedItem?.kind === "artifact"
        ? "#f5f4f0"
        : activeRegisterBackground;
  const canvasMinHeight = useMemo(() => {
    if (boardItems.length === 0) {
      return 1117;
    }

    const defaultLayoutHeight = Math.max(
      ...boardItems.map((item) => {
        return getItemTopPx(item.position) + getEstimatedItemHeight(item) + registerPagePadding;
      }),
    );
    const densityHeight = registerPageBaseHeight + Math.max(0, Math.ceil(boardItems.length / 2) - 2) * 260;

    return getRegisterPageHeight(Math.max(registerPageBaseHeight, defaultLayoutHeight, densityHeight));
  }, [boardItems]);

  useEffect(() => {
    document.documentElement.style.setProperty("--rezeptschatz-overscroll-bg", activeOverscrollBackground);
    document.documentElement.style.background = activeOverscrollBackground;
    document.body.style.background = activeOverscrollBackground;

    return () => {
      document.documentElement.style.removeProperty("--rezeptschatz-overscroll-bg");
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, [activeOverscrollBackground]);

  function getItemPosition(item: BoardItem) {
    return positions[item.id] ?? item.position;
  }

  function bringItemToFront(itemId: string) {
    zIndexCounterRef.current += 1;
    setZIndexes((current) => ({
      ...current,
      [itemId]: zIndexCounterRef.current,
    }));
  }

  function handleLetterChange(letter: string) {
    const nextEntry = registerEntries.find((entry) => entry.id === letter);

    if (!nextEntry || !registerEntryHasContent(nextEntry, lettersWithEntries)) {
      return;
    }

    setIsCoverVisible(false);
    setIsCoverOpening(false);
    setFloatingPanel(null);
    pushRegisterHash(getRegisterHash(letter));
    setActiveLetter(letter);
    setSelectedItem(null);
    setSelectedItemIdFromRoute(null);
  }

  function handleCoverOpen() {
    if (isCoverOpening) {
      return;
    }

    setIsCoverOpening(true);
    coverOpenTimeoutRef.current = window.setTimeout(() => {
      setIsCoverVisible(false);
      setIsCoverOpening(false);
      setFloatingPanel(null);
      setActiveLetter(firstAvailableRegisterLetter);
      setSelectedItem(null);
      setSelectedItemIdFromRoute(null);
      pushRegisterHash(getRegisterHash(firstAvailableRegisterLetter));
    }, 1420);
  }

  function openFloatingPanel(type: FloatingPanelType) {
    setIsCoverVisible(false);
    setIsCoverOpening(false);
    setSelectedItem(null);
    setSelectedItemIdFromRoute(null);
    setFloatingPanel(type);
    pushRegisterHash(type === "intro" ? "#/intro" : "#/search");
  }

  function closeFloatingPanel() {
    setFloatingPanel(null);
    pushRegisterHash(getRegisterHash(activeLetter));
  }

  function openItemFromSearch(item: SearchableRegisterItem) {
    setIsCoverVisible(false);
    setIsCoverOpening(false);
    setFloatingPanel(null);
    setActiveLetter(item.registerLetter);
    setSelectedItem(null);
    setSelectedItemIdFromRoute(item.itemId);
    pushRegisterHash(item.href);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, item: BoardItem) {
    if (event.button !== 0) {
      return;
    }

    const itemRect = event.currentTarget.getBoundingClientRect();

    bringItemToFront(item.id);
    setDraggingItemId(item.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: getItemPosition(item),
      itemWidth: itemRect.width,
      itemHeight: itemRect.height,
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const board = boardRef.current;

    if (!drag || !board) {
      return;
    }

    const boardRect = board.getBoundingClientRect();
    const isMobileLayout = window.matchMedia("(max-width: 700px)").matches;
    const lineInset = 16;
    const mobileHiddenWidth = drag.itemWidth * (1 - mobileMinimumVisibleRatio);
    const minLeftPx = isMobileLayout ? -mobileHiddenWidth : lineInset;
    const maxLeftPx = isMobileLayout
      ? boardRect.width - drag.itemWidth * mobileMinimumVisibleRatio
      : boardRect.width - lineInset - drag.itemWidth;
    const canvasHeight = board.scrollHeight || boardRect.height;
    const minTopPx = registerPagePadding;
    const maxTopPx = Math.max(minTopPx, canvasHeight - registerPagePadding - drag.itemHeight);
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const nextLeftPx = (drag.startPosition.x / 100) * boardRect.width + deltaX;
    const nextTopPx = getItemTopPx(drag.startPosition) + deltaY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true;
    }

    setPositions((current) => ({
      ...current,
      [drag.id]: {
        x: (clamp(nextLeftPx, minLeftPx, Math.max(minLeftPx, maxLeftPx)) / boardRect.width) * 100,
        y: getItemYFromTopPx(clamp(nextTopPx, minTopPx, maxTopPx)),
      },
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>, item: BoardItem) {
    const moved = dragRef.current?.moved;
    lastInteractionMovedRef.current = Boolean(moved);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setDraggingItemId(null);

    if (!moved) {
      pushRegisterHash(getItemHash(item));
      setSelectedItem(item);
      setSelectedItemIdFromRoute(item.id);
      lastInteractionMovedRef.current = true;
    }
  }

  function handleCardClick(item: BoardItem) {
    if (!lastInteractionMovedRef.current) {
      pushRegisterHash(getItemHash(item));
      setSelectedItem(item);
      setSelectedItemIdFromRoute(item.id);
    }

    lastInteractionMovedRef.current = false;
  }

  function closeSelectedItem() {
    pushRegisterHash(getRegisterHash(activeLetter));
    setSelectedItem(null);
    setSelectedItemIdFromRoute(null);
  }

  return (
    <section
      className="register-book-stage"
      aria-label="Mariannes Rezeptschatz"
      style={{ "--register-active-bg": activeRegisterBackground } as CSSProperties}
    >
      <div className="register-book-frame">
        <nav className="register-mobile-tabs" aria-label="Register">
          {registerEntries.map((entry, index) => {
            const hasEntry = registerEntryHasContent(entry, lettersWithEntries);
            const ariaLabel = `Register ${entry.label}`;

            return (
              <button
                className={[
                  "register-mobile-tab",
                  entry.label.length > 1 ? "register-mobile-tab-wide" : "",
                  hasEntry ? "register-mobile-tab-filled" : "",
                  !hasEntry ? "register-mobile-tab-disabled" : "",
                  activeLetter === entry.id ? "register-mobile-tab-active" : "",
                ].join(" ")}
                aria-label={ariaLabel}
                aria-disabled={!hasEntry}
                disabled={!hasEntry}
                key={entry.id}
                onClick={() => handleLetterChange(entry.id)}
                style={
                  {
                    "--register-tab-stack": registerEntries.length - index,
                  } as CSSProperties
                }
                type="button"
              >
                <RegisterMobileTabShape isWide={entry.label.length > 1} />
                <span className="register-mobile-tab-label">{entry.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="recipe-register-page">
          <div className="recipe-register-paper" ref={boardRef}>
            <div
              className="recipe-register-canvas"
              style={
                {
                  "--register-canvas-min-height": `${canvasMinHeight}px`,
                } as CSSProperties
              }
            >
              {boardItems.length === 0 ? null : (
                boardItems.map((item) => {
                  const position = getItemPosition(item);
                  const itemTypeIcon = getBoardItemTypeIcon(item);
                  const categoryIcon = item.kind === "recipe" ? getRecipeIcon(item.recipe) : null;
                  const categoryLabel = item.kind === "recipe" ? getRecipeCategoryLabel(item.recipe) : null;
                  const artifactTitleIcon = item.kind === "artifact" ? getArtifactTitleIcon(item) : null;

                  return (
                    <button
                      className={[
                        "register-board-card",
                        item.kind === "artifact" ? "register-board-artifact" : "",
                        getArtifactDisplayClass(item),
                        getArtifactSizeClass(item),
                        draggingItemId === item.id ? "register-board-card-dragging" : "",
                      ].join(" ")}
                      key={item.id}
                      onClick={() => handleCardClick(item)}
                      onPointerDown={(event) => handlePointerDown(event, item)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={(event) => handlePointerUp(event, item)}
                      style={{
                        "--card-bg": item.color,
                        "--card-rotation": `${item.rotation}deg`,
                        left: `${position.x}%`,
                        top: `${getItemTopPx(position)}px`,
                        zIndex: zIndexes[item.id] ?? item.layerIndex,
                      } as CSSProperties}
                      type="button"
                    >
                      <span className="register-card-pin" aria-hidden="true" />
                      <span className="register-card-image">
                        {item.kind === "artifact" ? (
                          <img alt={item.title} draggable={false} src={item.image} />
                        ) : (
                          <Image
                            alt={`Originalkarte ${item.title}`}
                            draggable={false}
                            fill
                            sizes="(max-width: 700px) 90vw, 420px"
                            src={item.image}
                          />
                        )}
                      </span>
                      <span className="register-card-meta">
                        {item.kind === "recipe" ? (
                          <>
                            <span className="register-card-chip">
                              {createElement(itemTypeIcon, { "aria-hidden": "true", size: 17, strokeWidth: 1.9 })}
                              {item.title}
                            </span>
                            {categoryIcon && categoryLabel ? (
                              <span className="register-card-chip">
                                {createElement(categoryIcon, { "aria-hidden": "true", size: 17, strokeWidth: 1.9 })}
                                {categoryLabel}
                              </span>
                            ) : null}
                            <span className="register-card-chip">
                              <Clock3 aria-hidden="true" size={17} strokeWidth={1.9} />
                              {getCardTimeLabel(item.recipe)}
                            </span>
                          </>
                        ) : item.kind === "recipe-card" ? (
                          <>
                            <span className="register-card-chip">
                              {createElement(itemTypeIcon, { "aria-hidden": "true", size: 17, strokeWidth: 1.9 })}
                              {item.title}
                            </span>
                            <span className="register-card-chip">
                              <ReceiptText aria-hidden="true" size={17} strokeWidth={1.9} />
                              Originalrezept
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="register-card-chip">
                              {artifactTitleIcon
                                ? createElement(artifactTitleIcon, {
                                    "aria-hidden": "true",
                                    size: 17,
                                    strokeWidth: 1.9,
                                  })
                                : null}
                              {item.title}
                            </span>
                            <span className="register-card-chip">
                              {createElement(itemTypeIcon, { "aria-hidden": "true", size: 17, strokeWidth: 1.9 })}
                              {getArtifactTypeLabel(item.artifactType)}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <nav
            className="register-side-tabs"
            aria-label="Register"
          >
            {registerEntries.map((entry, index) => {
              const hasEntry = registerEntryHasContent(entry, lettersWithEntries);
              const ariaLabel = `Register ${entry.label}`;

              return (
                <button
                  className={[
                    "register-side-tab",
                    "register-side-tab-letter",
                    entry.label.length > 1 ? "register-side-tab-wide" : "",
                    hasEntry ? "register-side-tab-filled" : "",
                    !hasEntry ? "register-side-tab-disabled" : "",
                    activeLetter === entry.id ? "register-side-tab-active" : "",
                  ].join(" ")}
                  aria-label={ariaLabel}
                  aria-disabled={!hasEntry}
                  disabled={!hasEntry}
                  key={entry.id}
                  onClick={() => handleLetterChange(entry.id)}
                  style={
                    {
                      "--register-tab-stack": registerEntries.length - index,
                    } as CSSProperties
                  }
                  type="button"
                >
                  <RegisterSideTabShape />
                  <span className="register-side-tab-label">{entry.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {isCoverVisible ? <RegisterCover isOpening={isCoverOpening} onOpen={handleCoverOpen} /> : null}

      {!isCoverVisible ? (
        <RegisterFloatingMenu
          onIntro={() => openFloatingPanel("intro")}
          onSearch={() => openFloatingPanel("search")}
        />
      ) : null}

      {floatingPanel ? (
        <RegisterFloatingPanel
          onClose={closeFloatingPanel}
          onQueryChange={setSearchQuery}
          onSelectItem={openItemFromSearch}
          query={searchQuery}
          recipes={recipes}
          type={floatingPanel}
        />
      ) : null}

      {selectedItem ? (
        <div
          className="recipe-detail-backdrop"
          onClick={closeSelectedItem}
          role="presentation"
        >
          <article
            className="recipe-detail-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            {selectedItem.kind === "recipe" ? (
              <RecipeDetail
                color={selectedItem.color}
                onClose={closeSelectedItem}
                recipe={selectedItem.recipe}
              />
            ) : selectedItem.kind === "recipe-card" ? (
              <RecipeCardDetail item={selectedItem} onClose={closeSelectedItem} />
            ) : (
              <ArtifactDetail item={selectedItem} onClose={closeSelectedItem} />
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}

function RecipeDetail({
  color,
  onClose,
  recipe,
}: {
  color: string;
  onClose: () => void;
  recipe: Recipe;
}) {
  const [servings, setServings] = useState(recipe.servingsDefault);
  const [visualMode, setVisualMode] = useState<"recipe" | "photo">("recipe");
  const servingsMultiplier = servings / recipe.servingsDefault;
  const recipeIcon = getRecipeIcon(recipe);
  const servingsUnit = getServingsUnit(recipe);
  const authorLabel = getRecipeAuthorLabel(recipe);
  const hasPhoto = Boolean(recipe.photoImage);
  const hasIngredients = recipe.ingredients.length > 0;
  const hasSteps = recipe.steps.length > 0;
  const hasTips = recipe.tips.length > 0;
  const hasContentSections = hasIngredients || hasSteps || hasTips;
  const visualImage =
    visualMode === "photo" && recipe.photoImage ? recipe.photoImage : resolveImageSrc(recipe.originalCardImage);
  const visualAlt =
    visualMode === "photo" ? `Foto zu ${recipe.title}` : `Originalkarte ${recipe.title}`;

  function changeServings(nextServings: number) {
    setServings(clamp(nextServings, 1, 99));
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisualMode("recipe");
      setServings(recipe.servingsDefault);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [recipe.servingsDefault, recipe.slug]);

  return (
    <div
      className="recipe-view-card"
      style={{ "--recipe-view-bg": color } as CSSProperties}
    >
      <header className="recipe-view-toolbar">
        <div className="recipe-view-toolbar-group">
          <span className="recipe-view-chip">
            {createElement(recipeIcon, { "aria-hidden": "true", size: 18, strokeWidth: 1.9 })}
            {recipe.title}
          </span>
          <span className="recipe-view-chip">
            <Clock3 aria-hidden="true" size={18} strokeWidth={1.9} />
            {getCardTimeLabel(recipe)}
          </span>
        </div>

        <button
          aria-label="Rezept schließen"
          className="recipe-view-close"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.1} />
        </button>
      </header>

      <div className={["recipe-view-graphic", hasPhoto ? "" : "recipe-view-graphic-single-tool"].filter(Boolean).join(" ")}>
        <div
          className={[
            "recipe-view-original",
            visualMode === "photo" && hasPhoto ? "recipe-view-photo" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ZoomableImage
            alt={visualAlt}
            priority
            sizes="(max-width: 900px) 92vw, 870px"
            src={visualImage}
          />
        </div>
        {hasPhoto ? (
          <div className="recipe-view-mode-switch" aria-label="Ansicht wählen">
            <button
              aria-label="Originalrezept anzeigen"
              aria-pressed={visualMode === "recipe"}
              className={visualMode === "recipe" ? "recipe-view-mode-active" : undefined}
              onClick={() => setVisualMode("recipe")}
              type="button"
            >
              <ReceiptText aria-hidden="true" size={18} strokeWidth={1.9} />
            </button>
            <button
              aria-label="Foto anzeigen"
              aria-pressed={visualMode === "photo"}
              className={visualMode === "photo" ? "recipe-view-mode-active" : undefined}
              onClick={() => setVisualMode("photo")}
              type="button"
            >
              <ImageIcon aria-hidden="true" size={18} strokeWidth={1.9} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="recipe-view-content">
        <section className="recipe-view-intro">
          <h1>{recipe.title}</h1>
          <p className="recipe-detail-story">{recipe.story}</p>

          <div className="recipe-detail-facts">
            {hasIngredients ? (
              <div className="servings-controls" aria-label="Portionen anpassen">
                <button
                  aria-label="Eine Portion weniger"
                  onClick={() => changeServings(servings - 1)}
                  type="button"
                >
                  <Minus aria-hidden="true" size={18} strokeWidth={2.2} />
                </button>
                <span>{servings} {servingsUnit}</span>
                <button
                  aria-label="Eine Portion mehr"
                  onClick={() => changeServings(servings + 1)}
                  type="button"
                >
                  <Plus aria-hidden="true" size={18} strokeWidth={2.2} />
                </button>
              </div>
            ) : null}
            <span>
              {getDifficultyLabel(recipe)}
              <span className="recipe-difficulty-icons" aria-hidden="true">
                {[1, 2, 3].map((level) => (
                  <ChefHat
                    className={
                      level <= getDifficultyLevel(recipe)
                        ? "recipe-difficulty-icon-active"
                        : "recipe-difficulty-icon-muted"
                    }
                    key={level}
                    size={18}
                    strokeWidth={1.9}
                  />
                ))}
              </span>
            </span>
            <span>
              {createElement(recipeIcon, { "aria-hidden": "true", size: 18, strokeWidth: 1.9 })}
              {getRecipeCategoryLabel(recipe)}
            </span>
            <span>
              <CircleUser aria-hidden="true" size={18} strokeWidth={1.9} />
              {authorLabel}
            </span>
          </div>
        </section>

        {hasContentSections ? (
          <div className="recipe-detail-sections">
            {hasIngredients ? (
              <section className="recipe-content-panel recipe-ingredients-panel">
                <div className="recipe-panel-header">
                  <h2>Zutaten:</h2>
                </div>
                <ul className="recipe-ingredient-list">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={`${recipe.slug}-${ingredient.name}`}>
                      <span>
                        {formatAmount(ingredient.amount, servingsMultiplier)} {ingredient.unit}
                      </span>
                      <div className="recipe-ingredient-text">
                        <strong>{ingredient.name}{ingredient.note ? "," : ""}</strong>
                        {ingredient.note ? <span>{ingredient.note}</span> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasSteps ? (
              <section className="recipe-content-panel">
                <h2>Zubereitung:</h2>
                <ol className="recipe-step-list">
                  {recipe.steps.map((step) => (
                    <li key={step.number}>
                      <span>{step.number}.</span>
                      <p>{step.instruction}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {hasTips ? (
              <section className="recipe-content-panel recipe-tips-panel">
                <h2>Tipps:</h2>
                <div className="recipe-tip-list">
                  {recipe.tips.map((tip) => (
                    <p key={tip}>{tip}</p>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RecipeCardDetail({
  item,
  onClose,
}: {
  item: Extract<BoardItem, { kind: "recipe-card" }>;
  onClose: () => void;
}) {
  const itemTypeIcon = getRecipeEntryTypeIcon(item.recipe);

  return (
    <div
      className="recipe-view-card recipe-card-only-view"
      style={{ "--recipe-view-bg": item.color } as CSSProperties}
    >
      <header className="recipe-view-toolbar">
        <div className="recipe-view-toolbar-group">
          <span className="recipe-view-chip">
            {createElement(itemTypeIcon, { "aria-hidden": "true", size: 18, strokeWidth: 1.9 })}
            {item.title}
          </span>
          <span className="recipe-view-chip">Originalkarte</span>
        </div>

        <button
          aria-label="Rezeptkarte schließen"
          className="recipe-view-close"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.1} />
        </button>
      </header>

      <div className="recipe-view-graphic recipe-view-graphic-single-tool">
        <div className="recipe-view-original">
          <ZoomableImage
            alt={`Originalkarte ${item.title}`}
            priority
            sizes="(max-width: 900px) 92vw, 870px"
            src={item.image}
          />
        </div>
      </div>

      {item.recipe.story ? (
        <div className="recipe-view-content recipe-card-only-content">
          <section className="recipe-view-intro">
            <h1>{item.title}</h1>
            <p className="recipe-detail-story">{item.recipe.story}</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ArtifactDetail({
  item,
  onClose,
}: {
  item: Extract<BoardItem, { kind: "artifact" }>;
  onClose: () => void;
}) {
  const itemTypeIcon = getArtifactTypeIcon(item.artifactType);
  const titleIcon = getArtifactTitleIcon(item);
  const [sideState, setSideState] = useState<{
    activeSide: "front" | "back";
    hasSideTransition: boolean;
    itemId: string;
  }>(() => ({
    activeSide: "front",
    hasSideTransition: false,
    itemId: item.id,
  }));
  const activeSide = sideState.itemId === item.id ? sideState.activeSide : "front";
  const hasSideTransition = sideState.itemId === item.id ? sideState.hasSideTransition : false;
  const hasBackSide = Boolean(item.secondaryImage);
  const activeImage = activeSide === "back" && item.secondaryImage ? item.secondaryImage : item.image;

  return (
    <div className="artifact-view-card">
      <header className="artifact-view-toolbar">
        <div className="artifact-view-title-row">
          <span className="artifact-view-chip">
            {titleIcon ? createElement(titleIcon, { "aria-hidden": "true", size: 18, strokeWidth: 1.9 }) : null}
            {item.title}
          </span>
          <span className="artifact-view-chip">
            {createElement(itemTypeIcon, { "aria-hidden": "true", size: 18, strokeWidth: 1.9 })}
            {getArtifactTypeLabel(item.artifactType)}
          </span>
        </div>

        <button
          aria-label="Artefakt schließen"
          className="artifact-view-close"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.1} />
        </button>
      </header>

      <div className="artifact-view-image-area">
        <div className="artifact-flip-stage">
          <div
            className={[
              "artifact-flip-card",
              hasSideTransition
                ? activeSide === "back"
                  ? "artifact-flip-card-back"
                  : "artifact-flip-card-front"
                : "",
            ].join(" ")}
          >
            <ZoomableImage
              alt={`${item.caption ?? item.title} ${activeSide === "back" ? "Rückseite" : "Vorderseite"}`}
              controlsAddon={
                hasBackSide ? (
                  <button
                    aria-label={activeSide === "front" ? "Rückseite anzeigen" : "Vorderseite anzeigen"}
                    className="artifact-view-side-button"
                    onClick={() => {
                      setSideState((current) => {
                        const currentSide = current.itemId === item.id ? current.activeSide : "front";

                        return {
                          activeSide: currentSide === "front" ? "back" : "front",
                          hasSideTransition: true,
                          itemId: item.id,
                        };
                      });
                    }}
                    type="button"
                  >
                    <img
                      alt=""
                      aria-hidden="true"
                      className="artifact-view-side-icon"
                      src={activeSide === "front" ? "/icons/rotate-3d-1.svg" : "/icons/rotate-3d-2.svg"}
                    />
                    <span>{activeSide === "front" ? "Rückseite" : "Vorderseite"}</span>
                  </button>
                ) : undefined
              }
              priority
              sizes="92vw"
              src={activeImage}
            />
          </div>
        </div>
      </div>

      <footer className="artifact-view-caption">
        <p>
          {item.description}
          {item.captionLink ? (
            <>
              {" "}
              <a href={item.captionLink} rel="noreferrer" target="_blank">
                Quelle
              </a>
            </>
          ) : null}
        </p>
      </footer>
    </div>
  );
}
