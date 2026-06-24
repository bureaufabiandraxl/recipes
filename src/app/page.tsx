import { RecipeRegisterBook } from "@/components/RecipeRegisterBook";
import { getAllRecipes } from "@/data/recipes";

export default function Home() {
  const recipes = getAllRecipes();

  return (
    <div className="min-h-screen bg-[#fffffa]">
      <RecipeRegisterBook recipes={recipes} />
    </div>
  );
}
