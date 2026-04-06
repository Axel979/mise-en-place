// TheMealDB Recipe Fetcher
// Run: node fetch-recipes.js
// Outputs: mealdb-recipes.jsx (paste into app)

const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Estimate difficulty from instruction length + ingredient count
function getDifficulty(instructions, ingredientCount) {
  const words = (instructions || '').split(' ').length;
  if (ingredientCount <= 5 && words < 100) return 'Easy';
  if (ingredientCount <= 10 && words < 250) return 'Medium';
  return 'Hard';
}

// Estimate time from difficulty
function getTime(difficulty, instructions) {
  const text = (instructions || '').toLowerCase();
  const hourMatch = text.match(/(\d+)\s*hour/);
  const minMatch = text.match(/(\d+)\s*min/);
  if (hourMatch) return `${hourMatch[1]} hr${hourMatch[1]>1?'s':''}`;
  if (minMatch) {
    const m = parseInt(minMatch[1]);
    if (m > 90) return `${Math.round(m/60)} hrs`;
    return `${m} min`;
  }
  if (difficulty === 'Easy') return '20 min';
  if (difficulty === 'Medium') return '40 min';
  return '1 hr 30 min';
}

// Estimate XP from difficulty
function getXP(difficulty) {
  if (difficulty === 'Easy') return Math.floor(Math.random()*30)+20;
  if (difficulty === 'Medium') return Math.floor(Math.random()*40)+60;
  return Math.floor(Math.random()*60)+100;
}

// Map MealDB category to app category
function mapCategory(mealdbCategory, area) {
  const c = mealdbCategory.toLowerCase();
  const a = (area || '').toLowerCase();
  if (a === 'italian') return 'Italian';
  if (a === 'japanese') return 'Japanese';
  if (a === 'indian') return 'Indian';
  if (a === 'mexican') return 'Mexican';
  if (['chinese','thai','korean','vietnamese','japanese','filipino','malaysian'].includes(a)) return 'Asian';
  if (['greek','turkish','moroccan','tunisian','egyptian'].includes(a)) return 'Mediterranean';
  if (c === 'dessert' || c === 'pastry') return 'Baking';
  if (c === 'breakfast') return 'Breakfast';
  if (['beef','chicken','lamb','pork','seafood'].includes(c)) return 'Comfort';
  if (c === 'vegetarian' || c === 'vegan') return 'Healthy';
  if (c === 'pasta') return 'Italian';
  if (c === 'side') return 'Healthy';
  if (c === 'starter') return 'Quick';
  return 'Comfort';
}

// Estimate macros by category
function getMacros(category, ingredientCount) {
  const base = {
    'Italian': {calories:520,protein:18,carbs:68,fat:22,fiber:4},
    'Asian': {calories:420,protein:24,carbs:48,fat:16,fiber:4},
    'Japanese': {calories:380,protein:22,carbs:44,fat:14,fiber:3},
    'Indian': {calories:440,protein:16,carbs:52,fat:18,fiber:8},
    'Mexican': {calories:480,protein:22,carbs:52,fat:20,fiber:6},
    'Mediterranean': {calories:360,protein:18,carbs:32,fat:18,fiber:6},
    'Healthy': {calories:280,protein:12,carbs:36,fat:10,fiber:8},
    'Baking': {calories:340,protein:6,carbs:48,fat:16,fiber:2},
    'Breakfast': {calories:380,protein:14,carbs:42,fat:18,fiber:4},
    'Comfort': {calories:560,protein:32,carbs:38,fat:28,fiber:4},
    'Quick': {calories:320,protein:16,carbs:30,fat:14,fiber:4},
  };
  const m = base[category] || base['Comfort'];
  // Add small variation
  const v = () => Math.floor((Math.random()-0.5)*40);
  return {calories:m.calories+v(), protein:m.protein+Math.floor(v()/4), carbs:m.carbs+Math.floor(v()/2), fat:m.fat+Math.floor(v()/4), fiber:m.fiber+Math.floor(v()/8)};
}

// Parse ingredients from TheMealDB format
function getIngredients(meal) {
  const ings = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      const m = measure && measure.trim() ? measure.trim() + ' ' : '';
      ings.push(m + ing.trim());
    }
  }
  return ings;
}

// Parse instructions into steps
function getSteps(instructions) {
  if (!instructions) return [{title:'Prepare', body:'Follow the recipe instructions.', timer:0}];
  
  // Split by newlines or numbered steps
  let parts = instructions
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .filter(s => s.trim().length > 20);

  // If too few splits, try sentence splitting
  if (parts.length < 2) {
    parts = instructions.split(/\.\s+/).filter(s => s.trim().length > 20);
  }

  // Limit to 8 steps max, merge short ones
  if (parts.length > 8) {
    const merged = [];
    for (let i = 0; i < parts.length; i += Math.ceil(parts.length/6)) {
      merged.push(parts.slice(i, i + Math.ceil(parts.length/6)).join('. '));
    }
    parts = merged;
  }

  return parts.slice(0, 8).map((body, i) => {
    // Clean up step text
    body = body.replace(/^[\d\.\-\s]+/, '').trim();
    if (!body.endsWith('.')) body += '.';
    
    // Detect timers
    let timer = 0;
    const hrMatch = body.match(/(\d+)\s*hour/i);
    const minMatch = body.match(/(\d+)[\s-]*(?:to[\s-]*\d+\s*)?min/i);
    if (hrMatch) timer = parseInt(hrMatch[1]) * 3600;
    else if (minMatch) timer = parseInt(minMatch[1]) * 60;

    // Generate step title
    const titles = ['Prepare','Cook','Mix','Season','Add','Combine','Finish','Serve'];
    const keywords = {
      'heat|preheat|warm': 'Preheat',
      'mix|combine|stir|whisk': 'Mix',
      'chop|dice|slice|cut': 'Prep',
      'fry|sauté|cook|brown': 'Cook',
      'bake|roast|grill': 'Cook',
      'season|salt|pepper': 'Season',
      'serve|plate|garnish': 'Serve',
      'marinate|rest|chill|cool': 'Rest',
      'boil|simmer|reduce': 'Simmer',
    };
    let title = titles[i] || 'Cook';
    for (const [pattern, t] of Object.entries(keywords)) {
      if (new RegExp(pattern, 'i').test(body)) { title = t; break; }
    }

    return {title, body: body.slice(0, 300), timer};
  });
}

// Detect diets from ingredients
function getDiets(ingredients, category) {
  const text = ingredients.join(' ').toLowerCase();
  const meats = ['beef','chicken','pork','lamb','bacon','ham','turkey','fish','salmon','tuna','shrimp','prawn','anchovy','lard','gelatin'];
  const dairy = ['milk','cream','butter','cheese','yogurt','yoghurt'];
  const gluten = ['flour','bread','pasta','wheat','barley','rye'];
  
  const hasMeat = meats.some(m => text.includes(m));
  const hasDairy = dairy.some(d => text.includes(d));
  const hasGluten = gluten.some(g => text.includes(g));
  
  const diets = [];
  if (!hasMeat && !hasDairy) diets.push('Vegan');
  if (!hasMeat) diets.push('Vegetarian');
  if (!hasGluten) diets.push('Gluten-free');
  if (!hasDairy) diets.push('Dairy-free');
  if (diets.length === 0) diets.push('No restrictions');
  return diets;
}

async function fetchAll() {
  console.log('Fetching all categories from TheMealDB...');
  const catData = await get('https://www.themealdb.com/api/json/v1/1/categories.php');
  const categories = catData.categories.map(c => c.strCategory);
  console.log(`Found ${categories.length} categories:`, categories.join(', '));

  const allMeals = [];
  
  for (const category of categories) {
    console.log(`\nFetching ${category}...`);
    const listData = await get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`);
    if (!listData.meals) continue;
    
    const meals = listData.meals.slice(0, 25); // max 25 per category
    console.log(`  ${meals.length} meals found`);
    
    for (const meal of meals) {
      await sleep(150); // be polite to the API
      try {
        const detail = await get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        if (!detail.meals || !detail.meals[0]) continue;
        const m = detail.meals[0];
        
        const ingredients = getIngredients(m);
        const difficulty = getDifficulty(m.strInstructions, ingredients.length);
        const appCategory = mapCategory(category, m.strArea);
        
        allMeals.push({
          id: parseInt(m.idMeal),
          photo: m.strMealThumb + '/preview',  // TheMealDB's own verified photo
          name: m.strMeal,
          xp: getXP(difficulty),
          difficulty,
          time: getTime(difficulty, m.strInstructions),
          category: appCategory,
          diets: getDiets(ingredients, appCategory),
          macros: getMacros(appCategory, ingredients.length),
          done: false,
          ingredients,
          steps: getSteps(m.strInstructions),
          tip: m.strSource ? `Original recipe: ${m.strSource}` : `A classic ${m.strArea || appCategory} dish.`,
          sourceUrl: m.strSource || null,
          sourceName: 'TheMealDB',
          isFromDB: true,
        });
        
        process.stdout.write('.');
      } catch(e) {
        process.stdout.write('x');
      }
    }
  }

  console.log(`\n\nTotal recipes fetched: ${allMeals.length}`);

  // Write output file
  const fs = require('fs');
  
  // Write as JSON for Supabase import
  fs.writeFileSync('mealdb-recipes.json', JSON.stringify(allMeals, null, 2));
  console.log('Written to mealdb-recipes.json');
  
  // Write summary
  const summary = allMeals.map(m => `${m.id}: ${m.name} [${m.category}] - ${m.photo}`).join('\n');
  fs.writeFileSync('mealdb-summary.txt', summary);
  console.log('Written to mealdb-summary.txt');
  
  // Stats
  const cats = {};
  allMeals.forEach(m => cats[m.category] = (cats[m.category]||0)+1);
  console.log('\nBy category:');
  Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));
}

fetchAll().catch(console.error);
