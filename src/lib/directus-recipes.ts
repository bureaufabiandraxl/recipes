import { recipes as fallbackRecipes } from "@/data/recipes";
import generatedRecipes from "@/data/directus-recipes.generated.json";
import type { Recipe } from "@/types/recipe";

export async function getAllRecipesFromDirectus(): Promise<Recipe[]> {
  return generatedRecipes.length ? (generatedRecipes as Recipe[]) : fallbackRecipes;
}
