// ============================================================
//  lib/mockClaude.ts
//
//  Replaces all AI calls with instant mock responses.
//  No API key, no credit card, no cost.
//
//  When you're ready to add real AI:
//  1. Get an Anthropic API key (or use Google Gemini free tier)
//  2. Delete this file
//  3. Uncomment the real API routes in app/api/claude/
// ============================================================

// ─── Mock recipe generation ───────────────────────────────────
// Returns a different recipe based on keywords in the prompt.
export function mockGenerateRecipe(prompt: string, profile: any) {
  const p = prompt.toLowerCase();

  const recipes: Record<string, any> = {
    pasta: {
      name: "Roasted Tomato Pasta",
      emoji: "🍝",
      difficulty: "Easy",
      time: "30 min",
      xp: 55,
      category: "Italian",
      tags: ["Vegetarian", "Comfort"],
      diets: ["Vegetarian"],
      ingredients: [
        "400g pasta (any shape)",
        "500g cherry tomatoes",
        "4 cloves garlic, sliced",
        "4 tbsp olive oil",
        "Large handful fresh basil",
        "Salt, pepper, chilli flakes",
        "Parmesan to serve",
      ],
      steps: [
        { title: "Roast tomatoes", body: "Toss cherry tomatoes and garlic with olive oil and salt. Roast at 200°C for 25 minutes until burst and caramelised.", timer: 1500 },
        { title: "Cook pasta", body: "Boil pasta in heavily salted water until al dente. Reserve 1 cup of pasta water.", timer: 480 },
        { title: "Combine", body: "Add drained pasta to the roasting tray. Add pasta water and toss well — the tomato juices become the sauce." },
        { title: "Finish", body: "Tear in fresh basil. Serve with grated Parmesan and extra chilli if you like." },
      ],
      tip: "The caramelised tomato juice in the roasting tray is the sauce — don't waste a drop.",
      macros: { calories: 480, protein: 14, carbs: 72, fat: 14, fiber: 5 },
    },
    chicken: {
      name: "Lemon Herb Roast Chicken",
      emoji: "🍗",
      difficulty: "Medium",
      time: "1h 20m",
      xp: 110,
      category: "Comfort",
      tags: ["High Protein", "Family Favourite"],
      diets: ["Gluten-free", "Dairy-free"],
      ingredients: [
        "1 whole chicken (1.5kg)",
        "2 lemons",
        "6 cloves garlic",
        "Fresh rosemary and thyme",
        "3 tbsp olive oil",
        "Salt and black pepper",
      ],
      steps: [
        { title: "Prep the chicken", body: "Pat chicken completely dry. Rub all over with olive oil, salt and pepper — get under the skin too." },
        { title: "Stuff and season", body: "Cut one lemon in half, squeeze juice over the chicken, then stuff the halves inside the cavity with garlic and herbs." },
        { title: "Roast", body: "Roast at 200°C for 1 hour 20 minutes. The skin should be deeply golden and crisp.", timer: 4800 },
        { title: "Rest before carving", body: "Rest the chicken for 10 minutes before carving — this keeps all the juices inside.", timer: 600 },
      ],
      tip: "A completely dry chicken skin is what makes it crispy. Pat it dry, don't skip this.",
      macros: { calories: 520, protein: 48, carbs: 4, fat: 34, fiber: 0 },
    },
    salmon: {
      name: "Honey Garlic Salmon",
      emoji: "🐟",
      difficulty: "Easy",
      time: "20 min",
      xp: 70,
      category: "Healthy",
      tags: ["High Protein", "Quick"],
      diets: ["Gluten-free", "Dairy-free"],
      ingredients: [
        "2 salmon fillets",
        "2 tbsp honey",
        "3 cloves garlic, minced",
        "2 tbsp soy sauce",
        "1 tbsp olive oil",
        "Lemon wedges and parsley to serve",
      ],
      steps: [
        { title: "Make the glaze", body: "Mix honey, garlic and soy sauce in a small bowl." },
        { title: "Sear the salmon", body: "Heat oil in a pan over medium-high. Place salmon skin-side down. Cook 4 minutes without moving.", timer: 240 },
        { title: "Flip and glaze", body: "Flip the salmon. Pour the glaze over. Cook 3 more minutes until sticky and caramelised.", timer: 180 },
        { title: "Serve", body: "Squeeze lemon over everything. Scatter parsley." },
      ],
      tip: "Don't move the salmon while it's searing — leaving it alone is what builds the crust.",
      macros: { calories: 380, protein: 36, carbs: 16, fat: 18, fiber: 0 },
    },
    vegan: {
      name: "Spiced Chickpea & Spinach Stew",
      emoji: "🥘",
      difficulty: "Easy",
      time: "25 min",
      xp: 60,
      category: "Healthy",
      tags: ["Vegan", "Meal Prep", "High Protein"],
      diets: ["Vegan", "Vegetarian", "Gluten-free", "Dairy-free"],
      ingredients: [
        "2 × 400g cans chickpeas, drained",
        "400g bag baby spinach",
        "1 × 400g can crushed tomatoes",
        "1 onion, diced",
        "4 cloves garlic",
        "2 tsp cumin",
        "1 tsp smoked paprika",
        "1 tsp turmeric",
        "Olive oil, salt and pepper",
      ],
      steps: [
        { title: "Fry the base", body: "Cook onion in oil over medium heat for 6 minutes. Add garlic and all spices, cook 1 minute more.", timer: 420 },
        { title: "Add tomatoes", body: "Add crushed tomatoes. Simmer 5 minutes.", timer: 300 },
        { title: "Add chickpeas", body: "Add chickpeas. Simmer 10 minutes until thick.", timer: 600 },
        { title: "Wilt spinach", body: "Add all the spinach and stir until wilted, about 2 minutes. Season and serve." },
      ],
      tip: "This gets better the next day. Makes great meal prep — keeps 4 days in the fridge.",
      macros: { calories: 340, protein: 18, carbs: 48, fat: 8, fiber: 12 },
    },
    breakfast: {
      name: "Classic French Omelette",
      emoji: "🍳",
      difficulty: "Medium",
      time: "8 min",
      xp: 45,
      category: "Breakfast",
      tags: ["Quick", "High Protein", "Vegetarian"],
      diets: ["Vegetarian", "Gluten-free", "Keto"],
      ingredients: [
        "3 large eggs",
        "15g cold butter, cubed",
        "Salt and white pepper",
        "Fresh chives, chopped",
        "Optional: 30g grated Gruyère",
      ],
      steps: [
        { title: "Beat the eggs", body: "Whisk eggs vigorously with a fork until completely homogeneous. Season with salt and white pepper." },
        { title: "Heat the pan", body: "Medium-high heat. Add butter. When it foams and just starts to colour, add the eggs." },
        { title: "Work quickly", body: "Stir constantly with a spatula in small circles while shaking the pan. The eggs should set in ripples, not big curds.", timer: 60 },
        { title: "Roll and serve", body: "Tilt the pan. Fold one edge over, then roll onto the plate. It should be pale yellow, no brown, slightly custardy inside." },
      ],
      tip: "The French omelette should take under 90 seconds from eggs hitting pan to plate. Speed is everything.",
      macros: { calories: 280, protein: 18, carbs: 1, fat: 22, fiber: 0 },
    },
  };

  // Match prompt to recipe
  if (p.includes("pasta") || p.includes("tomato") || p.includes("italian")) return recipes.pasta;
  if (p.includes("chicken") || p.includes("roast")) return recipes.chicken;
  if (p.includes("salmon") || p.includes("fish")) return recipes.salmon;
  if (p.includes("vegan") || p.includes("chickpea") || p.includes("plant")) return recipes.vegan;
  if (p.includes("breakfast") || p.includes("egg") || p.includes("omelette")) return recipes.breakfast;

  // Default: return pasta if nothing matches
  return recipes.pasta;
}

// ─── Mock pantry suggestions ──────────────────────────────────
export function mockPantrySuggestions(ingredients: string[]) {
  const has = (item: string) =>
    ingredients.some(i => i.toLowerCase().includes(item.toLowerCase()));

  const suggestions = [];

  if (has("egg") || has("eggs")) {
    suggestions.push({
      name: "Scrambled Eggs on Toast",
      emoji: "🍳",
      why: "Simple, satisfying, and you have everything you need.",
      difficulty: "Easy",
      time: "8 min",
      missingIngredients: has("bread") ? [] : ["bread"],
    });
  }

  if (has("pasta") || has("spaghetti")) {
    suggestions.push({
      name: "Aglio e Olio",
      emoji: "🍝",
      why: "The classic Italian peasant dish — garlic, oil, pasta. Incredible.",
      difficulty: "Easy",
      time: "15 min",
      missingIngredients: has("garlic") ? [] : ["garlic"],
    });
  }

  if (has("onion") || has("onions")) {
    suggestions.push({
      name: "French Onion Soup",
      emoji: "🧅",
      why: "Onions you already have are the star of this legendary dish.",
      difficulty: "Medium",
      time: "1h 20m",
      missingIngredients: ["butter", "stock", "Gruyère"].filter(
        item => !has(item)
      ).slice(0, 2),
    });
  }

  if (has("rice")) {
    suggestions.push({
      name: "Egg Fried Rice",
      emoji: "🍚",
      why: "Perfect use of leftover rice — better the next day.",
      difficulty: "Easy",
      time: "12 min",
      missingIngredients: has("egg") ? [] : ["eggs"],
    });
  }

  if (has("tomato") || has("tomatoes")) {
    suggestions.push({
      name: "Simple Tomato Bruschetta",
      emoji: "🍅",
      why: "When tomatoes are the hero you barely need anything else.",
      difficulty: "Easy",
      time: "10 min",
      missingIngredients: has("bread") ? [] : ["crusty bread"],
    });
  }

  // Always return exactly 3
  while (suggestions.length < 3) {
    suggestions.push({
      name: "Roasted Vegetables",
      emoji: "🥦",
      why: "Almost anything in your fridge tastes great roasted with olive oil.",
      difficulty: "Easy",
      time: "30 min",
      missingIngredients: has("olive oil") ? [] : ["olive oil"],
    });
  }

  return suggestions.slice(0, 3);
}

// ─── Mock grocery list organiser ─────────────────────────────
export function mockGroceryList(ingredients: string[]) {
  const categories: Record<string, string[]> = {
    "🥩 Meat & Fish": [],
    "🥛 Dairy & Eggs": [],
    "🥦 Produce": [],
    "🫙 Pantry & Dry": [],
    "🌿 Herbs & Spices": [],
    "🍞 Bread & Bakery": [],
    "🥫 Canned & Jarred": [],
  };

  const rules: [string[], string][] = [
    [["chicken", "beef", "pork", "lamb", "mince", "salmon", "fish", "tuna", "prawn", "bacon"], "🥩 Meat & Fish"],
    [["egg", "milk", "butter", "cream", "yoghurt", "cheese", "ricotta", "parmesan", "gruyère", "feta", "mozzarella"], "🥛 Dairy & Eggs"],
    [["onion", "garlic", "tomato", "pepper", "zucchini", "spinach", "carrot", "potato", "lemon", "lime", "avocado", "mushroom", "ginger", "cauliflower", "broccoli", "eggplant"], "🥦 Produce"],
    [["pasta", "rice", "flour", "oat", "quinoa", "lentil", "chickpea", "oil", "vinegar", "sugar", "soy sauce", "mirin", "sesame"], "🫙 Pantry & Dry"],
    [["salt", "pepper", "cumin", "paprika", "turmeric", "coriander", "chilli", "basil", "parsley", "cilantro", "thyme", "rosemary", "bay leaf", "oregano"], "🌿 Herbs & Spices"],
    [["bread", "baguette", "sourdough", "pita", "tortilla", "naan", "bun"], "🍞 Bread & Bakery"],
    [["can", "tin", "crushed tomato", "coconut milk", "stock", "paste", "jar", "miso"], "🥫 Canned & Jarred"],
  ];

  for (const ingredient of ingredients) {
    const lower = ingredient.toLowerCase();
    let matched = false;
    for (const [keywords, category] of rules) {
      if (keywords.some(k => lower.includes(k))) {
        categories[category].push(ingredient);
        matched = true;
        break;
      }
    }
    // If no rule matched, put in Pantry
    if (!matched) {
      categories["🫙 Pantry & Dry"].push(ingredient);
    }
  }

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([, items]) => items.length > 0)
  );
}

// ─── Mock photo verification ──────────────────────────────────
export function mockVerifyPhoto(recipeName: string) {
  // Without real AI, we always approve — it's the honour system!
  return {
    verdict: "VERIFIED" as const,
    feedback: `That looks like a great attempt at ${recipeName}! Well done. 🎉`,
  };
}

// ─── Mock macro calculator ─────────────────────────────────────
export function mockCalculateMacros(recipeName: string, ingredients: string[]) {
  // Rough estimation based on ingredient count and name keywords
  const n = recipeName.toLowerCase();
  if (n.includes("salad") || n.includes("veggie") || n.includes("vegetable")) {
    return { calories: 220, protein: 8, carbs: 24, fat: 10, fiber: 6 };
  }
  if (n.includes("pasta") || n.includes("noodle") || n.includes("rice")) {
    return { calories: 490, protein: 14, carbs: 72, fat: 14, fiber: 4 };
  }
  if (n.includes("chicken") || n.includes("turkey")) {
    return { calories: 420, protein: 42, carbs: 12, fat: 20, fiber: 2 };
  }
  if (n.includes("salmon") || n.includes("fish") || n.includes("tuna")) {
    return { calories: 380, protein: 36, carbs: 8, fat: 20, fiber: 1 };
  }
  if (n.includes("burger") || n.includes("beef") || n.includes("steak")) {
    return { calories: 580, protein: 38, carbs: 28, fat: 34, fiber: 2 };
  }
  if (n.includes("soup") || n.includes("stew") || n.includes("curry")) {
    return { calories: 360, protein: 20, carbs: 36, fat: 14, fiber: 5 };
  }
  // Generic fallback
  return { calories: 420, protein: 22, carbs: 38, fat: 18, fiber: 3 };
}