/**
 * Typdefinitionen für Rezepte.
 * So aufgebaut, dass später ein CMS (z. B. Sanity, Contentful) angeschlossen werden kann.
 */

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  note?: string;
}

export interface RecipeStep {
  number: number;
  instruction: string;
  image?: string;
}

export interface Recipe {
  id: string;
  slug: string;
  registerLetter: string;
  author: string;
  authorNote: string;
  entryType: "rezept" | "notiz" | "bild" | "fundstueck";
  title: string;
  shortDescription: string;
  story: string;
  originalCardImage: string;
  coverImage: string;
  galleryImages: string[];
  servingsDefault: number;
  prepTime: number; // Minuten
  cookTime: number;
  totalTime: number;
  difficulty: "einfach" | "mittel" | "anspruchsvoll";
  categories: string[];
  tags: string[];
  collectedItems: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips: string[];
  notesFromOriginal: string[];
  featured: boolean;
}
