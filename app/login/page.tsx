'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══ DESIGN TOKENS ═══════════════════════════════════════════════════════ */
const C = {
  flame:"#FF4D1C", ember:"#FF8C42", cream:"#FFF8F0", paper:"#FAF4EE",
  bark:"#3B2A1A",  sage:"#5C7A4E",  moss:"#8BAF78",  gold:"#F5C842",
  muted:"#9E8C7E", border:"#EEE5DC",pill:"#F0EBE6",  sky:"#4A90D9",
  plum:"#9B5DE5",  rose:"#E05C7A",  dark:"#111118",  card:"#1C1C28",
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
  @keyframes shimmer{0%{opacity:.7}100%{opacity:1}}
  @keyframes badgePop{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.2) rotate(3deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
  .ch:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(0,0,0,.11)!important}
  .tap:active{transform:scale(.94)!important}
  input,textarea,button{font-family:inherit}
`;

/* ═══ SKILL SYSTEM ════════════════════════════════════════════════════════ */
const SKILL_MAP = {
  Asian:         {label:"Asian Cooking",    icon:"🥢", color:C.flame},
  Indian:        {label:"Indian Cooking",   icon:"🫙", color:C.ember},
  Japanese:      {label:"Japanese Cooking", icon:"🍱", color:C.rose},
  Italian:       {label:"Italian Cooking",  icon:"🍝", color:C.sage},
  Mexican:       {label:"Mexican Cooking",  icon:"🌮", color:C.gold},
  Mediterranean: {label:"Mediterranean",    icon:"🫒", color:"#00A896"},
  Comfort:       {label:"Comfort Food",     icon:"🍲", color:C.plum},
  Healthy:       {label:"Healthy Cooking",  icon:"🥗", color:C.moss},
  Breakfast:     {label:"Breakfast Skills", icon:"🍳", color:C.ember},
  Baking:        {label:"Baking & Pastry",  icon:"🍞", color:C.gold},
  Quick:         {label:"Speed Cooking",    icon:"⚡", color:C.sky},
};

// Level up every 2 recipes in a category, max level 5
function calcSkillLevel(cookCount) { return Math.min(5, Math.floor(cookCount / 2)); }

// Badges that auto-unlock based on stats
const BADGE_RULES = [
  {id:"first_cook",   label:"First Cook",      emoji:"🍳", desc:"Complete your first recipe",          check:s=>s.totalCooked>=1},
  {id:"streak_7",     label:"Week Warrior",    emoji:"🔥", desc:"Cook 7 days in a row",                check:s=>s.bestStreak>=7},
  {id:"asian_master", label:"Asian Master",    emoji:"🥢", desc:"Level up Asian Cooking to level 3",   check:s=>(s.skillLevels.Asian||0)>=3},
  {id:"italian_pro",  label:"Italian Pro",     emoji:"🍝", desc:"Level up Italian Cooking to level 3", check:s=>(s.skillLevels.Italian||0)>=3},
  {id:"breakfast_king",label:"Breakfast King", emoji:"🌅", desc:"Cook 5 breakfast dishes",             check:s=>(s.categoryCounts.Breakfast||0)>=5},
  {id:"world_tour",   label:"World Tour",      emoji:"🌍", desc:"Cook from 5 different cuisines",      check:s=>Object.keys(s.categoryCounts).length>=5},
  {id:"sprint_done",  label:"5 Dish Sprint",   emoji:"🏃", desc:"Complete the 5 Dish Sprint challenge",check:s=>s.completedChallenges.includes("sprint_5")},
  {id:"marathon",     label:"Marathoner",      emoji:"🏅", desc:"Complete the 30 Cook Marathon",       check:s=>s.completedChallenges.includes("marathon_30")},
  {id:"social_star",  label:"Social Star",     emoji:"⭐", desc:"Get 10 kudos on your posts",          check:s=>s.totalKudos>=10},
  {id:"challenger",   label:"Challenger",      emoji:"⚔️", desc:"Complete a challenge with a friend",  check:s=>s.friendChallengesCompleted>=1},
];

/* ═══ NIKE-STYLE CHALLENGES ═══════════════════════════════════════════════ */
const CHALLENGE_TEMPLATES = [
  {
    id:"sprint_5", name:"5 Dish Sprint", emoji:"🏃",
    tagline:"Your starting line. Cook 5 different dishes.",
    color:"#FF4D1C", darkColor:"#CC3A12",
    target:5, unit:"dishes", category:null,
    difficulty:"Beginner", duration:"1–2 weeks",
    xpReward:200,
    milestones:[1,3,5],
    description:"The perfect first challenge. Cook any 5 recipes — no restrictions, no pressure. Just get cooking.",
    tips:["Pick dishes you already know","Don't overcomplicate it","Consistency beats perfection"],
  },
  {
    id:"explorer_10", name:"10 Meal Explorer", emoji:"🗺️",
    tagline:"Branch out. Try 10 different recipes.",
    color:"#4A90D9", darkColor:"#2E6DB3",
    target:10, unit:"dishes", category:null,
    difficulty:"Beginner", duration:"2–3 weeks",
    xpReward:400,
    milestones:[3,6,10],
    description:"Now you're exploring. Cook 10 different meals — try at least one new cuisine you've never attempted.",
    tips:["Pick one unfamiliar cuisine","Try a new technique","Cook one dish twice to improve it"],
  },
  {
    id:"weeknight_warrior", name:"Weeknight Warrior", emoji:"⚡",
    tagline:"Cook Monday to Friday. Five nights straight.",
    color:"#9B5DE5", darkColor:"#7A40BF",
    target:5, unit:"weeknight meals", category:null,
    difficulty:"Intermediate", duration:"1 week",
    xpReward:300,
    milestones:[2,4,5],
    description:"No takeaways. No excuses. Cook dinner every weeknight for a full week. Quick, weeknight-friendly recipes only.",
    tips:["Prep on Sunday","Keep ingredients stocked","30-minute meals are your friend"],
  },
  {
    id:"world_tour", name:"World Tour", emoji:"🌍",
    tagline:"Cook from 5 different countries.",
    color:"#00A896", darkColor:"#007A6E",
    target:5, unit:"cuisines", category:null,
    difficulty:"Intermediate", duration:"2–4 weeks",
    xpReward:500,
    milestones:[2,4,5],
    description:"Expand your culinary passport. Cook one dish from each of 5 different cuisines — Japanese, Italian, Mexican, Indian, and one of your choice.",
    tips:["Start with the cuisine you know best","Source authentic ingredients","Watch YouTube technique videos first"],
  },
  {
    id:"breakfast_club", name:"Breakfast Club", emoji:"🌅",
    tagline:"Master the most important meal. Cook 7 breakfasts.",
    color:"#F5C842", darkColor:"#C9A020",
    target:7, unit:"breakfasts", category:"Breakfast",
    difficulty:"Beginner", duration:"1–2 weeks",
    xpReward:280,
    milestones:[3,5,7],
    description:"Most people eat cereal every day. Not you. Cook 7 proper breakfasts — eggs, pancakes, granola, shakshuka, whatever you fancy.",
    tips:["Prep the night before","Mise en place everything","Eggs are your best friend"],
  },
  {
    id:"date_night", name:"Date Night Series", emoji:"🕯️",
    tagline:"Cook 3 genuinely impressive meals.",
    color:"#E05C7A", darkColor:"#B33A57",
    target:3, unit:"impressive meals", category:null,
    difficulty:"Intermediate", duration:"3 weeks",
    xpReward:450,
    milestones:[1,2,3],
    description:"Three meals that will make someone's jaw drop. One starter, one main, one dessert. Cook them across 3 separate occasions.",
    tips:["Choose dishes with a wow factor","Presentation matters here","Practice the technique once first"],
  },
  {
    id:"half_marathon", name:"20 Meal Journey", emoji:"🚶",
    tagline:"Twenty meals. Real growth.",
    color:"#FF8C42", darkColor:"#CC6A2A",
    target:20, unit:"meals", category:null,
    difficulty:"Intermediate", duration:"4–6 weeks",
    xpReward:800,
    milestones:[5,10,15,20],
    description:"By the time you hit 20 meals you will be a noticeably better cook. We promise. No shortcuts.",
    tips:["Track what worked and what didn't","Repeat your favourites to improve","Cook at least 3 dishes you've never tried"],
  },
  {
    id:"marathon_30", name:"30 Cook Marathon", emoji:"🏅",
    tagline:"The full marathon. Thirty meals. One month.",
    color:"#3B2A1A", darkColor:"#1A1008",
    target:30, unit:"meals", category:null,
    difficulty:"Advanced", duration:"4–6 weeks",
    xpReward:1500,
    milestones:[5,10,20,30],
    description:"This is the big one. 30 meals in a month. That's cooking almost every day. You will come out the other side a completely different cook.",
    tips:["Meal prep on weekends","Keep a cooking journal","Don't be afraid to repeat dishes","This is supposed to be hard"],
  },
];

/* ═══ RECIPES ═════════════════════════════════════════════════════════════ */
const mk = (cal,pro,carb,fat,fib=2)=>({calories:cal,protein:pro,carbs:carb,fat,fiber:fib});
const RECIPES = [
  {id:1,name:"Miso Glazed Salmon",emoji:"🐟",xp:80,difficulty:"Medium",time:"25 min",category:"Japanese",done:false,tags:["High Protein"],diets:["Gluten-free"],macros:mk(420,38,18,22,1),
    ingredients:["2 salmon fillets","3 tbsp white miso paste","2 tbsp mirin","1 tbsp soy sauce","1 tsp sesame oil","1 clove garlic, grated","Green onions & sesame to serve"],
    steps:[{title:"Make the glaze",body:"Whisk miso, mirin, soy sauce, sesame oil and garlic until smooth."},{title:"Coat & rest",body:"Pat salmon dry. Coat all sides in glaze. Rest 10 min.",timer:600},{title:"Broil",body:"High broil on foil-lined tray, skin-side down, 6–8 min until caramelised.",timer:420},{title:"Serve",body:"Scatter green onions and sesame. Serve over steamed rice."}],
    tip:"Watch closely — miso sugar burns fast. Deep amber, not char."},
  {id:2,name:"Shakshuka",emoji:"🍳",xp:60,difficulty:"Easy",time:"20 min",category:"Mediterranean",done:false,tags:["Brunch","One-pan"],diets:["Vegetarian","Gluten-free"],macros:mk(310,18,22,18,4),
    ingredients:["6 large eggs","1×400g can crushed tomatoes","1 red bell pepper, diced","1 onion, diced","4 cloves garlic, minced","2 tsp cumin","1 tsp smoked paprika","½ tsp cayenne","Feta, cilantro & bread"],
    steps:[{title:"Sauté the base",body:"Cook onion and pepper in oil 6 min. Add garlic and spices, 1 min more.",timer:420},{title:"Build the sauce",body:"Add tomatoes. Season. Simmer 10 min until thick.",timer:600},{title:"Add eggs",body:"Make 6 wells. Crack one egg into each."},{title:"Cover & finish",body:"Cover on medium-low until whites set, yolks jammy.",timer:360}],
    tip:"Pull off heat when yolks look underdone — residual heat finishes them."},
  {id:3,name:"Thai Green Curry",emoji:"🍛",xp:120,difficulty:"Hard",time:"45 min",category:"Asian",done:false,tags:["Spicy"],diets:["Gluten-free","Dairy-free"],macros:mk(520,34,28,32,3),
    ingredients:["400ml full-fat coconut milk","3 tbsp green curry paste","500g chicken thigh, sliced","1 zucchini, sliced","Thai eggplant","4 kaffir lime leaves","2 tbsp fish sauce","1 tbsp palm sugar","Thai basil, jasmine rice"],
    steps:[{title:"Fry the paste",body:"Scoop coconut cream from top of can. Fry curry paste 2 min until fragrant.",timer:120},{title:"Seal chicken",body:"Add chicken. Stir-fry until sealed.",timer:240},{title:"Add coconut milk",body:"Pour in remaining milk and lime leaves. Gentle simmer."},{title:"Add veg & simmer",body:"Add vegetables. Simmer 8–10 min.",timer:540},{title:"Season & serve",body:"Balance with fish sauce and palm sugar. Stir in Thai basil."}],
    tip:"Fry paste in coconut cream, not oil — deeper, richer flavour."},
  {id:4,name:"Avocado Toast & Eggs",emoji:"🥑",xp:35,difficulty:"Easy",time:"10 min",category:"Breakfast",done:false,tags:["Quick","High Protein"],diets:["Vegetarian","Dairy-free"],macros:mk(420,18,38,22,8),
    ingredients:["2 thick slices sourdough","1 large avocado","2 eggs","½ lemon","Chilli flakes","Salt & black pepper","Microgreens"],
    steps:[{title:"Toast bread",body:"Toast sourdough until deeply golden and crunchy.",timer:180},{title:"Smash avocado",body:"Scoop into bowl. Add lemon juice, salt, pepper. Smash to chunky texture."},{title:"Poach eggs",body:"Simmer water with a splash of vinegar. Swirl. Crack eggs in. Poach.",timer:180},{title:"Assemble",body:"Spread avocado on toast. Top with poached egg, chilli and microgreens."}],
    tip:"Salt the avocado generously — it's the whole flavour base."},
  {id:5,name:"Butter Chicken",emoji:"🍗",xp:110,difficulty:"Medium",time:"45 min",category:"Indian",done:false,tags:["Rich","Family Favourite"],diets:["Gluten-free"],macros:mk(540,38,18,36,2),
    ingredients:["600g chicken thigh","400ml heavy cream","1×400g can crushed tomatoes","3 tbsp butter","2 tsp garam masala","1 tsp turmeric","4 cloves garlic","1 tsp ginger","Fresh cilantro"],
    steps:[{title:"Season & sear",body:"Toss chicken in spices. Sear in butter until golden.",timer:360},{title:"Build sauce",body:"Add garlic and ginger 1 min. Add tomatoes and cream."},{title:"Simmer",body:"Simmer on medium-low 20 min until thick.",timer:1200},{title:"Finish",body:"Add cold knob of butter. Top with cilantro."}],
    tip:"A final cold knob of butter stirred off-heat makes the sauce silky."},
  {id:6,name:"Tacos al Pastor",emoji:"🌮",xp:95,difficulty:"Medium",time:"40 min",category:"Mexican",done:false,tags:["Bold"],diets:["Gluten-free","Dairy-free"],macros:mk(480,28,42,20,4),
    ingredients:["500g pork shoulder, thin-sliced","3 dried guajillo chillies, soaked","1 chipotle in adobo","3 cloves garlic","1 tsp cumin","3 tbsp white vinegar","½ pineapple","Corn tortillas, white onion, cilantro, lime"],
    steps:[{title:"Marinade",body:"Blend chillies, chipotle, garlic, cumin, vinegar and blended pineapple. Coat pork.",timer:7200},{title:"Cook pork",body:"Sear on very hot pan until charred at edges.",timer:300},{title:"Char pineapple",body:"Grill pineapple slices until caramelised.",timer:180},{title:"Assemble",body:"Warm tortillas. Load with pork, pineapple, onion and cilantro. Squeeze lime."}],
    tip:"Charring the pork edges is the whole point — go hotter than you think."},
  {id:7,name:"Aglio e Olio",emoji:"🍝",xp:50,difficulty:"Easy",time:"15 min",category:"Italian",done:false,tags:["Quick","Vegetarian"],diets:["Vegetarian","Dairy-free"],macros:mk(520,14,72,20,3),
    ingredients:["400g spaghetti","8 cloves garlic, thinly sliced","½ cup extra-virgin olive oil","1 tsp chilli flakes","Flat-leaf parsley","Pecorino Romano"],
    steps:[{title:"Boil pasta",body:"Cook in heavily salted water, 2 min under package time.",timer:480},{title:"Toast garlic",body:"Warm oil medium-low. Add garlic and chilli — pale gold, never brown.",timer:300},{title:"Emulsify",body:"Add a ladle of pasta water to garlic oil. Stir until cloudy."},{title:"Toss & serve",body:"Add pasta. Toss off heat. Add pasta water until silky. Fold in parsley."}],
    tip:"The pasta water IS the sauce. Keep a full cup nearby."},
  {id:8,name:"Smash Burgers",emoji:"🍔",xp:70,difficulty:"Medium",time:"20 min",category:"Comfort",done:false,tags:["Crowd Pleaser"],diets:["No restrictions"],macros:mk(680,38,42,38,2),
    ingredients:["500g 80/20 ground beef","4 brioche buns","8 slices American cheese","1 white onion, finely diced","Pickles, shredded iceberg","Mayo, ketchup, mustard"],
    steps:[{title:"Make sauce",body:"Combine mayo, ketchup, mustard and paprika. Chill."},{title:"Portion loosely",body:"Divide beef into 8 loose 60g balls. Do not compact."},{title:"The smash",body:"Screaming-hot cast iron. Ball down, smash flat and HOLD 10 sec.",timer:90},{title:"Crust & cheese",body:"90 sec until edges deep brown. Flip. Cheese immediately. 45 sec.",timer:90}],
    tip:"SMASH hard and fast on contact — that's the lacy crust."},
  {id:9,name:"Chicken Tikka Masala",emoji:"🍲",xp:105,difficulty:"Medium",time:"50 min",category:"Indian",done:false,tags:["Crowd Pleaser"],diets:["Gluten-free"],macros:mk(490,36,24,28,3),
    ingredients:["500g chicken breast","200g full-fat yoghurt","3 tsp tikka masala paste","400ml passata","200ml double cream","1 onion, diced","4 cloves garlic","2 tsp garam masala","Coriander, rice"],
    steps:[{title:"Marinate chicken",body:"Mix yoghurt with tikka paste. Coat chicken. Marinate 1 hr min.",timer:3600},{title:"Char the chicken",body:"Grill on high until charred in spots.",timer:480},{title:"Build sauce",body:"Fry onion 8 min. Add spices. Add passata.",timer:1200},{title:"Combine",body:"Add charred chicken and cream. Simmer 10 min.",timer:600}],
    tip:"Charring the chicken is what separates tikka masala from a plain curry."},
  {id:10,name:"French Onion Soup",emoji:"🧅",xp:110,difficulty:"Medium",time:"1h 20m",category:"Comfort",done:false,tags:["Cozy","Classic"],diets:["Vegetarian"],macros:mk(440,18,38,24,4),
    ingredients:["1.2kg yellow onions, thinly sliced","4 tbsp unsalted butter","½ cup dry white wine","1.5L good stock","2 sprigs thyme, 1 bay leaf","8 baguette slices, toasted","200g Gruyère, grated"],
    steps:[{title:"Caramelise",body:"Cook onions in butter over medium heat, stirring every 5 min.",timer:3000},{title:"Deglaze",body:"Add wine. Scrape all brown bits. Cook until absorbed.",timer:180},{title:"Simmer",body:"Add stock, thyme, bay leaf. Simmer 20 min.",timer:1200},{title:"Gratinée",body:"Fill oven-safe bowls. Add baguette and Gruyère. Broil until golden.",timer:300}],
    tip:"Deep amber onions, not pale and soft. That's 80% of the dish."},
  {id:11,name:"Overnight Oats",emoji:"🥣",xp:25,difficulty:"Easy",time:"5 min",category:"Breakfast",done:false,tags:["Meal Prep","Vegan"],diets:["Vegan","Gluten-free","Dairy-free"],macros:mk(380,12,58,10,7),
    ingredients:["1 cup rolled oats","1 cup oat milk","2 tbsp chia seeds","1 tbsp maple syrup","½ tsp vanilla","Toppings: berries, banana, nut butter"],
    steps:[{title:"Mix",body:"Combine oats, milk, chia seeds, maple syrup and vanilla. Stir well."},{title:"Jar up",body:"Pour into a mason jar or container with lid."},{title:"Refrigerate overnight",body:"Cover and refrigerate at least 6 hours.",timer:0},{title:"Top & serve",body:"In the morning add berries, banana and nut butter."}],
    tip:"Make 4 jars on Sunday — breakfast sorted for the week."},
  {id:12,name:"Masala Dosa",emoji:"🫓",xp:100,difficulty:"Hard",time:"50 min",category:"Indian",done:false,tags:["Vegetarian","Crispy"],diets:["Vegetarian","Vegan","Gluten-free"],macros:mk(380,9,68,8,4),
    ingredients:["2 cups rice flour","½ cup urad dal flour","Salt & water","2 tbsp oil","3 potatoes, boiled and mashed","1 onion, diced","1 tsp mustard seeds","1 tsp turmeric","Curry leaves, 2 green chillies"],
    steps:[{title:"Make batter",body:"Mix rice flour, urad dal flour, salt and enough water to thin pancake consistency.",timer:1800},{title:"Potato filling",body:"Fry mustard seeds until popping. Add onion, curry leaves, chilli, turmeric and mashed potato.",timer:300},{title:"Cook the dosa",body:"High-heat non-stick pan. Pour batter in a thin circle. Drizzle oil around edges.",timer:180},{title:"Fill & fold",body:"Spoon potato filling along the centre. Fold and serve with sambar."}],
    tip:"The pan must be very hot — a cold pan makes a sticky dosa."},
];

const WEEK_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const STREAK_GOALS = [
  {id:"daily",   label:"Every day",   sub:"Full commitment",             icon:"🔥",target:7,color:C.flame},
  {id:"5x",      label:"5× a week",   sub:"Weekday warrior",             icon:"💪",target:5,color:C.ember},
  {id:"3x",      label:"3× a week",   sub:"Balanced, sustainable",       icon:"🌿",target:3,color:C.sage},
  {id:"weekend", label:"Weekends",    sub:"Relaxed weekend cooking",     icon:"☀️",target:2,color:C.gold},
  {id:"weekly",  label:"Once a week", sub:"Busy schedule — no pressure", icon:"🗓️",target:1,color:C.sky},
];

const SEED_POSTS = [
  {id:"p1",user:{name:"Sofia R.",avatar:"👩‍🍳",level:"Chef Lv.4"},recipe:"Beef Bourguignon",emoji:"🥩",photo:null,caption:"Three hours of love. Look at that colour 🤤 #sundaycooking #French",time:"2h ago",kudos:14,myKudos:false,comments:[{user:"Jake M.",text:"This is insane 🔥"},{user:"Priya K.",text:"Recipe?? 👀"}]},
  {id:"p2",user:{name:"Jake M.",avatar:"🧑‍🍳",level:"Home Cook"},recipe:"Sourdough Focaccia",emoji:"🍞",photo:null,caption:"Finally nailed the dimples after 4 attempts. Sea salt flakes changed everything. #bread #sourdough",time:"5h ago",kudos:22,myKudos:false,comments:[{user:"Sofia R.",text:"The crust looks perfect 😍"},{user:"Marcus T.",text:"What hydration did you use?"}]},
  {id:"p3",user:{name:"Priya K.",avatar:"👩‍🦱",level:"Intermediate"},recipe:"Miso Ramen",emoji:"🍜",photo:null,caption:"Homemade tonkotsu broth, 6 hours simmering. My flat smells incredible. Worth every minute ✨",time:"1d ago",kudos:31,myKudos:false,comments:[{user:"Jake M.",text:"6 hours!! You're a legend"},{user:"Sofia R.",text:"Coming over next time 😂"}]},
  {id:"p4",user:{name:"Marcus T.",avatar:"🧔",level:"Advanced"},recipe:"Tarte Tatin",emoji:"🥧",photo:null,caption:"Third attempt. Caramelisation is a discipline, not a skill. #French #pastry #persistence",time:"2d ago",kudos:19,myKudos:false,comments:[{user:"Priya K.",text:"That colour is everything 🙌"}]},
];

const LEADERBOARD = [
  {rank:1,name:"Sofia R.", avatar:"👩‍🍳",xp:1240,streak:12,badge:"🥇"},
  {rank:2,name:"Jake M.",  avatar:"🧑‍🍳",xp:1105,streak:7, badge:"🥈"},
  {rank:3,name:"Priya K.", avatar:"👩‍🦱",xp:980, streak:5, badge:"🥉"},
  {rank:4,name:"You",      avatar:"🧑",  xp:340, streak:4, badge:"4️⃣",isMe:true},
  {rank:5,name:"Marcus T.",avatar:"🧔",  xp:290, streak:3, badge:"5️⃣"},
];

/* ═══ HELPERS ═════════════════════════════════════════════════════════════ */
const fmt = s => s>=3600?`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`:s>=60?`${Math.floor(s/60)}m ${s%60}s`:`${s}s`;
const toB64 = f => new Promise((ok,er)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(",")[1]);r.onerror=er;r.readAsDataURL(f);});

/* ═══ MICRO COMPONENTS ════════════════════════════════════════════════════ */
const XPBar=({pct,color=C.flame,h=8})=>(
  <div style={{background:"#E8DDD4",borderRadius:999,height:h,overflow:"hidden",width:"100%"}}>
    <div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:"100%",background:color,borderRadius:999,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
);
const DiffBadge=({level})=>{const col={Easy:C.sage,Medium:C.ember,Hard:C.flame}[level]||C.muted;return<span style={{fontSize:10,fontWeight:800,color:col,background:`${col}1A`,borderRadius:6,padding:"2px 7px"}}>{level}</span>;};
const Chip=({label,color=C.muted,bg})=><span style={{fontSize:10,fontWeight:700,color,background:bg||`${color}18`,borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>{label}</span>;
const Sheet=({children,onClose})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(30,18,8,.7)",zIndex:300,display:"flex",alignItems:"flex-end",backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.paper,borderRadius:"24px 24px 0 0",width:"100%",maxHeight:"94vh",overflowY:"auto",animation:"slideUp .28s cubic-bezier(.4,0,.2,1)"}}>{children}</div>
  </div>
);
const CloseBtn=({onClose})=><button onClick={onClose} style={{background:C.pill,border:"none",borderRadius:10,width:34,height:34,cursor:"pointer",fontSize:18,color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>;
const Btn=({children,onClick,color=C.flame,outline=false,disabled=false,full=false,sm=false,style:x={}})=>(
  <button className="tap" onClick={onClick} disabled={disabled} style={{border:outline?`2px solid ${disabled?C.border:color}`:"none",background:outline?"transparent":disabled?"#D8D0C8":color,color:outline?(disabled?C.border:color):"#fff",borderRadius:14,padding:sm?"8px 14px":"12px 20px",fontWeight:800,fontSize:sm?12:14,cursor:disabled?"not-allowed":"pointer",boxShadow:(!outline&&!disabled)?`0 4px 14px ${color}44`:"none",transition:"all .18s",opacity:disabled?.55:1,width:full?"100%":"auto",...x}}>{children}</button>
);

/* ═══ ONBOARDING ══════════════════════════════════════════════════════════ */
function Onboarding({onComplete}) {
  const [step,setStep]=useState(0);
  const [profile,setProfile]=useState({dietary:"No restrictions",skill:"Home Cook"});
  const [goal,setGoal]=useState(STREAK_GOALS[2]);
  const next=()=>setStep(s=>s+1);
  const progress=(step+1)/4;

  const screens=[
    // Welcome
    ()=>(
      <div style={{padding:"40px 28px 36px",textAlign:"center"}}>
        <div style={{fontSize:72,marginBottom:16}}>🍳</div>
        <div style={{fontWeight:900,fontSize:32,color:C.bark,fontFamily:DF,lineHeight:1.2,marginBottom:12}}>
          mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place
        </div>
        <div style={{fontSize:16,color:C.muted,lineHeight:1.7,marginBottom:32,maxWidth:320,margin:"0 auto 32px"}}>
          Cook more. Level up. Share the journey with friends.
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:32,textAlign:"left"}}>
          {[["🏃","Cooking challenges like Nike Run Club — solo or with friends"],["📸","Share your dishes to a Strava-style feed"],["📈","Level up skills as you cook. Unlock badges."],["🔥","Set a streak goal that actually fits your life"]].map(([e,t])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:14,background:C.cream,borderRadius:14,padding:"12px 16px",border:`1px solid ${C.border}`}}>
              <span style={{fontSize:24}}>{e}</span><span style={{fontSize:14,color:C.bark,fontWeight:600}}>{t}</span>
            </div>
          ))}
        </div>
        <Btn onClick={next} full style={{fontSize:16,padding:"15px"}}>Get Started →</Btn>
      </div>
    ),
    // Goal
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:12}}>🎯</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>How often will you cook?</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>Pick an honest goal. The best streak is one you can actually keep.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {STREAK_GOALS.map(g=>{
            const active=goal.id===g.id;
            return(
              <button key={g.id} className="tap" onClick={()=>setGoal(g)} style={{background:active?`${g.color}14`:C.cream,border:`2px solid ${active?g.color:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .18s"}}>
                <div style={{width:44,height:44,borderRadius:12,background:active?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}><div style={{fontWeight:900,fontSize:14,color:C.bark}}>{g.label}</div><div style={{fontSize:12,color:C.muted}}>{g.sub}</div></div>
                <div style={{fontWeight:900,fontSize:18,color:active?g.color:C.muted,flexShrink:0}}>{g.target}×/wk</div>
                {active&&<div style={{width:20,height:20,borderRadius:"50%",background:g.color,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <Btn onClick={next} full>Continue →</Btn>
      </div>
    ),
    // Skill level
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:12}}>👨‍🍳</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>How would you rate yourself?</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>Honestly. We'll match your challenges and recipes to your level.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {[
            {id:"Beginner",    label:"Beginner",      sub:"I mostly stick to simple stuff",     emoji:"🌱"},
            {id:"Home Cook",   label:"Home Cook",     sub:"I cook regularly and enjoy it",       emoji:"🍳"},
            {id:"Intermediate",label:"Intermediate",  sub:"I can tackle most recipes",           emoji:"👨‍🍳"},
            {id:"Advanced",    label:"Advanced",      sub:"I seek out complex techniques",       emoji:"⭐"},
            {id:"Chef",        label:"Chef-level",    sub:"Professional or very experienced",    emoji:"🏆"},
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
    // Done
    ()=>(
      <div style={{textAlign:"center",padding:"40px 28px"}}>
        <div style={{fontSize:72,marginBottom:20}}>🎉</div>
        <div style={{fontWeight:900,fontSize:28,color:C.bark,fontFamily:DF,marginBottom:12}}>You're all set!</div>
        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px",marginBottom:24,color:"#fff",textAlign:"left"}}>
          <div style={{fontSize:11,opacity:.6,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Your profile</div>
          {[["🎯 Cooking goal",goal.label],["👨‍🍳 Skill level",profile.skill]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:13,opacity:.7}}>{k}</span><span style={{fontSize:13,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:28}}>Start with a challenge, cook something and share it with friends. That's the whole thing.</div>
        <Btn onClick={()=>onComplete({profile,goal})} full style={{fontSize:16,padding:"15px"}}>Let's Cook 🍳</Btn>
      </div>
    ),
  ];

  const Screen=screens[step];
  return(
    <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto"}}>
      {step>0&&(
        <div style={{padding:"20px 24px 0"}}>
          <div style={{background:"#E8DDD4",borderRadius:99,height:5,overflow:"hidden"}}>
            <div style={{width:`${progress*100}%`,height:"100%",background:C.flame,borderRadius:99,transition:"width .4s ease"}}/>
          </div>
        </div>
      )}
      <div style={{overflowY:"auto"}}><Screen/></div>
    </div>
  );
}

/* ═══ BADGE TOAST ═════════════════════════════════════════════════════════ */
function BadgeToast({badge, onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:500,animation:"badgePop .5s cubic-bezier(.34,1.56,.64,1)",width:"calc(100% - 32px)",maxWidth:388}}>
      <div style={{background:`linear-gradient(135deg,${C.gold},#E8A800)`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,.25)"}}>
        <div style={{fontSize:44}}>{badge.emoji}</div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(0,0,0,.6)",textTransform:"uppercase",letterSpacing:".08em"}}>Badge Unlocked! 🎉</div>
          <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF}}>{badge.label}</div>
          <div style={{fontSize:12,color:"rgba(0,0,0,.6)",marginTop:2}}>{badge.desc}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══ STEP TIMER ══════════════════════════════════════════════════════════ */
function StepTimer({seconds,onDone}) {
  const [remaining,setRemaining]=useState(seconds);
  const [running,setRunning]=useState(false);
  const [finished,setFinished]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{setRemaining(seconds);setRunning(false);setFinished(false);},[seconds]);
  useEffect(()=>{
    if(running){ref.current=setInterval(()=>setRemaining(r=>{if(r<=1){clearInterval(ref.current);setRunning(false);setFinished(true);onDone?.();return 0;}return r-1;}),1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[running]);
  const pct=Math.max(0,Math.round((1-remaining/seconds)*100));
  const urgent=remaining<=30?C.flame:remaining<=60?C.ember:C.sage;
  if(finished)return<div style={{background:`${C.sage}18`,border:`2px solid ${C.sage}44`,borderRadius:16,padding:"14px 18px",textAlign:"center",animation:"pop .4s ease"}}><div style={{fontSize:28,marginBottom:6}}>✅</div><div style={{fontWeight:800,fontSize:15,color:C.sage}}>Timer done! Next step.</div></div>;
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

/* ═══ RECIPE DETAIL ═══════════════════════════════════════════════════════ */
function RecipeDetail({recipe,onBack,onComplete}) {
  const [step,setStep]=useState(0);
  const [mode,setMode]=useState("overview");
  const [completed,setCompleted]=useState(recipe.done);
  const [postOpen,setPostOpen]=useState(false);
  const [caption,setCaption]=useState("");
  const [photo,setPhoto]=useState(null);
  const [photoPreview,setPhotoPreview]=useState(null);
  const fileRef=useRef();
  const nSteps=(recipe.steps||[]).length;

  const handleFile=async(e)=>{
    const file=e.target.files[0];if(!file)return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhoto(file);
  };

  const handleComplete=async()=>{
    setCompleted(true);
    setPostOpen(true);
  };

  const handlePost=()=>{
    setPostOpen(false);
    onComplete(recipe,photoPreview,caption);
  };

  const handleSkip=()=>{
    setPostOpen(false);
    onComplete(recipe,null,"");
  };

  return(
    <div style={{background:C.paper,minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(160deg,${C.bark},#5A3520)`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,fontSize:108,opacity:.12,lineHeight:1}}>{recipe.emoji}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px"}}>← Back</button>
        </div>
        <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
          <DiffBadge level={recipe.difficulty}/>
          {(recipe.diets||[]).filter(d=>d!=="No restrictions").slice(0,3).map(d=><Chip key={d} label={d} color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.15)"/>)}
        </div>
        <div style={{fontSize:25,fontWeight:900,color:"#fff",lineHeight:1.25,marginBottom:8,fontFamily:DF}}>{recipe.name}</div>
        <div style={{display:"flex",gap:16,color:"rgba(255,255,255,.65)",fontSize:13}}>
          <span>⏱ {recipe.time}</span><span>⚡ {recipe.xp} XP</span><span>📋 {(recipe.ingredients||[]).length} ingredients</span>
        </div>
      </div>

      {/* Mode tabs */}
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
                <div style={{fontWeight:900,fontSize:14,color:C.bark,marginBottom:12}}>Nutrition per serving</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                  {[["🔥","Cal",recipe.macros.calories,"kcal",C.flame],["💪","Protein",recipe.macros.protein,"g",C.sky],["🌾","Carbs",recipe.macros.carbs,"g",C.gold],["🫒","Fat",recipe.macros.fat,"g",C.ember],["🥦","Fiber",recipe.macros.fiber,"g",C.sage]].map(([icon,label,val,unit,color])=>(
                    <div key={label} style={{background:`${color}0D`,borderRadius:12,padding:"10px 4px",textAlign:"center",border:`1.5px solid ${color}22`}}>
                      <div style={{fontSize:16,marginBottom:3}}>{icon}</div>
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
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<recipe.ingredients.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:C.ember,flexShrink:0}}/><span style={{fontSize:14,color:C.bark}}>{ing}</span>
                </div>
              ))}
            </div>
            {/* Steps */}
            <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:14}}>Method</div>
              {(recipe.steps||[]).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:14,marginBottom:i<nSteps-1?18:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                  <div>
                    <div style={{fontWeight:800,fontSize:14,color:C.bark,marginBottom:3}}>{s.title}</div>
                    <div style={{fontSize:13,color:"#6A5C52",lineHeight:1.6}}>{s.body}</div>
                    {s.timer>0&&<div style={{fontSize:10,color:C.sky,fontWeight:600,marginTop:3}}>⏱ {fmt(s.timer)} timer</div>}
                  </div>
                </div>
              ))}
            </div>
            {recipe.tip&&<div style={{background:`${C.gold}20`,border:`1px solid ${C.gold}55`,borderRadius:18,padding:"14px 18px",marginBottom:14}}><div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:5}}>💡 Chef's Tip</div><div style={{fontSize:13,color:"#6A5C52",lineHeight:1.6}}>{recipe.tip}</div></div>}
            {completed?<div style={{textAlign:"center",padding:"12px",fontWeight:700,color:C.sage,fontSize:16}}>✓ Cooked! Great work.</div>:<Btn onClick={()=>setMode("cook")} full>Start Cooking 👨‍🍳</Btn>}
          </>
        ):(
          /* Cook mode */
          <div>
            <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:14}}>Step {step+1} of {nSteps}</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:20}}>
              {Array.from({length:nSteps}).map((_,i)=>(
                <div key={i} onClick={()=>setStep(i)} style={{width:i===step?24:8,height:8,borderRadius:99,background:i<step?C.sage:i===step?C.flame:C.border,transition:"all .28s",cursor:"pointer"}}/>
              ))}
            </div>
            <div style={{background:C.cream,borderRadius:20,padding:24,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>{step+1}</div>
              <div style={{fontWeight:900,fontSize:20,color:C.bark,marginBottom:10,fontFamily:DF}}>{recipe.steps[step].title}</div>
              <div style={{fontSize:15,color:"#5A4C42",lineHeight:1.7}}>{recipe.steps[step].body}</div>
            </div>
            {recipe.steps[step].timer>0&&<div style={{marginBottom:14}}><StepTimer key={step} seconds={recipe.steps[step].timer} onDone={()=>{}}/></div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} style={{flex:1,padding:13,borderRadius:14,border:`2px solid ${C.border}`,background:"transparent",color:step===0?"#CCC":C.bark,fontWeight:800,cursor:step===0?"default":"pointer",fontSize:15}}>← Prev</button>
              {step<nSteps-1
                ?<Btn onClick={()=>setStep(s=>s+1)} style={{flex:2}}>Next Step →</Btn>
                :<Btn onClick={()=>!completed&&handleComplete()} color={C.sage} style={{flex:2,background:completed?C.sage:`linear-gradient(135deg,${C.sage},${C.moss})`}}>
                  {completed?"✓ Cooked!":`Complete · +${recipe.xp}xp 🎉`}
                </Btn>
              }
            </div>
          </div>
        )}
      </div>

      {/* Post to feed sheet */}
      {postOpen&&(
        <Sheet onClose={handleSkip}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🎉 Dish complete!</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>Share to your feed — show everyone your work</div>
              </div>
              <CloseBtn onClose={handleSkip}/>
            </div>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"16px 18px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:36}}>{recipe.emoji}</span>
              <div><div style={{fontWeight:900,fontSize:16,color:"#fff"}}>{recipe.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:2}}>+{recipe.xp} XP earned</div></div>
            </div>

            {/* Photo upload */}
            {!photoPreview?(
              <div onClick={()=>fileRef.current?.click()} style={{border:`3px dashed ${C.border}`,borderRadius:18,padding:"32px 20px",textAlign:"center",cursor:"pointer",background:C.cream,marginBottom:14}}>
                <div style={{fontSize:40,marginBottom:8}}>📸</div>
                <div style={{fontWeight:800,fontSize:15,color:C.bark,marginBottom:4}}>Add a photo of your dish</div>
                <div style={{fontSize:12,color:C.muted}}>Optional but highly encouraged 🙌</div>
              </div>
            ):(
              <div style={{marginBottom:14,position:"relative"}}>
                <img src={photoPreview} alt="dish" style={{width:"100%",height:220,objectFit:"cover",borderRadius:18}}/>
                <button onClick={()=>{setPhoto(null);setPhotoPreview(null);}} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.5)",border:"none",borderRadius:99,color:"#fff",width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>

            {/* Caption */}
            <textarea
              value={caption}
              onChange={e=>setCaption(e.target.value)}
              placeholder="Say something about your dish... what worked, what you learned, what you'd change 🍳"
              style={{width:"100%",minHeight:88,borderRadius:16,border:`2px solid ${caption?C.ember:C.border}`,background:C.cream,padding:"13px 16px",fontSize:14,color:C.bark,resize:"none",outline:"none",lineHeight:1.55,boxSizing:"border-box",marginBottom:14,transition:"border-color .18s"}}
            />
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

/* ═══ CHALLENGES TAB ══════════════════════════════════════════════════════ */
function ChallengeCard({ch, userProgress, onOpen}) {
  const progress = userProgress[ch.id] || 0;
  const pct = Math.round(progress / ch.target * 100);
  const done = progress >= ch.target;
  const nextMilestone = ch.milestones.find(m => m > progress);

  return(
    <div onClick={()=>onOpen(ch)} className="tap ch" style={{background:C.cream,borderRadius:22,overflow:"hidden",cursor:"pointer",border:`2px solid ${ch.color}22`,boxShadow:`0 4px 20px ${ch.color}12`,transition:"transform .18s,box-shadow .18s",marginBottom:14}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${ch.color},${ch.darkColor})`,padding:"20px 20px 18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-10,top:-10,fontSize:80,opacity:.2,lineHeight:1}}>{ch.emoji}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <Chip label={ch.difficulty} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          <Chip label={ch.duration} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          {done&&<Chip label="✓ Complete" color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>}
        </div>
        <div style={{fontSize:24,fontWeight:900,color:"#fff",fontFamily:DF,marginBottom:4}}>{ch.emoji} {ch.name}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.8)",lineHeight:1.5}}>{ch.tagline}</div>
      </div>

      {/* Progress */}
      <div style={{padding:"14px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:700,color:C.bark}}>{progress} / {ch.target} {ch.unit}</span>
          <span style={{fontSize:13,fontWeight:800,color:ch.color}}>+{ch.xpReward} XP</span>
        </div>
        <XPBar pct={pct} color={ch.color} h={8}/>
        {!done&&nextMilestone&&(
          <div style={{fontSize:11,color:C.muted,marginTop:6}}>{nextMilestone-progress} more to next milestone 🎯</div>
        )}
        {done&&<div style={{fontSize:11,color:C.sage,marginTop:6,fontWeight:700}}>🎉 Challenge complete! Badge unlocked.</div>}
      </div>
    </div>
  );
}

function ChallengeDetail({ch, userProgress, friends, onBack, onChallengeFriend, onJoin}) {
  const progress = userProgress[ch.id] || 0;
  const pct = Math.round(progress / ch.target * 100);
  const done = progress >= ch.target;
  const [showInvite, setShowInvite] = useState(false);

  // Mock friend progress for this challenge
  const friendProgress = {
    "Sofia R.": Math.min(ch.target, Math.floor(Math.random()*ch.target+1)),
    "Jake M.":  Math.min(ch.target, Math.floor(Math.random()*ch.target)),
  };

  return(
    <div style={{background:C.paper,minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(160deg,${ch.color},${ch.darkColor})`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,fontSize:120,opacity:.15,lineHeight:1}}>{ch.emoji}</div>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px",marginBottom:18}}>← Back</button>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <Chip label={ch.difficulty} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          <Chip label={`${ch.target} ${ch.unit}`} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
          <Chip label={ch.duration} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.2)"/>
        </div>
        <div style={{fontSize:26,fontWeight:900,color:"#fff",fontFamily:DF,marginBottom:6}}>{ch.emoji} {ch.name}</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,.85)",lineHeight:1.6}}>{ch.description}</div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        {/* Your progress */}
        <div style={{background:C.cream,borderRadius:20,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:900,fontSize:16,color:C.bark,fontFamily:DF}}>Your Progress</div>
            <div style={{fontWeight:900,fontSize:16,color:ch.color}}>{progress}/{ch.target}</div>
          </div>
          <XPBar pct={pct} color={ch.color} h={12}/>

          {/* Milestones */}
          <div style={{display:"flex",gap:0,marginTop:14,position:"relative"}}>
            <div style={{position:"absolute",top:12,left:0,right:0,height:2,background:C.border,zIndex:0}}/>
            <div style={{position:"absolute",top:12,left:0,width:`${pct}%`,height:2,background:ch.color,zIndex:1,transition:"width .9s ease"}}/>
            {ch.milestones.map((m,i)=>{
              const mPct=Math.round(m/ch.target*100);
              const reached=progress>=m;
              return(
                <div key={i} style={{flex:1,textAlign:i===0?"left":i===ch.milestones.length-1?"right":"center",position:"relative",zIndex:2}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:reached?ch.color:C.border,border:`2px solid ${reached?ch.color:C.border}`,display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800,transition:"all .3s"}}>{reached?"✓":m}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:4}}>{m} {ch.unit.split(" ")[0]}</div>
                </div>
              );
            })}
          </div>

          {done&&(
            <div style={{marginTop:14,background:`${C.gold}18`,borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:4}}>🏅</div>
              <div style={{fontWeight:800,fontSize:14,color:C.bark}}>Challenge Complete! +{ch.xpReward} XP</div>
            </div>
          )}
        </div>

        {/* Friend accountability */}
        <div style={{background:C.cream,borderRadius:20,padding:18,marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:4,fontFamily:DF}}>⚔️ Challenge a Friend</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Do this challenge together for accountability. You'll see each other's progress here.</div>

          {/* Friend progress list */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            {Object.entries(friendProgress).map(([name,prog])=>(
              <div key={name} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:32,height:32,borderRadius:10,background:`${ch.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.bark}}>{name}</span>
                    <span style={{fontSize:12,color:ch.color,fontWeight:700}}>{prog}/{ch.target}</span>
                  </div>
                  <XPBar pct={Math.round(prog/ch.target*100)} color={ch.color} h={6}/>
                </div>
              </div>
            ))}
          </div>

          <Btn onClick={()=>setShowInvite(true)} outline color={ch.color} full sm>+ Invite a friend to this challenge</Btn>
        </div>

        {/* Tips */}
        <div style={{background:`${C.gold}18`,border:`1px solid ${C.gold}44`,borderRadius:18,padding:"16px 18px",marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:14,color:C.bark,marginBottom:10}}>💡 Tips for this challenge</div>
          {ch.tips.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:i<ch.tips.length-1?8:0}}>
              <span style={{color:C.gold,fontWeight:800,flexShrink:0}}>{i+1}.</span>
              <span style={{fontSize:13,color:"#6A5C52",lineHeight:1.5}}>{tip}</span>
            </div>
          ))}
        </div>

        <Btn onClick={onBack} full style={{background:ch.color}}>Start Cooking Towards This 🍳</Btn>
      </div>

      {/* Invite sheet */}
      {showInvite&&(
        <Sheet onClose={()=>setShowInvite(false)}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>⚔️ Invite to Challenge</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Pick a friend to race against</div></div>
              <CloseBtn onClose={()=>setShowInvite(false)}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {["Sofia R.","Jake M.","Priya K.","Marcus T."].map(name=>(
                <button key={name} onClick={()=>{onChallengeFriend(name,ch);setShowInvite(false);}} className="tap" style={{display:"flex",alignItems:"center",gap:14,background:C.cream,border:`2px solid ${C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                  <div style={{width:44,height:44,borderRadius:14,background:`${ch.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>👤</div>
                  <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,color:C.bark}}>{name}</div><div style={{fontSize:12,color:C.muted}}>Tap to send challenge invite</div></div>
                  <span style={{fontSize:18,color:C.muted}}>→</span>
                </button>
              ))}
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function ChallengesTab({userProgress, onChallengeSelect, onChallengeFriend}) {
  const [selected, setSelected] = useState(null);

  if(selected){
    return <ChallengeDetail ch={selected} userProgress={userProgress} friends={[]} onBack={()=>setSelected(null)} onChallengeFriend={onChallengeFriend} onJoin={()=>{}}/>;
  }

  const active = CHALLENGE_TEMPLATES.filter(ch=>(userProgress[ch.id]||0)>0);
  const available = CHALLENGE_TEMPLATES.filter(ch=>!(userProgress[ch.id]||0));

  return(
    <div style={{paddingBottom:30}}>
      {/* Hero */}
      <div style={{margin:"4px 16px 24px",background:C.dark,borderRadius:22,padding:"22px 20px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:120,opacity:.08,lineHeight:1}}>🏃</div>
        <div style={{fontSize:11,opacity:.5,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Challenges</div>
        <div style={{fontWeight:900,fontSize:26,fontFamily:DF,marginBottom:6,lineHeight:1.2}}>Cook your way to the finish line</div>
        <div style={{fontSize:13,opacity:.7,lineHeight:1.6,marginBottom:18}}>Like Nike Run Club — pick a challenge, invite a friend, track your progress. From a 5-dish sprint to a 30-cook marathon.</div>
        <div style={{display:"flex",gap:10}}>
          {[["🏃","5 to 30 dishes"],["⚔️","With friends"],["🏅","Earn badges"]].map(([e,t])=>(
            <div key={t} style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{e}</div>
              <div style={{fontSize:10,fontWeight:700,opacity:.7}}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        {/* Active challenges */}
        {active.length>0&&(
          <>
            <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:4,fontFamily:DF}}>In Progress</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Keep going — you're already on the board.</div>
            {active.map(ch=><ChallengeCard key={ch.id} ch={ch} userProgress={userProgress} onOpen={setSelected}/>)}
          </>
        )}

        {/* Available */}
        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:4,fontFamily:DF,marginTop:active.length?24:0}}>Pick Your Challenge</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Start at any level. Complete it solo or with a friend.</div>
        {available.map(ch=><ChallengeCard key={ch.id} ch={ch} userProgress={userProgress} onOpen={setSelected}/>)}
      </div>
    </div>
  );
}

/* ═══ SKILL TREE ══════════════════════════════════════════════════════════ */
function SkillsTab({skillData, earnedBadges}) {
  return(
    <div style={{paddingBottom:30}}>
      <div style={{margin:"4px 16px 20px",background:`linear-gradient(135deg,${C.bark},#4A2E18)`,borderRadius:20,padding:"20px",color:"#fff"}}>
        <div style={{fontWeight:900,fontSize:22,fontFamily:DF,marginBottom:4}}>Your Skill Tree</div>
        <div style={{fontSize:13,opacity:.7,lineHeight:1.5}}>Every recipe you cook levels up the right skill automatically. Hit level 3 to unlock badges.</div>
      </div>

      <div style={{padding:"0 16px"}}>
        {/* Skills grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28}}>
          {Object.entries(SKILL_MAP).map(([cat,skill])=>{
            const level = skillData[cat] || 0;
            const cookCount = (skillData[`${cat}_count`] || 0);
            const nextLevelAt = (level+1)*2;
            const progressInLevel = cookCount - (level*2);
            const pctToNext = level>=5?100:Math.round(progressInLevel/2*100);
            return(
              <div key={cat} style={{background:C.cream,border:`2px solid ${level>0?skill.color+"44":C.border}`,borderRadius:18,padding:"16px 14px",opacity:level===0?.6:1,transition:"all .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <span style={{fontSize:28}}>{skill.icon}</span>
                  <div style={{background:level>0?skill.color:C.border,borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:800,color:"#fff"}}>{level===0?"Locked":`Lv ${level}`}</div>
                </div>
                <div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:2}}>{skill.label}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:8}}>
                  {level===0?"Cook a dish to unlock":level>=5?"Max level!":` ${cookCount} cooked · next at ${nextLevelAt}`}
                </div>
                <div style={{display:"flex",gap:3}}>
                  {[1,2,3,4,5].map(n=><div key={n} style={{flex:1,height:5,borderRadius:99,background:n<=level?skill.color:"#E8DDD4",transition:"background .4s"}}/>)}
                </div>
                {level>0&&level<5&&<div style={{marginTop:6}}><XPBar pct={pctToNext} color={skill.color} h={4}/><div style={{fontSize:9,color:C.muted,marginTop:2}}>{progressInLevel}/2 to level {level+1}</div></div>}
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:4,fontFamily:DF}}>Badges</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Auto-unlocked as you cook and level up skills.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {BADGE_RULES.map(b=>{
            const earned=earnedBadges.includes(b.id);
            return(
              <div key={b.id} style={{background:earned?C.cream:"#F0EBE6",border:`2px solid ${earned?C.gold:"#E0D5CB"}`,borderRadius:16,padding:"14px 8px",textAlign:"center",opacity:earned?1:.45,boxShadow:earned?`0 4px 14px ${C.gold}33`:"none",transition:"all .3s"}}>
                <div style={{fontSize:26,marginBottom:5,filter:earned?"none":"grayscale(1)"}}>{b.emoji}</div>
                <div style={{fontSize:9,fontWeight:700,color:C.bark,lineHeight:1.3}}>{b.label}</div>
                {earned&&<div style={{fontSize:8,color:C.gold,fontWeight:700,marginTop:3}}>EARNED</div>}
                {!earned&&<div style={{fontSize:8,color:C.muted,marginTop:3,lineHeight:1.3}}>{b.desc}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ SOCIAL / FEED TAB ═══════════════════════════════════════════════════ */
function FeedTab({posts, setPosts, xp}) {
  const [showComments, setShowComments] = useState(null);
  const [newComment, setNewComment] = useState("");

  const giveKudos=(pid)=>setPosts(ps=>ps.map(p=>p.id!==pid?p:{...p,kudos:p.myKudos?p.kudos-1:p.kudos+1,myKudos:!p.myKudos}));

  const addComment=(pid)=>{
    if(!newComment.trim())return;
    setPosts(ps=>ps.map(p=>p.id!==pid?p:{...p,comments:[...(p.comments||[]),{user:"You",text:newComment.trim()}]}));
    setNewComment("");
  };

  return(
    <div style={{paddingBottom:24}}>
      {/* Your card */}
      <div style={{margin:"4px 16px 20px",background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"18px 20px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${C.flame},${C.ember})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>👩‍🍳</div>
          <div><div style={{fontWeight:900,fontSize:16,fontFamily:DF}}>You</div><div style={{fontSize:12,opacity:.65}}>Chef Lv.5 · 4🔥 streak</div></div>
          <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".08em"}}>Total XP</div><div style={{fontSize:20,fontWeight:900}}>{xp.toLocaleString()}</div></div>
        </div>

        {/* Leaderboard */}
        <div style={{fontWeight:700,fontSize:11,opacity:.55,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em"}}>This Week</div>
        {LEADERBOARD.map((u,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:u.isMe?"rgba(255,255,255,.12)":"transparent",borderRadius:10,padding:u.isMe?"6px 8px":"2px 8px"}}>
            <span style={{fontSize:14}}>{u.badge}</span>
            <span style={{flex:1,fontWeight:u.isMe?900:600,fontSize:13}}>{u.name}</span>
            <span style={{fontSize:11,opacity:.7}}>🔥{u.streak}</span>
            <span style={{fontWeight:800,fontSize:13,color:u.isMe?C.gold:"rgba(255,255,255,.75)"}}>{u.xp.toLocaleString()} xp</span>
          </div>
        ))}
      </div>

      <div style={{padding:"0 16px"}}>
        <div style={{fontWeight:900,fontSize:20,color:C.bark,marginBottom:16,fontFamily:DF}}>Friend Activity</div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {posts.map((post,idx)=>(
            <div key={post.id} style={{background:"#fff",borderRadius:20,overflow:"hidden",border:`1px solid ${C.border}`,animation:`fadeUp .35s ease ${idx*.06}s both`,boxShadow:"0 2px 16px rgba(0,0,0,.06)"}}>
              {/* Post header */}
              <div style={{padding:"14px 16px 12px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,borderRadius:13,background:`${C.ember}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{post.user.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{post.user.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{post.user.level} · {post.time}</div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:C.flame,background:`${C.flame}12`,borderRadius:8,padding:"3px 8px"}}>Cooked: {post.recipe}</div>
              </div>

              {/* Photo or emoji display */}
              {post.photo?(
                <img src={post.photo} alt={post.recipe} style={{width:"100%",maxHeight:380,objectFit:"cover"}}/>
              ):(
                <div style={{background:`linear-gradient(135deg,${C.bark}08,${C.ember}14)`,height:180,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
                  <span style={{fontSize:72}}>{post.emoji}</span>
                  <span style={{fontSize:13,fontWeight:700,color:C.bark,opacity:.3}}>{post.recipe}</span>
                </div>
              )}

              {/* Caption */}
              <div style={{padding:"12px 16px 0"}}>
                {post.caption&&<div style={{fontSize:14,color:C.bark,lineHeight:1.55,marginBottom:12}}><span style={{fontWeight:700}}>{post.user.name.split(" ")[0]}</span> {post.caption}</div>}

                {/* Kudos & comments bar */}
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <button onClick={()=>giveKudos(post.id)} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
                    <span style={{fontSize:22,animation:post.myKudos?"pop .3s ease":"none"}}>{post.myKudos?"👏":"🤍"}</span>
                    <span style={{fontSize:13,fontWeight:700,color:post.myKudos?C.flame:C.muted}}>{post.kudos} {post.kudos===1?"kudo":"kudos"}</span>
                  </button>
                  <button onClick={()=>setShowComments(showComments===post.id?null:post.id)} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
                    <span style={{fontSize:20}}>💬</span>
                    <span style={{fontSize:13,fontWeight:700,color:C.muted}}>{(post.comments||[]).length}</span>
                  </button>
                </div>

                {/* Comments */}
                {showComments===post.id&&(
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginBottom:12}}>
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
              </div>
              <div style={{height:14}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ HOME TAB ════════════════════════════════════════════════════════════ */
function HomeTab({xp,setXp,recipes,onOpen,onComplete,profile,goal,cookedDays,setCookedDays,onEditGoal,userProgress}) {
  const [completing,setCompleting]=useState(null);

  const quickComplete=(e,r)=>{
    e.stopPropagation(); if(completing)return;
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

  // Active challenge teaser
  const activeChallenge = CHALLENGE_TEMPLATES.find(ch=>(userProgress[ch.id]||0)>0&&(userProgress[ch.id]||0)<ch.target);

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
        <div style={{fontSize:11,opacity:.6,marginBottom:14}}>{goalComplete?"🎉 Goal smashed this week!":`${goal.target-weekDone} more cook${goal.target-weekDone===1?"":"s"} to go`}</div>
        <div style={{display:"flex",gap:5,marginBottom:16}}>
          {WEEK_LABELS.map((d,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:26,borderRadius:7,background:cookedDays[i]?goal.color:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{cookedDays[i]?"✓":""}</div><div style={{fontSize:8,marginTop:3,opacity:.45}}>{d}</div></div>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:14}}>
          {[["Total XP",`${xp.toLocaleString()} xp`],["Level","Chef 5"],["Cooked",`${recipes.filter(r=>r.done).length}`]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>{l}</div><div style={{fontSize:20,fontWeight:900}}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* XP bar */}
      <div style={{margin:"0 16px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:C.muted,fontWeight:600}}>Next level: Sous Chef</span>
          <span style={{fontSize:12,color:C.flame,fontWeight:700}}>{xp}/500 XP</span>
        </div>
        <XPBar pct={xp/5}/>
      </div>

      {/* Active challenge teaser */}
      {activeChallenge&&(
        <div style={{margin:"0 16px 18px",background:`linear-gradient(135deg,${activeChallenge.color}18,${activeChallenge.color}08)`,border:`2px solid ${activeChallenge.color}33`,borderRadius:16,padding:"14px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:28}}>{activeChallenge.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{activeChallenge.name}</div>
              <div style={{fontSize:11,color:activeChallenge.color,fontWeight:600,marginTop:2}}>{userProgress[activeChallenge.id]}/{activeChallenge.target} {activeChallenge.unit} · keep going!</div>
              <div style={{marginTop:6}}><XPBar pct={Math.round((userProgress[activeChallenge.id]||0)/activeChallenge.target*100)} color={activeChallenge.color} h={5}/></div>
            </div>
          </div>
        </div>
      )}

      {/* Today's queue */}
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:18,fontWeight:900,color:C.bark,margin:0,fontFamily:DF}}>Today's Queue</h2>
          <span style={{fontSize:12,color:C.flame,fontWeight:700}}>{recipes.filter(r=>!r.done).length} to cook</span>
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

/* ═══ RECIPES TAB ═════════════════════════════════════════════════════════ */
function RecipesTab({allRecipes, onOpen}) {
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
    if(sort==="cals")rs=[...rs].sort((a,b)=>(a.macros?.calories||0)-(b.macros?.calories||0));
    if(sort==="protein")rs=[...rs].sort((a,b)=>(b.macros?.protein||0)-(a.macros?.protein||0));
    if(sort==="xp")rs=[...rs].sort((a,b)=>b.xp-a.xp);
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
      <div style={{display:"flex",gap:8,padding:"0 16px 12px",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:700,flexShrink:0}}>Sort:</span>
        {[["default","Default"],["cals","Lowest Cal"],["protein","Most Protein"],["xp","Most XP"]].map(([k,lbl])=><button key={k} onClick={()=>setSort(k)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 10px",borderRadius:99,border:`1.5px solid ${sort===k?C.sky:C.border}`,background:sort===k?`${C.sky}18`:"transparent",color:sort===k?C.sky:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{lbl}</button>)}
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:12,color:C.muted,fontWeight:600,marginBottom:10}}>{filtered.length} recipe{filtered.length!==1?"s":""}</div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}><div style={{fontSize:44,marginBottom:12}}>🍽️</div><div style={{fontWeight:700,marginBottom:4}}>No recipes match</div><div style={{fontSize:13}}>Try adjusting filters</div></div>}
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
                  <div style={{display:"flex",gap:6,marginBottom:4}}>
                    {[["🔥",r.macros.calories,"kcal",C.flame],["💪",r.macros.protein,"g protein",C.sky]].map(([icon,val,unit,color])=>(
                      <span key={unit} style={{fontSize:10,fontWeight:700,color,background:`${color}12`,borderRadius:6,padding:"2px 6px"}}>{icon} {val}{unit}</span>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:C.muted}}>⏱ {r.time}</span>
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
function GoalPicker({goal,onSelect,onClose}) {
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🎯 Cooking Goal</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>Pick a rhythm that fits your life</div></div>
          <CloseBtn onClose={onClose}/>
        </div>
        <div style={{background:`${C.sky}14`,border:`1.5px solid ${C.sky}33`,borderRadius:14,padding:"11px 14px",marginBottom:18,marginTop:12}}>
          <div style={{fontSize:12,color:C.sky,fontWeight:700}}>💡 The best streak is the one you can actually keep. A weekly cook beats an abandoned daily streak every time.</div>
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

/* ═══ ROOT APP ════════════════════════════════════════════════════════════ */
export default function App() {
  const [onboarded,    setOnboarded]    = useState(false);
  const [tab,          setTab]          = useState("home");
  const [mounted,      setMounted]      = useState(false);
  const [xp,           setXp]           = useState(340);
  const [allRecipes,   setAllRecipes]   = useState(RECIPES);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [showGoal,     setShowGoal]     = useState(false);
  const [posts,        setPosts]        = useState(SEED_POSTS);
  const [profile,      setProfile]      = useState({dietary:"No restrictions",skill:"Home Cook"});
  const [goal,         setGoal]         = useState(STREAK_GOALS[2]);
  const [cookedDays,   setCookedDays]   = useState([true,true,false,true,false,false,false]);
  const [badgeToast,   setBadgeToast]   = useState(null);

  // Skill tracking: { Asian: count, Asian_count: raw_count, ... }
  const [skillData, setSkillData] = useState({});

  // Challenge progress: { challenge_id: count }
  const [challengeProgress, setChallengeProgress] = useState({sprint_5: 2});

  // Earned badges
  const [earnedBadges, setEarnedBadges] = useState(["first_cook"]);

  useEffect(()=>{ setTimeout(()=>setMounted(true),60); },[]);

  const checkBadges = useCallback((newStats) => {
    const newlyEarned = BADGE_RULES.filter(b => !earnedBadges.includes(b.id) && b.check(newStats));
    if(newlyEarned.length>0){
      setEarnedBadges(prev=>[...prev,...newlyEarned.map(b=>b.id)]);
      setBadgeToast(newlyEarned[0]); // show first new badge
    }
  },[earnedBadges]);

  const handleComplete = useCallback((recipe, photoUrl, caption) => {
    // Mark recipe done
    setAllRecipes(rs => rs.map(r => r.id===recipe.id ? {...r,done:true} : r));

    // Add XP
    const newXp = xp + recipe.xp;
    setXp(newXp);

    // Update streak
    const di = new Date().getDay(); const idx = di===0?6:di-1;
    setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});

    // Update skill data
    const cat = recipe.category;
    if(cat && SKILL_MAP[cat]){
      setSkillData(prev=>{
        const newCount = (prev[`${cat}_count`]||0) + 1;
        const newLevel = calcSkillLevel(newCount);
        return {...prev, [cat]:newLevel, [`${cat}_count`]:newCount};
      });
    }

    // Update challenge progress — any dish counts toward non-category challenges
    setChallengeProgress(prev=>{
      const updates = {};
      CHALLENGE_TEMPLATES.forEach(ch=>{
        const current = prev[ch.id]||0;
        if(current >= ch.target) return; // already complete
        // Category-specific challenge
        if(ch.category && recipe.category !== ch.category) return;
        updates[ch.id] = current + 1;
      });
      return {...prev,...updates};
    });

    // Post to feed if has caption or photo
    if(photoUrl || caption){
      setPosts(ps=>[{
        id:`p-${Date.now()}`,
        user:{name:"You",avatar:"👩‍🍳",level:"Chef Lv.5"},
        recipe:recipe.name, emoji:recipe.emoji, photo:photoUrl,
        caption: caption || `Just cooked ${recipe.name}! 🎉`,
        time:"just now",
        kudos:0, myKudos:false, comments:[],
      },...ps]);
    }

    // Check badges
    const newStats = {
      totalCooked: allRecipes.filter(r=>r.done).length + 1,
      bestStreak: cookedDays.filter(Boolean).length + 1,
      skillLevels: skillData,
      categoryCounts: Object.fromEntries(CHALLENGE_TEMPLATES.map(ch=>[ch.category||"any",(challengeProgress[ch.id]||0)])),
      completedChallenges: Object.keys(challengeProgress).filter(id=>(challengeProgress[id]||0)>=(CHALLENGE_TEMPLATES.find(c=>c.id===id)?.target||99)),
      totalKudos: posts.reduce((a,p)=>a+(p.myKudos?0:0),0),
      friendChallengesCompleted: 0,
    };
    checkBadges(newStats);

  },[xp,allRecipes,cookedDays,skillData,challengeProgress,posts,checkBadges]);

  const openRecipe = useCallback((recipe)=>{
    setDetailRecipe(allRecipes.find(r=>r.id===recipe.id)||recipe);
  },[allRecipes]);

  const handleChallengeFriend = (friendName, challenge) => {
    // In production this would send a real notification
    alert(`Challenge sent to ${friendName}! They'll be notified to join ${challenge.name} with you. 💪`);
  };

  const TABS=[
    {id:"home",       label:"Today",      emoji:"🍳"},
    {id:"recipes",    label:"Recipes",    emoji:"📖"},
    {id:"challenges", label:"Challenges", emoji:"🏃"},
    {id:"feed",       label:"Feed",       emoji:"👥"},
    {id:"skills",     label:"Skills",     emoji:"📈"},
  ];

  const weekDone = cookedDays.filter(Boolean).length;

  if(!onboarded) return(
    <>
      <style>{CSS}</style>
      <Onboarding onComplete={({profile:p,goal:g})=>{setProfile(p);setGoal(g);setOnboarded(true);}}/>
    </>
  );

  if(detailRecipe){
    const live = allRecipes.find(r=>r.id===detailRecipe.id)||detailRecipe;
    return(
      <>
        <style>{CSS}</style>
        <div style={{maxWidth:420,margin:"0 auto"}}>
          <RecipeDetail recipe={live} onBack={()=>setDetailRecipe(null)} onComplete={(r,photo,caption)=>{handleComplete(r,photo,caption);setDetailRecipe(null);}}/>
        </div>
      </>
    );
  }

  return(
    <>
      <style>{CSS}</style>
      {badgeToast&&<BadgeToast badge={badgeToast} onClose={()=>setBadgeToast(null)}/>}
      <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto",opacity:mounted?1:0,transform:mounted?"none":"translateY(10px)",transition:"all .35s cubic-bezier(.4,0,.2,1)"}}>
        {/* Header */}
        <div style={{background:C.paper,padding:"15px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontWeight:900,fontSize:22,color:C.bark,letterSpacing:"-.03em",fontFamily:DF}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
            <div style={{fontSize:11,color:C.muted,marginTop:-1}}>your daily cooking habit</div>
          </div>
          <div onClick={()=>setShowGoal(true)} className="tap" style={{background:`linear-gradient(135deg,${goal.color},${goal.color}BB)`,borderRadius:12,padding:"6px 13px",color:"#fff",fontWeight:800,fontSize:13,boxShadow:`0 4px 12px ${goal.color}44`,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"}}>
            {goal.icon} {weekDone}/{goal.target}
          </div>
        </div>

        {/* Content */}
        <div style={{minHeight:"calc(100vh - 118px)",paddingTop:14}}>
          {tab==="home"&&<HomeTab xp={xp} setXp={setXp} recipes={allRecipes} onOpen={openRecipe} onComplete={handleComplete} profile={profile} goal={goal} cookedDays={cookedDays} setCookedDays={setCookedDays} onEditGoal={()=>setShowGoal(true)} userProgress={challengeProgress}/>}
          {tab==="recipes"&&<RecipesTab allRecipes={allRecipes} onOpen={openRecipe}/>}
          {tab==="challenges"&&<ChallengesTab userProgress={challengeProgress} onChallengeSelect={()=>{}} onChallengeFriend={handleChallengeFriend}/>}
          {tab==="feed"&&<FeedTab posts={posts} setPosts={setPosts} xp={xp}/>}
          {tab==="skills"&&<SkillsTab skillData={skillData} earnedBadges={earnedBadges}/>}
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