"use client";

import Image from "next/image";
import {
  ChefHat,
  CircleUser,
  Clock3,
  Cookie,
  ImageIcon,
  Info,
  Martini,
  Minimize2,
  Minus,
  Plus,
  ReceiptText,
  X,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { collectedBookItems } from "@/data/recipes";
import generatedArtifacts from "@/data/directus-artifacts.generated.json";
import type { Recipe } from "@/types/recipe";

interface CollectedBookItem {
  id: string;
  registerLetter: string;
  type: "notiz" | "bild" | "fundstueck";
  title: string;
  description: string;
  caption?: string;
  captionLink?: string;
  image?: string;
  artifactClass?: string;
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
      artifactClass?: string;
      position: BoardPosition;
    };

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
  | { id: "intro"; label: ""; type: "intro" }
  | { id: string; label: string; type: "letter" }
  | { id: "info"; label: ""; type: "info" };

interface RegisterRouteState {
  activeLetter: string;
  selectedItemId: string | null;
}

const cardColors = ["#fec8ff", "#deffc8", "#fff36e", "#e3fdff", "#ffb5e5", "#ff9e66"];
const syncedCollectedBookItems = generatedArtifacts as CollectedBookItem[];
const recipeColorOverrides: Record<string, string> = {
  kirchtagskrapfen: "#fff36e",
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
  { id: "intro", label: "", type: "intro" },
  ...designRegisterLetters.map((letter) => ({ id: letter, label: letter, type: "letter" }) as RegisterEntry),
  { id: "info", label: "", type: "info" },
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
  ".artifact-view-caption",
].join(",\n");
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

function getRecipeIcon(recipe: Recipe): LucideIcon {
  const iconName = recipe.categoryIcon;

  if (iconName && iconName in LucideIcons) {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons];

    if (typeof Icon === "function") {
      return Icon as LucideIcon;
    }
  }

  return recipe.slug === "eierlikoer" ? Martini : Cookie;
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
  if (letter === "intro") {
    return "#/intro";
  }

  if (letter === "info") {
    return "#/info";
  }

  return `#/register/${encodeURIComponent(letter)}`;
}

function getItemHash(item: BoardItem) {
  const registerHash = getRegisterHash(item.registerLetter);

  if (item.kind === "recipe") {
    return `${registerHash}/recipe/${encodeURIComponent(item.recipe.slug)}`;
  }

  return `${registerHash}/artifact/${encodeURIComponent(item.id.replace(/^artifact-/, ""))}`;
}

function parseRegisterHash(hash: string): RegisterRouteState {
  const fallbackRoute: RegisterRouteState = {
    activeLetter: "intro",
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

  if (segments[0] === "intro") {
    return { activeLetter: "intro", selectedItemId: null };
  }

  if (segments[0] === "info") {
    return { activeLetter: "info", selectedItemId: null };
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
  if (entry.type !== "letter") {
    return true;
  }

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

  const xOffset = (getSeededRandom(seed, `${item.id}:x`) - 0.5) * (item.kind === "recipe" ? 12 : 16);
  const yOffset = (getSeededRandom(seed, `${item.id}:y`) - 0.5) * (item.kind === "recipe" ? 18 : 24);
  const rotationOffset = (getSeededRandom(seed, `${item.id}:rotation`) - 0.5) * (item.kind === "recipe" ? 3 : 5);

  return {
    ...item,
    rotation: item.rotation + rotationOffset,
    position: {
      x: clamp(item.position.x + xOffset, 3, item.kind === "recipe" ? 62 : 78),
      y: clamp(item.position.y + yOffset + index * 0.6, 0, 160),
    },
  };
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
    .map<BoardItem>((recipe, index) => ({
      id: `recipe-${recipe.slug}`,
      kind: "recipe",
      registerLetter: recipe.registerLetter,
      title: recipe.title,
      color: recipeColorOverrides[recipe.slug] ?? cardColors[index % cardColors.length],
      rotation: 0,
      image: recipe.originalCardImage,
      recipe,
      position: defaultPositions[index] ?? {
        x: 8 + (index % 3) * 24,
        y: 14 + Math.floor(index / 3) * 24,
      },
    }));

  const artifactItems = syncedCollectedBookItems.length ? syncedCollectedBookItems : collectedBookItems;
  const collectedArtifactItems = artifactItems
    .filter((item) => item.registerLetter === activeLetter)
    .map<BoardItem>((item, index) => {
      const fallbackRecipe = recipes[(index + 1) % recipes.length] ?? recipes[0];

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
        image: item.image ?? fallbackRecipe?.originalCardImage ?? "/images/recipes/eiskonfekt.svg",
        artifactClass: item.artifactClass ?? "artifact-note",
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
            artifactClass: "artifact-icon-image",
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
            artifactClass: "artifact-packaging-image",
            position: { x: 15.6, y: 102.3 },
          },
        ]
      : [];

  return [...recipeItems, ...exampleArtifactItems, ...collectedArtifactItems].map((item, index) =>
    getRandomizedBoardItem(item, layoutSeed, index),
  );
}

function getEstimatedItemHeight(item: BoardItem) {
  if (item.kind === "recipe") {
    return 430;
  }

  if (item.artifactClass === "artifact-packaging-image") {
    return 520;
  }

  if (item.artifactClass === "artifact-icon-image") {
    return 520;
  }

  if (item.artifactClass === "artifact-portrait-image") {
    return 540;
  }

  return 430;
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

function InfoRegisterPage() {
  return (
    <section className="register-info-page" aria-label="Info und Impressum">
      <div className="register-info-content">
        <div className="register-info-heading">
          <Info aria-hidden="true" size={24} strokeWidth={2} />
          <span>Info & Impressum</span>
          <p>
            Rechtliche Angaben, Quellenhinweise und Verantwortlichkeiten zu Mariannes digitalem
            Rezeptschatz.
          </p>
        </div>

        <div className="register-info-sections">
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
      </div>
    </section>
  );
}

function ZoomableImage({
  alt,
  className,
  priority,
  sizes,
  src,
}: {
  alt: string;
  className?: string;
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
    resetZoom();
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
      <Image
        alt={alt}
        className="zoomable-image-media"
        draggable={false}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        }}
      />

      <div
        className="zoomable-image-controls"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
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
    </div>
  );
}

export function RecipeRegisterBook({ recipes }: RecipeRegisterBookProps) {
  const lettersWithEntries = useMemo(() => getLettersWithEntries(recipes), [recipes]);
  const firstLetter = "intro";
  const [activeLetter, setActiveLetter] = useState<string>(firstLetter);
  const [layoutSeed, setLayoutSeed] = useState("");
  const [positions, setPositions] = useState<Record<string, BoardPosition>>({});
  const [zIndexes, setZIndexes] = useState<Record<string, number>>({});
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [selectedItemIdFromRoute, setSelectedItemIdFromRoute] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const zIndexCounterRef = useRef(1);
  const lastInteractionMovedRef = useRef(false);

  useEffect(() => {
    setLayoutSeed(`${Date.now()}-${Math.random()}`);
  }, []);

  useEffect(() => {
    if (document.getElementById(liquidGlassRuntimeStyleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = liquidGlassRuntimeStyleId;
    style.textContent = `
${liquidGlassRuntimeSelectors} {
  backdrop-filter: var(--liquid-glass-filter) !important;
  -webkit-backdrop-filter: var(--liquid-glass-filter) !important;
}

.recipe-detail-backdrop::before {
  backdrop-filter: blur(20px) saturate(1.16) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.16) !important;
}
`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    function applyRouteFromHash() {
      const route = parseRegisterHash(window.location.hash);
      const nextEntry = registerEntries.find((entry) => entry.id === route.activeLetter);

      if (!nextEntry || !registerEntryHasContent(nextEntry, lettersWithEntries)) {
        replaceRegisterHash(getRegisterHash(firstLetter));
        setActiveLetter(firstLetter);
        setSelectedItem(null);
        setSelectedItemIdFromRoute(null);
        return;
      }

      setActiveLetter(route.activeLetter);
      setSelectedItemIdFromRoute(route.selectedItemId);

      if (!route.selectedItemId) {
        setSelectedItem(null);
      }
    }

    if (!window.location.hash) {
      replaceRegisterHash(getRegisterHash(firstLetter));
    }

    applyRouteFromHash();
    window.addEventListener("hashchange", applyRouteFromHash);
    window.addEventListener("popstate", applyRouteFromHash);

    return () => {
      window.removeEventListener("hashchange", applyRouteFromHash);
      window.removeEventListener("popstate", applyRouteFromHash);
    };
  }, [firstLetter, lettersWithEntries]);

  const boardItems = useMemo(
    () => createBoardItems(recipes, activeLetter, layoutSeed),
    [activeLetter, layoutSeed, recipes],
  );

  useEffect(() => {
    if (!selectedItemIdFromRoute) {
      return;
    }

    const routedItem = boardItems.find((item) => item.id === selectedItemIdFromRoute);

    if (routedItem) {
      setSelectedItem(routedItem);
    } else {
      setSelectedItem(null);
    }
  }, [boardItems, selectedItemIdFromRoute]);
  const activeRegisterEntry = registerEntries.find((entry) => entry.id === activeLetter);
  const isSpecialRegisterPage = activeRegisterEntry?.type === "intro" || activeRegisterEntry?.type === "info";
  const canvasMinHeight = useMemo(() => {
    if (isSpecialRegisterPage) {
      return registerPageBaseHeight;
    }

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
  }, [boardItems, isSpecialRegisterPage]);

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

    pushRegisterHash(getRegisterHash(letter));
    setActiveLetter(letter);
    setSelectedItem(null);
    setSelectedItemIdFromRoute(null);
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
    <section className="register-book-stage" aria-label="Mariannes Rezeptschatz">
      <div className="register-book-frame">
        <nav className="register-mobile-tabs" aria-label="Register">
          {registerEntries.map((entry, index) => {
            const hasEntry = registerEntryHasContent(entry, lettersWithEntries);
            const ariaLabel =
              entry.type === "intro" ? "Cover" : entry.type === "info" ? "Info" : `Register ${entry.label}`;

            return (
              <button
                className={[
                  "register-mobile-tab",
                  entry.label.length > 1 ? "register-mobile-tab-wide" : "",
                  hasEntry ? "register-mobile-tab-filled" : "",
                  !hasEntry ? "register-mobile-tab-disabled" : "",
                  entry.type === "intro" ? "register-mobile-tab-intro" : "",
                  entry.type === "info" ? "register-mobile-tab-info" : "",
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
                <span className="register-mobile-tab-label">
                  {entry.type === "intro" ? (
                    <Image
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      height={17}
                      src="/images/brand/marianne.svg"
                      width={17}
                    />
                  ) : entry.type === "info" ? (
                    <Info aria-hidden="true" size={13} strokeWidth={2.2} />
                  ) : (
                    entry.label
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="recipe-register-page">
          <div className="recipe-register-paper" ref={boardRef}>
            <div
              className={[
                "recipe-register-canvas",
                activeRegisterEntry?.type === "intro" ? "recipe-register-canvas-cover" : "",
                activeRegisterEntry?.type === "info" ? "recipe-register-canvas-info" : "",
              ].join(" ")}
              style={
                {
                  "--register-canvas-min-height": `${canvasMinHeight}px`,
                } as CSSProperties
              }
            >
              {activeRegisterEntry?.type === "intro" ? (
                <section className="register-cover-page" aria-label="Cover">
                  <div className="register-cover-label">
                    <Image
                      alt="Marianne"
                      className="register-cover-logo"
                      draggable={false}
                      height={44}
                      priority
                      src="/images/brand/marianne.svg"
                      width={44}
                    />
                    <span className="register-cover-rule register-cover-rule-1" aria-hidden="true" />
                    <span className="register-cover-rule register-cover-rule-2" aria-hidden="true" />
                    <span className="register-cover-rule register-cover-rule-3" aria-hidden="true" />
                    <span className="register-cover-rule register-cover-rule-4" aria-hidden="true" />
                    <p>
                      Eine Sammlung der handgeschriebenen Original-
                      <br />
                      rezepte meiner Oma.
                    </p>
                    <strong>fabiandraxl.com</strong>
                  </div>
                </section>
              ) : activeRegisterEntry?.type === "info" ? (
                <InfoRegisterPage />
              ) : boardItems.length === 0 ? null : (
                boardItems.map((item) => {
                  const position = getItemPosition(item);

                  return (
                    <button
                      className={[
                        "register-board-card",
                        item.kind === "artifact" ? "register-board-artifact" : "",
                        item.kind === "artifact" && item.artifactClass ? item.artifactClass : "",
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
                        zIndex: zIndexes[item.id] ?? 1,
                      } as CSSProperties}
                      type="button"
                    >
                      <span className="register-card-pin" aria-hidden="true" />
                      <span className="register-card-image">
                        <Image
                          alt={item.kind === "recipe" ? `Originalkarte ${item.title}` : item.title}
                          draggable={false}
                          fill
                          sizes="(max-width: 700px) 90vw, 420px"
                          src={item.image}
                        />
                      </span>
                      <span className="register-card-meta">
                        {item.kind === "recipe" ? (
                          <>
                            <span className="register-card-chip">
                              {item.recipe.slug === "eierlikoer" ? (
                                <Martini aria-hidden="true" size={17} strokeWidth={1.9} />
                              ) : (
                                <Cookie aria-hidden="true" size={17} strokeWidth={1.9} />
                              )}
                              {item.title}
                            </span>
                            <span className="register-card-chip">
                              <Clock3 aria-hidden="true" size={17} strokeWidth={1.9} />
                              {getCardTimeLabel(item.recipe)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="register-card-chip">
                              <ImageIcon aria-hidden="true" size={17} strokeWidth={1.9} />
                              {item.title}
                            </span>
                            <span className="register-card-chip">{item.registerLetter}</span>
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
              const ariaLabel =
                entry.type === "intro" ? "Cover" : entry.type === "info" ? "Info" : `Register ${entry.label}`;

              return (
                <button
                  className={[
                    "register-side-tab",
                    `register-side-tab-${entry.type}`,
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
                  <RegisterSideTabShape isIntro={entry.type === "intro"} />
                  <span className="register-side-tab-label">
                    {entry.type === "intro" ? (
                      <Image
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        height={21}
                        src="/images/brand/marianne.svg"
                        width={21}
                      />
                    ) : entry.type === "info" ? (
                      <Info aria-hidden="true" size={18} strokeWidth={2.1} />
                    ) : (
                      entry.label
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

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
  const RecipeIcon = getRecipeIcon(recipe);
  const servingsUnit = getServingsUnit(recipe);
  const authorLabel = getRecipeAuthorLabel(recipe);
  const hasPhoto = Boolean(recipe.photoImage);
  const hasIngredients = recipe.ingredients.length > 0;
  const hasSteps = recipe.steps.length > 0;
  const hasTips = recipe.tips.length > 0;
  const hasContentSections = hasIngredients || hasSteps || hasTips;
  const visualImage =
    visualMode === "photo" && recipe.photoImage ? recipe.photoImage : recipe.originalCardImage;
  const visualAlt =
    visualMode === "photo" ? `Foto zu ${recipe.title}` : `Originalkarte ${recipe.title}`;

  function changeServings(nextServings: number) {
    setServings(clamp(nextServings, 1, 99));
  }

  useEffect(() => {
    setVisualMode("recipe");
    setServings(recipe.servingsDefault);
  }, [recipe.servingsDefault, recipe.slug]);

  return (
    <div
      className="recipe-view-card"
      style={{ "--recipe-view-bg": color } as CSSProperties}
    >
      <header className="recipe-view-toolbar">
        <div className="recipe-view-toolbar-group">
          <span className="recipe-view-chip">
            <RecipeIcon aria-hidden="true" size={18} strokeWidth={1.9} />
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
              <RecipeIcon aria-hidden="true" size={18} strokeWidth={1.9} />
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

function ArtifactDetail({
  item,
  onClose,
}: {
  item: Extract<BoardItem, { kind: "artifact" }>;
  onClose: () => void;
}) {
  return (
    <div className="artifact-view-card">
      <header className="artifact-view-toolbar">
        <div className="artifact-view-title-row">
          <span className="artifact-view-chip">
            <ImageIcon aria-hidden="true" size={18} strokeWidth={1.9} />
            {item.title}
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
        <ZoomableImage alt={item.caption ?? item.title} priority sizes="92vw" src={item.image} />
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
