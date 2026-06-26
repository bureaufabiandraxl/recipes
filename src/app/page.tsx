import { RecipeRegisterBook } from "@/components/RecipeRegisterBook";
import { getAllRecipesFromDirectus } from "@/lib/directus-recipes";

export default async function Home() {
  const recipes = await getAllRecipesFromDirectus();

  return (
    <div className="min-h-screen bg-[#fffffa]">
      <RecipeRegisterBook recipes={recipes} />
    </div>
  );
}
