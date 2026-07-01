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
  secondaryImage?: string;
  size?: "S" | "M" | "L" | "XL";
}

export const recipes: Recipe[] = [
  {
    id: "1",
    slug: "eierlikoer",
    registerLetter: "E",
    author: "Marianne",
    authorNote: "Omas eigene Karte, mit ruhiger Sonntagsschrift notiert.",
    entryType: "rezept",
    title: "Eierlikör",
    shortDescription: "Cremiger Hauslikör mit Dotter, Vanille und einem kleinen Schuss Erinnerung.",
    story:
      "Diese Karte gehört in den vorderen E-Teil des Registerbuchs: ein Rezept, das zu Feiertagen aus dem Kasten geholt wurde. Die moderne Fassung bleibt samtig und klassisch, wird aber mit sauberer Temperaturführung zubereitet.",
    originalCardImage: "/images/recipes/eierlikoer.svg",
    coverImage: "/images/recipes/eierlikoer.svg",
    galleryImages: [],
    servingsDefault: 10,
    prepTime: 20,
    cookTime: 10,
    totalTime: 30,
    difficulty: "einfach",
    categories: ["Getränke", "Festtage"],
    tags: ["Eier", "Vanille", "Likör"],
    collectedItems: [
      "Kleiner Zettel: „nur frische Eier nehmen“",
      "Randnotiz mit Geschenkideen für Weihnachten",
    ],
    ingredients: [
      { name: "Eigelb", amount: 8, unit: "Stk" },
      { name: "Staubzucker", amount: 180, unit: "g" },
      { name: "Vanillezucker", amount: 1, unit: "Pkg" },
      { name: "Kondensmilch oder Schlagobers", amount: 250, unit: "ml" },
      { name: "Milch", amount: 150, unit: "ml" },
      { name: "Rum, mild", amount: 250, unit: "ml" },
      { name: "Vanille", amount: 1, unit: "Prise", note: "oder Mark einer halben Schote" },
    ],
    steps: [
      { number: 1, instruction: "Eigelb, Staubzucker, Vanillezucker und Vanille über Wasserdampf hell und cremig aufschlagen." },
      { number: 2, instruction: "Kondensmilch und Milch langsam einrühren und die Masse warm, aber nicht kochend, einige Minuten cremig ziehen lassen." },
      { number: 3, instruction: "Vom Herd nehmen, kurz abkühlen lassen und den Rum langsam einrühren." },
      { number: 4, instruction: "Durch ein feines Sieb in saubere Flaschen füllen. Gekühlt lagern und vor dem Einschenken schütteln." },
    ],
    tips: ["Nicht kochen lassen, sonst stockt das Eigelb.", "Nach zwei Tagen im Kühlschrank wird der Likör runder."],
    notesFromOriginal: ["Die Originalkarte bleibt als Handschrift sichtbar; die Mengen wurden für eine sichere, moderne Zubereitung geglättet."],
    featured: true,
  },
  {
    id: "2",
    slug: "eiskonfekt",
    registerLetter: "E",
    author: "Gastautorin Tante Nanni",
    authorNote: "Eine zugesteckte Karte von Tante Nanni aus dem Familienkreis, offenbar oft nachgemacht.",
    entryType: "rezept",
    title: "Eiskonfekt",
    shortDescription: "Kleine Schoko-Kokos-Würfel aus der Kälte, wie früher aus der Blechdose.",
    story: "Dieses Eiskonfekt hat Oma immer wieder zu Weihnachten für uns gezaubert.",
    originalCardImage: "/images/recipes/eiskonfekt.svg",
    photoImage: "/images/recipes/eiskonfekt-photo.png",
    coverImage: "/images/recipes/eiskonfekt.svg",
    galleryImages: [],
    servingsDefault: 24,
    prepTime: 15,
    cookTime: 5,
    totalTime: 80,
    difficulty: "einfach",
    categories: ["Kekse", "Konfekt"],
    tags: ["Schokolade", "Kokos", "Kalt"],
    collectedItems: [
      "Papierstreifen aus einer Pralinenschachtel",
      "Bleistiftstrich: „für Kinder kleiner schneiden“",
    ],
    ingredients: [
      { name: "Kokosfett", amount: 120, unit: "g", note: "Raumtemperatur, ca. 22 °C" },
      { name: "Zartbitterschokolade", amount: 160, unit: "g" },
      { name: "Vollmilchschokolade", amount: 80, unit: "g" },
      { name: "Staubzucker", amount: 70, unit: "g" },
      { name: "Kakao", amount: 2, unit: "EL" },
      { name: "Vanillezucker", amount: 1, unit: "Pkg" },
      { name: "Kokosflocken", amount: 40, unit: "g", note: "optional zum Bestreuen" },
      { name: "Papierförmchen", amount: 24, unit: "Stk", note: "ca. 20 mm Durchmesser" },
    ],
    steps: [
      { number: 1, instruction: "120 g Kokosfett bei niedriger Hitze schmelzen und im Anschluss beide Schokoladen darin langsam auflösen." },
      { number: 2, instruction: "70 g Staubzucker, 2 EL Kakao und 1 Pkg Vanillezucker glatt einrühren." },
      { number: 3, instruction: "Masse in kleine Papierförmchen oder eine mit Backpapier ausgelegte Form gießen." },
      { number: 4, instruction: "Mit Kokosflocken bestreuen und mindestens 1 Stunde kalt stellen." },
    ],
    tips: ["Direkt aus dem Kühlschrank servieren.", "Für Erwachsene passt ein kleiner Löffel Rum in die Masse."],
    notesFromOriginal: ["Als Gastbeitrag markiert, damit sichtbar bleibt, dass Omas Buch auch ein Familienarchiv war."],
    featured: true,
  },
  {
    id: "3",
    slug: "kirchtagskrapfen",
    registerLetter: "K",
    author: "Marianne nach Rezept von Resi",
    authorNote: "Oma hat das Rezept übernommen und mit eigenen Hinweisen ergänzt.",
    entryType: "rezept",
    title: "Kirchtagskrapfen",
    shortDescription: "Ausgezogene Germteigkrapfen, außen knusprig und innen weich.",
    story:
      "Im K-Register sitzt der große Festtagsklassiker. Der Gastautorinnen-Hinweis gehört hier bewusst dazu: Solche Rezepte wanderten von Küche zu Küche, bis sie irgendwann ganz selbstverständlich in Omas Buch zuhause waren.",
    originalCardImage: "/images/recipes/kirchtagskrapfen.svg",
    coverImage: "/images/recipes/kirchtagskrapfen.svg",
    galleryImages: [],
    servingsDefault: 12,
    prepTime: 35,
    cookTime: 20,
    totalTime: 115,
    difficulty: "anspruchsvoll",
    categories: ["Gebäck", "Festtage"],
    tags: ["Germteig", "Ausbacken", "Kirchtag"],
    collectedItems: [
      "Eingelegtes Foto vom Kirchtagstisch",
      "Notiz: „Teig darf nicht frieren“",
    ],
    ingredients: [
      { name: "Mehl glatt", amount: 500, unit: "g" },
      { name: "Milch, lauwarm", amount: 250, unit: "ml" },
      { name: "Germ frisch", amount: 25, unit: "g" },
      { name: "Zucker", amount: 50, unit: "g" },
      { name: "Eigelb", amount: 3, unit: "Stk" },
      { name: "Butter, weich", amount: 60, unit: "g" },
      { name: "Rum", amount: 1, unit: "EL" },
      { name: "Salz", amount: 1, unit: "Prise" },
      { name: "Butterschmalz oder Öl", amount: 1000, unit: "ml", note: "zum Ausbacken" },
    ],
    steps: [
      { number: 1, instruction: "Germ mit etwas Milch, Zucker und Mehl verrühren und 10 Minuten anspringen lassen." },
      { number: 2, instruction: "Mit restlicher Milch, Eigelb, Butter, Rum und Salz zu einem glatten Teig kneten. Zugedeckt ca. 45 Minuten gehen lassen." },
      { number: 3, instruction: "Teig in Stücke teilen, rund schleifen und nochmals 20 Minuten rasten lassen." },
      { number: 4, instruction: "Krapfen von der Mitte her dünn ausziehen, den Rand dicker lassen und in heißem Fett goldbraun backen." },
      { number: 5, instruction: "Auf Küchenpapier abtropfen lassen und mit Staubzucker servieren." },
    ],
    tips: ["Das Fett ist richtig heiß, wenn an einem Holzstiel kleine Bläschen aufsteigen.", "Die Mitte dünn ziehen, aber nicht reißen lassen."],
    notesFromOriginal: ["Die Karte wird als überliefertes Rezept geführt, nicht nur als Omas eigene Erfindung."],
    featured: true,
  },
  {
    id: "4",
    slug: "lebkuchen",
    registerLetter: "L",
    author: "Marianne",
    authorNote: "Eine Weihnachtskarte mit mehreren kleinen Korrekturen am Rand.",
    entryType: "rezept",
    title: "Lebkuchen",
    shortDescription: "Weicher Honiglebkuchen mit Gewürzen, der nach einigen Tagen noch besser wird.",
    story:
      "Unter L steckt Weihnachten. Die Karte wirkt wie ein Arbeitsblatt: nicht perfekt sauber, sondern benutzt, verbessert und wieder hervorgeholt, sobald der erste Advent näher kam.",
    originalCardImage: "/images/recipes/lebkuchen.svg",
    coverImage: "/images/recipes/lebkuchen.svg",
    galleryImages: [],
    servingsDefault: 35,
    prepTime: 30,
    cookTime: 12,
    totalTime: 162,
    difficulty: "mittel",
    categories: ["Weihnachten", "Gebäck"],
    tags: ["Honig", "Gewürze", "Advent"],
    collectedItems: [
      "Getrocknete Oblate zwischen den Seiten",
      "Sternchen neben „nicht zu lange backen“",
    ],
    ingredients: [
      { name: "Roggenmehl", amount: 300, unit: "g" },
      { name: "Weizenmehl", amount: 200, unit: "g" },
      { name: "Honig", amount: 250, unit: "g" },
      { name: "Brauner Zucker", amount: 120, unit: "g" },
      { name: "Eier", amount: 2, unit: "Stk" },
      { name: "Lebkuchengewürz", amount: 2, unit: "EL" },
      { name: "Natron", amount: 1, unit: "TL" },
      { name: "Milch", amount: 3, unit: "EL" },
      { name: "Mandeln", amount: 80, unit: "g", note: "gehackt oder zum Belegen" },
    ],
    steps: [
      { number: 1, instruction: "Honig und Zucker sanft erwärmen, bis sich der Zucker löst. Lauwarm abkühlen lassen." },
      { number: 2, instruction: "Mehle, Gewürz und Natron mischen. Honigmasse, Eier und Milch einarbeiten." },
      { number: 3, instruction: "Teig zugedeckt mindestens 2 Stunden, besser über Nacht, rasten lassen." },
      { number: 4, instruction: "Ausrollen, ausstechen, mit Mandeln belegen und bei 175 °C etwa 10 bis 12 Minuten backen." },
      { number: 5, instruction: "In einer Dose mit einem Apfelspalt weich werden lassen." },
    ],
    tips: ["Lebkuchen wirkt beim Herausnehmen noch weich; er zieht beim Abkühlen an.", "Den Apfelspalt täglich wechseln."],
    notesFromOriginal: ["Die Ruhezeit ist in der modernen Fassung bewusst ergänzt, damit der Teig leichter zu verarbeiten ist."],
    featured: true,
  },
  {
    id: "5",
    slug: "spritzgebaeck",
    registerLetter: "S",
    author: "Gastautor Alois",
    authorNote: "Ein Rezept aus fremder Hand, von Marianne ins Buch übernommen.",
    entryType: "rezept",
    title: "Spritzgebäck",
    shortDescription: "Mürbe Kekse aus dem Fleischwolf oder Spritzsack, halb in Schokolade getaucht.",
    story:
      "Im S-Register zeigt sich besonders schön, dass Omas Buch ein Gemeinschaftswerk war. Spritzgebäck war so ein Rezept, das jemand mitbrachte, Marianne ausprobierte und dann für die Familie bewahrte.",
    originalCardImage: "/images/recipes/spritzgebaeck.svg",
    coverImage: "/images/recipes/spritzgebaeck.svg",
    galleryImages: [],
    servingsDefault: 45,
    prepTime: 35,
    cookTime: 12,
    totalTime: 77,
    difficulty: "mittel",
    categories: ["Kekse", "Weihnachten"],
    tags: ["Mürbteig", "Schokolade", "Gastautor"],
    collectedItems: [
      "Schokoladenfleck am unteren Kartenrand",
      "Kleine Skizze für die Sternform",
    ],
    ingredients: [
      { name: "Butter, weich", amount: 250, unit: "g" },
      { name: "Staubzucker", amount: 120, unit: "g" },
      { name: "Vanillezucker", amount: 1, unit: "Pkg" },
      { name: "Ei", amount: 1, unit: "Stk" },
      { name: "Mehl glatt", amount: 350, unit: "g" },
      { name: "Speisestärke", amount: 80, unit: "g" },
      { name: "Salz", amount: 1, unit: "Prise" },
      { name: "Kuvertüre", amount: 150, unit: "g", note: "zum Tunken" },
    ],
    steps: [
      { number: 1, instruction: "Butter, Staubzucker, Vanillezucker und Salz cremig rühren. Das Ei kurz einarbeiten." },
      { number: 2, instruction: "Mehl und Stärke mischen und nur so lange unterrühren, bis ein weicher Teig entsteht." },
      { number: 3, instruction: "Teig portionsweise durch den Fleischwolf mit Gebäckvorsatz drehen oder mit einem kräftigen Spritzsack aufs Blech setzen." },
      { number: 4, instruction: "Bei 180 °C etwa 10 bis 12 Minuten hell backen und vollständig abkühlen lassen." },
      { number: 5, instruction: "Kuvertüre schmelzen, Gebäckenden eintauchen und auf Backpapier fest werden lassen." },
    ],
    tips: ["Wenn der Teig zu weich ist, 20 Minuten kühlen.", "Nicht dunkel backen; Spritzgebäck soll mürbe und hell bleiben."],
    notesFromOriginal: ["Der Gastautor bleibt sichtbar, weil solche fremden Handschriften den Charakter des Buchs ausmachen."],
    featured: true,
  },
];

export const registerLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I/J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "Sch", "St", "T", "U", "V", "W", "X/Y", "Z"];

export const collectedBookItems: CollectedBookItem[] = [
  {
    id: "marianne-portrait",
    registerLetter: "M",
    type: "bild",
    title: "Marianne",
    description: "Ein Foto von Marianne, lose im Register M abgelegt.",
    caption: "Marianne - das Gesicht hinter dem Rezeptschatz.",
    image: "/images/artifacts/marianne-portrait.jpg",
  },
];

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find((r) => r.slug === slug);
}

export function getAllRecipes(): Recipe[] {
  return [...recipes];
}

export function getRecipesByLetter(letter: string): Recipe[] {
  return recipes.filter((recipe) => recipe.registerLetter === letter);
}
