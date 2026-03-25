'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════ */
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
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;background:${C.paper};font-family:${BF}}
  ::-webkit-scrollbar{display:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes pop{0%,100%{transform:scale(1)}45%{transform:scale(1.42)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
  @keyframes levelUp{0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.15) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
  @keyframes xpFill{from{width:0}to{width:var(--w)}}
  @keyframes streakBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
  .ch:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(0,0,0,.11)!important}
  .tap:active{transform:scale(.94)!important}
  input,textarea,button{font-family:inherit}
`;

/* ═══════════════════════════════════════════════════════════
   XP & LEVEL SYSTEM
═══════════════════════════════════════════════════════════ */
const LEVELS = [
  { level:1,  title:"Novice",          icon:"🌱", minXp:0,    color:"#8BAF78" },
  { level:2,  title:"Home Cook",       icon:"🍳", minXp:200,  color:"#FF8C42" },
  { level:3,  title:"Prep Cook",       icon:"🔪", minXp:500,  color:"#4A90D9" },
  { level:4,  title:"Line Cook",       icon:"🍲", minXp:1000, color:"#9B5DE5" },
  { level:5,  title:"Sous Chef",       icon:"👨‍🍳", minXp:2000, color:"#E05C7A" },
  { level:6,  title:"Chef de Partie",  icon:"⭐", minXp:3500, color:"#F5C842" },
  { level:7,  title:"Sous Chef Pro",   icon:"🏆", minXp:5500, color:"#FF4D1C" },
  { level:8,  title:"Head Chef",       icon:"👑", minXp:8000, color:"#3B2A1A" },
];

function getLevelInfo(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.minXp) current = l; else break; }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] || null;
  const xpIntoLevel = next ? xp - current.minXp : 0;
  const xpForLevel  = next ? next.minXp - current.minXp : 1;
  const pct = next ? Math.round(xpIntoLevel / xpForLevel * 100) : 100;
  return { current, next, xpIntoLevel, xpForLevel, pct };
}

/* ═══════════════════════════════════════════════════════════
   LEAGUES (Duolingo-style)
═══════════════════════════════════════════════════════════ */
const LEAGUES = [
  { id:"bronze",   name:"Bronze League",   icon:"🥉", color:"#CD7F32", bg:"#FDF0E8", minRank:21 },
  { id:"silver",   name:"Silver League",   icon:"🥈", color:"#A8A9AD", bg:"#F5F5F5", minRank:11 },
  { id:"gold",     name:"Gold League",     icon:"🥇", color:"#F5C842", bg:"#FFFBE6", minRank:6  },
  { id:"diamond",  name:"Diamond League",  icon:"💎", color:"#4A90D9", bg:"#EEF5FF", minRank:1  },
];

function getLeague(weeklyRank) {
  for (const l of LEAGUES) { if (weeklyRank >= l.minRank) return LEAGUES[0]; }
  if (weeklyRank <= 5) return LEAGUES[3];
  if (weeklyRank <= 10) return LEAGUES[2];
  if (weeklyRank <= 20) return LEAGUES[1];
  return LEAGUES[0];
}

/* ═══════════════════════════════════════════════════════════
   SKILL SYSTEM
═══════════════════════════════════════════════════════════ */
const SKILL_MAP = {
  Asian:         { label:"Asian Cooking",    icon:"🥢", color:C.flame  },
  Indian:        { label:"Indian Cooking",   icon:"🫙", color:C.ember  },
  Japanese:      { label:"Japanese Cooking", icon:"🍱", color:C.rose   },
  Italian:       { label:"Italian Cooking",  icon:"🍝", color:C.sage   },
  Mexican:       { label:"Mexican Cooking",  icon:"🌮", color:C.gold   },
  Mediterranean: { label:"Mediterranean",    icon:"🫒", color:"#00A896"},
  Comfort:       { label:"Comfort Food",     icon:"🍲", color:C.plum   },
  Healthy:       { label:"Healthy Cooking",  icon:"🥗", color:C.moss   },
  Breakfast:     { label:"Breakfast Skills", icon:"🍳", color:C.ember  },
  Baking:        { label:"Baking & Pastry",  icon:"🍞", color:C.gold   },
  Quick:         { label:"Speed Cooking",    icon:"⚡", color:C.sky    },
};

function calcSkillLevel(count) { return Math.min(5, Math.floor(count / 2)); }

/* ═══════════════════════════════════════════════════════════
   BADGE RULES
═══════════════════════════════════════════════════════════ */
const BADGE_RULES = [
  { id:"first_cook",    emoji:"🍳", label:"First Cook",       desc:"Complete your very first recipe",               check:s=>s.totalCooked>=1    },
  { id:"five_cooked",   emoji:"🖐️", label:"High Five",        desc:"Complete 5 recipes",                            check:s=>s.totalCooked>=5    },
  { id:"ten_cooked",    emoji:"🔟",  label:"Ten Down",         desc:"Complete 10 recipes",                           check:s=>s.totalCooked>=10   },
  { id:"streak_3",      emoji:"🔥",  label:"On Fire",          desc:"Cook 3 days in a row",                          check:s=>s.currentStreak>=3  },
  { id:"streak_7",      emoji:"💥",  label:"Week Warrior",     desc:"Cook 7 days in a row",                          check:s=>s.currentStreak>=7  },
  { id:"world_tour",    emoji:"🌍",  label:"World Tour",       desc:"Cook from 5 different cuisines",                check:s=>s.uniqueCuisines>=5 },
  { id:"asian_3",       emoji:"🥢",  label:"Asian Apprentice", desc:"Cook 3 Asian dishes",                           check:s=>(s.catCounts.Asian||0)>=3    },
  { id:"italian_3",     emoji:"🍝",  label:"Pasta Pro",        desc:"Cook 3 Italian dishes",                         check:s=>(s.catCounts.Italian||0)>=3  },
  { id:"breakfast_5",   emoji:"🌅",  label:"Early Bird",       desc:"Cook 5 breakfast dishes",                       check:s=>(s.catCounts.Breakfast||0)>=5},
  { id:"sprint_done",   emoji:"🏃",  label:"Sprinter",         desc:"Complete the 5 Dish Sprint challenge",          check:s=>s.doneChalls.includes("sprint_5")     },
  { id:"explorer_done", emoji:"🗺️",  label:"Explorer",         desc:"Complete the 10 Meal Explorer challenge",       check:s=>s.doneChalls.includes("explorer_10")  },
  { id:"marathon_done", emoji:"🏅",  label:"Marathoner",       desc:"Complete the 30 Cook Marathon",                 check:s=>s.doneChalls.includes("marathon_30")  },
  { id:"kudos_10",      emoji:"👏",  label:"Social Star",      desc:"Receive 10 kudos on your posts",                check:s=>s.totalKudosReceived>=10 },
  { id:"level_5",       emoji:"👨‍🍳", label:"Sous Chef",        desc:"Reach Chef Level 5 (Sous Chef)",                check:s=>s.level>=5           },
];

/* ═══════════════════════════════════════════════════════════
   CHALLENGES (Nike Run Club style)
═══════════════════════════════════════════════════════════ */
const CHALLENGES = [
  {
    id:"sprint_5", name:"5 Dish Sprint", emoji:"🏃", color:"#FF4D1C", darkColor:"#CC3A12",
    difficulty:"Beginner", duration:"1–2 weeks", target:5, unit:"dishes", xpReward:200,
    milestones:[1,3,5],
    tagline:"Your starting line. Cook 5 dishes.",
    description:`The 5 Dish Sprint is where every great cook begins. No pressure, no complexity — just five meals cooked from scratch.

This challenge is designed for anyone who wants to build a consistent cooking habit. Whether you cook all five in a week or spread them over two weeks, the only goal is to finish.

You can cook any recipe from our library, or make something you already know. The point is to build the habit of actually cooking — not ordering, not reheating — cooking.

Many of our users say this first challenge is what changed their relationship with food entirely.`,
    whatYouLearn:["How to read and follow a recipe confidently","Basic mise en place (preparing everything before you start)","How to manage time in the kitchen"],
    tips:["Start with Easy recipes — this is about building habit, not impressing anyone","Cook things you already like eating","Don't aim for perfection. A slightly overdone steak still counts."],
    category:null,
  },
  {
    id:"explorer_10", name:"10 Meal Explorer", emoji:"🗺️", color:"#4A90D9", darkColor:"#2E6DB3",
    difficulty:"Beginner", duration:"2–3 weeks", target:10, unit:"dishes", xpReward:400,
    milestones:[3,6,10],
    tagline:"Branch out. Try 10 different recipes.",
    description:`You've done five. Now do ten — and this time, we want you to try something new.

The 10 Meal Explorer challenge asks you to cook 10 different recipes, but the real goal is to push beyond your comfort zone. Try a cuisine you've never cooked. Attempt a technique you've been avoiding. Cook something that makes you a little nervous.

At 10 meals you'll start to notice real patterns in how food works — how heat behaves, how flavours balance, how timing affects texture. This is where cooking starts to click.`,
    whatYouLearn:["How different cuisines approach the same ingredients differently","Basic sauce and flavour building","How to adapt and improvise when things don't go exactly to plan"],
    tips:["Pick at least one dish from a cuisine you've never cooked before","Cook one dish twice — comparing your first and second attempt is incredibly instructive","Don't skip the chef's tips in each recipe — they're the things no one tells you"],
    category:null,
  },
  {
    id:"weeknight_5", name:"Weeknight Warrior", emoji:"⚡", color:"#9B5DE5", darkColor:"#7A40BF",
    difficulty:"Intermediate", duration:"1 week", target:5, unit:"weeknight meals", xpReward:300,
    milestones:[2,4,5],
    tagline:"Cook Monday to Friday. Five nights straight.",
    description:`Five nights. No takeaways. No excuses.

The Weeknight Warrior is one of the most practically useful challenges on the app. Real life doesn't happen on weekends — it happens on a Tuesday at 7pm when you're tired and there's nothing obvious in the fridge.

This challenge teaches you to cook fast, smart, and consistently under real-world conditions. All five meals must be cooked Monday through Friday, and each one must be a proper dinner — not toast.

Complete this once and you'll wonder why you ever ordered delivery.`,
    whatYouLearn:["How to cook a proper meal in under 30 minutes","Smart ingredient planning so you always have what you need","How to batch prep to make weeknights easier"],
    tips:["Do a Sunday shop for the whole week before you start","Keep a list of 5–10 dishes you can cook quickly without thinking","It's okay to cook the same base protein differently across multiple nights"],
    category:null,
  },
  {
    id:"breakfast_7", name:"Breakfast Club", emoji:"🌅", color:"#F5C842", darkColor:"#C9A020",
    difficulty:"Beginner", duration:"1–2 weeks", target:7, unit:"breakfasts", xpReward:280,
    milestones:[3,5,7],
    tagline:"Master the most important meal. Cook 7 breakfasts.",
    description:`Most people eat the same breakfast every day. This challenge will change that.

Seven breakfasts, seven different recipes. From a perfect French omelette to proper overnight oats to a full shakshuka — you'll discover that breakfast is one of the richest, most varied meals in the world, and also one of the quickest to cook.

The Breakfast Club is a great first challenge for people with a busy morning routine because most breakfast recipes take under 20 minutes.`,
    whatYouLearn:["Egg cookery — the foundation of so much cooking","How to work quickly in the morning under time pressure","Batter consistency for pancakes and crepes"],
    tips:["Prep ingredients the night before if you're time-poor in the mornings","Eggs cook faster than you think — medium heat is your friend","A good non-stick pan is all you need for most breakfast dishes"],
    category:"Breakfast",
  },
  {
    id:"world_tour", name:"World Tour", emoji:"🌍", color:"#00A896", darkColor:"#007A6E",
    difficulty:"Intermediate", duration:"3–5 weeks", target:5, unit:"cuisines", xpReward:500,
    milestones:[2,4,5],
    tagline:"Cook from 5 different countries.",
    description:`Every cuisine in the world has solved the same problems differently — how to use heat, how to balance flavour, how to feed people well with what's available.

The World Tour challenge asks you to cook one dish from each of five different cuisines. You'll come away with a fundamentally broader understanding of how cooking works, and a repertoire that makes every dinner party interesting.

Suggested countries: Japan, India, Mexico, Italy, and one of your own choosing. But any five distinct cuisines count.`,
    whatYouLearn:["How spice, acid, fat, and salt work differently across cuisines","The importance of authentic ingredients and where to find them","How to navigate recipes from unfamiliar culinary traditions"],
    tips:["Source at least one authentic ingredient per cuisine — it makes a huge difference","Watch a YouTube video on the cuisine before you cook — context helps enormously","Don't simplify too much. The challenge is to actually cook the dish, not a westernised approximation."],
    category:null,
  },
  {
    id:"date_night_3", name:"Date Night Series", emoji:"🕯️", color:"#E05C7A", darkColor:"#B33A57",
    difficulty:"Intermediate", duration:"3 weeks", target:3, unit:"impressive meals", xpReward:450,
    milestones:[1,2,3],
    tagline:"Cook 3 genuinely impressive meals.",
    description:`Three meals that will make someone's jaw drop.

The Date Night Series pushes you to cook with intention. Every detail matters: the ingredients you source, the timing, the plating, the care you put into the whole experience. Each of the three meals should be a proper occasion — starter, main, or dessert, cooked for someone else.

This is the challenge that turns cooking from a chore into a skill you're proud of.`,
    whatYouLearn:["How to plate food attractively","How to time multiple components so everything is ready at once","How to shop specifically for quality — when it matters and when it doesn't"],
    tips:["Choose dishes with a visual wow factor as well as a flavour wow factor","Practice the dish once on your own before cooking it for someone else","Read the whole recipe the night before — no surprises mid-cook"],
    category:null,
  },
  {
    id:"half_20", name:"20 Meal Journey", emoji:"🚶", color:"#FF8C42", darkColor:"#CC6A2A",
    difficulty:"Intermediate", duration:"4–6 weeks", target:20, unit:"meals", xpReward:800,
    milestones:[5,10,15,20],
    tagline:"Twenty meals. Real, lasting growth.",
    description:`At 20 meals you will be a noticeably better cook than when you started. We promise.

The 20 Meal Journey is where habits become skills. By the time you reach meal 20 you'll have developed real intuition — you'll taste a dish and know what it needs, you'll read a recipe and already be able to see where it might go wrong, you'll have a growing library of dishes you can cook without thinking.

This is the challenge most of our users say changed how they eat permanently.`,
    whatYouLearn:["Real culinary intuition — tasting and adjusting without a recipe","How to build a personal repertoire of go-to dishes","The relationship between technique and flavour"],
    tips:["Keep a simple cooking journal — even just rating each dish out of 10 and writing one line about what you'd change","Repeat your favourites. Getting a dish to 9/10 is a skill in itself.","Try to cook with a friend for at least a few of the meals — you'll learn faster"],
    category:null,
  },
  {
    id:"marathon_30", name:"30 Cook Marathon", emoji:"🏅", color:"#3B2A1A", darkColor:"#1A1008",
    difficulty:"Advanced", duration:"5–8 weeks", target:30, unit:"meals", xpReward:1500,
    milestones:[5,10,20,30],
    tagline:"The full marathon. Thirty meals. One defining month.",
    description:`This is the one that changes everything.

Thirty meals. You will cook almost every day. You will have evenings where you don't feel like it and you'll cook anyway. You'll mess something up badly at least twice. You'll make at least one dish that's genuinely better than you can get in a restaurant.

By meal 30 you will think about food differently. You'll understand it from the inside — how flavours interact, how technique creates texture, why some dishes are greater than the sum of their parts.

The 30 Cook Marathon is the highest challenge on this app. Very few people complete it. It requires real commitment. But there is no other single thing you can do that will improve your cooking more.`,
    whatYouLearn:["Deep culinary intuition that only comes from repetition","How to manage a week of cooking without waste","At least three dishes you can cook entirely from memory at a level that impresses anyone"],
    tips:["Block out Sunday evening each week to plan your week's cooking","Accept that some meals will be failures. It's part of the process.","Tell someone you're doing this. Accountability is real.","Don't skip weeks — momentum is everything in this challenge.","Treat it like training for a race. Consistency over perfection."],
    category:null,
  },
];

/* ═══════════════════════════════════════════════════════════
   RECIPES — Real, detailed, dietary-accurate
═══════════════════════════════════════════════════════════ */
const mk=(cal,pro,carb,fat,fib=2)=>({calories:cal,protein:pro,carbs:carb,fat,fiber:fib});

// Dietary tags: only applied if the recipe genuinely meets the requirement
const RECIPES = [
  /* ── BREAKFAST ── */
  {
    id:1,name:"Perfect French Omelette",emoji:"🥚",xp:50,difficulty:"Medium",time:"8 min",
    category:"Breakfast",tags:["Quick","Classic"],
    diets:["Vegetarian","Gluten-free","Keto"],
    macros:mk(290,18,1,22,0),done:false,
    ingredients:["3 large eggs","20g cold unsalted butter, cut into small cubes","Pinch of fine salt","Pinch of white pepper","Small handful fresh chives, finely chopped"],
    steps:[
      {title:"Beat the eggs",body:"Crack all three eggs into a bowl. Add salt and white pepper. Beat vigorously with a fork until completely combined — no streaks of white remaining. The mix should be uniform yellow."},
      {title:"Heat the pan",body:"Place a 20cm non-stick pan over medium-high heat. Add two-thirds of the butter. When it foams and just begins to colour at the edges, immediately pour in the eggs."},
      {title:"Stir constantly",body:"With a silicone spatula or fork, stir the eggs rapidly in small circles while shaking the pan back and forth at the same time. The eggs should begin to form small, soft curds.",timer:45},
      {title:"Smooth and rest",body:"When the eggs are mostly set but still look slightly wet on top, remove from heat. Tap the pan handle to smooth the surface. Let it sit 10 seconds — residual heat finishes it."},
      {title:"Roll and plate",body:"Tilt the pan at 45°. Use your spatula to fold the near edge of the omelette over the centre. Tip onto a warm plate, folding the final edge underneath as you go. It should be pale yellow — no browning. Add remaining butter on top to melt and gloss. Scatter chives."},
    ],
    tip:"The French omelette should take under 90 seconds from eggs hitting the pan to being on the plate. If it's taking longer, your heat is too low. Speed and a good pan are everything.",
  },
  {
    id:2,name:"Shakshuka",emoji:"🍳",xp:65,difficulty:"Easy",time:"25 min",
    category:"Breakfast",tags:["Brunch","One-pan","Spiced"],
    diets:["Vegetarian","Gluten-free","Dairy-free"],
    macros:mk(320,18,24,16,5),done:false,
    ingredients:["6 large eggs","2 × 400g cans chopped tomatoes","1 large red bell pepper, diced","1 large white onion, finely diced","5 cloves garlic, finely minced","2 tsp ground cumin","1½ tsp smoked paprika","1 tsp ground coriander","½ tsp cayenne pepper (adjust to taste)","3 tbsp olive oil","Salt and black pepper","Optional to serve: crumbled feta (omit for dairy-free), fresh cilantro, crusty bread or pita"],
    steps:[
      {title:"Build the base",body:"Heat olive oil in a large, wide oven-safe frying pan over medium heat. Add onion and cook, stirring occasionally, for 8 minutes until soft and beginning to caramelise.",timer:480},
      {title:"Add the aromatics",body:"Add the diced red pepper and cook 3 minutes more. Add garlic, cumin, smoked paprika, coriander, and cayenne. Stir for 1 full minute — you should smell the spices bloom.",timer:60},
      {title:"Build the sauce",body:"Pour in both cans of tomatoes. Season generously with salt and pepper. Stir well. Reduce heat to medium-low and simmer uncovered for 10 minutes, stirring occasionally, until the sauce thickens and darkens in colour.",timer:600},
      {title:"Add the eggs",body:"Taste the sauce and adjust seasoning — it should be bold and slightly spicy. Use a large spoon to make 6 wells in the sauce, spacing them evenly. Crack one egg into each well carefully, keeping the yolks intact."},
      {title:"Cook to your liking",body:"Cover the pan with a lid. Cook on medium-low heat for 5–8 minutes. At 5 minutes the yolks will be runny; at 8 minutes they'll be fully set. Check frequently.",timer:360},
      {title:"Finish and serve",body:"Remove the lid. Crumble feta over the top if using. Add a generous handful of fresh cilantro. Serve directly from the pan at the table — it looks spectacular — with bread or pita for scooping."},
    ],
    tip:"Pull the pan off the heat about 1 minute before you think the eggs are done. The hot sauce continues cooking them. Runny yolks are the goal.",
  },
  {
    id:3,name:"Overnight Oats (4 jars)",emoji:"🥣",xp:30,difficulty:"Easy",time:"10 min",
    category:"Breakfast",tags:["Meal Prep","Vegan","Make Ahead"],
    diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],
    macros:mk(380,12,58,10,8),done:false,
    ingredients:["400g (4 cups) rolled oats — not instant","500ml oat milk (or any plant or dairy milk)","100ml cold water","4 tbsp chia seeds","4 tbsp maple syrup or honey","2 tsp vanilla extract","Pinch of salt","To serve: fresh berries, sliced banana, nut butter, granola, toasted coconut"],
    steps:[
      {title:"Combine the base",body:"In a large mixing bowl, combine the oats, chia seeds, maple syrup, vanilla, and salt. Stir together so everything is evenly mixed before adding liquid."},
      {title:"Add the liquid",body:"Pour in the oat milk and cold water. Stir thoroughly for 1 minute, making sure the chia seeds are evenly distributed and not clumping. The mixture will look quite loose at this stage — that's correct."},
      {title:"Divide into jars",body:"Divide the mixture evenly between 4 mason jars or sealed containers, about 250ml each. Seal the lids tightly."},
      {title:"Refrigerate",body:"Refrigerate for at least 6 hours, but ideally overnight (8–12 hours). The oats will absorb the liquid and the chia seeds will gel, creating a thick, creamy texture.",timer:0},
      {title:"Top and serve",body:"In the morning, open your jar. The oats should be thick and creamy — add a splash more milk if you prefer a looser texture. Top with whatever you like: fresh berries, sliced banana, a spoonful of almond butter, granola for crunch."},
    ],
    tip:"Make these on Sunday and you have breakfast ready Monday through Thursday. They keep for 4 days in the fridge. The longer they sit, the creamier they get.",
  },
  {
    id:4,name:"Avocado Toast with Poached Eggs",emoji:"🥑",xp:40,difficulty:"Easy",time:"15 min",
    category:"Breakfast",tags:["Quick","High Protein"],
    diets:["Vegetarian","Dairy-free"],
    macros:mk(440,18,36,24,9),done:false,
    ingredients:["2 large ripe avocados","4 large eggs","4 thick slices sourdough or wholegrain bread","1 lemon","1 tsp white wine vinegar","Chilli flakes","Flaky sea salt and black pepper","Microgreens or watercress to serve"],
    steps:[
      {title:"Toast the bread",body:"Toast bread until deeply golden and crunchy — not pale. The crunch provides contrast to the creamy avocado. If you have a griddle pan, a char adds flavour.",timer:180},
      {title:"Smash the avocado",body:"Halve and destone the avocados. Scoop the flesh into a bowl. Add a generous squeeze of lemon juice, a pinch of flaky salt, and plenty of black pepper. Mash with a fork to a chunky — not smooth — texture. Taste and adjust seasoning."},
      {title:"Set up for poaching",body:"Fill a wide, shallow saucepan with about 8cm of water. Add the vinegar. Bring to a gentle simmer — you want small bubbles rising from the bottom, not a rolling boil."},
      {title:"Poach the eggs",body:"Crack one egg into a small cup. Use a spoon to create a gentle swirl in the water. Slide the egg into the centre of the swirl. Repeat with remaining eggs. Poach for exactly 3 minutes for a runny yolk.",timer:180},
      {title:"Assemble",body:"Spread smashed avocado thickly over the toast. Remove poached eggs with a slotted spoon; dab the bottom gently on kitchen paper. Place on the avocado. Add chilli flakes, flaky salt, black pepper, and microgreens."},
    ],
    tip:"The secret to poached eggs is gentle heat and fresh eggs. Old eggs spread out and lose their shape. The vinegar helps the white coagulate around the yolk.",
  },
  {
    id:5,name:"Banana Pancakes",emoji:"🥞",xp:45,difficulty:"Easy",time:"20 min",
    category:"Breakfast",tags:["Vegetarian","Weekend"],
    diets:["Vegetarian"],
    macros:mk(380,10,58,12,3),done:false,
    ingredients:["200g plain flour","1 tbsp baking powder","2 tbsp caster sugar","Pinch of salt","2 ripe bananas — the riper the better","2 large eggs","200ml whole milk","2 tbsp melted butter, plus extra for the pan","1 tsp vanilla extract","To serve: maple syrup, fresh berries, banana slices"],
    steps:[
      {title:"Mix the dry ingredients",body:"Sift flour, baking powder, sugar, and salt into a large bowl. Make a well in the centre."},
      {title:"Mash the bananas",body:"In a separate bowl, mash the bananas thoroughly with a fork until almost smooth — a few lumps are fine and add texture. Add eggs, milk, melted butter, and vanilla. Whisk together."},
      {title:"Combine",body:"Pour the wet mixture into the well in the dry ingredients. Gently fold together with a spatula until just combined. Do not overmix — lumps in the batter are fine and will give you fluffier pancakes. Let the batter rest 5 minutes.",timer:300},
      {title:"Cook the pancakes",body:"Heat a non-stick pan over medium heat. Add a small knob of butter. When it foams, add about 3–4 tbsp of batter per pancake. Cook until bubbles form on the surface and the edges look set, about 2–3 minutes.",timer:150},
      {title:"Flip once",body:"Flip each pancake once. Cook for 1–2 minutes more on the second side until golden. Never press down on pancakes — this deflates them.",timer:90},
    ],
    tip:"Ripe, even slightly overripe bananas with lots of brown spots make much sweeter, more flavourful pancakes. The riper the banana, the better the batter.",
  },

  /* ── ITALIAN ── */
  {
    id:6,name:"Aglio e Olio",emoji:"🍝",xp:55,difficulty:"Easy",time:"15 min",
    category:"Italian",tags:["Quick","Weeknight"],
    diets:["Vegetarian","Dairy-free"],
    macros:mk(520,14,72,20,3),done:false,
    ingredients:["400g spaghetti","10 cloves garlic, very thinly sliced (not crushed)","100ml extra-virgin olive oil — good quality","1½ tsp dried chilli flakes (or 2 fresh red chillies, sliced)","Large bunch flat-leaf parsley, finely chopped","Fine salt for the pasta water","Flaky sea salt and black pepper to finish","Freshly grated Pecorino Romano or Parmesan to serve"],
    steps:[
      {title:"Salt the water properly",body:"Bring a large pot of water to a rolling boil. Add an aggressive amount of salt — about 2 tbsp for 4 litres of water. It should taste like mild seawater. This is the only opportunity to season the pasta itself.",timer:600},
      {title:"Cook the pasta",body:"Add spaghetti and cook for 2 minutes less than the packet instructions. It should be just slightly too al dente — it will finish cooking in the sauce. Before draining, reserve a large mug (at least 300ml) of the starchy pasta water.",timer:480},
      {title:"Toast the garlic gently",body:"While the pasta cooks, put olive oil and garlic into a cold large frying pan. Place over medium-low heat. Cook very slowly, stirring often, for 8–10 minutes until the garlic turns pale, golden, and fragrant. It must not brown — bitter garlic ruins the dish.",timer:480},
      {title:"Add chilli and emulsify",body:"Add the chilli flakes to the garlic oil and stir for 30 seconds. Add a ladleful of pasta water. It will hiss and steam dramatically — this is correct. Stir vigorously to emulsify the water into the oil. The sauce should look slightly milky and creamy."},
      {title:"Toss the pasta",body:"Add the drained pasta directly into the pan. Toss constantly over medium heat for 1–2 minutes, adding more pasta water splash by splash until the sauce clings to every strand of spaghetti and looks glossy. Fold in almost all of the parsley."},
      {title:"Serve immediately",body:"Plate into warm bowls. Finish with remaining fresh parsley, a drizzle of your best olive oil, flaky sea salt, and plenty of Pecorino. Serve immediately — this dish waits for no one."},
    ],
    tip:"The pasta water is the sauce. The starch in it emulsifies with the olive oil to create a silky, clinging sauce. Use far more of it than you think you need.",
  },
  {
    id:7,name:"Cacio e Pepe",emoji:"🧀",xp:85,difficulty:"Hard",time:"20 min",
    category:"Italian",tags:["Classic","Technique"],
    diets:["Vegetarian"],
    macros:mk(580,20,70,24,2),done:false,
    ingredients:["400g spaghetti or tonnarelli","100g Pecorino Romano, very finely grated (use a microplane)","50g Parmesan, very finely grated","2 tsp whole black peppercorns","Fine salt for pasta water"],
    steps:[
      {title:"Toast and grind the pepper",body:"In a dry pan over medium heat, toast the whole peppercorns for 2 minutes until fragrant. Crush to a medium-coarse grind in a mortar — you want pieces, not dust. This step makes an enormous difference to the final flavour.",timer:120},
      {title:"Cook the pasta",body:"Cook pasta in well-salted water until 2 minutes under al dente. Reserve at least 400ml of pasta water before draining. Keep the pasta water warm — heat is critical to the sauce.",timer:480},
      {title:"Toast the pepper in the pan",body:"In a large frying pan over medium heat, add the crushed pepper with about 2 tbsp pasta water. Swirl for 30 seconds until the water evaporates slightly and the pepper is fragrant."},
      {title:"Add pasta and water",body:"Add the just-drained pasta and 100ml of pasta water. Toss vigorously over medium heat for 1 minute.",timer:60},
      {title:"Make the cheese sauce",body:"Remove from heat. This step must happen off the heat or the cheese will clump. Mix both grated cheeses together. Add half the cheese mixture to the pasta in a thin, steady stream, tossing constantly and adding splashes of pasta water to loosen. Add remaining cheese the same way. The sauce should be glossy and creamy — not clumped."},
      {title:"Adjust and serve",body:"Return to very low heat if needed, tossing constantly. Add pasta water little by little until the consistency is perfect. Plate into warm bowls. Add more pepper and a little Pecorino on top."},
    ],
    tip:"Cacio e Pepe has only 4 ingredients but is genuinely difficult. The cheese clumping is the problem — it only works off the heat, with fine cheese, and enough starchy pasta water. The first attempt may fail. The second one won't.",
  },
  {
    id:8,name:"Lemon Ricotta Pasta",emoji:"🍋",xp:45,difficulty:"Easy",time:"18 min",
    category:"Italian",tags:["Quick","Vegetarian","Bright"],
    diets:["Vegetarian"],
    macros:mk(490,18,66,16,3),done:false,
    ingredients:["400g rigatoni or pappardelle","250g whole-milk ricotta — the freshest you can find","Zest and juice of 2 unwaxed lemons","60g Parmesan, finely grated","25g unsalted butter","3 cloves garlic, finely grated","Large handful fresh basil leaves","Salt and plenty of cracked black pepper"],
    steps:[
      {title:"Cook the pasta",body:"Boil pasta in heavily salted water until al dente. Reserve a generous cup (300ml) of pasta water before draining.",timer:480},
      {title:"Build the base",body:"In the warm empty pasta pot, melt butter over low heat. Add grated garlic. Cook for 30 seconds — just to soften it, not colour it. Remove from heat entirely."},
      {title:"Add the ricotta",body:"Add ricotta, lemon zest, lemon juice, and half the Parmesan to the pot. Add 3–4 tbsp of hot pasta water. Stir to combine into a loose, creamy sauce."},
      {title:"Toss the pasta",body:"Add the drained pasta. Toss well, adding pasta water a little at a time until the sauce is glossy and coats every piece generously. Season very heavily with black pepper."},
      {title:"Finish",body:"Taste and adjust — it should be bright, lemony, creamy, and peppery. Tear in the basil leaves. Top with remaining Parmesan and more lemon zest."},
    ],
    tip:"Use the best, freshest whole-milk ricotta you can find. The quality of this single ingredient is what makes the dish. Supermarket tubs vary wildly.",
  },

  /* ── ASIAN ── */
  {
    id:9,name:"Thai Green Curry",emoji:"🍛",xp:120,difficulty:"Hard",time:"45 min",
    category:"Asian",tags:["Spicy","Aromatic","Thai"],
    diets:["Gluten-free","Dairy-free"],
    macros:mk(520,34,28,32,4),done:false,
    ingredients:["400ml full-fat coconut milk — the thick, high-quality kind","3 tbsp good-quality green curry paste (Mae Ploy or Maesri brands recommended)","600g chicken thigh fillets, trimmed and sliced into bite-sized pieces","1 zucchini, halved lengthways and cut into half-moons","6–8 Thai eggplants, quartered (or 1 regular eggplant, cubed)","4 kaffir lime leaves, torn (not ground)","2 tbsp fish sauce, plus more to taste","1 tbsp palm sugar or soft brown sugar","Large handful fresh Thai basil","Jasmine rice to serve","1 red chilli, sliced, to garnish"],
    steps:[
      {title:"Fry the paste in coconut cream",body:"Open the coconut milk without shaking it. Spoon the thick cream from the top into a hot wok. Fry over high heat for 1–2 minutes, stirring, until it bubbles and the oil begins to separate. Add the curry paste. Fry for 2 full minutes, stirring constantly, until darkened and fragrant.",timer:120},
      {title:"Seal the chicken",body:"Add the chicken pieces. Toss in the paste and fry for 3–4 minutes until sealed on all sides. The chicken doesn't need to be cooked through yet.",timer:240},
      {title:"Add the coconut milk",body:"Pour in the remaining coconut milk. Add the torn kaffir lime leaves. Bring to a gentle simmer — never a boil, which makes coconut milk split.",},
      {title:"Add the vegetables",body:"Add zucchini and eggplant. Simmer over medium-low heat for 8–10 minutes, stirring occasionally, until vegetables are tender but still have some bite.",timer:540},
      {title:"Season and finish",body:"Season with fish sauce and palm sugar — the balance of salty (fish sauce) and sweet (palm sugar) is the whole point of Thai cooking. Add a little at a time and taste as you go. Stir in the Thai basil just before serving — it wilts in seconds."},
      {title:"Serve",body:"Ladle over jasmine rice. Garnish with sliced red chilli. Serve immediately — the flavour is best right away."},
    ],
    tip:"The single most important thing: fry the curry paste in the coconut cream before adding the rest of the liquid. This step, unique to Thai cooking, transforms the paste from raw and sharp to deep and fragrant.",
  },
  {
    id:10,name:"Miso Glazed Salmon",emoji:"🐟",xp:80,difficulty:"Medium",time:"25 min",
    category:"Japanese",tags:["High Protein","Japanese","Quick"],
    diets:["Gluten-free","Dairy-free"],
    macros:mk(420,38,16,22,1),done:false,
    ingredients:["2 thick salmon fillets, about 200g each, skin on","3 tbsp white (shiro) miso paste","2 tbsp mirin","1 tbsp soy sauce or tamari (use tamari for gluten-free)","1 tsp toasted sesame oil","2 cloves garlic, finely grated","1 tsp fresh ginger, finely grated","Spring onions, thinly sliced, to serve","1 tsp toasted sesame seeds","Steamed rice and cucumber to serve"],
    steps:[
      {title:"Make the glaze",body:"In a small bowl, whisk together miso, mirin, soy sauce, sesame oil, garlic, and ginger until completely smooth. Taste it — it should be deeply savoury, slightly sweet, and fragrant."},
      {title:"Pat the salmon dry",body:"Use kitchen paper to thoroughly pat the salmon dry on all sides, including the skin. This is important: moisture prevents caramelisation. Season lightly with salt on the skin side only — the glaze provides plenty of salt elsewhere.",},
      {title:"Apply the glaze and rest",body:"Spoon the glaze generously over the flesh side of each fillet. Use the back of the spoon to spread it evenly. Rest at room temperature for 10 minutes while you preheat the grill.",timer:600},
      {title:"Broil the salmon",body:"Set your oven to its highest broil/grill setting and preheat for 5 minutes. Place salmon skin-side down on a foil-lined tray. Broil 4–6cm from the heat for 6–8 minutes, depending on thickness. Watch carefully — the glaze caramelises quickly.",timer:420},
      {title:"Rest and serve",body:"The salmon is ready when the glaze is deep amber and caramelised and the fish just flakes when pressed with a fork — the centre should be just slightly translucent. Rest 2 minutes. Scatter spring onions and sesame seeds. Serve over rice."},
    ],
    tip:"Do not broil from cold — the inside won't cook evenly. Room temperature salmon, a very hot grill, and your full attention for those last 2 minutes is the formula.",
  },
  {
    id:11,name:"Sichuan Mapo Tofu",emoji:"🌶️",xp:95,difficulty:"Medium",time:"25 min",
    category:"Asian",tags:["Spicy","Vegan","Sichuan"],
    diets:["Vegan","Vegetarian","Gluten-free"],
    macros:mk(280,14,18,16,3),done:false,
    ingredients:["500g silken tofu, very carefully drained and cut into 2cm cubes","3 tbsp doubanjiang (Pixian chilli bean paste) — find this at an Asian supermarket","5 cloves garlic, finely minced","2 tsp fresh ginger, finely minced","1 tbsp Sichuan peppercorns, toasted in a dry pan then ground — the numbing heat is essential","250ml vegetable or chicken stock","2 tbsp soy sauce","1 tsp dark soy sauce","2 tsp cornstarch mixed with 2 tbsp cold water","2 tbsp neutral oil","3 spring onions, thinly sliced","Steamed rice to serve"],
    steps:[
      {title:"Toast the Sichuan pepper",body:"In a small dry pan over medium heat, toast the Sichuan peppercorns for 1–2 minutes until fragrant and slightly darkened. Grind in a mortar to a medium-fine powder. Set aside. This numbing, citrusy spice is non-negotiable for authentic flavour.",timer:120},
      {title:"Fry the doubanjiang",body:"Heat oil in a wok over medium heat. Add the doubanjiang and fry, stirring constantly, for 2 minutes. It will spit and sizzle. The oil should turn red and fragrant — this is the colour and flavour base of the dish.",timer:120},
      {title:"Add aromatics",body:"Add garlic and ginger. Stir-fry for 1 minute until fragrant and soft."},
      {title:"Build the sauce",body:"Add the stock, soy sauce, and dark soy sauce. Bring to a simmer. Taste — it should be boldly savoury and spicy. Adjust with more soy if needed."},
      {title:"Add the tofu",body:"Gently slide in the tofu cubes. Silken tofu breaks easily — do not stir vigorously. Instead, tilt the wok gently and spoon sauce over the tofu. Simmer 3–4 minutes.",timer:240},
      {title:"Thicken and finish",body:"Stir the cornstarch mixture, then pour it slowly into the wok while gently swirling. The sauce will thicken to a glossy, clinging consistency in 1–2 minutes. Remove from heat. Finish with ground Sichuan pepper and spring onions."},
    ],
    tip:"Doubanjiang is the soul of this dish — find the Pixian brand if you can. The combination of doubanjiang heat and Sichuan pepper numbing (má là) is what defines the dish. Don't skip either.",
  },

  /* ── INDIAN ── */
  {
    id:12,name:"Chicken Tikka Masala",emoji:"🍲",xp:105,difficulty:"Medium",time:"1 hr",
    category:"Indian",tags:["Crowd Pleaser","Spiced","Family Favourite"],
    diets:["Gluten-free"],
    macros:mk(490,36,24,28,3),done:false,
    ingredients:["700g chicken breast, cut into large chunks","200g full-fat Greek yoghurt","3 tbsp tikka masala paste (store-bought is fine for this recipe)","400ml passata","200ml double cream or coconut cream","1 large onion, finely diced","5 cloves garlic, minced","2 tsp ginger paste or fresh ginger, grated","2 tsp garam masala","1 tsp turmeric","1 tsp ground cumin","3 tbsp neutral oil","Salt to taste","Fresh coriander and basmati rice to serve"],
    steps:[
      {title:"Marinate the chicken",body:"In a bowl, combine yoghurt, 2 tbsp tikka masala paste, 1 tsp garam masala, and 1 tsp salt. Add the chicken and mix to coat every piece thoroughly. Marinate for at least 30 minutes at room temperature, or overnight in the fridge for best results.",timer:1800},
      {title:"Char the chicken",body:"Preheat your grill/broiler to maximum heat. Spread chicken pieces on a foil-lined tray in a single layer. Grill 6–8 minutes, turning once, until charred in spots and cooked through. Don't skip the charring — it's what gives tikka masala its distinctive smoky depth.",timer:480},
      {title:"Build the sauce",body:"While the chicken grills, heat oil in a large, heavy-based pan over medium heat. Fry onion for 10 minutes until deeply golden, stirring often. Add garlic, ginger, remaining tikka paste, garam masala, turmeric, and cumin. Fry 2 minutes.",timer:720},
      {title:"Add tomato and simmer",body:"Add the passata. Stir well. Bring to a simmer and cook for 15 minutes until the sauce thickens and the raw tomato taste cooks out.",timer:900},
      {title:"Blend (optional)",body:"For a smooth restaurant-style sauce, carefully blend the sauce until smooth using a stick blender or upright blender. Return to the pan. If you prefer a chunkier sauce, skip this step."},
      {title:"Finish with cream and chicken",body:"Add the double cream and stir through. Add the charred chicken pieces and any juices from the tray. Simmer gently for 10 minutes. Taste and adjust salt. Top with fresh coriander and serve with basmati rice and naan."},
    ],
    tip:"The charring step is what separates proper tikka masala from a plain curry sauce. The Maillard reaction on the marinated chicken creates flavour compounds that the sauce cannot replicate. Don't grill — grill and char.",
  },
  {
    id:13,name:"Chana Masala",emoji:"🫘",xp:65,difficulty:"Easy",time:"35 min",
    category:"Indian",tags:["Vegan","High Protein","Budget"],
    diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],
    macros:mk(360,16,48,12,12),done:false,
    ingredients:["2 × 400g cans chickpeas, drained (reserve the liquid)","1 × 400g can chopped tomatoes","1 large onion, finely diced","5 cloves garlic, minced","2 tsp fresh ginger, minced","2 green chillies, finely sliced (adjust to taste)","2 tsp ground cumin","2 tsp ground coriander","1½ tsp garam masala","1 tsp turmeric","1 tsp amchoor (dried mango powder) — optional but excellent","3 tbsp neutral oil","Juice of 1 lemon","Salt to taste","Fresh coriander, basmati rice or naan to serve"],
    steps:[
      {title:"Fry the onion properly",body:"Heat oil in a large, heavy pan over medium heat. Add the onion. Cook for 12–14 minutes, stirring regularly, until deeply golden brown — almost dark. This is the flavour foundation of the dish. Don't rush it.",timer:840},
      {title:"Add aromatics and spices",body:"Add garlic, ginger, and green chillies. Fry 2 minutes. Add cumin, coriander, turmeric. Stir and fry for 1 minute until the spices are fragrant and the oil turns golden.",timer:180},
      {title:"Add tomatoes",body:"Add the chopped tomatoes. Stir well. Cook on medium heat for 8–10 minutes, stirring occasionally, until the oil begins to separate at the edges — this is called the 'bhunao' stage and indicates the sauce base is properly cooked.",timer:600},
      {title:"Add chickpeas",body:"Add the drained chickpeas. If the sauce looks too thick, add a splash of the reserved chickpea liquid. Stir to coat every chickpea in the sauce."},
      {title:"Simmer and finish",body:"Add garam masala and amchoor if using. Simmer 8–10 minutes, gently mashing a few chickpeas against the side of the pan to thicken the sauce naturally.",timer:600},
      {title:"Season and serve",body:"Add lemon juice. Taste and adjust salt, chilli, and lemon. It should be bold, tangy, and warming. Garnish with fresh coriander and serve with rice or naan."},
    ],
    tip:"The deeply caramelised onion is not optional — it's the flavour backbone. If your onions are pale and soft after 5 minutes, your heat is too low. They should be close to dark brown.",
  },
  {
    id:14,name:"Butter Chicken",emoji:"🍗",xp:110,difficulty:"Medium",time:"50 min",
    category:"Indian",tags:["Rich","Mild","Family Favourite"],
    diets:["Gluten-free"],
    macros:mk(540,38,18,36,2),done:false,
    ingredients:["700g chicken thigh, cut into large pieces","200g full-fat yoghurt","2 tsp garam masala","1 tsp turmeric","1 tsp smoked paprika","3 tbsp butter (not oil — real butter is essential)","1 large onion, roughly diced","6 cloves garlic","2 tsp ginger paste","1 × 400g can whole tomatoes","200ml double cream (not coconut cream — this dish is not dairy-free)","1 tsp sugar","Salt to taste","Naan and coriander to serve"],
    steps:[
      {title:"Marinate the chicken",body:"Combine yoghurt, garam masala, turmeric, paprika, and 1 tsp salt. Add chicken and mix thoroughly. Marinate at least 30 minutes, ideally overnight.",timer:1800},
      {title:"Sear the chicken",body:"Melt 1 tbsp butter in a large pan over high heat. Sear the chicken pieces in batches until browned on all sides. Do not crowd the pan. Set aside — it doesn't need to be fully cooked through at this stage.",timer:480},
      {title:"Make the sauce base",body:"In the same pan, melt remaining butter over medium heat. Add onion. Cook 8 minutes until soft. Add garlic and ginger. Cook 2 minutes more."},
      {title:"Add tomatoes and blend",body:"Add the whole tomatoes, breaking them up with a spoon. Add 100ml water. Bring to a simmer, cook 15 minutes. Use a stick blender to blend the sauce completely smooth.",timer:900},
      {title:"Finish the sauce",body:"Return to medium heat. Add the cream, sugar, and a generous pinch of salt. Stir to combine. Add the seared chicken. Simmer gently for 15–20 minutes until the chicken is fully cooked and the sauce is thick and glossy.",timer:1200},
      {title:"Finish with cold butter",body:"Remove from heat. Stir in a final knob of cold butter — this adds the characteristic silkiness. Taste and adjust seasoning. Serve with warm naan and fresh coriander."},
    ],
    tip:"The final cold knob of butter stirred in off the heat (called 'monte au beurre' in French technique) is what gives butter chicken its silky, glossy texture. Don't skip it.",
  },

  /* ── MEDITERRANEAN ── */
  {
    id:15,name:"Classic Hummus",emoji:"🫘",xp:35,difficulty:"Easy",time:"15 min",
    category:"Mediterranean",tags:["Vegan","Snack","Dip"],
    diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],
    macros:mk(280,10,30,14,6),done:false,
    ingredients:["2 × 400g cans chickpeas — reserve the liquid from one can","4 tbsp good-quality tahini (stir the jar well before using)","Juice of 2 lemons","2 cloves garlic — start with 1 if you're sensitive to raw garlic","60ml ice cold water","4 tbsp extra-virgin olive oil, plus more to serve","1 tsp fine salt","Pinch of ground cumin","To garnish: smoked paprika, a drizzle of olive oil, fresh parsley or pine nuts"],
    steps:[
      {title:"Prepare the chickpeas",body:"Drain one can of chickpeas, reserving the liquid (aquafaba). Drain the second can without reserving liquid. For ultra-smooth hummus, pop a few chickpeas out of their skins by squeezing gently — doing all of them is tedious but worth it if you have time."},
      {title:"Blend the tahini first",body:"Add tahini, lemon juice, garlic, and salt to a food processor. Process for 1 full minute until the tahini becomes pale and creamy. This step creates the emulsified base for smooth hummus."},
      {title:"Add chickpeas",body:"Add the drained chickpeas. Process for 2 minutes, stopping to scrape down the sides occasionally."},
      {title:"Loosen with ice water",body:"With the processor running, pour in the ice cold water in a steady stream. The cold water creates a lighter, whipped texture. Process for 2–3 more minutes until the hummus is completely smooth.",timer:180},
      {title:"Season and adjust",body:"Taste carefully. Add more lemon juice for brightness, more salt for depth, or more garlic if you want it punchier. For a looser consistency, add reserved chickpea liquid a tablespoon at a time."},
      {title:"Serve",body:"Spread into a shallow bowl, making a well in the centre with the back of a spoon. Pour olive oil into the well generously. Dust with smoked paprika. Scatter parsley or pine nuts. Serve with warm pita, crudités, or flatbread."},
    ],
    tip:"Most hummus is disappointingly grainy. The fix is time: blend for longer than feels necessary — at least 4 minutes total. The ice cold water is also key to achieving that smooth, light texture.",
  },
  {
    id:16,name:"Chimichurri Steak",emoji:"🥩",xp:100,difficulty:"Medium",time:"30 min",
    category:"Mediterranean",tags:["High Protein","Bold","Impressive"],
    diets:["Gluten-free","Dairy-free"],
    macros:mk(560,46,4,38,1),done:false,
    ingredients:["2 ribeye or sirloin steaks, about 250g each, at room temperature","Large bunch flat-leaf parsley (about 50g leaves)","4 cloves garlic","2 tbsp red wine vinegar","½ tsp dried chilli flakes","100ml extra-virgin olive oil","1 tsp dried oregano","Flaky sea salt and cracked black pepper"],
    steps:[
      {title:"Make the chimichurri",body:"Finely chop the parsley and garlic by hand — don't use a food processor for chimichurri, which turns it into a paste. Combine in a bowl with vinegar, chilli flakes, oregano, olive oil, salt, and pepper. Stir well. Rest at room temperature for 30 minutes minimum — the resting is not optional.",timer:1800},
      {title:"Prepare the steaks",body:"Take steaks out of the fridge 30 minutes before cooking. Pat completely dry with kitchen paper on all sides. Season very generously with flaky salt and cracked pepper on both sides — more than feels right."},
      {title:"Sear in a screaming-hot pan",body:"Heat a cast iron or heavy steel pan over highest heat for 3–4 minutes until it smokes. Add a small amount of neutral oil. Place steaks in the pan — they should sear loudly on contact. Do not move them for 3 minutes.",timer:180},
      {title:"Flip once and baste",body:"Flip once. Cook for 2–3 minutes more for medium-rare (internal temperature 52–54°C / 125–130°F). In the final minute, add a knob of butter and baste the steak with it using a spoon.",timer:180},
      {title:"Rest properly",body:"Transfer to a warm plate. Rest for 5 minutes — this is not optional. During rest, the muscle fibres relax and reabsorb the juices. Cutting immediately loses them all.",timer:300},
      {title:"Slice and serve",body:"Slice against the grain — look at the muscle fibres and cut perpendicular to them. Spoon chimichurri generously over the sliced steak and more on the side."},
    ],
    tip:"Two things ruin a steak: a wet surface and low heat. The steak must be completely dry and the pan must be smoking hot. Any moisture creates steam and prevents the Maillard reaction that creates crust and flavour.",
  },

  /* ── MEXICAN ── */
  {
    id:17,name:"Tacos al Pastor",emoji:"🌮",xp:95,difficulty:"Medium",time:"45 min",
    category:"Mexican",tags:["Bold","Smoky","Spicy"],
    diets:["Gluten-free","Dairy-free"],
    macros:mk(480,28,42,20,4),done:false,
    ingredients:["600g pork shoulder, sliced very thinly (ask your butcher, or freeze slightly to slice more easily)","3 dried guajillo chillies, stems and seeds removed, soaked in boiling water 20 min","1 chipotle pepper in adobo sauce (from a can)","4 cloves garlic","1 tsp ground cumin","1 tsp dried oregano","3 tbsp white wine vinegar","½ fresh pineapple — half to blend into the marinade, half to slice and grill","Salt","Corn tortillas (not flour — corn tortillas are naturally gluten-free)","White onion, fresh coriander, and lime wedges to serve"],
    steps:[
      {title:"Make the marinade",body:"Drain the soaked guajillo chillies. Blend with chipotle, garlic, cumin, oregano, vinegar, half the pineapple (roughly chopped), and 1 tsp salt until completely smooth. Taste — it should be smoky, spicy, tangy, and slightly sweet."},
      {title:"Marinate the pork",body:"Coat the pork slices thoroughly in the marinade. Cover and refrigerate for at least 2 hours, ideally overnight. The pineapple contains enzymes that tenderise the meat.",timer:7200},
      {title:"Grill the pineapple",body:"Heat a griddle pan or grill to very high heat. Grill pineapple slices 2–3 minutes per side until deeply caramelised and charred in spots. Chop into small pieces. Set aside.",timer:180},
      {title:"Cook the pork",body:"Heat a large heavy pan or cast iron skillet to very high heat. Cook pork in batches in a single layer — don't crowd the pan. Cook 2–3 minutes per side until charred and caramelised at the edges. The char is the entire flavour point of this dish.",timer:300},
      {title:"Chop the pork",body:"Transfer cooked pork to a board. Chop into small pieces with a sharp knife, mixing the charred edges through the tender pieces."},
      {title:"Assemble the tacos",body:"Warm corn tortillas directly over a gas flame or in a dry pan for 30 seconds per side until soft and charred in spots. Stack two tortillas per taco. Add pork, grilled pineapple, raw white onion, fresh coriander, and a generous squeeze of lime."},
    ],
    tip:"The char is the point. The marinade caramelises in the pan and creates complex, smoky flavour that defines al pastor. A medium heat produces a stew, not tacos. Cook hot.",
  },
  {
    id:18,name:"Black Bean Tacos (Vegan)",emoji:"🌱",xp:55,difficulty:"Easy",time:"20 min",
    category:"Mexican",tags:["Vegan","Quick","Budget"],
    diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],
    macros:mk(380,14,58,10,14),done:false,
    ingredients:["2 × 400g cans black beans, drained","1 × 400g can chopped tomatoes","1 large onion, finely diced","4 cloves garlic, minced","2 tsp smoked paprika","1½ tsp ground cumin","1 tsp chilli powder","½ tsp cayenne","3 tbsp olive oil","Salt and black pepper","8 corn tortillas","1 ripe avocado","Juice of 1 lime","Fresh coriander, shredded iceberg lettuce, sliced jalapeños to serve"],
    steps:[
      {title:"Fry the aromatics",body:"Heat olive oil in a large pan over medium-high heat. Add onion. Cook 6 minutes until golden. Add garlic, smoked paprika, cumin, chilli powder, and cayenne. Stir 1 minute.",timer:420},
      {title:"Add tomatoes",body:"Add chopped tomatoes. Stir well. Cook 5 minutes until slightly reduced."},
      {title:"Add the beans",body:"Add black beans. Stir to coat in the sauce. Use the back of a spoon to mash roughly one-third of the beans against the side of the pan — this thickens the filling and creates a better texture.",timer:300},
      {title:"Simmer and season",body:"Simmer 5 minutes until the filling is thick and sticky. Season generously with salt and pepper. Squeeze in half the lime juice. Taste and adjust."},
      {title:"Make quick guacamole",body:"Mash the avocado with the remaining lime juice and a pinch of salt. Don't over-mash — chunky is better."},
      {title:"Assemble",body:"Warm tortillas in a dry pan or over a gas flame. Layer with bean filling, quick guacamole, shredded lettuce, coriander, and sliced jalapeños."},
    ],
    tip:"Mashing some of the beans creates a natural thickener that makes the filling stick to your tortilla instead of falling out. Do not skip this step.",
  },

  /* ── COMFORT ── */
  {
    id:19,name:"Smash Burgers",emoji:"🍔",xp:70,difficulty:"Medium",time:"20 min",
    category:"Comfort",tags:["Crowd Pleaser","Technique","Weekend"],
    diets:["No restrictions"],
    macros:mk(680,38,42,38,2),done:false,
    ingredients:["600g 80/20 ground beef — the fat content is non-negotiable for this technique","4 brioche buns, split and toasted","8 slices American cheese (processed cheese melts better than cheddar for this)","1 large white onion, very finely diced","Dill pickle slices","Shredded iceberg lettuce","For the smash sauce: 3 tbsp mayonnaise, 1 tbsp ketchup, 1 tsp American mustard, 1 tsp white wine vinegar, ½ tsp smoked paprika, pinch of sugar"],
    steps:[
      {title:"Make the smash sauce",body:"Mix all sauce ingredients together. Taste — it should be creamy, tangy, and slightly sweet. Refrigerate until needed."},
      {title:"Portion the beef loosely",body:"Divide the beef into 8 equal portions of about 75g each. Roll each into a loose ball — do not compact or season at this stage. Keep in the fridge until the last moment.",},
      {title:"Get the pan screaming hot",body:"Place a cast iron skillet or heavy pan over highest heat for 4–5 minutes until it begins to smoke. No oil needed — the beef fat is sufficient.",},
      {title:"The smash — this is the technique",body:"Place a beef ball in the pan. Immediately place a piece of greaseproof paper over it. Using a flat, heavy spatula or the bottom of a small pot, press down with firm, steady force for 10 full seconds. Remove the paper. Add a pinch of diced onion on top.",timer:90},
      {title:"Crust and cheese",body:"Cook undisturbed for 90 seconds until the edges are deeply, properly brown and lacy — this is called the crust. Flip once with a thin spatula. Immediately place one slice of cheese on each patty. Cook 45 seconds more.",timer:45},
      {title:"Stack and serve immediately",body:"Stack two patties per bun. Sauce both bun halves generously. Layer: bottom bun, sauce, pickles, lettuce, double patty stack, sauce, top bun. Serve immediately — smash burgers deteriorate within minutes."},
    ],
    tip:"SMASH hard and FAST the moment the beef touches the pan. That initial contact is when the smash creates maximum surface area for the Maillard reaction — the lacy, crunchy, flavourful crust. A hesitant press produces a flat patty with no crust.",
  },
  {
    id:20,name:"French Onion Soup",emoji:"🧅",xp:110,difficulty:"Medium",time:"1h 30m",
    category:"Comfort",tags:["Classic","Slow Cook","French"],
    diets:["Vegetarian"],
    macros:mk(440,18,38,22,4),done:false,
    ingredients:["1.5kg yellow onions (about 6 large), peeled and thinly sliced in half-moons","60g unsalted butter","1 tbsp neutral oil","1 tsp caster sugar","150ml dry white wine or dry sherry","1.5 litres good-quality beef stock (or vegetable stock for vegetarian)","3 sprigs fresh thyme","2 bay leaves","Salt and black pepper","8 slices baguette, slightly stale","250g Gruyère, coarsely grated"],
    steps:[
      {title:"Begin caramelising the onions",body:"Melt butter and oil in a large, wide, heavy-based pot over medium heat. Add all the onions and 1 tsp salt. Stir to coat. Cook for 15 minutes with the lid on, stirring occasionally, until the onions have collapsed and released their liquid.",timer:900},
      {title:"Continue slowly",body:"Remove the lid. Add the sugar. Continue cooking over medium-low heat, stirring every 5–8 minutes, for a further 35–40 minutes. The onions should gradually turn from pale to gold to deep, sticky, dark brown. This cannot be rushed.",timer:2400},
      {title:"Deglaze",body:"Once the onions are deeply caramelised, increase heat to medium-high. Add the white wine. Scrape every brown bit from the base of the pot — this fond is pure flavour. Cook 3 minutes until the wine is mostly absorbed.",timer:180},
      {title:"Add stock and simmer",body:"Add stock, thyme sprigs, and bay leaves. Bring to a boil, then reduce to a steady simmer. Cook uncovered for 25 minutes. Remove thyme and bay. Season generously with salt and pepper.",timer:1500},
      {title:"Prepare the croutons",body:"Toast the baguette slices until dry and crunchy all the way through. Preheat your grill/broiler to maximum."},
      {title:"Gratinée",body:"Ladle soup into individual oven-safe bowls placed on a baking tray. Float 2 baguette slices on top of each bowl. Cover entirely and generously with grated Gruyère — do not be sparse. Grill for 4–6 minutes until the cheese is bubbling, golden, and has crispy brown edges.",timer:360},
    ],
    tip:"The caramelised onions are the entire dish. If they're not deeply, properly dark brown after 50 minutes, keep going. Pale onions produce pale soup. The difference between 30-minute onions and 55-minute onions is the difference between a mediocre soup and an unforgettable one.",
  },

  /* ── HEALTHY ── */
  {
    id:21,name:"Buddha Bowl with Tahini Dressing",emoji:"🥗",xp:55,difficulty:"Easy",time:"40 min",
    category:"Healthy",tags:["Vegan","Meal Prep","Wholesome"],
    diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],
    macros:mk(480,16,62,18,12),done:false,
    ingredients:["1 head cauliflower, broken into florets","2 × 400g cans chickpeas, drained","2 tsp smoked paprika","1 tsp ground cumin","4 tbsp olive oil","200g farro or quinoa, cooked according to packet","For the tahini dressing: 4 tbsp tahini, juice of 1½ lemons, 1 clove garlic (minced), 4–5 tbsp cold water, pinch of salt","To finish: pomegranate seeds, fresh mint leaves, cucumber slices"],
    steps:[
      {title:"Roast the cauliflower and chickpeas",body:"Preheat oven to 220°C. Toss cauliflower florets and drained chickpeas separately with olive oil, smoked paprika, cumin, salt, and pepper. Spread across two large baking trays in a single layer — do not crowd them. Roast for 25–30 minutes, tossing once halfway, until cauliflower is charred at the edges and chickpeas are crisp.",timer:1800},
      {title:"Cook the grain",body:"While the vegetables roast, cook farro or quinoa according to the packet. Season the water well with salt. Drain if needed and fluff with a fork."},
      {title:"Make the tahini dressing",body:"In a small bowl, whisk together tahini, lemon juice, minced garlic, and salt. Add cold water one tablespoon at a time, whisking continuously — the dressing will seize up initially then suddenly become creamy and pourable. It should coat the back of a spoon."},
      {title:"Assemble",body:"Divide the cooked farro between 4 bowls. Arrange roasted cauliflower, crispy chickpeas, and sliced cucumber in separate sections — the visual arrangement matters for this dish."},
      {title:"Dress and finish",body:"Drizzle tahini dressing generously over everything. Scatter pomegranate seeds and fresh mint. Serve immediately or refrigerate for meal prep — keep the dressing separate until ready to eat."},
    ],
    tip:"The key to crispy roasted chickpeas is thorough drying and high heat. Pat them completely dry with kitchen paper after draining, and make sure they're in a single layer with space between them. Crowded chickpeas steam rather than roast.",
  },
  {
    id:22,name:"Miso Soup with Tofu",emoji:"🍜",xp:30,difficulty:"Easy",time:"15 min",
    category:"Healthy",tags:["Japanese","Vegan","Quick"],
    diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],
    macros:mk(120,8,10,5,2),done:false,
    ingredients:["1 litre dashi stock (use kombu and dried shiitake for vegan version) or vegetable stock","3 tbsp white miso paste (shiro miso)","200g firm tofu, drained and cut into 1.5cm cubes","2 spring onions, thinly sliced diagonally","1 sheet dried wakame seaweed, cut into small pieces (rehydrates quickly)","Optional: 1 tbsp dried bonito flakes added to stock (not vegan)"],
    steps:[
      {title:"Make a simple dashi",body:"For vegan dashi: soak 10g dried kombu in 1 litre cold water for 30 minutes. Add a handful of dried shiitake mushrooms. Bring to just below a simmer — never boil kombu. Remove the kombu. Strain and return to the pot.",timer:1800},
      {title:"Add the tofu",body:"Bring the dashi to a gentle simmer. Add the tofu cubes. Simmer very gently for 3 minutes — tofu is delicate and will crumble at a vigorous boil.",timer:180},
      {title:"Rehydrate the wakame",body:"Place the dried wakame in a small bowl of cold water for 3–5 minutes until rehydrated. Drain and add to the simmering stock."},
      {title:"Dissolve the miso",body:"This step is critical: never boil miso — boiling destroys its probiotic enzymes and dulls the flavour. Remove the pot from heat. Place miso in a small sieve or ladle. Submerge in the stock and whisk to dissolve completely before incorporating."},
      {title:"Serve immediately",body:"Ladle into warm bowls. Scatter spring onions on top. Serve immediately — miso soup is best drunk the moment it's made."},
    ],
    tip:"Miso must never be boiled. Add it off the heat as the very last step. Boiling produces a flat, dull broth. Properly dissolved miso produces a complex, savoury soup full of depth.",
  },

  /* ── QUICK ── */
  {
    id:23,name:"15-Minute Garlic Butter Prawns",emoji:"🍤",xp:60,difficulty:"Easy",time:"15 min",
    category:"Quick",tags:["Seafood","Quick","Impressive"],
    diets:["Gluten-free"],
    macros:mk(280,28,4,16,0),done:false,
    ingredients:["500g raw king prawns, peeled and deveined (frozen is fine — defrost fully and pat very dry)","6 cloves garlic, finely minced","80g unsalted butter","2 tbsp olive oil","1 tsp smoked paprika","½ tsp cayenne pepper","Juice of 1 lemon","Large handful flat-leaf parsley, chopped","Salt and black pepper","Crusty bread to serve"],
    steps:[
      {title:"Prepare the prawns",body:"Pat the prawns completely dry with kitchen paper. This is the most important step — wet prawns steam instead of sear, producing rubbery results. Season with salt, pepper, smoked paprika, and cayenne."},
      {title:"Sear the prawns",body:"Heat olive oil in a large wide pan over high heat until it shimmers and is very hot. Add prawns in a single layer — work in batches if needed. Sear without moving for 1 minute until pink and slightly charred on one side.",timer:60},
      {title:"Flip and add garlic",body:"Flip each prawn. Add the butter. As soon as it melts, add the garlic. Swirl the pan. Cook 1 more minute — the garlic should sizzle and become fragrant but not brown.",timer:60},
      {title:"Finish and serve",body:"Remove from heat. Add lemon juice — it will hiss and create a quick sauce as it combines with the butter. Add parsley. Toss to coat. Serve immediately with crusty bread to mop up the sauce."},
    ],
    tip:"Prawns cook in under 3 minutes. Overcooked prawns are rubbery and tasteless. Watch for the colour change: raw prawns are grey-blue; cooked prawns are fully opaque pink. The moment they're fully pink, they're done.",
  },
  {
    id:24,name:"Halloumi & Roasted Veg Wraps",emoji:"🫓",xp:40,difficulty:"Easy",time:"25 min",
    category:"Quick",tags:["Vegetarian","Lunch","Quick"],
    diets:["Vegetarian"],
    macros:mk(420,18,48,18,6),done:false,
    ingredients:["250g halloumi, sliced into 1cm planks","1 red bell pepper, sliced","1 courgette, sliced into rounds","1 red onion, cut into wedges","2 tbsp olive oil","1 tsp smoked paprika","4 large flour tortillas or flatbreads","4 tbsp hummus","Handful of rocket or spinach","Juice of ½ lemon","Salt and pepper"],
    steps:[
      {title:"Roast the vegetables",body:"Preheat oven to 220°C. Toss pepper, courgette, and onion with olive oil, smoked paprika, salt, and pepper. Spread on a baking tray. Roast 20 minutes until tender and beginning to char at the edges.",timer:1200},
      {title:"Fry the halloumi",body:"While the veg roasts, heat a non-stick pan or griddle over high heat — no oil needed. Cook halloumi slices for 2 minutes per side until deeply golden and releasing their characteristic squeak. Halloumi must be eaten hot — it goes rubbery as it cools.",timer:240},
      {title:"Warm the wraps",body:"Warm tortillas briefly in a dry pan or in the oven for 1 minute. They should be pliable but not crispy."},
      {title:"Assemble",body:"Spread a generous tablespoon of hummus across each wrap. Layer roasted vegetables, hot halloumi, and rocket. Squeeze lemon over everything. Season with black pepper."},
      {title:"Wrap tightly",body:"Fold in the sides and roll tightly from the bottom up. Cut in half diagonally and serve immediately."},
    ],
    tip:"Eat halloumi the moment it comes off the pan. It goes from perfect to dense and rubbery in about 5 minutes. Time your assembly so you're wrapping as soon as the halloumi is cooked.",
  },

  /* ── BAKING ── */
  {
    id:25,name:"Chocolate Chip Cookies",emoji:"🍪",xp:70,difficulty:"Easy",time:"30 min",
    category:"Baking",tags:["Sweet","Crowd Pleaser","Classic"],
    diets:["Vegetarian"],
    macros:mk(220,3,28,11,1),done:false,
    ingredients:["225g unsalted butter, at room temperature (this is crucial — not melted, not cold)","200g light brown sugar","100g caster sugar","2 large eggs, at room temperature","2 tsp vanilla extract","300g plain flour","1 tsp bicarbonate of soda","1 tsp fine salt","300g dark chocolate (70%), roughly chopped (not chips — chopping creates varying sizes which is better)"],
    steps:[
      {title:"Cream the butter and sugars",body:"Beat the room-temperature butter with both sugars in a stand mixer or with electric beaters for 4–5 minutes until the mixture is pale, light, and fluffy. Properly creamed butter and sugar is the foundation of a good cookie — rushing this step makes denser, flatter cookies.",timer:300},
      {title:"Add eggs and vanilla",body:"Add eggs one at a time, beating well after each addition. Add vanilla. Beat for 1 minute more until fully incorporated. The mixture may look slightly curdled — this is normal."},
      {title:"Add dry ingredients",body:"Sift flour, bicarbonate of soda, and salt together. Add to the butter mixture in two additions, folding gently with a spatula until just combined. Do not overmix — overmixing develops gluten and makes tough cookies."},
      {title:"Fold in the chocolate",body:"Fold in the chopped chocolate. Refrigerate the dough for at least 1 hour, ideally overnight. Cold dough spreads less and produces thicker, chewier cookies.",timer:3600},
      {title:"Bake",body:"Preheat oven to 180°C. Line two trays with baking paper. Scoop dough into balls (about 50g each) and space well apart — they spread. Bake 11–12 minutes until the edges are set and golden but the centres still look underdone.",timer:720},
      {title:"Cool on the tray",body:"Remove from oven. The cookies will look underdone — this is correct. Leave on the tray for 5 minutes to firm up before transferring. They continue cooking on the hot tray.",timer:300},
    ],
    tip:"Pull the cookies out when they look 80% done. The centres should still look soft and underdone. They will set as they cool. This is the difference between a soft, chewy cookie and a dry, crunchy one.",
  },
  {
    id:26,name:"Banana Bread",emoji:"🍌",xp:60,difficulty:"Easy",time:"1 hr 15 min",
    category:"Baking",tags:["Sweet","Make-ahead","Vegetarian"],
    diets:["Vegetarian"],
    macros:mk(280,5,44,10,2),done:false,
    ingredients:["3–4 very ripe bananas (black-spotted is ideal — the riper the better)","200g plain flour","150g light brown sugar","2 large eggs","100g unsalted butter, melted and slightly cooled","1 tsp bicarbonate of soda","1 tsp cinnamon","½ tsp fine salt","1 tsp vanilla extract","Optional: 80g walnuts, roughly chopped, or dark chocolate chips"],
    steps:[
      {title:"Prepare and preheat",body:"Preheat oven to 175°C. Grease a 900g loaf tin and line with baking paper, leaving overhang on the long sides for easy removal."},
      {title:"Mash the bananas",body:"Peel the bananas into a large bowl. Mash thoroughly with a fork until almost smooth — some lumps are fine. The blacker and riper the bananas, the sweeter and more intensely flavoured your bread will be."},
      {title:"Combine wet ingredients",body:"Add melted butter, sugar, eggs, and vanilla to the mashed banana. Whisk until combined."},
      {title:"Add dry ingredients",body:"Sift flour, bicarbonate of soda, cinnamon, and salt over the wet mixture. Fold gently with a spatula until just combined — do not overmix. A few streaks of flour are fine. Fold in walnuts or chocolate chips if using."},
      {title:"Bake",body:"Pour the batter into the prepared tin. Smooth the top. Optional: press a halved banana lengthways into the top for presentation. Bake for 55–65 minutes.",timer:3600},
      {title:"Test and cool",body:"Insert a skewer into the centre — it should come out clean or with a few moist crumbs (not wet batter). Cool in the tin for 10 minutes, then turn out onto a wire rack.",timer:600},
    ],
    tip:"Wait until the bread is completely cool before slicing — the inside continues to set as it cools. Cutting hot banana bread produces a gummy, sticky crumb that hasn't fully set.",
  },
];

/* ═══════════════════════════════════════════════════════════
   WEEKLY LEAGUE DATA
═══════════════════════════════════════════════════════════ */
const MOCK_LEAGUE = [
  {rank:1, name:"Sofia R.",  avatar:"👩‍🍳", weeklyXp:620, isMe:false, streak:12},
  {rank:2, name:"Jake M.",   avatar:"🧑‍🍳", weeklyXp:540, isMe:false, streak:7 },
  {rank:3, name:"Priya K.",  avatar:"👩‍🦱", weeklyXp:480, isMe:false, streak:5 },
  {rank:4, name:"Marcus T.", avatar:"🧔",   weeklyXp:390, isMe:false, streak:9 },
  {rank:5, name:"You",       avatar:"🧑",   weeklyXp:130, isMe:true,  streak:4 },
  {rank:6, name:"Yuki A.",   avatar:"👩",   weeklyXp:110, isMe:false, streak:2 },
  {rank:7, name:"Liam B.",   avatar:"👨",   weeklyXp:80,  isMe:false, streak:1 },
  {rank:8, name:"Amara O.",  avatar:"👩🏾", weeklyXp:60,  isMe:false, streak:3 },
];

const SEED_POSTS = [
  {id:"p1",user:{name:"Sofia R.",  avatar:"👩‍🍳",level:"Sous Chef"},   recipe:"Beef Bourguignon",   emoji:"🥩",photo:null,caption:"Three hours of love. Look at that colour 🤤 So worth it #sundaycooking",                    time:"2h ago", kudos:14,myKudos:false,comments:[{user:"Jake M.",text:"This is insane 🔥"},{user:"Priya K.",text:"Recipe?? 👀"}]},
  {id:"p2",user:{name:"Jake M.",   avatar:"🧑‍🍳",level:"Home Cook"},   recipe:"Sourdough Focaccia",  emoji:"🍞",photo:null,caption:"Finally nailed the dimples after 4 attempts. Sea salt flakes changed everything 🤌",        time:"5h ago", kudos:22,myKudos:false,comments:[{user:"Sofia R.",text:"The crust looks perfect 😍"}]},
  {id:"p3",user:{name:"Priya K.",  avatar:"👩‍🦱",level:"Intermediate"},recipe:"Miso Ramen",           emoji:"🍜",photo:null,caption:"Homemade tonkotsu broth, 6 hours simmering. My flat smells incredible. Every minute worth it ✨",time:"1d ago", kudos:31,myKudos:false,comments:[{user:"Jake M.",text:"6 hours!! Absolute legend"},{user:"Amara O.",text:"I need this recipe 😭"}]},
  {id:"p4",user:{name:"Marcus T.", avatar:"🧔",   level:"Advanced"},    recipe:"Tarte Tatin",         emoji:"🥧",photo:null,caption:"Third attempt. Caramelisation is a discipline not a skill. Nailed it. #persistence",        time:"2d ago", kudos:19,myKudos:false,comments:[{user:"Priya K.",text:"That colour is everything 🙌"}]},
];

const STREAK_GOALS = [
  {id:"daily",   label:"Every day",    sub:"Full commitment",             icon:"🔥",target:7,color:C.flame},
  {id:"5x",      label:"5× a week",    sub:"Weekday warrior",             icon:"💪",target:5,color:C.ember},
  {id:"3x",      label:"3× a week",    sub:"Balanced, sustainable",       icon:"🌿",target:3,color:C.sage},
  {id:"weekend", label:"Weekends",     sub:"Relaxed weekend cooking",     icon:"☀️",target:2,color:C.gold},
  {id:"weekly",  label:"Once a week",  sub:"Busy schedule — no pressure", icon:"🗓️",target:1,color:C.sky},
];
const WEEK_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const fmt = s => s>=3600?`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`:s>=60?`${Math.floor(s/60)}m ${s%60}s`:`${s}s`;

/* ═══════════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════════ */
const XPBar=({pct,color=C.flame,h=8})=>(
  <div style={{background:"#E8DDD4",borderRadius:999,height:h,overflow:"hidden",width:"100%"}}>
    <div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:"100%",background:color,borderRadius:999,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
);
const DiffBadge=({level})=>{const col={Easy:C.sage,Medium:C.ember,Hard:C.flame}[level]||C.muted;return<span style={{fontSize:10,fontWeight:800,color:col,background:`${col}1A`,borderRadius:6,padding:"2px 7px"}}>{level}</span>;};
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

/* ═══════════════════════════════════════════════════════════
   LEVEL UP TOAST
═══════════════════════════════════════════════════════════ */
function LevelUpToast({levelInfo, onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,5000);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",top:76,left:"50%",transform:"translateX(-50%)",zIndex:500,animation:"levelUp .5s cubic-bezier(.34,1.56,.64,1)",width:"calc(100% - 32px)",maxWidth:388}}>
      <div style={{background:`linear-gradient(135deg,${levelInfo.current.color},${levelInfo.current.color}CC)`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,.3)"}}>
        <div style={{fontSize:44}}>{levelInfo.current.icon}</div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.75)",textTransform:"uppercase",letterSpacing:".08em"}}>Level Up! 🎉</div>
          <div style={{fontWeight:900,fontSize:20,color:"#fff",fontFamily:DF}}>{levelInfo.current.title}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.75)",marginTop:2}}>You reached level {levelInfo.current.level}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BADGE TOAST
═══════════════════════════════════════════════════════════ */
function BadgeToast({badge, onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,4500);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",top:76,left:"50%",transform:"translateX(-50%)",zIndex:500,animation:"levelUp .5s cubic-bezier(.34,1.56,.64,1)",width:"calc(100% - 32px)",maxWidth:388}}>
      <div style={{background:`linear-gradient(135deg,${C.gold},#D4A012)`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,.25)"}}>
        <div style={{fontSize:44}}>{badge.emoji}</div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(0,0,0,.6)",textTransform:"uppercase",letterSpacing:".08em"}}>Badge Unlocked!</div>
          <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF}}>{badge.label}</div>
          <div style={{fontSize:12,color:"rgba(0,0,0,.55)",marginTop:2}}>{badge.desc}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP TIMER
═══════════════════════════════════════════════════════════ */
function StepTimer({seconds}) {
  const [remaining,setRemaining]=useState(seconds);
  const [running,setRunning]=useState(false);
  const [finished,setFinished]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{setRemaining(seconds);setRunning(false);setFinished(false);},[seconds]);
  useEffect(()=>{
    if(running){ref.current=setInterval(()=>setRemaining(r=>{if(r<=1){clearInterval(ref.current);setRunning(false);setFinished(true);return 0;}return r-1;}),1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[running]);
  const pct=Math.max(0,Math.round((1-remaining/seconds)*100));
  const urgent=remaining<=30?C.flame:remaining<=60?C.ember:C.sage;
  if(finished)return<div style={{background:`${C.sage}18`,border:`2px solid ${C.sage}44`,borderRadius:16,padding:"14px 18px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>✅</div><div style={{fontWeight:800,fontSize:15,color:C.sage}}>Timer done! Move to the next step.</div></div>;
  return(
    <div style={{background:running?`${urgent}10`:`${C.sky}0A`,border:`2px solid ${running?urgent:C.sky}44`,borderRadius:16,padding:"14px 18px",transition:"all .3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <span style={{fontSize:22}}>⏱</span>
        <div style={{flex:1}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>Timer</div>
          <div style={{fontWeight:900,fontSize:26,color:running?urgent:C.bark,fontFamily:DF,lineHeight:1}}>{fmt(remaining)}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setRunning(r=>!r)} className="tap" style={{background:running?C.ember:C.sage,border:"none",borderRadius:11,padding:"9px 16px",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",boxShadow:`0 3px 10px ${running?C.ember:C.sage}44`}}>{running?"⏸ Pause":"▶ Start"}</button>
          <button onClick={()=>{setRemaining(seconds);setRunning(false);setFinished(false);}} className="tap" style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>↺</button>
        </div>
      </div>
      <XPBar pct={pct} color={running?urgent:C.sky} h={6}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ONBOARDING
═══════════════════════════════════════════════════════════ */
function Onboarding({onComplete}) {
  const [step,setStep]=useState(0);
  const [profile,setProfile]=useState({skill:"Home Cook"});
  const [goal,setGoal]=useState(STREAK_GOALS[2]);
  const next=()=>setStep(s=>s+1);
  const pct=(step+1)/4;

  const screens=[
    ()=>(
      <div style={{padding:"40px 28px 36px",textAlign:"center"}}>
        <div style={{fontSize:80,marginBottom:16}}>🍳</div>
        <div style={{fontWeight:900,fontSize:32,color:C.bark,fontFamily:DF,lineHeight:1.2,marginBottom:16}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
        <div style={{fontSize:16,color:"#6A5C52",lineHeight:1.7,marginBottom:32}}>Cook more. Level up your skills. Share the journey with friends.</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:36,textAlign:"left"}}>
          {[["🏃","Cooking challenges like Nike Run Club — solo or with friends"],["📸","Share your dishes to a Strava-style social feed"],["📈","Level up skills as you cook. Earn badges automatically."],["🔥","Streak goals that fit your actual life — not just daily."]].map(([e,t])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:14,background:C.cream,borderRadius:14,padding:"13px 16px",border:`1px solid ${C.border}`}}>
              <span style={{fontSize:22,flexShrink:0}}>{e}</span><span style={{fontSize:14,color:C.bark,fontWeight:600}}>{t}</span>
            </div>
          ))}
        </div>
        <Btn onClick={next} full style={{fontSize:16,padding:"15px"}}>Get Started →</Btn>
      </div>
    ),
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48,marginBottom:12}}>🎯</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>How often will you cook?</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>Pick an honest goal. The best streak is one you can actually keep. You can change this any time.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {STREAK_GOALS.map(g=>{
            const active=goal.id===g.id;
            return(
              <button key={g.id} className="tap" onClick={()=>setGoal(g)} style={{background:active?`${g.color}14`:C.cream,border:`2px solid ${active?g.color:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .18s"}}>
                <div style={{width:44,height:44,borderRadius:12,background:active?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}><div style={{fontWeight:900,fontSize:14,color:C.bark}}>{g.label}</div><div style={{fontSize:12,color:C.muted}}>{g.sub}</div></div>
                <div style={{fontWeight:900,fontSize:18,color:active?g.color:C.muted,flexShrink:0,textAlign:"right"}}>{g.target}×<div style={{fontSize:10,color:C.muted,fontWeight:600}}>per week</div></div>
                {active&&<div style={{width:20,height:20,borderRadius:"50%",background:g.color,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <Btn onClick={next} full>Continue →</Btn>
      </div>
    ),
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48,marginBottom:12}}>👨‍🍳</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>How would you rate yourself?</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>Be honest — we'll match your challenges and recipes to your level.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {[
            {id:"Beginner",    label:"Beginner",       sub:"I mostly stick to simple, familiar things",   emoji:"🌱"},
            {id:"Home Cook",   label:"Home Cook",      sub:"I cook regularly and enjoy trying new things", emoji:"🍳"},
            {id:"Intermediate",label:"Intermediate",   sub:"I can tackle most recipes confidently",        emoji:"👨‍🍳"},
            {id:"Advanced",    label:"Advanced",       sub:"I seek out complex techniques and cuisines",   emoji:"⭐"},
            {id:"Chef",        label:"Chef-level",     sub:"Professional background or equivalent skill",  emoji:"🏆"},
          ].map(lvl=>{
            const active=profile.skill===lvl.id;
            return(
              <button key={lvl.id} className="tap" onClick={()=>setProfile(p=>({...p,skill:lvl.id}))} style={{background:active?`${C.flame}12`:C.cream,border:`2px solid ${active?C.flame:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .18s"}}>
                <span style={{fontSize:28}}>{lvl.emoji}</span>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.bark}}>{lvl.label}</div><div style={{fontSize:12,color:C.muted}}>{lvl.sub}</div></div>
                {active&&<div style={{width:20,height:20,borderRadius:"50%",background:C.flame,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
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
          {[["🎯 Cooking goal",goal.label],["👨‍🍳 Skill level",profile.skill],["🌱 Starting level","Novice → work your way up"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:13,opacity:.7}}>{k}</span><span style={{fontSize:13,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:28}}>Start with a challenge. Cook something. Post it to the feed. That's the whole thing.</div>
        <Btn onClick={()=>onComplete({profile,goal})} full style={{fontSize:16,padding:"15px"}}>Let's Cook 🍳</Btn>
      </div>
    ),
  ];

  const Screen=screens[step];
  return(
    <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto"}}>
      {step>0&&<div style={{padding:"20px 24px 0"}}><div style={{background:"#E8DDD4",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:`${pct*100}%`,height:"100%",background:C.flame,borderRadius:99,transition:"width .4s ease"}}/></div></div>}
      <Screen/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RECIPE DETAIL
═══════════════════════════════════════════════════════════ */
function RecipeDetail({recipe, onBack, onComplete}) {
  const [step,setStep]=useState(0);
  const [mode,setMode]=useState("overview");
  const [done,setDone]=useState(recipe.done);
  const [postOpen,setPostOpen]=useState(false);
  const [caption,setCaption]=useState("");
  const [photoPreview,setPhotoPreview]=useState(null);
  const fileRef=useRef();
  const nSteps=(recipe.steps||[]).length;

  const handleFile=(e)=>{
    const file=e.target.files[0];if(!file)return;
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleComplete=()=>{setDone(true);setPostOpen(true);};
  const handlePost=()=>{setPostOpen(false);onComplete(recipe,photoPreview,caption);};
  const handleSkip=()=>{setPostOpen(false);onComplete(recipe,null,"");};

  return(
    <div style={{background:C.paper,minHeight:"100vh"}}>
      <div style={{background:`linear-gradient(160deg,${C.bark},#5A3520)`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,fontSize:108,opacity:.12,lineHeight:1}}>{recipe.emoji}</div>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px",marginBottom:18}}>← Back</button>
        <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
          <DiffBadge level={recipe.difficulty}/>
          {(recipe.diets||[]).filter(d=>d!=="No restrictions").slice(0,3).map(d=><Chip key={d} label={d} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.18)"/>)}
        </div>
        <div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1.25,marginBottom:8,fontFamily:DF}}>{recipe.name}</div>
        <div style={{display:"flex",gap:16,color:"rgba(255,255,255,.65)",fontSize:13}}>
          <span>⏱ {recipe.time}</span><span>⚡ {recipe.xp} XP</span><span>📋 {(recipe.ingredients||[]).length} ingredients</span>
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
            {/* Macros */}
            {recipe.macros&&(
              <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:900,fontSize:14,color:C.bark,marginBottom:12,fontFamily:DF}}>Nutrition per serving</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                  {[["🔥","Cal",recipe.macros.calories,"kcal",C.flame],["💪","Pro",recipe.macros.protein,"g",C.sky],["🌾","Carb",recipe.macros.carbs,"g",C.gold],["🫒","Fat",recipe.macros.fat,"g",C.ember],["🥦","Fiber",recipe.macros.fiber,"g",C.sage]].map(([icon,label,val,unit,color])=>(
                    <div key={label} style={{background:`${color}0D`,borderRadius:12,padding:"10px 4px",textAlign:"center",border:`1.5px solid ${color}22`}}>
                      <div style={{fontSize:18,marginBottom:3}}>{icon}</div>
                      <div style={{fontWeight:900,fontSize:14,color:C.bark}}>{val}</div>
                      <div style={{fontSize:8,color,fontWeight:700,textTransform:"uppercase"}}>{label}</div>
                      <div style={{fontSize:8,color:C.muted}}>{unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Ingredients */}
            <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:12}}>Ingredients</div>
              {(recipe.ingredients||[]).map((ing,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:i<recipe.ingredients.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:C.ember,flexShrink:0,marginTop:7}}/><span style={{fontSize:14,color:C.bark,lineHeight:1.5}}>{ing}</span>
                </div>
              ))}
            </div>
            {/* Steps */}
            <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:14}}>Method</div>
              {(recipe.steps||[]).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:14,marginBottom:i<nSteps-1?20:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14,color:C.bark,marginBottom:4}}>{s.title}</div>
                    <div style={{fontSize:13,color:"#6A5C52",lineHeight:1.65}}>{s.body}</div>
                    {s.timer>0&&<div style={{fontSize:11,color:C.sky,fontWeight:600,marginTop:5}}>⏱ {fmt(s.timer)} timer available in Cook Mode</div>}
                  </div>
                </div>
              ))}
            </div>
            {recipe.tip&&<div style={{background:`${C.gold}18`,border:`1px solid ${C.gold}55`,borderRadius:18,padding:"14px 18px",marginBottom:16}}><div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:6}}>💡 Chef's Tip</div><div style={{fontSize:13,color:"#6A5C52",lineHeight:1.65}}>{recipe.tip}</div></div>}
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

      {/* Post sheet */}
      {postOpen&&(
        <Sheet onClose={handleSkip}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🎉 Dish complete!</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Share it to your feed — show your work</div></div>
              <CloseBtn onClose={handleSkip}/>
            </div>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"16px 18px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:36}}>{recipe.emoji}</span>
              <div><div style={{fontWeight:900,fontSize:16,color:"#fff"}}>{recipe.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:2}}>+{recipe.xp} XP earned</div></div>
            </div>
            {!photoPreview
              ?<div onClick={()=>fileRef.current?.click()} style={{border:`3px dashed ${C.border}`,borderRadius:18,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:C.cream,marginBottom:14}}>
                <div style={{fontSize:40,marginBottom:8}}>📸</div>
                <div style={{fontWeight:800,fontSize:15,color:C.bark,marginBottom:4}}>Add a photo of your dish</div>
                <div style={{fontSize:12,color:C.muted}}>Optional — but your friends will love seeing it</div>
              </div>
              :<div style={{marginBottom:14,position:"relative"}}>
                <img src={photoPreview} alt="dish" style={{width:"100%",height:220,objectFit:"cover",borderRadius:18}}/>
                <button onClick={()=>setPhotoPreview(null)} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.5)",border:"none",borderRadius:99,color:"#fff",width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            }
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Say something about your dish — what worked, what you learned, what you'd do differently next time…" style={{width:"100%",minHeight:88,borderRadius:16,border:`2px solid ${caption?C.ember:C.border}`,background:C.cream,padding:"13px 16px",fontSize:14,color:C.bark,resize:"none",outline:"none",lineHeight:1.55,boxSizing:"border-box",marginBottom:14,transition:"border-color .18s"}}/>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={handleSkip} outline color={C.muted} style={{flex:1}}>Skip</Btn>
              <Btn onClick={handlePost} color={C.sage} style={{flex:2}}>Post to Feed 🚀</Btn>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHALLENGES TAB
═══════════════════════════════════════════════════════════ */
function ChallengeDetail({ch, progress, onBack, onInviteFriend}) {
  const pct = Math.round(Math.min(progress,ch.target)/ch.target*100);
  const done = progress>=ch.target;
  const nextMilestone = ch.milestones.find(m=>m>progress);
  const [showInvite,setShowInvite]=useState(false);

  // Mock friend progress
  const friendData=[{name:"Sofia R.",avatar:"👩‍🍳",prog:Math.min(ch.target,progress+2)},{name:"Jake M.",avatar:"🧑‍🍳",prog:Math.min(ch.target,Math.floor(progress*0.7))}];

  return(
    <div style={{background:C.paper,minHeight:"100vh"}}>
      <div style={{background:`linear-gradient(160deg,${ch.color},${ch.darkColor})`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-10,top:-10,fontSize:120,opacity:.15,lineHeight:1}}>{ch.emoji}</div>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px",marginBottom:18}}>← Back</button>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <Chip label={ch.difficulty} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          <Chip label={ch.duration} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          <Chip label={`${ch.target} ${ch.unit}`} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          {done&&<Chip label="✓ Complete!" color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>}
        </div>
        <div style={{fontSize:26,fontWeight:900,color:"#fff",fontFamily:DF,marginBottom:6}}>{ch.emoji} {ch.name}</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,.85)",lineHeight:1.6}}>{ch.tagline}</div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        {/* Progress card */}
        <div style={{background:C.cream,borderRadius:20,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:900,fontSize:16,color:C.bark,fontFamily:DF}}>Your Progress</div>
            <div style={{fontWeight:900,fontSize:16,color:ch.color}}>{Math.min(progress,ch.target)}/{ch.target}</div>
          </div>
          <XPBar pct={pct} color={ch.color} h={12}/>

          {/* Milestone markers */}
          <div style={{position:"relative",marginTop:14,height:40}}>
            <div style={{position:"absolute",top:12,left:0,right:0,height:2,background:C.border}}/>
            <div style={{position:"absolute",top:12,left:0,width:`${pct}%`,height:2,background:ch.color,transition:"width .9s ease"}}/>
            {ch.milestones.map((m,i)=>{
              const mPct=Math.round(m/ch.target*100);
              const reached=progress>=m;
              return(
                <div key={i} style={{position:"absolute",left:`${mPct}%`,transform:"translateX(-50%)",top:0}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:reached?ch.color:C.border,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800,border:`2px solid ${reached?ch.color:C.border}`,transition:"all .3s",margin:"0 auto 4px"}}>{reached?"✓":m}</div>
                  <div style={{fontSize:9,color:C.muted,textAlign:"center",whiteSpace:"nowrap"}}>{m}</div>
                </div>
              );
            })}
          </div>

          {done&&<div style={{marginTop:14,background:`${C.gold}18`,borderRadius:12,padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>🏅</div><div style={{fontWeight:800,fontSize:14,color:C.bark}}>Challenge Complete! +{ch.xpReward} XP earned</div></div>}
          {!done&&nextMilestone&&<div style={{marginTop:10,fontSize:12,color:C.muted}}>{nextMilestone-progress} more {ch.unit} to your next milestone</div>}
        </div>

        {/* About */}
        <div style={{background:C.cream,borderRadius:20,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:12,fontFamily:DF}}>About this challenge</div>
          {ch.description.split("\n\n").map((para,i)=>(
            <p key={i} style={{fontSize:14,color:"#6A5C52",lineHeight:1.7,margin:"0 0 12px"}}>{para}</p>
          ))}
        </div>

        {/* What you'll learn */}
        {ch.whatYouLearn&&(
          <div style={{background:`${C.sky}0D`,border:`1px solid ${C.sky}28`,borderRadius:20,padding:18,marginBottom:14}}>
            <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:12}}>📚 What you'll learn</div>
            {ch.whatYouLearn.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:i<ch.whatYouLearn.length-1?10:0}}>
                <span style={{color:C.sky,fontWeight:800,flexShrink:0}}>→</span>
                <span style={{fontSize:13,color:"#5A6B7A",lineHeight:1.5}}>{item}</span>
              </div>
            ))}
          </div>
        )}

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
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Invite someone to do this challenge alongside you. You'll see each other's progress here and can hold each other accountable.</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            {friendData.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:`${ch.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{f.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:C.bark}}>{f.name}</span><span style={{fontSize:12,color:ch.color,fontWeight:700}}>{f.prog}/{ch.target}</span></div>
                  <XPBar pct={Math.round(f.prog/ch.target*100)} color={ch.color} h={5}/>
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={()=>setShowInvite(true)} outline color={ch.color} full sm>+ Invite a friend to this challenge</Btn>
        </div>

        <Btn onClick={onBack} full style={{background:ch.color}}>
          {done?"✓ Challenge Complete!":"Start cooking towards this 🍳"}
        </Btn>
      </div>

      {showInvite&&(
        <Sheet onClose={()=>setShowInvite(false)}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>⚔️ Invite to Challenge</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Pick someone to race against</div></div>
              <CloseBtn onClose={()=>setShowInvite(false)}/>
            </div>
            {["Sofia R.","Jake M.","Priya K.","Marcus T.","Yuki A."].map(name=>(
              <button key={name} onClick={()=>{onInviteFriend(name,ch);setShowInvite(false);}} className="tap" style={{display:"flex",alignItems:"center",gap:14,background:C.cream,border:`2px solid ${C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",width:"100%",marginBottom:10,transition:"all .18s"}}>
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

function ChallengesTab({challengeProgress, onInviteFriend}) {
  const [selected,setSelected]=useState(null);
  if(selected){
    const ch=CHALLENGES.find(c=>c.id===selected);
    return <ChallengeDetail ch={ch} progress={challengeProgress[selected]||0} onBack={()=>setSelected(null)} onInviteFriend={onInviteFriend}/>;
  }

  const active=CHALLENGES.filter(ch=>(challengeProgress[ch.id]||0)>0&&(challengeProgress[ch.id]||0)<ch.target);
  const available=CHALLENGES.filter(ch=>!(challengeProgress[ch.id]||0)>0);
  const completed=CHALLENGES.filter(ch=>(challengeProgress[ch.id]||0)>=ch.target);

  const ChalCard=({ch})=>{
    const prog=challengeProgress[ch.id]||0;
    const pct=Math.round(Math.min(prog,ch.target)/ch.target*100);
    const isDone=prog>=ch.target;
    return(
      <div onClick={()=>setSelected(ch.id)} className="tap ch" style={{background:C.cream,borderRadius:20,overflow:"hidden",cursor:"pointer",border:`2px solid ${ch.color}22`,boxShadow:`0 4px 18px ${ch.color}10`,marginBottom:12,transition:"transform .18s,box-shadow .18s"}}>
        <div style={{background:`linear-gradient(135deg,${ch.color},${ch.darkColor})`,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-10,top:-10,fontSize:70,opacity:.2,lineHeight:1}}>{ch.emoji}</div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <Chip label={ch.difficulty} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
            <Chip label={`+${ch.xpReward} XP`} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
            {isDone&&<Chip label="✓ Done" color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>}
          </div>
          <div style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:DF,marginBottom:4}}>{ch.emoji} {ch.name}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.8)"}}>{ch.tagline}</div>
        </div>
        {(prog>0)&&(
          <div style={{padding:"12px 18px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:700,color:C.bark}}>{Math.min(prog,ch.target)}/{ch.target} {ch.unit}</span>
              <span style={{fontSize:12,color:ch.color,fontWeight:700}}>{pct}%</span>
            </div>
            <XPBar pct={pct} color={ch.color} h={7}/>
          </div>
        )}
        {!prog&&<div style={{padding:"10px 18px 14px",fontSize:12,color:C.muted}}>Tap to read more and start →</div>}
      </div>
    );
  };

  return(
    <div style={{paddingBottom:30}}>
      <div style={{margin:"4px 16px 22px",background:C.dark,borderRadius:22,padding:"22px 20px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:110,opacity:.07,lineHeight:1}}>🏃</div>
        <div style={{fontSize:11,opacity:.5,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Cooking Challenges</div>
        <div style={{fontWeight:900,fontSize:24,fontFamily:DF,marginBottom:8,lineHeight:1.2}}>Cook your way to the finish line</div>
        <div style={{fontSize:13,opacity:.7,lineHeight:1.6,marginBottom:18}}>Like Nike Run Club, but for cooking. Start at any level. Each challenge has full explanations of what you'll learn and why. Invite friends for accountability.</div>
        <div style={{display:"flex",gap:10}}>
          {[["🏃","5 to 30 meals"],["⚔️","Challenge friends"],["🏅","Earn badges"]].map(([e,t])=>(
            <div key={t} style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:4}}>{e}</div>
              <div style={{fontSize:10,fontWeight:700,opacity:.7}}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        {active.length>0&&(
          <>
            <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:3,fontFamily:DF}}>In Progress</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Keep going — you're on the board.</div>
            {active.map(ch=><ChalCard key={ch.id} ch={ch}/>)}
          </>
        )}

        {completed.length>0&&(
          <>
            <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:3,fontFamily:DF,marginTop:active.length?20:0}}>Completed</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>These are done. You earned them.</div>
            {completed.map(ch=><ChalCard key={ch.id} ch={ch}/>)}
          </>
        )}

        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:3,fontFamily:DF,marginTop:(active.length||completed.length)?20:0}}>All Challenges</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Any level. Solo or with a friend. Tap to read about each one.</div>
        {available.map(ch=><ChalCard key={ch.id} ch={ch}/>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SOCIAL FEED (Duolingo + Strava style)
═══════════════════════════════════════════════════════════ */
function FeedTab({posts, setPosts, xp, weeklyXp, levelInfo}) {
  const [showComments,setShowComments]=useState(null);
  const [newComment,setNewComment]=useState("");
  const [activeLeagueTab,setActiveLeagueTab]=useState("league"); // league | following
  const league=getLeague(5); // rank 5

  const giveKudos=(pid)=>setPosts(ps=>ps.map(p=>p.id!==pid?p:{...p,kudos:p.myKudos?p.kudos-1:p.kudos+1,myKudos:!p.myKudos}));
  const addComment=(pid)=>{
    if(!newComment.trim())return;
    setPosts(ps=>ps.map(p=>p.id!==pid?p:{...p,comments:[...(p.comments||[]),{user:"You",text:newComment.trim()}]}));
    setNewComment("");
  };

  return(
    <div style={{paddingBottom:24}}>
      {/* League card */}
      <div style={{margin:"4px 16px 20px",background:`linear-gradient(135deg,${league.color}22,${league.color}0A)`,border:`2px solid ${league.color}44`,borderRadius:20,padding:"18px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{fontSize:44}}>{league.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF}}>{league.name}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Your weekly XP earns your place. Top 5 promote next week.</div>
          </div>
        </div>

        {/* Tab toggle */}
        <div style={{display:"flex",background:C.pill,borderRadius:12,padding:3,gap:3,marginBottom:14}}>
          {[["league","🏆 League"],["following","👥 Following"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setActiveLeagueTab(id)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:10,padding:"8px",fontWeight:800,fontSize:12,background:activeLeagueTab===id?"#fff":"transparent",color:activeLeagueTab===id?C.bark:C.muted,boxShadow:activeLeagueTab===id?"0 2px 6px rgba(0,0,0,.07)":"none",transition:"all .18s"}}>{lbl}</button>
          ))}
        </div>

        {activeLeagueTab==="league"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,color:C.muted,fontWeight:600}}>Your weekly XP</span>
              <span style={{fontSize:14,fontWeight:800,color:league.color}}>{weeklyXp} XP this week</span>
            </div>
            {MOCK_LEAGUE.map((u,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:u.isMe?`${league.color}12`:"transparent",borderRadius:10,padding:u.isMe?"8px 10px":"4px 10px",marginBottom:4,border:u.isMe?`1.5px solid ${league.color}33`:"none"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:i<3?["#F5C842","#A8A9AD","#CD7F32"][i]:C.pill,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:i<3?"#fff":C.muted,flexShrink:0}}>{u.rank}</div>
                <span style={{fontSize:20}}>{u.avatar}</span>
                <span style={{flex:1,fontWeight:u.isMe?900:600,fontSize:13,color:u.isMe?C.bark:C.bark}}>{u.name}</span>
                <span style={{fontSize:11,color:C.muted}}>🔥{u.streak}</span>
                <span style={{fontWeight:800,fontSize:13,color:u.isMe?league.color:C.muted}}>{u.weeklyXp}</span>
              </div>
            ))}
          </div>
        )}

        {activeLeagueTab==="following"&&(
          <div>
            <div style={{fontSize:12,color:C.muted,marginBottom:12}}>People you follow — see what they cooked this week.</div>
            {[{name:"Sofia R.",avatar:"👩‍🍳",cooked:4,xp:620},{name:"Jake M.",avatar:"🧑‍🍳",cooked:2,xp:110},{name:"Priya K.",avatar:"👩‍🦱",cooked:3,xp:195}].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                <span style={{fontSize:22}}>{f.avatar}</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:C.bark}}>{f.name}</div><div style={{fontSize:11,color:C.muted}}>{f.cooked} dishes this week</div></div>
                <span style={{fontSize:13,fontWeight:800,color:C.sage}}>{f.xp} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Level progress in feed */}
      <div style={{margin:"0 16px 20px",background:C.cream,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:`${levelInfo.current.color}18`,border:`2px solid ${levelInfo.current.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{levelInfo.current.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:800,fontSize:14,color:C.bark}}>Level {levelInfo.current.level} · {levelInfo.current.title}</span>
              {levelInfo.next&&<span style={{fontSize:12,color:C.muted}}>{levelInfo.xpIntoLevel}/{levelInfo.xpForLevel} XP</span>}
            </div>
            <div style={{marginTop:6}}><XPBar pct={levelInfo.pct} color={levelInfo.current.color} h={7}/></div>
            {levelInfo.next&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>Next: {levelInfo.next.title} {levelInfo.next.icon}</div>}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{padding:"0 16px"}}>
        <div style={{fontWeight:900,fontSize:20,color:C.bark,marginBottom:16,fontFamily:DF}}>Following</div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {posts.map((post,idx)=>(
            <div key={post.id} style={{background:"#fff",borderRadius:20,overflow:"hidden",border:`1px solid ${C.border}`,animation:`fadeUp .35s ease ${idx*.06}s both`,boxShadow:"0 2px 16px rgba(0,0,0,.06)"}}>
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
                :<div style={{background:`linear-gradient(135deg,#F0E8E0,#E8DDD4)`,height:200,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
                  <span style={{fontSize:72}}>{post.emoji}</span>
                  <span style={{fontSize:14,fontWeight:700,color:C.bark,opacity:.35}}>{post.recipe}</span>
                </div>
              }

              <div style={{padding:"12px 16px 0"}}>
                {post.caption&&<div style={{fontSize:14,color:C.bark,lineHeight:1.55,marginBottom:12}}><span style={{fontWeight:700}}>{post.user.name.split(" ")[0]}</span> {post.caption}</div>}
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
                  <button onClick={()=>giveKudos(post.id)} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
                    <span style={{fontSize:22,transition:"transform .2s",transform:post.myKudos?"scale(1.1)":"scale(1)"}}>{post.myKudos?"👏":"🤍"}</span>
                    <span style={{fontSize:13,fontWeight:700,color:post.myKudos?C.flame:C.muted}}>{post.kudos} kudo{post.kudos!==1?"s":""}</span>
                  </button>
                  <button onClick={()=>setShowComments(showComments===post.id?null:post.id)} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
                    <span style={{fontSize:20}}>💬</span>
                    <span style={{fontSize:13,fontWeight:700,color:C.muted}}>{(post.comments||[]).length}</span>
                  </button>
                </div>
                {showComments===post.id&&(
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,paddingBottom:14}}>
                    {(post.comments||[]).map((c,i)=>(
                      <div key={i} style={{marginBottom:8,lineHeight:1.5}}>
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

/* ═══════════════════════════════════════════════════════════
   SKILLS TAB
═══════════════════════════════════════════════════════════ */
function SkillsTab({skillData, earnedBadges, xp, levelInfo}) {
  return(
    <div style={{paddingBottom:30}}>
      {/* Level card */}
      <div style={{margin:"4px 16px 20px",background:`linear-gradient(135deg,${levelInfo.current.color},${levelInfo.current.color}AA)`,borderRadius:20,padding:"20px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
          <div style={{fontSize:52}}>{levelInfo.current.icon}</div>
          <div>
            <div style={{fontSize:11,opacity:.7,textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>Level {levelInfo.current.level}</div>
            <div style={{fontWeight:900,fontSize:24,fontFamily:DF}}>{levelInfo.current.title}</div>
            <div style={{fontSize:12,opacity:.7,marginTop:2}}>{xp.toLocaleString()} total XP</div>
          </div>
        </div>
        {levelInfo.next&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,opacity:.7}}>Progress to {levelInfo.next.title} {levelInfo.next.icon}</span>
              <span style={{fontSize:12,fontWeight:700}}>{levelInfo.xpIntoLevel}/{levelInfo.xpForLevel} XP</span>
            </div>
            <div style={{background:"rgba(255,255,255,.2)",borderRadius:99,height:10,overflow:"hidden"}}>
              <div style={{width:`${levelInfo.pct}%`,height:"100%",background:"#fff",borderRadius:99,transition:"width .9s ease"}}/>
            </div>
            <div style={{fontSize:11,opacity:.6,marginTop:6}}>{levelInfo.xpForLevel-levelInfo.xpIntoLevel} XP to next level</div>
          </>
        )}
        {!levelInfo.next&&<div style={{fontSize:13,opacity:.75,fontWeight:700}}>🏆 Maximum level reached!</div>}
      </div>

      {/* How XP works */}
      <div style={{margin:"0 16px 20px",background:`${C.sky}0E`,border:`1.5px solid ${C.sky}30`,borderRadius:18,padding:"14px 16px"}}>
        <div style={{fontWeight:800,fontSize:14,color:C.bark,marginBottom:8}}>⚡ How XP works</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[["Easy recipe","30–50 XP"],["Medium recipe","60–90 XP"],["Hard recipe","90–130 XP"],["Complete a challenge","200–1500 XP"],["7-day streak","Bonus 100 XP"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:12,color:C.muted}}>{k}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.sky}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        {/* Skill tree */}
        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:4,fontFamily:DF}}>Skill Tree</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Every recipe you cook automatically levels up that cuisine's skill. Cook 2 dishes in a category to reach level 1.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:28}}>
          {Object.entries(SKILL_MAP).map(([cat,skill])=>{
            const count=skillData[`${cat}_count`]||0;
            const level=calcSkillLevel(count);
            const progressInLevel=count-(level*2);
            const pctToNext=level>=5?100:Math.round(progressInLevel/2*100);
            return(
              <div key={cat} style={{background:C.cream,border:`2px solid ${level>0?skill.color+"44":C.border}`,borderRadius:18,padding:"16px 14px",opacity:level===0?.55:1,transition:"all .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <span style={{fontSize:26}}>{skill.icon}</span>
                  <div style={{background:level>0?skill.color:C.muted,borderRadius:99,padding:"3px 9px",fontSize:11,fontWeight:800,color:"#fff"}}>{level===0?"Locked":`Lv ${level}`}</div>
                </div>
                <div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:2}}>{skill.label}</div>
                <div style={{fontSize:10,color:C.muted,marginBottom:8}}>{level===0?"Cook a dish to unlock":level>=5?"Max level! ⭐":`${count} cooked · ${progressInLevel}/2 to Lv ${level+1}`}</div>
                <div style={{display:"flex",gap:3}}>
                  {[1,2,3,4,5].map(n=><div key={n} style={{flex:1,height:5,borderRadius:99,background:n<=level?skill.color:"#E8DDD4",transition:"background .4s"}}/>)}
                </div>
                {level>0&&level<5&&<div style={{marginTop:6}}><XPBar pct={pctToNext} color={skill.color} h={3}/></div>}
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:4,fontFamily:DF}}>Badges</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Auto-unlock as you cook, level up, and complete challenges. No claiming needed.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {BADGE_RULES.map(b=>{
            const earned=earnedBadges.includes(b.id);
            return(
              <div key={b.id} style={{background:earned?C.cream:"#F0EBE6",border:`2px solid ${earned?C.gold:"#E0D5CB"}`,borderRadius:16,padding:"14px 8px",textAlign:"center",opacity:earned?1:.45,boxShadow:earned?`0 4px 14px ${C.gold}30`:"none",transition:"all .3s"}}>
                <div style={{fontSize:24,marginBottom:5,filter:earned?"none":"grayscale(1)"}}>{b.emoji}</div>
                <div style={{fontSize:9,fontWeight:700,color:C.bark,lineHeight:1.3,marginBottom:3}}>{b.label}</div>
                {earned?<div style={{fontSize:8,color:C.gold,fontWeight:700}}>EARNED</div>:<div style={{fontSize:8,color:C.muted,lineHeight:1.4}}>{b.desc}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME TAB
═══════════════════════════════════════════════════════════ */
function HomeTab({xp,setXp,recipes,onOpen,onComplete,goal,cookedDays,setCookedDays,onEditGoal,challengeProgress,levelInfo}) {
  const [completing,setCompleting]=useState(null);

  const quickComplete=(e,r)=>{
    e.stopPropagation();if(completing)return;
    setCompleting(r.id);
    setTimeout(()=>{
      setXp(x=>x+r.xp);
      const di=new Date().getDay();const idx=di===0?6:di-1;
      setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});
      onComplete(r,null,"");
      setCompleting(null);
    },900);
  };

  const weekDone=cookedDays.filter(Boolean).length;
  const pct=Math.min(100,weekDone/goal.target*100);
  const goalComplete=weekDone>=goal.target;
  const activeChall=CHALLENGES.find(ch=>(challengeProgress[ch.id]||0)>0&&(challengeProgress[ch.id]||0)<ch.target);

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
          <div style={{width:`${pct}%`,height:"100%",background:goalComplete?C.gold:goal.color,borderRadius:99,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/>
        </div>
        <div style={{fontSize:11,opacity:.6,marginBottom:14}}>{goalComplete?"🎉 Goal smashed this week!":`${goal.target-weekDone} more cook${goal.target-weekDone===1?"":"s"} to hit your goal`}</div>
        <div style={{display:"flex",gap:5,marginBottom:16}}>
          {WEEK_LABELS.map((d,i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <div style={{height:26,borderRadius:7,background:cookedDays[i]?goal.color:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{cookedDays[i]?"✓":""}</div>
              <div style={{fontSize:8,marginTop:3,opacity:.45}}>{d}</div>
            </div>
          ))}
        </div>
        {/* Level & XP in streak card */}
        <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:14}}>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Total XP</div><div style={{fontSize:20,fontWeight:900}}>{xp.toLocaleString()}</div></div>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Level</div><div style={{fontSize:20,fontWeight:900}}>{levelInfo.current.icon} {levelInfo.current.title}</div></div>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Cooked</div><div style={{fontSize:20,fontWeight:900}}>{recipes.filter(r=>r.done).length}</div></div>
        </div>
      </div>

      {/* XP progress to next level */}
      {levelInfo.next&&(
        <div style={{margin:"0 16px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:C.muted,fontWeight:600}}>Next: {levelInfo.next.title} {levelInfo.next.icon}</span>
            <span style={{fontSize:12,color:levelInfo.current.color,fontWeight:700}}>{levelInfo.xpIntoLevel}/{levelInfo.xpForLevel} XP</span>
          </div>
          <XPBar pct={levelInfo.pct} color={levelInfo.current.color}/>
        </div>
      )}

      {/* Active challenge teaser */}
      {activeChall&&(
        <div style={{margin:"0 16px 18px",background:`${activeChall.color}0F`,border:`2px solid ${activeChall.color}33`,borderRadius:16,padding:"14px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:28}}>{activeChall.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{activeChall.name}</div>
              <div style={{fontSize:11,color:activeChall.color,fontWeight:600,marginTop:2}}>{challengeProgress[activeChall.id]}/{activeChall.target} {activeChall.unit} complete</div>
              <div style={{marginTop:6}}><XPBar pct={Math.round((challengeProgress[activeChall.id]||0)/activeChall.target*100)} color={activeChall.color} h={5}/></div>
            </div>
          </div>
        </div>
      )}

      {/* Today's queue */}
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:18,fontWeight:900,color:C.bark,margin:0,fontFamily:DF}}>Cook Today</h2>
          <span style={{fontSize:12,color:C.flame,fontWeight:700}}>{recipes.filter(r=>!r.done).length} remaining</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {recipes.slice(0,6).map(r=>(
            <div key={r.id} onClick={()=>onOpen(r)} className="ch" style={{background:r.done?"#F5F0EB":C.cream,border:`2px solid ${r.done?"#E0D5CB":C.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,opacity:r.done?.65:1,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)",transition:"transform .18s,box-shadow .18s"}}>
              <div style={{width:52,height:52,borderRadius:14,background:r.done?"#E0D5CB":`${C.ember}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{r.done?"✅":r.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:15,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                <div style={{display:"flex",gap:8,marginTop:4}}><span style={{fontSize:11,color:C.muted}}>⏱ {r.time}</span><DiffBadge level={r.difficulty}/></div>
                {r.macros&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>🔥 {r.macros.calories} kcal · 💪 {r.macros.protein}g protein</div>}
              </div>
              {!r.done&&(
                <button onClick={e=>quickComplete(e,r)} className="tap" style={{background:completing===r.id?C.sage:C.flame,color:"#fff",border:"none",borderRadius:12,padding:"8px 14px",fontWeight:800,fontSize:12,cursor:"pointer",flexShrink:0,boxShadow:`0 3px 10px ${C.flame}44`,transition:"background .2s"}}>
                  {completing===r.id?`+${r.xp}xp!`:`Cook · ${r.xp}xp`}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RECIPES TAB
═══════════════════════════════════════════════════════════ */
function RecipesTab({allRecipes, onOpen}) {
  const CATS=["All","Breakfast","Quick","Asian","Indian","Japanese","Italian","Mexican","Mediterranean","Comfort","Healthy","Baking"];
  const DIETS=["All","Vegetarian","Vegan","Gluten-free","Keto","Dairy-free","High Protein"];
  const [cat,setCat]=useState("All");
  const [diet,setDiet]=useState("All");
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("default");

  const filtered=useMemo(()=>{
    let rs=allRecipes.filter(r=>{
      const mc=cat==="All"||r.category===cat;
      const md=diet==="All"
        ||(r.diets||[]).includes(diet)
        ||(diet==="High Protein"&&r.macros&&r.macros.protein>=25);
      return mc&&md&&r.name.toLowerCase().includes(search.toLowerCase());
    });
    if(sort==="cals")   rs=[...rs].sort((a,b)=>(a.macros?.calories||0)-(b.macros?.calories||0));
    if(sort==="protein")rs=[...rs].sort((a,b)=>(b.macros?.protein||0)-(a.macros?.protein||0));
    if(sort==="xp")     rs=[...rs].sort((a,b)=>b.xp-a.xp);
    if(sort==="easy")   rs=[...rs].sort((a,b)=>({Easy:0,Medium:1,Hard:2}[a.difficulty]||0)-({Easy:0,Medium:1,Hard:2}[b.difficulty]||0));
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
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 16px 8px"}}>{CATS.map(c=><button key={c} onClick={()=>setCat(c)} className="tap" style={{whiteSpace:"nowrap",padding:"7px 14px",borderRadius:99,border:`2px solid ${cat===c?C.flame:C.border}`,background:cat===c?C.flame:C.cream,color:cat===c?"#fff":C.muted,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{c}</button>)}</div>
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 16px 8px"}}>{DIETS.map(d=><button key={d} onClick={()=>setDiet(d)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 12px",borderRadius:99,border:`2px solid ${diet===d?C.sage:C.border}`,background:diet===d?`${C.sage}18`:"transparent",color:diet===d?C.sage:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{d==="All"?"🍽️ All":d}</button>)}</div>
      <div style={{display:"flex",gap:8,padding:"0 16px 12px",alignItems:"center",overflowX:"auto"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:700,flexShrink:0}}>Sort:</span>
        {[["default","Default"],["easy","Easiest"],["cals","Lowest Cal"],["protein","Most Protein"],["xp","Most XP"]].map(([k,lbl])=><button key={k} onClick={()=>setSort(k)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 10px",borderRadius:99,border:`1.5px solid ${sort===k?C.sky:C.border}`,background:sort===k?`${C.sky}18`:"transparent",color:sort===k?C.sky:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{lbl}</button>)}
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:12,color:C.muted,fontWeight:600,marginBottom:10}}>{filtered.length} recipe{filtered.length!==1?"s":""}</div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}><div style={{fontSize:44,marginBottom:12}}>🍽️</div><div style={{fontWeight:700,marginBottom:4}}>No recipes match</div><div style={{fontSize:13}}>Try adjusting the filters</div></div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((r,idx)=>(
            <div key={r.id} className="ch" onClick={()=>onOpen(r)} style={{background:r.done?"#F5F0EB":C.cream,border:`2px solid ${r.done?"#E0D5CB":C.border}`,borderRadius:18,padding:"15px",display:"flex",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)",animation:`fadeUp .3s ease ${idx*.04}s both`,transition:"transform .18s,box-shadow .18s"}}>
              <div style={{width:58,height:58,borderRadius:16,background:r.done?"#E8E0D8":`${C.ember}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{r.done?"✅":r.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:15,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:5}}>{r.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:5}}>
                  <DiffBadge level={r.difficulty}/>
                  {(r.diets||[]).filter(d=>d!=="No restrictions").slice(0,2).map(d=><Chip key={d} label={d} color={C.sage}/>)}
                </div>
                {r.macros&&(
                  <div style={{display:"flex",gap:5,marginBottom:5,flexWrap:"wrap"}}>
                    {[["🔥",r.macros.calories,"kcal",C.flame],["💪",r.macros.protein,"g protein",C.sky],["🌾",r.macros.carbs,"g carbs",C.gold]].map(([icon,val,unit,color])=>(
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

/* ═══════════════════════════════════════════════════════════
   GOAL PICKER
═══════════════════════════════════════════════════════════ */
function GoalPicker({goal,onSelect,onClose}) {
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🎯 Your Cooking Goal</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>Choose a rhythm that fits your real life</div></div>
          <CloseBtn onClose={onClose}/>
        </div>
        <div style={{background:`${C.sky}14`,border:`1.5px solid ${C.sky}33`,borderRadius:14,padding:"12px 14px",marginBottom:18,marginTop:12}}>
          <div style={{fontSize:12,color:C.sky,fontWeight:700,lineHeight:1.5}}>💡 The best habit is the one you can actually keep. A weekly cook beats an abandoned daily streak every time. You can change this at any time.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {STREAK_GOALS.map(g=>{
            const active=goal.id===g.id;
            return(
              <button key={g.id} className="tap" onClick={()=>onSelect(g)} style={{background:active?`${g.color}14`:C.cream,border:`2px solid ${active?g.color:C.border}`,borderRadius:18,padding:"15px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all .18s"}}>
                <div style={{width:48,height:48,borderRadius:14,background:active?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}><div style={{fontWeight:900,fontSize:15,color:C.bark}}>{g.label}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{g.sub}</div></div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:900,fontSize:20,color:active?g.color:C.muted}}>{g.target}×</div><div style={{fontSize:10,color:C.muted}}>/week</div></div>
                {active&&<div style={{width:22,height:22,borderRadius:"50%",background:g.color,color:"#fff",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [onboarded,     setOnboarded]     = useState(false);
  const [tab,           setTab]           = useState("home");
  const [mounted,       setMounted]       = useState(false);
  const [xp,            setXp]            = useState(0);
  const [weeklyXp,      setWeeklyXp]      = useState(130);
  const [allRecipes,    setAllRecipes]    = useState(RECIPES);
  const [detailRecipe,  setDetailRecipe]  = useState(null);
  const [showGoal,      setShowGoal]      = useState(false);
  const [posts,         setPosts]         = useState(SEED_POSTS);
  const [goal,          setGoal]          = useState(STREAK_GOALS[2]);
  const [cookedDays,    setCookedDays]    = useState([false,false,false,false,false,false,false]);
  const [skillData,     setSkillData]     = useState({});
  const [challengeProgress,setChallengeProgress] = useState({});
  const [earnedBadges,  setEarnedBadges]  = useState([]);
  const [levelUpToast,  setLevelUpToast]  = useState(null);
  const [badgeToast,    setBadgeToast]    = useState(null);
  const prevLevelRef = useRef(null);

  useEffect(()=>{ setTimeout(()=>setMounted(true),60); },[]);

  const levelInfo = useMemo(()=>getLevelInfo(xp),[xp]);

  // Level up detection
  useEffect(()=>{
    if(prevLevelRef.current!==null && levelInfo.current.level > prevLevelRef.current){
      setLevelUpToast(levelInfo);
    }
    prevLevelRef.current=levelInfo.current.level;
  },[levelInfo]);

  const checkBadges = useCallback((stats) => {
    const newOnes = BADGE_RULES.filter(b=>!earnedBadges.includes(b.id)&&b.check(stats));
    if(newOnes.length>0){
      setEarnedBadges(prev=>[...prev,...newOnes.map(b=>b.id)]);
      if(!levelUpToast) setBadgeToast(newOnes[0]);
    }
  },[earnedBadges,levelUpToast]);

  const handleComplete = useCallback((recipe, photoUrl, caption) => {
    setAllRecipes(rs=>rs.map(r=>r.id===recipe.id?{...r,done:true}:r));
    const newXp = xp + recipe.xp;
    setXp(newXp);
    setWeeklyXp(w=>w+recipe.xp);

    const di=new Date().getDay();const idx=di===0?6:di-1;
    setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});

    // Update skills
    const cat=recipe.category;
    let newSkillData=skillData;
    if(cat&&SKILL_MAP[cat]){
      const newCount=(skillData[`${cat}_count`]||0)+1;
      const newLevel=calcSkillLevel(newCount);
      newSkillData={...skillData,[cat]:newLevel,[`${cat}_count`]:newCount};
      setSkillData(newSkillData);
    }

    // Update challenge progress
    const newCP={...challengeProgress};
    CHALLENGES.forEach(ch=>{
      const curr=newCP[ch.id]||0;
      if(curr>=ch.target)return;
      if(ch.category&&recipe.category!==ch.category)return;
      newCP[ch.id]=curr+1;
    });
    setChallengeProgress(newCP);

    // Post to feed
    if(photoUrl||caption){
      setPosts(ps=>[{
        id:`p-${Date.now()}`,
        user:{name:"You",avatar:"👩‍🍳",level:levelInfo.current.title},
        recipe:recipe.name,emoji:recipe.emoji,photo:photoUrl,
        caption:caption||`Just cooked ${recipe.name} 🎉`,
        time:"just now",kudos:0,myKudos:false,comments:[],
      },...ps]);
    }

    // Check badges
    const totalCooked=allRecipes.filter(r=>r.done).length+1;
    const cats=Object.keys(SKILL_MAP).reduce((acc,c)=>{acc[c]=(newSkillData[`${c}_count`]||0);return acc;},{});
    const uniqueCuisines=Object.values(cats).filter(v=>v>0).length;
    const currentStreakCount=cookedDays.filter(Boolean).length+1;
    const doneChalls=Object.keys(newCP).filter(id=>(newCP[id]||0)>=(CHALLENGES.find(c=>c.id===id)?.target||99));
    checkBadges({
      totalCooked, currentStreak:currentStreakCount, uniqueCuisines,
      catCounts:cats, doneChalls, level:getLevelInfo(newXp).current.level,
      totalKudosReceived:posts.reduce((a,p)=>a+(p.user.name==="You"?p.kudos:0),0),
    });
  },[xp,allRecipes,cookedDays,skillData,challengeProgress,posts,levelInfo,checkBadges]);

  const openRecipe = useCallback((recipe)=>setDetailRecipe(allRecipes.find(r=>r.id===recipe.id)||recipe),[allRecipes]);

  const handleInviteFriend=(name,ch)=>{
    alert(`Invite sent to ${name}! They'll be notified to join "${ch.name}" with you. 💪`);
  };

  const TABS=[
    {id:"home",       label:"Today",      emoji:"🍳"},
    {id:"recipes",    label:"Recipes",    emoji:"📖"},
    {id:"challenges", label:"Challenges", emoji:"🏃"},
    {id:"feed",       label:"Feed",       emoji:"👥"},
    {id:"skills",     label:"Skills",     emoji:"📈"},
  ];

  const weekDone=cookedDays.filter(Boolean).length;

  if(!onboarded) return(
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
          <RecipeDetail recipe={live} onBack={()=>setDetailRecipe(null)} onComplete={(r,p,c)=>{handleComplete(r,p,c);setDetailRecipe(null);}}/>
        </div>
      </>
    );
  }

  return(
    <>
      <style>{CSS}</style>
      {levelUpToast&&<LevelUpToast levelInfo={levelUpToast} onClose={()=>setLevelUpToast(null)}/>}
      {badgeToast&&!levelUpToast&&<BadgeToast badge={badgeToast} onClose={()=>setBadgeToast(null)}/>}

      <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto",opacity:mounted?1:0,transform:mounted?"none":"translateY(10px)",transition:"all .35s cubic-bezier(.4,0,.2,1)"}}>
        {/* Header */}
        <div style={{background:C.paper,padding:"15px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontWeight:900,fontSize:22,color:C.bark,letterSpacing:"-.03em",fontFamily:DF}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
            <div style={{fontSize:11,color:C.muted,marginTop:-1}}>your daily cooking habit</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* Level badge */}
            <div style={{background:`${levelInfo.current.color}18`,border:`1.5px solid ${levelInfo.current.color}44`,borderRadius:10,padding:"5px 10px",fontSize:12,fontWeight:800,color:levelInfo.current.color}}>
              {levelInfo.current.icon} Lv.{levelInfo.current.level}
            </div>
            {/* Streak pill */}
            <div onClick={()=>setShowGoal(true)} className="tap" style={{background:`linear-gradient(135deg,${goal.color},${goal.color}BB)`,borderRadius:12,padding:"6px 12px",color:"#fff",fontWeight:800,fontSize:13,boxShadow:`0 4px 12px ${goal.color}44`,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"}}>
              {goal.icon} {weekDone}/{goal.target}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{minHeight:"calc(100vh - 118px)",paddingTop:14}}>
          {tab==="home"&&<HomeTab xp={xp} setXp={setXp} recipes={allRecipes} onOpen={openRecipe} onComplete={handleComplete} goal={goal} cookedDays={cookedDays} setCookedDays={setCookedDays} onEditGoal={()=>setShowGoal(true)} challengeProgress={challengeProgress} levelInfo={levelInfo}/>}
          {tab==="recipes"&&<RecipesTab allRecipes={allRecipes} onOpen={openRecipe}/>}
          {tab==="challenges"&&<ChallengesTab challengeProgress={challengeProgress} onInviteFriend={handleInviteFriend}/>}
          {tab==="feed"&&<FeedTab posts={posts} setPosts={setPosts} xp={xp} weeklyXp={weeklyXp} levelInfo={levelInfo}/>}
          {tab==="skills"&&<SkillsTab skillData={skillData} earnedBadges={earnedBadges} xp={xp} levelInfo={levelInfo}/>}
        </div>

        {/* Bottom nav */}
        <div style={{position:"sticky",bottom:0,background:C.cream,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 12px",zIndex:50}}>
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
    </>
  );
}