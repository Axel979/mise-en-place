'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══ TOKENS ══════════════════════════════════════════════════════════════ */
const C = {
  flame:"#FF4D1C", ember:"#FF8C42", cream:"#FFF8F0", paper:"#FAF4EE",
  bark:"#3B2A1A",  sage:"#5C7A4E",  moss:"#8BAF78",  gold:"#F5C842",
  muted:"#9E8C7E", border:"#EEE5DC",pill:"#F0EBE6",  sky:"#4A90D9",
  plum:"#9B5DE5",  teal:"#00A896",  rose:"#E05C7A",
};
const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@400;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box} body{margin:0;background:${C.paper};font-family:${BF}}
  ::-webkit-scrollbar{display:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pop{0%,100%{transform:scale(1)}45%{transform:scale(1.35)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
  @keyframes slideRight{from{transform:translateX(60px);opacity:0}to{transform:none;opacity:1}}
  @keyframes timerPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,77,28,.4)}70%{box-shadow:0 0 0 12px rgba(255,77,28,0)}}
  .ch:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(0,0,0,.10)!important}
  .tap:active{transform:scale(.94)!important} input,textarea,button{font-family:inherit}
`;

/* ═══ DATA ════════════════════════════════════════════════════════════════ */
const CATEGORIES = ["All","Breakfast","Quick","Asian","Indian","Japanese","Italian","Mexican","Mediterranean","Comfort","Healthy","Baking"];
const DIET_FILTERS = ["All","Vegetarian","Vegan","Gluten-free","Keto","Dairy-free","High Protein"];
const DIET_OPTIONS = ["No restrictions","Vegetarian","Vegan","Gluten-free","Dairy-free","Halal","Keto","Nut-free"];
const SKILL_LEVELS = ["Beginner","Home Cook","Intermediate","Advanced","Chef"];
const WEEK_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const STREAK_GOALS = [
  {id:"daily",   label:"Every day",   sub:"Full commitment",             icon:"🔥",target:7,color:C.flame},
  {id:"5x",      label:"5× a week",   sub:"Weekday warrior",             icon:"💪",target:5,color:C.ember},
  {id:"3x",      label:"3× a week",   sub:"Balanced, sustainable",       icon:"🌿",target:3,color:C.sage},
  {id:"weekend", label:"Weekends",    sub:"Relaxed weekend cooking",     icon:"☀️",target:2,color:C.gold},
  {id:"weekly",  label:"Once a week", sub:"Busy schedule — no pressure", icon:"🗓️",target:1,color:C.sky},
  {id:"mealprep",label:"Meal prep",   sub:"One big Sunday batch session",icon:"📦",target:1,color:C.plum},
];

const MONTHLY_CHALLENGES = [
  {id:"knife-march",month:"March 2025",title:"Knife Skills March",emoji:"🔪",color:"#5A3A8A",bgColor:"#F0EBF8",badge:"🥋",badgeLabel:"Knife Sensei",description:"Master the cuts that make everything faster. Brunoise, julienne, chiffonade — foundations that last a lifetime.",participants:4201,milestones:[{label:"Master the brunoise cut",xp:120,done:true},{label:"Julienne a carrot perfectly",xp:100,done:true},{label:"Chiffonade fresh herbs",xp:80,done:true},{label:"Break down a whole chicken",xp:200,done:true}]},
  {id:"sourdough-april",month:"April 2025",title:"Sourdough April",emoji:"🍞",color:"#C27C2C",bgColor:"#FDF3E3",badge:"🏅",badgeLabel:"Bread Whisperer",description:"From nurturing a starter to scoring your first loaf — bread that takes patience and pays off tenfold.",participants:2847,milestones:[{label:"Feed a starter for 7 consecutive days",xp:100,done:true},{label:"Bake your first sourdough loaf",xp:200,done:true},{label:"Nail an open, airy crumb",xp:250,done:false},{label:"Make sourdough focaccia",xp:150,done:false},{label:"Gift a loaf to someone",xp:100,done:false}]},
  {id:"ferment-may",month:"May 2025",title:"Ferment May",emoji:"🫙",color:C.sage,bgColor:"#EEF6E9",badge:"🏅",badgeLabel:"Fermentation Alchemist",description:"Kimchi, miso, pickles and kombucha — explore the living world of fermentation.",participants:1923,milestones:[{label:"Make your first batch of kimchi",xp:150,done:false},{label:"Ferment a vegetable pickle",xp:100,done:false},{label:"Brew a batch of kombucha",xp:200,done:false},{label:"Make miso paste from scratch",xp:300,done:false}]},
  {id:"pasta-june",month:"June 2025",title:"Fresh Pasta June",emoji:"🍝",color:C.ember,bgColor:"#FFF0E6",badge:"🏅",badgeLabel:"Pasta Artisan",description:"Roll, cut, shape and sauce your way through the world of handmade pasta.",participants:3102,milestones:[{label:"Make a fresh egg pasta dough",xp:100,done:false},{label:"Cut tagliatelle by hand",xp:120,done:false},{label:"Shape tortellini",xp:180,done:false},{label:"Create your own pasta shape",xp:250,done:false}]},
];

const mk = (cal,pro,carb,fat,fib=2) => ({calories:cal,protein:pro,carbs:carb,fat,fiber:fib});

// Steps with optional timer field (seconds)
const SEED_RECIPES = [
  {
    id:1,name:"Miso Glazed Salmon",emoji:"🐟",xp:80,difficulty:"Medium",time:"25 min",category:"Japanese",done:false,
    tags:["High Protein"],diets:["No restrictions","Gluten-free","Dairy-free"],macros:mk(420,38,18,22,1),
    ingredients:["2 salmon fillets (180g each)","3 tbsp white miso paste","2 tbsp mirin","1 tbsp soy sauce","1 tsp sesame oil","1 clove garlic, grated","Green onions & sesame seeds to serve"],
    steps:[{title:"Make the glaze",body:"Whisk miso, mirin, soy sauce, sesame oil and garlic until completely smooth."},{title:"Coat & marinate",body:"Pat salmon dry. Coat all sides in glaze.",timer:600},{title:"Broil",body:"High broil on foil-lined tray. Salmon skin-side down.",timer:420},{title:"Serve",body:"Scatter green onions and sesame. Serve over steamed rice."}],
    tip:"Watch closely — miso burns fast. Deep amber, not char.",
  },
  {
    id:2,name:"Shakshuka",emoji:"🍳",xp:60,difficulty:"Easy",time:"20 min",category:"Mediterranean",done:false,
    tags:["Brunch","One-pan"],diets:["Vegetarian","Gluten-free"],macros:mk(310,18,22,18,4),
    ingredients:["6 large eggs","1×400g can crushed tomatoes","1 red bell pepper, diced","1 white onion, diced","4 cloves garlic, minced","2 tsp cumin","1 tsp smoked paprika","½ tsp cayenne","Feta, cilantro & bread to serve"],
    steps:[{title:"Sauté the base",body:"Cook onion and pepper in oil 6 min. Add garlic and spices, 1 min more.",timer:420},{title:"Build the sauce",body:"Add tomatoes. Season. Simmer until thick.",timer:600},{title:"Add eggs",body:"Make 6 wells. Crack one egg into each."},{title:"Cover & finish",body:"Cover on medium-low until whites set, yolks jammy.",timer:360},{title:"Top with feta and cilantro and serve immediately."}],
    tip:"Pull off heat when yolks look underdone — residual heat finishes them.",
  },
  {
    id:3,name:"Thai Green Curry",emoji:"🍛",xp:120,difficulty:"Hard",time:"45 min",category:"Asian",done:false,
    tags:["Spicy"],diets:["Gluten-free","Dairy-free"],macros:mk(520,34,28,32,3),
    ingredients:["400ml full-fat coconut milk","3 tbsp green curry paste","500g chicken thigh, sliced","1 zucchini, sliced","1 cup Thai eggplant","4 kaffir lime leaves","2 tbsp fish sauce","1 tbsp palm sugar","Thai basil, jasmine rice"],
    steps:[{title:"Fry the paste",body:"Scoop coconut cream from top of can. Fry curry paste in it 2 min until fragrant.",timer:120},{title:"Seal chicken",body:"Add chicken. Stir-fry until sealed.",timer:240},{title:"Add coconut milk",body:"Pour in remaining coconut milk and lime leaves. Gentle simmer."},{title:"Add vegetables & simmer.",timer:540},{title:"Season with fish sauce and palm sugar. Stir in Thai basil just before serving."}],
    tip:"Fry paste in coconut cream, not oil — deeper flavour.",
  },
  {
    id:4,name:"Avocado Toast & Eggs",emoji:"🥑",xp:35,difficulty:"Easy",time:"10 min",category:"Breakfast",done:false,
    tags:["Quick","High Protein"],diets:["Vegetarian","Dairy-free"],macros:mk(420,18,38,22,8),
    ingredients:["2 thick slices sourdough","1 large avocado","2 eggs","½ lemon","Chilli flakes","Salt & black pepper","Microgreens"],
    steps:[{title:"Toast bread",body:"Toast sourdough until deeply golden and crunchy.",timer:180},{title:"Smash avocado",body:"Scoop into bowl. Add lemon juice, salt, pepper. Smash to chunky texture."},{title:"Poach eggs",body:"Simmer water with a splash of vinegar. Swirl. Crack eggs in. Poach.",timer:180},{title:"Assemble",body:"Spread avocado on toast. Top with poached egg, chilli and microgreens."}],
    tip:"Salt the avocado generously — it's the whole flavour base.",
  },
  {
    id:5,name:"Overnight Oats",emoji:"🥣",xp:25,difficulty:"Easy",time:"5 min",category:"Breakfast",done:false,
    tags:["Meal Prep","Vegan"],diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:mk(380,12,58,10,7),
    ingredients:["1 cup rolled oats","1 cup oat milk","2 tbsp chia seeds","1 tbsp maple syrup","½ tsp vanilla","Toppings: berries, banana, nut butter"],
    steps:[{title:"Mix",body:"Combine oats, milk, chia seeds, maple syrup and vanilla. Stir well."},{title:"Jar up",body:"Pour into a mason jar or container with lid."},{title:"Refrigerate overnight.",timer:0},{title:"Top & serve",body:"In the morning add berries, banana and nut butter."}],
    tip:"Make 4 jars on Sunday — breakfast sorted for the week.",
  },
  {
    id:6,name:"Butter Chicken",emoji:"🍗",xp:110,difficulty:"Medium",time:"45 min",category:"Indian",done:false,
    tags:["Rich","Family Favourite"],diets:["Gluten-free","Keto"],macros:mk(540,38,18,36,2),
    ingredients:["600g chicken thigh","400ml heavy cream","1×400g can crushed tomatoes","3 tbsp butter","2 tsp garam masala","1 tsp turmeric","1 tsp smoked paprika","4 cloves garlic","1 tsp ginger","Fresh cilantro"],
    steps:[{title:"Season & sear",body:"Toss chicken in spices. Sear in butter until golden.",timer:360},{title:"Build sauce",body:"Add garlic and ginger 1 min. Add tomatoes and cream."},{title:"Simmer until thick and chicken cooked through.",timer:1200},{title:"Finish",body:"Add cold knob of butter. Top with cilantro."}],
    tip:"A final cold knob of butter stirred off-heat makes the sauce silky.",
  },
  {
    id:7,name:"Tacos al Pastor",emoji:"🌮",xp:95,difficulty:"Medium",time:"40 min",category:"Mexican",done:false,
    tags:["Bold"],diets:["Gluten-free","Dairy-free"],macros:mk(480,28,42,20,4),
    ingredients:["500g pork shoulder, thin-sliced","3 dried guajillo chillies, soaked","1 chipotle in adobo","3 cloves garlic","1 tsp cumin","3 tbsp white vinegar","½ pineapple (½ blended, ½ sliced)","Corn tortillas, white onion, cilantro, lime"],
    steps:[{title:"Marinade",body:"Blend chillies, chipotle, garlic, cumin, vinegar and blended pineapple. Coat pork.",timer:7200},{title:"Cook pork",body:"Sear on very hot pan until charred at edges.",timer:300},{title:"Char pineapple",body:"Grill pineapple slices until caramelised.",timer:180},{title:"Assemble",body:"Warm tortillas. Load with pork, pineapple, onion and cilantro. Squeeze lime."}],
    tip:"Charring the pork edges is the whole point — go hotter than you think.",
  },
  {
    id:8,name:"Aglio e Olio",emoji:"🍝",xp:50,difficulty:"Easy",time:"15 min",category:"Italian",done:false,
    tags:["Quick","Vegetarian"],diets:["Vegetarian","Dairy-free"],macros:mk(520,14,72,20,3),
    ingredients:["400g spaghetti","8 cloves garlic, thinly sliced","½ cup extra-virgin olive oil","1 tsp chilli flakes","Flat-leaf parsley","Pecorino Romano"],
    steps:[{title:"Boil pasta",body:"Cook in heavily salted water, 2 min under package time.",timer:480},{title:"Toast garlic",body:"Warm oil medium-low. Add garlic and chilli — pale gold.",timer:300},{title:"Emulsify",body:"Add a ladle of pasta water to garlic oil. Stir until cloudy."},{title:"Toss & serve",body:"Add pasta. Toss off heat. Add pasta water until silky. Fold in parsley."}],
    tip:"The pasta water IS the sauce. Keep a full cup nearby.",
  },
  {
    id:9,name:"Chicken Tikka Masala",emoji:"🍲",xp:105,difficulty:"Medium",time:"50 min",category:"Indian",done:false,
    tags:["Crowd Pleaser"],diets:["Gluten-free"],macros:mk(490,36,24,28,3),
    ingredients:["500g chicken breast","200g full-fat yoghurt","3 tsp tikka masala paste","400ml passata","200ml double cream","1 onion, diced","4 cloves garlic","1 tsp ginger","2 tsp garam masala","Coriander, rice"],
    steps:[{title:"Marinate chicken",body:"Mix yoghurt with 2 tsp tikka paste. Coat chicken.",timer:3600},{title:"Char the chicken",body:"Grill on high until charred in spots.",timer:480},{title:"Build sauce",body:"Fry onion 8 min. Add spices. Add passata.",timer:1380},{title:"Combine",body:"Add charred chicken and cream. Simmer 10 min.",timer:600}],
    tip:"Charring the chicken is what separates tikka masala from a plain curry.",
  },
  {
    id:10,name:"French Onion Soup",emoji:"🧅",xp:110,difficulty:"Medium",time:"1h 20m",category:"Comfort",done:false,
    tags:["Cozy","Classic"],diets:["Vegetarian"],macros:mk(440,18,38,24,4),
    ingredients:["1.2kg yellow onions, thinly sliced","4 tbsp unsalted butter","½ cup dry white wine","1.5L good beef or veg stock","2 sprigs thyme, 1 bay leaf","8 baguette slices, toasted","200g Gruyère, grated"],
    steps:[{title:"Caramelise onions",body:"Cook in butter over medium heat, stirring every 5 min.",timer:3000},{title:"Deglaze",body:"Add wine. Scrape brown bits. Cook until absorbed.",timer:180},{title:"Simmer",body:"Add stock, thyme, bay leaf. Simmer.",timer:1200},{title:"Gratinée",body:"Fill oven-safe bowls. Add baguette and Gruyère. Broil until golden.",timer:240}],
    tip:"Deep amber onions, not pale and soft. That's 80% of the dish.",
  },
  {
    id:11,name:"Masala Dosa",emoji:"🫓",xp:100,difficulty:"Hard",time:"50 min",category:"Indian",done:false,
    tags:["Vegetarian","Crispy"],diets:["Vegetarian","Vegan","Gluten-free","Dairy-free"],macros:mk(380,9,68,8,4),
    ingredients:["2 cups rice flour","½ cup urad dal flour","Salt & water","2 tbsp oil","3 potatoes, boiled and mashed","1 onion, diced","1 tsp mustard seeds","1 tsp turmeric","Curry leaves, 2 green chillies"],
    steps:[{title:"Make batter",body:"Mix rice flour, urad dal flour, salt and enough water to thin pancake consistency.",timer:1800},{title:"Potato filling",body:"Fry mustard seeds until popping. Add onion, curry leaves, chilli, turmeric and mashed potato.",timer:300},{title:"Cook the dosa",body:"High-heat non-stick pan. Pour batter in a thin circle. Drizzle oil around edges.",timer:180},{title:"Fill & fold",body:"Spoon potato filling along the centre. Fold and serve with sambar."}],
    tip:"The pan must be very hot — a cold pan makes a sticky dosa.",
  },
  {
    id:12,name:"Smash Burgers",emoji:"🍔",xp:70,difficulty:"Medium",time:"20 min",category:"Comfort",done:false,
    tags:["Crowd Pleaser"],diets:["No restrictions"],macros:mk(680,38,42,38,2),
    ingredients:["500g 80/20 ground beef","4 brioche buns","8 slices American cheese","1 white onion, finely diced","Pickles, shredded iceberg","3 tbsp mayo, 1 tbsp ketchup, 1 tsp mustard"],
    steps:[{title:"Make sauce",body:"Combine mayo, ketchup, mustard and paprika. Chill."},{title:"Portion loosely",body:"Divide beef into 8 loose 60g balls. Do not compact."},{title:"Smash & crust",body:"Screaming-hot cast iron. Ball down, smash flat, HOLD 10 sec. Cook until dark edges.",timer:90},{title:"Cheese & stack",body:"Flip. Cheese immediately. 45 sec more. Stack two patties per bun.",timer:45}],
    tip:"SMASH hard and fast on contact — that's the lacy crust.",
  },
];

const LEADERBOARD = [
  {rank:1,name:"Sofia R.", avatar:"👩‍🍳",xp:1240,streak:12,badge:"🥇"},
  {rank:2,name:"Jake M.",  avatar:"🧑‍🍳",xp:1105,streak:7, badge:"🥈"},
  {rank:3,name:"Priya K.", avatar:"👩‍🦱",xp:980, streak:5, badge:"🥉"},
  {rank:4,name:"You",      avatar:"🧑",  xp:340, streak:4, badge:"4️⃣",isMe:true},
  {rank:5,name:"Marcus T.",avatar:"🧔",  xp:290, streak:3, badge:"5️⃣"},
];

const SEED_POSTS = [
  {id:"p1",user:{name:"Sofia R.", avatar:"👩‍🍳",level:"Sous Chef"},recipe:"Beef Bourguignon",emoji:"🥩",photo:null,caption:"Three hours of love. Worth every minute 🤤",         time:"2h ago",reactions:{"❤️":14,"🔥":9,"😍":7,"🤤":12},myReaction:null},
  {id:"p2",user:{name:"Jake M.",  avatar:"🧑‍🍳",level:"Chef Lv.4"},recipe:"Sourdough Focaccia",emoji:"🍞",photo:null,caption:"Finally nailed the open crumb. Salt flakes = 🤌",time:"5h ago",reactions:{"❤️":8,"🔥":22,"😍":5,"🤤":4}, myReaction:null},
  {id:"p3",user:{name:"Priya K.", avatar:"👩‍🦱",level:"Home Cook"},recipe:"Miso Ramen",      emoji:"🍜",photo:null,caption:"Homemade broth simmered 6 hours. My flat smells incredible.",time:"1d ago",reactions:{"❤️":31,"🔥":18,"😍":24,"🤤":29},myReaction:null},
];

const GROCERY_CATS = ["🥩 Meat & Fish","🥛 Dairy & Eggs","🥦 Produce","🧀 Deli","🫙 Pantry & Dry","🌿 Herbs & Spices","🍞 Bread & Bakery","🥫 Canned & Jarred"];

/* ═══ API ═════════════════════════════════════════════════════════════════ */
const callClaude = async (system, msg, imgB64=null) => {
  const content = imgB64
    ? [{type:"image",source:{type:"base64",media_type:"image/jpeg",data:imgB64}},{type:"text",text:msg}]
    : msg;
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system,messages:[{role:"user",content}]}),
  });
  return (await res.json()).content?.map(b=>b.text||"").join("")||"";
};
const toB64 = f => new Promise((ok,er) => {const r=new FileReader();r.onload=()=>ok(r.result.split(",")[1]);r.onerror=er;r.readAsDataURL(f);});
const parseJSON = raw => JSON.parse(raw.replace(/```json|```/g,"").trim());
const fmt = s => s>=3600?`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`:s>=60?`${Math.floor(s/60)}m ${s%60}s`:`${s}s`;

/* ═══ MICRO COMPONENTS ════════════════════════════════════════════════════ */
const XPBar = ({pct,color=C.flame,h=8}) => (
  <div style={{background:"#E8DDD4",borderRadius:999,height:h,overflow:"hidden",width:"100%"}}>
    <div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:"100%",background:color,borderRadius:999,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
);
const DiffBadge = ({level}) => {
  const col={Easy:C.sage,Medium:C.ember,Hard:C.flame}[level]||C.muted;
  return <span style={{fontSize:10,fontWeight:800,color:col,background:`${col}1A`,borderRadius:6,padding:"2px 7px"}}>{level}</span>;
};
const Chip = ({label,color=C.muted,bg}) => <span style={{fontSize:10,fontWeight:700,color,background:bg||`${color}18`,borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>{label}</span>;
const Spinner = ({label="One moment…"}) => (
  <div style={{textAlign:"center",padding:"36px 0"}}>
    <div style={{fontSize:46,display:"inline-block",animation:"spin 1.2s linear infinite",marginBottom:12}}>🍳</div>
    <div style={{fontSize:14,color:C.muted,fontWeight:600}}>{label}</div>
  </div>
);
const Sheet = ({children,onClose}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(30,18,8,.65)",zIndex:300,display:"flex",alignItems:"flex-end",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.paper,borderRadius:"24px 24px 0 0",width:"100%",maxHeight:"94vh",overflowY:"auto",animation:"slideUp .28s cubic-bezier(.4,0,.2,1)"}}>{children}</div>
  </div>
);
const CloseBtn = ({onClose}) => <button onClick={onClose} style={{background:C.pill,border:"none",borderRadius:10,width:34,height:34,cursor:"pointer",fontSize:18,color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>;
const Btn = ({children,onClick,color=C.flame,outline=false,disabled=false,full=false,sm=false,style:x={}}) => (
  <button className="tap" onClick={onClick} disabled={disabled} style={{border:outline?`2px solid ${disabled?C.border:color}`:"none",background:outline?"transparent":disabled?"#D8D0C8":color,color:outline?(disabled?C.border:color):"#fff",borderRadius:14,padding:sm?"8px 14px":"12px 20px",fontWeight:800,fontSize:sm?12:14,cursor:disabled?"not-allowed":"pointer",boxShadow:(!outline&&!disabled)?`0 4px 14px ${color}44`:"none",transition:"all .18s",opacity:disabled?.55:1,width:full?"100%":"auto",...x}}>{children}</button>
);

/* ═══ MACRO COMPONENTS ════════════════════════════════════════════════════ */
const MACRO_CONFIG = [
  {key:"calories",label:"Cal",    unit:"kcal",color:C.flame,icon:"🔥"},
  {key:"protein", label:"Protein",unit:"g",   color:C.sky,  icon:"💪"},
  {key:"carbs",   label:"Carbs",  unit:"g",   color:C.gold, icon:"🌾"},
  {key:"fat",     label:"Fat",    unit:"g",   color:C.ember,icon:"🫒"},
  {key:"fiber",   label:"Fiber",  unit:"g",   color:C.sage, icon:"🥦"},
];
const MacroPanel = ({macros}) => !macros?null:(
  <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
    <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:14,fontFamily:DF}}>Nutrition per serving</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
      {MACRO_CONFIG.map(({key,label,unit,color,icon})=>(
        <div key={key} style={{background:`${color}0D`,borderRadius:14,padding:"10px 4px",textAlign:"center",border:`1.5px solid ${color}22`}}>
          <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
          <div style={{fontWeight:900,fontSize:15,color:C.bark}}>{macros[key]}</div>
          <div style={{fontSize:9,color,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</div>
          <div style={{fontSize:9,color:C.muted}}>{unit}</div>
        </div>
      ))}
    </div>
  </div>
);
const MacroRow = ({macros}) => !macros?null:(
  <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2,marginBottom:4}}>
    {MACRO_CONFIG.map(({key,label,color})=>(
      <div key={key} style={{flexShrink:0,background:`${color}12`,borderRadius:8,padding:"4px 8px",textAlign:"center",border:`1px solid ${color}22`}}>
        <div style={{fontWeight:800,fontSize:13,color:C.bark}}>{macros[key]}</div>
        <div style={{fontSize:8,color,fontWeight:700,textTransform:"uppercase"}}>{label}</div>
      </div>
    ))}
  </div>
);

/* ═══ STEP TIMER ══════════════════════════════════════════════════════════ */
function StepTimer({seconds, onDone}) {
  const [remaining, setRemaining] = useState(seconds);
  const [running,   setRunning]   = useState(false);
  const [finished,  setFinished]  = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds); setRunning(false); setFinished(false);
  }, [seconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); setFinished(true); onDone?.(); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = Math.max(0, Math.round((1 - remaining / seconds) * 100));
  const urgentColor = remaining <= 30 ? C.flame : remaining <= 60 ? C.ember : C.sage;

  if (finished) return (
    <div style={{background:`${C.sage}18`,border:`2px solid ${C.sage}44`,borderRadius:16,padding:"14px 18px",textAlign:"center",animation:"pop .4s ease"}}>
      <div style={{fontSize:28,marginBottom:6}}>✅</div>
      <div style={{fontWeight:800,fontSize:15,color:C.sage}}>Timer done! Move to the next step.</div>
    </div>
  );

  return (
    <div style={{background:running?`${urgentColor}10`:`${C.sky}0A`,border:`2px solid ${running?urgentColor:C.sky}44`,borderRadius:16,padding:"16px 18px",transition:"all .3s",animation:running&&remaining<=10?"timerPulse 1s infinite":undefined}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <span style={{fontSize:24}}>⏱</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>Step Timer</div>
          <div style={{fontWeight:900,fontSize:28,color:running?urgentColor:C.bark,fontFamily:DF,lineHeight:1}}>{fmt(remaining)}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setRunning(r=>!r)} className="tap" style={{background:running?C.ember:C.sage,border:"none",borderRadius:11,padding:"9px 16px",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",boxShadow:`0 3px 10px ${running?C.ember:C.sage}44`}}>
            {running?"⏸ Pause":"▶ Start"}
          </button>
          <button onClick={()=>{setRemaining(seconds);setRunning(false);setFinished(false);}} className="tap" style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>↺</button>
        </div>
      </div>
      <XPBar pct={pct} color={running?urgentColor:C.sky} h={6}/>
    </div>
  );
}

/* ═══ ONBOARDING ══════════════════════════════════════════════════════════ */
const ONBOARD_STEPS = [
  {
    id:"welcome",
    render:({next}) => (
      <div style={{textAlign:"center",padding:"40px 32px 32px"}}>
        <div style={{fontSize:72,marginBottom:20,animation:"pop .6s ease"}}>🍳</div>
        <div style={{fontWeight:900,fontSize:32,color:C.bark,fontFamily:DF,lineHeight:1.2,marginBottom:16}}>
          mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place
        </div>
        <div style={{fontSize:16,color:C.muted,lineHeight:1.7,marginBottom:32}}>Your daily cooking companion. Build a habit, level up your skills, and actually cook more — at a pace that fits your life.</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:32}}>
          {[["🎯","Set a goal that fits your schedule"],["📖","Get personalised recipe suggestions"],["⚡","Earn XP and level up your skills"],["👥","Share dishes and cook with friends"]].map(([e,t])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:14,background:C.cream,borderRadius:14,padding:"12px 16px",border:`1px solid ${C.border}`}}>
              <span style={{fontSize:22}}>{e}</span><span style={{fontSize:14,color:C.bark,fontWeight:600,textAlign:"left"}}>{t}</span>
            </div>
          ))}
        </div>
        <Btn onClick={next} full style={{fontSize:16,padding:"15px"}}>Get Started →</Btn>
      </div>
    ),
  },
  {
    id:"goal",
    render:({next, profile, setProfile, goal, setGoal}) => (
      <div style={{padding:"32px 24px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:12}}>🎯</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>How often will you cook?</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>Pick an honest goal. The best habit is one you can actually keep.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {STREAK_GOALS.map(g=>{
            const active=goal.id===g.id;
            return (
              <button key={g.id} className="tap" onClick={()=>setGoal(g)} style={{background:active?`${g.color}14`:C.cream,border:`2px solid ${active?g.color:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .18s"}}>
                <div style={{width:44,height:44,borderRadius:12,background:active?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}><div style={{fontWeight:900,fontSize:14,color:C.bark}}>{g.label}</div><div style={{fontSize:12,color:C.muted}}>{g.sub}</div></div>
                <div style={{fontWeight:900,fontSize:18,color:active?g.color:C.muted,flexShrink:0}}>{g.target}×</div>
                {active&&<div style={{width:20,height:20,borderRadius:"50%",background:g.color,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <Btn onClick={next} full>Continue →</Btn>
      </div>
    ),
  },
  {
    id:"diet",
    render:({next, profile, setProfile}) => (
      <div style={{padding:"32px 24px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:12}}>🥗</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>Dietary preferences?</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>We'll personalise your recipe suggestions and AI generation.</div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:28}}>
          {DIET_OPTIONS.map(opt=>(
            <button key={opt} onClick={()=>setProfile(p=>({...p,dietary:opt}))} className="tap" style={{padding:"10px 16px",borderRadius:99,border:`2px solid ${profile.dietary===opt?C.sage:C.border}`,background:profile.dietary===opt?C.sage:"transparent",color:profile.dietary===opt?"#fff":C.bark,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s"}}>{opt}</button>
          ))}
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:12,fontFamily:DF}}>Your skill level?</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {SKILL_LEVELS.map(lvl=>(
              <button key={lvl} onClick={()=>setProfile(p=>({...p,skill:lvl}))} className="tap" style={{padding:"9px 18px",borderRadius:99,border:`2px solid ${profile.skill===lvl?C.flame:C.border}`,background:profile.skill===lvl?C.flame:"transparent",color:profile.skill===lvl?"#fff":C.bark,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s"}}>{lvl}</button>
            ))}
          </div>
        </div>
        <Btn onClick={next} full>Continue →</Btn>
      </div>
    ),
  },
  {
    id:"notifications",
    render:({next, notifTime, setNotifTime, notifEnabled, setNotifEnabled}) => (
      <div style={{padding:"32px 24px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:12}}>🔔</div>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:8}}>Daily cooking reminder?</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>We'll nudge you at your chosen time to keep your streak alive.</div>
        </div>
        <div style={{background:C.cream,borderRadius:20,padding:20,border:`1px solid ${C.border}`,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <span style={{fontSize:32}}>🔔</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:15,color:C.bark}}>Daily reminder</div>
              <div style={{fontSize:12,color:C.muted}}>Reminds you to cook at your set time</div>
            </div>
            <button onClick={()=>setNotifEnabled(e=>!e)} style={{width:48,height:28,borderRadius:99,background:notifEnabled?C.sage:"#D0C8BF",border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:notifEnabled?22:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </button>
          </div>
          {notifEnabled&&(
            <div>
              <div style={{fontWeight:700,fontSize:12,color:C.muted,marginBottom:8}}>Reminder time</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {["07:00","08:00","12:00","17:00","18:00","19:00","20:00"].map(t=>(
                  <button key={t} onClick={()=>setNotifTime(t)} className="tap" style={{padding:"8px 14px",borderRadius:10,border:`2px solid ${notifTime===t?C.sage:C.border}`,background:notifTime===t?`${C.sage}18`:"transparent",color:notifTime===t?C.sage:C.bark,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s"}}>{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Btn onClick={next} full>Continue →</Btn>
        <button onClick={next} style={{width:"100%",marginTop:10,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600,padding:"8px"}}>Skip for now</button>
      </div>
    ),
  },
  {
    id:"done",
    render:({finish, profile, goal}) => (
      <div style={{textAlign:"center",padding:"40px 28px"}}>
        <div style={{fontSize:72,marginBottom:20,animation:"pop .6s ease"}}>🎉</div>
        <div style={{fontWeight:900,fontSize:28,color:C.bark,fontFamily:DF,marginBottom:12}}>You're all set!</div>
        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px",marginBottom:24,color:"#fff",textAlign:"left"}}>
          <div style={{fontSize:12,opacity:.6,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Your profile</div>
          {[["🎯 Goal",goal.label],["🥗 Diet",profile.dietary],["👨‍🍳 Skill",profile.skill]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:13,opacity:.7}}>{k}</span>
              <span style={{fontSize:13,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:28}}>You can change all of this anytime in your profile. Now let's cook something delicious.</div>
        <Btn onClick={finish} full style={{fontSize:16,padding:"15px"}}>Start Cooking 🍳</Btn>
      </div>
    ),
  },
];

function Onboarding({onComplete}) {
  const [step,         setStep]         = useState(0);
  const [profile,      setProfile]      = useState({dietary:"No restrictions",skill:"Intermediate"});
  const [goal,         setGoal]         = useState(STREAK_GOALS[2]);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTime,    setNotifTime]    = useState("18:00");

  const next   = () => setStep(s => Math.min(ONBOARD_STEPS.length-1, s+1));
  const finish = () => onComplete({profile,goal,notifEnabled,notifTime});

  const S = ONBOARD_STEPS[step];
  const progress = (step+1) / ONBOARD_STEPS.length;

  return (
    <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      {step>0&&(
        <div style={{padding:"20px 24px 0"}}>
          <div style={{background:"#E8DDD4",borderRadius:99,height:6,overflow:"hidden"}}>
            <div style={{width:`${progress*100}%`,height:"100%",background:C.flame,borderRadius:99,transition:"width .4s ease"}}/>
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:6,fontWeight:600}}>Step {step} of {ONBOARD_STEPS.length-1}</div>
        </div>
      )}
      <div style={{flex:1,overflowY:"auto",animation:"slideRight .3s ease"}}>
        <S.render next={next} finish={finish} profile={profile} setProfile={setProfile} goal={goal} setGoal={setGoal} notifEnabled={notifEnabled} setNotifEnabled={setNotifEnabled} notifTime={notifTime} setNotifTime={setNotifTime}/>
      </div>
    </div>
  );
}

/* ═══ GROCERY LIST ════════════════════════════════════════════════════════ */
function GrocerySheet({allRecipes, onClose}) {
  const [selected,  setSelected]  = useState({});
  const [loading,   setLoading]   = useState(false);
  const [list,      setList]      = useState(null); // {category:[items]}
  const [checked,   setChecked]   = useState({});
  const [view,      setView]      = useState("pick"); // pick | list

  const toggleRecipe = (id) => setSelected(s=>({...s,[id]:!s[id]}));
  const selectedIds  = Object.keys(selected).filter(k=>selected[k]);
  const selectedRecipes = allRecipes.filter(r=>selectedIds.includes(String(r.id)));

  const generateList = async () => {
    setLoading(true);
    try {
      const allIngredients = selectedRecipes.flatMap(r=>(r.ingredients||[]).map(i=>i));
      const sys = `You are a professional meal planner. Given a list of ingredients from multiple recipes, organise them into a smart grocery shopping list grouped by supermarket section. Consolidate duplicates and combine similar items. Respond ONLY as JSON (no markdown): {"${GROCERY_CATS[0]}":["item"],"${GROCERY_CATS[1]}":[],"${GROCERY_CATS[2]}":[],"${GROCERY_CATS[3]}":[],"${GROCERY_CATS[4]}":[],"${GROCERY_CATS[5]}":[],"${GROCERY_CATS[6]}":[],"${GROCERY_CATS[7]}":[]}. Only include categories that have items.`;
      const raw = await callClaude(sys, `Ingredients from: ${selectedRecipes.map(r=>r.name).join(", ")}.\n\nAll ingredients:\n${allIngredients.join("\n")}`);
      setList(parseJSON(raw));
      setView("list");
    } catch (e) {
      // Fallback: simple grouping
      const flat = selectedRecipes.flatMap(r=>r.ingredients||[]);
      setList({"🫙 Pantry & Dry": flat});
      setView("list");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (cat, idx) => {
    const key = `${cat}-${idx}`;
    setChecked(c=>({...c,[key]:!c[key]}));
  };

  const totalItems = list ? Object.values(list).flat().length : 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🛒 Grocery List</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>
              {view==="list" && list ? `${checkedCount}/${totalItems} items checked` : "Select recipes to generate your list"}
            </div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        {view==="pick" && !loading && (
          <>
            <div style={{fontSize:12,color:C.muted,fontWeight:600,marginBottom:10}}>Select recipes to shop for:</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
              {allRecipes.map(r=>(
                <button key={r.id} onClick={()=>toggleRecipe(r.id)} className="tap" style={{display:"flex",alignItems:"center",gap:12,background:selected[r.id]?`${C.sage}12`:C.cream,border:`2px solid ${selected[r.id]?C.sage:C.border}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:selected[r.id]?C.sage:`${C.ember}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,transition:"all .18s"}}>{selected[r.id]?"✓":r.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{(r.ingredients||[]).length} ingredients</div>
                  </div>
                </button>
              ))}
            </div>
            <Btn onClick={generateList} disabled={selectedIds.length===0} full>
              ✨ Generate List ({selectedIds.length} recipe{selectedIds.length!==1?"s":""})
            </Btn>
          </>
        )}

        {loading && <Spinner label="Organising your grocery list…"/>}

        {view==="list" && list && !loading && (
          <>
            {list && totalItems > 0 && (
              <div style={{background:C.cream,borderRadius:14,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:700,color:C.bark}}>{checkedCount}/{totalItems} items</span>
                <div style={{display:"flex",gap:8}}>
                  <XPBar pct={totalItems?checkedCount/totalItems*100:0} color={C.sage} h={8}/>
                </div>
                <button onClick={()=>setChecked({})} style={{fontSize:12,color:C.muted,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Clear</button>
              </div>
            )}
            {Object.entries(list).filter(([,items])=>items.length>0).map(([cat,items])=>(
              <div key={cat} style={{marginBottom:18}}>
                <div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:8}}>{cat}</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {items.map((item,idx)=>{
                    const key=`${cat}-${idx}`;
                    const done=checked[key];
                    return (
                      <button key={idx} onClick={()=>toggleItem(cat,idx)} className="tap" style={{display:"flex",alignItems:"center",gap:12,background:done?`${C.sage}0A`:C.cream,border:`1.5px solid ${done?C.sage:C.border}`,borderRadius:12,padding:"11px 14px",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${done?C.sage:C.border}`,background:done?C.sage:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,flexShrink:0,transition:"all .18s"}}>{done?"✓":""}</div>
                        <span style={{fontSize:14,color:done?C.muted:C.bark,textDecoration:done?"line-through":"none",transition:"all .15s"}}>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <Btn onClick={()=>{setView("pick");setList(null);setChecked({});}} outline color={C.muted} style={{flex:1}}>← Repick</Btn>
              <Btn onClick={onClose} color={C.sage} style={{flex:2}}>Done Shopping ✓</Btn>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ═══ RECIPE EDITOR ═══════════════════════════════════════════════════════ */
function RecipeEditor({recipe, onSave, onClose}) {
  const [name,        setName]        = useState(recipe.name);
  const [ingredients, setIngredients] = useState([...recipe.ingredients]);
  const [steps,       setSteps]       = useState(recipe.steps.map(s=>({...s})));
  const [macros,      setMacros]      = useState(recipe.macros?{...recipe.macros}:{calories:"",protein:"",carbs:"",fat:"",fiber:""});
  const [newIng,      setNewIng]      = useState("");
  const [newStepT,    setNewStepT]    = useState("");
  const [newStepB,    setNewStepB]    = useState("");
  const [activeTab,   setActiveTab]   = useState("ingredients");
  const [calcLoading, setCalcLoading] = useState(false);

  const addIng    = () => { if(newIng.trim()){setIngredients(i=>[...i,newIng.trim()]);setNewIng("");} };
  const removeIng = i => setIngredients(list=>list.filter((_,j)=>j!==i));
  const editIng   = (i,v) => setIngredients(list=>list.map((x,j)=>j===i?v:x));
  const addStep   = () => { if(newStepT.trim()&&newStepB.trim()){setSteps(s=>[...s,{title:newStepT.trim(),body:newStepB.trim()}]);setNewStepT("");setNewStepB("");} };
  const removeStep = i => setSteps(s=>s.filter((_,j)=>j!==i));
  const editStepBody = (i,v) => setSteps(s=>s.map((x,j)=>j===i?{...x,body:v}:x));

  const autoCalc = async () => {
    setCalcLoading(true);
    try {
      const raw = await callClaude(`You are a nutritionist. Respond ONLY as JSON (no markdown): {"calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number}. Values are per serving.`,`Estimate nutrition per serving for "${name}" with these ingredients: ${ingredients.join(", ")}`);
      setMacros(parseJSON(raw));
    } catch {} finally { setCalcLoading(false); }
  };

  const handleSave = () => {
    const m={};
    Object.keys(macros).forEach(k=>{m[k]=Number(macros[k])||0;});
    onSave({...recipe,name,ingredients,steps,macros:m});
    onClose();
  };

  const tabSt = (id) => ({flex:1,border:"none",cursor:"pointer",borderRadius:10,padding:"8px 4px",fontWeight:800,fontSize:12,background:activeTab===id?"#fff":"transparent",color:activeTab===id?C.bark:C.muted,boxShadow:activeTab===id?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .18s"});

  return (
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>✏️ Edit Recipe</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Customise ingredients, steps & nutrition</div></div>
          <CloseBtn onClose={onClose}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:".07em",textTransform:"uppercase",marginBottom:6}}>Recipe Name</div>
          <input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",padding:"11px 14px",borderRadius:14,border:`2px solid ${C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",background:C.pill,borderRadius:14,padding:4,gap:4,marginBottom:16}}>
          {[["ingredients","🥕 Ingredients"],["steps","📋 Steps"],["macros","⚡ Macros"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={tabSt(id)}>{lbl}</button>
          ))}
        </div>

        {activeTab==="ingredients"&&(
          <div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {ingredients.map((ing,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input value={ing} onChange={e=>editIng(i,e.target.value)} style={{flex:1,padding:"9px 12px",borderRadius:12,border:`2px solid ${C.border}`,background:C.cream,fontSize:13,color:C.bark,outline:"none"}}/>
                  <button onClick={()=>removeIng(i)} style={{width:32,height:32,borderRadius:10,background:`${C.flame}14`,border:`1.5px solid ${C.flame}33`,color:C.flame,fontWeight:800,fontSize:16,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={newIng} onChange={e=>setNewIng(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIng()} placeholder="Add ingredient (qty + name)…" style={{flex:1,padding:"11px 14px",borderRadius:14,border:`2px solid ${newIng?C.ember:C.border}`,background:C.cream,fontSize:13,color:C.bark,outline:"none",transition:"border-color .18s"}}/>
              <Btn onClick={addIng} disabled={!newIng.trim()} style={{padding:"11px 16px"}}>Add</Btn>
            </div>
          </div>
        )}

        {activeTab==="steps"&&(
          <div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {steps.map((s,i)=>(
                <div key={i} style={{background:C.cream,borderRadius:16,padding:"14px",border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                    <div style={{fontWeight:800,fontSize:14,color:C.bark,flex:1}}>{s.title||`Step ${i+1}`}</div>
                    <button onClick={()=>removeStep(i)} style={{width:28,height:28,borderRadius:8,background:`${C.flame}14`,border:`1.5px solid ${C.flame}33`,color:C.flame,fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                  <textarea value={s.body||""} onChange={e=>editStepBody(i,e.target.value)} style={{width:"100%",minHeight:60,borderRadius:10,border:`2px solid ${C.border}`,background:C.paper,padding:"10px 12px",fontSize:13,color:C.bark,outline:"none",resize:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <div style={{background:C.cream,borderRadius:16,padding:"14px",border:`2px dashed ${C.border}`}}>
              <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Add new step</div>
              <input value={newStepT} onChange={e=>setNewStepT(e.target.value)} placeholder="Step title…" style={{width:"100%",padding:"9px 12px",borderRadius:10,border:`2px solid ${C.border}`,background:C.paper,fontSize:13,color:C.bark,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
              <textarea value={newStepB} onChange={e=>setNewStepB(e.target.value)} placeholder="Step instructions…" style={{width:"100%",minHeight:56,padding:"9px 12px",borderRadius:10,border:`2px solid ${C.border}`,background:C.paper,fontSize:13,color:C.bark,outline:"none",resize:"none",lineHeight:1.5,boxSizing:"border-box",marginBottom:8}}/>
              <Btn onClick={addStep} disabled={!newStepT.trim()||!newStepB.trim()} full sm>Add Step</Btn>
            </div>
          </div>
        )}

        {activeTab==="macros"&&(
          <div>
            <div style={{background:`${C.sky}10`,border:`1.5px solid ${C.sky}28`,borderRadius:14,padding:"11px 14px",marginBottom:14}}>
              <div style={{fontSize:12,color:C.sky,fontWeight:700}}>Values per serving. Enter manually or let AI calculate from your ingredients.</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {MACRO_CONFIG.map(({key,label,unit,icon})=>(
                <div key={key} style={{background:C.cream,borderRadius:14,padding:"12px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6}}>{icon} {label} ({unit})</div>
                  <input type="number" value={macros[key]} onChange={e=>setMacros(m=>({...m,[key]:e.target.value}))} placeholder="0" style={{width:"100%",padding:"8px 10px",borderRadius:10,border:`2px solid ${C.border}`,background:C.paper,fontSize:16,fontWeight:800,color:C.bark,outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <Btn onClick={autoCalc} disabled={calcLoading||ingredients.length===0} outline color={C.sky} full>{calcLoading?"Calculating…":"✨ Auto-calculate from ingredients"}</Btn>
          </div>
        )}

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <Btn onClick={onClose} outline color={C.muted} style={{flex:1}}>Cancel</Btn>
          <Btn onClick={handleSave} color={C.sage} style={{flex:2}}>Save Changes ✓</Btn>
        </div>
      </div>
    </Sheet>
  );
}

/* ═══ RECIPE DETAIL ═══════════════════════════════════════════════════════ */
function RecipeDetail({recipe, onBack, onComplete, onEdit}) {
  const [step,      setStep]      = useState(0);
  const [mode,      setMode]      = useState("overview");
  const [completed, setCompleted] = useState(recipe.done);
  const [verifyOpen,setVerifyOpen]= useState(false);
  const [vState,    setVState]    = useState("idle");
  const [vFeedback, setVFeedback] = useState("");
  const [vPreview,  setVPreview]  = useState(null);
  const fileRef = useRef();
  const nSteps = (recipe.steps||[]).length;
  const currentStep = recipe.steps?.[step];

  const handleFile = async (e) => {
    const file=e.target.files[0]; if(!file) return;
    setVPreview(URL.createObjectURL(file)); setVState("loading");
    try {
      const b64=await toB64(file);
      const raw=await callClaude(`Reply ONLY as JSON: {"verdict":"VERIFIED"|"RETRY","feedback":"one encouraging sentence max 20 words"}`,`Does this resemble "${recipe.name}"? Be generous.`,b64);
      const {verdict,feedback}=parseJSON(raw);
      setVState(verdict==="VERIFIED"?"pass":"fail"); setVFeedback(feedback);
    } catch { setVState("fail"); setVFeedback("Couldn't analyse — looks delicious though!"); }
  };
  const finish = (photo) => { setCompleted(true); setVerifyOpen(false); onComplete(recipe,photo); };

  return (
    <div style={{background:C.paper,minHeight:"100vh"}}>
      <div style={{background:`linear-gradient(160deg,${C.bark},#5A3520)`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,fontSize:108,opacity:.12,lineHeight:1}}>{recipe.emoji}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px"}}>← Back</button>
          <button onClick={onEdit} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px"}}>✏️ Edit</button>
        </div>
        <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
          <DiffBadge level={recipe.difficulty}/>
          {(recipe.diets||[]).filter(d=>d!=="No restrictions").slice(0,3).map(d=><Chip key={d} label={d} color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.15)"/>)}
          {recipe.aiGenerated&&<Chip label="✨ AI" color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.15)"/>}
        </div>
        <div style={{fontSize:25,fontWeight:900,color:"#fff",lineHeight:1.25,marginBottom:8,fontFamily:DF}}>{recipe.name}</div>
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
            {recipe.macros&&<MacroPanel macros={recipe.macros}/>}
            <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:12}}>Ingredients</div>
              {(recipe.ingredients||[]).map((ing,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<recipe.ingredients.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:C.ember,flexShrink:0}}/><span style={{fontSize:14,color:C.bark}}>{ing}</span>
                </div>
              ))}
            </div>
            <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:900,fontSize:15,color:C.bark,marginBottom:14}}>Method</div>
              {(recipe.steps||[]).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:14,marginBottom:i<nSteps-1?18:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                  <div>
                    <div style={{fontWeight:800,fontSize:14,color:C.bark,marginBottom:3}}>{s.title}</div>
                    <div style={{fontSize:13,color:"#6A5C52",lineHeight:1.6}}>{s.body}</div>
                    {s.timer>0&&<div style={{fontSize:11,color:C.sky,fontWeight:600,marginTop:3}}>⏱ {fmt(s.timer)} timer</div>}
                  </div>
                </div>
              ))}
            </div>
            {recipe.tip&&<div style={{background:`${C.gold}20`,border:`1px solid ${C.gold}55`,borderRadius:18,padding:"14px 18px",marginBottom:14}}><div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:5}}>💡 Chef's Tip</div><div style={{fontSize:13,color:"#6A5C52",lineHeight:1.6}}>{recipe.tip}</div></div>}
            {completed?<div style={{textAlign:"center",padding:"12px",fontWeight:700,color:C.sage}}>✓ You've cooked this one!</div>:<Btn onClick={()=>setMode("cook")} full>Start Cooking 👨‍🍳</Btn>}
          </>
        ):(
          <div>
            <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:14}}>Step {step+1} of {nSteps}</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:20}}>
              {Array.from({length:nSteps}).map((_,i)=>(
                <div key={i} onClick={()=>setStep(i)} style={{width:i===step?24:8,height:8,borderRadius:99,background:i<step?C.sage:i===step?C.flame:C.border,transition:"all .28s",cursor:"pointer"}}/>
              ))}
            </div>
            <div style={{background:C.cream,borderRadius:20,padding:24,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.flame},${C.ember})`,color:"#fff",fontWeight:900,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>{step+1}</div>
              <div style={{fontWeight:900,fontSize:20,color:C.bark,marginBottom:10,fontFamily:DF}}>{currentStep?.title}</div>
              <div style={{fontSize:15,color:"#5A4C42",lineHeight:1.7}}>{currentStep?.body}</div>
            </div>
            {currentStep?.timer>0&&<div style={{marginBottom:16}}><StepTimer key={step} seconds={currentStep.timer} onDone={()=>{}}/></div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} style={{flex:1,padding:13,borderRadius:14,border:`2px solid ${C.border}`,background:"transparent",color:step===0?"#CCC":C.bark,fontWeight:800,cursor:step===0?"default":"pointer",fontSize:15}}>← Prev</button>
              {step<nSteps-1
                ?<Btn onClick={()=>setStep(s=>s+1)} style={{flex:2}}>Next Step →</Btn>
                :<Btn onClick={()=>!completed&&setVerifyOpen(true)} color={C.sage} style={{flex:2,background:completed?C.sage:`linear-gradient(135deg,${C.sage},${C.moss})`}}>
                  {completed?"✓ Cooked!":`Complete · +${recipe.xp}xp 🎉`}
                </Btn>
              }
            </div>
          </div>
        )}
      </div>

      {verifyOpen&&(
        <Sheet onClose={()=>setVerifyOpen(false)}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>📸 Photo Verify</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Snap your dish to earn XP</div></div>
              <CloseBtn onClose={()=>setVerifyOpen(false)}/>
            </div>
            {vState==="idle"&&(
              <>
                <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"16px 20px",marginBottom:18,display:"flex",gap:14,alignItems:"center"}}>
                  <span style={{fontSize:40}}>{recipe.emoji}</span>
                  <div><div style={{fontWeight:900,fontSize:17,color:"#fff"}}>{recipe.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:2}}>⚡ +{recipe.xp} XP on verification</div></div>
                </div>
                <div onClick={()=>fileRef.current?.click()} style={{border:`3px dashed ${C.border}`,borderRadius:20,padding:"40px 20px",textAlign:"center",cursor:"pointer",background:C.cream,marginBottom:14}}>
                  <div style={{fontSize:48,marginBottom:10}}>📷</div>
                  <div style={{fontWeight:800,fontSize:15,color:C.bark,marginBottom:4}}>Upload your dish photo</div>
                  <div style={{fontSize:13,color:C.muted}}>Claude will verify it looks like {recipe.name}</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
                <div style={{display:"flex",gap:10}}>
                  <Btn onClick={()=>finish(null)} outline color={C.muted} style={{flex:1}}>Skip</Btn>
                  <Btn onClick={()=>fileRef.current?.click()} style={{flex:2}}>Take Photo 📷</Btn>
                </div>
              </>
            )}
            {vState==="loading"&&<>{vPreview&&<img src={vPreview} alt="" style={{width:"100%",height:200,objectFit:"cover",borderRadius:16,marginBottom:16}}/>}<Spinner label="Analysing your dish…"/></>}
            {(vState==="pass"||vState==="fail")&&(
              <div style={{textAlign:"center"}}>
                {vPreview&&<img src={vPreview} alt="" style={{width:"100%",height:200,objectFit:"cover",borderRadius:16,marginBottom:16,border:`3px solid ${vState==="pass"?C.sage:C.ember}`}}/>}
                <div style={{fontSize:52,marginBottom:10,animation:"pop .5s ease"}}>{vState==="pass"?"✅":"🤔"}</div>
                <div style={{fontWeight:900,fontSize:20,color:vState==="pass"?C.sage:C.ember,marginBottom:6}}>{vState==="pass"?"Dish Verified!":"Hmm, try again?"}</div>
                <div style={{fontSize:14,color:C.muted,lineHeight:1.5,marginBottom:20}}>{vFeedback}</div>
                {vState==="pass"
                  ?<Btn onClick={()=>finish(vPreview)} color={C.sage} full>Share & Complete 🎉</Btn>
                  :<div style={{display:"flex",gap:10}}><Btn onClick={()=>{setVState("idle");setVPreview(null);}} outline color={C.ember} style={{flex:1}}>Retake</Btn><Btn onClick={()=>finish(null)} style={{flex:1,background:C.muted}}>Complete Anyway</Btn></div>
                }
              </div>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ═══ AI GENERATOR ════════════════════════════════════════════════════════ */
function AIGenerator({profile, onSave, onClose}) {
  const [prompt,setPrompt]=useState(""); const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null); const [error,setError]=useState("");
  const ctx=`Dietary: "${profile.dietary}". Skill: "${profile.skill}".`;
  const SUGG=["A cosy pasta with roasted cherry tomatoes","Something impressive with salmon under 30 min","A hearty Indian dal for meal prep","A spicy Sichuan noodle dish","A classic Japanese dish for a beginner","A quick keto dinner under 20 min"];
  const generate=async()=>{
    if(!prompt.trim())return;
    setLoading(true);setResult(null);setError("");
    try{
      const sys=`Professional chef and nutritionist. ${ctx} Respond ONLY with valid JSON (no markdown): {"name":"string","emoji":"single emoji","difficulty":"Easy"|"Medium"|"Hard","time":"string","xp":40-180,"category":"Breakfast"|"Quick"|"Asian"|"Indian"|"Japanese"|"Italian"|"Mexican"|"Mediterranean"|"Comfort"|"Healthy"|"Baking","tags":["string"],"diets":["No restrictions"|"Vegetarian"|"Vegan"|"Gluten-free"|"Keto"|"Dairy-free"],"ingredients":["qty ingredient"],"steps":[{"title":"string","body":"string","timer":seconds_or_0}],"tip":"string","macros":{"calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number}}. 5–9 ingredients, 4–6 steps. Include realistic macros per serving. Add timer (seconds) to steps that need waiting.`;
      const raw=await callClaude(sys,prompt);
      const r=parseJSON(raw); r.id=Date.now(); r.done=false; r.aiGenerated=true;
      setResult(r);
    }catch{setError("Couldn't generate that recipe. Try a different description!");}
    finally{setLoading(false);}
  };
  return (
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>✨ AI Recipe Generator</div><div style={{fontSize:12,color:C.sky,marginTop:3,fontWeight:600}}>Personalised · {profile.dietary} · {profile.skill}</div></div>
          <CloseBtn onClose={onClose}/>
        </div>
        {!result&&!loading&&(
          <>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {SUGG.map((s,i)=><button key={i} onClick={()=>setPrompt(s)} style={{fontSize:12,padding:"6px 12px",borderRadius:20,border:`1.5px solid ${C.border}`,background:C.cream,color:C.bark,cursor:"pointer",fontWeight:600,lineHeight:1.4,textAlign:"left"}}>{s}</button>)}
            </div>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&e.metaKey&&generate()} placeholder="Describe what you're craving…" style={{width:"100%",minHeight:88,borderRadius:16,border:`2px solid ${prompt?C.ember:C.border}`,background:C.cream,padding:"13px 16px",fontSize:14,color:C.bark,resize:"none",outline:"none",lineHeight:1.55,boxSizing:"border-box",transition:"border-color .18s"}}/>
            {error&&<div style={{fontSize:13,color:C.flame,marginTop:8}}>{error}</div>}
            <Btn onClick={generate} disabled={!prompt.trim()} full style={{marginTop:12}}>Generate Recipe ✨</Btn>
          </>
        )}
        {loading&&<Spinner label="Crafting your personalised recipe…"/>}
        {result&&!loading&&(
          <>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:20,marginBottom:14,color:"#fff"}}>
              <div style={{fontSize:44,marginBottom:10}}>{result.emoji}</div>
              <div style={{fontWeight:900,fontSize:22,marginBottom:6,fontFamily:DF}}>{result.name}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>{(result.diets||[]).filter(d=>d!=="No restrictions").map(d=><Chip key={d} label={d} color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.15)"/>)}</div>
              <div style={{display:"flex",gap:14,fontSize:13,opacity:.7}}><span>⏱ {result.time}</span><span>⚡ {result.xp} XP</span><span>{result.difficulty}</span></div>
            </div>
            {result.macros&&<MacroPanel macros={result.macros}/>}
            <div style={{background:C.cream,borderRadius:18,padding:18,border:`1px solid ${C.border}`,marginBottom:12}}>
              <div style={{fontWeight:900,fontSize:14,color:C.bark,marginBottom:10}}>Ingredients</div>
              {(result.ingredients||[]).map((ing,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<result.ingredients.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:C.ember,flexShrink:0}}/><span style={{fontSize:13,color:C.bark}}>{ing}</span>
                </div>
              ))}
            </div>
            <div style={{background:C.cream,borderRadius:18,padding:18,border:`1px solid ${C.border}`,marginBottom:12}}>
              <div style={{fontWeight:900,fontSize:14,color:C.bark,marginBottom:12}}>Method</div>
              {(result.steps||[]).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:12,marginBottom:i<result.steps.length-1?14:0}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.flame,color:"#fff",fontWeight:900,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                  <div><div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:2}}>{s.title}</div><div style={{fontSize:12,color:"#6A5C52",lineHeight:1.55}}>{s.body}</div>{s.timer>0&&<div style={{fontSize:10,color:C.sky,fontWeight:600,marginTop:2}}>⏱ {fmt(s.timer)} timer</div>}</div>
                </div>
              ))}
            </div>
            {result.tip&&<div style={{background:`${C.gold}20`,border:`1px solid ${C.gold}55`,borderRadius:14,padding:"12px 16px",marginBottom:16}}><div style={{fontSize:12,fontWeight:800,color:C.bark,marginBottom:4}}>💡 Chef's Tip</div><div style={{fontSize:12,color:"#6A5C52",lineHeight:1.5}}>{result.tip}</div></div>}
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>{setResult(null);setPrompt("");}} outline color={C.muted} style={{flex:1}}>Try Again</Btn>
              <Btn onClick={()=>{onSave(result);onClose();}} color={C.sage} style={{flex:2}}>Save Recipe ✓</Btn>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ═══ PANTRY ══════════════════════════════════════════════════════════════ */
function PantrySheet({pantry,setPantry,onClose}) {
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const [suggestions,setSuggestions]=useState([]); const [error,setError]=useState("");
  const QUICK=["eggs","garlic","onions","olive oil","pasta","rice","butter","chicken","tomatoes","lemon","ginger","soy sauce"];
  const addItem=()=>{const v=input.trim();if(v&&!pantry.includes(v)){setPantry(p=>[...p,v]);setInput("");}};
  const getSuggestions=async()=>{
    if(pantry.length<2)return;
    setLoading(true);setSuggestions([]);setError("");
    try{
      const raw=await callClaude(`Respond ONLY as JSON array (no markdown): [{"name":"string","emoji":"single emoji","why":"one sentence","difficulty":"Easy"|"Medium"|"Hard","time":"string","missingIngredients":["max 2"]}]. Return exactly 3 recipes.`,`I have: ${pantry.join(", ")}. What can I make?`);
      setSuggestions(parseJSON(raw));
    }catch{setError("Couldn't get suggestions — please try again.");}
    finally{setLoading(false);}
  };
  return (
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🧊 Pantry Mode</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>What's in your fridge?</div></div>
          <CloseBtn onClose={onClose}/>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder="Type ingredient & press Enter…" style={{flex:1,padding:"11px 16px",borderRadius:14,border:`2px solid ${input?C.ember:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none"}}/>
          <Btn onClick={addItem} disabled={!input.trim()} style={{padding:"11px 18px"}}>Add</Btn>
        </div>
        {pantry.length===0&&<div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>{QUICK.map(item=><button key={item} onClick={()=>setPantry(p=>p.includes(item)?p:[...p,item])} style={{fontSize:12,padding:"5px 12px",borderRadius:99,border:`1.5px solid ${C.border}`,background:C.cream,color:C.bark,cursor:"pointer",fontWeight:600}}>{item}</button>)}</div>}
        {pantry.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{pantry.map((item,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,background:`${C.ember}18`,border:`1.5px solid ${C.ember}40`,borderRadius:99,padding:"5px 12px"}}><span style={{fontSize:13,fontWeight:700,color:C.bark}}>{item}</span><button onClick={()=>setPantry(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:15,lineHeight:1,padding:0}}>×</button></div>)}</div>}
        <Btn onClick={getSuggestions} disabled={pantry.length<2||loading} full style={{marginBottom:14}}>{loading?"Scanning pantry…":`What can I cook? (${pantry.length} items)`}</Btn>
        {loading&&<Spinner label="Finding the best recipes for your ingredients…"/>}
        {error&&<div style={{fontSize:13,color:C.flame,marginBottom:12}}>{error}</div>}
        {suggestions.length>0&&<div style={{display:"flex",flexDirection:"column",gap:12}}>{suggestions.map((s,i)=><div key={i} style={{background:C.cream,borderRadius:18,padding:"16px",border:`1px solid ${C.border}`,animation:`fadeUp .3s ease ${i*.08}s both`}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><span style={{fontSize:36}}>{s.emoji}</span><div style={{flex:1}}><div style={{fontWeight:900,fontSize:15,color:C.bark}}>{s.name}</div><div style={{display:"flex",gap:8,marginTop:3}}><DiffBadge level={s.difficulty}/><span style={{fontSize:11,color:C.muted}}>⏱ {s.time}</span></div></div></div><div style={{fontSize:13,color:"#6A5C52",lineHeight:1.5,marginBottom:s.missingIngredients?.length?10:0}}>{s.why}</div>{s.missingIngredients?.length>0&&<div style={{fontSize:11,color:C.ember,background:`${C.ember}12`,borderRadius:8,padding:"5px 10px"}}>🛒 Also need: {s.missingIngredients.join(", ")}</div>}</div>)}</div>}
      </div>
    </Sheet>
  );
}

/* ═══ GOAL PICKER ═════════════════════════════════════════════════════════ */
function GoalPicker({goal,onSelect,onClose}) {
  return (
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>🎯 Cooking Goal</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>Pick a rhythm that fits your life</div></div>
          <CloseBtn onClose={onClose}/>
        </div>
        <div style={{background:`${C.sky}14`,border:`1.5px solid ${C.sky}33`,borderRadius:14,padding:"11px 14px",marginBottom:18,marginTop:12}}>
          <div style={{fontSize:12,color:C.sky,fontWeight:700}}>💡 The best habit is the one you actually keep. A weekly cook beats an abandoned daily streak every time.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {STREAK_GOALS.map(g=>{
            const active=goal.id===g.id;
            return (
              <button key={g.id} className="tap" onClick={()=>onSelect(g)} style={{background:active?`${g.color}14`:C.cream,border:`2px solid ${active?g.color:C.border}`,borderRadius:18,padding:"15px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all .18s"}}>
                <div style={{width:48,height:48,borderRadius:14,background:active?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,transition:"all .2s"}}>{g.icon}</div>
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

/* ═══ HOME TAB ════════════════════════════════════════════════════════════ */
function HomeTab({xp,setXp,recipes,onOpen,onComplete,onShowAI,profile,goal,cookedDays,setCookedDays,onEditGoal}) {
  const [completing,setCompleting]=useState(null);
  const quickComplete=(e,r)=>{
    e.stopPropagation(); if(completing)return;
    setCompleting(r.id);
    setTimeout(()=>{
      setXp(x=>x+r.xp);
      const di=new Date().getDay();const idx=di===0?6:di-1;
      setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});
      onComplete(r,null); setCompleting(null);
    },1000);
  };
  const weekDone=cookedDays.filter(Boolean).length;
  const pct=Math.min(100,weekDone/goal.target*100);
  const goalComplete=weekDone>=goal.target;
  return (
    <div style={{paddingBottom:24}}>
      <div style={{margin:"0 16px 20px",background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px 20px 18px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-18,right:-18,fontSize:88,opacity:.1,transform:"rotate(-15deg)",lineHeight:1}}>{goal.icon}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",opacity:.6,marginBottom:4}}>This Week · {goal.label}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:42,fontWeight:900,lineHeight:1,fontFamily:DF}}>{weekDone}/{goal.target}</span><span style={{fontSize:16,opacity:.7}}>{goal.icon}</span></div>
          </div>
          <button onClick={onEditGoal} className="tap" style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700}}>Edit Goal</button>
        </div>
        <div style={{background:"rgba(255,255,255,.15)",borderRadius:99,height:10,overflow:"hidden",marginBottom:5}}>
          <div style={{width:`${pct}%`,height:"100%",background:goalComplete?C.gold:goal.color,borderRadius:99,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/>
        </div>
        <div style={{fontSize:11,opacity:.6,marginBottom:14}}>{goalComplete?"🎉 Goal smashed! See you next week.":`${goal.target-weekDone} more cook${goal.target-weekDone===1?"":"s"} to go`}</div>
        <div style={{display:"flex",gap:5,marginBottom:16}}>
          {WEEK_LABELS.map((d,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:26,borderRadius:7,background:cookedDays[i]?goal.color:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{cookedDays[i]?"✓":""}</div><div style={{fontSize:8,marginTop:3,opacity:.45}}>{d}</div></div>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:14}}>
          {[["Total XP",`${xp.toLocaleString()} xp`],["Level","Chef 5"],["Cooked",`${recipes.filter(r=>r.done).length}`]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>{l}</div><div style={{fontSize:20,fontWeight:900}}>{v}</div></div>
          ))}
        </div>
      </div>
      <div style={{margin:"0 16px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.muted,fontWeight:600}}>Next level: Sous Chef</span><span style={{fontSize:12,color:C.flame,fontWeight:700}}>{xp}/500 XP</span></div>
        <XPBar pct={xp/5}/>
      </div>
      <div style={{margin:"0 16px 18px"}}>
        <button onClick={onShowAI} className="tap" style={{width:"100%",background:`linear-gradient(135deg,${C.sky}18,${C.sky}08)`,border:`2px solid ${C.sky}33`,borderRadius:16,padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
          <span style={{fontSize:26}}>✨</span>
          <div><div style={{fontWeight:800,fontSize:14,color:C.bark}}>Generate today's personalised recipe</div><div style={{fontSize:11,color:C.sky,marginTop:2,fontWeight:600}}>{profile.dietary} · {profile.skill} level</div></div>
          <span style={{marginLeft:"auto",fontSize:18,color:C.sky}}>→</span>
        </button>
      </div>
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
              {!r.done&&<button onClick={e=>quickComplete(e,r)} className="tap" style={{background:completing===r.id?C.sage:C.flame,color:"#fff",border:"none",borderRadius:12,padding:"8px 14px",fontWeight:800,fontSize:12,cursor:"pointer",flexShrink:0,boxShadow:`0 3px 10px ${C.flame}44`,transition:"background .2s"}}>{completing===r.id?`+${r.xp}xp!`:`Cook · ${r.xp}xp`}</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ RECIPES TAB ═════════════════════════════════════════════════════════ */
function RecipesTab({allRecipes,onOpen,onShowAI,profile,onShowGrocery}) {
  const [cat,setCat]=useState("All"); const [diet,setDiet]=useState("All");
  const [search,setSearch]=useState(""); const [sort,setSort]=useState("default");
  const filtered=useMemo(()=>{
    let rs=allRecipes.filter(r=>{
      const mc=cat==="All"||r.category===cat;
      const md=diet==="All"||(r.diets||[]).includes(diet)||(diet==="High Protein"&&r.macros&&r.macros.protein>=25);
      return mc&&md&&r.name.toLowerCase().includes(search.toLowerCase());
    });
    if(sort==="cals")    rs=[...rs].sort((a,b)=>(a.macros?.calories||0)-(b.macros?.calories||0));
    if(sort==="protein") rs=[...rs].sort((a,b)=>(b.macros?.protein||0)-(a.macros?.protein||0));
    if(sort==="xp")      rs=[...rs].sort((a,b)=>b.xp-a.xp);
    return rs;
  },[allRecipes,cat,diet,search,sort]);
  return (
    <div style={{paddingBottom:24}}>
      <div style={{padding:"4px 16px 10px"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search recipes…" style={{width:"100%",padding:"11px 14px 11px 40px",borderRadius:14,border:`2px solid ${search?C.ember:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box",transition:"border-color .18s"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 16px 8px"}}>{CATEGORIES.map(c=><button key={c} onClick={()=>setCat(c)} className="tap" style={{whiteSpace:"nowrap",padding:"7px 14px",borderRadius:99,border:`2px solid ${cat===c?C.flame:C.border}`,background:cat===c?C.flame:C.cream,color:cat===c?"#fff":C.muted,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{c}</button>)}</div>
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 16px 8px"}}>{DIET_FILTERS.map(d=><button key={d} onClick={()=>setDiet(d)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 12px",borderRadius:99,border:`2px solid ${diet===d?C.sage:C.border}`,background:diet===d?`${C.sage}18`:"transparent",color:diet===d?C.sage:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{d==="All"?"🍽️ All":d}</button>)}</div>
      <div style={{display:"flex",gap:8,padding:"0 16px 12px",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:700,flexShrink:0}}>Sort:</span>
        {[["default","Default"],["cals","Lowest Cal"],["protein","Most Protein"],["xp","Most XP"]].map(([k,lbl])=><button key={k} onClick={()=>setSort(k)} className="tap" style={{whiteSpace:"nowrap",padding:"5px 10px",borderRadius:99,border:`1.5px solid ${sort===k?C.sky:C.border}`,background:sort===k?`${C.sky}18`:"transparent",color:sort===k?C.sky:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{lbl}</button>)}
      </div>
      <div style={{margin:"0 16px 14px",display:"flex",gap:10}}>
        <button onClick={onShowAI} className="tap" style={{flex:2,background:`${C.sky}18`,border:`2px solid ${C.sky}33`,borderRadius:14,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
          <span style={{fontSize:22}}>✨</span><div><div style={{fontWeight:800,fontSize:13,color:C.bark}}>Generate recipe</div><div style={{fontSize:10,color:C.sky,fontWeight:600}}>{profile.dietary} · {profile.skill}</div></div>
        </button>
        <button onClick={onShowGrocery} className="tap" style={{flex:1,background:`${C.sage}18`,border:`2px solid ${C.sage}33`,borderRadius:14,padding:"12px 16px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:22}}>🛒</div><div style={{fontSize:11,fontWeight:800,color:C.sage}}>Grocery List</div>
        </button>
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:12,color:C.muted,fontWeight:600,marginBottom:10}}>{filtered.length} recipe{filtered.length!==1?"s":""}</div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}><div style={{fontSize:44,marginBottom:12}}>🍽️</div><div style={{fontWeight:700,marginBottom:4}}>No recipes match</div><div style={{fontSize:13}}>Try adjusting filters or generating with AI ✨</div></div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((r,idx)=>(
            <div key={r.id} className="ch" onClick={()=>onOpen(r)} style={{background:r.done?"#F5F0EB":C.cream,border:`2px solid ${r.done?"#E0D5CB":C.border}`,borderRadius:18,padding:"15px",display:"flex",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)",animation:`fadeUp .3s ease ${idx*.04}s both`,transition:"transform .18s,box-shadow .18s"}}>
              <div style={{width:58,height:58,borderRadius:16,background:r.done?"#E8E0D8":`${C.ember}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{r.done?"✅":r.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{fontWeight:800,fontSize:15,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>{r.aiGenerated&&<span style={{fontSize:9,background:`${C.sky}18`,color:C.sky,borderRadius:5,padding:"1px 5px",fontWeight:700,flexShrink:0}}>AI</span>}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:5}}><DiffBadge level={r.difficulty}/>{(r.diets||[]).filter(d=>d!=="No restrictions").slice(0,2).map(d=><Chip key={d} label={d} color={C.sage}/>)}</div>
                {r.macros&&<MacroRow macros={r.macros}/>}
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:C.muted}}>⏱ {r.time}</span><span style={{fontSize:12,fontWeight:800,color:r.done?C.sage:C.flame}}>{r.done?"✓ Cooked":`+${r.xp} XP`}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ WEEKLY CHALLENGE ITEM (extracted to avoid hooks-in-map) ═════════════ */
function WeeklyChallItem({c}) {
  const [joined,setJoined]=useState(false);
  return (
    <div style={{borderRadius:18,overflow:"hidden",border:`2px solid ${c.color}22`,background:C.cream,marginBottom:12,boxShadow:`0 4px 18px ${c.color}10`}}>
      <div style={{background:`linear-gradient(135deg,${c.color},${c.color}CC)`,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:32}}>{c.emoji}</div>
        <div><div style={{fontWeight:900,fontSize:16,color:"#fff"}}>{c.title}</div><div style={{fontSize:11,color:"rgba(255,255,255,.75)",marginTop:1}}>⏳ {c.timeLeft}</div></div>
        <div style={{marginLeft:"auto",background:"rgba(255,255,255,.22)",borderRadius:10,padding:"4px 10px",color:"#fff",fontWeight:800,fontSize:13}}>+{c.xp} XP</div>
      </div>
      <div style={{padding:"12px 18px"}}>
        <p style={{fontSize:13,color:"#7A6C60",margin:"0 0 12px",lineHeight:1.5}}>{c.desc}</p>
        <button onClick={()=>setJoined(j=>!j)} className="tap" style={{width:"100%",padding:10,borderRadius:12,border:`2px solid ${joined?C.sage:c.color}`,background:joined?C.sage:"transparent",color:joined?"#fff":c.color,fontWeight:800,fontSize:14,cursor:"pointer",transition:"all .22s"}}>{joined?"✓ Accepted!":"Accept Challenge"}</button>
      </div>
    </div>
  );
}
const WEEKLY_CHALLENGES=[
  {emoji:"🎲",title:"No-Recipe Monday",  desc:"Cook dinner using only what's in your fridge. No recipes allowed.",xp:200,timeLeft:"6h left",color:C.flame},
  {emoji:"✨",title:"5-Ingredient Magic", desc:"Create a complete meal with exactly 5 ingredients.",              xp:150,timeLeft:"2 days",color:C.ember},
  {emoji:"🔪",title:"Knife Only",         desc:"Prep a full meal using no gadgets — just your knife and hands.",  xp:180,timeLeft:"4 days",color:C.sage},
];

/* ═══ CHALLENGES TAB ══════════════════════════════════════════════════════ */
function ChallengesTab({challenges,setChallenges}) {
  const [selected,setSelected]=useState(null);
  const active=challenges.find(c=>c.id==="sourdough-april");
  const toggleMilestone=(chId,mi)=>setChallenges(cs=>cs.map(c=>c.id!==chId?c:{...c,milestones:c.milestones.map((m,i)=>i!==mi?m:{...m,done:!m.done})}));
  if(selected){
    const ch=challenges.find(c=>c.id===selected);
    const totalXP=ch.milestones.reduce((a,m)=>a+m.xp,0);
    const earnedXP=ch.milestones.filter(m=>m.done).reduce((a,m)=>a+m.xp,0);
    return (
      <div style={{paddingBottom:30}}>
        <div style={{background:`linear-gradient(160deg,${ch.color},${ch.color}99)`,padding:"20px 20px 28px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-10,right:-10,fontSize:108,opacity:.14,lineHeight:1}}>{ch.emoji}</div>
          <button onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px",marginBottom:18}}>← Back</button>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><Chip label={ch.month} color="#fff" bg="rgba(255,255,255,.22)"/><Chip label={`${ch.participants.toLocaleString()} cooks`} color="#fff" bg="rgba(255,255,255,.22)"/></div>
          <div style={{fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.25,marginBottom:8,fontFamily:DF}}>{ch.emoji} {ch.title}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.85)",lineHeight:1.6}}>{ch.description}</div>
        </div>
        <div style={{padding:"20px 16px"}}>
          <div style={{background:C.cream,borderRadius:18,padding:18,marginBottom:16,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontWeight:900,fontSize:15,color:C.bark}}>Progress</div><div style={{fontWeight:800,color:ch.color}}>{earnedXP}/{totalXP} XP</div></div>
            <XPBar pct={earnedXP/totalXP*100} color={ch.color} h={10}/>
            <div style={{fontSize:11,color:C.muted,marginTop:6}}>{ch.milestones.filter(m=>m.done).length}/{ch.milestones.length} milestones complete</div>
          </div>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:12,fontFamily:DF}}>Milestones</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
            {ch.milestones.map((m,i)=>(
              <button key={i} onClick={()=>toggleMilestone(selected,i)} className="tap" style={{background:m.done?`${ch.color}12`:C.cream,border:`2px solid ${m.done?ch.color:C.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:m.done?ch.color:"#E8DDD4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,transition:"all .18s"}}>{m.done?"✓":"○"}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:m.done?C.bark:C.muted}}>{m.label}</div></div>
                <div style={{fontWeight:800,fontSize:13,color:m.done?ch.color:C.muted,flexShrink:0}}>+{m.xp} XP</div>
              </button>
            ))}
          </div>
          <div style={{background:`${C.gold}18`,border:`2px solid ${C.gold}44`,borderRadius:18,padding:"18px 20px",textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:8}}>{ch.badge}</div>
            <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:4}}>{ch.badgeLabel}</div>
            <div style={{fontSize:12,color:ch.milestones.every(m=>m.done)?C.gold:C.muted}}>{ch.milestones.every(m=>m.done)?"🎉 Badge Earned!":"Complete all milestones to earn this badge"}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{paddingBottom:30}}>
      {active&&<div onClick={()=>setSelected(active.id)} className="tap ch" style={{margin:"4px 16px 20px",background:`linear-gradient(135deg,${active.color},${active.color}BB)`,borderRadius:22,padding:"22px 20px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"transform .18s,box-shadow .18s"}}><div style={{position:"absolute",top:-18,right:-10,fontSize:108,opacity:.18,lineHeight:1}}>{active.emoji}</div><Chip label="🔥 ACTIVE NOW" color="#fff" bg="rgba(255,255,255,.25)"/><div style={{fontSize:26,fontWeight:900,color:"#fff",marginTop:10,marginBottom:6,fontFamily:DF}}>{active.emoji} {active.title}</div><div style={{fontSize:13,color:"rgba(255,255,255,.85)",marginBottom:16,lineHeight:1.5}}>{active.description.slice(0,90)}…</div><div style={{background:"rgba(255,255,255,.2)",borderRadius:99,height:8,overflow:"hidden",marginBottom:6}}><div style={{width:`${Math.round(active.milestones.filter(m=>m.done).length/active.milestones.length*100)}%`,height:"100%",background:"#fff",borderRadius:99}}/></div><div style={{display:"flex",justifyContent:"space-between",color:"rgba(255,255,255,.75)",fontSize:12}}><span>{active.milestones.filter(m=>m.done).length}/{active.milestones.length} milestones</span><span>{active.participants.toLocaleString()} cooks joined</span></div></div>}
      <div style={{padding:"0 16px"}}>
        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:4,fontFamily:DF}}>Monthly Challenges</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:16}}>One deep skill focus every month.</div>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:28}}>
          {challenges.map((ch,idx)=>{const earned=ch.milestones.filter(m=>m.done).length;return(
            <div key={ch.id} onClick={()=>setSelected(ch.id)} className="tap ch" style={{background:C.cream,border:`2px solid ${ch.color}33`,borderRadius:20,overflow:"hidden",cursor:"pointer",boxShadow:`0 4px 16px ${ch.color}10`,animation:`fadeUp .3s ease ${idx*.06}s both`,transition:"transform .18s,box-shadow .18s"}}>
              <div style={{background:ch.bgColor,padding:"16px 18px",display:"flex",gap:14,alignItems:"center"}}>
                <div style={{fontSize:42}}>{ch.emoji}</div>
                <div style={{flex:1}}><div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}><Chip label={ch.month} color={ch.color}/>{ch.milestones.every(m=>m.done)&&<Chip label="✓ Complete" color={C.sage}/>}{!ch.milestones.every(m=>m.done)&&earned>0&&<Chip label="In Progress" color={C.ember}/>}</div><div style={{fontWeight:900,fontSize:16,color:C.bark,fontFamily:DF}}>{ch.title}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{ch.participants.toLocaleString()} cooks · {ch.milestones.length} milestones</div></div>
                <span style={{fontSize:20,color:C.muted}}>→</span>
              </div>
              {earned>0&&<div style={{padding:"10px 18px"}}><XPBar pct={earned/ch.milestones.length*100} color={ch.color} h={6}/><div style={{fontSize:11,color:C.muted,marginTop:4}}>{earned}/{ch.milestones.length} done</div></div>}
            </div>
          );})}
        </div>
        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:4,fontFamily:DF}}>Weekly Challenges</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Quick wins for bonus XP.</div>
        {WEEKLY_CHALLENGES.map((c,i)=><WeeklyChallItem key={i} c={c}/>)}
      </div>
    </div>
  );
}

/* ═══ SOCIAL TAB ══════════════════════════════════════════════════════════ */
function SocialTab({posts,setPosts,xp}) {
  const REACTS=["❤️","🔥","😍","🤤"];
  const react=(pid,emoji)=>setPosts(ps=>ps.map(p=>{if(p.id!==pid)return p;const was=p.myReaction===emoji;const r={...p.reactions};if(p.myReaction)r[p.myReaction]=Math.max(0,r[p.myReaction]-1);if(!was)r[emoji]=(r[emoji]||0)+1;return{...p,reactions:r,myReaction:was?null:emoji};}));
  return (
    <div style={{paddingBottom:24}}>
      <div style={{margin:"4px 16px 20px",background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"18px 20px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${C.flame},${C.ember})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>👩‍🍳</div>
          <div><div style={{fontWeight:900,fontSize:16,fontFamily:DF}}>You</div><div style={{fontSize:12,opacity:.65}}>Chef Lv.5 · 4🔥 streak</div></div>
          <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".08em"}}>Total XP</div><div style={{fontSize:20,fontWeight:900}}>{xp.toLocaleString()}</div></div>
        </div>
        <div style={{fontWeight:700,fontSize:11,opacity:.6,marginBottom:8}}>Weekly Leaderboard</div>
        {LEADERBOARD.map((u,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:u.isMe?"rgba(255,255,255,.12)":"transparent",borderRadius:10,padding:u.isMe?"6px 8px":"2px 8px"}}><span style={{fontSize:15}}>{u.badge}</span><span style={{flex:1,fontWeight:u.isMe?900:600,fontSize:13}}>{u.name}</span><span style={{fontSize:11,opacity:.7}}>🔥{u.streak}</span><span style={{fontWeight:800,fontSize:13,color:u.isMe?C.gold:"rgba(255,255,255,.75)"}}>{u.xp.toLocaleString()} xp</span></div>)}
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:14,fontFamily:DF}}>Friend Activity</div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {posts.map((post,idx)=>(
            <div key={post.id} style={{background:C.cream,borderRadius:20,overflow:"hidden",border:`1px solid ${C.border}`,animation:`fadeUp .35s ease ${idx*.06}s both`,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
              <div style={{padding:"14px 16px 12px",display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:12,background:`${C.ember}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{post.user.avatar}</div><div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.bark}}>{post.user.name}</div><div style={{fontSize:11,color:C.muted}}>{post.user.level} · {post.time}</div></div><div style={{fontSize:22}}>{post.emoji}</div></div>
              {post.photo?<img src={post.photo} alt={post.recipe} style={{width:"100%",height:200,objectFit:"cover"}}/>:<div style={{background:`linear-gradient(135deg,${C.bark}0A,${C.ember}18)`,height:130,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}><span style={{fontSize:56}}>{post.emoji}</span><span style={{fontSize:12,fontWeight:700,color:C.bark,opacity:.3}}>{post.recipe}</span></div>}
              <div style={{padding:"12px 16px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.flame,marginBottom:4}}>Cooked: {post.recipe}</div>
                <div style={{fontSize:13,color:"#6A5C52",lineHeight:1.5,marginBottom:12}}>{post.caption}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{REACTS.map(emoji=><button key={emoji} onClick={()=>react(post.id,emoji)} className="tap" style={{display:"flex",alignItems:"center",gap:5,background:post.myReaction===emoji?`${C.flame}18`:C.pill,border:`1.5px solid ${post.myReaction===emoji?C.flame:C.border}`,borderRadius:99,padding:"5px 12px",cursor:"pointer",transition:"all .14s"}}><span style={{fontSize:16}}>{emoji}</span><span style={{fontSize:12,fontWeight:700,color:post.myReaction===emoji?C.flame:C.muted}}>{post.reactions[emoji]||0}</span></button>)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ PROFILE TAB ═════════════════════════════════════════════════════════ */
function ProfileTab({profile,setProfile,pantry,setPantry,onOpenPantry,allRecipes,goal,onEditGoal,notifEnabled,setNotifEnabled,notifTime,setNotifTime}) {
  const BADGES=[{emoji:"🔥",label:"7-Day Streak",earned:true},{emoji:"🌶️",label:"Spice Lover",earned:true},{emoji:"🧄",label:"Garlic Devotee",earned:true},{emoji:"🥋",label:"Knife Sensei",earned:true},{emoji:"🏆",label:"Week Champion",earned:false},{emoji:"🍰",label:"Pastry Prodigy",earned:false}];
  const SKILLS=[{label:"Knife Skills",emoji:"🔪",lvl:4,col:C.flame},{label:"Spice Mastery",emoji:"🌶️",lvl:2,col:C.ember},{label:"Bread & Dough",emoji:"🍞",lvl:4,col:C.gold},{label:"Pasta Arts",emoji:"🍝",lvl:3,col:C.sage},{label:"Egg Wizardry",emoji:"🥚",lvl:3,col:C.moss},{label:"Umami Depth",emoji:"🍄",lvl:2,col:C.plum}];
  const cooked=allRecipes.filter(r=>r.done).length;
  const TIMES=["06:00","07:00","08:00","12:00","17:00","18:00","19:00","20:00","21:00"];
  return (
    <div style={{paddingBottom:30}}>
      <div style={{margin:"4px 16px 20px",background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"22px 20px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:60,height:60,borderRadius:18,background:`linear-gradient(135deg,${C.flame},${C.ember})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>👩‍🍳</div>
          <div><div style={{fontWeight:900,fontSize:20,fontFamily:DF}}>Your Profile</div><div style={{fontSize:12,opacity:.65,marginTop:2}}>Chef Lv.5 · {goal.icon} {goal.label} goal</div></div>
        </div>
        <div style={{display:"flex",gap:10}}>{[["Cooked",cooked],["XP","340"],["Badges","4"]].map(([l,v])=><div key={l} style={{flex:1,background:"rgba(255,255,255,.1)",borderRadius:12,padding:"10px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{v}</div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".08em"}}>{l}</div></div>)}</div>
      </div>
      <div style={{padding:"0 16px"}}>
        {/* Goal */}
        <button onClick={onEditGoal} className="tap" style={{width:"100%",background:`${goal.color}12`,border:`2px solid ${goal.color}40`,borderRadius:20,padding:"18px",marginBottom:14,cursor:"pointer",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:52,height:52,borderRadius:14,background:goal.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{goal.icon}</div>
            <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:C.bark,fontFamily:DF}}>Cooking Goal</div><div style={{fontSize:14,fontWeight:700,color:goal.color,marginTop:2}}>{goal.label}</div><div style={{fontSize:12,color:C.muted,marginTop:1}}>{goal.sub}</div></div>
            <div style={{fontSize:12,color:C.muted,fontWeight:700}}>Change →</div>
          </div>
        </button>

        {/* Notifications */}
        <div style={{background:C.cream,borderRadius:20,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:3,fontFamily:DF}}>🔔 Daily Reminder</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Get nudged to cook at your set time</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:notifEnabled?16:0}}>
            <div style={{fontSize:14,fontWeight:700,color:C.bark}}>Enable reminder</div>
            <button onClick={()=>setNotifEnabled(e=>!e)} style={{width:48,height:28,borderRadius:99,background:notifEnabled?C.sage:"#D0C8BF",border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:notifEnabled?22:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
            </button>
          </div>
          {notifEnabled&&(
            <>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em"}}>Reminder time</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {TIMES.map(t=><button key={t} onClick={()=>setNotifTime(t)} className="tap" style={{padding:"7px 12px",borderRadius:10,border:`2px solid ${notifTime===t?C.sage:C.border}`,background:notifTime===t?`${C.sage}18`:"transparent",color:notifTime===t?C.sage:C.bark,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .15s"}}>{t}</button>)}
              </div>
            </>
          )}
        </div>

        {/* Dietary */}
        <div style={{background:C.cream,borderRadius:20,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:3,fontFamily:DF}}>🥗 Dietary Preference</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Personalises your AI-generated recipes</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{DIET_OPTIONS.map(opt=><button key={opt} onClick={()=>setProfile(p=>({...p,dietary:opt}))} className="tap" style={{padding:"7px 14px",borderRadius:99,border:`2px solid ${profile.dietary===opt?C.sage:C.border}`,background:profile.dietary===opt?C.sage:"transparent",color:profile.dietary===opt?"#fff":C.bark,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .15s"}}>{opt}</button>)}</div>
        </div>

        {/* Skill */}
        <div style={{background:C.cream,borderRadius:20,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:3,fontFamily:DF}}>👨‍🍳 Skill Level</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Adjusts recipe complexity & tips</div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>{SKILL_LEVELS.map(lvl=><button key={lvl} onClick={()=>setProfile(p=>({...p,skill:lvl}))} className="tap" style={{whiteSpace:"nowrap",padding:"8px 16px",borderRadius:99,border:`2px solid ${profile.skill===lvl?C.flame:C.border}`,background:profile.skill===lvl?C.flame:"transparent",color:profile.skill===lvl?"#fff":C.bark,fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{lvl}</button>)}</div>
        </div>

        {/* Pantry */}
        <button onClick={onOpenPantry} className="tap" style={{width:"100%",background:`${C.ember}10`,border:`2px solid ${C.ember}33`,borderRadius:20,padding:"18px",marginBottom:14,cursor:"pointer",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:36}}>🧊</span>
            <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:C.bark,fontFamily:DF}}>Pantry Mode</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{pantry.length>0?`${pantry.length} items tracked`:"What's in your fridge?"}</div>{pantry.length>0&&<div style={{fontSize:12,color:C.ember,fontWeight:600,marginTop:3}}>{pantry.slice(0,3).join(", ")}{pantry.length>3?` +${pantry.length-3} more`:""}</div>}</div>
            <span style={{fontSize:20,color:C.muted}}>→</span>
          </div>
        </button>

        {/* Skills */}
        <div style={{marginBottom:20}}>
          <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:12,fontFamily:DF}}>Skill Tree</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {SKILLS.map((s,i)=><div key={i} style={{background:C.cream,border:`2px solid ${s.col}33`,borderRadius:18,padding:"16px 14px"}}><div style={{fontSize:26,marginBottom:8}}>{s.emoji}</div><div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:2}}>{s.label}</div><div style={{fontSize:11,color:C.muted,marginBottom:8}}>Level {s.lvl}/5</div><div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(n=><div key={n} style={{flex:1,height:6,borderRadius:99,background:n<=s.lvl?s.col:"#E8DDD4"}}/>)}</div></div>)}
          </div>
        </div>

        {/* Badges */}
        <div>
          <div style={{fontWeight:900,fontSize:18,color:C.bark,marginBottom:12,fontFamily:DF}}>Badges</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {BADGES.map((b,i)=><div key={i} style={{background:b.earned?C.cream:"#F0EBE6",border:`2px solid ${b.earned?C.gold:"#E0D5CB"}`,borderRadius:16,padding:"16px 10px",textAlign:"center",opacity:b.earned?1:.5,boxShadow:b.earned?`0 4px 14px ${C.gold}33`:"none"}}><div style={{fontSize:28,marginBottom:6,filter:b.earned?"none":"grayscale(1)"}}>{b.emoji}</div><div style={{fontSize:10,fontWeight:700,color:C.bark,lineHeight:1.3}}>{b.label}</div>{b.earned&&<div style={{fontSize:9,color:C.gold,fontWeight:700,marginTop:4}}>EARNED</div>}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ROOT APP ════════════════════════════════════════════════════════════ */
export default function App() {
  const [onboarded,    setOnboarded]    = useState(false);
  const [tab,          setTab]          = useState("home");
  const [mounted,      setMounted]      = useState(false);
  const [xp,           setXp]           = useState(340);
  const [allRecipes,   setAllRecipes]   = useState(SEED_RECIPES);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [editingRecipe,setEditingRecipe]= useState(null);
  const [showAI,       setShowAI]       = useState(false);
  const [showPantry,   setShowPantry]   = useState(false);
  const [showGoal,     setShowGoal]     = useState(false);
  const [showGrocery,  setShowGrocery]  = useState(false);
  const [posts,        setPosts]        = useState(SEED_POSTS);
  const [pantry,       setPantry]       = useState(["eggs","garlic","onions","olive oil","pasta"]);
  const [profile,      setProfile]      = useState({dietary:"No restrictions",skill:"Intermediate"});
  const [goal,         setGoal]         = useState(STREAK_GOALS[2]);
  const [cookedDays,   setCookedDays]   = useState([true,true,false,true,false,false,false]);
  const [challenges,   setChallenges]   = useState(MONTHLY_CHALLENGES);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTime,    setNotifTime]    = useState("18:00");
  const notifRef = useRef(null);

  useEffect(()=>{ setTimeout(()=>setMounted(true),60); },[]);

  // Notification scheduling
  useEffect(()=>{
    if(notifRef.current) clearTimeout(notifRef.current);
    if(!onboarded||!notifEnabled) return;
    const scheduleNotif = () => {
      const now=new Date();
      const [h,m]=notifTime.split(":").map(Number);
      const target=new Date(); target.setHours(h,m,0,0);
      if(target<=now) target.setDate(target.getDate()+1);
      const delay=target-now;
      notifRef.current=setTimeout(()=>{
        if(Notification.permission==="granted"){
          new Notification("mise.en.place 🍳",{body:`Time to cook! Keep your ${goal.label} streak alive.`,icon:"🍳"});
        }
        scheduleNotif();
      },delay);
    };
    if(Notification.permission==="granted"){ scheduleNotif(); }
    else if(Notification.permission!=="denied"){ Notification.requestPermission().then(p=>{ if(p==="granted") scheduleNotif(); }); }
    return()=>{ if(notifRef.current) clearTimeout(notifRef.current); };
  },[onboarded,notifEnabled,notifTime,goal]);

  const handleComplete = useCallback((recipe,photoUrl)=>{
    setAllRecipes(rs=>rs.map(r=>r.id===recipe.id?{...r,done:true}:r));
    setXp(x=>x+recipe.xp);
    const di=new Date().getDay();const idx=di===0?6:di-1;
    setCookedDays(d=>{const n=[...d];n[idx]=true;return n;});
    setPosts(ps=>[{id:`p-${Date.now()}`,user:{name:"You",avatar:"👩‍🍳",level:"Chef Lv.5"},recipe:recipe.name,emoji:recipe.emoji,photo:photoUrl,caption:`Just cooked ${recipe.name}! +${recipe.xp} XP 🎉`,time:"just now",reactions:{"❤️":0,"🔥":0,"😍":0,"🤤":0},myReaction:null},...ps]);
  },[]);

  const openRecipe = useCallback((recipe)=>setDetailRecipe(allRecipes.find(r=>r.id===recipe.id)||recipe),[allRecipes]);
  const saveRecipe = useCallback((updated)=>setAllRecipes(rs=>rs.map(r=>r.id===updated.id?updated:r)),[]);
  const saveAI     = useCallback((recipe)=>setAllRecipes(rs=>[recipe,...rs]),[]);
  const selectGoal = useCallback((g)=>{setGoal(g);setShowGoal(false);},[]);

  const handleOnboardComplete = ({profile:p,goal:g,notifEnabled:ne,notifTime:nt}) => {
    setProfile(p); setGoal(g); setNotifEnabled(ne); setNotifTime(nt); setOnboarded(true);
  };

  const TABS=[{id:"home",label:"Today",emoji:"🍳"},{id:"recipes",label:"Recipes",emoji:"📖"},{id:"challenges",label:"Challenges",emoji:"🏅"},{id:"social",label:"Social",emoji:"👥"},{id:"profile",label:"You",emoji:"🧑"}];
  const weekDone=cookedDays.filter(Boolean).length;

  if(!onboarded) return (
    <>
      <style>{CSS}</style>
      <Onboarding onComplete={handleOnboardComplete}/>
    </>
  );

  if(detailRecipe){
    const live=allRecipes.find(r=>r.id===detailRecipe.id)||detailRecipe;
    return (
      <>
        <style>{CSS}</style>
        <div style={{maxWidth:420,margin:"0 auto"}}>
          <RecipeDetail recipe={live} onBack={()=>setDetailRecipe(null)} onComplete={(r,p)=>{handleComplete(r,p);setDetailRecipe(null);}} onEdit={()=>setEditingRecipe(live)}/>
          {editingRecipe&&<RecipeEditor recipe={editingRecipe} onSave={updated=>{saveRecipe(updated);setEditingRecipe(null);setDetailRecipe(updated);}} onClose={()=>setEditingRecipe(null)}/>}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto",opacity:mounted?1:0,transform:mounted?"none":"translateY(10px)",transition:"all .35s cubic-bezier(.4,0,.2,1)"}}>
        <div style={{background:C.paper,padding:"15px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontWeight:900,fontSize:22,color:C.bark,letterSpacing:"-.03em",fontFamily:DF}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
            <div style={{fontSize:11,color:C.muted,marginTop:-1}}>your daily cooking habit</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setShowAI(true)} className="tap" style={{background:`${C.sky}18`,border:`1.5px solid ${C.sky}44`,borderRadius:10,padding:"6px 12px",color:C.sky,fontWeight:800,fontSize:12,cursor:"pointer"}}>✨ AI</button>
            <div onClick={()=>setShowGoal(true)} className="tap" style={{background:`linear-gradient(135deg,${goal.color},${goal.color}BB)`,borderRadius:12,padding:"6px 13px",color:"#fff",fontWeight:800,fontSize:13,boxShadow:`0 4px 12px ${goal.color}44`,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"}}>{goal.icon} {weekDone}/{goal.target}</div>
          </div>
        </div>
        <div style={{minHeight:"calc(100vh - 118px)",paddingTop:14}}>
          {tab==="home"&&<HomeTab xp={xp} setXp={setXp} recipes={allRecipes} onOpen={openRecipe} onComplete={handleComplete} onShowAI={()=>setShowAI(true)} profile={profile} goal={goal} cookedDays={cookedDays} setCookedDays={setCookedDays} onEditGoal={()=>setShowGoal(true)}/>}
          {tab==="recipes"&&<RecipesTab allRecipes={allRecipes} onOpen={openRecipe} onShowAI={()=>setShowAI(true)} profile={profile} onShowGrocery={()=>setShowGrocery(true)}/>}
          {tab==="challenges"&&<ChallengesTab challenges={challenges} setChallenges={setChallenges}/>}
          {tab==="social"&&<SocialTab posts={posts} setPosts={setPosts} xp={xp}/>}
          {tab==="profile"&&<ProfileTab profile={profile} setProfile={setProfile} pantry={pantry} setPantry={setPantry} onOpenPantry={()=>setShowPantry(true)} allRecipes={allRecipes} goal={goal} onEditGoal={()=>setShowGoal(true)} notifEnabled={notifEnabled} setNotifEnabled={setNotifEnabled} notifTime={notifTime} setNotifTime={setNotifTime}/>}
        </div>
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
      {showAI     &&<AIGenerator profile={profile} onSave={saveAI} onClose={()=>setShowAI(false)}/>}
      {showPantry &&<PantrySheet pantry={pantry} setPantry={setPantry} onClose={()=>setShowPantry(false)}/>}
      {showGoal   &&<GoalPicker goal={goal} onSelect={selectGoal} onClose={()=>setShowGoal(false)}/>}
      {showGrocery&&<GrocerySheet allRecipes={allRecipes} onClose={()=>setShowGrocery(false)}/>}
    </>
  );
}
