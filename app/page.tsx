'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══ TOKENS ══════════════════════════════════════════════════════════════ */
const C = {
  flame:"#FF4D1C", ember:"#FF8C42", cream:"#FFF8F0", paper:"#FAF4EE",
  bark:"#3B2A1A",  sage:"#5C7A4E",  moss:"#8BAF78",  gold:"#F5C842",
  muted:"#9E8C7E", border:"#EEE5DC",pill:"#F0EBE6",  sky:"#4A90D9",
  plum:"#9B5DE5",  rose:"#E05C7A",  dark:"#111118",
};
const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@400;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box} body{margin:0;background:${C.paper};font-family:${BF}}
  ::-webkit-scrollbar{display:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes pop{0%,100%{transform:scale(1)}45%{transform:scale(1.42)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
  @keyframes levelUp{0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.15) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
  .ch:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(0,0,0,.11)!important}
  .tap:active{transform:scale(.94)!important} input,textarea,button{font-family:inherit}
`;

/* ═══ LEVELS ══════════════════════════════════════════════════════════════ */
// Infinite rank system — ranks repeat with multiplying thresholds
// You can drop ranks if inactive (weekly activity required above Rank 5)
const BASE_RANKS = [
  {title:"Prep Hand",     icon:"🌱", color:"#8BAF78", minDishes:0   },
  {title:"Home Cook",     icon:"🍳", color:"#FF8C42", minDishes:10  },
  {title:"Line Cook",     icon:"🔪", color:"#4A90D9", minDishes:25  },
  {title:"Demi Chef",     icon:"🍲", color:"#9B5DE5", minDishes:50  },
  {title:"Sous Chef",     icon:"👨‍🍳", color:"#E05C7A", minDishes:100 },
  {title:"Chef de Partie",icon:"⭐", color:"#F5C842", minDishes:200 },
  {title:"Head Chef",     icon:"👑", color:"#FF4D1C", minDishes:500 },
  {title:"Exec Chef",     icon:"🔥", color:"#CC2200", minDishes:1000},
  {title:"Legend",        icon:"💎", color:"#4A90D9", minDishes:2000},
];

function getRankInfo(totalCooked, weeklyActive=true){
  let rank = BASE_RANKS[0];
  for(const r of BASE_RANKS){ if(totalCooked >= r.minDishes) rank = r; else break; }
  const idx = BASE_RANKS.indexOf(rank);
  // Drop a rank if inactive above rank 4
  if(!weeklyActive && idx >= 4){
    rank = BASE_RANKS[Math.max(0, idx-1)];
  }
  const next = BASE_RANKS[idx+1]||null;
  const into = next ? totalCooked - rank.minDishes : 0;
  const span = next ? next.minDishes - rank.minDishes : 1;
  const pct = next ? Math.round(into/span*100) : 100;
  return {current:rank, next, into, span, pct, idx};
}

// Keep getLevelInfo as alias using xp (100xp ≈ 1 dish)
const LEVELS = BASE_RANKS.map((r,i)=>({level:i+1,title:r.title,icon:r.icon,color:r.color,minXp:r.minDishes*60}));
function getLevelInfo(xp){
  const dishes = Math.floor(xp/60);
  const info = getRankInfo(dishes, true);
  const cur = {...info.current, level: info.idx+1};
  const next = info.next ? {...info.next, level: info.idx+2} : null;
  return {current:cur, next, xpIntoLevel:info.into*60, xpForLevel:info.span*60, pct:info.pct};
}

/* ═══ SKILLS ══════════════════════════════════════════════════════════════ */
const SKILL_MAP = {
  Asian:{label:"Asian Cooking",icon:"🥢",color:C.flame},
  Indian:{label:"Indian Cooking",icon:"🫙",color:C.ember},
  Japanese:{label:"Japanese Cooking",icon:"🍱",color:C.rose},
  Italian:{label:"Italian Cooking",icon:"🍝",color:C.sage},
  Mexican:{label:"Mexican Cooking",icon:"🌮",color:C.gold},
  Mediterranean:{label:"Mediterranean",icon:"🫒",color:"#00A896"},
  Comfort:{label:"Comfort Food",icon:"🍲",color:C.plum},
  Healthy:{label:"Healthy Cooking",icon:"🥗",color:C.moss},
  Breakfast:{label:"Breakfast Skills",icon:"🍳",color:C.ember},
  Baking:{label:"Baking & Pastry",icon:"🍞",color:C.gold},
  Quick:{label:"Speed Cooking",icon:"⚡",color:C.sky},
};
const calcSkillLevel = n => Math.min(5,Math.floor(n/2));

/* ═══ BADGES ══════════════════════════════════════════════════════════════ */
const BADGES = [
  {id:"first_cook",  emoji:"🍳",label:"First Cook",     desc:"Complete your first recipe",          check:s=>s.total>=1},
  {id:"five_cooked", emoji:"🖐️",label:"High Five",      desc:"Complete 5 recipes",                  check:s=>s.total>=5},
  {id:"ten_cooked",  emoji:"🔟",label:"Ten Down",        desc:"Complete 10 recipes",                 check:s=>s.total>=10},
  {id:"streak_3",    emoji:"🔥",label:"On Fire",         desc:"Cook 3 days in a row",                check:s=>s.streak>=3},
  {id:"streak_7",    emoji:"💥",label:"Week Warrior",    desc:"Cook 7 days in a row",                check:s=>s.streak>=7},
  {id:"world_tour",  emoji:"🌍",label:"World Tour",      desc:"Cook from 5 different cuisines",      check:s=>s.cuisines>=5},
  {id:"asian_3",     emoji:"🥢",label:"Asian Apprentice",desc:"Cook 3 Asian dishes",                 check:s=>(s.cats.Asian||0)>=3},
  {id:"italian_3",   emoji:"🍝",label:"Pasta Pro",       desc:"Cook 3 Italian dishes",               check:s=>(s.cats.Italian||0)>=3},
  {id:"breakfast_5", emoji:"🌅",label:"Early Bird",      desc:"Cook 5 breakfast dishes",             check:s=>(s.cats.Breakfast||0)>=5},
  {id:"sprint",      emoji:"🏃",label:"Sprinter",        desc:"Complete the 5 Dish Sprint",          check:s=>s.challs.includes("sprint_5")},
  {id:"explorer",    emoji:"🗺️",label:"Explorer",        desc:"Complete the 10 Meal Explorer",       check:s=>s.challs.includes("explorer_10")},
  {id:"marathon",    emoji:"🏅",label:"Marathoner",      desc:"Complete the 30 Cook Marathon",       check:s=>s.challs.includes("marathon_30")},
  {id:"mwah_10",    emoji:"👏",label:"Social Star",     desc:"Receive 10 🤌 Mwahs on your posts",      check:s=>s.mwah>=10},
  {id:"level_5",     emoji:"👨‍🍳",label:"Sous Chef",      desc:"Reach Level 5",                       check:s=>s.level>=5},
];

/* ═══ CHALLENGES ══════════════════════════════════════════════════════════ */
const CHALLENGES = [
  {
    id:"sprint_5",name:"5 Dish Sprint",emoji:"🏃",color:"#FF4D1C",dark:"#CC3A12",
    difficulty:"Beginner",duration:"1–2 weeks",target:5,unit:"dishes",xp:200,
    milestones:[1,3,5],
    tagline:"Your starting line. Cook 5 dishes.",
    about:`The 5 Dish Sprint is where every great cook begins. No pressure, no complexity — just five meals cooked from scratch.

This challenge is designed for anyone who wants to build a consistent cooking habit. Cook any five recipes from our library — there are no restrictions. The only goal is to finish.

Many of our users say this first challenge is what changed their relationship with food entirely.`,
    learn:["How to read and follow a recipe with confidence","Basic mise en place — setting up before you start","How to manage time in the kitchen without stress"],
    tips:["Start with Easy recipes — build the habit first, impress people later","Cook things you already enjoy eating","Don't aim for perfection. A slightly overdone steak still counts."],
  },
  {
    id:"explorer_10",name:"10 Meal Explorer",emoji:"🗺️",color:"#4A90D9",dark:"#2E6DB3",
    difficulty:"Beginner",duration:"2–3 weeks",target:10,unit:"dishes",xp:400,
    milestones:[3,6,10],
    tagline:"Branch out. Try 10 different recipes.",
    about:`You've done five. Now do ten — and this time, we want you to try something genuinely new.

The 10 Meal Explorer challenge asks you to cook 10 different recipes, but the real goal is to push beyond your comfort zone. Try a cuisine you've never cooked. Attempt a technique you've been avoiding.

At 10 meals you'll start to notice real patterns — how heat behaves, how flavours balance, how timing affects texture. This is where cooking starts to click.`,
    learn:["How different cuisines approach the same ingredients differently","Basic sauce and flavour building","How to improvise when things don't go exactly to plan"],
    tips:["Pick at least one dish from a cuisine you've never cooked before","Cook one dish twice — comparing your attempts is incredibly instructive","Don't skip the chef's tips — they're the things cookbooks don't tell you"],
  },
  {
    id:"weeknight_5",name:"Weeknight Warrior",emoji:"⚡",color:"#9B5DE5",dark:"#7A40BF",
    difficulty:"Intermediate",duration:"1 week",target:5,unit:"weeknight meals",xp:300,
    milestones:[2,4,5],
    tagline:"Cook Monday to Friday. Five nights straight.",
    about:`Five nights. No takeaways. No excuses.

The Weeknight Warrior is one of the most practically useful challenges on the app. Real life happens on a Tuesday at 7pm when you're tired and there's nothing obvious in the fridge.

This challenge teaches you to cook fast, smart, and consistently. All five meals must be cooked Monday through Friday. Complete this once and you'll wonder why you ever ordered delivery.`,
    learn:["How to cook a proper meal in under 30 minutes","Smart planning so you always have ingredients ready","How to batch prep to make weeknights easier"],
    tips:["Do a Sunday shop for the whole week before you start","Keep a mental list of 5 dishes you can cook quickly","It's fine to cook the same protein differently across multiple nights"],
  },
  {
    id:"breakfast_7",name:"Breakfast Club",emoji:"🌅",color:"#F5C842",dark:"#C9A020",
    difficulty:"Beginner",duration:"1–2 weeks",target:7,unit:"breakfasts",xp:280,
    milestones:[3,5,7],
    tagline:"Master the most important meal. Cook 7 breakfasts.",
    about:`Most people eat the same breakfast every single day. This challenge will change that.

Seven breakfasts, seven different recipes. From a perfect French omelette to proper overnight oats to a full shakshuka — you'll discover that breakfast is one of the richest, most varied meals in the world, and also one of the quickest to cook.

The Breakfast Club is a great first challenge for busy people because most breakfast recipes take under 20 minutes.`,
    learn:["Egg cookery — the foundation of so much cooking","How to work quickly under time pressure","Batter consistency and what makes the difference"],
    tips:["Prep ingredients the night before if you're time-poor in the mornings","Medium heat is your friend — eggs cook faster than you think","A good non-stick pan is all you need for most breakfast dishes"],
  },
  {
    id:"world_tour",name:"World Tour",emoji:"🌍",color:"#00A896",dark:"#007A6E",
    difficulty:"Intermediate",duration:"3–5 weeks",target:5,unit:"cuisines",xp:500,
    milestones:[2,4,5],
    tagline:"Cook from 5 different countries.",
    about:`Every cuisine in the world has solved the same problems differently — how to use heat, how to balance flavour, how to feed people well.

The World Tour challenge asks you to cook one dish from each of five different cuisines. You'll come away with a broader understanding of how cooking works, and a repertoire that makes every dinner party interesting.

Suggested: Japan, India, Mexico, Italy, and one of your own choosing. Any five distinct cuisines count.`,
    learn:["How spice, acid, fat, and salt work differently across cuisines","The importance of authentic ingredients and where to find them","How to navigate recipes from unfamiliar culinary traditions"],
    tips:["Source at least one authentic ingredient per cuisine — it makes a huge difference","Watch a YouTube video on the cuisine before you cook — context helps","Don't simplify too much. The challenge is to actually cook the dish."],
  },
  {
    id:"date_night_3",name:"Date Night Series",emoji:"🕯️",color:"#E05C7A",dark:"#B33A57",
    difficulty:"Intermediate",duration:"3 weeks",target:3,unit:"impressive meals",xp:450,
    milestones:[1,2,3],
    tagline:"Cook 3 genuinely impressive meals.",
    about:`Three meals that will make someone's jaw drop.

The Date Night Series pushes you to cook with intention. Every detail matters: the ingredients you source, the timing, the plating, the care you put in. Each of the three meals should be a proper occasion — cooked for someone else.

This is the challenge that turns cooking from a chore into a skill you're proud of.`,
    learn:["How to plate food attractively","How to time multiple components so everything is ready together","When quality ingredients matter and when they don't"],
    tips:["Choose dishes with a visual wow factor as well as a flavour one","Practice the dish once on your own before cooking it for someone else","Read the whole recipe the night before — no surprises mid-cook"],
  },
  {
    id:"half_20",name:"20 Meal Journey",emoji:"🚶",color:"#FF8C42",dark:"#CC6A2A",
    difficulty:"Intermediate",duration:"4–6 weeks",target:20,unit:"meals",xp:800,
    milestones:[5,10,15,20],
    tagline:"Twenty meals. Real, lasting growth.",
    about:`At 20 meals you will be a noticeably better cook than when you started. We promise.

The 20 Meal Journey is where habits become skills. By meal 20 you'll have developed real intuition — you'll taste a dish and know what it needs, you'll read a recipe and see where it might go wrong, you'll have a growing library of dishes you can cook without thinking.

This is the challenge most of our users say changed how they eat permanently.`,
    learn:["Real culinary intuition — tasting and adjusting without a recipe","How to build a personal repertoire of go-to dishes","The relationship between technique and flavour"],
    tips:["Keep a simple cooking journal — even just one line about what you'd change","Repeat your favourites. Getting a dish to 9/10 is a real skill.","Cook with a friend for at least a few meals — you'll learn faster"],
  },
  {
    id:"marathon_30",name:"30 Cook Marathon",emoji:"🏅",color:"#3B2A1A",dark:"#1A1008",
    difficulty:"Advanced",duration:"5–8 weeks",target:30,unit:"meals",xp:1500,
    milestones:[5,10,20,30],
    tagline:"The full marathon. Thirty meals. One defining month.",
    about:`This is the one that changes everything.

Thirty meals. You will cook almost every day. You will have evenings where you don't feel like it and you'll cook anyway. You'll mess something up badly at least twice. You'll make at least one dish that's genuinely better than you can get in a restaurant.

By meal 30 you will think about food differently. The 30 Cook Marathon is the highest challenge on this app. Very few people complete it. There is no other single thing you can do that will improve your cooking more.`,
    learn:["Deep culinary intuition that only comes from repetition","How to manage a week of cooking without waste","At least three dishes you can cook from memory at a level that impresses anyone"],
    tips:["Block out Sunday evening each week to plan ahead","Accept that some meals will be failures — that's part of the process","Tell someone you're doing this. Accountability is real.","Consistency over perfection, always."],
  },
];

/* ═══ RECIPES ═════════════════════════════════════════════════════════════ */
const mk=(cal,pro,carb,fat,fib=2)=>({calories:cal,protein:pro,carbs:carb,fat,fiber:fib});
const RECIPES = [
  {id:1,photo:"https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80&fit=crop&auto=format",name:"Perfect French Omelette",emoji:"🥚",xp:50,difficulty:"Medium",time:"8 min",category:"Breakfast",
   diets:["Vegetarian","Gluten-free","Keto"],macros:mk(290,18,1,22,0),done:false,
   ingredients:["3 large eggs","20g cold unsalted butter, cut into small cubes","Pinch of fine salt and white pepper","Small handful fresh chives, finely chopped"],
   steps:[
     {title:"Beat the eggs",body:"Crack all three eggs into a bowl. Add salt and white pepper. Beat vigorously with a fork for 30 seconds until completely uniform — no streaks of white remaining."},
     {title:"Heat the pan and add butter",body:"Place a 20cm non-stick pan over medium-high heat. Add two-thirds of the butter. When it foams and just starts to colour at the edges, pour in the eggs immediately."},
     {title:"Stir constantly",body:"Using a silicone spatula, stir the eggs rapidly in small circles while shaking the pan. The eggs should form small, soft curds. This should take about 45 seconds.",timer:45},
     {title:"Smooth and rest",body:"When mostly set but still slightly wet on top, remove from heat. Let sit 10 seconds — residual heat finishes it."},
     {title:"Roll and plate",body:"Tilt the pan at 45°. Fold the near edge over the centre. Tip onto a warm plate, folding the final edge underneath. It should be pale yellow — no browning. Add remaining butter on top to melt and gloss. Scatter chives."},
   ],
   tip:"The entire omelette should take under 90 seconds once the eggs hit the pan. If it's taking longer, your heat is too low."},
  {id:2,photo:"https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80&fit=crop&auto=format",name:"Shakshuka",emoji:"🍳",xp:65,difficulty:"Easy",time:"25 min",category:"Breakfast",
   diets:["Vegetarian","Gluten-free","Dairy-free"],macros:mk(320,18,24,16,5),done:false,
   ingredients:["6 large eggs","2×400g cans chopped tomatoes","1 large red bell pepper, diced","1 large white onion, finely diced","5 cloves garlic, minced","2 tsp ground cumin","1½ tsp smoked paprika","½ tsp cayenne","3 tbsp olive oil","Salt and black pepper","Feta (optional), fresh coriander, pita to serve"],
   steps:[
     {title:"Build the base",body:"Heat olive oil in a large wide pan over medium heat. Cook onion 8 minutes until soft and golden.",timer:480},
     {title:"Add aromatics",body:"Add diced pepper and cook 3 minutes more. Add garlic, cumin, paprika, and cayenne. Stir 1 full minute until fragrant.",timer:60},
     {title:"Simmer the sauce",body:"Add both cans of tomatoes. Season generously. Simmer uncovered 10 minutes, stirring occasionally, until the sauce thickens and darkens.",timer:600},
     {title:"Add the eggs",body:"Make 6 wells in the sauce with a spoon. Crack one egg into each well carefully, keeping the yolks intact."},
     {title:"Cover and cook",body:"Cover the pan. Cook on medium-low for 5–8 minutes — 5 min for runny yolks, 8 min for fully set. Watch carefully.",timer:360},
     {title:"Finish and serve",body:"Crumble feta over the top if using. Add fresh coriander. Serve directly from the pan with pita or bread."},
   ],
   tip:"Pull the pan off heat 1 minute before the eggs look done. Residual heat finishes them perfectly."},
  {id:3,photo:"https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&q=80&fit=crop&auto=format",name:"Overnight Oats",emoji:"🥣",xp:30,difficulty:"Easy",time:"10 min",category:"Breakfast",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(380,12,58,10,8),done:false,
   ingredients:["400g (4 cups) rolled oats — not instant","500ml oat milk or any milk","100ml cold water","4 tbsp chia seeds","4 tbsp maple syrup","2 tsp vanilla extract","Pinch of salt","To serve: fresh berries, banana, nut butter"],
   steps:[
     {title:"Mix the dry ingredients",body:"Combine oats, chia seeds, maple syrup, vanilla, and salt in a large bowl. Stir well."},
     {title:"Add the liquid",body:"Pour in oat milk and cold water. Stir thoroughly for 1 minute, making sure chia seeds aren't clumping."},
     {title:"Divide into jars",body:"Divide between 4 mason jars or sealed containers. Seal the lids tightly."},
     {title:"Refrigerate overnight",body:"Refrigerate at least 6 hours, ideally overnight. The oats will thicken and the chia seeds will gel into a creamy texture.",timer:0},
     {title:"Top and serve",body:"In the morning, add a splash more milk if you prefer a looser texture. Top with fresh berries, banana slices, and a spoonful of nut butter."},
   ],
   tip:"Make 4 jars on Sunday and you have breakfast ready Monday through Thursday."},
  {id:4,photo:"https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80&fit=crop&auto=format",name:"Avocado Toast & Poached Eggs",emoji:"🥑",xp:40,difficulty:"Easy",time:"15 min",category:"Breakfast",
   diets:["Vegetarian","Dairy-free"],macros:mk(440,18,36,24,9),done:false,
   ingredients:["2 ripe avocados","4 large eggs","4 thick slices sourdough","1 lemon","1 tsp white wine vinegar","Chilli flakes","Flaky sea salt and black pepper","Microgreens to serve"],
   steps:[
     {title:"Toast the bread",body:"Toast sourdough until deeply golden and properly crunchy — not pale.",timer:180},
     {title:"Smash the avocado",body:"Scoop avocado flesh into a bowl. Add a generous squeeze of lemon, flaky salt, and plenty of black pepper. Mash with a fork to a chunky texture. Taste — season more than you think necessary."},
     {title:"Set up for poaching",body:"Fill a wide shallow pan with 8cm of water and the vinegar. Bring to a gentle simmer — small bubbles, not a rolling boil."},
     {title:"Poach the eggs",body:"Crack one egg into a small cup. Swirl the water gently. Slide the egg into the centre. Repeat. Poach exactly 3 minutes for runny yolks.",timer:180},
     {title:"Assemble",body:"Spread smashed avocado thickly on toast. Remove eggs with a slotted spoon, dab dry. Place on avocado. Add chilli flakes, sea salt, and microgreens."},
   ],
   tip:"The vinegar helps the egg white coagulate around the yolk. Fresh eggs hold together far better than old ones."},
  {id:5,photo:"https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80&fit=crop&auto=format",name:"Banana Pancakes",emoji:"🥞",xp:45,difficulty:"Easy",time:"20 min",category:"Breakfast",
   diets:["Vegetarian"],macros:mk(380,10,58,12,3),done:false,
   ingredients:["200g plain flour","1 tbsp baking powder","2 tbsp caster sugar","Pinch of salt","2 ripe bananas, mashed","2 large eggs","200ml whole milk","2 tbsp melted butter plus extra for the pan","1 tsp vanilla extract","Maple syrup and berries to serve"],
   steps:[
     {title:"Mix dry ingredients",body:"Sift flour, baking powder, sugar, and salt into a large bowl. Make a well in the centre."},
     {title:"Mash bananas and combine wet",body:"Mash bananas to near-smooth. Whisk together with eggs, milk, melted butter, and vanilla."},
     {title:"Make the batter",body:"Pour wet mixture into the well. Fold gently until just combined — lumps are fine and produce fluffier pancakes. Rest 5 minutes.",timer:300},
     {title:"Cook",body:"Medium heat, small knob of butter. Pour 3–4 tbsp batter per pancake. Cook until bubbles form on the surface and edges look set, about 2–3 minutes.",timer:150},
     {title:"Flip once",body:"Flip once. Cook 1–2 minutes more until golden. Never press down on pancakes — this deflates them.",timer:90},
   ],
   tip:"The riper the banana — the more brown spots the better — the sweeter and more intensely flavoured the pancakes."},
  {id:6,photo:"https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80&fit=crop&auto=format",name:"Aglio e Olio",emoji:"🍝",xp:55,difficulty:"Easy",time:"15 min",category:"Italian",
   diets:["Vegetarian","Dairy-free"],macros:mk(520,14,72,20,3),done:false,
   ingredients:["400g spaghetti","10 cloves garlic, very thinly sliced","100ml extra-virgin olive oil — good quality","1½ tsp dried chilli flakes","Large bunch flat-leaf parsley, chopped","Fine salt for the pasta water","Pecorino Romano or Parmesan to serve"],
   steps:[
     {title:"Salt the water aggressively",body:"Boil a large pot of water. Add 2 tbsp fine salt — it should taste like mild seawater. This is the only chance to season the pasta itself.",timer:600},
     {title:"Cook pasta 2 min under",body:"Cook spaghetti until 2 minutes under al dente. Before draining, reserve at least 300ml of pasta water in a mug. Keep it warm.",timer:480},
     {title:"Toast garlic very slowly",body:"Add olive oil and garlic to a COLD large frying pan. Place over medium-low heat. Cook slowly 8–10 minutes, stirring often, until pale golden and fragrant. It must not brown.",timer:480},
     {title:"Add chilli and emulsify",body:"Add chilli flakes. Stir 30 seconds. Add a full ladle of pasta water — it will hiss. Stir vigorously until the water and oil look slightly milky and creamy."},
     {title:"Toss the pasta",body:"Add the drained pasta directly into the pan. Toss constantly over medium heat 1–2 minutes, adding more pasta water splash by splash until the sauce clings to every strand and looks glossy. Fold in most of the parsley."},
     {title:"Serve immediately",body:"Plate into warm bowls. Finish with remaining parsley, a drizzle of your best olive oil, and plenty of Pecorino."},
   ],
   tip:"The pasta water IS the sauce. The starch emulsifies with olive oil to create a silky, clinging sauce. Use far more than you think you need."},
  {id:7,photo:"https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&q=80&fit=crop&auto=format",name:"Cacio e Pepe",emoji:"🧀",xp:85,difficulty:"Hard",time:"20 min",category:"Italian",
   diets:["Vegetarian"],macros:mk(580,20,70,24,2),done:false,
   ingredients:["400g spaghetti","100g Pecorino Romano, very finely grated (use a microplane)","50g Parmesan, very finely grated","2 tsp whole black peppercorns","Fine salt for pasta water"],
   steps:[
     {title:"Toast and grind the pepper",body:"Toast peppercorns in a dry pan 2 minutes until fragrant. Grind in a mortar to a medium-coarse texture — pieces, not dust.",timer:120},
     {title:"Cook the pasta",body:"Cook pasta in well-salted water until 2 minutes under al dente. Reserve at least 400ml pasta water. Keep it warm.",timer:480},
     {title:"Toast pepper in pan",body:"In a large frying pan over medium heat, add crushed pepper with 2 tbsp pasta water. Swirl 30 seconds."},
     {title:"Add pasta",body:"Add drained pasta and 100ml pasta water. Toss vigorously over medium heat 1 minute.",timer:60},
     {title:"Add cheese off the heat — critical",body:"REMOVE FROM HEAT. This step must happen off the heat or the cheese clumps. Add both cheeses in a thin stream, tossing constantly and adding splashes of pasta water to loosen. The sauce should be glossy and creamy."},
     {title:"Adjust and serve",body:"Return to very low heat if needed. Add pasta water little by little until perfect consistency. Plate into warm bowls with more pepper and Pecorino."},
   ],
   tip:"Cacio e Pepe has 4 ingredients but is genuinely difficult. The cheese only works off the heat, with very fine grating, and plenty of starchy pasta water. Your first attempt may fail. Your second won't."},
  {id:8,photo:"https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80&fit=crop&auto=format",name:"Lemon Ricotta Pasta",emoji:"🍋",xp:45,difficulty:"Easy",time:"18 min",category:"Italian",
   diets:["Vegetarian"],macros:mk(490,18,66,16,3),done:false,
   ingredients:["400g rigatoni or pappardelle","250g whole-milk ricotta — the freshest you can find","Zest and juice of 2 unwaxed lemons","60g Parmesan, finely grated","25g unsalted butter","3 cloves garlic, finely grated","Large handful fresh basil","Salt and plenty of cracked black pepper"],
   steps:[
     {title:"Cook the pasta",body:"Boil pasta in heavily salted water until al dente. Reserve a generous cup (300ml) of pasta water before draining.",timer:480},
     {title:"Build the base",body:"In the warm empty pasta pot over low heat, melt butter. Add grated garlic. Cook 30 seconds — soften, don't colour. Remove from heat entirely."},
     {title:"Make the sauce",body:"Add ricotta, lemon zest, lemon juice, and half the Parmesan. Add 3–4 tbsp hot pasta water. Stir into a loose, creamy sauce."},
     {title:"Toss",body:"Add the drained pasta. Toss well, adding pasta water until the sauce is glossy and coats every piece. Season very heavily with black pepper."},
     {title:"Finish",body:"Taste and adjust — it should be bright, lemony, creamy, and peppery. Tear in basil. Top with remaining Parmesan and more lemon zest."},
   ],
   tip:"The quality of the ricotta is almost the entire dish. Buy the best, freshest whole-milk ricotta you can find."},
  {id:9,photo:"https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80&fit=crop&auto=format",name:"Thai Green Curry",emoji:"🍛",xp:120,difficulty:"Hard",time:"45 min",category:"Asian",
   diets:["Gluten-free","Dairy-free"],macros:mk(520,34,28,32,4),done:false,
   ingredients:["400ml full-fat coconut milk","3 tbsp green curry paste (Mae Ploy brand recommended)","600g chicken thigh, sliced","1 zucchini, sliced","6–8 Thai eggplants, quartered","4 kaffir lime leaves, torn","2 tbsp fish sauce","1 tbsp palm sugar","Large handful Thai basil","Jasmine rice to serve"],
   steps:[
     {title:"Fry paste in coconut cream",body:"Open coconut milk without shaking. Spoon the thick cream from the top into a hot wok. Fry over high heat until it bubbles and oil separates. Add curry paste. Fry 2 full minutes, stirring constantly, until darkened and fragrant.",timer:120},
     {title:"Seal the chicken",body:"Add chicken pieces. Toss in the paste and fry 3–4 minutes until sealed on all sides.",timer:240},
     {title:"Add coconut milk",body:"Pour in remaining coconut milk. Add torn kaffir lime leaves. Bring to a gentle simmer — never a boil, which makes coconut milk split."},
     {title:"Add vegetables",body:"Add zucchini and eggplant. Simmer on medium-low 8–10 minutes until tender.",timer:540},
     {title:"Season and serve",body:"Season with fish sauce and palm sugar — the balance of salty and sweet is the whole point of Thai cooking. Stir in Thai basil just before serving. Serve over jasmine rice."},
   ],
   tip:"Frying the paste in coconut cream before adding liquid transforms it from raw and sharp to deep and fragrant. This is the most important step."},
  {id:10,photo:"https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80&fit=crop&auto=format",name:"Miso Glazed Salmon",emoji:"🐟",xp:80,difficulty:"Medium",time:"25 min",category:"Japanese",
   diets:["Gluten-free","Dairy-free"],macros:mk(420,38,16,22,1),done:false,
   ingredients:["2 salmon fillets 200g each, skin on","3 tbsp white miso paste","2 tbsp mirin","1 tbsp tamari (gluten-free soy sauce)","1 tsp sesame oil","2 cloves garlic, grated","1 tsp fresh ginger, grated","Spring onions and sesame seeds to serve","Steamed rice to serve"],
   steps:[
     {title:"Make the glaze",body:"Whisk together miso, mirin, tamari, sesame oil, garlic, and ginger until completely smooth."},
     {title:"Pat dry and coat",body:"Pat salmon thoroughly dry with kitchen paper — moisture prevents caramelisation. Coat flesh side generously in the glaze. Rest 10 minutes at room temperature.",timer:600},
     {title:"Broil",body:"Preheat grill/broiler to maximum for 5 minutes. Place salmon skin-side down on a foil-lined tray. Broil 4–6cm from heat for 6–8 minutes until the glaze is deep amber and caramelised.",timer:420},
     {title:"Rest and serve",body:"Salmon is done when it just flakes when pressed — the very centre should be slightly translucent still. Rest 2 minutes. Scatter spring onions and sesame. Serve over rice."},
   ],
   tip:"Watch closely in the final 2 minutes — miso sugar burns very fast. Deep amber is the goal, not black char."},
  {id:11,photo:"https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600&q=80&fit=crop&auto=format",name:"Sichuan Mapo Tofu",emoji:"🌶️",xp:95,difficulty:"Medium",time:"25 min",category:"Asian",
   diets:["Vegan","Vegetarian","Gluten-free"],macros:mk(280,14,18,16,3),done:false,
   ingredients:["500g silken tofu, carefully drained and cubed","3 tbsp doubanjiang (Pixian chilli bean paste)","5 cloves garlic, minced","2 tsp fresh ginger, minced","1 tbsp Sichuan peppercorns, toasted and ground","250ml vegetable stock","2 tbsp soy sauce","1 tsp dark soy sauce","2 tsp cornstarch mixed with 2 tbsp cold water","2 tbsp neutral oil","3 spring onions, sliced","Steamed rice to serve"],
   steps:[
     {title:"Toast Sichuan pepper",body:"Toast peppercorns in a dry pan 1–2 min until fragrant. Grind in a mortar to a medium-fine powder. Set aside.",timer:120},
     {title:"Fry doubanjiang",body:"Heat oil in a wok. Fry doubanjiang, stirring constantly, for 2 minutes until the oil turns red and fragrant.",timer:120},
     {title:"Add aromatics",body:"Add garlic and ginger. Stir-fry 1 minute until soft."},
     {title:"Build the sauce",body:"Add stock, soy sauce, and dark soy sauce. Bring to a simmer."},
     {title:"Add tofu gently",body:"Slide in tofu cubes carefully — don't stir vigorously. Tilt the wok to spoon sauce over the tofu. Simmer 3–4 minutes.",timer:240},
     {title:"Thicken and finish",body:"Stir cornstarch mixture, pour slowly into wok while swirling. Sauce will thicken in 1–2 minutes. Finish with ground Sichuan pepper and spring onions."},
   ],
   tip:"Doubanjiang is the soul of this dish. The combination of doubanjiang heat and Sichuan pepper numbing (má là) is what defines it — don't skip either."},
  {id:12,photo:"https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80&fit=crop&auto=format",name:"Chicken Tikka Masala",emoji:"🍲",xp:105,difficulty:"Medium",time:"1 hr",category:"Indian",
   diets:["Gluten-free"],macros:mk(490,36,24,28,3),done:false,
   ingredients:["700g chicken breast, cut into large chunks","200g full-fat Greek yoghurt","3 tbsp tikka masala paste","400ml passata","200ml double cream","1 large onion, finely diced","5 cloves garlic, minced","2 tsp ginger paste","2 tsp garam masala","3 tbsp neutral oil","Salt","Fresh coriander and basmati rice to serve"],
   steps:[
     {title:"Marinate",body:"Mix yoghurt with 2 tbsp tikka paste and 1 tsp salt. Add chicken. Coat thoroughly. Marinate at least 30 minutes at room temperature, overnight in fridge for best results.",timer:1800},
     {title:"Char the chicken",body:"Preheat grill/broiler to maximum. Spread chicken on a foil-lined tray. Grill 6–8 minutes until charred in spots and cooked through.",timer:480},
     {title:"Build the sauce",body:"Fry onion in oil for 10 minutes until deeply golden. Add garlic, ginger, remaining tikka paste, and garam masala. Fry 2 minutes.",timer:720},
     {title:"Add tomato and simmer",body:"Add passata. Simmer 15 minutes until the raw tomato taste cooks out.",timer:900},
     {title:"Finish with cream and chicken",body:"Add double cream and charred chicken. Simmer gently 10 minutes. Taste and adjust salt. Top with coriander. Serve with basmati rice and naan."},
   ],
   tip:"The charring step is what separates real tikka masala from a plain curry sauce. The Maillard reaction on the marinated chicken creates flavour compounds the sauce cannot replicate."},
  {id:13,photo:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&fit=crop&auto=format",name:"Chana Masala",emoji:"🫘",xp:65,difficulty:"Easy",time:"35 min",category:"Indian",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(360,16,48,12,12),done:false,
   ingredients:["2×400g cans chickpeas, drained","1×400g can chopped tomatoes","1 large onion, finely diced","5 cloves garlic, minced","2 tsp fresh ginger, minced","2 green chillies, sliced","2 tsp cumin","2 tsp ground coriander","1½ tsp garam masala","1 tsp turmeric","3 tbsp neutral oil","Juice of 1 lemon","Fresh coriander and naan to serve"],
   steps:[
     {title:"Caramelise the onion — don't rush",body:"Heat oil over medium heat. Add onion. Cook 12–14 minutes, stirring regularly, until deeply golden brown. This is the flavour foundation — don't rush it.",timer:840},
     {title:"Add aromatics and spices",body:"Add garlic, ginger, and chillies. Fry 2 minutes. Add cumin, coriander, turmeric. Fry 1 minute until fragrant.",timer:180},
     {title:"Add tomatoes",body:"Add chopped tomatoes. Cook on medium heat 8–10 minutes until the oil begins to separate at the edges — this is the 'bhunao' stage.",timer:600},
     {title:"Add chickpeas",body:"Add drained chickpeas. Stir to coat. Mash roughly one-third of the chickpeas against the side of the pan — this thickens the sauce naturally."},
     {title:"Simmer and finish",body:"Add garam masala. Simmer 8–10 minutes until thick. Add lemon juice. Taste and adjust salt, chilli, and lemon. Garnish with coriander.",timer:600},
   ],
   tip:"The deeply caramelised onion is not optional. If your onions are pale and soft after 5 minutes, your heat is too low. They should be close to dark brown."},
  {id:14,photo:"https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80&fit=crop&auto=format",name:"Butter Chicken",emoji:"🍗",xp:110,difficulty:"Medium",time:"50 min",category:"Indian",
   diets:["Gluten-free"],macros:mk(540,38,18,36,2),done:false,
   ingredients:["700g chicken thigh, cut into large pieces","200g full-fat yoghurt","2 tsp garam masala","1 tsp turmeric","1 tsp smoked paprika","3 tbsp butter (real butter — not oil)","1 large onion, diced","6 cloves garlic","2 tsp ginger paste","1×400g can whole tomatoes","200ml double cream","1 tsp sugar","Salt","Naan and coriander to serve"],
   steps:[
     {title:"Marinate",body:"Combine yoghurt, garam masala, turmeric, paprika, and 1 tsp salt. Add chicken. Marinate at least 30 minutes.",timer:1800},
     {title:"Sear the chicken",body:"Melt 1 tbsp butter over high heat. Sear chicken in batches until browned on all sides. Set aside — doesn't need to be fully cooked yet.",timer:480},
     {title:"Build the sauce",body:"Melt remaining butter. Fry onion 8 minutes until soft. Add garlic and ginger. Cook 2 minutes more."},
     {title:"Add tomatoes and blend",body:"Add whole tomatoes, breaking them up. Add 100ml water. Simmer 15 minutes. Blend completely smooth with a stick blender.",timer:900},
     {title:"Finish",body:"Return to heat. Add cream, sugar, and salt. Add seared chicken. Simmer gently 15–20 minutes until thick and glossy.",timer:1200},
     {title:"The finishing touch",body:"Remove from heat. Stir in one final knob of cold butter — this adds the signature silkiness. Serve with warm naan and coriander."},
   ],
   tip:"The final cold knob of butter stirred in off the heat is what gives butter chicken its silky, glossy texture. Don't skip it."},
  {id:15,photo:"https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80&fit=crop&auto=format",name:"Classic Hummus",emoji:"🫘",xp:35,difficulty:"Easy",time:"15 min",category:"Mediterranean",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(280,10,30,14,6),done:false,
   ingredients:["2×400g cans chickpeas, reserve liquid from one can","4 tbsp good-quality tahini (stir the jar well first)","Juice of 2 lemons","2 cloves garlic","60ml ice cold water","4 tbsp extra-virgin olive oil plus more to serve","1 tsp fine salt","Pinch of cumin","Smoked paprika and fresh parsley to garnish"],
   steps:[
     {title:"Blend tahini first",body:"Add tahini, lemon juice, garlic, and salt to a food processor. Process 1 full minute until the tahini becomes pale and creamy."},
     {title:"Add chickpeas",body:"Add the drained chickpeas. Process for 2 minutes, scraping down the sides occasionally."},
     {title:"Loosen with ice water",body:"With the processor running, pour in ice cold water in a steady stream. The cold water creates a lighter, whipped texture. Process 2–3 more minutes until completely smooth.",timer:180},
     {title:"Season and adjust",body:"Taste carefully. Add more lemon juice for brightness, more salt for depth, more garlic for punch. Add reserved chickpea liquid for looser consistency."},
     {title:"Serve",body:"Spread into a shallow bowl. Make a well in the centre with the back of a spoon. Pour olive oil generously into the well. Dust with smoked paprika and scatter parsley."},
   ],
   tip:"Most hummus is disappointingly grainy. The fix is time: blend for longer than feels necessary — at least 4 minutes total. Ice cold water is key to that light, smooth texture."},
  {id:16,photo:"https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80&fit=crop&auto=format",name:"Chimichurri Steak",emoji:"🥩",xp:100,difficulty:"Medium",time:"30 min",category:"Mediterranean",
   diets:["Gluten-free","Dairy-free"],macros:mk(560,46,4,38,1),done:false,
   ingredients:["2 ribeye or sirloin steaks 250g each, at room temperature","Large bunch flat-leaf parsley, about 50g leaves","4 cloves garlic","2 tbsp red wine vinegar","½ tsp dried chilli flakes","100ml extra-virgin olive oil","1 tsp dried oregano","Flaky sea salt and cracked black pepper"],
   steps:[
     {title:"Make chimichurri — rest it",body:"Finely chop parsley and garlic by hand — not a food processor. Combine with vinegar, chilli, oregano, olive oil, salt, and pepper. Rest at room temperature at least 30 minutes. The resting is not optional.",timer:1800},
     {title:"Dry and season the steaks",body:"Pat steaks completely dry on all sides. Season very generously with flaky salt and cracked pepper on both sides — more than feels right."},
     {title:"Screaming-hot pan",body:"Heat a cast iron pan over highest heat for 3–4 minutes until it smokes. Add a small amount of neutral oil. Place steaks in pan — they should sear loudly on contact. Do not move them for 3 minutes.",timer:180},
     {title:"Flip and baste",body:"Flip once. Cook 2–3 minutes more for medium-rare (52–54°C internal). In the final minute, add a knob of butter and baste the steak by spooning the melted butter over it repeatedly.",timer:180},
     {title:"Rest — this is not optional",body:"Transfer to a warm plate. Rest for 5 full minutes. Cutting immediately loses all the juices.",timer:300},
     {title:"Slice and serve",body:"Slice against the grain — perpendicular to the muscle fibres. Spoon chimichurri generously over the sliced steak and serve more on the side."},
   ],
   tip:"Two things ruin a steak: a wet surface and low heat. Completely dry the steak and get the pan smoking hot. Moisture creates steam and prevents the crust that makes steak flavourful."},
  {id:17,photo:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80&fit=crop&auto=format",name:"Tacos al Pastor",emoji:"🌮",xp:95,difficulty:"Medium",time:"45 min",category:"Mexican",
   diets:["Gluten-free","Dairy-free"],macros:mk(480,28,42,20,4),done:false,
   ingredients:["600g pork shoulder, very thinly sliced","3 dried guajillo chillies, soaked in boiling water 20 min","1 chipotle in adobo","4 cloves garlic","1 tsp cumin","1 tsp dried oregano","3 tbsp white wine vinegar","½ fresh pineapple — half to blend, half to grill","Salt","Corn tortillas, white onion, fresh coriander, lime to serve"],
   steps:[
     {title:"Make the marinade",body:"Drain soaked guajillos. Blend with chipotle, garlic, cumin, oregano, vinegar, half the pineapple (roughly chopped), and 1 tsp salt until completely smooth."},
     {title:"Marinate the pork",body:"Coat pork slices thoroughly in marinade. Cover and refrigerate at least 2 hours, ideally overnight.",timer:7200},
     {title:"Grill the pineapple",body:"Heat a griddle or pan to very high heat. Grill pineapple slices 2–3 minutes per side until deeply caramelised. Chop into small pieces.",timer:180},
     {title:"Cook the pork hot",body:"Heat a heavy pan or cast iron to very high heat. Cook pork in a single layer in batches — don't crowd the pan. Cook 2–3 minutes per side until charred at the edges. The char IS the flavour.",timer:300},
     {title:"Chop and assemble",body:"Chop pork into small pieces on a board, mixing charred edges through the tender meat."},
     {title:"Build the tacos",body:"Warm corn tortillas in a dry pan or over a flame. Stack two per taco. Add pork, grilled pineapple, raw white onion, coriander, and a generous squeeze of lime."},
   ],
   tip:"The char is the point. The marinade caramelises and creates complex, smoky flavour. Medium heat produces a stew, not tacos."},
  {id:18,photo:"https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&q=80&fit=crop&auto=format",name:"Vegan Black Bean Tacos",emoji:"🌱",xp:55,difficulty:"Easy",time:"20 min",category:"Mexican",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(380,14,58,10,14),done:false,
   ingredients:["2×400g cans black beans, drained","1×400g can chopped tomatoes","1 onion, finely diced","4 cloves garlic, minced","2 tsp smoked paprika","1½ tsp cumin","1 tsp chilli powder","3 tbsp olive oil","Salt","8 corn tortillas","1 ripe avocado","Juice of 1 lime","Coriander, shredded lettuce, jalapeños to serve"],
   steps:[
     {title:"Fry the aromatics",body:"Heat oil over medium-high heat. Cook onion 6 minutes until golden. Add garlic, smoked paprika, cumin, and chilli powder. Stir 1 minute.",timer:420},
     {title:"Add tomatoes",body:"Add chopped tomatoes. Cook 5 minutes until slightly reduced."},
     {title:"Add beans",body:"Add black beans. Use the back of a spoon to mash roughly one-third of the beans — this thickens the filling and helps it stay in the taco.",timer:300},
     {title:"Simmer",body:"Simmer 5 minutes until thick and sticky. Add half the lime juice. Season generously.",timer:300},
     {title:"Quick guacamole",body:"Mash avocado with remaining lime juice and a pinch of salt. Leave it chunky."},
     {title:"Assemble",body:"Warm tortillas in a dry pan. Layer with bean filling, guacamole, shredded lettuce, coriander, and jalapeños."},
   ],
   tip:"Mashing some beans thickens the filling so it stays in your taco instead of falling out. Don't skip this step."},
  {id:19,photo:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&fit=crop&auto=format",name:"Smash Burgers",emoji:"🍔",xp:70,difficulty:"Medium",time:"20 min",category:"Comfort",
   diets:["No restrictions"],macros:mk(680,38,42,38,2),done:false,
   ingredients:["600g 80/20 ground beef — fat content is non-negotiable","4 brioche buns, split and toasted","8 slices American cheese","1 large white onion, very finely diced","Dill pickles","Shredded iceberg lettuce","Smash sauce: 3 tbsp mayo, 1 tbsp ketchup, 1 tsp mustard, 1 tsp white wine vinegar, ½ tsp smoked paprika"],
   steps:[
     {title:"Make the sauce",body:"Mix all smash sauce ingredients. Taste — it should be creamy, tangy, and slightly sweet. Refrigerate."},
     {title:"Portion the beef loosely",body:"Divide beef into 8 portions of about 75g each. Roll into loose balls — do not compact or season yet. Keep refrigerated until the last moment."},
     {title:"Get the pan screaming hot",body:"Place a cast iron skillet over highest heat for 4–5 minutes until it smokes. No oil needed."},
     {title:"The smash — the technique",body:"Place a beef ball in the pan. Immediately place greaseproof paper over it. Press down hard and steady with a flat spatula for 10 full seconds. Remove the paper. Add a pinch of diced onion on top. Cook undisturbed 90 seconds until edges are deeply brown and lacy.",timer:90},
     {title:"Flip and cheese",body:"Flip once with a thin spatula. Immediately place one slice of cheese on each patty. Cook 45 seconds.",timer:45},
     {title:"Stack and serve immediately",body:"Stack two patties per bun. Sauce both bun halves generously. Layer: sauce, pickles, lettuce, double patty, sauce. Serve immediately — smash burgers deteriorate within minutes."},
   ],
   tip:"SMASH hard and FAST the moment the beef touches the pan. That initial contact maximises surface area for the Maillard reaction — the lacy, crunchy crust that makes this burger what it is."},
  {id:20,photo:"https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80&fit=crop&auto=format",name:"French Onion Soup",emoji:"🧅",xp:110,difficulty:"Medium",time:"1h 30m",category:"Comfort",
   diets:["Vegetarian"],macros:mk(440,18,38,22,4),done:false,
   ingredients:["1.5kg yellow onions, thinly sliced","60g unsalted butter","1 tbsp neutral oil","1 tsp caster sugar","150ml dry white wine","1.5 litres good-quality beef or vegetable stock","3 sprigs fresh thyme, 2 bay leaves","Salt and black pepper","8 slices baguette (slightly stale)","250g Gruyère, coarsely grated"],
   steps:[
     {title:"Start the onions",body:"Melt butter and oil in a large heavy pot over medium heat. Add all onions and 1 tsp salt. Stir to coat. Cook with lid on 15 minutes until collapsed.",timer:900},
     {title:"Caramelise slowly",body:"Remove lid. Add sugar. Continue cooking over medium-low, stirring every 5–8 minutes, for 35–40 more minutes. Onions must go from gold to deep sticky dark brown. This cannot be rushed.",timer:2400},
     {title:"Deglaze",body:"Increase heat. Add wine. Scrape every brown bit from the base of the pot — that fond is pure flavour. Cook 3 minutes until mostly absorbed.",timer:180},
     {title:"Simmer with stock",body:"Add stock, thyme, and bay leaves. Bring to a boil, reduce to a steady simmer, cook uncovered 25 minutes. Remove herbs. Season generously.",timer:1500},
     {title:"Toast the baguette",body:"Toast baguette slices until completely dry and crunchy through. Preheat grill/broiler to maximum."},
     {title:"Gratinée",body:"Ladle soup into oven-safe bowls on a baking tray. Float 2 baguette slices on top. Cover completely and generously with Gruyère. Grill 4–6 minutes until bubbling, golden, and crisp at the edges.",timer:360},
   ],
   tip:"The caramelised onions are the entire dish. Pale onions produce pale soup. The difference between 30-minute onions and 55-minute onions is the difference between mediocre and unforgettable."},
  {id:21,photo:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&fit=crop&auto=format",name:"Buddha Bowl",emoji:"🥗",xp:55,difficulty:"Easy",time:"40 min",category:"Healthy",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(480,16,62,18,12),done:false,
   ingredients:["1 head cauliflower, broken into florets","2×400g cans chickpeas, drained and dried","2 tsp smoked paprika","1 tsp cumin","4 tbsp olive oil","200g quinoa, cooked","Tahini dressing: 4 tbsp tahini, juice of 1½ lemons, 1 clove garlic minced, 4–5 tbsp cold water, pinch of salt","Pomegranate seeds, fresh mint, cucumber to finish"],
   steps:[
     {title:"Roast cauliflower and chickpeas",body:"Preheat oven to 220°C. Toss cauliflower and chickpeas separately with olive oil, smoked paprika, cumin, salt, and pepper. Spread across two large trays in a single layer. Roast 25–30 minutes, tossing once, until cauliflower is charred at edges and chickpeas are crisp.",timer:1800},
     {title:"Cook the quinoa",body:"Cook quinoa according to packet in well-seasoned water. Drain and fluff with a fork."},
     {title:"Make tahini dressing",body:"Whisk tahini, lemon juice, garlic, and salt. Add cold water one tablespoon at a time, whisking — it will seize then become creamy and pourable."},
     {title:"Assemble",body:"Divide quinoa between bowls. Arrange cauliflower, chickpeas, and sliced cucumber in separate sections — the visual arrangement matters for this dish."},
     {title:"Finish",body:"Drizzle tahini dressing generously over everything. Scatter pomegranate seeds and fresh mint. Serve immediately or keep dressing separate for meal prep."},
   ],
   tip:"Crispy chickpeas require thorough drying and high heat with space between them. Crowded chickpeas steam rather than roast."},
  {id:22,photo:"https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=600&q=80&fit=crop&auto=format",name:"Garlic Butter Prawns",emoji:"🍤",xp:60,difficulty:"Easy",time:"15 min",category:"Quick",
   diets:["Gluten-free"],macros:mk(280,28,4,16,0),done:false,
   ingredients:["500g raw king prawns, peeled and deveined (defrost fully if frozen and pat very dry)","6 cloves garlic, finely minced","80g unsalted butter","2 tbsp olive oil","1 tsp smoked paprika","½ tsp cayenne","Juice of 1 lemon","Large handful flat-leaf parsley, chopped","Salt and pepper","Crusty bread to serve"],
   steps:[
     {title:"Prepare the prawns",body:"Pat prawns completely dry with kitchen paper. Wet prawns steam instead of sear, producing rubbery results. Season with salt, pepper, smoked paprika, and cayenne."},
     {title:"Sear in a very hot pan",body:"Heat olive oil in a large wide pan over high heat until it shimmers. Add prawns in a single layer — work in batches if needed. Sear without moving for 1 minute.",timer:60},
     {title:"Flip, add butter and garlic",body:"Flip each prawn. Add butter. When melted, add garlic. Swirl the pan. Cook 1 minute — garlic should be fragrant but not brown.",timer:60},
     {title:"Finish and serve immediately",body:"Remove from heat. Add lemon juice — it will hiss and create a quick sauce. Add parsley. Toss to coat. Serve immediately with crusty bread for the sauce."},
   ],
   tip:"Prawns cook in under 3 minutes total. The moment they're fully opaque pink, they're done. Overcooked prawns are rubbery and tasteless."},
  {id:23,photo:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop&auto=format",name:"Halloumi & Roasted Veg Wraps",emoji:"🫓",xp:40,difficulty:"Easy",time:"25 min",category:"Quick",
   diets:["Vegetarian"],macros:mk(420,18,48,18,6),done:false,
   ingredients:["250g halloumi, sliced into 1cm planks","1 red bell pepper, sliced","1 courgette, sliced into rounds","1 red onion, cut into wedges","2 tbsp olive oil","1 tsp smoked paprika","4 large flour tortillas or flatbreads","4 tbsp hummus","Handful of rocket","Juice of ½ lemon","Salt and pepper"],
   steps:[
     {title:"Roast the vegetables",body:"Preheat oven to 220°C. Toss pepper, courgette, and onion with olive oil, smoked paprika, salt, and pepper. Spread on a baking tray. Roast 20 minutes until tender and beginning to char.",timer:1200},
     {title:"Fry the halloumi",body:"Heat a non-stick pan over high heat — no oil needed. Cook halloumi slices 2 minutes per side until deeply golden. Eat immediately — halloumi goes rubbery within 5 minutes of cooling.",timer:240},
     {title:"Warm the wraps",body:"Warm tortillas briefly in a dry pan — pliable but not crispy.",timer:60},
     {title:"Assemble and wrap",body:"Spread hummus across each wrap. Layer roasted vegetables, hot halloumi, and rocket. Squeeze lemon over everything. Season with black pepper. Fold in sides and roll tightly from the bottom up. Cut diagonally."},
   ],
   tip:"Eat halloumi the moment it comes off the pan. Time your assembly so you're wrapping immediately after the halloumi is cooked."},
  {id:24,photo:"https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80&fit=crop&auto=format",name:"Chocolate Chip Cookies",emoji:"🍪",xp:70,difficulty:"Easy",time:"30 min",category:"Baking",
   diets:["Vegetarian"],macros:mk(220,3,28,11,1),done:false,
   ingredients:["225g unsalted butter, at room temperature — not melted, not cold","200g light brown sugar","100g caster sugar","2 large eggs, at room temperature","2 tsp vanilla extract","300g plain flour","1 tsp bicarbonate of soda","1 tsp fine salt","300g dark chocolate 70%, roughly chopped (not chips — chopping creates better variation)"],
   steps:[
     {title:"Cream butter and sugars",body:"Beat room-temperature butter with both sugars for 4–5 minutes until pale, light, and fluffy. Rushing this step makes denser, flatter cookies.",timer:300},
     {title:"Add eggs and vanilla",body:"Add eggs one at a time, beating well after each. Add vanilla. Beat 1 minute more. The mix may look slightly curdled — this is normal."},
     {title:"Add dry ingredients",body:"Sift flour, bicarbonate of soda, and salt together. Fold into the butter mixture in two additions until just combined — do not overmix. Fold in chopped chocolate."},
     {title:"Refrigerate the dough",body:"Refrigerate at least 1 hour, ideally overnight. Cold dough spreads less and creates thicker, chewier cookies.",timer:3600},
     {title:"Bake",body:"Preheat oven to 180°C. Scoop dough into 50g balls and space well apart on lined trays. Bake 11–12 minutes until edges are golden but centres still look underdone.",timer:720},
     {title:"Cool on the tray",body:"Leave on the tray for 5 minutes to firm up — they continue cooking on the hot tray. They will look underdone when you pull them out. This is correct.",timer:300},
   ],
   tip:"Pull the cookies out when they look 80% done. Soft and underdone in the centre means soft and chewy when cooled. Fully done in the oven means crunchy biscuits."},
  {id:25,photo:"https://images.unsplash.com/photo-1605286978633-2dec93ff88a2?w=600&q=80&fit=crop&auto=format",name:"Banana Bread",emoji:"🍌",xp:60,difficulty:"Easy",time:"1h 15m",category:"Baking",
   diets:["Vegetarian"],macros:mk(280,5,44,10,2),done:false,
   ingredients:["3–4 very ripe bananas (black-spotted is ideal)","200g plain flour","150g light brown sugar","2 large eggs","100g unsalted butter, melted and cooled","1 tsp bicarbonate of soda","1 tsp cinnamon","½ tsp fine salt","1 tsp vanilla extract","Optional: 80g walnuts roughly chopped or dark chocolate chips"],
   steps:[
     {title:"Preheat and prepare",body:"Preheat oven to 175°C. Grease a 900g loaf tin and line with baking paper, leaving overhang on long sides."},
     {title:"Mash the bananas",body:"Mash bananas thoroughly until almost smooth. The riper and blacker the bananas, the more intense the flavour."},
     {title:"Combine wet ingredients",body:"Add melted butter, sugar, eggs, and vanilla to mashed banana. Whisk until combined."},
     {title:"Add dry ingredients",body:"Sift flour, bicarbonate of soda, cinnamon, and salt over wet mixture. Fold gently until just combined — a few streaks of flour are fine. Fold in nuts or chocolate if using."},
     {title:"Bake",body:"Pour into prepared tin. Smooth the top. Optional: press a halved banana lengthways on top. Bake 55–65 minutes.",timer:3600},
     {title:"Test and cool",body:"Skewer in the centre should come out clean or with a few moist crumbs. Cool in tin 10 minutes, then turn out onto a wire rack. Wait until completely cool before slicing.",timer:600},
   ],
   tip:"Wait until the bread is completely cool before slicing. The inside continues to set as it cools. Cutting hot produces a gummy, sticky crumb."},
  {id:26,photo:"https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&fit=crop&auto=format",name:"Miso Soup with Tofu",emoji:"🍜",xp:30,difficulty:"Easy",time:"15 min",category:"Healthy",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(120,8,10,5,2),done:false,
   ingredients:["1 litre vegetable stock or kombu dashi","3 tbsp white miso paste (shiro miso)","200g firm tofu, drained and cut into 1.5cm cubes","2 spring onions, thinly sliced diagonally","1 sheet dried wakame seaweed, cut small (rehydrates quickly)","Optional: 1 tsp toasted sesame oil"],
   steps:[
     {title:"Make simple dashi (optional)",body:"For vegan dashi: soak 10g dried kombu in 1 litre cold water for 30 minutes. Bring to just below a simmer — never boil kombu. Strain and return to pot.",timer:1800},
     {title:"Add tofu and wakame",body:"Bring stock to a gentle simmer. Add tofu cubes gently — silken tofu crumbles at a vigorous boil. Rehydrate wakame in cold water 3 minutes, drain, add to stock.",timer:180},
     {title:"Dissolve the miso — off the heat",body:"Remove pot from heat entirely. Place miso in a ladle, submerge in the stock, and whisk to dissolve. Never boil miso — it destroys the probiotic enzymes and dulls the flavour."},
     {title:"Serve immediately",body:"Ladle into warm bowls. Scatter spring onions. Add a few drops of sesame oil if using. Serve immediately — miso soup is best drunk the moment it's made."},
   ],
   tip:"Miso must never boil. Add it off the heat as the very last step. This is the most important rule in miso soup."},
  {id:27,photo:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&fit=crop",name:"Roast Chicken",emoji:"🍗",xp:130,difficulty:"Medium",time:"1h 30m",category:"Comfort",
   diets:["Gluten-free","Dairy-free"],macros:mk(520,48,4,34,0),done:false,
   ingredients:["1 whole chicken (1.6kg)","1 lemon, halved","1 whole head garlic, halved","Fresh rosemary and thyme","3 tbsp olive oil","Flaky sea salt and black pepper"],
   steps:[
     {title:"Prepare",body:"Take chicken out 30 minutes before cooking. Preheat oven to 200°C. Pat chicken completely dry inside and out — essential for crispy skin."},
     {title:"Season generously",body:"Rub all over with olive oil. Season very generously with salt and pepper, including the cavity and under the skin where you can reach."},
     {title:"Stuff the cavity",body:"Squeeze lemon into the cavity, then push both halves in along with the garlic halves and fresh herbs."},
     {title:"Roast",body:"Place breast-side up in a roasting tin. Roast at 200°C for 1 hour 20 minutes until deeply golden and juices run clear when you pierce the thigh.",timer:4800},
     {title:"Rest",body:"Rest uncovered for 15 full minutes before carving. This is not optional — it keeps all the juices inside.",timer:900},
   ],
   tip:"A hot oven, a completely dry bird, and a proper rest. Those three things are the difference between good and extraordinary roast chicken."},
  {id:28,photo:"https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80&fit=crop",name:"Pad Thai",emoji:"🍜",xp:100,difficulty:"Medium",time:"30 min",category:"Asian",
   diets:["Gluten-free","Dairy-free"],macros:mk(490,24,62,16,3),done:false,
   ingredients:["200g flat rice noodles","200g chicken breast or firm tofu, sliced","3 eggs","3 tbsp fish sauce (or soy sauce for vegan)","2 tbsp tamarind paste","1 tbsp brown sugar","3 cloves garlic, minced","3 spring onions, sliced","Large handful bean sprouts","2 tbsp neutral oil","Roasted peanuts, lime, chilli flakes to serve"],
   steps:[
     {title:"Soak noodles",body:"Soak rice noodles in cold water for 30 minutes until pliable but still firm. They'll finish in the wok.",timer:1800},
     {title:"Make the sauce",body:"Mix fish sauce, tamarind paste, and sugar until the sugar dissolves. Taste — it should be sour, salty, and slightly sweet."},
     {title:"Cook protein",body:"Heat oil in a wok over maximum heat. Stir-fry chicken or tofu until cooked through and beginning to caramelise. Push to one side.",timer:240},
     {title:"Add noodles",body:"Add garlic to the empty space. Stir 30 seconds. Add drained noodles and all the sauce. Toss over high heat for 2 minutes.",timer:120},
     {title:"Scramble eggs",body:"Push noodles to the sides. Crack eggs into the centre. Scramble briefly then fold through the noodles before fully set."},
     {title:"Finish",body:"Add bean sprouts and most spring onions. Toss 30 seconds. Serve topped with peanuts, spring onions, lime, and chilli."},
   ],
   tip:"High heat is everything in a wok. If your pan isn't screaming hot, the noodles will steam instead of fry and become mushy."},
  {id:29,photo:"https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80&fit=crop",name:"Mushroom Risotto",emoji:"🍄",xp:110,difficulty:"Hard",time:"45 min",category:"Italian",
   diets:["Vegetarian","Gluten-free"],macros:mk(510,14,68,18,4),done:false,
   ingredients:["300g Arborio rice","500g mixed mushrooms (chestnut, portobello, shiitake)","1.5L warm vegetable stock","1 large onion, finely diced","4 cloves garlic","150ml dry white wine","80g Parmesan, finely grated","50g cold butter","3 tbsp olive oil","Flat-leaf parsley","Salt and black pepper"],
   steps:[
     {title:"Fry the mushrooms",body:"Heat olive oil over high heat. Fry mushrooms in a single layer without stirring for 3 minutes until deeply golden. Season. Set aside.",timer:180},
     {title:"Build the base",body:"In the same pan over medium heat, cook onion in butter for 8 minutes until soft and translucent. Add garlic, cook 1 minute.",timer:480},
     {title:"Toast the rice",body:"Add rice. Stir constantly for 2 minutes until the edges turn translucent.",timer:120},
     {title:"Add wine",body:"Add wine. Stir until completely absorbed.",timer:60},
     {title:"Add stock ladle by ladle",body:"Add stock one ladle at a time, stirring constantly and waiting for each ladle to absorb before adding the next. This takes 18–22 minutes.",timer:1200},
     {title:"Finish",body:"When rice is al dente and risotto moves in waves (all'onda), remove from heat. Beat in cold butter and Parmesan vigorously. Rest 2 minutes. Fold in mushrooms."},
   ],
   tip:"The constant stirring releases starch to create the creamy texture. A risotto left alone is a ruined risotto."},
  {id:30,photo:"https://images.unsplash.com/photo-1548940740-204726a19be3?w=600&q=80&fit=crop",name:"Beef Tacos",emoji:"🌮",xp:70,difficulty:"Easy",time:"25 min",category:"Mexican",
   diets:["Gluten-free","Dairy-free"],macros:mk(440,32,36,18,4),done:false,
   ingredients:["500g lean ground beef","1 onion, finely diced","4 cloves garlic","2 tsp cumin","2 tsp smoked paprika","1 tsp chilli powder","3 tbsp tomato paste","100ml beef stock","8 corn tortillas","Diced tomato, shredded lettuce, sour cream, jalapeños, coriander, lime"],
   steps:[
     {title:"Brown the beef",body:"Heat a large pan over high heat. Add beef and don't stir for 2 minutes to let it brown. Break up with a spoon. Continue until fully cooked.",timer:300},
     {title:"Add aromatics",body:"Add onion. Cook 3 minutes. Add garlic, cumin, paprika, and chilli powder. Stir 1 minute."},
     {title:"Simmer",body:"Add tomato paste and stock. Simmer 5–8 minutes until thick and saucy.",timer:480},
     {title:"Warm and assemble",body:"Warm tortillas over a flame or in a dry pan. Fill with beef and all toppings. Squeeze lime over everything."},
   ],
   tip:"Don't crowd the beef — let it sear properly before breaking it up. That caramelisation is the whole flavour."},
  {id:31,photo:"https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop",name:"Egg Fried Rice",emoji:"🍚",xp:45,difficulty:"Easy",time:"15 min",category:"Quick",
   diets:["Vegetarian","Dairy-free"],macros:mk(380,14,52,14,2),done:false,
   ingredients:["400g cold cooked rice — day-old is essential","3 large eggs","3 spring onions, sliced","4 cloves garlic, minced","1 tsp fresh ginger","3 tbsp soy sauce","1 tsp sesame oil","2 tbsp neutral oil","Optional: frozen peas, corn, diced carrot"],
   steps:[
     {title:"Cold rice only",body:"This dish only works with cold, day-old rice. Fresh rice is too moist and clumps. Break up any clumps with your hands before starting."},
     {title:"Screaming hot wok",body:"Heat neutral oil in a wok or large pan over maximum heat for 2 minutes until smoking."},
     {title:"Fry the rice",body:"Add rice. Press flat. Don't stir for 1 minute — let it crisp on the bottom. Then toss and stir-fry 2 more minutes.",timer:180},
     {title:"Add garlic and ginger",body:"Push rice to the side. Add garlic and ginger to the empty space. Stir 30 seconds. Mix through the rice."},
     {title:"Scramble eggs",body:"Push rice to sides. Crack eggs into centre. Scramble briefly then fold through rice before fully set."},
     {title:"Season",body:"Add soy sauce and sesame oil. Toss well. Add spring onions. Serve immediately."},
   ],
   tip:"Cold rice is non-negotiable. Make rice the day before or use cooled microwave rice."},
  {id:32,photo:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&fit=crop",name:"Vegetable Soup",emoji:"🥣",xp:40,difficulty:"Easy",time:"35 min",category:"Healthy",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(180,6,32,4,8),done:false,
   ingredients:["2 carrots, diced","3 stalks celery, diced","1 large onion, diced","3 cloves garlic","2 potatoes, cubed","1×400g can chopped tomatoes","1.5L vegetable stock","1 tsp dried thyme","2 tbsp olive oil","Salt, pepper, fresh parsley"],
   steps:[
     {title:"Sweat aromatics",body:"Heat olive oil in a large pot over medium heat. Cook onion, carrot, and celery for 8 minutes until softened. Add garlic and thyme, cook 1 minute.",timer:480},
     {title:"Add veg",body:"Add potatoes and chopped tomatoes. Stir to combine."},
     {title:"Simmer",body:"Add stock. Bring to a boil, reduce to a simmer. Cook 20 minutes until potatoes are completely tender.",timer:1200},
     {title:"Season and serve",body:"Season generously. Serve with crusty bread and fresh parsley."},
   ],
   tip:"Don't rush the base — those 8 minutes building the softened aromatics are the flavour foundation of the whole soup."},
  {id:33,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Spaghetti Bolognese",emoji:"🍝",xp:90,difficulty:"Medium",time:"1h 20m",category:"Italian",
   diets:["No restrictions"],macros:mk(560,32,58,22,5),done:false,
   ingredients:["500g 80/20 ground beef","400g spaghetti","1 onion, finely diced","2 carrots, finely diced","3 stalks celery, finely diced","5 cloves garlic","150ml full-fat milk","150ml dry red wine","2×400g cans chopped tomatoes","2 tbsp tomato paste","3 tbsp olive oil","Salt, pepper, Parmesan"],
   steps:[
     {title:"Build the soffritto",body:"Cook onion, carrot, and celery in olive oil over medium heat for 12–15 minutes until completely soft. Add garlic, cook 2 minutes.",timer:840},
     {title:"Brown the meat properly",body:"Add meat. Cook on high heat, breaking up, until deeply brown all over — not grey, genuinely brown. Takes 8–10 minutes.",timer:600},
     {title:"Add wine and milk",body:"Add wine. Cook until absorbed. Add milk. Cook until absorbed. The milk tenderises the meat.",timer:300},
     {title:"Simmer low and slow",body:"Add tomatoes and tomato paste. Reduce heat to very low. Simmer covered for at least 45 minutes.",timer:2700},
     {title:"Toss and serve",body:"Cook spaghetti in heavily salted water. Toss with sauce and pasta water. Serve with Parmesan."},
   ],
   tip:"A 45-minute Bolognese is good. A 90-minute Bolognese is extraordinary. Low heat and patience are everything."},
  {id:34,photo:"https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80&fit=crop",name:"French Toast",emoji:"🍞",xp:35,difficulty:"Easy",time:"15 min",category:"Breakfast",
   diets:["Vegetarian"],macros:mk(340,12,42,14,2),done:false,
   ingredients:["4 thick slices brioche or day-old bread","3 large eggs","100ml whole milk","1 tbsp caster sugar","1 tsp vanilla extract","½ tsp cinnamon","2 tbsp butter","Maple syrup, fresh berries, icing sugar to serve"],
   steps:[
     {title:"Make the custard",body:"Whisk eggs, milk, sugar, vanilla, and cinnamon together until combined."},
     {title:"Soak the bread",body:"Dip bread slices into the custard. Soak 30 seconds per side.",timer:60},
     {title:"Cook gently",body:"Melt butter in a non-stick pan over medium heat. Cook soaked bread 2–3 minutes per side until deeply golden.",timer:180},
     {title:"Serve immediately",body:"Dust with icing sugar, add berries and maple syrup."},
   ],
   tip:"Thick-cut brioche or day-old sourdough holds up far better than fresh sandwich bread. Fresh bread turns to mush."},
  {id:35,photo:"https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80&fit=crop",name:"Lentil Dal",emoji:"🥘",xp:55,difficulty:"Easy",time:"30 min",category:"Indian",
   diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(320,18,48,8,14),done:false,
   ingredients:["300g red lentils, rinsed","1 large onion, diced","4 cloves garlic","2 tsp fresh ginger","1×400g can chopped tomatoes","1L vegetable stock","2 tsp cumin seeds","1 tsp turmeric","1 tsp garam masala","½ tsp cayenne","3 tbsp oil","Lemon juice, fresh coriander, rice"],
   steps:[
     {title:"Bloom the spices",body:"Heat oil in a large pot. Add cumin seeds — they should sizzle immediately. Cook 30 seconds. Add onion. Cook 8 minutes until golden.",timer:480},
     {title:"Add aromatics and spices",body:"Add garlic and ginger. Cook 2 minutes. Add turmeric and cayenne. Stir 1 minute."},
     {title:"Add tomatoes and lentils",body:"Add tomatoes. Cook 3 minutes. Add rinsed lentils and stock. Stir well."},
     {title:"Simmer",body:"Bring to a boil, reduce to a simmer, cook 18–20 minutes until lentils are completely soft and dal has thickened.",timer:1200},
     {title:"Finish",body:"Add garam masala and lemon juice. Taste and adjust seasoning. Top with coriander. Serve over rice."},
   ],
   tip:"Don't rush the onion step — that golden colour is the flavour base of the whole dish."},
  {id:36,photo:"https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=600&q=80&fit=crop",name:"Lamb Kofta",emoji:"🫕",xp:85,difficulty:"Medium",time:"35 min",category:"Mediterranean",
   diets:["Gluten-free","Dairy-free"],macros:mk(480,36,16,30,3),done:false,
   ingredients:["600g ground lamb","1 small onion, grated","4 cloves garlic, minced","2 tsp cumin","1 tsp ground coriander","1 tsp cinnamon","½ tsp cayenne","Large handful fresh parsley, finely chopped","Salt and black pepper","Flatbread, tzatziki, cucumber, tomato, lemon to serve"],
   steps:[
     {title:"Make the mixture",body:"Combine lamb with onion, garlic, all spices, parsley, 1 tsp salt, and plenty of pepper. Mix with hands until combined. Refrigerate 20 minutes if time allows.",timer:1200},
     {title:"Shape the kofta",body:"Divide into 8 equal portions. With wet hands, shape each into a long sausage or oval patty."},
     {title:"Cook over high heat",body:"Grill or cook in a very hot griddle pan for 3–4 minutes per side until charred outside and just cooked through.",timer:240},
     {title:"Serve",body:"Rest 3 minutes. Serve in warm flatbreads with tzatziki, tomato, cucumber, and lemon."},
   ],
   tip:"Grating rather than chopping the onion incorporates the flavour and moisture without large chunks falling out of the kofta."},

];

/* ═══ SOCIAL DATA ═════════════════════════════════════════════════════════ */
const LEAGUES = [
  {id:"bronze",name:"Bronze League",  icon:"🥉",color:"#CD7F32"},
  {id:"silver",name:"Silver League",  icon:"🥈",color:"#A8A9AD"},
  {id:"gold",  name:"Gold League",    icon:"🥇",color:"#F5C842"},
  {id:"diamond",name:"Diamond League",icon:"💎",color:"#4A90D9"},
];
function getLeague(rank){if(rank<=5)return LEAGUES[3];if(rank<=10)return LEAGUES[2];if(rank<=20)return LEAGUES[1];return LEAGUES[0];}

const LEADERBOARD = [
  {rank:1,name:"Sofia R.",  avatar:"👩‍🍳",weeklyXp:620,streak:12},
  {rank:2,name:"Jake M.",   avatar:"🧑‍🍳",weeklyXp:540,streak:7},
  {rank:3,name:"Priya K.",  avatar:"👩‍🦱",weeklyXp:480,streak:5},
  {rank:4,name:"Marcus T.", avatar:"🧔",  weeklyXp:390,streak:9},
  {rank:5,name:"You",       avatar:"🧑",  weeklyXp:130,streak:4,isMe:true},
  {rank:6,name:"Yuki A.",   avatar:"👩",  weeklyXp:110,streak:2},
  {rank:7,name:"Liam B.",   avatar:"👨",  weeklyXp:80, streak:1},
];

const SEED_POSTS = [
  {id:"p1",user:{name:"Sofia R.",  avatar:"👩‍🍳",level:"Sous Chef"},  recipe:"Beef Bourguignon",  emoji:"🥩",photo:null,caption:"Three hours of love. Look at that colour 🤤 So worth it #sundaycooking",                   time:"2h ago", mwah:14,myMwah:false,comments:[{user:"Jake M.",text:"This is insane 🔥"},{user:"Priya K.",text:"Recipe?? 👀"}]},
  {id:"p2",user:{name:"Jake M.",   avatar:"🧑‍🍳",level:"Home Cook"}, recipe:"Sourdough Focaccia", emoji:"🍞",photo:null,caption:"Finally nailed the dimples after 4 attempts. Sea salt flakes are everything 🤌",         time:"5h ago", mwah:22,myMwah:false,comments:[{user:"Sofia R.",text:"The crust looks perfect 😍"}]},
  {id:"p3",user:{name:"Priya K.",  avatar:"👩‍🦱",level:"Intermediate"},recipe:"Miso Ramen",        emoji:"🍜",photo:null,caption:"Homemade tonkotsu broth. 6 hours. My entire flat smells incredible ✨",                    time:"1d ago", mwah:31,myMwah:false,comments:[{user:"Jake M.",text:"6 hours! Absolute legend"},{user:"Marcus T.",text:"Recipe please 🙏"}]},
  {id:"p4",user:{name:"Marcus T.", avatar:"🧔",  level:"Advanced"},   recipe:"Tarte Tatin",        emoji:"🥧",photo:null,caption:"Third attempt at this. Caramelisation is a discipline. Finally nailed it. #persistence",  time:"2d ago", mwah:19,myMwah:false,comments:[{user:"Priya K.",text:"That colour is everything 🙌"}]},
];

const STREAK_GOALS=[
  {id:"daily",  label:"Every day",   sub:"Full commitment",              icon:"🔥",target:7,color:C.flame},
  {id:"5x",     label:"5× a week",   sub:"Weekday warrior",              icon:"💪",target:5,color:C.ember},
  {id:"3x",     label:"3× a week",   sub:"Balanced, sustainable",        icon:"🌿",target:3,color:C.sage},
  {id:"weekend",label:"Weekends",    sub:"Relaxed weekend cooking",      icon:"☀️",target:2,color:C.gold},
  {id:"weekly", label:"Once a week", sub:"Busy schedule — no pressure",  icon:"🗓️",target:1,color:C.sky},
];
const WEEK_LABELS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const fmt=s=>s>=3600?`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`:s>=60?`${Math.floor(s/60)}m ${s%60}s`:`${s}s`;

/* ═══ MICRO COMPONENTS ════════════════════════════════════════════════════ */
const XPBar=({pct,color=C.flame,h=8})=>(
  <div style={{background:"#E8DDD4",borderRadius:999,height:h,overflow:"hidden",width:"100%"}}>
    <div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:"100%",background:color,borderRadius:999,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
);
const DiffBadge=({level})=>{const c={Easy:C.sage,Medium:C.ember,Hard:C.flame}[level]||C.muted;return<span style={{fontSize:10,fontWeight:800,color:c,background:`${c}1A`,borderRadius:6,padding:"2px 7px"}}>{level}</span>;};
const Chip=({label,color=C.muted,bg})=><span style={{fontSize:10,fontWeight:700,color,background:bg||`${color}18`,borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>{label}</span>;
const Sheet=({children,onClose})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(30,18,8,.72)",zIndex:300,display:"flex",alignItems:"flex-end",backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.paper,borderRadius:"24px 24px 0 0",width:"100%",maxHeight:"94vh",overflowY:"auto",animation:"slideUp .28s cubic-bezier(.4,0,.2,1)"}}>{children}</div>
  </div>
);
const CloseBtn=({onClose})=><button onClick={onClose} style={{background:C.pill,border:"none",borderRadius:10,width:34,height:34,cursor:"pointer",fontSize:18,color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>;
const Btn=({children,onClick,color=C.flame,outline=false,disabled=false,full=false,sm=false,style:x={}})=>(
  <button className="tap" onClick={onClick} disabled={disabled} style={{border:outline?`2px solid ${disabled?C.border:color}`:"none",background:outline?"transparent":disabled?"#D8D0C8":color,color:outline?(disabled?C.border:color):"#fff",borderRadius:14,padding:sm?"8px 14px":"12px 20px",fontWeight:800,fontSize:sm?12:14,cursor:disabled?"not-allowed":"pointer",boxShadow:(!outline&&!disabled)?`0 4px 14px ${color}44`:"none",transition:"all .18s",opacity:disabled?.55:1,width:full?"100%":"auto",...x}}>{children}</button>
);

/* ═══ TOASTS ══════════════════════════════════════════════════════════════ */
function Toast({emoji,title,subtitle,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4500);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",top:76,left:"50%",transform:"translateX(-50%)",zIndex:500,animation:"levelUp .5s cubic-bezier(.34,1.56,.64,1)",width:"calc(100% - 32px)",maxWidth:388}}>
      <div style={{background:`linear-gradient(135deg,${C.gold},#D4A012)`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,.25)"}}>
        <div style={{fontSize:44}}>{emoji}</div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(0,0,0,.55)",textTransform:"uppercase",letterSpacing:".08em"}}>{subtitle}</div>
          <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF}}>{title}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══ STEP TIMER ══════════════════════════════════════════════════════════ */
function StepTimer({seconds}){
  const [rem,setRem]=useState(seconds);
  const [run,setRun]=useState(false);
  const [done,setDone]=useState(false);
  const [editing,setEditing]=useState(false);
  const [customSeconds,setCustomSeconds]=useState(seconds);
  const ref=useRef(null);
  useEffect(()=>{setRem(seconds);setCustomSeconds(seconds);setRun(false);setDone(false);},[seconds]);
  useEffect(()=>{
    if(run){ref.current=setInterval(()=>setRem(r=>{if(r<=1){clearInterval(ref.current);setRun(false);setDone(true);return 0;}return r-1;}),1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[run]);
  const total=customSeconds;
  const pct=Math.max(0,Math.round((1-rem/total)*100));
  const urgent=rem<=30?C.flame:rem<=60?C.ember:C.sage;
  const handleSlider=(e)=>{
    const val=parseInt(e.target.value);
    setRem(val);
    setRun(false);
  };
  const handleCustomSave=()=>{
    setCustomSeconds(customSeconds);
    setRem(customSeconds);
    setRun(false);setDone(false);setEditing(false);
  };
  if(done)return(
    <div style={{background:`${C.sage}18`,border:`2px solid ${C.sage}44`,borderRadius:16,padding:"14px 18px",textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:6}}>✅</div>
      <div style={{fontWeight:800,fontSize:14,color:C.sage}}>Timer done! Move to the next step.</div>
    </div>
  );
  return(
    <div style={{background:run?`${urgent}10`:`${C.sky}0A`,border:`2px solid ${run?urgent:C.sky}44`,borderRadius:16,padding:"14px 18px",transition:"all .3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <span style={{fontSize:22}}>⏱</span>
        <div style={{flex:1}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>Timer</div>
          <div style={{fontWeight:900,fontSize:26,color:run?urgent:C.bark,fontFamily:DF,lineHeight:1}}>{fmt(rem)}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setRun(r=>!r)} className="tap" style={{background:run?C.ember:C.sage,border:"none",borderRadius:11,padding:"9px 16px",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer"}}>{run?"⏸ Pause":"▶ Start"}</button>
          <button onClick={()=>{setRem(total);setRun(false);setDone(false);}} className="tap" style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>↺</button>
        </div>
      </div>
      {/* Single slider — goes left to right as time counts down */}
      <div style={{marginTop:12}}>
        <input
          type="range" min={0} max={total} value={rem}
          onChange={handleSlider}
          style={{width:"100%",accentColor:run?urgent:C.sky,cursor:"pointer",height:6}}
        />
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginTop:3}}>
          <span style={{fontWeight:600,color:run?urgent:C.sky}}>{fmt(rem)} left</span>
          <span>Drag to resume from any point</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
      {/* Edit duration */}
      {editing?(
        <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center"}}>
          <input type="number" value={Math.round(customSeconds/60)} onChange={e=>setCustomSeconds(Math.max(10,parseInt(e.target.value||1)*60))} style={{width:60,padding:"6px 8px",borderRadius:10,border:`2px solid ${C.ember}`,background:C.cream,fontSize:14,fontWeight:700,color:C.bark,outline:"none",textAlign:"center"}} min={1}/>
          <span style={{fontSize:12,color:C.muted}}>minutes</span>
          <Btn onClick={handleCustomSave} sm color={C.sage} style={{marginLeft:"auto"}}>Set</Btn>
          <button onClick={()=>setEditing(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>Cancel</button>
        </div>
      ):(
        <button onClick={()=>setEditing(true)} style={{marginTop:8,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,fontWeight:600,padding:0}}>✏️ Edit duration</button>
      )}
    </div>
  );
}

/* ═══ ONBOARDING ══════════════════════════════════════════════════════════ */
function Onboarding({onComplete}){
  const [step,setStep]=useState(0);
  const [skill,setSkill]=useState("Home Cook");
  const [goal,setGoal]=useState(STREAK_GOALS[2]);
  const next=()=>setStep(s=>s+1);
  const screens=[
    ()=>(
      <div style={{padding:"40px 28px 36px",textAlign:"center"}}>
        <div style={{fontSize:80,marginBottom:16}}>🍳</div>
        <div style={{fontWeight:900,fontSize:32,color:C.bark,fontFamily:DF,lineHeight:1.2,marginBottom:16}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
        <div style={{fontSize:15,color:"#6A5C52",lineHeight:1.7,marginBottom:32}}>Cook more. Level up your skills.<br/>Share the journey with friends.</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:36,textAlign:"left"}}>
          {[["🏃","Cooking challenges — solo or with friends"],["📸","Strava-style feed — share your dishes"],["📈","Level up skills as you cook"],["📚","A library of everything you've ever cooked"],["🔥","Streak goals that fit your real life"]].map(([e,t])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:14,background:C.cream,borderRadius:14,padding:"12px 16px",border:`1px solid ${C.border}`}}>
              <span style={{fontSize:20,flexShrink:0}}>{e}</span><span style={{fontSize:14,color:C.bark,fontWeight:600}}>{t}</span>
            </div>
          ))}
        </div>
        <Btn onClick={next} full style={{fontSize:16,padding:"15px"}}>Get Started →</Btn>
      </div>
    ),
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:44,marginBottom:10}}>🎯</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>How often will you cook?</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Pick an honest goal. You can change this any time.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {STREAK_GOALS.map(g=>{
            const a=goal.id===g.id;
            return(
              <button key={g.id} className="tap" onClick={()=>setGoal(g)} style={{background:a?`${g.color}14`:C.cream,border:`2px solid ${a?g.color:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .18s"}}>
                <div style={{width:44,height:44,borderRadius:12,background:a?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}><div style={{fontWeight:900,fontSize:14,color:C.bark}}>{g.label}</div><div style={{fontSize:12,color:C.muted}}>{g.sub}</div></div>
                <div style={{fontWeight:900,fontSize:17,color:a?g.color:C.muted,flexShrink:0,textAlign:"right"}}>{g.target}×/wk</div>
                {a&&<div style={{width:20,height:20,borderRadius:"50%",background:g.color,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <Btn onClick={next} full>Continue →</Btn>
      </div>
    ),
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:44,marginBottom:10}}>👨‍🍳</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>How would you rate yourself?</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Be honest — we'll match your challenges and recipes to your level.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {[{id:"Beginner",label:"Beginner",sub:"I mostly stick to simple, familiar things",emoji:"🌱"},{id:"Home Cook",label:"Home Cook",sub:"I cook regularly and enjoy it",emoji:"🍳"},{id:"Intermediate",label:"Intermediate",sub:"I can tackle most recipes confidently",emoji:"👨‍🍳"},{id:"Advanced",label:"Advanced",sub:"I seek out complex techniques",emoji:"⭐"},{id:"Chef",label:"Chef-level",sub:"Professional or equivalent experience",emoji:"🏆"}].map(l=>{
            const a=skill===l.id;
            return(
              <button key={l.id} className="tap" onClick={()=>setSkill(l.id)} style={{background:a?`${C.flame}12`:C.cream,border:`2px solid ${a?C.flame:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .18s"}}>
                <span style={{fontSize:26}}>{l.emoji}</span>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.bark}}>{l.label}</div><div style={{fontSize:12,color:C.muted}}>{l.sub}</div></div>
                {a&&<div style={{width:20,height:20,borderRadius:"50%",background:C.flame,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <Btn onClick={next} full>Continue →</Btn>
      </div>
    ),
    ()=>(
      <div style={{textAlign:"center",padding:"40px 28px"}}>
        <div style={{fontSize:72,marginBottom:20}}>🎉</div>
        <div style={{fontWeight:900,fontSize:28,color:C.bark,fontFamily:DF,marginBottom:12}}>You're all set!</div>
        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px",marginBottom:24,color:"#fff",textAlign:"left"}}>
          {[["🎯 Goal",goal.label],["👨‍🍳 Level",skill],["🌱 Starting rank","Novice — build Heat as you cook"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:13,opacity:.7}}>{k}</span><span style={{fontSize:13,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:28}}>Start with a challenge. Cook something. Post it to the feed. Build your cook library.</div>
        <Btn onClick={()=>onComplete({goal,skill})} full style={{fontSize:16,padding:"15px"}}>Let's Cook 🍳</Btn>
      </div>
    ),
  ];
  const S=screens[step];
  const pct=(step+1)/4;
  return(
    <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto"}}>
      {step>0&&<div style={{padding:"20px 24px 0"}}><div style={{background:"#E8DDD4",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:`${pct*100}%`,height:"100%",background:C.flame,borderRadius:99,transition:"width .4s ease"}}/></div></div>}
      <S/>
    </div>
  );
}

/* ═══ RECIPE DETAIL ═══════════════════════════════════════════════════════ */
function RecipeDetail({recipe,onBack,onComplete}){
  const [step,setStep]=useState(0);
  const [mode,setMode]=useState("overview");
  const [done,setDone]=useState(recipe.done);
  const [postOpen,setPostOpen]=useState(false);
  const [caption,setCaption]=useState("");
  const [rating,setRating]=useState(0);
  const [photoPreview,setPhotoPreview]=useState(null);
  const fileRef=useRef();
  const nSteps=(recipe.steps||[]).length;
  const handleFile=(e)=>{const f=e.target.files[0];if(!f)return;setPhotoPreview(URL.createObjectURL(f));};
  const handleComplete=()=>{setDone(true);setPostOpen(true);};
  const handlePost=()=>{setPostOpen(false);onComplete(recipe,photoPreview,caption,rating);};
  const handleSkip=()=>{setPostOpen(false);onComplete(recipe,null,"",0);};

  return(
    <div style={{background:C.paper,minHeight:"100vh"}}>
      <div style={{position:"relative",overflow:"hidden",background:`linear-gradient(160deg,${C.bark},#5A3520)`}}>
        {recipe.photo&&(
          <div style={{position:"relative",height:220,overflow:"hidden"}}>
            <img src={recipe.photo} alt={recipe.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.05),rgba(59,42,26,.9))"}}/>
          </div>
        )}
        {!recipe.photo&&<div style={{position:"absolute",top:-10,right:-10,fontSize:108,opacity:.12,lineHeight:1}}>{recipe.emoji}</div>}
        <div style={{padding:"16px 20px 28px",position:"relative"}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px",marginBottom:18}}>← Back</button>
          <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
            <DiffBadge level={recipe.difficulty}/>
            {(recipe.diets||[]).filter(d=>d!=="No restrictions").slice(0,3).map(d=><Chip key={d} label={d} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.18)"/>)}
          </div>
          <div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1.25,marginBottom:8,fontFamily:DF}}>{recipe.name}</div>
          <div style={{display:"flex",gap:16,color:"rgba(255,255,255,.65)",fontSize:13}}>
            <span>⏱ {recipe.time}</span><span>🔥 {recipe.xp} Heat</span><span>📋 {(recipe.ingredients||[]).length} ingredients</span>
          </div>
        </div>
      </div>

      <div style={{display:"flex",margin:"16px 16px 0",background:C.pill,borderRadius:14,padding:4,gap:4}}>
        {[["overview","📋 Overview"],["cook","👨‍🍳 Cook Mode"]].map(([m,lbl])=>(
          <button key={m} onClick={()=>setMode(m)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:11,padding:"9px",fontWeight:800,fontSize:13,background:mode===m?"#fff":"transparent",color:mode===m?C.bark:C.muted,boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .18s"}}>{lbl}</button>
        ))}
      </div>

      <div style={{padding:"16px 16px 100px"}}>
        {mode==="overview"?(
          <>
            {recipe.macros&&(
              <div style={{background:C.cream,borderRadius:18,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700,fontSize:11,color:C.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:".1em"}}>Nutrition per serving</div>
                <div style={{display:"flex",gap:0}}>
                  {[["Calories",recipe.macros.calories,"kcal",C.flame],["Protein",recipe.macros.protein,"g",C.sky],["Carbs",recipe.macros.carbs,"g",C.gold],["Fat",recipe.macros.fat,"g",C.ember],["Fiber",recipe.macros.fiber,"g",C.sage]].map(([label,val,unit,color],i,arr)=>(
                    <div key={label} style={{flex:1,textAlign:"center",borderRight:i<arr.length-1?`1px solid ${C.border}`:"none",padding:"0 4px"}}>
                      <div style={{fontWeight:900,fontSize:18,color:C.bark,lineHeight:1}}>{val}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:3}}>{unit}</div>
                      <div style={{fontSize:9,fontWeight:700,color,textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>{label}</div>
                      <div style={{height:2,borderRadius:99,background:color,margin:"6px 8px 0",opacity:.4}}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:12}}>Ingredients</div>
              {(recipe.ingredients||[]).map((ing,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:i<recipe.ingredients.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:C.ember,flexShrink:0,marginTop:7}}/><span style={{fontSize:14,color:C.bark,lineHeight:1.5}}>{ing}</span>
                </div>
              ))}
            </div>
            <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:14}}>Method</div>
              {(recipe.steps||[]).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:14,marginBottom:i<nSteps-1?20:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14,color:C.bark,marginBottom:4}}>{s.title}</div>
                    <div style={{fontSize:13,color:"#6A5C52",lineHeight:1.65}}>{s.body}</div>
                    {s.timer>0&&<div style={{fontSize:11,color:C.sky,fontWeight:600,marginTop:5}}>⏱ {fmt(s.timer)} timer in Cook Mode</div>}
                  </div>
                </div>
              ))}
            </div>
            {recipe.tip&&<div style={{background:`${C.gold}18`,border:`1px solid ${C.gold}55`,borderRadius:18,padding:"14px 18px",marginBottom:16}}><div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:6}}>💡 Chef's Tip</div><div style={{fontSize:13,color:"#6A5C52",lineHeight:1.65}}>{recipe.tip}</div></div>}
            {recipe.isImported&&recipe.sourceUrl&&(
              <div style={{background:`${C.sky}0E`,border:`1.5px solid ${C.sky}28`,borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>🔗</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.sky}}>Imported from {recipe.sourceName}</div>
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.muted,textDecoration:"underline"}}>View original recipe →</a>
                </div>
              </div>
            )}
            {done?<div style={{textAlign:"center",padding:"12px",fontWeight:700,color:C.sage,fontSize:15}}>✓ Cooked! Great work.</div>:<Btn onClick={()=>setMode("cook")} full>Start Cooking 👨‍🍳</Btn>}
          </>
        ):(
          <div>
            <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:14}}>Step {step+1} of {nSteps}</div>
            <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:20}}>
              {Array.from({length:nSteps}).map((_,i)=>(
                <div key={i} onClick={()=>setStep(i)} style={{width:i===step?24:8,height:8,borderRadius:99,background:i<step?C.sage:i===step?C.flame:C.border,transition:"all .28s",cursor:"pointer"}}/>
              ))}
            </div>
            <div style={{background:C.cream,borderRadius:20,padding:24,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>{step+1}</div>
              <div style={{fontWeight:900,fontSize:20,color:C.bark,marginBottom:10,fontFamily:DF}}>{recipe.steps[step].title}</div>
              <div style={{fontSize:15,color:"#5A4C42",lineHeight:1.7}}>{recipe.steps[step].body}</div>
            </div>
            {recipe.steps[step].timer>0&&<div style={{marginBottom:14}}><StepTimer key={`${recipe.id}-${step}`} seconds={recipe.steps[step].timer}/></div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} style={{flex:1,padding:13,borderRadius:14,border:`2px solid ${C.border}`,background:"transparent",color:step===0?"#CCC":C.bark,fontWeight:800,cursor:step===0?"default":"pointer",fontSize:15}}>← Prev</button>
              {step<nSteps-1
                ?<Btn onClick={()=>setStep(s=>s+1)} style={{flex:2}}>Next Step →</Btn>
                :<Btn onClick={()=>!done&&handleComplete()} color={C.sage} style={{flex:2,background:done?C.sage:`linear-gradient(135deg,${C.sage},${C.moss})`}}>
                  {done?"✓ Cooked!":`Complete · +${recipe.xp}xp 🎉`}
                </Btn>
              }
            </div>
          </div>
        )}
      </div>

      {postOpen&&(
        <Sheet onClose={handleSkip}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🎉 Dish complete!</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Add it to your cook library and share it</div></div>
              <CloseBtn onClose={handleSkip}/>
            </div>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"14px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:36}}>{recipe.emoji}</span>
              <div><div style={{fontWeight:900,fontSize:16,color:"#fff"}}>{recipe.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:2}}>+{recipe.xp} 🔥 Heat earned</div></div>
            </div>
            {/* Star rating */}
            <div style={{background:C.cream,borderRadius:16,padding:"14px 16px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:700,fontSize:13,color:C.bark,marginBottom:10}}>How did it go?</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setRating(n)} className="tap" style={{fontSize:32,background:"none",border:"none",cursor:"pointer",opacity:n<=rating?1:.3,transition:"opacity .18s"}}>{n<=rating?"⭐":"☆"}</button>
                ))}
              </div>
              {rating>0&&<div style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:8}}>{["","Needs work","Getting there","Pretty good!","Really pleased!","Perfect! 🌟"][rating]}</div>}
            </div>
            {!photoPreview
              ?<div onClick={()=>fileRef.current?.click()} style={{border:`3px dashed ${C.border}`,borderRadius:18,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:C.cream,marginBottom:14}}>
                <div style={{fontSize:36,marginBottom:8}}>📸</div>
                <div style={{fontWeight:800,fontSize:14,color:C.bark,marginBottom:4}}>Add a photo</div>
                <div style={{fontSize:12,color:C.muted}}>Saved to your cook library + shared with friends</div>
              </div>
              :<div style={{marginBottom:14,position:"relative"}}>
                <img src={photoPreview} alt="" style={{width:"100%",height:200,objectFit:"cover",borderRadius:18}}/>
                <button onClick={()=>setPhotoPreview(null)} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.5)",border:"none",borderRadius:99,color:"#fff",width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            }
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="What happened? What worked? What would you change?" style={{width:"100%",minHeight:80,borderRadius:16,border:`2px solid ${caption?C.ember:C.border}`,background:C.cream,padding:"12px 16px",fontSize:14,color:C.bark,resize:"none",outline:"none",lineHeight:1.55,boxSizing:"border-box",marginBottom:14,transition:"border-color .18s"}}/>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={handleSkip} outline color={C.muted} style={{flex:1}}>Skip</Btn>
              <Btn onClick={handlePost} color={C.sage} style={{flex:2}}>Save & Share 🚀</Btn>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ═══ CHALLENGES TAB ══════════════════════════════════════════════════════ */
function ChallengeDetail({ch,progress,onBack,onInvite}){
  const prog=Math.min(progress,ch.target);
  const pct=Math.round(prog/ch.target*100);
  const done=prog>=ch.target;
  const [showInvite,setShowInvite]=useState(false);
  const nextM=ch.milestones.find(m=>m>prog);
  const friendData=[{name:"Sofia R.",avatar:"👩‍🍳",prog:Math.min(ch.target,prog+2)},{name:"Jake M.",avatar:"🧑‍🍳",prog:Math.min(ch.target,Math.floor(prog*0.6))}];
  return(
    <div style={{background:C.paper,minHeight:"100vh"}}>
      <div style={{background:`linear-gradient(160deg,${ch.color},${ch.dark})`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-10,top:-10,fontSize:120,opacity:.15,lineHeight:1}}>{ch.emoji}</div>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px",marginBottom:18}}>← Back</button>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <Chip label={ch.difficulty} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          <Chip label={ch.duration} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          <Chip label={`+${ch.xp} XP`} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          {done&&<Chip label="✓ Complete!" color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>}
        </div>
        <div style={{fontSize:26,fontWeight:900,color:"#fff",fontFamily:DF,marginBottom:6}}>{ch.emoji} {ch.name}</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,.85)",lineHeight:1.6}}>{ch.tagline}</div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        {/* Progress */}
        <div style={{background:C.cream,borderRadius:20,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:900,fontSize:16,color:C.bark,fontFamily:DF}}>Your Progress</div>
            <div style={{fontWeight:900,fontSize:16,color:ch.color}}>{prog}/{ch.target}</div>
          </div>
          <XPBar pct={pct} color={ch.color} h={12}/>
          {/* Milestone row */}
          <div style={{position:"relative",marginTop:14,height:44}}>
            <div style={{position:"absolute",top:12,left:0,right:0,height:2,background:C.border}}/>
            <div style={{position:"absolute",top:12,left:0,width:`${pct}%`,height:2,background:ch.color,transition:"width .9s ease"}}/>
            {ch.milestones.map((m,i)=>{
              const mp=Math.round(m/ch.target*100);
              const reached=prog>=m;
              return(
                <div key={i} style={{position:"absolute",left:`${mp}%`,transform:"translateX(-50%)",top:0}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:reached?ch.color:C.border,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800,transition:"all .3s",margin:"0 auto 4px"}}>{reached?"✓":m}</div>
                  <div style={{fontSize:9,color:C.muted,textAlign:"center"}}>{m}</div>
                </div>
              );
            })}
          </div>
          {done&&<div style={{marginTop:14,background:`${C.gold}18`,borderRadius:12,padding:"12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>🏅</div><div style={{fontWeight:800,fontSize:14,color:C.bark}}>Challenge Complete! +{ch.xp} 🔥 Heat earned</div></div>}
          {!done&&nextM&&<div style={{marginTop:10,fontSize:12,color:C.muted}}>{nextM-prog} more to next milestone 🎯</div>}
        </div>

        {/* About */}
        <div style={{background:C.cream,borderRadius:20,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:12,fontFamily:DF}}>About this challenge</div>
          {ch.about.split("\n\n").map((p,i)=><p key={i} style={{fontSize:14,color:"#6A5C52",lineHeight:1.7,margin:"0 0 12px"}}>{p}</p>)}
        </div>

        {/* What you'll learn */}
        <div style={{background:`${C.sky}0D`,border:`1px solid ${C.sky}28`,borderRadius:20,padding:18,marginBottom:14}}>
          <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:12}}>📚 What you'll learn</div>
          {ch.learn.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:i<ch.learn.length-1?10:0}}>
              <span style={{color:C.sky,fontWeight:800,flexShrink:0}}>→</span>
              <span style={{fontSize:13,color:"#5A6B7A",lineHeight:1.5}}>{item}</span>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div style={{background:`${C.gold}14`,border:`1px solid ${C.gold}40`,borderRadius:20,padding:18,marginBottom:14}}>
          <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:12}}>💡 Tips for success</div>
          {ch.tips.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:i<ch.tips.length-1?10:0}}>
              <span style={{color:C.gold,fontWeight:900,flexShrink:0}}>{i+1}.</span>
              <span style={{fontSize:13,color:"#6A5C52",lineHeight:1.5}}>{tip}</span>
            </div>
          ))}
        </div>

        {/* Friend accountability */}
        <div style={{background:C.cream,borderRadius:20,padding:18,marginBottom:20,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:4,fontFamily:DF}}>⚔️ Do it with a friend</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Invite someone to do this challenge alongside you. You'll see each other's progress here.</div>
          {friendData.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${ch.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{f.avatar}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:C.bark}}>{f.name}</span><span style={{fontSize:12,color:ch.color,fontWeight:700}}>{f.prog}/{ch.target}</span></div>
                <XPBar pct={Math.round(f.prog/ch.target*100)} color={ch.color} h={5}/>
              </div>
            </div>
          ))}
          <Btn onClick={()=>setShowInvite(true)} outline color={ch.color} full sm>+ Invite a friend</Btn>
        </div>

        <Btn onClick={onBack} full style={{background:ch.color}}>{done?"✓ Challenge Complete!":"Start cooking towards this 🍳"}</Btn>
      </div>

      {showInvite&&(
        <Sheet onClose={()=>setShowInvite(false)}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>⚔️ Challenge a Friend</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>They'll see your progress side by side</div></div>
              <CloseBtn onClose={()=>setShowInvite(false)}/>
            </div>
            {["Sofia R.","Jake M.","Priya K.","Marcus T.","Yuki A."].map(name=>(
              <button key={name} onClick={()=>{onInvite(name,ch);setShowInvite(false);}} className="tap" style={{display:"flex",alignItems:"center",gap:14,background:C.cream,border:`2px solid ${C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",width:"100%",marginBottom:10,transition:"all .18s"}}>
                <div style={{width:44,height:44,borderRadius:14,background:`${ch.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>👤</div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,color:C.bark}}>{name}</div><div style={{fontSize:12,color:C.muted}}>Tap to send challenge invite</div></div>
                <span style={{fontSize:18,color:C.muted}}>→</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function ChallengesTab({challengeProgress,onInvite}){
  const [selected,setSelected]=useState(null);
  if(selected){const ch=CHALLENGES.find(c=>c.id===selected);return<ChallengeDetail ch={ch} progress={challengeProgress[selected]||0} onBack={()=>setSelected(null)} onInvite={onInvite}/>;}

  const active=CHALLENGES.filter(ch=>(challengeProgress[ch.id]||0)>0&&(challengeProgress[ch.id]||0)<ch.target);
  const completed=CHALLENGES.filter(ch=>(challengeProgress[ch.id]||0)>=ch.target);
  const available=CHALLENGES.filter(ch=>!(challengeProgress[ch.id]>0));

  const Card=({ch})=>{
    const p=challengeProgress[ch.id]||0;
    const pct=Math.round(Math.min(p,ch.target)/ch.target*100);
    const done=p>=ch.target;
    return(
      <div onClick={()=>setSelected(ch.id)} className="tap ch" style={{background:C.cream,borderRadius:20,overflow:"hidden",cursor:"pointer",border:`2px solid ${ch.color}22`,boxShadow:`0 4px 18px ${ch.color}10`,marginBottom:12,transition:"transform .18s,box-shadow .18s"}}>
        <div style={{background:`linear-gradient(135deg,${ch.color},${ch.dark})`,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-8,top:-8,fontSize:64,opacity:.2,lineHeight:1}}>{ch.emoji}</div>
          <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <Chip label={ch.difficulty} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
            <Chip label={`+${ch.xp} XP`} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
            {done&&<Chip label="✓ Done" color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>}
          </div>
          <div style={{fontSize:18,fontWeight:900,color:"#fff",fontFamily:DF,marginBottom:3}}>{ch.emoji} {ch.name}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.8)"}}>{ch.tagline}</div>
        </div>
        {p>0&&(
          <div style={{padding:"10px 18px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,fontWeight:700,color:C.bark}}>{Math.min(p,ch.target)}/{ch.target} {ch.unit}</span>
              <span style={{fontSize:11,color:ch.color,fontWeight:700}}>{pct}%</span>
            </div>
            <XPBar pct={pct} color={ch.color} h={6}/>
          </div>
        )}
        {!p&&<div style={{padding:"10px 18px 12px",fontSize:12,color:C.muted}}>Tap to read about this challenge →</div>}
      </div>
    );
  };

  return(
    <div style={{paddingBottom:30}}>
      <div style={{margin:"4px 16px 22px",background:C.dark,borderRadius:22,padding:"22px 20px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:110,opacity:.07,lineHeight:1}}>🏃</div>
        <div style={{fontSize:11,opacity:.5,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Cooking Challenges</div>
        <div style={{fontWeight:900,fontSize:24,fontFamily:DF,marginBottom:8,lineHeight:1.2}}>Cook your way to the finish line</div>
        <div style={{fontSize:13,opacity:.7,lineHeight:1.6,marginBottom:18}}>Pick a challenge. Cook through it. Invite a friend to keep each other honest. Every challenge explains exactly what you'll learn and why it matters.</div>
        <div style={{display:"flex",gap:10}}>
          {[["🏃","5 to 30 meals"],["⚔️","With friends"],["🏅","Earn badges"]].map(([e,t])=>(
            <div key={t} style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{e}</div>
              <div style={{fontSize:10,fontWeight:700,opacity:.7}}>{t}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        {active.length>0&&<><div style={{fontWeight:900,fontSize:17,color:C.bark,marginBottom:3,fontFamily:DF}}>In Progress</div><div style={{fontSize:12,color:C.muted,marginBottom:12}}>Keep going.</div>{active.map(ch=><Card key={ch.id} ch={ch}/>)}</>}
        {completed.length>0&&<><div style={{fontWeight:900,fontSize:17,color:C.bark,marginBottom:3,fontFamily:DF,marginTop:active.length?20:0}}>Completed 🏅</div><div style={{fontSize:12,color:C.muted,marginBottom:12}}>These are yours.</div>{completed.map(ch=><Card key={ch.id} ch={ch}/>)}</>}
        <div style={{fontWeight:900,fontSize:17,color:C.bark,marginBottom:3,fontFamily:DF,marginTop:(active.length||completed.length)?20:0}}>{available.length===CHALLENGES.length?"All Challenges":"More Challenges"}</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Tap any challenge to read the full description before you commit.</div>
        {available.map(ch=><Card key={ch.id} ch={ch}/>)}
      </div>
    </div>
  );
}

/* ═══ COOK LIBRARY ════════════════════════════════════════════════════════ */
function CookLibrary({cookLog,allRecipes,earnedBadges,onShowCalendar,onShowSignature}){
  const [filter,setFilter]=useState("all");
  const [sort,setSort]=useState("recent");
  const [libTab,setLibTab]=useState("log"); // log | badges

  const filtered=useMemo(()=>{
    let list=[...cookLog];
    if(filter==="rated")list=list.filter(e=>e.rating>0);
    if(filter==="photos")list=list.filter(e=>e.photo);
    if(sort==="rating")list=[...list].sort((a,b)=>b.rating-a.rating);
    if(sort==="xp")list=[...list].sort((a,b)=>b.xp-a.xp);
    return list;
  },[cookLog,filter,sort]);

  const uniqueCuisines=[...new Set(cookLog.map(e=>e.category).filter(Boolean))];
  const avgRating=cookLog.filter(e=>e.rating>0).length?Math.round(cookLog.filter(e=>e.rating>0).reduce((a,e)=>a+e.rating,0)/cookLog.filter(e=>e.rating>0).length*10)/10:0;

  return(
    <div style={{paddingBottom:30}}>
      {/* Hero stats */}
      <div style={{margin:"4px 16px 16px",background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px",color:"#fff"}}>
        <div style={{fontWeight:900,fontSize:22,fontFamily:DF,marginBottom:4}}>📚 Cook Library</div>
        <div style={{fontSize:13,opacity:.7,marginBottom:18}}>Everything you've ever cooked — your personal food journal.</div>
        <div style={{display:"flex",gap:10}}>
          {[["Dishes Cooked",cookLog.length],["Cuisines",uniqueCuisines.length],["Avg Rating",avgRating||"—"]].map(([l,v])=>(
            <div key={l} style={{flex:1,background:"rgba(255,255,255,.1)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:900}}>{v}</div>
              <div style={{fontSize:9,opacity:.6,textTransform:"uppercase",letterSpacing:".08em",marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{display:"flex",margin:"0 16px 16px",background:C.pill,borderRadius:14,padding:4,gap:4}}>
        {[["log","📖 My Cooks"],["badges","🏅 Badges"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setLibTab(id)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:11,padding:"9px",fontWeight:800,fontSize:13,background:libTab===id?"#fff":"transparent",color:libTab===id?C.bark:C.muted,boxShadow:libTab===id?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .18s"}}>{lbl}</button>
        ))}
      </div>

      {/* Quick actions */}
      {libTab==="log"&&(
        <div style={{display:"flex",gap:10,margin:"0 16px 16px"}}>
          <button onClick={onShowCalendar} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:2}}>📅</div>
            <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Streak Calendar</div>
          </button>
          <button onClick={onShowSignature} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:2}}>🍳</div>
            <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Signature Dish</div>
          </button>
        </div>
      )}

      {libTab==="badges"&&(
        <div style={{padding:"0 16px 30px"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF,marginBottom:4}}>Your Badges</div>
            <div style={{fontSize:12,color:C.muted}}>{earnedBadges.length} earned · {BADGES.length-earnedBadges.length} to unlock</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {BADGES.map(b=>{
              const earned = earnedBadges.includes(b.id);
              return(
                <div key={b.id} style={{background:earned?"#fff":"#F5F0EB",border:`2px solid ${earned?"#F5C842":"#E0D5CB"}`,borderRadius:18,padding:"16px 10px",textAlign:"center",boxShadow:earned?"0 4px 16px rgba(245,200,66,.25)":"none",transition:"all .3s",position:"relative",overflow:"hidden"}}>
                  {earned&&<div style={{position:"absolute",top:6,right:8,fontSize:10,fontWeight:800,color:"#C9A020"}}>✓</div>}
                  <div style={{fontSize:32,marginBottom:6,filter:earned?"none":"grayscale(1)",opacity:earned?1:.45}}>{b.emoji}</div>
                  <div style={{fontSize:11,fontWeight:800,color:C.bark,lineHeight:1.3,marginBottom:4}}>{b.label}</div>
                  {earned
                    ?<div style={{fontSize:9,color:"#C9A020",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Earned</div>
                    :<div style={{fontSize:9,color:C.muted,lineHeight:1.4}}>{b.desc}</div>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {libTab==="log"&&cookLog.length===0&&(
        <div style={{textAlign:"center",padding:"60px 32px"}}>
          <div style={{fontSize:60,marginBottom:16}}>📖</div>
          <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF,marginBottom:8}}>Your library is empty</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>Every dish you complete gets added here automatically. Start cooking to build your personal food journal.</div>
        </div>
      )}

      {libTab==="log"&&cookLog.length>0&&(
        <div style={{padding:"0 16px"}}>
          {/* Filters */}
          <div style={{display:"flex",gap:8,marginBottom:8,overflowX:"auto"}}>
            {[["all","All"],["rated","Rated"],["photos","With Photos"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setFilter(id)} className="tap" style={{whiteSpace:"nowrap",padding:"7px 14px",borderRadius:99,border:`2px solid ${filter===id?C.flame:C.border}`,background:filter===id?C.flame:C.cream,color:filter===id?"#fff":C.muted,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{lbl}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
            <span style={{fontSize:11,color:C.muted,fontWeight:700,flexShrink:0}}>Sort:</span>
            {[["recent","Most Recent"],["rating","Top Rated"],["xp","Most Heat 🔥"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setSort(id)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 10px",borderRadius:99,border:`1.5px solid ${sort===id?C.sky:C.border}`,background:sort===id?`${C.sky}18`:"transparent",color:sort===id?C.sky:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{lbl}</button>
            ))}
          </div>

          {/* Cuisine grid */}
          {uniqueCuisines.length>1&&(
            <div style={{marginBottom:18}}>
              <div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:10}}>Cuisines explored</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {uniqueCuisines.map(c=>{
                  const skill=SKILL_MAP[c];
                  const count=cookLog.filter(e=>e.category===c).length;
                  return(
                    <div key={c} style={{display:"flex",alignItems:"center",gap:6,background:C.cream,border:`1.5px solid ${skill?.color||C.border}22`,borderRadius:10,padding:"5px 10px"}}>
                      <span style={{fontSize:14}}>{skill?.icon||"🍽️"}</span>
                      <span style={{fontSize:11,fontWeight:700,color:C.bark}}>{c}</span>
                      <span style={{fontSize:10,color:C.muted}}>×{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Log entries */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {filtered.map((entry,idx)=>(
              <div key={idx} style={{background:"#fff",borderRadius:18,overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 2px 10px rgba(0,0,0,.05)",animation:`fadeUp .3s ease ${idx*.04}s both`}}>
                {entry.photo&&<img src={entry.photo} alt="" style={{width:"100%",height:180,objectFit:"cover"}}/>}
                <div style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:28}}>{entry.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:15,color:C.bark}}>{entry.name}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                        {entry.category&&<span style={{marginRight:8}}>{SKILL_MAP[entry.category]?.icon} {entry.category}</span>}
                        <span>{entry.date}</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {entry.rating>0&&<div style={{fontSize:13}}>{["","⭐","⭐⭐","⭐⭐⭐","⭐⭐⭐⭐","⭐⭐⭐⭐⭐"][entry.rating]}</div>}
                      <div style={{fontSize:11,fontWeight:700,color:C.sage,marginTop:2}}>+{entry.xp} 🔥 Heat</div>
                    </div>
                  </div>
                  {entry.caption&&<div style={{fontSize:13,color:"#6A5C52",lineHeight:1.55,padding:"10px 12px",background:C.cream,borderRadius:10,fontStyle:"italic"}}>"{entry.caption}"</div>}
                  {!entry.caption&&<div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>No notes added</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ SOCIAL FEED ═════════════════════════════════════════════════════════ */
function FeedTab({posts,setPosts,xp,weeklyXp,levelInfo,onAddFriends,onShareInsta}){
  const [activeTab,setActiveTab]=useState("league");
  const [showComments,setShowComments]=useState(null);
  const [newComment,setNewComment]=useState("");
  const league=getLeague(5);

  const giveMwah=(pid)=>setPosts(ps=>ps.map(p=>p.id!==pid?p:{...p,mwah:p.myMwah?p.mwah-1:p.mwah+1,myMwah:!p.myMwah}));
  const addComment=(pid)=>{
    if(!newComment.trim())return;
    setPosts(ps=>ps.map(p=>p.id!==pid?p:{...p,comments:[...(p.comments||[]),{user:"You",text:newComment.trim()}]}));
    setNewComment("");
  };

  return(
    <div style={{paddingBottom:24}}>
      {/* League card */}
      <div style={{margin:"4px 16px 20px",background:C.cream,borderRadius:20,border:`2px solid ${league.color}44`,overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${league.color}18,${league.color}06)`,padding:"16px 18px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{fontSize:42}}>{league.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF}}>{league.name}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>Top 5 promote to {LEAGUES[LEAGUES.indexOf(league)+1]?.name||"Diamond"} next week</div>
            </div>
          </div>
          {/* Tab toggle */}
          <div style={{display:"flex",background:C.pill,borderRadius:12,padding:3,gap:3,marginBottom:0}}>
            {[["league","🏆 This Week"],["following","👥 Following"],["mwah","❤️ Activity"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setActiveTab(id)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:10,padding:"8px 4px",fontWeight:800,fontSize:11,background:activeTab===id?"#fff":"transparent",color:activeTab===id?C.bark:C.muted,boxShadow:activeTab===id?"0 2px 6px rgba(0,0,0,.07)":"none",transition:"all .18s"}}>{lbl}</button>
            ))}
          </div>
        </div>

        <div style={{padding:"14px 18px 18px"}}>
          {activeTab==="league"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:12,color:C.muted}}>Weekly leaderboard resets Sunday</span>
                <span style={{fontSize:13,fontWeight:800,color:league.color}}>{weeklyXp} 🔥 Heat</span>
              </div>
              {LEADERBOARD.map((u,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:u.isMe?`${league.color}12`:"transparent",borderRadius:10,padding:u.isMe?"8px 10px":"4px 10px",marginBottom:4,border:u.isMe?`1.5px solid ${league.color}30`:"none",transition:"all .2s"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:i<3?["#F5C842","#A8A9AD","#CD7F32"][i]:C.pill,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:i<3?"#fff":C.muted,flexShrink:0}}>{u.rank}</div>
                  <span style={{fontSize:20}}>{u.avatar}</span>
                  <span style={{flex:1,fontWeight:u.isMe?900:600,fontSize:13,color:C.bark}}>{u.name}{u.isMe?" (you)":""}</span>
                  <span style={{fontSize:11,color:C.muted}}>🔥{u.streak}</span>
                  <span style={{fontWeight:800,fontSize:13,color:u.isMe?league.color:C.muted}}>{u.weeklyXp} 🔥</span>
                </div>
              ))}
              <div style={{fontSize:11,color:C.muted,marginTop:10,padding:"8px 10px",background:`${C.sage}0D`,borderRadius:10}}>💡 Cook more this week to climb the leaderboard. 🔥 Heat resets every Sunday.</div>
            </div>
          )}

          {activeTab==="following"&&(
            <div>
              <div style={{fontSize:12,color:C.muted,marginBottom:12}}>People you follow — their activity this week.</div>
              {[{name:"Sofia R.",avatar:"👩‍🍳",cooked:4,xp:620,streak:12},{name:"Jake M.",avatar:"🧑‍🍳",cooked:2,xp:110,streak:7},{name:"Priya K.",avatar:"👩‍🦱",cooked:3,xp:195,streak:5},{name:"Marcus T.",avatar:"🧔",cooked:1,xp:80,streak:3}].map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
                  <span style={{fontSize:22}}>{f.avatar}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:C.bark}}>{f.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{f.cooked} dishes · 🔥{f.streak} streak</div>
                  </div>
                  <span style={{fontSize:13,fontWeight:800,color:C.sage}}>{f.xp} 🔥 Heat</span>
                </div>
              ))}
              <button className="tap" style={{width:"100%",marginTop:14,padding:"10px",borderRadius:14,border:`2px dashed ${C.border}`,background:"transparent",color:C.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Find friends to follow</button>
            </div>
          )}

          {activeTab==="mwah"&&(
            <div>
              <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Recent activity on your posts.</div>
              {[{user:"Sofia R.",avatar:"👩‍🍳",action:"gave 🤌 Mwah to your",dish:"Shakshuka",time:"2h ago"},{user:"Jake M.",avatar:"🧑‍🍳",action:"commented on your",dish:"Avocado Toast",time:"5h ago"},{user:"Priya K.",avatar:"👩‍🦱",action:"gave 🤌 Mwah to your",dish:"Overnight Oats",time:"1d ago"}].map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                  <span style={{fontSize:22}}>{a.avatar}</span>
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.bark}}>{a.user} </span>
                    <span style={{fontSize:13,color:C.muted}}>{a.action} </span>
                    <span style={{fontSize:13,fontWeight:700,color:C.flame}}>{a.dish}</span>
                  </div>
                  <span style={{fontSize:11,color:C.muted,flexShrink:0}}>{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Level progress */}
      <div style={{margin:"0 16px 20px",background:C.cream,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:`${levelInfo.current.color}18`,border:`2px solid ${levelInfo.current.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{levelInfo.current.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:800,fontSize:14,color:C.bark}}>Lv.{levelInfo.current.level} · {levelInfo.current.title}</span>
              {levelInfo.next&&<span style={{fontSize:11,color:C.muted}}>{levelInfo.xpIntoLevel}/{levelInfo.xpForLevel} 🔥 Heat</span>}
            </div>
            <div style={{marginTop:6}}><XPBar pct={levelInfo.pct} color={levelInfo.current.color} h={7}/></div>
            {levelInfo.next&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>Next: {levelInfo.next.title} {levelInfo.next.icon}</div>}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Following</div>
          <button onClick={onAddFriends} className="tap" style={{background:`${C.sage}14`,border:`2px solid ${C.sage}33`,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontWeight:800,fontSize:12,color:C.sage}}>👥 Add Friends</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {posts.map((post,idx)=>(
            <div key={post.id} style={{background:"#fff",borderRadius:20,overflow:"hidden",border:`1px solid ${C.border}`,animation:`fadeUp .35s ease ${idx*.06}s both`,boxShadow:"0 2px 14px rgba(0,0,0,.06)"}}>
              <div style={{padding:"14px 16px 12px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,borderRadius:13,background:`${C.ember}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{post.user.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{post.user.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{post.user.level} · {post.time}</div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:C.flame,background:`${C.flame}12`,borderRadius:8,padding:"3px 8px"}}>🍳 {post.recipe}</div>
              </div>
              {post.photo
                ?<img src={post.photo} alt="" style={{width:"100%",maxHeight:360,objectFit:"cover"}}/>
                :<div style={{background:"linear-gradient(135deg,#F0E8E0,#E8DDD4)",height:200,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
                  <span style={{fontSize:72}}>{post.emoji}</span>
                  <span style={{fontSize:14,fontWeight:700,color:C.bark,opacity:.3}}>{post.recipe}</span>
                </div>
              }
              <div style={{padding:"12px 16px 0"}}>
                {post.caption&&<div style={{fontSize:14,color:C.bark,lineHeight:1.55,marginBottom:12}}><span style={{fontWeight:700}}>{post.user.name.split(" ")[0]}</span> {post.caption}</div>}
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
                  <button onClick={()=>giveMwah(post.id)} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
                    <span style={{fontSize:22,transition:"transform .2s",transform:post.myMwah?"scale(1.15)":"scale(1)"}}>{post.myMwah?"👏":"🤍"}</span>
                    <span style={{fontSize:13,fontWeight:700,color:post.myMwah?C.flame:C.muted}}>{post.mwah} 🤌 mwah{post.mwah!==1?"s":""}</span>
                  </button>
                  <button onClick={()=>setShowComments(showComments===post.id?null:post.id)} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
                    <span style={{fontSize:20}}>💬</span>
                    <span style={{fontSize:13,fontWeight:700,color:C.muted}}>{(post.comments||[]).length}</span>
                  </button>
                  <button onClick={()=>onShareInsta(post)} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 0",marginLeft:"auto"}}>
                    <span style={{fontSize:18}}>📸</span>
                    <span style={{fontSize:12,fontWeight:700,color:C.muted}}>Share</span>
                  </button>
                </div>
                {showComments===post.id&&(
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,paddingBottom:14}}>
                    {(post.comments||[]).map((c,i)=>(
                      <div key={i} style={{marginBottom:8}}>
                        <span style={{fontWeight:700,fontSize:13,color:C.bark}}>{c.user} </span>
                        <span style={{fontSize:13,color:"#6A5C52"}}>{c.text}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment(post.id)} placeholder="Add a comment…" style={{flex:1,padding:"9px 12px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.paper,fontSize:13,color:C.bark,outline:"none"}}/>
                      <button onClick={()=>addComment(post.id)} disabled={!newComment.trim()} style={{padding:"9px 14px",borderRadius:12,border:"none",background:newComment.trim()?C.flame:"#D8D0C8",color:"#fff",fontWeight:800,fontSize:13,cursor:newComment.trim()?"pointer":"default"}}>Post</button>
                    </div>
                  </div>
                )}
                {showComments!==post.id&&<div style={{height:14}}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ HOME TAB ════════════════════════════════════════════════════════════ */
function HomeTab({xp,setXp,recipes,onOpen,onComplete,goal,cookedDays,setCookedDays,onEditGoal,challengeProgress,levelInfo,onQuickLog,onShowRecap,onShowCalendar,seasonalEvent,signatureDish}){
  const [completing,setCompleting]=useState(null);
  const quickComplete=(e,r)=>{
    e.stopPropagation();if(completing)return;
    setCompleting(r.id);
    setTimeout(()=>{setXp(x=>x+r.xp);const di=new Date().getDay();const idx=di===0?6:di-1;setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});onComplete(r,null,"",0);setCompleting(null);},900);
  };
  const weekDone=cookedDays.filter(Boolean).length;
  const pct=Math.min(100,weekDone/goal.target*100);
  const goalDone=weekDone>=goal.target;
  const activeCh=CHALLENGES.find(ch=>(challengeProgress[ch.id]||0)>0&&(challengeProgress[ch.id]||0)<ch.target);

  return(
    <div style={{paddingBottom:24}}>
      {/* Streak hero */}
      <div style={{margin:"0 16px 18px",background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px 20px 18px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-18,right:-18,fontSize:88,opacity:.1,transform:"rotate(-15deg)",lineHeight:1}}>{goal.icon}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",opacity:.6,marginBottom:4}}>This Week · {goal.label}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:42,fontWeight:900,lineHeight:1,fontFamily:DF}}>{weekDone}/{goal.target}</span>
              <span style={{fontSize:16,opacity:.7}}>{goal.icon}</span>
            </div>
          </div>
          <button onClick={onEditGoal} className="tap" style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700}}>Edit Goal</button>
        </div>
        <div style={{background:"rgba(255,255,255,.15)",borderRadius:99,height:10,overflow:"hidden",marginBottom:5}}>
          <div style={{width:`${pct}%`,height:"100%",background:goalDone?C.gold:goal.color,borderRadius:99,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/>
        </div>
        <div style={{fontSize:11,opacity:.6,marginBottom:14}}>{goalDone?"🎉 Goal smashed this week!":`${goal.target-weekDone} more cook${goal.target-weekDone===1?"":"s"} to go`}</div>
        <div style={{display:"flex",gap:5,marginBottom:16}}>
          {WEEK_LABELS.map((d,i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <div style={{height:26,borderRadius:7,background:cookedDays[i]?goal.color:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{cookedDays[i]?"✓":""}</div>
              <div style={{fontSize:8,marginTop:3,opacity:.45}}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:14}}>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Total Heat</div><div style={{fontSize:20,fontWeight:900}}>{xp.toLocaleString()}</div></div>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Level</div><div style={{fontSize:20,fontWeight:900}}>{levelInfo.current.icon} {levelInfo.current.title}</div></div>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Cooked</div><div style={{fontSize:20,fontWeight:900}}>{recipes.filter(r=>r.done).length}</div></div>
        </div>
      </div>

      {/* Level bar */}
      {levelInfo.next&&(
        <div style={{margin:"0 16px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:C.muted,fontWeight:600}}>Next: {levelInfo.next.title} {levelInfo.next.icon}</span>
            <span style={{fontSize:12,color:levelInfo.current.color,fontWeight:700}}>{levelInfo.xpIntoLevel}/{levelInfo.xpForLevel} 🔥 Heat</span>
          </div>
          <XPBar pct={levelInfo.pct} color={levelInfo.current.color}/>
        </div>
      )}

      {/* Active challenge teaser */}
      {activeCh&&(
        <div style={{margin:"0 16px 18px",background:`${activeCh.color}0F`,border:`2px solid ${activeCh.color}33`,borderRadius:16,padding:"14px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:28}}>{activeCh.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{activeCh.name}</div>
              <div style={{fontSize:11,color:activeCh.color,fontWeight:600,marginTop:2}}>{challengeProgress[activeCh.id]}/{activeCh.target} {activeCh.unit} complete</div>
              <div style={{marginTop:6}}><XPBar pct={Math.round((challengeProgress[activeCh.id]||0)/activeCh.target*100)} color={activeCh.color} h={5}/></div>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Event */}
      {seasonalEvent&&(
        <div style={{margin:"0 16px 18px",background:`${seasonalEvent.color}0F`,border:`2px solid ${seasonalEvent.color}33`,borderRadius:18,padding:"16px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,fontFamily:DF}}>{seasonalEvent.name}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{seasonalEvent.desc}</div>
            </div>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,background:C.pill,padding:"4px 8px",borderRadius:8,flexShrink:0}}>Ends {seasonalEvent.ends}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,fontWeight:600,color:C.bark}}>{seasonalEvent.progress}/{seasonalEvent.goal} completed</span>
            <span style={{fontSize:12,color:seasonalEvent.color,fontWeight:700}}>Badge: {seasonalEvent.badge.emoji} {seasonalEvent.badge.label}</span>
          </div>
          <XPBar pct={Math.round(seasonalEvent.progress/seasonalEvent.goal*100)} color={seasonalEvent.color} h={6}/>
        </div>
      )}

      {/* Action buttons row */}
      <div style={{margin:"0 16px 18px",display:"flex",gap:10}}>
        <button onClick={onQuickLog} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:3}}>⚡</div>
          <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Quick Log</div>
        </button>
        <button onClick={onShowCalendar} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:3}}>📅</div>
          <div style={{fontSize:11,fontWeight:800,color:C.bark}}>History</div>
        </button>
        <button onClick={onShowRecap} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:3}}>📊</div>
          <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Weekly Recap</div>
        </button>
        {signatureDish&&(
          <div style={{flex:1,background:`${C.flame}0F`,border:`2px solid ${C.flame}22`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:3}}>{signatureDish.emoji}</div>
            <div style={{fontSize:10,fontWeight:800,color:C.flame}}>Signature</div>
          </div>
        )}
      </div>

      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:18,fontWeight:900,color:C.bark,margin:0,fontFamily:DF}}>Cook Today</h2>
          <span style={{fontSize:12,color:C.flame,fontWeight:700}}>{recipes.filter(r=>!r.done).length} remaining</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {recipes.slice(0,6).map(r=>(
            <div key={r.id} onClick={()=>onOpen(r)} className="ch" style={{background:r.done?"#F5F0EB":C.cream,border:`2px solid ${r.done?"#E0D5CB":C.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,opacity:r.done?.65:1,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)",transition:"transform .18s,box-shadow .18s"}}>
              {r.photo&&!r.done
  ?<img src={r.photo} alt={r.name} style={{width:52,height:52,borderRadius:14,objectFit:"cover",flexShrink:0}}/>
  :<div style={{width:52,height:52,borderRadius:14,background:r.done?"#E0D5CB":`${C.ember}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{r.done?"✅":r.emoji}</div>
}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:15,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                <div style={{display:"flex",gap:8,marginTop:4}}><span style={{fontSize:11,color:C.muted}}>⏱ {r.time}</span><DiffBadge level={r.difficulty}/></div>
                {r.macros&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>🔥 {r.macros.calories} kcal · 💪 {r.macros.protein}g protein</div>}
              </div>
              {!r.done&&(
                <button onClick={e=>quickComplete(e,r)} className="tap" style={{background:completing===r.id?C.sage:C.flame,color:"#fff",border:"none",borderRadius:12,padding:"8px 14px",fontWeight:800,fontSize:12,cursor:"pointer",flexShrink:0,boxShadow:`0 3px 10px ${C.flame}44`,transition:"background .2s"}}>
                  {completing===r.id?`+${r.xp} 🔥`:`Cook · ${r.xp} 🔥`}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ RECIPES TAB ═════════════════════════════════════════════════════════ */
function RecipesTab({allRecipes,onOpen,onShowCreate,onShowImport}){
  const CATS=["All","Breakfast","Quick","Asian","Indian","Japanese","Italian","Mexican","Mediterranean","Comfort","Healthy","Baking"];
  const DIETS=["All","Vegetarian","Vegan","Gluten-free","Keto","Dairy-free"];
  const [cat,setCat]=useState("All");
  const [diet,setDiet]=useState("All");
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("default");

  const filtered=useMemo(()=>{
    let rs=allRecipes.filter(r=>{
      const mc=cat==="All"||r.category===cat;
      const md=diet==="All"||(r.diets||[]).includes(diet);
      return mc&&md&&r.name.toLowerCase().includes(search.toLowerCase());
    });
    if(sort==="cals")  rs=[...rs].sort((a,b)=>(a.macros?.calories||0)-(b.macros?.calories||0));
    if(sort==="protein")rs=[...rs].sort((a,b)=>(b.macros?.protein||0)-(a.macros?.protein||0));
    if(sort==="xp")    rs=[...rs].sort((a,b)=>b.xp-a.xp);
    if(sort==="easy")  rs=[...rs].sort((a,b)=>({Easy:0,Medium:1,Hard:2}[a.difficulty]||0)-({Easy:0,Medium:1,Hard:2}[b.difficulty]||0));
    return rs;
  },[allRecipes,cat,diet,search,sort]);

  return(
    <div style={{paddingBottom:24}}>
      <div style={{padding:"4px 16px 10px"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search recipes…" style={{width:"100%",padding:"11px 14px 11px 40px",borderRadius:14,border:`2px solid ${search?C.ember:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box",transition:"border-color .18s"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:10,padding:"0 16px 12px"}}>
        <button onClick={onShowCreate} className="tap" style={{flex:1,background:`${C.sage}14`,border:`2px solid ${C.sage}33`,borderRadius:14,padding:"12px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:3}}>✍️</div>
          <div style={{fontSize:12,fontWeight:800,color:C.sage}}>Create Recipe</div>
        </button>
        <button onClick={onShowImport} className="tap" style={{flex:1,background:`${C.sky}14`,border:`2px solid ${C.sky}33`,borderRadius:14,padding:"12px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:3}}>🔗</div>
          <div style={{fontSize:12,fontWeight:800,color:C.sky}}>Import URL</div>
        </button>
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 16px 8px"}}>{CATS.map(c=><button key={c} onClick={()=>setCat(c)} className="tap" style={{whiteSpace:"nowrap",padding:"7px 14px",borderRadius:99,border:`2px solid ${cat===c?C.flame:C.border}`,background:cat===c?C.flame:C.cream,color:cat===c?"#fff":C.muted,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{c}</button>)}</div>
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 16px 8px"}}>{DIETS.map(d=><button key={d} onClick={()=>setDiet(d)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 12px",borderRadius:99,border:`2px solid ${diet===d?C.sage:C.border}`,background:diet===d?`${C.sage}18`:"transparent",color:diet===d?C.sage:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{d==="All"?"🍽️ All":d}</button>)}</div>
      <div style={{display:"flex",gap:8,padding:"0 16px 12px",alignItems:"center",overflowX:"auto"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:700,flexShrink:0}}>Sort:</span>
        {[["default","Default"],["easy","Easiest"],["cals","Lowest Cal"],["protein","Most Protein"],["xp","Most Heat 🔥"]].map(([k,l])=><button key={k} onClick={()=>setSort(k)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 10px",borderRadius:99,border:`1.5px solid ${sort===k?C.sky:C.border}`,background:sort===k?`${C.sky}18`:"transparent",color:sort===k?C.sky:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{l}</button>)}
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:12,color:C.muted,fontWeight:600,marginBottom:10}}>{filtered.length} recipe{filtered.length!==1?"s":""}</div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}><div style={{fontSize:44,marginBottom:12}}>🍽️</div><div style={{fontWeight:700,marginBottom:4}}>No recipes match</div><div style={{fontSize:13}}>Try adjusting the filters</div></div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((r,idx)=>(
            <div key={r.id} className="ch" onClick={()=>onOpen(r)} style={{background:r.done?"#F5F0EB":C.cream,border:`2px solid ${r.done?"#E0D5CB":C.border}`,borderRadius:18,padding:"15px",display:"flex",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)",animation:`fadeUp .3s ease ${idx*.04}s both`,transition:"transform .18s,box-shadow .18s"}}>
              {r.photo&&!r.done
  ?<img src={r.photo} alt={r.name} style={{width:58,height:58,borderRadius:16,objectFit:"cover",flexShrink:0}}/>
  :<div style={{width:58,height:58,borderRadius:16,background:r.done?"#E8E0D8":`${C.ember}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{r.done?"✅":r.emoji}</div>
}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <div style={{fontWeight:800,fontSize:15,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                  {r.isCustom&&<span style={{fontSize:9,background:`${C.sage}18`,color:C.sage,borderRadius:5,padding:"1px 5px",fontWeight:700,flexShrink:0}}>MINE</span>}
                  {r.isImported&&<span style={{fontSize:9,background:`${C.sky}18`,color:C.sky,borderRadius:5,padding:"1px 5px",fontWeight:700,flexShrink:0}}>IMPORTED</span>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:5}}>
                  <DiffBadge level={r.difficulty}/>
                  {(r.diets||[]).filter(d=>d!=="No restrictions").slice(0,2).map(d=><Chip key={d} label={d} color={C.sage}/>)}
                </div>
                {r.macros&&(
                  <div style={{display:"flex",gap:5,marginBottom:5,flexWrap:"wrap"}}>
                    {[["🔥",r.macros.calories,"kcal",C.flame],["💪",r.macros.protein,"g protein",C.sky]].map(([icon,val,unit,color])=>(
                      <span key={unit} style={{fontSize:9,fontWeight:700,color,background:`${color}12`,borderRadius:5,padding:"2px 5px"}}>{icon} {val}{unit}</span>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:C.muted}}>⏱ {r.time}</span>
                  <span style={{fontSize:12,fontWeight:800,color:r.done?C.sage:C.flame}}>{r.done?"✓ Cooked":`+${r.xp} XP`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ GOAL PICKER ═════════════════════════════════════════════════════════ */
function GoalPicker({goal,onSelect,onClose}){
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🎯 Cooking Goal</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>A rhythm that fits your real life</div></div>
          <CloseBtn onClose={onClose}/>
        </div>
        <div style={{background:`${C.sky}14`,border:`1.5px solid ${C.sky}33`,borderRadius:14,padding:"11px 14px",marginBottom:18,marginTop:12}}>
          <div style={{fontSize:12,color:C.sky,fontWeight:700,lineHeight:1.5}}>💡 The best streak is the one you can actually keep. A weekly cook beats an abandoned daily streak every time.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {STREAK_GOALS.map(g=>{
            const a=goal.id===g.id;
            return(
              <button key={g.id} className="tap" onClick={()=>onSelect(g)} style={{background:a?`${g.color}14`:C.cream,border:`2px solid ${a?g.color:C.border}`,borderRadius:18,padding:"15px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all .18s"}}>
                <div style={{width:48,height:48,borderRadius:14,background:a?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}><div style={{fontWeight:900,fontSize:15,color:C.bark}}>{g.label}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{g.sub}</div></div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:900,fontSize:20,color:a?g.color:C.muted}}>{g.target}×</div><div style={{fontSize:10,color:C.muted}}>/week</div></div>
                {a&&<div style={{width:22,height:22,borderRadius:"50%",background:g.color,color:"#fff",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}



/* ═══ CREATE RECIPE ═══════════════════════════════════════════════════════ */
function CreateRecipeSheet({onSave,onClose}){
  const [name,setName]=useState("");
  const [category,setCategory]=useState("Comfort");
  const [difficulty,setDifficulty]=useState("Easy");
  const [time,setTime]=useState("");
  const [ingredients,setIngredients]=useState([""]);
  const [steps,setSteps]=useState([{title:"",body:""}]);
  const [tip,setTip]=useState("");
  const [activeTab,setActiveTab]=useState("basics");
  const CATS=["Breakfast","Quick","Asian","Indian","Japanese","Italian","Mexican","Mediterranean","Comfort","Healthy","Baking"];

  const addIngredient=()=>setIngredients(i=>[...i,""]);
  const setIng=(idx,val)=>setIngredients(i=>i.map((x,j)=>j===idx?val:x));
  const removeIng=(idx)=>setIngredients(i=>i.filter((_,j)=>j!==idx));
  const addStep=()=>setSteps(s=>[...s,{title:"",body:""}]);
  const setStep=(idx,field,val)=>setSteps(s=>s.map((x,j)=>j===idx?{...x,[field]:val}:x));
  const removeStep=(idx)=>setSteps(s=>s.filter((_,j)=>j!==idx));

  const handleSave=()=>{
    if(!name.trim()||ingredients.filter(i=>i.trim()).length===0)return;
    const xpMap={Easy:50,Medium:80,Hard:120};
    onSave({
      id:Date.now(),name:name.trim(),emoji:"🍳",photo:null,
      xp:xpMap[difficulty]||60,difficulty,time:time||"30 min",
      category,diets:["No restrictions"],macros:null,done:false,
      ingredients:ingredients.filter(i=>i.trim()),
      steps:steps.filter(s=>s.body.trim()).map(s=>({title:s.title||"Step",body:s.body})),
      tip:tip.trim()||null,isCustom:true,
    });
    onClose();
  };

  const tabSt=(id)=>({flex:1,border:"none",cursor:"pointer",borderRadius:10,padding:"8px 4px",fontWeight:800,fontSize:12,background:activeTab===id?"#fff":"transparent",color:activeTab===id?C.bark:C.muted,boxShadow:activeTab===id?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .18s"});

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>✍️ Create Recipe</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Add your own recipe to your library</div></div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{display:"flex",background:C.pill,borderRadius:14,padding:4,gap:4,marginBottom:16}}>
          {[["basics","📋 Basics"],["ingredients","🥕 Ingredients"],["steps","👨‍🍳 Steps"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={tabSt(id)}>{lbl}</button>
          ))}
        </div>

        {activeTab==="basics"&&(
          <div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".07em"}}>Recipe Name</div>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mum's Pasta Bake" style={{width:"100%",padding:"11px 14px",borderRadius:14,border:`2px solid ${name?C.ember:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".07em"}}>Difficulty</div>
                <div style={{display:"flex",gap:6}}>
                  {["Easy","Medium","Hard"].map(d=><button key={d} onClick={()=>setDifficulty(d)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:`2px solid ${difficulty===d?C.flame:C.border}`,background:difficulty===d?`${C.flame}12`:"transparent",color:difficulty===d?C.flame:C.muted,fontWeight:700,fontSize:11,cursor:"pointer"}}>{d}</button>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".07em"}}>Time</div>
                <input value={time} onChange={e=>setTime(e.target.value)} placeholder="30 min" style={{width:"100%",padding:"9px 12px",borderRadius:12,border:`2px solid ${C.border}`,background:C.cream,fontSize:13,color:C.bark,outline:"none",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em"}}>Category</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {CATS.map(cat=><button key={cat} onClick={()=>setCategory(cat)} style={{padding:"6px 12px",borderRadius:99,border:`2px solid ${category===cat?C.sage:C.border}`,background:category===cat?C.sage:"transparent",color:category===cat?"#fff":C.muted,fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s"}}>{cat}</button>)}
              </div>
            </div>
            <div style={{marginTop:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".07em"}}>Chef's Tip (optional)</div>
              <textarea value={tip} onChange={e=>setTip(e.target.value)} placeholder="Your best tip for this recipe..." style={{width:"100%",minHeight:60,padding:"10px 12px",borderRadius:12,border:`2px solid ${C.border}`,background:C.cream,fontSize:13,color:C.bark,outline:"none",resize:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
            </div>
          </div>
        )}

        {activeTab==="ingredients"&&(
          <div>
            <div style={{marginBottom:12}}>
              {ingredients.map((ing,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={ing} onChange={e=>setIng(i,e.target.value)} placeholder={`Ingredient ${i+1} with quantity...`} style={{flex:1,padding:"9px 12px",borderRadius:12,border:`2px solid ${ing?C.ember:C.border}`,background:C.cream,fontSize:13,color:C.bark,outline:"none",transition:"border-color .18s"}}/>
                  {ingredients.length>1&&<button onClick={()=>removeIng(i)} style={{width:32,height:36,borderRadius:10,background:`${C.flame}14`,border:`1.5px solid ${C.flame}33`,color:C.flame,fontWeight:800,fontSize:16,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                </div>
              ))}
            </div>
            <Btn onClick={addIngredient} outline color={C.sage} full sm>+ Add Ingredient</Btn>
          </div>
        )}

        {activeTab==="steps"&&(
          <div>
            {steps.map((s,i)=>(
              <div key={i} style={{background:C.cream,borderRadius:16,padding:"14px",border:`1px solid ${C.border}`,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                  <input value={s.title} onChange={e=>setStep(i,"title",e.target.value)} placeholder="Step name…" style={{flex:1,padding:"7px 10px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.paper,fontSize:13,color:C.bark,outline:"none"}}/>
                  {steps.length>1&&<button onClick={()=>removeStep(i)} style={{width:28,height:28,borderRadius:8,background:`${C.flame}14`,border:"none",color:C.flame,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                </div>
                <textarea value={s.body} onChange={e=>setStep(i,"body",e.target.value)} placeholder="Describe what to do in this step…" style={{width:"100%",minHeight:64,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.paper,fontSize:13,color:C.bark,outline:"none",resize:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
              </div>
            ))}
            <Btn onClick={addStep} outline color={C.sky} full sm>+ Add Step</Btn>
          </div>
        )}

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <Btn onClick={onClose} outline color={C.muted} style={{flex:1}}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={!name.trim()||ingredients.filter(i=>i.trim()).length===0} color={C.sage} style={{flex:2}}>Save Recipe ✓</Btn>
        </div>
      </div>
    </Sheet>
  );
}

/* ═══ URL IMPORT ══════════════════════════════════════════════════════════ */
function URLImportSheet({onSave,onClose}){
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  const importRecipe=async()=>{
    if(!url.trim())return;
    setLoading(true);setError("");setResult(null);
    try{
      // Use allorigins.win as CORS proxy to fetch the page
      const proxyUrl=`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res=await fetch(proxyUrl,{signal:AbortSignal.timeout(15000)});
      const html=await res.text();

      // Try to extract JSON-LD Recipe schema (published by most recipe sites)
      const jsonLdMatches=html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
      let recipe=null;

      for(const match of jsonLdMatches){
        try{
          const data=JSON.parse(match[1].trim());
          const items=Array.isArray(data)?data:[data];
          const found=items.find(d=>d?.["@type"]==="Recipe"||(Array.isArray(d?.["@type"])&&d["@type"].includes("Recipe")));
          if(found){recipe=found;break;}
        }catch{}
      }

      if(!recipe)throw new Error("no_recipe");

      // Extract ingredients
      const ingredients=(recipe.recipeIngredient||[]).map(i=>String(i).trim()).filter(Boolean);

      // Extract steps
      const rawSteps=recipe.recipeInstructions||[];
      const steps=rawSteps.map((s,i)=>{
        if(typeof s==="string")return{title:`Step ${i+1}`,body:s.trim()};
        return{title:s.name||`Step ${i+1}`,body:(s.text||s.description||"").trim()};
      }).filter(s=>s.body);

      // Extract time
      const totalTime=recipe.totalTime||recipe.cookTime||recipe.prepTime||"";
      const timeStr=totalTime.replace(/PT/,"").replace(/H/,"h ").replace(/M/,"min").trim()||"";

      // Get image URL if provided in the structured data (don't scrape from page)
      const imageUrl=typeof recipe.image==="string"?recipe.image:recipe.image?.url||null;

      if(ingredients.length===0&&steps.length===0)throw new Error("no_recipe");

      setResult({
        name:recipe.name||"Imported Recipe",
        emoji:"🍳",
        photo:imageUrl,
        time:timeStr||"30 min",
        ingredients,steps,
        tip:null,
        sourceUrl:url,
        sourceName:new URL(url).hostname.replace("www.",""),
      });
    }catch(e){
      if(e.message==="no_recipe"){
        setError("No recipe found on that page. This works best with recipe blogs and cooking websites that use structured data.");
      } else {
        setError("Couldn't reach that page. Check the URL is correct and the site is accessible.");
      }
    }finally{setLoading(false);}
  };

  const handleSave=()=>{
    if(!result)return;
    const xpMap={Easy:50,Medium:80,Hard:120};
    onSave({
      id:Date.now(),
      name:result.name,emoji:result.emoji,photo:result.photo,
      xp:60,difficulty:"Medium",time:result.time,
      category:"Comfort",diets:["No restrictions"],macros:null,done:false,
      ingredients:result.ingredients,steps:result.steps,tip:result.tip,
      isImported:true,sourceUrl:result.sourceUrl,sourceName:result.sourceName,
    });
    onClose();
  };

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🔗 Import from URL</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Paste a link from any recipe website</div></div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{background:`${C.sky}0E`,border:`1.5px solid ${C.sky}28`,borderRadius:14,padding:"11px 14px",marginBottom:16}}>
          <div style={{fontSize:12,color:C.sky,fontWeight:700,lineHeight:1.5}}>Works with BBC Good Food, AllRecipes, Taste.com.au, and most recipe blogs. The recipe is always linked back to the original source.</div>
        </div>

        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&importRecipe()} placeholder="https://www.bbcgoodfood.com/recipes/..." style={{flex:1,padding:"11px 14px",borderRadius:14,border:`2px solid ${url?C.ember:C.border}`,background:C.cream,fontSize:13,color:C.bark,outline:"none",transition:"border-color .18s"}}/>
          <Btn onClick={importRecipe} disabled={!url.trim()||loading} style={{padding:"11px 16px",flexShrink:0}}>{loading?"…":"Import"}</Btn>
        </div>

        {loading&&(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:40,display:"inline-block",animation:"spin 1.2s linear infinite",marginBottom:12}}>🍳</div>
            <div style={{fontSize:14,color:C.muted}}>Reading the recipe…</div>
          </div>
        )}

        {error&&<div style={{background:`${C.flame}12`,border:`1.5px solid ${C.flame}30`,borderRadius:14,padding:"12px 14px",fontSize:13,color:C.flame,lineHeight:1.5}}>{error}</div>}

        {result&&!loading&&(
          <div>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"16px 18px",marginBottom:14,color:"#fff"}}>
              {result.photo&&<img src={result.photo} alt="" style={{width:"100%",height:160,objectFit:"cover",borderRadius:12,marginBottom:12}}/>}
              <div style={{fontWeight:900,fontSize:18,fontFamily:DF}}>{result.name}</div>
              <div style={{fontSize:11,opacity:.6,marginTop:4}}>from {result.sourceName} · ⏱ {result.time}</div>
              <div style={{fontSize:11,marginTop:8,opacity:.7}}>{result.ingredients.length} ingredients · {result.steps.length} steps</div>
            </div>
            <div style={{background:C.cream,borderRadius:16,padding:"12px 14px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>INGREDIENTS PREVIEW</div>
              {result.ingredients.slice(0,5).map((ing,i)=><div key={i} style={{fontSize:13,color:C.bark,padding:"3px 0",borderBottom:i<4?`1px solid ${C.border}`:"none"}}>{ing}</div>)}
              {result.ingredients.length>5&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>+{result.ingredients.length-5} more</div>}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>{setResult(null);setUrl("");}} outline color={C.muted} style={{flex:1}}>Try another</Btn>
              <Btn onClick={handleSave} color={C.sage} style={{flex:2}}>Add to My Recipes ✓</Btn>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ═══ NOTIFICATIONS TAB ════════════════════════════════════════════════════ */
function NotificationsTab({notifications,setNotifications,setTab}){
  const markAllRead=()=>setNotifications(ns=>ns.map(n=>({...n,read:true})));
  const markRead=(id)=>setNotifications(ns=>ns.map(n=>n.id===id?{...n,read:true}:n));
  const accept=(id)=>{markRead(id);setNotifications(ns=>ns.map(n=>n.id===id?{...n,accepted:true}:n));};
  const decline=(id)=>setNotifications(ns=>ns.filter(n=>n.id!==id));

  const unreadCount=notifications.filter(n=>!n.read).length;

  const typeConfig={
    mwah:      {color:C.flame,  bg:`${C.flame}12`,  icon:"🤌"},
    comment:   {color:C.sky,    bg:`${C.sky}12`,    icon:"💬"},
    friend_req:{color:C.sage,   bg:`${C.sage}12`,   icon:"👤"},
    challenge: {color:C.plum,   bg:`${C.plum}12`,   icon:"⚔️"},
    streak:    {color:C.ember,  bg:`${C.ember}12`,  icon:"🔥"},
    level:     {color:C.gold,   bg:`${C.gold}12`,   icon:"⭐"},
  };

  return(
    <div style={{paddingBottom:30}}>
      {/* Header */}
      <div style={{padding:"0 16px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:900,fontSize:22,color:C.bark,fontFamily:DF}}>Notifications</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{unreadCount>0?`${unreadCount} unread`:"All caught up ✓"}</div>
        </div>
        {unreadCount>0&&(
          <button onClick={markAllRead} className="tap" style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,color:C.muted,cursor:"pointer"}}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length===0&&(
        <div style={{textAlign:"center",padding:"60px 32px"}}>
          <div style={{fontSize:56,marginBottom:16}}>🔔</div>
          <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF,marginBottom:8}}>No notifications yet</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>When friends give you 🤌 Mwah, comment on your dishes, or challenge you — it'll show up here.</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:2,padding:"0 12px"}}>
        {notifications.map((n,idx)=>{
          const cfg=typeConfig[n.type]||{color:C.muted,bg:C.cream,icon:"🔔"};
          return(
            <div key={n.id} onClick={()=>markRead(n.id)} style={{background:n.read?"transparent":cfg.bg,borderRadius:16,padding:"14px 14px",display:"flex",gap:12,alignItems:"flex-start",transition:"background .3s",animation:`fadeUp .25s ease ${idx*.03}s both`,cursor:"default"}}>
              {/* Avatar + type icon */}
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:44,height:44,borderRadius:14,background:`${cfg.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
                  {n.avatar}
                </div>
                <div style={{position:"absolute",bottom:-4,right:-4,width:20,height:20,borderRadius:"50%",background:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,border:"2px solid #FAF4EE"}}>
                  {cfg.icon}
                </div>
              </div>

              {/* Content */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,color:C.bark,lineHeight:1.5}}>
                  {n.type!=="streak"&&n.type!=="level"&&<span style={{fontWeight:800}}>{n.name} </span>}
                  <span style={{fontWeight:n.read?400:600}}>{n.text}</span>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:4}}>{n.time}</div>

                {/* Friend request actions */}
                {n.type==="friend_req"&&!n.accepted&&(
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button onClick={e=>{e.stopPropagation();accept(n.id);}} className="tap" style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:C.sage,color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}}>Accept</button>
                    <button onClick={e=>{e.stopPropagation();decline(n.id);}} className="tap" style={{flex:1,padding:"8px",borderRadius:10,border:`1.5px solid ${C.border}`,background:"transparent",color:C.muted,fontWeight:700,fontSize:12,cursor:"pointer"}}>Decline</button>
                  </div>
                )}
                {n.type==="friend_req"&&n.accepted&&(
                  <div style={{marginTop:8,fontSize:12,color:C.sage,fontWeight:700}}>✓ Following {n.name}</div>
                )}

                {/* Challenge action */}
                {n.type==="challenge"&&(
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button onClick={e=>{e.stopPropagation();markRead(n.id);setTab("challenges");}} className="tap" style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:C.plum,color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}}>View Challenge ⚔️</button>
                  </div>
                )}
              </div>

              {/* Unread dot */}
              {!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:C.flame,flexShrink:0,marginTop:6}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ═══ INSTAGRAM SHARE CARD ════════════════════════════════════════════════ */
function InstagramShareSheet({post, onClose}){
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);

  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1080;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#3B2A1A');
    grad.addColorStop(1, '#5C3A20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // If post has photo, draw it
    const draw = (imgEl) => {
      if(imgEl){
        // Draw photo in top portion
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(60, 60, 960, 640, 24);
        ctx.clip();
        ctx.drawImage(imgEl, 60, 60, 960, 640);
        ctx.restore();
        // Dark overlay on photo
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.roundRect(60, 60, 960, 640, 24);
        ctx.fill();
      } else {
        // Emoji placeholder
        ctx.font = '180px serif';
        ctx.textAlign = 'center';
        ctx.fillText(post.emoji || '🍳', 540, 480);
      }

      // Recipe name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 72px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(post.recipe, 540, imgEl ? 820 : 680);

      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, imgEl ? 860 : 720);
      ctx.lineTo(960, imgEl ? 860 : 720);
      ctx.stroke();

      // App branding
      ctx.fillStyle = '#FF4D1C';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('mise.en.place', 540, imgEl ? 940 : 800);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '32px Georgia, serif';
      ctx.fillText('your daily cooking habit', 540, imgEl ? 995 : 860);

      setGenerated(true);
    };

    if(post.photo){
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = post.photo;
    } else {
      draw(null);
    }
  }, [post]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `mise-en-place-${post.recipe.replace(/\s+/g,'-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>📸 Share Your Dish</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Save to camera roll and post to Instagram</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{borderRadius:16,overflow:"hidden",marginBottom:16,background:C.dark}}>
          <canvas ref={canvasRef} style={{width:"100%",height:"auto",display:"block"}}/>
        </div>

        {!generated&&<div style={{textAlign:"center",padding:"20px",fontSize:14,color:C.muted}}>Generating your share card…</div>}

        {generated&&(
          <>
            <Btn onClick={handleSave} full style={{marginBottom:10}}>⬇️ Save to Camera Roll</Btn>
            <div style={{fontSize:12,color:C.muted,textAlign:"center",lineHeight:1.6}}>
              Save the image then open Instagram → New Story → select the image. Tag us @misenplace for a chance to be featured! 🍳
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ═══ QUICK LOG ════════════════════════════════════════════════════════════ */
function QuickLogSheet({onLog, onClose, goal, cookedDays}){
  const [note, setNote] = useState("");
  const weekDone = cookedDays.filter(Boolean).length;

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>⚡ Quick Log</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Cooked something not in the library? Log it here.</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"18px 20px",marginBottom:18,color:"#fff"}}>
          <div style={{fontSize:11,opacity:.6,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>This Week</div>
          <div style={{fontSize:36,fontWeight:900,fontFamily:DF}}>{weekDone}/{goal.target} {goal.icon}</div>
          <div style={{fontSize:13,opacity:.7,marginTop:4}}>
            {weekDone>=goal.target?"🎉 Goal achieved!":
            `${goal.target-weekDone} more to hit your ${goal.label} goal`}
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em"}}>What did you cook? (optional)</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Made pasta from scratch, improvised a stir fry…" style={{width:"100%",minHeight:80,borderRadius:14,border:`2px solid ${note?C.ember:C.border}`,background:C.cream,padding:"12px 14px",fontSize:14,color:C.bark,resize:"none",outline:"none",lineHeight:1.5,boxSizing:"border-box",transition:"border-color .18s"}}/>
        </div>

        <div style={{background:`${C.sky}0E`,border:`1.5px solid ${C.sky}28`,borderRadius:12,padding:"10px 14px",marginBottom:16}}>
          <div style={{fontSize:12,color:C.sky,fontWeight:600}}>Quick log counts toward your streak and earns 30 🔥 Heat. Use it on busy days when you cook something simple.</div>
        </div>

        <Btn onClick={()=>onLog(note)} full>Log Today's Cook ⚡</Btn>
      </div>
    </Sheet>
  );
}

/* ═══ COOK TOGETHER SHEET ══════════════════════════════════════════════════ */
function CookTogetherSheet({recipe, onClose}){
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [friendStep, setFriendStep] = useState(0);
  const nSteps = (recipe?.steps||[]).length;
  const friends = ["Sofia R.","Jake M.","Priya K.","Marcus T."];
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Simulate friend progress
  useEffect(()=>{
    if(!started) return;
    const t = setInterval(()=>{
      setFriendStep(s=>Math.min(nSteps-1, s + (Math.random()>0.7?1:0)));
    }, 8000);
    return ()=>clearInterval(t);
  },[started]);

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>👨‍🍳 Cook Together</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Cook the same dish simultaneously with a friend</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        {!started?(
          <>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"16px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"center",color:"#fff"}}>
              <span style={{fontSize:36}}>{recipe?.emoji||"🍳"}</span>
              <div>
                <div style={{fontWeight:900,fontSize:16}}>{recipe?.name||"Select a recipe"}</div>
                <div style={{fontSize:12,opacity:.6,marginTop:2}}>{(recipe?.steps||[]).length} steps · {recipe?.time}</div>
              </div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:C.bark,marginBottom:10}}>Invite a friend to cook with you:</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {friends.map(f=>(
                <button key={f} onClick={()=>setSelectedFriend(f)} className="tap" style={{display:"flex",alignItems:"center",gap:12,background:selectedFriend===f?`${C.sage}14`:C.cream,border:`2px solid ${selectedFriend===f?C.sage:C.border}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:`${C.sage}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👤</div>
                  <div style={{flex:1,fontWeight:700,fontSize:14,color:C.bark}}>{f}</div>
                  {selectedFriend===f&&<div style={{color:C.sage,fontWeight:800}}>✓</div>}
                </button>
              ))}
            </div>
            <Btn onClick={()=>selectedFriend&&setStarted(true)} disabled={!selectedFriend} full color={C.sage}>
              Send Invite & Start Cooking 🍳
            </Btn>
          </>
        ):(
          <>
            <div style={{background:`${C.sage}12`,border:`2px solid ${C.sage}33`,borderRadius:16,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:13,color:C.sage,marginBottom:8}}>👥 Cooking with {selectedFriend}</div>
              <div style={{display:"flex",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4}}>You</div>
                  <XPBar pct={Math.round(step/Math.max(nSteps-1,1)*100)} color={C.flame} h={8}/>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>Step {step+1} of {nSteps}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{selectedFriend}</div>
                  <XPBar pct={Math.round(friendStep/Math.max(nSteps-1,1)*100)} color={C.sky} h={8}/>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>Step {friendStep+1} of {nSteps}</div>
                </div>
              </div>
            </div>
            <div style={{background:C.cream,borderRadius:16,padding:"16px",border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:8,fontFamily:DF}}>Step {step+1}: {recipe?.steps?.[step]?.title}</div>
              <div style={{fontSize:14,color:"#6A5C52",lineHeight:1.6}}>{recipe?.steps?.[step]?.body}</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} style={{flex:1,padding:12,borderRadius:14,border:`2px solid ${C.border}`,background:"transparent",color:step===0?"#CCC":C.bark,fontWeight:800,cursor:step===0?"default":"pointer"}}>← Prev</button>
              {step<nSteps-1
                ?<Btn onClick={()=>setStep(s=>s+1)} style={{flex:2}}>Next Step →</Btn>
                :<Btn onClick={onClose} color={C.sage} style={{flex:2}}>Finish! 🎉</Btn>
              }
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ═══ ADD FRIENDS SHEET ════════════════════════════════════════════════════ */
function AddFriendsSheet({onClose}){
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState([]);
  const SUGGESTED = [
    {name:"Sofia R.",  avatar:"👩‍🍳", level:"Head Chef",     mutual:3},
    {name:"Jake M.",   avatar:"🧑‍🍳", level:"Sous Chef",     mutual:1},
    {name:"Priya K.",  avatar:"👩‍🦱", level:"Demi Chef",     mutual:2},
    {name:"Marcus T.", avatar:"🧔",   level:"Line Cook",     mutual:0},
    {name:"Yuki A.",   avatar:"👩",   level:"Home Cook",     mutual:1},
    {name:"Liam B.",   avatar:"👨",   level:"Prep Hand",     mutual:0},
  ];
  const filtered = SUGGESTED.filter(f=>
    !query || f.name.toLowerCase().includes(query.toLowerCase())
  );
  const sendRequest = (name) => setSent(s=>[...s, name]);

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>👥 Add Friends</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Find people to cook with and compete against</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{position:"relative",marginBottom:16}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none"}}>🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or username…" style={{width:"100%",padding:"11px 14px 11px 42px",borderRadius:14,border:`2px solid ${query?C.ember:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box",transition:"border-color .18s"}}/>
        </div>

        <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:".08em"}}>
          {query?"Search results":"Suggested friends"}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((f,i)=>{
            const isSent = sent.includes(f.name);
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.cream,borderRadius:16,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                <div style={{width:44,height:44,borderRadius:14,background:`${C.ember}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{f.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{f.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>{f.level}{f.mutual>0?` · ${f.mutual} mutual friend${f.mutual>1?"s":""}`:""}</div>
                </div>
                <button onClick={()=>!isSent&&sendRequest(f.name)} className="tap" style={{padding:"8px 14px",borderRadius:10,border:`2px solid ${isSent?C.sage:C.flame}`,background:isSent?`${C.sage}14`:`${C.flame}14`,color:isSent?C.sage:C.flame,fontWeight:800,fontSize:12,cursor:isSent?"default":"pointer",transition:"all .2s",flexShrink:0}}>
                  {isSent?"✓ Sent":"+ Add"}
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"32px 20px",color:C.muted}}>
            <div style={{fontSize:36,marginBottom:8}}>🔍</div>
            <div style={{fontWeight:700}}>No one found</div>
            <div style={{fontSize:13,marginTop:4}}>Try a different name</div>
          </div>
        )}

        <div style={{marginTop:20,background:`${C.sky}0E`,border:`1.5px solid ${C.sky}28`,borderRadius:14,padding:"12px 14px"}}>
          <div style={{fontSize:12,color:C.sky,fontWeight:700}}>💡 Invite friends via link</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>Share your app link so friends can sign up and find you automatically.</div>
        </div>
      </div>
    </Sheet>
  );
}

/* ═══ STREAK CALENDAR ══════════════════════════════════════════════════════ */
function StreakCalendar({cookedDays, onClose}){
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const getDaysInMonth = (m,y) => new Date(y,m+1,0).getDate();
  const getFirstDay = (m,y) => new Date(y,m,1).getDay();

  // Generate mock past streak data (in real app this comes from DB)
  const getCookedDates = () => {
    const dates = new Set();
    // Add current week
    cookedDays.forEach((cooked, i) => {
      if(cooked){
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day===0?-6:1) + i;
        const date = new Date(d.setDate(diff));
        dates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      }
    });
    // Add some mock past dates for demo
    for(let i=1;i<45;i++){
      if(Math.random()>0.4){
        const d = new Date();
        d.setDate(d.getDate()-i);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    }
    return dates;
  };
  const cookedSet = getCookedDates();

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay = (getFirstDay(viewMonth, viewYear)+6)%7; // Mon=0
  const monthName = new Date(viewYear, viewMonth).toLocaleString('default',{month:'long',year:'numeric'});
  const totalCooked = Array.from(cookedSet).filter(d=>d.startsWith(`${viewYear}-${viewMonth}-`)).length;

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>📅 Cooking History</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Every day you cooked, tracked</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={()=>{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);}} className="tap" style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:C.bark,textAlign:"center"}}>{monthName}</div>
            <div style={{fontSize:11,color:C.flame,fontWeight:700,textAlign:"center"}}>{totalCooked} days cooked</div>
          </div>
          <button onClick={()=>{if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);}} className="tap" style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>→</button>
        </div>

        {/* Day labels */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
          {["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.muted,padding:"4px 0"}}>{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`empty-${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day = i+1;
            const key = `${viewYear}-${viewMonth}-${day}`;
            const isCooked = cookedSet.has(key);
            const isToday = day===today.getDate()&&viewMonth===today.getMonth()&&viewYear===today.getFullYear();
            return(
              <div key={day} style={{
                aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",
                borderRadius:8,
                background:isCooked?C.flame:isToday?`${C.flame}18`:"#F0EBE6",
                border:isToday?`2px solid ${C.flame}`:"none",
                color:isCooked?"#fff":isToday?C.flame:C.muted,
                fontWeight:isCooked||isToday?800:400,
                fontSize:12,
              }}>
                {isCooked?"🔥":day}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{display:"flex",gap:16,marginTop:16,justifyContent:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:4,background:C.flame}}/><span style={{fontSize:11,color:C.muted}}>Cooked</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:4,background:"#F0EBE6"}}/><span style={{fontSize:11,color:C.muted}}>No cook</span></div>
        </div>
      </div>
    </Sheet>
  );
}

/* ═══ WEEKLY RECAP CARD ════════════════════════════════════════════════════ */
function WeeklyRecapSheet({cookedDays, xp, weeklyXp, levelInfo, posts, earnedBadges, onClose}){
  const weekDone = cookedDays.filter(Boolean).length;
  const newBadges = earnedBadges.slice(-2);
  const recentPost = posts.find(p=>p.user.name==="You");

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>📊 Weekly Recap</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Your cooking week at a glance</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"24px",marginBottom:14,color:"#fff"}}>
          <div style={{fontSize:11,opacity:.6,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>This Week</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
            {[["🍳",weekDone,"Days cooked"],["🔥",weeklyXp,"Heat earned"],["📈",levelInfo.current.level,levelInfo.current.title]].map(([icon,val,label])=>(
              <div key={label} style={{textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:4}}>{icon}</div>
                <div style={{fontSize:28,fontWeight:900,fontFamily:DF}}>{val}</div>
                <div style={{fontSize:10,opacity:.6,marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Mini streak calendar */}
          <div style={{display:"flex",gap:4}}>
            {["M","T","W","T","F","S","S"].map((d,i)=>(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{height:28,borderRadius:7,background:cookedDays[i]?"#FF4D1C":"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,marginBottom:3}}>{cookedDays[i]?"🔥":""}</div>
                <div style={{fontSize:8,opacity:.4}}>{d}</div>
              </div>
            ))}
          </div>

          <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.12)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:22}}>{levelInfo.current.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,opacity:.6}}>Rank progress</div>
              <div style={{fontWeight:700,fontSize:13}}>{levelInfo.current.title}</div>
            </div>
            {levelInfo.next&&<div style={{fontSize:11,opacity:.6}}>→ {levelInfo.next.title}</div>}
          </div>
        </div>

        {newBadges.length>0&&(
          <div style={{background:`${C.gold}14`,border:`1.5px solid ${C.gold}44`,borderRadius:16,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:12,color:C.bark,marginBottom:8}}>🏅 Badges earned this week</div>
            <div style={{display:"flex",gap:10}}>
              {newBadges.map(id=>{
                const b = BADGES.find(b=>b.id===id);
                return b?<div key={id} style={{display:"flex",alignItems:"center",gap:8,background:C.cream,borderRadius:10,padding:"8px 12px"}}><span style={{fontSize:22}}>{b.emoji}</span><span style={{fontSize:12,fontWeight:700,color:C.bark}}>{b.label}</span></div>:null;
              })}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <Btn onClick={onClose} outline color={C.muted} style={{flex:1}}>Close</Btn>
          <Btn onClick={onClose} color={C.sage} style={{flex:2}}>Keep Cooking 🍳</Btn>
        </div>
      </div>
    </Sheet>
  );
}

/* ═══ SIGNATURE DISH SHEET ════════════════════════════════════════════════ */
function SignatureDishSheet({allRecipes, signatureDish, onSelect, onClose}){
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🍳 Signature Dish</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Your defining dish — shown on your profile</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        {signatureDish&&(
          <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:16,padding:"16px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"center",color:"#fff"}}>
            <span style={{fontSize:40}}>{signatureDish.emoji}</span>
            <div>
              <div style={{fontSize:11,opacity:.6,marginBottom:2}}>Current signature</div>
              <div style={{fontWeight:900,fontSize:16,fontFamily:DF}}>{signatureDish.name}</div>
            </div>
          </div>
        )}

        <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Choose from recipes you've cooked:</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {allRecipes.filter(r=>r.done).map(r=>(
            <button key={r.id} onClick={()=>{onSelect(r);onClose();}} className="tap" style={{display:"flex",alignItems:"center",gap:12,background:signatureDish?.id===r.id?`${C.flame}12`:C.cream,border:`2px solid ${signatureDish?.id===r.id?C.flame:C.border}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
              <span style={{fontSize:28}}>{r.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{r.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{r.category} · {r.difficulty}</div>
              </div>
              {signatureDish?.id===r.id&&<span style={{color:C.flame,fontWeight:900}}>✓</span>}
            </button>
          ))}
          {allRecipes.filter(r=>r.done).length===0&&(
            <div style={{textAlign:"center",padding:"32px 20px",color:C.muted}}>
              <div style={{fontSize:36,marginBottom:8}}>🍳</div>
              <div style={{fontWeight:700}}>Cook a recipe first</div>
              <div style={{fontSize:13,marginTop:4}}>Complete your first dish to set a signature</div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/* ═══ ROOT APP ════════════════════════════════════════════════════════════ */
export default function App(){
  const [onboarded,  setOnboarded]  = useState(false);
  const [tab,        setTab]        = useState("home");
  const [mounted,    setMounted]    = useState(false);
  const [xp,         setXp]         = useState(0);
  const [weeklyXp,   setWeeklyXp]   = useState(130);
  const [allRecipes, setAllRecipes] = useState(RECIPES);
  const [detailRecipe,setDetailRecipe]=useState(null);
  const [showGoal,   setShowGoal]   = useState(false);
  const [posts,      setPosts]      = useState(SEED_POSTS);
  const [goal,       setGoal]       = useState(STREAK_GOALS[2]);
  const [cookedDays, setCookedDays] = useState([false,false,false,false,false,false,false]);
  const [skillData,  setSkillData]  = useState({});
  const [challengeProgress,setChallengeProgress]=useState({});
  const [earnedBadges,setEarnedBadges]=useState([]);
  const [toast,      setToast]      = useState(null); // {emoji,title,subtitle}
  const [cookLog,      setCookLog]      = useState([]); // Goodreads-style library
  const [showCreate,   setShowCreate]   = useState(false);
  const [showImport,   setShowImport]   = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showAddFriends,setShowAddFriends]=useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecap,    setShowRecap]    = useState(false);
  const [showSignature,setShowSignature]= useState(false);
  const [showInstaShare,setShowInstaShare]=useState(null); // post object
  const [showCookTogether,setShowCookTogether]=useState(null); // recipe object
  const [signatureDish,setSignatureDish]=useState(null);
  const [seasonalEvent] = useState({
    name:"Basics Month 🌱",
    desc:"Master 3 foundational techniques this month",
    ends:"Apr 30",
    goal:3,
    progress:0,
    color:"#5C7A4E",
    badge:{emoji:"🌟",label:"Foundations Master"},
  });
  const [notifications,setNotifications] = useState([
    {id:"n1", type:"mwah",      read:false, avatar:"👩‍🍳", name:"Sofia R.",   text:"gave you 🤌 Mwah on your Shakshuka",         time:"2m ago",  emoji:"🍳"},
    {id:"n2", type:"friend_req",read:false, avatar:"🧑‍🍳", name:"Jake M.",    text:"sent you a friend request",                   time:"15m ago", emoji:null},
    {id:"n3", type:"comment",   read:false, avatar:"👩‍🦱", name:"Priya K.",   text:"commented on your Avocado Toast: \"Looks incredible!\"",time:"1h ago",emoji:"🥑"},
    {id:"n4", type:"challenge", read:false, avatar:"🧔",   name:"Marcus T.",  text:"challenged you to the 10 Meal Explorer",      time:"2h ago",  emoji:"🗺️"},
    {id:"n5", type:"mwah",      read:true,  avatar:"👩",   name:"Yuki A.",    text:"gave you 🤌 Mwah on your Overnight Oats",     time:"3h ago",  emoji:"🥣"},
    {id:"n6", type:"streak",    read:true,  avatar:"🔥",   name:"mise.en.place", text:"You're on a 4-day streak. Keep it going!", time:"5h ago",  emoji:null},
    {id:"n7", type:"level",     read:true,  avatar:"⭐",   name:"mise.en.place", text:"You reached Prep Cook! You've earned 500 🔥 Heat",time:"1d ago",emoji:null},
    {id:"n8", type:"friend_req",read:true,  avatar:"👨",   name:"Liam B.",    text:"sent you a friend request",                   time:"1d ago",  emoji:null},
    {id:"n9", type:"comment",   read:true,  avatar:"🧔",   name:"Marcus T.",  text:"commented on your French Omelette: \"Chef level!\"",time:"2d ago",emoji:"🥚"},
    {id:"n10",type:"mwah",      read:true,  avatar:"👩‍🍳", name:"Sofia R.",   text:"gave you 🤌 Mwah on your Shakshuka",         time:"2d ago",  emoji:"🍳"},
  ]);
  const prevLevel = useRef(null);

  useEffect(()=>{setTimeout(()=>setMounted(true),60);},[]);

  const levelInfo=useMemo(()=>getLevelInfo(xp),[xp]);

  // Detect level up
  useEffect(()=>{
    if(prevLevel.current!==null&&levelInfo.current.level>prevLevel.current){
      setToast({emoji:levelInfo.current.icon,title:levelInfo.current.title,subtitle:`Level ${levelInfo.current.level} reached!`});
    }
    prevLevel.current=levelInfo.current.level;
  },[levelInfo]);

  const checkBadges=useCallback((stats)=>{
    const newOnes=BADGES.filter(b=>!earnedBadges.includes(b.id)&&b.check(stats));
    if(newOnes.length>0){
      setEarnedBadges(prev=>[...prev,...newOnes.map(b=>b.id)]);
      setToast(t=>t||{emoji:newOnes[0].emoji,title:newOnes[0].label,subtitle:"Badge unlocked!"});
    }
  },[earnedBadges]);

  const handleComplete=useCallback((recipe,photo,caption,rating)=>{
    setAllRecipes(rs=>rs.map(r=>r.id===recipe.id?{...r,done:true}:r));
    const newXp=xp+recipe.xp;
    setXp(newXp);
    setWeeklyXp(w=>w+recipe.xp);
    const di=new Date().getDay();const idx=di===0?6:di-1;
    setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});

    // Update skills
    const cat=recipe.category;
    let newSkill=skillData;
    if(cat&&SKILL_MAP[cat]){
      const cnt=(skillData[`${cat}_count`]||0)+1;
      newSkill={...skillData,[cat]:calcSkillLevel(cnt),[`${cat}_count`]:cnt};
      setSkillData(newSkill);
    }

    // Update challenges
    const newCP={...challengeProgress};
    CHALLENGES.forEach(ch=>{
      const curr=newCP[ch.id]||0;
      if(curr>=ch.target)return;
      if(ch.category&&recipe.category!==ch.category)return;
      newCP[ch.id]=curr+1;
    });
    setChallengeProgress(newCP);

    // Add to cook library
    const today=new Date();
    const dateStr=today.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
    setCookLog(log=>[{
      id:`log-${Date.now()}`,
      name:recipe.name,
      emoji:recipe.emoji,
      category:recipe.category,
      xp:recipe.xp,
      difficulty:recipe.difficulty,
      rating,
      photo,
      caption,
      date:dateStr,
    },...log]);

    // Post to feed
    if(photo||caption){
      setPosts(ps=>[{
        id:`p-${Date.now()}`,
        user:{name:"You",avatar:"👩‍🍳",level:levelInfo.current.title},
        recipe:recipe.name,emoji:recipe.emoji,photo,
        caption:caption||`Just cooked ${recipe.name}! 🎉`,
        time:"just now",mwah:0,myMwah:false,comments:[],
      },...ps]);
    }

    // Check badges
    const totalCooked=allRecipes.filter(r=>r.done).length+1;
    const cats=Object.keys(SKILL_MAP).reduce((acc,c)=>{acc[c]=(newSkill[`${c}_count`]||0);return acc;},{});
    const uniqueCuisines=Object.values(cats).filter(v=>v>0).length;
    const streak=cookedDays.filter(Boolean).length+1;
    const doneChalls=Object.keys(newCP).filter(id=>(newCP[id]||0)>=(CHALLENGES.find(c=>c.id===id)?.target||99));
    checkBadges({total:totalCooked,streak,cuisines:uniqueCuisines,cats,challs:doneChalls,level:getLevelInfo(newXp).current.level,mwah:0});
  },[xp,allRecipes,cookedDays,skillData,challengeProgress,levelInfo,checkBadges]);

  const openRecipe=useCallback((recipe)=>setDetailRecipe(allRecipes.find(r=>r.id===recipe.id)||recipe),[allRecipes]);

  const handleQuickLog=useCallback((note)=>{
    const newXp2 = xp + 30;
    setXp(newXp2);
    setWeeklyXp(w=>w+30);
    const di=new Date().getDay();const idx=di===0?6:di-1;
    setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});
    const today=new Date();
    const dateStr=today.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
    setCookLog(log=>[{
      id:`log-${Date.now()}`,name:note||"Quick Cook",emoji:"⚡",
      category:null,xp:30,difficulty:"Easy",rating:0,photo:null,
      caption:note||"",date:dateStr,
    },...log]);
    setShowQuickLog(false);
    setToast({emoji:"⚡",title:"Logged!",subtitle:"30 🔥 Heat earned"});
  },[xp]);

  const TABS=[
    {id:"home",       label:"Today",      emoji:"🍳"},
    {id:"recipes",    label:"Recipes",    emoji:"📖"},
    {id:"challenges", label:"Challenges", emoji:"🏃"},
    {id:"feed",       label:"Feed",       emoji:"👥"},
    {id:"library",    label:"Library",    emoji:"📚"},
  ];

  const weekDone=cookedDays.filter(Boolean).length;

  if(!onboarded)return(
    <>
      <style>{CSS}</style>
      <Onboarding onComplete={({goal:g})=>{setGoal(g);setOnboarded(true);}}/>
    </>
  );

  if(detailRecipe){
    const live=allRecipes.find(r=>r.id===detailRecipe.id)||detailRecipe;
    return(
      <>
        <style>{CSS}</style>
        <div style={{maxWidth:420,margin:"0 auto"}}>
          <RecipeDetail recipe={live} onBack={()=>setDetailRecipe(null)} onComplete={(r,p,c,rating)=>{handleComplete(r,p,c,rating);setDetailRecipe(null);}}/>
        </div>
      </>
    );
  }

  return(
    <>
      <style>{CSS}</style>
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto",opacity:mounted?1:0,transform:mounted?"none":"translateY(10px)",transition:"all .35s cubic-bezier(.4,0,.2,1)"}}>
        {/* Header — no AI button */}
        <div style={{background:C.paper,padding:"15px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"fixed",top:0,left:0,right:0,maxWidth:420,margin:"0 auto",zIndex:50,borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontWeight:900,fontSize:22,color:C.bark,letterSpacing:"-.03em",fontFamily:DF}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
            <div style={{fontSize:11,color:C.muted,marginTop:-1}}>your daily cooking habit</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setTab("notifications")} className="tap" style={{position:"relative",background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
              <span style={{fontSize:17}}>🔔</span>
              {notifications.filter(n=>!n.read).length>0&&<div style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:C.flame,color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{notifications.filter(n=>!n.read).length}</div>}
            </button>
            <div style={{background:`${levelInfo.current.color}18`,border:`1.5px solid ${levelInfo.current.color}44`,borderRadius:10,padding:"5px 10px",fontSize:12,fontWeight:800,color:levelInfo.current.color}}>
              {levelInfo.current.icon} Lv.{levelInfo.current.level}
            </div>
            <div onClick={()=>setShowGoal(true)} className="tap" style={{background:`linear-gradient(135deg,${goal.color},${goal.color}BB)`,borderRadius:12,padding:"6px 12px",color:"#fff",fontWeight:800,fontSize:13,boxShadow:`0 4px 12px ${goal.color}44`,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"}}>
              {goal.icon} {weekDone}/{goal.target}
            </div>
          </div>
        </div>

        <div style={{minHeight:"calc(100vh - 118px)",paddingTop:84,paddingBottom:80}}>
          {tab==="home"&&<HomeTab xp={xp} setXp={setXp} recipes={allRecipes} onOpen={openRecipe} onComplete={handleComplete} goal={goal} cookedDays={cookedDays} setCookedDays={setCookedDays} onEditGoal={()=>setShowGoal(true)} challengeProgress={challengeProgress} levelInfo={levelInfo} onQuickLog={()=>setShowQuickLog(true)} onShowRecap={()=>setShowRecap(true)} onShowCalendar={()=>setShowCalendar(true)} seasonalEvent={seasonalEvent} signatureDish={signatureDish}/>}
          {tab==="recipes"&&<RecipesTab allRecipes={allRecipes} onOpen={openRecipe} onShowCreate={()=>setShowCreate(true)} onShowImport={()=>setShowImport(true)}/>}
          {tab==="challenges"&&<ChallengesTab challengeProgress={challengeProgress} onInvite={(name,ch)=>alert(`Challenge sent to ${name}! 💪`)}/>}
          {tab==="feed"&&<FeedTab posts={posts} setPosts={setPosts} xp={xp} weeklyXp={weeklyXp} levelInfo={levelInfo} onAddFriends={()=>setShowAddFriends(true)} onShareInsta={(post)=>setShowInstaShare(post)}/>}
          {tab==="library"&&<CookLibrary cookLog={cookLog} allRecipes={allRecipes} earnedBadges={earnedBadges} onShowCalendar={()=>setShowCalendar(true)} onShowSignature={()=>setShowSignature(true)}/>}
          {tab==="notifications"&&<NotificationsTab notifications={notifications} setNotifications={setNotifications} setTab={setTab}/>}
        </div>

        <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:420,margin:"0 auto",background:C.cream,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 12px",zIndex:50}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0",transform:tab===t.id?"scale(1.08)":"scale(1)",transition:"transform .18s"}}>
              <div style={{fontSize:19}}>{t.emoji}</div>
              <div style={{fontSize:9,fontWeight:800,letterSpacing:".06em",textTransform:"uppercase",color:tab===t.id?C.flame:"#B0A09A",transition:"color .18s"}}>{t.label}</div>
              {tab===t.id&&<div style={{width:16,height:3,borderRadius:99,background:C.flame,marginTop:1}}/>}
            </button>
          ))}
        </div>
      </div>

      {showGoal&&<GoalPicker goal={goal} onSelect={g=>{setGoal(g);setShowGoal(false);}} onClose={()=>setShowGoal(false)}/>}
      {showCreate&&<CreateRecipeSheet onSave={r=>{setAllRecipes(rs=>[r,...rs]);}} onClose={()=>setShowCreate(false)}/>}
      {showImport&&<URLImportSheet onSave={r=>{setAllRecipes(rs=>[r,...rs]);}} onClose={()=>setShowImport(false)}/>}
      {showQuickLog&&<QuickLogSheet onLog={handleQuickLog} onClose={()=>setShowQuickLog(false)} goal={goal} cookedDays={cookedDays}/>}
      {showAddFriends&&<AddFriendsSheet onClose={()=>setShowAddFriends(false)}/>}
      {showCalendar&&<StreakCalendar cookedDays={cookedDays} onClose={()=>setShowCalendar(false)}/>}
      {showRecap&&<WeeklyRecapSheet cookedDays={cookedDays} xp={xp} weeklyXp={weeklyXp} levelInfo={levelInfo} posts={posts} earnedBadges={earnedBadges} onClose={()=>setShowRecap(false)}/>}
      {showSignature&&<SignatureDishSheet allRecipes={allRecipes} signatureDish={signatureDish} onSelect={setSignatureDish} onClose={()=>setShowSignature(false)}/>}
      {showInstaShare&&<InstagramShareSheet post={showInstaShare} onClose={()=>setShowInstaShare(null)}/>}
      {showCookTogether&&<CookTogetherSheet recipe={showCookTogether} onClose={()=>setShowCookTogether(null)}/>}
    </>
  );
}