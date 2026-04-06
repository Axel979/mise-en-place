'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

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
  @keyframes slideRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
  @keyframes slideRight{from{transform:translateX(100%)}to{transform:none}}
  @keyframes levelUp{0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.15) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
  .ch:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(0,0,0,.11)!important}
  .tap:active{transform:scale(.94)!important} input,textarea,button{font-family:inherit}
`;

/* ═══ LEVELS ══════════════════════════════════════════════════════════════ */
// Infinite rank system — ranks repeat with multiplying thresholds
// You can drop ranks if inactive (weekly activity required above Rank 5)
const BASE_RANKS = [
  {title:"Prep Hand",     icon:"", color:"#9E8C7E", minDishes:0   },
  {title:"Home Cook",     icon:"", color:"#FF8C42", minDishes:10  },
  {title:"Line Cook",     icon:"", color:"#4A90D9", minDishes:25  },
  {title:"Demi Chef",     icon:"", color:"#5C7A4E", minDishes:50  },
  {title:"Sous Chef",     icon:"", color:"#9B5DE5", minDishes:100 },
  {title:"Chef de Partie",icon:"", color:"#F5C842", minDishes:200 },
  {title:"Head Chef",     icon:"", color:"#E05C7A", minDishes:500 },
  {title:"Exec Chef",     icon:"", color:"#CC2200", minDishes:1000},
  {title:"Legend",        icon:"", color:"#1A237E", minDishes:2000},
];

function AccountSettings({onBack, user, profile, supabase, onProfileUpdate}){
  const [username, setUsername] = React.useState(profile?.username||"");
  const [checking, setChecking] = React.useState(false);
  const [available, setAvailable] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);

  const checkUsername = async(val) => {
    setUsername(val); setAvailable(null);
    if(val.length < 3 || val === profile?.username){setAvailable(val===profile?.username||null); return;}
    setChecking(true);
    if(!supabase){setChecking(false);return;}
    const{data}=await supabase.from("profiles").select("id").eq("username",val.toLowerCase().trim()).single();
    setAvailable(!data); setChecking(false);
  };

  const handleSave = async() => {
    if(!user?.id||!supabase)return;
    setSaving(true);
    const updates = {updated_at:new Date().toISOString()};
    if(username && username !== profile?.username && available===true){
      updates.username = username.toLowerCase().trim();
    }
    await supabase.from("profiles").upsert({id:user.id,...updates},{onConflict:"id"});
    onProfileUpdate({...profile,...updates});
    setSaved(true); setSaving(false);
    setTimeout(()=>setSaved(false),2500);
  };

  const handlePasswordReset = async() => {
    if(!user?.email||!supabase)return;
    await supabase.auth.resetPasswordForEmail(user.email,{
      redirectTo:`${window.location.origin}/auth/callback`
    });
    setResetSent(true);
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
        <button onClick={onBack} style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.bark} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF}}>Account</div>
      </div>

      {/* Email - read only */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Email</div>
        <div style={{padding:"11px 14px",borderRadius:14,border:`1.5px solid ${C.border}`,background:"#F5F0EB",fontSize:14,color:C.muted}}>{user?.email||"—"}</div>
      </div>

      {/* Username */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Username</div>
        <div style={{position:"relative"}}>
          <input value={username} onChange={e=>checkUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g,""))} maxLength={20}
            style={{width:"100%",padding:"11px 40px 11px 14px",borderRadius:14,border:`2px solid ${available===true?C.sage:available===false?C.flame:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box"}}/>
          <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:14}}>
            {checking?"…":available===true?"✓":available===false?"✗":""}
          </div>
        </div>
        {available===false&&<div style={{fontSize:11,color:C.flame,marginTop:4}}>Username taken</div>}
        {available===true&&username!==profile?.username&&<div style={{fontSize:11,color:C.sage,marginTop:4}}>Available</div>}
      </div>

      {saved&&<div style={{background:`${C.sage}18`,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.sage,fontWeight:700,marginBottom:12}}>Saved!</div>}
      <Btn onClick={handleSave} disabled={saving} full style={{marginBottom:16}}>{saving?"Saving…":"Save Changes"}</Btn>

      {/* Password reset */}
      <div style={{background:`${C.sky}0E`,border:`1.5px solid ${C.sky}28`,borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontWeight:700,fontSize:14,color:C.bark,marginBottom:4}}>Change password</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:12}}>We'll send a reset link to {user?.email}</div>
        {resetSent
          ?<div style={{fontSize:13,color:C.sage,fontWeight:600}}>Reset link sent! Check your email.</div>
          :<Btn onClick={handlePasswordReset} outline color={C.sky} full>Send Reset Link</Btn>
        }
      </div>
    </div>
  );
}


function StarRating({value, onChange, size=28}){
  const [hover,setHover] = React.useState(0);
  return(
    <div style={{display:'flex',gap:4}}>
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>onChange&&onChange(n)}
          onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
          style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill={(hover||value)>=n?'#F5C842':'none'} stroke={(hover||value)>=n?'#F5C842':'#C8BEB4'} strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}


function AvatarIcon({username, size=36, fontSize=14}){
  const name = username || '?';
  const initial = name[0].toUpperCase();
  const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const bg = AVATAR_COLORS[colorIdx];
  return(
    <div style={{width:size,height:size,borderRadius:size*0.28,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:800,fontSize,color:'#fff',fontFamily:"'Playfair Display',Georgia,serif",userSelect:'none'}}>
      {initial}
    </div>
  );
}


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
  Mexican:{label:"Mexican Cooking",icon:"",color:C.gold},
  Mediterranean:{label:"Mediterranean",icon:"🫒",color:"#00A896"},
  Comfort:{label:"Comfort Food",icon:"",color:C.plum},
  Healthy:{label:"Healthy Cooking",icon:"",color:C.moss},
  Breakfast:{label:"Breakfast Skills",icon:"",color:C.ember},
  Baking:{label:"Baking & Pastry",icon:"",color:C.gold},
  Quick:{label:"Speed Cooking",icon:"",color:C.sky},
};
const calcSkillLevel = n => Math.min(5,Math.floor(n/2));

/* ═══ BADGES ══════════════════════════════════════════════════════════════ */
const BADGES = [
  {id:"first_cook",  emoji:"",label:"First Cook",     desc:"Complete your first recipe",          check:s=>s.total>=1},
  {id:"five_cooked", emoji:"",label:"High Five",      desc:"Complete 5 recipes",                  check:s=>s.total>=5},
  {id:"ten_cooked",  emoji:"",label:"Ten Down",        desc:"Complete 10 recipes",                 check:s=>s.total>=10},
  {id:"streak_3",    emoji:"",label:"On Fire",         desc:"Cook 3 days in a row",                check:s=>s.streak>=3},
  {id:"streak_7",    emoji:"",label:"Week Warrior",    desc:"Cook 7 days in a row",                check:s=>s.streak>=7},
  {id:"world_tour",  emoji:"",label:"World Tour",      desc:"Cook from 5 different cuisines",      check:s=>s.cuisines>=5},
  {id:"asian_3",     emoji:"",label:"Asian Apprentice",desc:"Cook 3 Asian dishes",                 check:s=>(s.cats.Asian||0)>=3},
  {id:"italian_3",   emoji:"",label:"Pasta Pro",       desc:"Cook 3 Italian dishes",               check:s=>(s.cats.Italian||0)>=3},
  {id:"breakfast_5", emoji:"",label:"Early Bird",      desc:"Cook 5 breakfast dishes",             check:s=>(s.cats.Breakfast||0)>=5},
  {id:"sprint",      emoji:"",label:"Sprinter",        desc:"Complete the 5 Dish Sprint",          check:s=>s.challs.includes("sprint_5")},
  {id:"explorer",    emoji:"",label:"Explorer",        desc:"Complete the 10 Meal Explorer",       check:s=>s.challs.includes("explorer_10")},
  {id:"marathon",    emoji:"",label:"Marathoner",      desc:"Complete the 30 Cook Marathon",       check:s=>s.challs.includes("marathon_30")},
  {id:"mwah_10",    emoji:"",label:"Social Star",     desc:"Receive 10 🤌 Mwahs on your posts",      check:s=>s.mwah>=10},
  {id:"level_5",     emoji:"",label:"Sous Chef",      desc:"Reach Level 5",                       check:s=>s.level>=5},
];

/* ═══ CHALLENGES ══════════════════════════════════════════════════════════ */
const CHALLENGES = [
  {
    id:"sprint_5",name:"5 Dish Sprint",emoji:"",color:"#FF4D1C",dark:"#CC3A12",
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
    id:"explorer_10",name:"10 Meal Explorer",emoji:"",color:"#4A90D9",dark:"#2E6DB3",
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
    id:"weeknight_5",name:"Weeknight Warrior",emoji:"",color:"#9B5DE5",dark:"#7A40BF",
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
    id:"breakfast_7",name:"Breakfast Club",emoji:"",color:"#F5C842",dark:"#C9A020",
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
    id:"world_tour",name:"World Tour",emoji:"",color:"#00A896",dark:"#007A6E",
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
    id:"date_night_3",name:"Date Night Series",emoji:"",color:"#E05C7A",dark:"#B33A57",
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
    id:"half_20",name:"20 Meal Journey",emoji:"",color:"#FF8C42",dark:"#CC6A2A",
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
    id:"marathon_30",name:"30 Cook Marathon",emoji:"",color:"#3B2A1A",dark:"#1A1008",
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
  {id:53281,photo:"https://www.themealdb.com/images/media/meals/8rfd4q1764112993.jpg",name:"Algerian Kefta (Meatballs)",emoji:"",xp:94,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:551,protein:27,carbs:45,fat:26,fiber:3},done:false,ingredients:["1 lb Ground Beef","4 Cloves Crushed Garlic","1/2 cup Onion","To taste Salt","To taste Pepper","3 Plum Tomatoes","1 tsp Parsley","1/2 cup Water"],steps:[{title:"Mix",body:"Combine ground beef with 1/2 of the minced garlic and 1 tablespoon chopped onion in a large bowl. Mix with your hands until fully incorporated. Shape meat mixture into 1 1/2-inch oblong patties; you should have 12 to 14 meatballs.",timer:0},{title:"Preheat",body:"Heat a large skillet over medium-high heat. Brown patties in batches in the hot skillet until crispy on both sides and no longer pink in the center, about 10 minutes. Set meatballs aside in a rimmed serving dish.",timer:600},{title:"Preheat",body:"Reduce heat to medium and stir remaining chopped onion into drippings in the skillet. Season with salt and pepper. Cook, stirring constantly, until onion has softened and turned translucent, about 5 minutes. Stir in remaining garlic and cook for 30 seconds. Stir in Roma tomatoes,",timer:300},{title:"Serve",body:"Pour tomato sauce over meatballs to serve.",timer:0}],tip:"Original recipe: https://www.allrecipes.com/recipe/153790/algerian-kefta-meatballs/"},
  {id:53334,photo:"https://www.themealdb.com/images/media/meals/13fg4j1764441982.jpg",name:"Arepa Pabellón",emoji:"",xp:69,difficulty:"Medium",time:"40 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:561,protein:34,carbs:30,fat:30,fiber:5},done:false,ingredients:["2 Corn Arepa Filled With Mozarella Cheese","1 Fried Ripe Bananas","1 Can Black Beans","1 Pico De Gallo Sauce","2kg Shredded Meat","1 chopped Tomato","Pinch Salt","Pinch Pepper"],steps:[{title:"Preheat",body:"Prepare the meat in a skillet and add salt and pepper to taste, heat the beans over medium heat in a pan, fry or grill the ripe plantains as indicated on its package and cut the tomato into small cubes. Reserve these ingredients until filling.",timer:0},{title:"Preheat",body:"Preheat the grill or pan and grill the arepa, putting it once on each side until they are golden brown.",timer:0},{title:"Prep",body:"With the help of a knife, open it by the edge through the middle, creating a space to fill it with the ripe plantain, the beans, meat and chopped tomato.",timer:0},{title:"Serve",body:"Serve with a little pico de gallo or guacamole dip sauce.",timer:0}],tip:"Original recipe: https://goya.es/en/recipes/arepa-rellena-con-carne-frijol-y-madurito"},
  {id:53329,photo:"https://www.themealdb.com/images/media/meals/jgl9qq1764437635.jpg",name:"Arepa pelua",emoji:"",xp:125,difficulty:"Hard",time:"2 hrs",category:"Comfort",diets:["Gluten-free"],macros:{calories:544,protein:34,carbs:33,fat:30,fiber:3},done:false,ingredients:["500g Beef","1 Onion","1 Red Pepper","2 cloves Garlic","1 tsp Cumin","1 tsp Oregano","1 tsp Paprika","1 L Beef Stock","2 1/2 cups Water","Pinch Salt","200g Cheese","Pinch Extra Virgin Olive Oil"],steps:[{title:"Preheat",body:"Cook the meat: Place the flank steak in a pot with broth or water and salt. Cook over low heat for about 2 hours, until tender and easy to shred.",timer:7200},{title:"Cook",body:"Shred the meat: Once cooked, drain and shred the meat using two forks.",timer:0},{title:"Mix",body:"Prepare the vegetables: Sauté chopped onion, bell pepper, and garlic in a little oil. Add cumin, oregano, paprika, and salt. Stir in the meat and cook for a few minutes until the flavors are well combined.",timer:0},{title:"Preheat",body:"Make the dough: In a bowl, mix the cornmeal with warm water and salt until a soft dough forms. Let it rest for 5 minutes.",timer:300},{title:"Add",body:"Form the arepas: Divide the dough into 6 portions, shape into balls, and flatten into thick discs.",timer:0},{title:"Preheat",body:"Cook: Cook the arepas on a griddle or skillet over medium heat for 2–3 minutes on each side until golden. You can then bake them for a few minutes if you prefer them crispier.",timer:180},{title:"Prep",body:"Fill: Slice the arepas open on one side, fill with the hot shredded beef, and top with grated cheese.",timer:0}],tip:"Original recipe: https://goya.es/en/recipes/arepa-pelua"},
  {id:53133,photo:"https://www.themealdb.com/images/media/meals/kgfh3q1763075438.jpg",name:"Asado",emoji:"",xp:69,difficulty:"Medium",time:"2 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:574,protein:31,carbs:45,fat:26,fiber:2},done:false,ingredients:["2kg Mixed Beef Cuts","4 Chorizo","2 Morcilla","To taste Salt"],steps:[{title:"Cook",body:"Prepare the Fire: Start a wood fire in your grill and let it burn down to coals.",timer:0},{title:"Prep",body:"Season the Meat: Generously salt the beef cuts.",timer:0},{title:"Prep",body:"Grill the Meat: Place the beef on the grill, starting with the thickest cuts farthest from the coals. Add chorizo and morcilla after the beef has been cooking for a while.",timer:0},{title:"Prep",body:"Cook to Perfection: Cook the meat, turning occasionally, until it reaches your desired doneness. Typically, ribs may take up to 2 hours; thinner cuts will cook faster.",timer:7200},{title:"Cook",body:"Rest and Serve: Let the meat rest for about 10 minutes before slicing. Serve with chimichurri sauce and grilled vegetables.",timer:600},{title:"Preheat",body:"Use a mix of wood and charcoal for a consistent heat source. Wood adds flavor, while charcoal maintains temperature.",timer:0},{title:"Cook",body:"Season the meat just before grilling to ensure it retains its moisture and flavor.",timer:0},{title:"Serve",body:"Serve with a side of chimichurri sauce, a fresh tomato salad, and crusty bread. Pair with a robust Malbec wine to complement the rich flavors of the meat.",timer:0}],tip:"Original recipe: https://www.munchery.com/blog/the-ten-iconic-dishes-of-argentina-and-how-to-cook-them-at-home/"},
  {id:53099,photo:"https://www.themealdb.com/images/media/meals/44bzep1761848278.jpg",name:"Aussie Burgers",emoji:"",xp:66,difficulty:"Medium",time:"3 min",category:"Comfort",diets:["Vegetarian"],macros:{calories:562,protein:35,carbs:42,fat:30,fiber:3},done:false,ingredients:["500g Lean Minced Steak","100g Cooked Beetroot","2 small Naan Bread","50g Rocket","4 tablespoons Soured cream and chive dip"],steps:[{title:"Mix",body:"Make the burgers: Tip the meat into a bowl and sprinkle over 1 tsp salt and a good grinding of black pepper.Work with wet hands to mix in the seasoning. Divide into four with your hands and shape into burgers. (It can be frozen at this stage.).",timer:0},{title:"Prep",body:"Sort out your ingredients: Slice the beetroot and split the naan breads.",timer:0},{title:"Preheat",body:"Toast the naans: Heat a griddle pan or barbecue. Griddle the naans on both sides until lightly toasted and set aside. Add the burgers to the grill or barbecue and cook for 2-3 minutes, then turn and cook the other side for a further 2-3 minutes.",timer:180},{title:"Prep",body:"Assemble the dish: Set half a toasted naan on each serving plate and put a pile of rocket on each. Top with a burger, then a few slices of beetroot and a dollop of soured cream. Sprinkle with salt and freshly ground black pepper and serve immediately with a big green salad and ch",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/aussie-burgers"},
  {id:53366,photo:"https://www.themealdb.com/images/media/meals/m0p0j81765568742.jpg",name:"Beef and Broccoli Stir-Fry",emoji:"",xp:103,difficulty:"Hard",time:"10 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:430,protein:27,carbs:50,fat:18,fiber:2},done:false,ingredients:["1 tsp Soy Sauce","1 tsp Dry sherry","1/2 tsp Cornstarch","1/8 teaspoon Black Pepper","1 lb Sirloin steak","2 tablespoons Oyster Sauce","1 tsp Dry sherry","1 tablespoon Soy Sauce","1/4 cup Chicken Stock","1 lb Broccoli","2 tablespoons High Heat Cooking Oil","2 cloves minced Garlic","1 tsp Cornstarch","1 tablespoon Water"],steps:[{title:"Mix",body:"Stir together the beef marinade ingredients (1 teaspoon soy sauce, 1 teaspoon Chinese rice wine, 1/2 teaspoon cornstarch, 1/8 teaspoon black pepper) in a medium bowl.. Add the beef slices and stir until coated. Let stand for 10 minutes.",timer:600},{title:"Mix",body:"Stir together the sauce ingredients (2 tablespoons oyster sauce, 1 teaspoon Chinese rice wine, 1 teaspoon soy sauce, 1/4 cup chicken broth) in a small bowl. Set aside.. Blanch or steam the broccoli:.",timer:0},{title:"Preheat",body:"Bring a pot of water to a boil. Add the broccoli and cook until crisp-tender, about 2 minutes. Drain thoroughly.. Heat a large frying pan or wok over high heat until a bead of water sizzles and instantly evaporates upon contact. Add the cooking oil and swirl to coat.",timer:120},{title:"Prep",body:"Add the beef and immediately spread it out all over the surface of the wok or pan in a single layer (preferably not touching).. Let the beef fry undisturbed for 1 minute. Flip the beef slices over, add the garlic to the pan, and fry for an additional 30 seconds to 1 minute until ",timer:60},{title:"Mix",body:"Add the sauce, cornstarch, and broccoli:. Pour in the sauce and the cornstarch slurry (1 teaspoon cornstarch dissolved in 1 tablespoon of water). Stir until the sauce boils and thickens, about 30 seconds. Stir in the broccoli.",timer:0},{title:"Serve",body:"Serve immediately, with steamed rice or on its own.",timer:0}],tip:"Original recipe: https://www.simplyrecipes.com/recipes/broccoli_beef/"},
  {id:52874,photo:"https://www.themealdb.com/images/media/meals/sytuqu1511553755.jpg",name:"Beef and Mustard Pie",emoji:"",xp:148,difficulty:"Hard",time:"30 min",category:"Comfort",diets:["No restrictions"],macros:{calories:576,protein:27,carbs:32,fat:32,fiber:2},done:false,ingredients:["1kg Beef","2 tbs Plain Flour","2 tbs Rapeseed Oil","200ml Red Wine","400ml Beef Stock","1 finely sliced Onion","2 chopped Carrots","3 sprigs Thyme","2 tbs Mustard","2 free-range Egg Yolks","400g Puff Pastry","300g Green Beans","25g Butter","pinch Salt","pinch Pepper"],steps:[{title:"Preheat",body:"Preheat the oven to 150C/300F/Gas 2.. Toss the beef and flour together in a bowl with some salt and black pepper.. Heat a large casserole until hot, add half of the rapeseed oil and enough of the beef to just cover the bottom of the casserole.",timer:0},{title:"Cook",body:"Fry until browned on each side, then remove and set aside. Repeat with the remaining oil and beef.. Return the beef to the pan, add the wine and cook until the volume of liquid has reduced by half, then add the stock, onion, carrots, thyme and mustard, and season well with salt a",timer:0},{title:"Preheat",body:"Remove from the oven, check the seasoning and set aside to cool. Remove the thyme.. When the beef is cool and you're ready to assemble the pie, preheat the oven to 200C/400F/Gas 6.. Transfer the beef to a pie dish, brush the rim with the beaten egg yolks and lay the pastry over t",timer:0},{title:"Cook",body:"Trim the pastry so there is just enough excess to crimp the edges, then place in the oven and bake for 30 minutes, or until the pastry is golden-brown and cooked through.. For the green beans, bring a saucepan of salted water to the boil, add the beans and cook for 4-5 minutes, o",timer:1800},{title:"Serve",body:"To serve, place a large spoonful of pie onto each plate with some green beans alongside.",timer:0}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/beef_and_mustard_pie_58002"},
  {id:52878,photo:"https://www.themealdb.com/images/media/meals/wrssvt1511556563.jpg",name:"Beef and Oyster pie",emoji:"",xp:128,difficulty:"Hard",time:"2 hrs",category:"Comfort",diets:["No restrictions"],macros:{calories:554,protein:33,carbs:30,fat:25,fiber:4},done:false,ingredients:["900g Beef","3 tbs Olive Oil","3 Shallots","2 cloves minced Garlic","125g Bacon","1 tbs chopped Thyme","2 Bay Leaf","330ml Stout","400ml Beef Stock","2 tbs Corn Flour","8 Oysters","400g Plain Flour","pinch Salt","250g Butter","To Glaze Eggs"],steps:[{title:"Preheat",body:"Season the beef cubes with salt and black pepper. Heat a tablespoon of oil in the frying pan and fry the meat over a high heat. Do this in three batches so that you don’t overcrowd the pan, transferring the meat to a large flameproof casserole dish once it is browned all over. Ad",timer:0},{title:"Mix",body:"In the same pan, add another tablespoon of oil and cook the shallots for 4-5 minutes, then add the garlic and fry for 30 seconds. Add the bacon and fry until slightly browned. Transfer the onion and bacon mixture to the casserole dish and add the herbs.",timer:300},{title:"Preheat",body:"Preheat the oven to 180C/350F/Gas 4.",timer:0},{title:"Mix",body:"Pour the stout into the frying pan and bring to the boil, stirring to lift any stuck-on browned bits from the bottom of the pan. Pour the stout over the beef in the casserole dish and add the stock. Cover the casserole and place it in the oven for 1½-2 hours, or until the beef is",timer:7200},{title:"Mix",body:"Skim off any surface fat, taste and add salt and pepper if necessary, then stir in the cornflour paste. Put the casserole dish on the hob – don’t forget that it will be hot – and simmer for 1-2 minutes, stirring, until thickened. Leave to cool.",timer:120},{title:"Mix",body:"Increase the oven to 200C/400F/Gas 6. To make the pastry, put the flour and salt in a very large bowl. Grate the butter and stir it into the flour in three batches. Gradually add 325ml/11fl oz cold water – you may not need it all – and stir with a round-bladed knife until the mix",timer:0},{title:"Rest",body:"Roll the rest of the pastry out until about 2cm/¾in larger than the dish you’re using. Line the dish with the pastry then pile in the filling, tucking the oysters in as well. Brush the edge of the pastry with beaten egg.",timer:0},{title:"Cook",body:"Roll the remaining pastry until slightly larger than your dish and gently lift over the filling, pressing the edges firmly to seal, then trim with a sharp knife. Brush with beaten egg to glaze. Put the dish on a baking tray and bake for 25-30 minutes, or until the pastry is golde",timer:1800}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/beef_and_oyster_pie_65230"},
  {id:53071,photo:"https://www.themealdb.com/images/media/meals/pkopc31683207947.jpg",name:"Beef Asado",emoji:"",xp:139,difficulty:"Hard",time:"30 min",category:"Asian",diets:["Gluten-free"],macros:{calories:435,protein:25,carbs:51,fat:12,fiber:3},done:false,ingredients:["1.5kg Beef","1 Beef Stock Concentrate","8 ounces Tomato Puree","3 cups Water","6 tablespoons Soy Sauce","1 tbs White Wine Vinegar","2 tbs Pepper","4 Bay Leaf","1/2 Lemon","2 tbs Tomato Sauce","3 tbs Butter","1/2 cup Olive Oil","1 chopped Onion","4 cloves Garlic"],steps:[{title:"Mix",body:"Combine beef, crushed peppercorn, soy sauce, vinegar, dried bay leaves, lemon, and tomato sauce. Mix well. Marinate beef for at least 30 minutes.",timer:1800},{title:"Cook",body:"Put the marinated beef in a cooking pot along with remaining marinade. Add water. Let boil.",timer:0},{title:"Preheat",body:"Add Knorr Beef Cube. Stir. Cover the pot and cook for 40 minutes in low heat.",timer:2400},{title:"Cook",body:"Turn the beef over. Add tomato paste. Continue cooking until beef tenderizes. Set aside.",timer:0},{title:"Preheat",body:"Heat oil in a pan. Fry the potato until it browns. Turn over and continue frying the opposite side. Remove from the pan and place on a clean plate. Do the same with the carrots.",timer:0},{title:"Cook",body:"Save 3 tablespoons of cooking oil from the pan where the potato was fried. Saute onion and garlic until onion softens.",timer:0},{title:"Cook",body:"Pour-in the sauce from the beef stew. Let boil. Add the beef. Cook for 2 minutes.",timer:120},{title:"Cook",body:"Add butter and let it melt. Continue cooking until the sauce reduces to half.",timer:0}],tip:"Original recipe: https://panlasangpinoy.com/beef-asado/"},
  {id:52997,photo:"https://www.themealdb.com/images/media/meals/z0ageb1583189517.jpg",name:"Beef Banh Mi Bowls with Sriracha Mayo, Carrot & Pickled Cucumber",emoji:"",xp:103,difficulty:"Hard",time:"15 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:400,protein:28,carbs:47,fat:12,fiber:3},done:false,ingredients:["White Rice","1 Onion","1 Lime","3 Garlic Clove","1 Cucumber","3 oz Carrots","1 lb Ground Beef","2 oz Soy Sauce"],steps:[{title:"Prepare",body:"Add'l ingredients: mayonnaise, siracha.",timer:0},{title:"Preheat",body:"Place rice in a fine-mesh sieve and rinse until water runs clear. Add to a small pot with 1 cup water (2 cups for 4 servings) and a pinch of salt. Bring to a boil, then cover and reduce heat to low. Cook until rice is tender, 15 minutes. Keep covered off heat for at least 10 minu",timer:900},{title:"Prep",body:"Meanwhile, wash and dry all produce. Peel and finely chop garlic. Zest and quarter lime (for 4 servings, zest 1 lime and quarter both). Trim and halve cucumber lengthwise; thinly slice crosswise into half-moons. Halve, peel, and medium dice onion. Trim, peel, and grate carrot.",timer:0},{title:"Mix",body:"In a medium bowl, combine cucumber, juice from half the lime, ¼ tsp sugar (½ tsp for 4 servings), and a pinch of salt. In a small bowl, combine mayonnaise, a pinch of garlic, a squeeze of lime juice, and as much sriracha as you’d like. Season with salt and pepper.",timer:0},{title:"Preheat",body:"Heat a drizzle of oil in a large pan over medium-high heat. Add onion and cook, stirring, until softened, 4-5 minutes. Add beef, remaining garlic, and 2 tsp sugar (4 tsp for 4 servings). Cook, breaking up meat into pieces, until beef is browned and cooked through, 4-5 minutes. St",timer:300},{title:"Mix",body:"Fluff rice with a fork; stir in lime zest and 1 TBSP butter. Divide rice between bowls. Arrange beef, grated carrot, and pickled cucumber on top. Top with a squeeze of lime juice. Drizzle with sriracha mayo.",timer:0}],tip:"A classic Vietnamese dish."},
  {id:52904,photo:"https://www.themealdb.com/images/media/meals/vtqxtu1511784197.jpg",name:"Beef Bourguignon",emoji:"",xp:156,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:545,protein:36,carbs:30,fat:30,fiber:4},done:false,ingredients:["3 tsp Goose Fat","600g Beef Shin","100g Bacon","350g Challots","250g Chestnut Mushroom","2 sliced Garlic Clove","1 Bouquet Garni","1 tbs Tomato Puree","750 ml Red Wine","600g Celeriac","2 tbs Olive Oil","sprigs of fresh Thyme","sprigs of fresh Rosemary","2 Bay Leaf","4 Cardamom"],steps:[{title:"Preheat",body:"Heat a large casserole pan and add 1 tbsp goose fat. Season the beef and fry until golden brown, about 3-5 mins, then turn over and fry the other side until the meat is browned all over, adding more fat if necessary. Do this in 2-3 batches, transferring the meat to a colander set",timer:300},{title:"Mix",body:"In the same pan, fry the bacon, shallots or pearl onions, mushrooms, garlic and bouquet garni until lightly browned. Mix in the tomato purée and cook for a few mins, stirring into the mixture. This enriches the bourguignon and makes a great base for the stew. Then return the beef",timer:0},{title:"Cook",body:"Pour over the wine and about 100ml water so the meat bobs up from the liquid, but isn’t completely covered. Bring to the boil and use a spoon to scrape the caramelised cooking juices from the bottom of the pan – this will give the stew more flavour.",timer:0},{title:"Preheat",body:"Heat oven to 150C/fan 130C/gas 2. Make a cartouche: tear off a square of foil slightly larger than the casserole, arrange it in the pan so it covers the top of the stew and trim away any excess foil. Then cook for 3 hrs. If the sauce looks watery, remove the beef and veg with a s",timer:0},{title:"Preheat",body:"To make the celeriac mash, peel the celeriac and cut into cubes. Heat the olive oil in a large frying pan. Tip in the celeriac and fry for 5 mins until it turns golden. Season well with salt and pepper. Stir in the rosemary, thyme, bay and cardamom pods, then pour over 200ml wate",timer:300},{title:"Season",body:"After 25-30 mins, the celeriac should be soft and most of the water will have evaporated. Drain away any remaining water, then remove the herb sprigs, bay and cardamom pods. Lightly crush with a potato masher, then finish with a glug of olive oil and season to taste. Spoon the be",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/5032/beef-bourguignon"},
  {id:52812,photo:"https://www.themealdb.com/images/media/meals/ursuup1487348423.jpg",name:"Beef Brisket Pot Roast",emoji:"",xp:110,difficulty:"Hard",time:"3 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:569,protein:34,carbs:39,fat:27,fiber:2},done:false,ingredients:["4-5 pound Beef Brisket","Dash Salt","3 Onion","5 cloves Garlic","1 Sprig Thyme","1 sprig Rosemary","4 Bay Leaves","2 cups beef stock","3 Large Carrots","1 Tbsp Mustard","4 Mashed Potatoes"],steps:[{title:"Prep",body:"Prepare the brisket for cooking: On one side of the brisket there should be a layer of fat, which you want. If there are any large chunks of fat, cut them off and discard them. Large pieces of fat will not be able to render out completely.. Using a sharp knife, score the fat in p",timer:1800},{title:"Preheat",body:"Sear the brisket: You'll need an oven-proof, thick-bottomed pot with a cover, or Dutch oven, that is just wide enough to hold the brisket roast with a little room for the onions.. Pat the brisket dry and place it, fatty side down, into the pot and place it on medium high heat. Co",timer:480},{title:"Preheat",body:"Sauté the onions and garlic: When the brisket has browned, remove it from the pot and set aside. There should be a couple tablespoons of fat rendered in the pot, if not, add some olive oil.. Add the chopped onions and increase the heat to high. Sprinkle a little salt on the onion",timer:480},{title:"Cook",body:"Move the onions and garlic to the sides of the pot and nestle the brisket inside. Add the beef stock and the tied-up herbs. Bring the stock to a boil on the stovetop.. Cover the pot, place the pot in the 300°F oven and cook for 3 hours. Carefully flip the brisket every hour so it",timer:10800},{title:"Preheat",body:"Remove brisket to cutting board, tent with foil: When the brisket is falling-apart tender, take the pot out of the oven and remove the brisket to a cutting board. Cover it with foil. Pull out and discard the herbs.. 7 Make sauce (optional): At this point you have two options. You",timer:0},{title:"Prep",body:"Slice the meat across the grain: Notice the lines of the muscle fibers of the roast. This is the \"grain\" of the meat. Slice the meat perpendicular to these lines, or across the grain (cutting this way further tenderizes the meat), in 1/4-inch to 1/2-inch slices.. Serve with the",timer:0}],tip:"Original recipe: http://www.simplyrecipes.com/recipes/beef_brisket_pot_roast/"},
  {id:53070,photo:"https://www.themealdb.com/images/media/meals/41cxjh1683207682.jpg",name:"Beef Caldereta",emoji:"",xp:104,difficulty:"Hard",time:"30 min",category:"Asian",diets:["Gluten-free"],macros:{calories:424,protein:23,carbs:54,fat:16,fiber:3},done:false,ingredients:["2kg cut cubes Beef","1 Beef Stock","1 tbs Soy Sauce","2 cups Water","1 sliced Green Pepper","1 sliced Red Pepper","1 sliced Potatoes","1 sliced Carrots","8 ounces Tomato Puree","3  tablespoons Peanut Butter","5 Chilli Powder","1 chopped Onion","5 cloves Garlic","3 tbs Olive Oil"],steps:[{title:"Preheat",body:"Heat oil in a cooking pot. Saute onion and garlic until onion softens.",timer:0},{title:"Cook",body:"Add beef. Saute until the outer part turns light brown.",timer:0},{title:"Simmer",body:"Add soy sauce. Pour tomato sauce and water. Let boil.",timer:0},{title:"Cook",body:"Add Knorr Beef Cube. Cover the pressure cooker. Cook for 30 minutes.",timer:1800},{title:"Cook",body:"Pan-fry carrot and potato until it browns. Set aside.",timer:0},{title:"Mix",body:"Add chili pepper, liver spread and peanut butter. Stir.",timer:0},{title:"Cook",body:"Add bell peppers, fried potato and carrot. Cover the pot. Continue cooking for 5 to 7 minutes.",timer:300},{title:"Season",body:"Season with salt and ground black pepper. Serve.",timer:0}],tip:"Original recipe: https://www.kawalingpinoy.com/beef-caldereta/"},
  {id:52873,photo:"https://www.themealdb.com/images/media/meals/uyqrrv1511553350.jpg",name:"Beef Dumpling Stew",emoji:"",xp:110,difficulty:"Hard",time:"3 min",category:"Comfort",diets:["No restrictions"],macros:{calories:574,protein:30,carbs:28,fat:28,fiber:4},done:false,ingredients:["2 tbs Olive Oil","25g Butter","750g Beef","2 tblsp Plain Flour","2 cloves minced Garlic","175g Onions","150g Celery","150g Carrots","2 chopped Leek","200g Swede","150ml Red Wine","500g Beef Stock","2 Bay Leaf","3 tbs Thyme","3 tblsp chopped Parsley","125g Plain Flour","1 tsp Baking Powder","60g Suet","Splash Water"],steps:[{title:"Preheat",body:"Preheat the oven to 180C/350F/Gas 4.. For the beef stew, heat the oil and butter in an ovenproof casserole and fry the beef until browned on all sides.",timer:0},{title:"Cook",body:"Sprinkle over the flour and cook for a further 2-3 minutes.. Add the garlic and all the vegetables and fry for 1-2 minutes.",timer:180},{title:"Mix",body:"Stir in the wine, stock and herbs, then add the Worcestershire sauce and balsamic vinegar, to taste. Season with salt and freshly ground black pepper.. Cover with a lid, transfer to the oven and cook for about two hours, or until the meat is tender.",timer:0},{title:"Season",body:"For the dumplings, sift the flour, baking powder and salt into a bowl.. Add the suet and enough water to form a thick dough.",timer:0},{title:"Cook",body:"With floured hands, roll spoonfuls of the dough into small balls.. After two hours, remove the lid from the stew and place the balls on top of the stew. Cover, return to the oven and cook for a further 20 minutes, or until the dumplings have swollen and are tender. (If you prefer",timer:1200},{title:"Prep",body:"To serve, place a spoonful of mashed potato onto each of four serving plates and top with the stew and dumplings. Sprinkle with chopped parsley.",timer:0}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/beefstewwithdumpling_87333"},
  {id:53317,photo:"https://www.themealdb.com/images/media/meals/dxpc7j1764370714.jpg",name:"Beef Empanadas",emoji:"",xp:106,difficulty:"Hard",time:"25 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:574,protein:27,carbs:30,fat:25,fiber:3},done:false,ingredients:["60g Lard","340g Water","1 tsp Salt","600g All purpose flour","3 Tomato","1 clove Garlic","1 large Red Onions","Bunch Spring Onions","750g Sirloin steak","1 tablespoon Dried Oregano","1 tsp Paprika","1 tsp Red Pepper Flakes","1 tsp Parsley","To taste Salt","To taste Pepper","3 Egg","Splash Egg Wash","Drizzle Chimichurri sauce"],steps:[{title:"Preheat",body:"For the dough place lard, warm water and salt in a large kneading bowl and stir. Add flour and oregano and either knead five miutes by hand or with the kneading function of your machine. Let rest covered for at least half an hour or overnight in the fridge.",timer:0},{title:"Preheat",body:"For the filling place tomatoes for about 30 seconds in boiling water, then cool with cold water and peel of skin and cut into cubes. Press garlic through garlic press, cut onions into cubes. Simmer garlic and onions in some olive oil until translucent. Take out onions and garlic ",timer:0},{title:"Prep",body:"Cut dough into half and roll out one half thinnly on floured surface. Cut out circles about 12-15cm in diameter. Mine have a diameter of 12.5 cm. Place about 2-4 teaspoons of filling on one circle, put a bit of water all around the edges and fold over the other half so that you g",timer:0},{title:"Preheat",body:"Meanwhile preheat oven to 200 degrees Celsius. Brush empanadas with egg wash and bake about 8 empanadas on a baking sheet lined with parchment paper for about 25min or until golden. Serve warm with chimichurri sauce.",timer:1500}],tip:"Original recipe: https://jennyisbaking.com/2019/10/25/traditionelle-uruguayische-empanadas/#recipe"},
  {id:52952,photo:"https://www.themealdb.com/images/media/meals/1529444830.jpg",name:"Beef Lo Mein",emoji:"",xp:141,difficulty:"Hard",time:"1 hr 30 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:415,protein:26,carbs:55,fat:19,fiber:2},done:false,ingredients:["1/2 lb Beef","pinch Salt","pinch Pepper","2 tsp Sesame Seed Oil","1/2 Egg","3 tbs Starch","5 tbs Oil","1/4 lb Noodles","1/2 cup Onion","1 tsp Minced Garlic","1 tsp Ginger","1 cup Bean Sprouts","1 cup Mushrooms","1 cup Water","1 tbs Oyster Sauce","1 tsp Sugar","1 tsp Soy Sauce"],steps:[{title:"Mix",body:"STEP 1 - MARINATING THE BEEF. In a bowl, add the beef, salt, 1 pinch white pepper, 1 Teaspoon sesame seed oil, 1/2 egg, corn starch,1 Tablespoon of oil and mix together.",timer:0},{title:"Preheat",body:"STEP 2 - BOILING THE THE NOODLES. In a 6 qt pot add your noodles to boiling water until the noodles are submerged and boil on high heat for 10 seconds. After your noodles is done boiling strain and cool with cold water.",timer:0},{title:"Preheat",body:"Add 2 Tablespoons of oil, beef and cook on high heat untill beef is medium cooked.. Set the cooked beef aside.",timer:0},{title:"Season",body:"In a wok add 2 Tablespoon of oil, onions, minced garlic, minced ginger, bean sprouts, mushrooms, peapods and 1.5 cups of water or until the vegetables are submerged in water.. Add the noodles to wok.",timer:0},{title:"Mix",body:"To make the sauce, add oyster sauce, 1 pinch white pepper, 1 teaspoon sesame seed oil, sugar, and 1 Teaspoon of soy sauce.. Next add the beef to wok and stir-fry.",timer:0}],tip:"Original recipe: https://sueandgambo.com/pages/beef-lo-mein"},
  {id:53359,photo:"https://www.themealdb.com/images/media/meals/1nalo51765188375.jpg",name:"Beef Mandi",emoji:"",xp:115,difficulty:"Hard",time:"2 hrs",category:"Indian",diets:["Gluten-free","Dairy-free"],macros:{calories:436,protein:13,carbs:50,fat:20,fiber:7},done:false,ingredients:["1 kg Basmati Rice","5 Cups Beef Stock","2 medium Onion","5 chopped cloves Garlic","2 Green Chilli","1 small Tomato","2 1/2 Tsp Salt","3  tablespoons Oil","1 ½ tsp Turmeric Powder","1/2 tsp Cardamom","1/2 tsp Cloves","1/2 tsp Bay Leaf"],steps:[{title:"Preheat",body:"Wash the beef and cut into large pieces. Season lightly with salt and turmeric.. 2. Heat ghee/oil in a large pot. Add sliced onions and sauté until light golden.",timer:0},{title:"Mix",body:"Add garlic, green chilies, and tomato; cook until softened.. 4. Add the mandi spice mix: coriander, cumin, black pepper, cinnamon, cardamom, cloves, and bay leaves.",timer:0},{title:"Preheat",body:"Add beef pieces and stir on medium heat until the meat is well coated with spices.. 6. Pour in water or beef stock. Cover and simmer until beef is tender (about 1.5–2 hours depending on cut).",timer:7200},{title:"Season",body:"Remove beef carefully and set aside. Strain and measure the broth.. 8. Add washed, soaked basmati rice to the broth (usually 1 cup rice = 1.5–2 cups liquid). Adjust seasoning and bring to a boil.",timer:0},{title:"Preheat",body:"Lower heat, cover, and cook the rice until fluffy.. 10. Place the beef pieces over the rice and steam on low heat for 10 minutes so flavors combine.",timer:600},{title:"Serve",body:"Optional: For smoky flavor, place a small hot charcoal on foil in the pot, add 1 tsp butter/oil, immediately cover for 5 minutes. Remove coal before serving.. 12. Fluff rice and serve beef mandi with salad or chutney.",timer:300}],tip:"A classic Indian dish."},
  {id:53068,photo:"https://www.themealdb.com/images/media/meals/cgl60b1683206581.jpg",name:"Beef Mechado",emoji:"",xp:104,difficulty:"Hard",time:"1 hr",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:435,protein:24,carbs:48,fat:17,fiber:3},done:false,ingredients:["3 cloves Garlic","1 sliced Onion","2 Lbs Beef","8 ounces Tomato Puree","1 cup Water","3 tbs Olive Oil","1 Slice Lemon","1 large Potatoes","1/4 cup Soy Sauce","1/2 tsp Black Pepper","2 Bay Leaves","To taste Salt"],steps:[{title:"Mix",body:"Make the beef tenderloin marinade by combining soy sauce, vinegar, ginger, garlic, sesame oil, olive oil, sugar, salt, and ground black pepper in a large bowl. Mix well.",timer:0},{title:"Cook",body:"Add the cubed beef tenderloin to the bowl with the beef tenderloin marinade. Gently toss to coat the beef. Let it stay for 1 hour.",timer:3600},{title:"Rest",body:"Using a metal or bamboo skewer, assemble the beef kebob by skewering the vegetables and marinated beef tenderloin.",timer:0},{title:"Preheat",body:"Heat-up the grill and start grilling the beef kebobs for 3 minutes per side. This will give you a medium beef that is juicy and tender on the inside. Add more time if you want your beef well done, but it will be less tender.",timer:180},{title:"Serve",body:"Transfer to a serving plate. Serve with Saffron rice.",timer:0}],tip:"Original recipe: https://panlasangpinoy.com/filipino-pinoy-food-tomato-sauce-beef-mechado-recipe/"},
  {id:53238,photo:"https://www.themealdb.com/images/media/meals/pbzcrx1763765096.jpg",name:"Beef pho",emoji:"",xp:123,difficulty:"Hard",time:"5 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:435,protein:24,carbs:44,fat:20,fiber:4},done:false,ingredients:["1 L Beef Stock","1 large Onion","1 Large Chopped Ginger","1 Cinnamon Stick","2 Star Anise","1 tsp Coriander Seeds","1/2 teaspoon Cloves","225g Sirloin steak","1 tsp Palm Sugar","1 tablespoon Fish Sauce","1 ½ tbsp Soy Sauce","200g Rice Noodles","2 sliced Spring Onions","1 small Birds-eye Chillies","Handful Basil","Handful Coriander","1 Lime"],steps:[{title:"Preheat",body:"Tip the beef stock along with 500ml of water into a large saucepan. Sit the onion and ginger in a frying pan over a high heat and char on all sides, around 3-5 mins (you can also do this under your grill). Once charred, add to the beef stock. In the same pan, toast the spices for",timer:300},{title:"Prep",body:"Meanwhile, cut the fat from the steak and wrap in cling film, then put into the freezer for 15 mins – this will make your steak really easy to slice! Slice it thinly, then cover with cling film again and pop into the fridge.",timer:900},{title:"Preheat",body:"Taste the beef stock and use the palm sugar, fish sauce and soy to season. Cook the noodles according to package instructions and split between two bowls, topping each with the sliced beef. Bring the stock to the boil and then pour into the bowls (the heat will cook the beef). To",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/beef-pho"},
  {id:53053,photo:"https://www.themealdb.com/images/media/meals/bc8v651619789840.jpg",name:"Beef Rendang",emoji:"",xp:105,difficulty:"Hard",time:"2 hrs",category:"Asian",diets:["Gluten-free"],macros:{calories:428,protein:27,carbs:43,fat:12,fiber:4},done:false,ingredients:["1lb Beef","5 tbs Vegetable Oil","1 Cinnamon Stick","3 Cloves","3 Star Anise","3 Cardamom","1 cup Coconut Cream","1 cup Water","2 tbs Tamarind Paste","6 Lime","1 tbs Sugar","5 Challots"],steps:[{title:"Prep",body:"Chop the spice paste ingredients and then blend it in a food processor until fine.",timer:0},{title:"Preheat",body:"Heat the oil in a stew pot, add the spice paste, cinnamon, cloves, star anise, and cardamom and stir-fry until aromatic. Add the beef and the pounded lemongrass and stir for 1 minute. Add the coconut milk, tamarind juice, water, and simmer on medium heat, stirring frequently unti",timer:60},{title:"Preheat",body:"Lower the heat to low, cover the lid, and simmer for 1 to 1 1/2 hours or until the meat is really tender and the gravy has dried up. Add more salt and sugar to taste. Serve immediately with steamed rice and save some for overnight.",timer:7200}],tip:"Original recipe: https://rasamalaysia.com/beef-rendang-recipe-rendang-daging/"},
  {id:52834,photo:"https://www.themealdb.com/images/media/meals/svprys1511176755.jpg",name:"Beef stroganoff",emoji:"",xp:142,difficulty:"Hard",time:"15 min",category:"Comfort",diets:["No restrictions"],macros:{calories:540,protein:32,carbs:33,fat:31,fiber:4},done:false,ingredients:["1 tbls Olive Oil","1 Onions","1 clove Garlic","1 tbsp Butter","250g Mushrooms","500g Beef Fillet","1tbsp Plain Flour","150g Creme Fraiche","1 tbsp English Mustard","100ml Beef Stock","Topping Parsley"],steps:[{title:"Preheat",body:"Heat the olive oil in a non-stick frying pan then add the sliced onion and cook on a medium heat until completely softened, so around 15 mins, adding a little splash of water if they start to stick at all. Crush in the garlic and cook for a 2-3 mins further, then add the butter. ",timer:900},{title:"Preheat",body:"Tip the flour into a bowl with a big pinch of salt and pepper, then toss the steak in the seasoned flour. Add the steak pieces to the pan, splashing in a little oil if the pan looks particularly dry, and fry for 3-4 mins, until well coloured. Tip the onions and mushrooms back int",timer:240}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/beef-stroganoff"},
  {id:52824,photo:"https://www.themealdb.com/images/media/meals/ssrrrs1503664277.jpg",name:"Beef Sunday Roast",emoji:"",xp:96,difficulty:"Medium",time:"45 min",category:"Comfort",diets:["No restrictions"],macros:{calories:562,protein:36,carbs:29,fat:27,fiber:3},done:false,ingredients:["8 slices Beef","12 florets Broccoli","1 Packet Potatoes","1 Packet Carrots","140g plain flour","4 Eggs","200ml milk","drizzle (for cooking) sunflower oil"],steps:[{title:"Cook",body:"Cook the Broccoli and Carrots in a pan of boiling water until tender.",timer:0},{title:"Cook",body:"Roast the Beef and Potatoes in the oven for 45mins, the potatoes may need to be checked regularly to not overcook.",timer:2700},{title:"Mix",body:"To make the Yorkshire puddings:.",timer:0},{title:"Preheat",body:"Heat oven to 230C/fan 210C/gas 8. Drizzle a little sunflower oil evenly into 2 x 4-hole Yorkshire pudding tins or a 12-hole non-stick muffin tin and place in the oven to heat through.",timer:0},{title:"Mix",body:"To make the batter, tip 140g plain flour into a bowl and beat in four eggs until smooth. Gradually add 200ml milk and carry on beating until the mix is completely lump-free. Season with salt and pepper. Pour the batter into a jug, then remove the hot tins from the oven. Carefully",timer:1500},{title:"Serve",body:"Plate up and add the Gravy as desired.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/9020/best-yorkshire-puddings"},
  {id:52803,photo:"https://www.themealdb.com/images/media/meals/vvpprx1487325699.jpg",name:"Beef Wellington",emoji:"",xp:104,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:558,protein:32,carbs:40,fat:25,fiber:2},done:false,ingredients:["400g mushrooms","1-2tbsp English Mustard","Dash Olive Oil","750g piece Beef Fillet","6-8 slices Parma ham","500g Puff Pastry","Dusting Flour","2 Beaten Egg Yolks"],steps:[{title:"Preheat",body:"Put the mushrooms into a food processor with some seasoning and pulse to a rough paste. Scrape the paste into a pan and cook over a high heat for about 10 mins, tossing frequently, to cook out the moisture from the mushrooms. Spread out on a plate to cool.",timer:600},{title:"Preheat",body:"Heat in a frying pan and add a little olive oil. Season the beef and sear in the hot pan for 30 secs only on each side. (You don't want to cook it at this stage, just colour it). Remove the beef from the pan and leave to cool, then brush all over with the mustard.",timer:0},{title:"Prep",body:"Lay a sheet of cling film on a work surface and arrange the Parma ham slices on it, in slightly overlapping rows. With a palette knife, spread the mushroom paste over the ham, then place the seared beef fillet in the middle. Keeping a tight hold of the cling film from the edge, n",timer:1200},{title:"Prep",body:"Roll out the puff pastry on a floured surface to a large rectangle, the thickness of a £1 coin. Remove the cling film from the beef, then lay in the centre. Brush the surrounding pastry with egg yolk. Fold the ends over, the wrap the pastry around the beef, cutting off any excess",timer:900},{title:"Preheat",body:"Heat the oven to 200C, 400F, gas 6.",timer:0},{title:"Cook",body:"Lightly score the pastry at 1cm intervals and glaze again with beaten egg yolk. Bake for 20 minutes, then lower the oven setting to 180C, 350F, gas 4 and cook for another 15 mins. Allow to rest for 10-15 mins before slicing and serving with the side dishes of your choice. The bee",timer:1200}],tip:"Original recipe: http://www.goodtoknow.co.uk/recipes/164868/Gordon-Ramsay-s-beef-Wellington"},
  {id:53013,photo:"https://www.themealdb.com/images/media/meals/urzj1d1587670726.jpg",name:"Big Mac",emoji:"",xp:115,difficulty:"Hard",time:"2 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:542,protein:35,carbs:31,fat:25,fiber:5},done:false,ingredients:["400g Minced Beef","2 tbs Olive Oil","2 Sesame Seed Burger Buns","Chopped Onion","1/4 Iceberg Lettuce","2 sliced Cheese","2 large Dill Pickles","1 cup Mayonnaise","2 tsp White Wine Vinegar","Pinch Pepper","2 tsp Mustard","1 1/2 tsp Onion Salt","1 1/2 tsp Garlic Powder","1/2 tsp Paprika"],steps:[{title:"Mix",body:"For the Big Mac sauce, combine all the ingredients in a bowl, season with salt and chill until ready to use.",timer:0},{title:"Preheat",body:"To make the patties, season the mince with salt and pepper and form into 4 balls using about 1/3 cup mince each. Place each onto a square of baking paper and flatten to form into four x 15cm circles. Heat oil in a large frypan over high heat. In 2 batches, cook beef patties for 1",timer:120},{title:"Prep",body:"Carefully slice each burger bun into three acrossways, then lightly toast.",timer:0},{title:"Prep",body:"To assemble the burgers, spread a little Big Mac sauce over the bottom base. Top with some chopped onion, shredded lettuce, slice of cheese, beef patty and some pickle slices. Top with the middle bun layer, and spread with more Big Mac sauce, onion, lettuce, pickles, beef patty a",timer:0},{title:"Add",body:"After waiting half an hour for your food to settle, go for a jog.",timer:0}],tip:"Original recipe: https://www.delicious.com.au/recipes/finally-recipe-worlds-top-selling-burger-big-mac/5221ee4a-279e-4a0b-8629-f442dc46822e"},
  {id:53300,photo:"https://www.themealdb.com/images/media/meals/fl4brj1764361323.jpg",name:"Bigos (Polish hunter's stew)",emoji:"",xp:118,difficulty:"Hard",time:"50 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:578,protein:36,carbs:41,fat:31,fiber:5},done:false,ingredients:["1 sliced White Cabbage","250ml Beef Stock","100g Mushrooms","2 tablespoons Lard","400g German Sausages","250g Bacon","2 chopped Onion","750g Beef","200g Prunes","1 Bay Leaf","2 Cloves","12 Peppercorns","4 Juniper Berries","4 Allspice Berries","90 ml Red Wine","2 tablespoons Tomato Puree"],steps:[{title:"Preheat",body:"Put the cabbage in a heavy casserole dish, add the stock and cook over a low heat for about 50 mins, until tender.",timer:3000},{title:"Preheat",body:"Cut the soaked mushrooms into strips and save the soaking water. Heat the lard and fry the sausages and bacon, then scoop out, leaving the fat in the pan. Fry the onion in the same pan for 5-8 mins until lightly browned.",timer:480},{title:"Preheat",body:"Add the mushrooms and their liquid along with all the cooked meat, onions and prunes, then cover and cook for 20 mins. Add the spices, red wine and tomato purée and bring to a simmer, then cover and cook for 1 hr. Season well and leave to cool. Will keep covered and chilled for u",timer:1200}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/bigos"},
  {id:53085,photo:"https://www.themealdb.com/images/media/meals/vdwloy1713225718.jpg",name:"15-minute chicken & halloumi burgers",emoji:"",xp:131,difficulty:"Hard",time:"4 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:554,protein:30,carbs:35,fat:28,fiber:2},done:false,ingredients:["2 Chicken Breasts","1 tbsp Oil","4 tbsp Hotsauce","½ Lemon Juice","2 Buns","250g Cheese","¼ Cabbage","2 tbsp Mayonnaise","4 tbsp Sour Cream","4 leaves Lettuce","2 Red Pepper"],steps:[{title:"Prep",body:"Put the chicken breasts between two pieces of baking parchment and use a rolling pin to gently bash them until they are approximately 1cm thick. Cut each chicken breast into two even pieces.",timer:0},{title:"Preheat",body:"If you're using a frying pan, heat two frying pans over medium-high heat, with one of them containing oil. Fry the chicken in the oiled pan for 3-4 mins on each side until they are cooked through. Season the chicken, reduce the heat, drizzle in the chilli sauce and half of the le",timer:240},{title:"Preheat",body:"If you're using an air-fryer, preheat it to 180C for 4 mins. Add the chicken to the air-fryer and cook for 12 mins. Drizzle over the chilli sauce and half the lemon juice and cook for an additional 1-2 mins until the chicken is cooked through and the sauce is reduced. Remove the ",timer:240},{title:"Preheat",body:"While the chicken is cooking, toast the buns in the dry frying pan for 30 seconds. Transfer them to a plate. If you're using an air fryer, put the buns in the air fryer for 1-2 mins until they are warm. Increase the air fryer temperature to 200C. Add the halloumi to the air fryer",timer:120},{title:"Season",body:"Spoon the hummus (or dip of your choice) into the toasted buns, then top with the rocket, chilli chicken, halloumi, and peppers. Drizzle with a little more chilli sauce, spoon over the cabbage, season with black pepper, and top with the bun lids. Serve with any extra cabbage on t",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/15-minute-chicken-halloumi-burgers"},
  {id:53050,photo:"https://www.themealdb.com/images/media/meals/020z181619788503.jpg",name:"Ayam Percik",emoji:"",xp:129,difficulty:"Hard",time:"10 min",category:"Asian",diets:["Gluten-free"],macros:{calories:437,protein:24,carbs:39,fat:12,fiber:3},done:false,ingredients:["6 Chicken Thighs","16 Challots","1 1/2 Ginger","6 Garlic Clove","8 Cayenne Pepper","2 tbs Turmeric","1 1/2 Cumin","1 1/2 Coriander","1 1/2 Fennel","2 tbs Tamarind Paste","1 can Coconut Milk","1 tsp Sugar","1 cup Water"],steps:[{title:"Prepare",body:"In a blender, add the ingredients for the spice paste and blend until smooth.",timer:0},{title:"Preheat",body:"Over medium heat, pour the spice paste in a skillet or pan and fry for 10 minutes until fragrant. Add water or oil 1 tablespoon at a time if the paste becomes too dry. Don't burn the paste. Lower the fire slightly if needed.",timer:600},{title:"Preheat",body:"Add the cloves, cardamom, tamarind pulp, coconut milk, water, sugar and salt. Turn the heat up and bring the mixture to boil. Turn the heat to medium low and simmer for 10 minutes. Stir occasionally. It will reduce slightly. This is the marinade/sauce, so taste and adjust seasoni",timer:600},{title:"Rest",body:"When the marinade/sauce has cooled, pour everything over the chicken and marinate overnight to two days.",timer:0},{title:"Preheat",body:"Preheat the oven to 425 F.",timer:0},{title:"Cook",body:"Remove the chicken from the marinade. Spoon the marinade onto a greased (or aluminum lined) baking sheet. Lay the chicken on top of the sauce (make sure the chicken covers the sauce and the sauce isn't exposed or it'll burn) and spread the remaining marinade on the chicken. Roast",timer:2700},{title:"Serve",body:"Let chicken rest for 5 minutes. Brush the chicken with some of the oil. Serve chicken with the sauce over steamed rice (or coconut rice).",timer:300}],tip:"Original recipe: http://www.curiousnut.com/roasted-spiced-chicken-ayam-percik/"},
  {id:52940,photo:"https://www.themealdb.com/images/media/meals/sypxpx1515365095.jpg",name:"Brown Stew Chicken",emoji:"",xp:145,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:554,protein:34,carbs:42,fat:26,fiber:1},done:false,ingredients:["1 whole Chicken","1 chopped Tomato","2 chopped Onions","2 chopped Garlic Clove","1 chopped Red Pepper","1 chopped Carrots","1 Lime","2 tsp Thyme","1 tsp Allspice","2 tbs Soy Sauce","2 tsp Cornstarch","2 cups Coconut Milk","1 tbs Vegetable Oil"],steps:[{title:"Prepare",body:"Squeeze lime over chicken and rub well. Drain off excess lime juice.",timer:0},{title:"Mix",body:"Combine tomato, scallion, onion, garlic, pepper, thyme, pimento and soy sauce in a large bowl with the chicken pieces. Cover and marinate at least one hour.",timer:0},{title:"Preheat",body:"Heat oil in a dutch pot or large saucepan. Shake off the seasonings as you remove each piece of chicken from the marinade. Reserve the marinade for sauce.",timer:0},{title:"Cook",body:"Lightly brown the chicken a few pieces at a time in very hot oil. Place browned chicken pieces on a plate to rest while you brown the remaining pieces.",timer:0},{title:"Preheat",body:"Drain off excess oil and return the chicken to the pan. Pour the marinade over the chicken and add the carrots. Stir and cook over medium heat for 10 minutes.",timer:600},{title:"Preheat",body:"Mix flour and coconut milk and add to stew, stirring constantly. Turn heat down to minimum and cook another 20 minutes or until tender.",timer:1200}],tip:"Original recipe: http://www.geniuskitchen.com/recipe/authentic-jamaican-brown-stew-chicken-347996"},
  {id:53016,photo:"https://www.themealdb.com/images/media/meals/sbx7n71587673021.jpg",name:"Chick-Fil-A Sandwich",emoji:"",xp:142,difficulty:"Hard",time:"30 min",category:"Comfort",diets:["No restrictions"],macros:{calories:549,protein:31,carbs:47,fat:32,fiber:3},done:false,ingredients:["1 Chicken Breast","1/4 cup Pickle Juice","1 Egg","1/4 cup Milk","1/2 cup Flour","1 tbs Icing Sugar","1/2 tsp Paprika","1/2 tsp Salt","1/4 tsp Black Pepper","1/4 tsp Garlic Powder","1/4 tsp Celery Salt","1/2 tsp Cayenne Pepper","1 cup Olive Oil","1 Sesame Seed Burger Buns"],steps:[{title:"Prep",body:"Wrap the chicken loosely between plastic wrap and pound gently with the flat side of a meat tenderizer until about 1/2 inch thick all around.. Cut into two pieces, as even as possible.",timer:0},{title:"Rest",body:"Marinate in the pickle juice for 30 minutes to one hour (add a teaspoon of Tabasco sauce now for a spicy sandwich).. Beat the egg with the milk in a bowl.",timer:1800},{title:"Mix",body:"Combine the flour, sugar, and spices in another bowl.. Dip the chicken pieces each into the egg on both sides, then coat in flour on both sides.",timer:0},{title:"Preheat",body:"Heat the oil in a skillet (1/2 inch deep) to about 345-350.. Fry each cutlet for 2 minutes on each side, or until golden and cooked through.",timer:120},{title:"Prep",body:"Blot on paper and serve on toasted buns with pickle slices.",timer:0}],tip:"Original recipe: https://hilahcooking.com/chick-fil-a-copycat/"},
  {id:53161,photo:"https://www.themealdb.com/images/media/meals/fk80jp1763280767.jpg",name:"Chicken & chorizo rice pot",emoji:"",xp:122,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:570,protein:30,carbs:36,fat:23,fiber:6},done:false,ingredients:["1 tblsp Oil","1 whole Chicken","1 Large Chopped Onion","1 chopped Red Pepper","3 Cloves Crushed Garlic","225g Chorizo","1 tblsp Tomato Puree","1 tablespoon chopped Thyme","150ml White Wine","800ml Chicken Stock","400g Rice","2 tbs chopped Parsley"],steps:[{title:"Preheat",body:"Heat the oil in a large flameproof casserole dish and brown the chicken pieces on all sides – you may have to do this in batches. Remove from the dish and put to one side.",timer:0},{title:"Preheat",body:"Lower the heat, add the onion and pepper, and gently cook for 10 mins until softened. Add the garlic and chorizo, and cook for a further 2 mins until the chorizo has released some of its oils into the dish. Stir in the tomato purée and cook for 1 min more.",timer:600},{title:"Preheat",body:"Return the chicken pieces to the dish along with the thyme, white wine and stock. Bring the liquid to a boil, cover the dish with a tight-fitting lid and lower the heat. Cook for 30 mins.",timer:1800},{title:"Preheat",body:"Tip in the rice and stir everything together. Cover, set over a low heat and cook for a further 15 mins, or until the rice is cooked and has absorbed most of the cooking liquid. Remove from the heat and leave the dish to sit for 10 mins to absorb any remaining liquid. Season to t",timer:900}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chicken-chorizo-rice-pot"},
  {id:52846,photo:"https://www.themealdb.com/images/media/meals/uuuspp1511297945.jpg",name:"Chicken & mushroom Hotpot",emoji:"",xp:149,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["No restrictions"],macros:{calories:575,protein:29,carbs:30,fat:25,fiber:5},done:false,ingredients:["50g Butter","1 chopped Onion","100g Mushrooms","40g Plain Flour","1 Chicken Stock Cube","pinch Nutmeg","pinch Mustard Powder","250g Chicken","2 Handfuls Sweetcorn","2 large Potatoes","1 knob Butter"],steps:[{title:"Preheat",body:"Heat oven to 200C/180C fan/gas 6. Put the butter in a medium-size saucepan and place over a medium heat. Add the onion and leave to cook for 5 mins, stirring occasionally. Add the mushrooms to the saucepan with the onions.",timer:300},{title:"Preheat",body:"Once the onion and mushrooms are almost cooked, stir in the flour – this will make a thick paste called a roux. If you are using a stock cube, crumble the cube into the roux now and stir well. Put the roux over a low heat and stir continuously for 2 mins – this will cook the flou",timer:120},{title:"Preheat",body:"Take the roux off the heat. Slowly add the fresh stock, if using, or pour in 500ml water if you’ve used a stock cube, stirring all the time. Once all the liquid has been added, season with pepper, a pinch of nutmeg and mustard powder. Put the saucepan back onto a medium heat and ",timer:0},{title:"Season",body:"Carefully lay the potatoes on top of the hot-pot filling, overlapping them slightly, almost like a pie top.",timer:0},{title:"Cook",body:"Brush the potatoes with a little melted butter and cook in the oven for about 35 mins. The hot-pot is ready once the potatoes are cooked and golden brown.",timer:2100}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chicken-mushroom-hot-pot"},
  {id:52796,photo:"https://www.themealdb.com/images/media/meals/syqypv1486981727.jpg",name:"Chicken Alfredo Primavera",emoji:"",xp:116,difficulty:"Hard",time:"7 min",category:"Italian",diets:["No restrictions"],macros:{calories:539,protein:16,carbs:61,fat:26,fiber:5},done:false,ingredients:["2 tablespoons Butter","3 tablespoons Olive Oil","5 boneless Chicken","1 teaspoon Salt","1 cut into 1/2-inch cubes Squash","1 Head chopped Broccoli","8-ounce sliced mushrooms","1 red Pepper","1 chopped onion","3 cloves garlic","1/2 teaspoon red pepper flakes","1/2 cup white wine","1/2 cup milk","1/2 cup heavy cream","1 cup grated Parmesan cheese","16 ounces bowtie pasta","pinch Salt","pinch Pepper","chopped Parsley"],steps:[{title:"Preheat",body:"Heat 1 tablespoon of butter and 2 tablespoons of olive oil in a large skillet over medium-high heat. Season both sides of each chicken breast with seasoned salt and a pinch of pepper. Add the chicken to the skillet and cook for 5-7 minutes on each side, or until cooked through. W",timer:420},{title:"Mix",body:"Season the boiling water with a few generous pinches of kosher salt. Add the pasta and give it a stir. Cook, stirring occasionally, until al dente, about 12 minutes. Reserve 1/2 cup of  pasta water before draining the pasta.",timer:720},{title:"Preheat",body:"Remove the chicken from the pan and transfer it to a cutting board; allow it to rest. Turn the heat down to medium and dd the remaining 1 tablespoon of butter and olive oil to the same pan you used to cook the chicken. Add the veggies (minus the garlic) and red pepper flakes to t",timer:300},{title:"Mix",body:"Add the garlic and a generous pinch of salt and pepper to the pan and cook for 1 minute. Deglaze the pan with the white wine. Continue to cook until the wine has reduced by half, about 3 minutes. Stir in the milk, heavy cream, and reserved pasta water.",timer:60},{title:"Preheat",body:"Bring the mixture to a gentle boil and allow to simmer and reduce for 2-3 minutes. Turn off the heat and add the Parmesan cheese and cooked pasta. Season with salt and pepper to taste. Garnish with Parmesan cheese and chopped parsley, if desired.",timer:180}],tip:"A classic Italian dish."},
  {id:52934,photo:"https://www.themealdb.com/images/media/meals/wruvqv1511880994.jpg",name:"Chicken Basquaise",emoji:"",xp:154,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:572,protein:27,carbs:32,fat:27,fiber:5},done:false,ingredients:["1.5kg Chicken","25g Butter","6 tblsp Olive Oil","2 sliced Red Onions","3 Large Red Pepper","130g Chorizo","8 Sun-Dried Tomatoes","6 cloves sliced Garlic","300g Basmati Rice","drizzle Tomato Puree","½ tsp Paprika","4 Bay Leaves","Handful Thyme","350ml Chicken Stock","180g Dry White Wine","2 Lemons","100g Black Olives","to serve Salt","to serve Pepper"],steps:[{title:"Preheat",body:"Preheat the oven to 180°C/Gas mark 4. Have the chicken joints ready to cook. Heat the butter and 3 tbsp olive oil in a flameproof casserole or large frying pan. Brown the chicken pieces in batches on both sides, seasoning them with salt and pepper as you go. Don't crowd the pan -",timer:0},{title:"Preheat",body:"Add a little more olive oil to the casserole and fry the onions over a medium heat for 10 minutes, stirring frequently, until softened but not browned. Add the rest of the oil, then the peppers and cook for another 5 minutes.",timer:600},{title:"Preheat",body:"Add the chorizo, sun-dried tomatoes and garlic and cook for 2-3 minutes. Add the rice, stirring to ensure it is well coated in the oil. Stir in the tomato paste, paprika, bay leaves and chopped thyme. Pour in the stock and wine. When the liquid starts to bubble, turn the heat dow",timer:180},{title:"Cook",body:"Cover and cook in the oven for 50 minutes. The rice should be cooked but still have some bite, and the chicken should have juices that run clear when pierced in the thickest part with a knife. If not, cook for another 5 minutes and check again.",timer:3000}],tip:"Original recipe: https://www.rivercottage.net/recipes/chicken-basquaise"},
  {id:52956,photo:"https://www.themealdb.com/images/media/meals/1529446352.jpg",name:"Chicken Congee",emoji:"",xp:61,difficulty:"Medium",time:"10 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:410,protein:27,carbs:44,fat:19,fiber:2},done:false,ingredients:["8 oz Chicken","pinch Salt","pinch Pepper","1 tsp Ginger Cordial","1 tsp Ginger","1 tbs Spring Onions","1/2 cup Rice","8 cups Water","2 oz Coriander"],steps:[{title:"Mix",body:"STEP 1 - MARINATING THE CHICKEN. In a bowl, add chicken, salt, white pepper, ginger juice and then mix it together well.",timer:0},{title:"Cook",body:"Set the chicken aside.. STEP 2 - RINSE THE WHITE RICE.",timer:0},{title:"Simmer",body:"Rinse the rice in a metal bowl or pot a couple times and then drain the water.. STEP 2 - BOILING THE WHITE RICE.",timer:0},{title:"Preheat",body:"Next add 8 cups of water and then set the stove on high heat until it is boiling. Once rice porridge starts to boil, set the stove on low heat and then stir it once every 8-10 minutes for around 20-25 minutes.. After 25 minutes, this is optional but you can add a little bit more ",timer:600},{title:"Preheat",body:"Next add the marinated chicken to the rice porridge and leave the stove on low heat for another 10 minutes.. After an additional 10 minutes add the green onions, sliced ginger, 1 pinch of salt, 1 pinch of white pepper and stir for 10 seconds.",timer:600},{title:"Serve",body:"Serve the rice porridge in a bowl. Optional: add Coriander on top of the rice porridge.",timer:0}],tip:"Original recipe: https://sueandgambo.com/pages/chicken-congee"},
  {id:52850,photo:"https://www.themealdb.com/images/media/meals/qxytrx1511304021.jpg",name:"Chicken Couscous",emoji:"",xp:61,difficulty:"Medium",time:"2 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:364,protein:14,carbs:24,fat:19,fiber:5},done:false,ingredients:["1 tbsp Olive Oil","1 chopped Onion","200g Chicken Breast","pinch Ginger","2 tblsp Harissa Spice","10 Dried Apricots","220g Chickpeas","200g Couscous","200ml Chicken Stock","Handful Coriander"],steps:[{title:"Preheat",body:"Heat the olive oil in a large frying pan and cook the onion for 1-2 mins just until softened. Add the chicken and fry for 7-10 mins until cooked through and the onions have turned golden. Grate over the ginger, stir through the harissa to coat everything and cook for 1 min more.",timer:120},{title:"Mix",body:"Tip in the apricots, chickpeas and couscous, then pour over the stock and stir once. Cover with a lid or tightly cover the pan with foil and leave for about 5 mins until the couscous has soaked up all the stock and is soft. Fluff up the couscous with a fork and scatter over the c",timer:300}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/13139/onepan-chicken-couscous"},
  {id:52765,photo:"https://www.themealdb.com/images/media/meals/qtuwxu1468233098.jpg",name:"Chicken Enchilada Casserole",emoji:"",xp:61,difficulty:"Medium",time:"20 min",category:"Mexican",diets:["Gluten-free"],macros:{calories:481,protein:21,carbs:59,fat:15,fiber:5},done:false,ingredients:["14 oz jar Enchilada sauce","3 Cups shredded Monterey Jack cheese","6 corn tortillas","2 chicken breasts"],steps:[{title:"Preheat",body:"Cut each chicken breast in about 3 pieces, so that it cooks faster and put it in a small pot. Pour Enchilada sauce over it and cook covered on low to medium heat until chicken is cooked through, about 20 minutes. No water is needed, the chicken will cook in the Enchilada sauce. M",timer:1200},{title:"Cook",body:"Remove chicken from the pot and shred with two forks.",timer:0},{title:"Preheat",body:"Preheat oven to 375 F degrees.",timer:0},{title:"Season",body:"Start layering the casserole. Start with about ¼ cup of the leftover Enchilada sauce over the bottom of a baking dish. I used a longer baking dish, so that I can put 2 corn tortillas across. Place 2 tortillas on the bottom, top with ⅓ of the chicken and ⅓ of the remaining sauce. ",timer:0},{title:"Cook",body:"Bake for 20 to 30 minutes uncovered, until bubbly and cheese has melted and started to brown on top.",timer:1200}],tip:"A classic Mexican dish."},
  {id:52818,photo:"https://www.themealdb.com/images/media/meals/qrqywr1503066605.jpg",name:"Chicken Fajita Mac and Cheese",emoji:"",xp:150,difficulty:"Hard",time:"20 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:568,protein:30,carbs:41,fat:30,fiber:3},done:false,ingredients:["500g macaroni","2 cups chicken stock","1/2 cup heavy cream","1 packet fajita seasoning","1 tsp salt","3 diced chicken breast","2 tbsp olive oil","1 small finely diced onion","2 finely diced red pepper","2 cloves minced garlic","1 cup cheddar cheese","garnish chopped parsley"],steps:[{title:"Cook",body:"Fry your onion, peppers and garlic in olive oil until nicely translucent. Make a well in your veg and add your chicken. Add your seasoning and salt. Allow to colour slightly.",timer:0},{title:"Cook",body:"Add your cream, stock and macaroni.",timer:0},{title:"Mix",body:"Cook on low for 20 minutes. Add your cheeses, stir to combine.",timer:1200},{title:"Cook",body:"Top with roasted peppers and parsley.",timer:0}],tip:"Original recipe: http://twistedfood.co.uk/chicken-fajita-mac-n-cheese/"},
  {id:53367,photo:"https://www.themealdb.com/images/media/meals/wuyd2h1765655837.jpg",name:"Chicken Fried Rice",emoji:"",xp:131,difficulty:"Hard",time:"2 hrs",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:408,protein:20,carbs:39,fat:12,fiber:6},done:false,ingredients:["1 lb Chicken Thighs","1 tsp Salt","3  tablespoons Canola Oil","3 Large Egg","2/3 Cup Onion","2 cloves minced Garlic","2 tsp Ground Ginger","1 large Carrots","2/3 Cup Peas","4 cups Jasmine Rice","2 sliced Scallions","1/2 tsp Chinese five spice powder","2.5 tbsp Soy Sauce","1 tsp Sesame Seed Oil"],steps:[{title:"Cook",body:"Fried rice is best made with leftover rice that's at least a day old. Otherwise it becomes gummy in the skillet.. If you don’t have any leftover rice from the night before, cook a batch of rice and spread it on a large baking sheet or several large plates. Let the rice dry out fo",timer:7200},{title:"Mix",body:"Rice sticks to the pan very easily, so make sure to use a wok or pan that doesn’t have a sticky surface. I usually cook stir-fries in my seasoned carbon steel wok, but cast iron or nonstick pans work well, too. You might need to add a little more oil if things aren’t releasing ea",timer:600},{title:"Preheat",body:"Heat a wok or large sauté pan over medium-high heat. Swirl in a tablespoon of oil and add the whisked eggs. Use a spatula to quickly scramble the eggs, breaking the curds into smaller pieces as they come together. Transfer the eggs to a plate.. Add another tablespoon of oil in th",timer:240},{title:"Preheat",body:"Using your spatula, scrape off any chicken bits that are still stuck to the wok so they don't burn during the next step. You can also use paper towels to wipe down your wok or pan.. Swirl 1 tablespoon of oil into the wok over medium-high heat. Add the diced onions and cook them f",timer:60},{title:"Mix",body:"Add the rice to the wok or pan on top of the vegetables and stir to combine. Using the back of your spatula, smash any large chunks of rice to break them apart. Add the white and green parts of the sliced scallions (save the dark green parts) and five-spice powder. Stir to incorp",timer:60},{title:"Serve",body:"Taste, and add more soy sauce if necessary. Serve immediately.",timer:0}],tip:"Original recipe: https://www.simplyrecipes.com/recipes/chicken_fried_rice/"},
  {id:52875,photo:"https://www.themealdb.com/images/media/meals/xrrtss1511555269.jpg",name:"Chicken Ham and Leek Pie",emoji:"",xp:135,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["No restrictions"],macros:{calories:575,protein:36,carbs:39,fat:26,fiber:3},done:false,ingredients:["450ml Chicken Stock","3 Chicken Breast","75g Butter","2 sliced Leek","2 cloves minced Garlic","50g Plain Flour","200ml Milk","3 tbs White Wine","150ml Double Cream","150g Ham","spinkling Sea Salt","pinch Pepper","350g Plain Flour","200g Butter","1 Free-range Egg, Beaten","1 tbls Cold Water","1 Free-range Egg, Beaten"],steps:[{title:"Preheat",body:"Heat the chicken stock in a lidded saucepan. Add the chicken breast and bring to a low simmer. Cover with a lid and cook for 10 minutes. Remove the chicken breasts from the water with tongs and place on a plate. Pour the cooking liquor into a large jug.. Melt 25g/1oz of the butte",timer:600},{title:"Preheat",body:"Slowly pour the milk into the pan, just a little at a time, stirring well between each adding. Gradually add 250ml/10fl oz of the reserved stock and the wine, if using, stirring until the sauce is smooth and thickened slightly. Bring to a gentle simmer and cook for 3 minutes.. Se",timer:180},{title:"Preheat",body:"Preheat the oven to 200C/400F/Gas 6. Put a baking tray in the oven to heat.. For the pastry, put the flour and butter in a food processor and blend on the pulse setting until the mixture resembles fine breadcrumbs. With the motor running, add the beaten egg and water and blend un",timer:0},{title:"Mix",body:"Roll the remaining pastry out on a lightly floured surface, turning the pastry frequently until around 5mm/¼in thick and 4cm/1½in larger than the pie dish. Lift the pastry over the rolling pin and place it gently into the pie dish. Press the pastry firmly up the sides, making sur",timer:0},{title:"Preheat",body:"Cover the pie with the pastry lid and press the edges together firmly to seal. Trim any excess pastry.. Make a small hole in the centre of the pie with the tip of a knife. Glaze the top of the pie with beaten egg. Bake on the preheated tray in the centre of the oven for 35-40 min",timer:2400}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/creamy_chicken_ham_and_03877"},
  {id:52795,photo:"https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg",name:"Chicken Handi",emoji:"",xp:153,difficulty:"Hard",time:"5 min",category:"Indian",diets:["Gluten-free"],macros:{calories:453,protein:14,carbs:44,fat:20,fiber:9},done:false,ingredients:["1.2 kg Chicken","5 thinly sliced Onion","2 finely chopped Tomatoes","8 cloves chopped Garlic","1 tbsp Ginger paste","¼ cup Vegetable oil","2 tsp Cumin seeds","3 tsp Coriander seeds","1 tsp Turmeric powder","1 tsp Chilli powder","2 Green chilli","1 cup Yogurt","¾ cup Cream","3 tsp Dried fenugreek","1 tsp Garam masala","To taste Salt"],steps:[{title:"Preheat",body:"Take a large pot or wok, big enough to cook all the chicken, and heat the oil in it. Once the oil is hot, add sliced onion and fry them until deep golden brown. Then take them out on a plate and set aside.. To the same pot, add the chopped garlic and sauté for a minute. Then add ",timer:300},{title:"Mix",body:"Then return the fried onion to the pot and stir. Add ginger paste and sauté well.. Now add the cumin seeds, half of the coriander seeds and chopped green chillies. Give them a quick stir.",timer:0},{title:"Preheat",body:"Next goes in the spices – turmeric powder and red chilli powder. Sauté the spices well for couple of minutes.. Add the chicken pieces to the wok, season it with salt to taste and cook the chicken covered on medium-low heat until the chicken is almost cooked through. This would ta",timer:900},{title:"Preheat",body:"When the oil separates from the spices, add the beaten yogurt keeping the heat on lowest so that the yogurt doesn’t split. Sprinkle the remaining coriander seeds and add half of the dried fenugreek leaves. Mix well.. Finally add the cream and give a final mix to combine everythin",timer:0},{title:"Serve",body:"Sprinkle the remaining kasuri methi and garam masala and serve the chicken handi hot with naan or rotis. Enjoy!.",timer:0}],tip:"A classic Indian dish."},
  {id:52831,photo:"https://www.themealdb.com/images/media/meals/tyywsw1505930373.jpg",name:"Chicken Karaage",emoji:"",xp:85,difficulty:"Medium",time:"1 hr",category:"Japanese",diets:["Gluten-free","Dairy-free"],macros:{calories:387,protein:23,carbs:47,fat:13,fiber:1},done:false,ingredients:["450 grams Boneless skin Chicken","1 tablespoon Ginger","1 clove Garlic","2 tablespoons Soy sauce","1 tablespoon Sake","2 teaspoon Granulated sugar","1/3 cup Potato starch","1/3 cup Vegetable oil","1/3 cup Lemon"],steps:[{title:"Mix",body:"Add the ginger, garlic, soy sauce, sake and sugar to a bowl and whisk to combine. Add the chicken, then stir to coat evenly. Cover and refrigerate for at least 1 hour.",timer:3600},{title:"Preheat",body:"Add 1 inch of vegetable oil to a heavy bottomed pot and heat until the oil reaches 360 degrees F. Line a wire rack with 2 sheets of paper towels and get your tongs out. Put the potato starch in a bowl.",timer:0},{title:"Mix",body:"Add a handful of chicken to the potato starch and toss to coat each piece evenly.",timer:0},{title:"Cook",body:"Fry the karaage in batches until the exterior is a medium brown and the chicken is cooked through. Transfer the fried chicken to the paper towel lined rack. If you want the karaage to stay crispy longer, you can fry the chicken a second time, until it's a darker color after it's ",timer:0}],tip:"Original recipe: https://norecipes.com/karaage-recipe"},
  {id:53358,photo:"https://www.themealdb.com/images/media/meals/er4d081765186828.jpg",name:"Chicken Mandi",emoji:"",xp:157,difficulty:"Hard",time:"30 min",category:"Indian",diets:["Gluten-free","Dairy-free"],macros:{calories:434,protein:16,carbs:58,fat:13,fiber:7},done:false,ingredients:["1 Chicken","2 cups Basmati Rice","4 cups Water","1 large Onion","4 cloves Garlic","2 Green Chilli","1 ½ tsp Salt","3 tablespoons Oil","1 tablespoon Turmeric Powder","1 teaspoon Coriander","½ tbsp Cardamom","¼ teaspoon Cloves","1/2 tsp Cinnamon","1 tsp Pepper","2 Bay Leaf"],steps:[{title:"Prep",body:"Clean and cut the chicken; marinate briefly with salt, turmeric and a little oil.. 2. Rinse and soak basmati rice 20–30 minutes.",timer:1800},{title:"Preheat",body:"In a large pot, heat ghee/oil. Fry chopped onion until golden. Add minced garlic and green chillies and fry 1–2 min.. 4. Add whole spices (cardamom, cloves, cinnamon, bay leaves) and ground spices (coriander, cumin). Stir until fragrant.",timer:120},{title:"Preheat",body:"Add chicken pieces, brown lightly and add enough water/chicken stock to cover. Simmer until chicken is nearly cooked.. 6. Remove chicken; measure remaining liquid and add soaked rice. Bring to a boil, then reduce heat, cover and cook rice until almost done.",timer:0},{title:"Preheat",body:"Return the chicken to the rice pot on top, cover tightly and steam on low for 10–15 min so flavors meld.. 8. (Optional) For authentic smoky aroma: heat a small charcoal until red hot, place it on a small foil cup in the centre of the pot, add a tsp of butter/oil on the coal then ",timer:900},{title:"Prep",body:"Garnish with fried onions, chopped coriander and serve with chutney or raita.",timer:0}],tip:"A classic Indian dish."},
  {id:52920,photo:"https://www.themealdb.com/images/media/meals/qpxvuq1511798906.jpg",name:"Chicken Marengo",emoji:"",xp:99,difficulty:"Medium",time:"40 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:547,protein:33,carbs:34,fat:32,fiber:2},done:false,ingredients:["1 tbs Olive Oil","300g Mushrooms","4 Chicken Legs","500g Passata","1 Chicken Stock Cube","100g Black Olives","Chopped Parsley"],steps:[{title:"Preheat",body:"Heat the oil in a large flameproof casserole dish and stir-fry the mushrooms until they start to soften. Add the chicken legs and cook briefly on each side to colour them a little.",timer:0},{title:"Mix",body:"Pour in the passata, crumble in the stock cube and stir in the olives. Season with black pepper – you shouldn’t need salt. Cover and simmer for 40 mins until the chicken is tender. Sprinkle with parsley and serve with pasta and a salad, or mash and green veg, if you like.",timer:2400}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/3146682/chicken-marengo"},
  {id:52879,photo:"https://www.themealdb.com/images/media/meals/uwvxpv1511557015.jpg",name:"Chicken Parmentier",emoji:"",xp:107,difficulty:"Hard",time:"1 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:564,protein:27,carbs:47,fat:30,fiber:6},done:false,ingredients:["1.5kg Potatoes","30g Butter","5 tblsp Double Cream","2 Egg Yolks","30g Butter","7 Shallots","3 chopped Carrots","2 sticks Celery","1 finely chopped Garlic Clove","4 tbsp White Wine","1 tbls Tomato Puree","400g Tinned Tomatos","350ml Chicken Stock","600g Chicken","16 Black Olives","2 tbs Parsley","50g Gruyere cheese"],steps:[{title:"Mix",body:"For the topping, boil the potatoes in salted water until tender. Drain and push through a potato ricer, or mash thoroughly. Stir in the butter, cream and egg yolks. Season and set aside.",timer:0},{title:"Mix",body:"For the filling, melt the butter in a large pan. Add the shallots, carrots and celery and gently fry until soft, then add the garlic. Pour in the wine and cook for 1 minute. Stir in the tomato purée, chopped tomatoes and stock and cook for 10–15 minutes, until thickened. Add the ",timer:60},{title:"Preheat",body:"Preheat the oven to 180C/160C Fan/Gas 4.",timer:0},{title:"Cook",body:"Put the filling in a 20x30cm/8x12in ovenproof dish and top with the mashed potato. Grate over the Gruyère. Bake for 30–35 minutes, until piping hot and the potato is golden-brown.",timer:2100}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/chicken_parmentier_25434"},
  {id:53011,photo:"https://www.themealdb.com/images/media/meals/k29viq1585565980.jpg",name:"Chicken Quinoa Greek Salad",emoji:"",xp:133,difficulty:"Hard",time:"4 min",category:"Mediterranean",diets:["Gluten-free"],macros:{calories:340,protein:22,carbs:22,fat:22,fiber:6},done:false,ingredients:["225g Quinoa","25g Butter","1 chopped Red Chilli","1 clove finely chopped Garlic","400g Chicken Breast","2 tbs Olive Oil","Handful Black Olives","1 chopped Red Onions","100g Feta","Chopped Mint","Juice of 1/2 Lemon"],steps:[{title:"Cook",body:"Cook the quinoa following the pack instructions, then rinse in cold water and drain thoroughly.",timer:0},{title:"Mix",body:"Meanwhile, mix the butter, chilli and garlic into a paste. Toss the chicken fillets in 2 tsp of the olive oil with some seasoning. Lay in a hot griddle pan and cook for 3-4 mins each side or until cooked through. Transfer to a plate, dot with the spicy butter and set aside to mel",timer:240},{title:"Mix",body:"Next, tip the tomatoes, olives, onion, feta and mint into a bowl. Toss in the cooked quinoa. Stir through the remaining olive oil, lemon juice and zest, and season well. Serve with the chicken fillets on top, drizzled with any buttery chicken juices.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/griddled-chicken-quinoa-greek-salad"},
  {id:53218,photo:"https://www.themealdb.com/images/media/meals/hcg6l91763596970.jpg",name:"Chicken Shawarma with homemade garlic herb yoghurt sauce",emoji:"",xp:150,difficulty:"Hard",time:"12 hrs",category:"Comfort",diets:["Gluten-free"],macros:{calories:547,protein:36,carbs:28,fat:28,fiber:2},done:false,ingredients:["1kg Chicken Breast","2 cloves minced Garlic","1 tblsp Ground Coriander","1 tblsp Ground Cumin","1 tblsp Ground Cardomom","1 tsp Cayenne Pepper","2 tsp Smoked Paprika","2 tsp Salt","2 tblsp Lemon Juice","3 tablespoons Olive Oil","1 cup Greek Yogurt","1 clove peeled crushed Garlic","1 tsp Cumin","Splash Lemon Juice"],steps:[{title:"Prep",body:"Start by cutting your chicken up into reasonably small slices. Grab your ziplock bag and dump the freshly sliced chicken inside.",timer:0},{title:"Mix",body:"Add garlic, coriander, cumin, cardomom, cayenne pepper, paprika, salt, pepper, lemon juice and olive oil to the bag. Close the bag and mix thoroughly. Place in fridge for 10-12 hours (shorter is fine but longer is better).",timer:43200},{title:"Preheat",body:"Once ready to cook, heat your fry pan to medium-high and add a tiny bit of olive oil. Fry one side of all of your flatbreads until slightly toasty. Remove from pan, add enough oil to coat the fry pan. Put crumble fries into air fryer on 180 for 15 minutes shaking occasionally.",timer:900},{title:"Cook",body:"The pan should be pretty hot by now, add the chicken in 2 batches (unless you have a big fry pan) to avoid overcrowding. The chicken should get a nice sear and darker colour which is perfect. Cook for a further 5-8 minutes or until cooked through. Repeat with next chicken batch.",timer:480},{title:"Mix",body:"While chicken is cooking, place your Greek yoghurt into a bowl. Combine garlic, finely chopped mint and parsley, squeeze or so of lemon and cumin. Combine and add salt to taste. In a small bowl, combine 1tsp garlic powder, paprika, cumin, onion powder, oregano, dried parsley, cay",timer:0},{title:"Cook",body:"Season fries immediately once cooked and add salt to taste. Once the chicken is complete, serve immediately by laying out your flatbread, spreading the sauce evenly over the bread, add lettuce, onion, tomato, fries, chicken, feta and more sauce on top. Serve immediately.",timer:0}],tip:"Original recipe: https://cookpad.com/eng/recipes/24343467?ref=search&search_term=saudi+arabia"},
  {id:53261,photo:"https://www.themealdb.com/images/media/meals/4hzyvq1763792564.jpg",name:"Chicken wings with cumin, lemon & garlic",emoji:"",xp:76,difficulty:"Medium",time:"50 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:342,protein:17,carbs:31,fat:21,fiber:7},done:false,ingredients:["12 Chicken Wings","2 cloves minced Garlic","Zest and juice of 1 Lemon","1 tsp Cumin Seeds","2 tablespoons Olive Oil","1 tablespoon Honey"],steps:[{title:"Mix",body:"Using a pair of sharp kitchen scissors, cut each wing at the knuckle into two pieces. Mix the garlic, lemon zest and juice, cumin and oil with plenty of seasoning, then tip into a dish with the chicken wings and toss to coat. Cover and put in the fridge to marinate for at least 1",timer:0},{title:"Preheat",body:"Heat oven to 200C/180C fan/gas 6, or heat an outdoor barbecue. Bake the chicken wings on an oven tray for 45-50 mins until crisp, or barbecue for 20 mins, drizzling over the honey for the final 10 mins of each method. Serve on a platter with plenty of paper napkins. Fill small bo",timer:3000}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chicken-wings-cumin-lemon-garlic"},
  {id:53186,photo:"https://www.themealdb.com/images/media/meals/4mhr3u1763481087.jpg",name:"Chicken with saffron, raisins & pine nuts",emoji:"",xp:69,difficulty:"Medium",time:"5 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:578,protein:33,carbs:44,fat:31,fiber:4},done:false,ingredients:["1.25kg Chicken","2 tblsp Olive Oil","3 cloves Chopped Garlic","Pinch Saffron","125ml Dry sherry","200ml Chicken Stock","1 tbsp Thyme","50g Raisins","2 tbsp Pine Nuts","Handful Parsley"],steps:[{title:"Preheat",body:"Heat a large frying pan on a high heat and season the chicken. Add the olive oil to the pan, then the chicken. Brown for about 5 mins on each side, remove onto a plate, then set aside.",timer:300},{title:"Preheat",body:"Lower the heat to medium. In the remaining fat, fry the onions for 3 mins, then add the garlic and saffron. Cook for 3-4 mins more. Add the sherry, then simmer for 3-5 mins until syrupy.",timer:180},{title:"Preheat",body:"Put the chicken leg pieces back into the pan, tip in the stock, thyme and raisins, cover, then gently cook on a low heat for 20 mins. Add the breast meat and any juices left on the plate. Simmer for 10 mins more until cooked through and the sauce in the pan has reduced.",timer:1200},{title:"Preheat",body:"While the chicken is cooking, heat oven to 200C/180C fan/gas 6. Scatter the pine nuts over a baking sheet, then roast for 10 mins until golden and toasted. Once the chicken has cooked through, season to taste, scatter with pine nuts and parsley, then serve with rice.",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chicken-saffron-raisins-pine-nuts"},
  {id:53365,photo:"https://www.themealdb.com/images/media/meals/s73ytv1765567838.jpg",name:"Chinese Orange Chicken",emoji:"",xp:109,difficulty:"Hard",time:"4 min",category:"Asian",diets:["Dairy-free"],macros:{calories:408,protein:25,carbs:55,fat:11,fiber:2},done:false,ingredients:["Zest of 1 Orange","1/4 cup Orange Juice","1/4 cup Soy Sauce","1/4 cup Water","1/3 cup Rice Vinegar","1 tablespoon Cornstarch","1 tablespoon Sesame Seed Oil","1/2 cup Sugar","650g Chicken Thighs","2 large Egg","1 tsp Salt","1/4 tsp Black Pepper","1/2 cup Cornstarch","1/2 cup All purpose flour","2 cups Vegetable Oil","2 cloves chopped Garlic","1 chopped Shallots","Sliced Scallions","Garnish Sesame Seed","To serve Rice"],steps:[{title:"Mix",body:"Make the orange sauce:. Whisk together sauce ingredients in a medium bowl. Set aside.",timer:0},{title:"Mix",body:"Cut chicken into about 1-inch cubes. Whisk eggs with salt and black pepper in a bowl and add chicken. Stir together.. In a separate bowl, whisk together flour and cornstarch. Remove chicken from eggs with a slotted spoon or tongs, letting excess egg drain off, then transfer to co",timer:0},{title:"Preheat",body:"Add oil to a large 10- to 12-inch skillet. Heat over medium-high heat until it reaches 350°F. If you don’t have a thermometer, you can also test the temperature by sprinkling in some flour. If the oil is hot enough, it should fizzle immediately.. Once oil is hot, fry the chicken ",timer:180},{title:"Cook",body:"Remove fried chicken cubes and transfer to a plate lined with paper towels, so the chicken can drain. Repeat until all the chicken is cooked.. Simmer the chicken in the sauce:.",timer:0},{title:"Prep",body:"Once chicken is done, pour out hot oil and wipe pan clean. Add a fresh tablespoon of oil along with chopped garlic and shallot. Cook for a minute and then add the sauce. Simmer the sauce until it starts to thicken.. Once the sauce is lightly bubbling, add fried chicken and toss t",timer:0},{title:"Preheat",body:"Did you love this recipe? Let us know with a rating and review!. LEFTOVERS! The orange chicken keeps well in the fridge for 5 days. Reheat in a skillet with a splash of water over low heat. Freeze the orange chicken for up to 3 months, but be sure to thaw it before reheating so t",timer:0}],tip:"Original recipe: https://www.simplyrecipes.com/recipes/chinese_orange_chicken/"},
  {id:52832,photo:"https://www.themealdb.com/images/media/meals/qstyvs1505931190.jpg",name:"Coq au vin",emoji:"",xp:155,difficulty:"Hard",time:"8 min",category:"Comfort",diets:["No restrictions"],macros:{calories:559,protein:27,carbs:39,fat:29,fiber:3},done:false,ingredients:["1½ tbsp Olive Oil","3 rashers (100g) chopped dry-cured Bacon","12 small Shallots","2 (460g) Chicken Legs","4 (650g) Chicken Thighs","2 (280g) Chicken Breasts","3 finely chopped Garlic","3 tbsp Brandy","600ml Red Wine","150ml Chicken Stock","2 tsp tomato puree","3 sprigs thyme","2 sprigs Rosemary","2 bay leaves","garnish parsley","250g chestnut mushroom","2 tbsp plain flour","1 tsp butter"],steps:[{title:"Preheat",body:"Heat 1 tbsp of the oil in a large, heavy-based saucepan or flameproof dish. Tip in the bacon and fry until crisp. Remove and drain on kitchen paper. Add the shallots to the pan and fry, stirring or shaking the pan often, for 5-8 mins until well browned all over. Remove and set as",timer:480},{title:"Cook",body:"Pat the chicken pieces dry with kitchen paper. Pour the remaining oil into the pan, then fry half the chicken pieces, turning regularly, for 5-8 mins until well browned. Remove, then repeat with the remaining chicken. Remove and set aside.",timer:480},{title:"Preheat",body:"Scatter in the garlic and fry briefly, then, with the heat medium-high, pour in the brandy or Cognac, stirring the bottom of the pan to deglaze. The alcohol should sizzle and start to evaporate so there is not much left.",timer:0},{title:"Preheat",body:"Return the chicken legs and thighs to the pan along with any juices, then pour in a little of the wine, stirring the bottom of the pan again. Stir in the rest of the wine, the stock and tomato purée, drop in the bouquet garni, season with pepper and a pinch of salt, then return t",timer:3000},{title:"Preheat",body:"Just before ready to serve, heat the oil for the mushrooms in a large non-stick frying pan. Add the mushrooms and fry over a high heat for a few mins until golden. Remove and keep warm.",timer:0},{title:"Preheat",body:"Lift the chicken, shallots and bacon from the pan and transfer to a warmed serving dish. Remove the bouquet garni. To make the thickener, mix the flour, olive oil and butter in a small bowl using the back of a teaspoon. Bring the wine mixture to a gentle boil, then gradually drop",timer:120}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1913655/coq-au-vin"},
  {id:53120,photo:"https://www.themealdb.com/images/media/meals/wkhg581762773124.jpg",name:"Æbleskiver",emoji:"",xp:79,difficulty:"Medium",time:"30 min",category:"Baking",diets:["Vegetarian"],macros:{calories:323,protein:4,carbs:49,fat:15,fiber:1},done:false,ingredients:["2 cups Flour","1 teaspoon Salt","2 tblsp Granulated Sugar","1 teaspoon Baking Powder","1/2 teaspoon Cardamom","3 Egg","2 cups Buttermilk","For Greasing Butter","Sprinkling Powdered Sugar","1 scoop Raspberry Jam"],steps:[{title:"Mix",body:"Whisk the flour, salt, sugar, baking soda, and cardamom together in a large bowl.",timer:0},{title:"Mix",body:"Separate the eggs and add the egg yolks to the flour mixture. Pour in the buttermilk (or cultured milk) and whisk the batter together until smooth. Cover and refrigerate for about 30 minutes.",timer:1800},{title:"Mix",body:"Use a hand (or stand) mixer to beat the egg whites until stiff. Carefully fold into the æbleskiver batter.",timer:0},{title:"Preheat",body:"Heat the pan on medium heat. Once hot, brush the pan with butter and fill each æbleskive hole almost full with the batter.",timer:0},{title:"Cook",body:"Once the edges become firm use a knitting needle or wooden skewer to turn the æbleskiver about 1/4. Continue turning until you get round pancake spheres. They should be golden brown.",timer:0},{title:"Serve",body:"Remove the æbleskiver from the pan and serve with powdered sugar and jam.",timer:0}],tip:"Original recipe: https://scandinaviancookbook.com/aebleskiver-danish-pancake-balls/"},
  {id:53138,photo:"https://www.themealdb.com/images/media/meals/a4kgf21763075288.jpg",name:"Alfajores",emoji:"",xp:74,difficulty:"Medium",time:"1 hr",category:"Baking",diets:["Vegetarian"],macros:{calories:357,protein:7,carbs:51,fat:12,fiber:0},done:false,ingredients:["300g All purpose flour","200g Cornstarch","200g Butter","100g Sugar","2 Egg Yolks","1 teaspoon Lemon Zest","Dulce de leche","Sprinkling Desiccated Coconut"],steps:[{title:"Mix",body:"Make the Dough: Cream butter and sugar. Add egg yolks and lemon zest. Gradually mix in flour and cornstarch to form a dough. Chill for 1 hour.",timer:3600},{title:"Prep",body:"Bake the Cookies: Roll out the dough, cut into circles, and bake at 180°C (350°F) for 12-15 minutes. Let cool.",timer:900},{title:"Cook",body:"Assemble: Spread dulce de leche on one cookie, then sandwich with another. Roll the edges in coconut flakes.",timer:0},{title:"Cook",body:"Chill the dough before rolling it out to make it easier to handle and to prevent the cookies from spreading too much while baking.",timer:0},{title:"Add",body:"Dip the alfajores in melted chocolate and let them set on a wire rack for an extra decadent treat.",timer:0}],tip:"Original recipe: https://www.munchery.com/blog/the-ten-iconic-dishes-of-argentina-and-how-to-cook-them-at-home/"},
  {id:53111,photo:"https://www.themealdb.com/images/media/meals/q47rkb1762324620.jpg",name:"Anzac biscuits",emoji:"",xp:98,difficulty:"Medium",time:"10 min",category:"Baking",diets:["Vegetarian"],macros:{calories:337,protein:8,carbs:45,fat:20,fiber:4},done:false,ingredients:["85g Porridge oats","85g Desiccated Coconut","100g Plain Flour","100g Caster Sugar","100g Butter","1 tblsp Golden Syrup","1 teaspoon Bicarbonate Of Soda"],steps:[{title:"Preheat",body:"Heat oven to 180C/fan 160C/gas 4. Put the oats, coconut, flour and sugar in a bowl. Melt the butter in a small pan and stir in the golden syrup. Add the bicarbonate of soda to 2 tbsp boiling water, then stir into the golden syrup and butter mixture.",timer:0},{title:"Mix",body:"Make a well in the middle of the dry ingredients and pour in the butter and golden syrup mixture. Stir gently to incorporate the dry ingredients.",timer:0},{title:"Mix",body:"Put dessertspoonfuls of the mixture on to buttered baking sheets, about 2.5cm/1in apart to allow room for spreading. Bake in batches for 8-10 mins until golden. Transfer to a wire rack to cool.",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/anzac-biscuits"},
  {id:53049,photo:"https://www.themealdb.com/images/media/meals/adxcbq1619787919.jpg",name:"Apam balik",emoji:"",xp:88,difficulty:"Medium",time:"40 min",category:"Asian",diets:["Vegetarian"],macros:{calories:401,protein:24,carbs:46,fat:15,fiber:4},done:false,ingredients:["200ml Milk","60ml Oil","2 Eggs","1600g Flour","3 tsp Baking Powder","1/2 tsp Salt","25g Unsalted Butter","45g Sugar","3 tbs Peanut Butter"],steps:[{title:"Mix",body:"Mix milk, oil and egg together. Sift flour, baking powder and salt into the mixture. Stir well until all ingredients are combined evenly.",timer:0},{title:"Cook",body:"Spread some batter onto the pan. Spread a thin layer of batter to the side of the pan. Cover the pan for 30-60 seconds until small air bubbles appear.",timer:0},{title:"Cook",body:"Add butter, cream corn, crushed peanuts and sugar onto the pancake. Fold the pancake into half once the bottom surface is browned.",timer:0},{title:"Preheat",body:"Cut into wedges and best eaten when it is warm.",timer:0}],tip:"Original recipe: https://www.nyonyacooking.com/recipes/apam-balik~SJ5WuvsDf9WQ"},
  {id:52893,photo:"https://www.themealdb.com/images/media/meals/xvsurr1511719182.jpg",name:"Apple & Blackberry Crumble",emoji:"",xp:61,difficulty:"Medium",time:"15 min",category:"Baking",diets:["Vegetarian"],macros:{calories:331,protein:7,carbs:51,fat:11,fiber:1},done:false,ingredients:["120g Plain Flour","60g Caster Sugar","60g Butter","300g Braeburn Apples","30g Butter","30g Demerara Sugar","120g Blackberries","¼ teaspoon Cinnamon","to serve Ice Cream"],steps:[{title:"Preheat",body:"Heat oven to 190C/170C fan/gas 5. Tip the flour and sugar into a large bowl. Add the butter, then rub into the flour using your fingertips to make a light breadcrumb texture. Do not overwork it or the crumble will become heavy. Sprinkle the mixture evenly over a baking sheet and ",timer:900},{title:"Preheat",body:"Meanwhile, for the compote, peel, core and cut the apples into 2cm dice. Put the butter and sugar in a medium saucepan and melt together over a medium heat. Cook for 3 mins until the mixture turns to a light caramel. Stir in the apples and cook for 3 mins. Add the blackberries an",timer:180},{title:"Preheat",body:"To serve, spoon the warm fruit into an ovenproof gratin dish, top with the crumble mix, then reheat in the oven for 5-10 mins. Serve with vanilla ice cream.",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/778642/apple-and-blackberry-crumble"},
  {id:53380,photo:"https://www.themealdb.com/images/media/meals/c0gmo31766594751.jpg",name:"Apple cake",emoji:"",xp:88,difficulty:"Medium",time:"50 min",category:"Baking",diets:["Vegetarian"],macros:{calories:352,protein:1,carbs:52,fat:18,fiber:3},done:false,ingredients:["4 Eggs","200g Sugar","200g Self-raising Flour","200g Melted Butter","1 tsp Vanilla Extract","1 tsp Ground Cinnamon","3 Apples","Pinch Salt","Sprinkling Ground Sugar"],steps:[{title:"Preheat",body:"Preheat the oven to 180°C. (350˚F) Grease a cake pan and line it with baking paper.. In a large bowl, break the four eggs with the sugar and beat until they have tripled in volume and become fluffy.",timer:0},{title:"Mix",body:"Sift the self-rising baking flour and add it to your egg mixture. Fold this over, preserving as much air as possible. Add the melted (and slightly cooled) butter and mix until combined.. Add cinnamon, pinch of salt and vanilla extract.",timer:0},{title:"Prep",body:"Add the diced apple to the batter and gently fold them into the batter so that the apple pieces are evenly distributed. You can roll the apple pieces through some more cinnamon.. Pour the batter into the prepared cake pan and smooth the top with a spatula.",timer:0},{title:"Preheat",body:"Place the apple slices on top of the batter and press lightly. Sprinkle optionally with some almond shavings.. Bake the apple cake in the preheated oven for about 45-50 minutes, or until a wooden skewer comes out clean when inserted into the center of the cake.",timer:3000},{title:"Rest",body:"Remove the cake from the oven and let it cool in the mold for a few minutes. Then carefully remove the cake from the mold and let cool completely on a wire rack.. Sprinkle the cooled apple cake with powdered sugar.",timer:0}],tip:"Original recipe: https://insimoneskitchen.com/dutch-apple-cake/#recipe"},
  {id:52768,photo:"https://www.themealdb.com/images/media/meals/wxywrq1468235067.jpg",name:"Apple Frangipan Tart",emoji:"",xp:61,difficulty:"Medium",time:"3 min",category:"Baking",diets:["Vegetarian","Gluten-free"],macros:{calories:337,protein:3,carbs:56,fat:14,fiber:0},done:false,ingredients:["175g/6oz digestive biscuits","75g/3oz butter","200g/7oz Bramley apples","75g/3oz Salted Butter","75g/3oz caster sugar","2 free-range eggs, beaten","75g/3oz ground almonds","1 tsp almond extract","50g/1¾oz flaked almonds"],steps:[{title:"Preheat",body:"Preheat the oven to 200C/180C Fan/Gas 6.",timer:0},{title:"Mix",body:"Put the biscuits in a large re-sealable freezer bag and bash with a rolling pin into fine crumbs. Melt the butter in a small pan, then add the biscuit crumbs and stir until coated with butter. Tip into the tart tin and, using the back of a spoon, press over the base and sides of ",timer:0},{title:"Mix",body:"Cream together the butter and sugar until light and fluffy. You can do this in a food processor if you have one. Process for 2-3 minutes. Mix in the eggs, then add the ground almonds and almond extract and blend until well combined.",timer:180},{title:"Prep",body:"Peel the apples, and cut thin slices of apple. Do this at the last minute to prevent the apple going brown. Arrange the slices over the biscuit base. Spread the frangipane filling evenly on top. Level the surface and sprinkle with the flaked almonds.",timer:0},{title:"Cook",body:"Bake for 20-25 minutes until golden-brown and set.",timer:1500},{title:"Rest",body:"Remove from the oven and leave to cool for 15 minutes. Remove the sides of the tin. An easy way to do this is to stand the tin on a can of beans and push down gently on the edges of the tin.",timer:900},{title:"Preheat",body:"Transfer the tart, with the tin base attached, to a serving plate. Serve warm with cream, crème fraiche or ice cream.",timer:0}],tip:"A classic British dish."},
  {id:53276,photo:"https://www.themealdb.com/images/media/meals/p277uc1764109195.jpg",name:"Apricot & Turkish delight mess",emoji:"",xp:69,difficulty:"Medium",time:"40 min",category:"Mediterranean",diets:["Vegetarian","Gluten-free"],macros:{calories:351,protein:18,carbs:40,fat:21,fiber:4},done:false,ingredients:["100g Mascarpone","50g Greek Yogurt","25g Icing Sugar","2 tablespoons Orange Blossom Water","1 Meringue Nests","3 Apricot","2 pieces Turkish Delight","25g Almonds","4 Mint"],steps:[{title:"Mix",body:"step 1 Place the mascarpone, yogurt, sugar and orange flower water into a large bowl and whisk until thickened.",timer:0},{title:"Mix",body:"Fold the remaining ingredients through, then divide the mix between 2 dessert glasses or bowls and decorate with extra mint, if you like.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/apricot-turkish-delight-mess"},
  {id:53127,photo:"https://www.themealdb.com/images/media/meals/yk78uc1763075719.jpg",name:"Authentic Norwegian Kransekake",emoji:"",xp:67,difficulty:"Medium",time:"12 min",category:"Baking",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:325,protein:9,carbs:46,fat:14,fiber:0},done:false,ingredients:["3 Cups Almonds","4 Egg White","4 cups Powdered Sugar","2 cups Powdered Sugar","1 Egg White","1/2 teaspoon Lemon Juice"],steps:[{title:"Prepare",body:"Grind almonds in an almond grinder or food processor.",timer:0},{title:"Mix",body:"Mix almonds and powdered sugar together in a large mixing bowl. Add three of the egg whites and knead the dough together with your hands until it comes together in a ball. Wrap in cling film and leave in the fridge for at least an hour, preferably until the next day.",timer:0},{title:"Mix",body:"Grease the kransekake forms thoroughly and coat with semolina, flour, or bread crumbs.",timer:0},{title:"Preheat",body:"Preheat oven to 210°C (410°F) top and bottom heat. Divide the dough into six sections.",timer:0},{title:"Add",body:"Slowly add the remaining egg white to the dough and knead it until you can roll it into long sausages about as thick as your index finger. Fill the forms with the dough sausages, pinching the ends together to make rings.",timer:0},{title:"Cook",body:"Set the forms on a baking sheet and back in the middle of the oven for about 10 – 12 minutes, until the tops are golden brown.",timer:720}],tip:"Original recipe: https://scandinaviancookbook.com/classic-norwegian-kransekake-recipe/"},
  {id:52767,photo:"https://www.themealdb.com/images/media/meals/wyrqqq1468233628.jpg",name:"Bakewell tart",emoji:"",xp:84,difficulty:"Medium",time:"30 min",category:"Baking",diets:["Vegetarian"],macros:{calories:336,protein:5,carbs:51,fat:19,fiber:1},done:false,ingredients:["175g/6oz plain flour","75g/2½oz chilled butter","2-3 tbsp cold water","1 tbsp raspberry jam","125g/4½oz butter","125g/4½oz caster sugar","125g/4½oz ground almonds","1 free-range egg, beaten","½ tsp almond extract","50g/1¾oz flaked almonds"],steps:[{title:"Mix",body:"To make the pastry, measure the flour into a bowl and rub in the butter with your fingertips until the mixture resembles fine breadcrumbs. Add the water, mixing to form a soft dough.",timer:0},{title:"Rest",body:"Roll out the dough on a lightly floured work surface and use to line a 20cm/8in flan tin. Leave in the fridge to chill for 30 minutes.",timer:1800},{title:"Preheat",body:"Preheat the oven to 200C/400F/Gas 6 (180C fan).",timer:0},{title:"Cook",body:"Line the pastry case with foil and fill with baking beans. Bake blind for about 15 minutes, then remove the beans and foil and cook for a further five minutes to dry out the base.",timer:900},{title:"Add",body:"For the filing, spread the base of the flan generously with raspberry jam.",timer:0},{title:"Preheat",body:"Melt the butter in a pan, take off the heat and then stir in the sugar. Add ground almonds, egg and almond extract. Pour into the flan tin and sprinkle over the flaked almonds.",timer:0},{title:"Cook",body:"Bake for about 35 minutes. If the almonds seem to be browning too quickly, cover the tart loosely with foil to prevent them burning.",timer:2100}],tip:"A classic British dish."},
  {id:53279,photo:"https://www.themealdb.com/images/media/meals/ytme8t1764111401.jpg",name:"Baklava with spiced nuts, ricotta & chocolate",emoji:"",xp:143,difficulty:"Hard",time:"15 min",category:"Mediterranean",diets:["Vegetarian","Gluten-free"],macros:{calories:371,protein:21,carbs:30,fat:13,fiber:3},done:false,ingredients:["500g Sugar","To taste Lemon Juice","300g Walnuts","200g Pecan Nuts","100g Almonds","2 tablespoons Ground Cinnamon","1 tablespoon Ground Cardomom","500g Ricotta","Zest of 1 Lemon","Zest of 1 Orange","1 tablespoon Vanilla Bean Paste","250g Unsalted Butter","500g Filo Pastry","100g Ground Pistachios"],steps:[{title:"Preheat",body:"First, make the syrup. Tip the sugar into a large saucepan with 650ml water. Stir over a low heat until the sugar has dissolved, then turn up the heat and bring to the boil. Reduce the heat to a simmer and cook for 15 mins, then squeeze in a few drops of lemon juice and simmer fo",timer:900},{title:"Mix",body:"For the filling, crush all of the nuts in a pestle and mortar, or blitz in a food processor – you want a mixture of finely ground nuts with a few chunky pieces. Tip into a bowl, stir through the spices and set aside.",timer:0},{title:"Preheat",body:"In a separate bowl, mix the ricotta with the lemon and orange zests and vanilla. Heat the oven to 180C/160C fan/gas 4. Brush the bottom of a large baking tray (about 35 x 47cm) with some of the melted butter. Working with one sheet of filo at a time (covering the rest with a damp",timer:5760},{title:"Cook",body:"Brush with the remaining melted butter. Bake for 20-25 mins until evenly golden, turning the tray around halfway through. While still hot, immediately pour over 5-6 ladlefuls of the syrup. You should hear the syrup sizzle as it hits the hot baklava. Set aside to cool and absorb.",timer:1500},{title:"Preheat",body:"Melt the dark chocolate in a heatproof bowl set over a pan of simmering water, ensuring the bowl doesn’t touch the water, or in the microwave in short bursts. Drizzle this over the cooled baklava and sprinkle with the ground pistachios.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/baklava-with-spiced-nuts-ricotta-chocolate"},
  {id:52855,photo:"https://www.themealdb.com/images/media/meals/sywswr1511383814.jpg",name:"Banana Pancakes",emoji:"",xp:72,difficulty:"Medium",time:"2 min",category:"Baking",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:342,protein:7,carbs:47,fat:11,fiber:0},done:false,ingredients:["1 large Banana","2 medium Eggs","pinch Baking Powder","spinkling Vanilla Extract","1 tsp Oil","25g Pecan Nuts","125g Raspberries"],steps:[{title:"Mix",body:"In a bowl, mash the banana with a fork until it resembles a thick purée. Stir in the eggs, baking powder and vanilla.",timer:0},{title:"Preheat",body:"Heat a large non-stick frying pan or pancake pan over a medium heat and brush with half the oil. Using half the batter, spoon two pancakes into the pan, cook for 1-2 mins each side, then tip onto a plate. Repeat the process with the remaining oil and batter. Top the pancakes with",timer:120}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/banana-pancakes"},
  {id:52894,photo:"https://www.themealdb.com/images/media/meals/ywwrsp1511720277.jpg",name:"Battenberg Cake",emoji:"",xp:137,difficulty:"Hard",time:"30 min",category:"Baking",diets:["Vegetarian"],macros:{calories:332,protein:5,carbs:52,fat:15,fiber:0},done:false,ingredients:["175g Butter","175g Caster Sugar","140g Self-raising Flour","50g Almonds","½ tsp Baking Powder","3 Medium Eggs","½ tsp Vanilla Extract","¼ teaspoon Almond Extract","175g Butter","175g Caster Sugar","140g Self-raising Flour","50g Almonds","½ tsp Baking Powder","3 Medium Eggs","½ tsp Vanilla Extract","¼ teaspoon Almond Extract","½ tsp Pink Food Colouring","200g Apricot","1kg Marzipan","Dusting Icing Sugar"],steps:[{title:"Preheat",body:"Heat oven to 180C/160C fan/gas 4 and line the base and sides of a 20cm square tin with baking parchment (the easiest way is to cross 2 x 20cm-long strips over the base). To make the almond sponge, put the butter, sugar, flour, ground almonds, baking powder, eggs, vanilla and almo",timer:1800},{title:"Mix",body:"For the pink sponge, line the tin as above. Mix all the ingredients together as above, but don’t add the almond extract. Fold in some pink food colouring. Then scrape it all into the tin and bake as before. Cool.",timer:0},{title:"Preheat",body:"To assemble, heat the jam in a small pan until runny, then sieve. Barely trim two opposite edges from the almond sponge, then well trim a third edge. Roughly measure the height of the sponge, then cutting from the well-trimmed edge, use a ruler to help you cut 4 slices each the s",timer:0},{title:"Prep",body:"Take 2 x almond slices and 2 x pink slices and trim so they are all the same length. Roll out one marzipan block on a surface lightly dusted with icing sugar to just over 20cm wide, then keep rolling lengthways until the marzipan is roughly 0.5cm thick. Brush with apricot jam, th",timer:0},{title:"Prep",body:"Carefully lift up the marzipan and smooth over the cake with your hands, but leave a small marzipan fold along the bottom edge before you stick it to the first side. Trim opposite side to match size of fold, then crimp edges using fingers and thumb (or, more simply, press with pr",timer:0},{title:"Combine",body:"Assemble second Battenberg and keep in an airtight box or well wrapped in cling film for up to 3 days. Can be frozen for up to a month.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1120657/battenberg-cake"},
  {id:52928,photo:"https://www.themealdb.com/images/media/meals/ryppsv1511815505.jpg",name:"BeaverTails",emoji:"",xp:100,difficulty:"Hard",time:"2 hrs",category:"Baking",diets:["Vegetarian"],macros:{calories:341,protein:5,carbs:53,fat:19,fiber:0},done:false,ingredients:["1/2 cup Water","2 parts Yeast","1/2 cup Sugar","1/2 cup Milk","6 tblsp Butter","2 Eggs","1 ½ tsp Salt","2-1/2 cups Flour","for frying Oil","garnish Lemon","garnish Sugar","garnish Cinnamon"],steps:[{title:"Preheat",body:"In the bowl of a stand mixer, add warm water, a big pinch of sugar and yeast. Allow to sit until frothy.",timer:0},{title:"Preheat",body:"Into the same bowl, add 1/2 cup sugar, warm milk, melted butter, eggs and salt, and whisk until combined.",timer:0},{title:"Mix",body:"Place a dough hook on the mixer, add the flour with the machine on, until a smooth but slightly sticky dough forms.",timer:0},{title:"Season",body:"Place dough in a bowl, cover with plastic wrap, and allow to proof for 1 1/2 hours.",timer:7200},{title:"Prep",body:"Cut dough into 12 pieces, and roll out into long oval-like shapes about 1/4 inch thick that resemble a beaver’s tail.",timer:0},{title:"Preheat",body:"In a large, deep pot, heat oil to 350 degrees. Gently place beavertail dough into hot oil and cook for 30 to 45 seconds on each side until golden brown.",timer:0},{title:"Serve",body:"Drain on paper towels, and garnish as desired. Toss in cinnamon sugar, in white sugar with a squeeze of lemon, or with a generous slathering of Nutella and a handful of toasted almonds. Enjoy!.",timer:0}],tip:"Original recipe: https://www.tastemade.com/videos/beavertails"},
  {id:53316,photo:"https://www.themealdb.com/images/media/meals/xlqqhw1764369924.jpg",name:"Beetroot pancakes",emoji:"",xp:146,difficulty:"Hard",time:"3 min",category:"Baking",diets:["Vegetarian"],macros:{calories:324,protein:6,carbs:46,fat:14,fiber:1},done:false,ingredients:["3 Beetroot","50 ml Milk","200g Self-raising Flour","1 tsp Baking Powder","2 tablespoons Maple Syrup","1/2 teaspoon Vanilla Extract","3 Egg","25g Butter","200g Frozen Mixed Berries","2 tablespoons Blackcurrant Jam","100g Greek Yogurt"],steps:[{title:"Mix",body:"Put the beetroot in a jug with the milk and blend with a stick blender until smooth. Pour into a bowl with the rest of the pancake ingredients and whisk until smooth and vibrant purple.",timer:0},{title:"Preheat",body:"Put a small knob of butter in a large non-stick frying pan and heat over a medium-low heat until melted and foamy. Now create 3 or 4 pancakes each made from 2 tbsp of the batter. Cook for 2-3 mins then flip over and cook for a further minute until cooked through. Repeat with any ",timer:180},{title:"Preheat",body:"Serve with your favourite pancake toppings or make a simple compote by simmering frozen berries in with 1 tbsp blackcurrant jam until bubbling and syrupy (about 5-10 mins). In a small bowl stir together the remaining jam and the yogurt. Stack the cooked pancakes with the yogurt a",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/beetroot-pancakes"},
  {id:52891,photo:"https://www.themealdb.com/images/media/meals/rpvptu1511641092.jpg",name:"Blackberry Fool",emoji:"",xp:125,difficulty:"Hard",time:"8 min",category:"Baking",diets:["Vegetarian"],macros:{calories:336,protein:5,carbs:40,fat:12,fiber:1},done:false,ingredients:["50g Hazlenuts","125g Butter","150g Caster Sugar","Grated Lemon","150g Plain Flour","½ tsp Baking Powder","600g Blackberries","75g Sugar","2 tbs Caster Sugar","1 tbs Lemon Juice","300ml Double Cream","100ml Yogurt","Garnish with Mint"],steps:[{title:"Preheat",body:"For the biscuits, preheat the oven to 200C/180C (fan)/Gas 6 and line two large baking trays with baking parchment. Scatter the nuts over a baking tray and roast in the oven for 6-8 minutes, or until golden-brown. Watch them carefully so that they don’t have a chance to burn. Remo",timer:480},{title:"Cook",body:"Divide the biscuit dough into 24 even pieces and roll into small balls. Place the balls the prepared baking trays, spaced well apart to allow for spreading.. Press the biscuits to flatten to around 1cm/½in thick. Bake the biscuits, one tray at a time, for 12 minutes or until very",timer:720},{title:"Mix",body:"Store in an airtight tin and eat within five days.. For the fool, rinse the blackberries in a colander to wash away any dust or dirt. Put the blackberries in a non-stick saucepan and sprinkle over the caster sugar.",timer:0},{title:"Preheat",body:"Stir in the lemon juice and heat gently for two minutes, or until the blackberries begin to soften and release their juices. Remove and reserve 12 blackberries for decoration and continue cooking the rest.. Simmer the blackberries very gently for 15 minutes, stirring regularly un",timer:900},{title:"Mix",body:"Put the cream and yoghurt in a large bowl and whip with an electric whisk until soft peaks form when the whisk is removed from the bowl – the acidity of the fruit will thicken the cream further, so don’t take it too far.. When the purée is completely cold, adjust the sweetness to",timer:0},{title:"Mix",body:"Spoon the blackberry fool into individual wide, glass dishes – or one large, single bowl. It should look quite marbled, so don’t over-stir it. Scatter a few tiny mint leaves on top and decorate with the reserved blackberries. Sprinkle with a little sugar if you like and serve wit",timer:0}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/blackberry_fool_with_11859"},
  {id:53100,photo:"https://www.themealdb.com/images/media/meals/e756bf1761848342.jpg",name:"Blueberry & lemon friands",emoji:"",xp:80,difficulty:"Medium",time:"20 min",category:"Baking",diets:["Vegetarian"],macros:{calories:333,protein:7,carbs:43,fat:16,fiber:1},done:false,ingredients:["100g Unsalted Butter","125g Icing Sugar","25g Flour","85g Almonds","3 Egg White","1 Unwaxed Lemon","85g Blackberries"],steps:[{title:"Preheat",body:"Preheat the oven to fan 180C/conventional 200C/gas 6. Generously butter six non-stick friand or muffin tins. Melt the butter and set aside to cool.",timer:0},{title:"Mix",body:"Sift the icing sugar and flour into a bowl. Add the almonds and mix everything between your fingers.",timer:0},{title:"Mix",body:"Whisk the egg whites in another bowl until they form a light, floppy foam. Make a well in the centre of the dry ingredients, tip in the egg whites and lemon rind, then lightly stir in the butter to form a soft batter.",timer:0},{title:"Cook",body:"Divide the batter among the tins, a large serving spoon is perfect for this job. Sprinkle a handful of blueberries over each cake and bake for 15-20 minutes until just firm to the touch and golden brown.",timer:1200},{title:"Serve",body:"Cool in the tins for 5 minutes, then turn out and cool on a wire rack. To serve, dust lightly with icing sugar.",timer:300}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/blueberry-lemon-friands"},
  {id:52792,photo:"https://www.themealdb.com/images/media/meals/xqwwpy1483908697.jpg",name:"Bread and Butter Pudding",emoji:"",xp:60,difficulty:"Medium",time:"30 min",category:"Baking",diets:["Vegetarian"],macros:{calories:331,protein:5,carbs:53,fat:16,fiber:4},done:false,ingredients:["25g/1oz butter","8 thin slices bread","50g/2oz sultanas","2 tsp cinnamon","350ml/12fl milk","50ml/2fl oz double cream","2 free-range eggs","25g/1oz sugar","grated, to taste nutmeg"],steps:[{title:"Prep",body:"Grease a 1 litre/2 pint pie dish with butter.. Cut the crusts off the bread. Spread each slice with on one side with butter, then cut into triangles.",timer:0},{title:"Preheat",body:"Arrange a layer of bread, buttered-side up, in the bottom of the dish, then add a layer of sultanas. Sprinkle with a little cinnamon, then repeat the layers of bread and sultanas, sprinkling with cinnamon, until you have used up all of the bread. Finish with a layer of bread, the",timer:0},{title:"Preheat",body:"Crack the eggs into a bowl, add three quarters of the sugar and lightly whisk until pale.. Add the warm milk and cream mixture and stir well, then strain the custard into a bowl.",timer:0},{title:"Preheat",body:"Pour the custard over the prepared bread layers and sprinkle with nutmeg and the remaining sugar and leave to stand for 30 minutes.. Preheat the oven to 180C/355F/Gas 4.",timer:1800},{title:"Cook",body:"Place the dish into the oven and bake for 30-40 minutes, or until the custard has set and the top is golden-brown.",timer:2400}],tip:"Original recipe: https://cooking.nytimes.com/recipes/1018529-coq-au-vin"},
  {id:52961,photo:"https://www.themealdb.com/images/media/meals/1549542877.jpg",name:"Budino Di Ricotta",emoji:"",xp:74,difficulty:"Medium",time:"40 min",category:"Italian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:513,protein:22,carbs:70,fat:17,fiber:5},done:false,ingredients:["500g Ricotta","4 large Eggs","3 tbs Flour","250g Sugar","1 tsp Cinnamon","Grated Zest of 2 Lemons","5 tbs Dark Rum","sprinking Icing Sugar"],steps:[{title:"Mix",body:"Mash the ricotta and beat well with the egg yolks, stir in the flour, sugar, cinnamon, grated lemon rind and the rum and mix well. You can do this in a food processor. Beat the egg whites until stiff, fold in and pour into a buttered and floured 25cm cake tin. Bake in the oven at",timer:2400},{title:"Serve",body:"Serve hot or cold dusted with icing sugar.",timer:0}],tip:"Original recipe: https://thehappyfoodie.co.uk/recipes/ricotta-cake-budino-di-ricotta"},
  {id:52923,photo:"https://www.themealdb.com/images/media/meals/wpputp1511812960.jpg",name:"Canadian Butter Tarts",emoji:"",xp:78,difficulty:"Medium",time:"4 min",category:"Baking",diets:["Vegetarian","Gluten-free"],macros:{calories:323,protein:3,carbs:44,fat:18,fiber:2},done:false,ingredients:["375g Shortcrust Pastry","2 large Eggs","175g Muscovado Sugar","100g Raisins","1 tsp Vanilla Extract","50g Butter","4 tsp Single Cream","50g Walnuts"],steps:[{title:"Preheat",body:"Preheat the oven to fan 170C/ conventional 190C/gas 5. Roll out the pastry on a lightly floured surface so it’s slightly thinner than straight from the pack. Then cut out 18-20 rounds with a 7.5cm fluted cutter, re-rolling the trimmings. Use the rounds to line two deep 12-hole ta",timer:0},{title:"Preheat",body:"Beat the eggs in a large bowl and combine with the rest of the ingredients except the walnuts. Tip this mixture into a pan and stir continuously for 3-4 minutes until the butter melts, and the mixture bubbles and starts to thicken. It should be thick enough to coat the back of a ",timer:240},{title:"Preheat",body:"Spoon the filling into the unbaked tart shells so it’s level with the pastry. Bake for 15-18 minutes until set and pale golden. Leave in the tin to cool for a few minutes before lifting out on to a wire rack. Serve warm or cold.",timer:1080}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1837/canadian-butter-tarts"},
  {id:53360,photo:"https://www.themealdb.com/images/media/meals/z1hz7z1765316430.jpg",name:"Caribbean Tamarind balls",emoji:"",xp:94,difficulty:"Medium",time:"40 min",category:"Baking",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:340,protein:6,carbs:39,fat:12,fiber:-1},done:false,ingredients:["16 ounces Tamarind Pulp","1 1/2 cups Sugar"],steps:[{title:"Mix",body:"Add tamarind pulp and 1 cup granulated sugar to a bowl and mash together with a spoon or fork. Take small amounts of the tamarind and sugar mix and shape them into small balls by rolling them in your hands. Make them the size of a marble or slightly bigger, as you like.",timer:0},{title:"Serve",body:"Add the remaining sugar to a flat surface, like a plate or a sheet pan. Roll the tamarind balls in granulated sugar until they're well-coated.",timer:0},{title:"Mix",body:"You can eat the tamarind balls immediately, or you can let them set for a few hours or overnight. Allowing them to set will give them a firmer texture and more crystallized sugar coating. Enjoy.",timer:0}],tip:"Original recipe: https://www.myforkinglife.com/tamarind-balls/#recipe"},
  {id:52897,photo:"https://www.themealdb.com/images/media/meals/vrspxv1511722107.jpg",name:"Carrot Cake",emoji:"",xp:134,difficulty:"Hard",time:"1 hr",category:"Baking",diets:["Vegetarian"],macros:{calories:326,protein:2,carbs:53,fat:11,fiber:-1},done:false,ingredients:["450ml Vegetable Oil","400g Plain Flour","2 tsp Bicarbonate Of Soda","550ml Sugar","5 Eggs","½ tsp Salt","2 tsp Cinnamon","500g grated Carrots","150g Walnuts","200g Cream Cheese","150g Caster Sugar","100g Butter"],steps:[{title:"Preheat",body:"For the carrot cake, preheat the oven to 160C/325F/Gas 3. Grease and line a 26cm/10in springform cake tin.",timer:0},{title:"Mix",body:"Mix all of the ingredients for the carrot cake, except the carrots and walnuts, together in a bowl until well combined. Stir in the carrots and walnuts.",timer:0},{title:"Mix",body:"Spoon the mixture into the cake tin and bake for 1 hour 15 minutes, or until a skewer inserted into the middle comes out clean. Remove the cake from the oven and set aside to cool for 10 minutes, then carefully remove the cake from the tin and set aside to cool completely on a co",timer:3600},{title:"Season",body:"Meanwhile, for the icing, beat the cream cheese, caster sugar and butter together in a bowl until fluffy. Spread the icing over the top of the cake with a palette knife.",timer:0}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/classic_carrot_cake_08513"},
  {id:52976,photo:"https://www.themealdb.com/images/media/meals/t3r3ka1560461972.jpg",name:"Cashew Ghoriba Biscuits",emoji:"",xp:95,difficulty:"Medium",time:"20 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:340,protein:18,carbs:23,fat:16,fiber:7},done:false,ingredients:["250g Cashew Nuts","100g Icing Sugar","2 Egg Yolks","2 tbs Orange Blossom Water","To Glaze Icing Sugar","100g Almonds"],steps:[{title:"Preheat",body:"Preheat the oven at 180 C / Gas 4. Line a baking tray with greaseproof paper.",timer:0},{title:"Mix",body:"In a bowl, mix the cashews and icing sugar. Add the egg yolks and orange blossom water and mix to a smooth homogeneous paste.",timer:0},{title:"Mix",body:"Take lumps of the cashew paste and shape into small balls. Roll the balls in icing sugar and transfer to the baking tray. Push an almond in the centre of each ghribia.",timer:0},{title:"Cook",body:"Bake until the biscuits are lightly golden, about 20 minutes. Keep an eye on them, they burn quickly.",timer:1200}],tip:"Original recipe: http://allrecipes.co.uk/recipe/40152/cashew-ghoriba-biscuits.aspx"},
  {id:52898,photo:"https://www.themealdb.com/images/media/meals/vqpwrv1511723001.jpg",name:"Chelsea Buns",emoji:"",xp:134,difficulty:"Hard",time:"30 min",category:"Baking",diets:["Vegetarian"],macros:{calories:324,protein:2,carbs:52,fat:17,fiber:1},done:false,ingredients:["500g White Flour","1 tsp Salt","7g Yeast","300ml Milk","40g Butter","1 Eggs","Dash Vegetable Oil","25g Butter","75g Brown Sugar","2 tsp Cinnamon","150g Dried Fruit","2 tbs Milk","2 tbs Caster Sugar"],steps:[{title:"Preheat",body:"Sift the flour and salt into a large bowl. Make a well in the middle and add the yeast.. Meanwhile, warm the milk and butter in a saucepan until the butter melts and the mixture is lukewarm.",timer:0},{title:"Mix",body:"Add the milk mixture and egg to the flour mixture and stir until the contents of the bowl come together as a soft dough. (You may need to add a little extra flour.). Tip the dough onto a generously floured work surface. Knead for five minutes, adding more flour if necessary, unti",timer:0},{title:"Preheat",body:"Lightly oil a bowl with a little of the vegetable oil. Place the dough into the bowl and turn until it is covered in the oil. Cover the bowl with cling film and set aside in a warm place for one hour, or until the dough has doubled in size.. Lightly grease a baking tray.",timer:0},{title:"Prep",body:"For the filling, knock the dough back to its original size and turn out onto a lightly floured work surface. Roll the dough out into a rectangle 0.5cm/¼in thick. Brush all over with the melted butter, then sprinkle over the brown sugar, cinnamon and dried fruit.. Roll the dough u",timer:1800},{title:"Preheat",body:"Preheat oven to 190C/375F/Gas 5.. Bake the buns in the oven for 20-25 minutes, or until risen and golden-brown.",timer:1500},{title:"Preheat",body:"Meanwhile, for the glaze, heat the milk and sugar in a saucepan until boiling. Reduce the heat and simmer for 2-3 minutes.. Remove the buns from the oven and brush with the glaze, then set aside to cool on a wire rack.",timer:180}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/chelsea_buns_95015"},
  {id:52910,photo:"https://www.themealdb.com/images/media/meals/qtqwwu1511792650.jpg",name:"Chinon Apple Tarts",emoji:"",xp:131,difficulty:"Hard",time:"20 min",category:"Baking",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:339,protein:9,carbs:43,fat:15,fiber:4},done:false,ingredients:["320g Puff Pastry","4 tbs Dark Brown Soft Sugar","3 Braeburn Apples","4 tbs Red Wine Jelly","100ml Creme Fraiche","1 tbs Icing Sugar","3 Cardamom"],steps:[{title:"Preheat",body:"To make the red wine jelly, put the red wine, jam sugar, star anise, clove, cinnamon stick, allspice, split vanilla pod and seeds in a medium saucepan. Stir together, then heat gently to dissolve the sugar. Turn up the heat and boil for 20 mins until reduced and syrupy. Strain in",timer:1200},{title:"Preheat",body:"Take the pastry out of the fridge and leave at room temperature for 10 mins, then unroll. Heat the grill to high and heat the oven to 180C/160C fan/gas 4. Cut out 2 x 13cm circles of pastry, using a plate as a guide, and place on a non-stick baking sheet. Sprinkle each circle wit",timer:600},{title:"Preheat",body:"Peel, quarter and core the apples, cut into 2mm-thin slices and arrange on top of the pastry. Sprinkle over the remaining sugar and pop in the oven for 20-25 mins until the pastry is cooked through and golden, and the apples are softened. Remove and allow to cool slightly. Warm 3",timer:1500},{title:"Preheat",body:"Tip the crème fraîche into a bowl, sift over the icing sugar and cardamom, and mix together. Carefully lift the warm tarts onto serving plates and serve with the cardamom crème fraîche.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chinon-apple-tarts"},
  {id:53262,photo:"https://www.themealdb.com/images/media/meals/04axct1763793018.jpg",name:"Adana kebab",emoji:"",xp:116,difficulty:"Hard",time:"3 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:360,protein:13,carbs:36,fat:20,fiber:8},done:false,ingredients:["2 large Romano Pepper","800g Lamb Mince","3  tablespoons Red Pepper Paste","1 tablespoon Pul Biber","3  tablespoons Sunflower Oil"],steps:[{title:"Mix",body:"Finely chop the peppers in a food processor, then tip them in a sieve and press into the sieve so that the peppers release all of their juices. Tip into a bowl along with the mince, red pepper paste, pul biber, 1½ tsp flaky sea salt, and 2 tbsp of the oil. Mix together, kneading ",timer:180},{title:"Preheat",body:"When ready to cook, heat the grill to high or an oven to 220C/200C fan/gas 6. Divide the mixture into 12 equal portions, around 85g each. If you’d like to skewer them, divide into 8 equal portions and roll into balls. Using wet hands, thread the balls onto the end of the skewers,",timer:0},{title:"Cook",body:"Gently brush each köfte with the remaining 1 tbsp oil and cook under the grill, on the top shelf for 10-12 mins, turning regularly, or cook in the oven for 16-18 mins, until crispy on the outside and juicy in the middle.",timer:720}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/adana-kebab"},
  {id:53265,photo:"https://www.themealdb.com/images/media/meals/8xuvhj1763794991.jpg",name:"Chilli ginger lamb chops",emoji:"",xp:71,difficulty:"Medium",time:"3 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:364,protein:21,carbs:40,fat:15,fiber:4},done:false,ingredients:["4 Cloves Crushed Garlic","1 tblsp Ginger","1 tblsp Lemon Juice","1 tblsp Olive Oil","1/2 tsp Chili Powder","1 tsp Cumin","8 Lamb Loin Chops"],steps:[{title:"Prep",body:"Put the garlic in a bowl with the ginger, lemon juice, oil, spices and seasoning. Blitz with a hand blender until smooth, then use to coat the lamb chops on both sides. Leave to marinate in the fridge for a couple of hours or overnight.",timer:0},{title:"Preheat",body:"Heat a barbecue until hot. Barbecue the chops over the coals for 3 mins on each side until cooked but still pink and juicy in the centre.",timer:180}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chilli-ginger-lamb-chops"},
  {id:53289,photo:"https://www.themealdb.com/images/media/meals/p9tebp1764118792.jpg",name:"Chorba Hamra bel Frik (Algerian Lamb, Tomato, and Freekeh Soup)",emoji:"",xp:159,difficulty:"Hard",time:"15 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:578,protein:28,carbs:43,fat:31,fiber:5},done:false,ingredients:["1 cup Freekeh","12 ounces Lamb","1 finely chopped Onion","1 tsp Black Pepper","1 tsp Paprika","1 tsp Ground Cinnamon","To taste Salt","3  tablespoons Vegetable Oil","1  bunch Cilantro","1  bunch Mint","1 Celery","14 oz jar Chickpeas","4 cups Water","1 Diced Zucchini","1 Diced Carrots","1 tablespoon Tomato Puree","3 Medium Tomato","1 Diced Potatoes"],steps:[{title:"Prepare",body:"Place freekeh in a small bowl and cover with cold water. Set aside.",timer:0},{title:"Preheat",body:"Combine lamb, onion, black pepper, paprika, cinnamon, and salt in a pot. Stir in oil, 1/2 the cilantro, 1/2 the mint, and celery stalk until combined. Simmer over low heat for 15 minutes. Stir in chickpeas; pour in just enough water to cover, and return to a simmer. Stir in zucch",timer:900},{title:"Mix",body:"Set a steamer over the pot; add tomatoes. Cover and steam tomatoes until soft, about 5 minutes. Crush tomatoes using a wooden spoon, so pulp drips into soup. Remove the steamer and discard leftover tomato peels.",timer:300},{title:"Simmer",body:"Add potato to soup and just enough water to cover. Simmer until potato is soft, about 10 minutes.",timer:600},{title:"Simmer",body:"Drain freekeh and add to soup. Simmer until soft, about 15 minutes. Remove celery stalk and discard. Sprinkle soup with remaining 1/2 cilantro and remaining 1/2 mint before serving.",timer:900}],tip:"Original recipe: https://www.allrecipes.com/recipe/264552/chorba-hamra-bel-frik-algerian-lamb-tomato-and-freekeh-soup/"},
  {id:53123,photo:"https://www.themealdb.com/images/media/meals/ttfxxn1762773067.jpg",name:"Fårikål (Norwegian National Dish)",emoji:"",xp:83,difficulty:"Medium",time:"3 hrs",category:"Comfort",diets:["Dairy-free"],macros:{calories:566,protein:31,carbs:31,fat:32,fiber:3},done:false,ingredients:["3 Lbs Lamb","1 head White Cabbage","3  tablespoons Whole black peppercorns","3 tsp Salt","1 1/2 cups Water","5 tablespoons Flour"],steps:[{title:"Prep",body:"Cut the lamb into large pieces.",timer:0},{title:"Prep",body:"Slice the cabbage into large wedges, keeping the core attached.",timer:0},{title:"Season",body:"Add a layer of lamb pieces to the bottom of a large pot, fatty side down. Sprinkle with peppercorns and salt. Add a layer of cabbage wedges on top. Repeat with more layers of lamb, peppercorns, and cabbage, ending with cabbage on top.",timer:0},{title:"Season",body:"Optional: Sprinkle a couple of tablespoons on top of the lamb for a thicker stew.",timer:0},{title:"Preheat",body:"Add water to the pot and bring to a boil. Cover and reduce heat. Cook on low heat for 2 – 3 hours, until the lamb gently falls away from the bone.",timer:10800},{title:"Serve",body:"Serve with boiled potatoes and fresh parsley, covering generously with the fårikål broth.",timer:0}],tip:"Original recipe: https://scandinaviancookbook.com/farikal-national-dish-of-norway/"},
  {id:53258,photo:"https://www.themealdb.com/images/media/meals/jyylmo1763790808.jpg",name:"Hot cumin lamb wrap with crunchy slaw & spicy mayo",emoji:"",xp:156,difficulty:"Hard",time:"4 min",category:"Mediterranean",diets:["Dairy-free"],macros:{calories:379,protein:14,carbs:25,fat:18,fiber:7},done:false,ingredients:["4 small Lamb Leg","2 tsp Olive Oil","1 tsp Ground Cumin","1 tablespoon Sugar","3  tablespoons White Wine Vinegar","2 Carrots","2 sliced Spring Onions","400g White Cabbage","5 Sweet Peppadew Peppers","3  tablespoons Mayonnaise","4 large Pita Bread"],steps:[{title:"Preheat",body:"Heat a griddle pan. Rub the lamb steaks with the oil, cumin and some seasoning. Griddle for about 3-4 mins on each side or until cooked to your liking. Place to one side on a plate to rest.",timer:240},{title:"Mix",body:"In a large bowl, stir the sugar into the vinegar until dissolved. Add the carrots, spring onions, cabbage and some seasoning, and toss together.",timer:0},{title:"Prep",body:"Blitz the whole peppers and the mayo in a food processor. Add a heap of the salad to each flatbread. Slice the lamb, trimming off any excess fat and lay on top of the salad, drizzling with the resting juices. Spoon over the mayo and scatter with a few of the sliced peppers. Roll ",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/hot-cumin-lamb-wrap-crunchy-slaw-spicy-mayo"},
  {id:53253,photo:"https://www.themealdb.com/images/media/meals/ampz9v1763787134.jpg",name:"Imam bayildi with BBQ lamb & tzatziki",emoji:"",xp:158,difficulty:"Hard",time:"20 min",category:"Mediterranean",diets:["Gluten-free"],macros:{calories:378,protein:13,carbs:25,fat:22,fiber:7},done:false,ingredients:["3 Aubergine","2 tablespoons Olive Oil","1 chopped Onion","2 cloves chopped Garlic","1 tsp Cinnamon","8 Tomato","Bunch Parsley","12 Lamb Loin Chops","Pinch Paprika","1 Lemon","150g Greek Yogurt","1/2 Cucumber","2 tbs chopped Mint"],steps:[{title:"Preheat",body:"Heat oven to 190C/170C fan/gas 5. Halve the aubergines lengthways and score the flesh side deeply, brush with a good layer of olive oil and put on a baking sheet. Roast for 20 mins or until the flesh is soft enough to scoop out.",timer:1200},{title:"Mix",body:"Fry the onion in a little oil until soft, add the garlic and cinnamon and fry for 1 min. Once the aubergines are cool enough to handle, scoop out the centres. Roughly chop the flesh and add it to the onions. Halve the tomatoes, scoop the seeds and juice into a sieve set over a bo",timer:60},{title:"Mix",body:"Lay the aubergine halves in a baking dish and divide the tomato mixture between them. Pour over the juice from the tomatoes, drizzle with more olive oil and bake for 30 mins until the aubergines have collapsed.",timer:1800},{title:"Mix",body:"Meanwhile, mix the tzatziki ingredients together and put in a small serving bowl.",timer:0},{title:"Cook",body:"Season the lamb with salt, black pepper and a pinch of paprika. Griddle, grill or barbecue for 3 mins on each side or until the fat is nicely browned, then put in a serving dish and squeeze over the lemon halves. Scatter the aubergines with parsley, then serve with the lamb and t",timer:180}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/imam-bayildi-bbq-lamb-tzatziki"},
  {id:52769,photo:"https://www.themealdb.com/images/media/meals/sxysrt1468240488.jpg",name:"Kapsalon",emoji:"",xp:70,difficulty:"Medium",time:"6 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:567,protein:32,carbs:37,fat:29,fiber:2},done:false,ingredients:["250 Grams Fries","500 Grams Doner Meat","Topping Garlic sauce","Topping Hotsauce","1 Bulb Lettuce","1 Tomato","3rd Cucumber","100 Grams Gouda cheese"],steps:[{title:"Preheat",body:"Cut the meat into strips. Heat oil in a pan and fry the strips for 6 minutes until it's ready.",timer:360},{title:"Cook",body:"Bake the fries until golden brown in a deep fryrer. When ready transfer to a backing dish. Make sure the fries are spread over the whole dish.",timer:0},{title:"Mix",body:"Cover the fries with a new layer of meat and spread evenly.",timer:0},{title:"Season",body:"Add a layer of cheese over the meat. You can also use grated cheese. When done put in the oven for a few minutes until the cheese is melted.",timer:0},{title:"Mix",body:"Chop the lettuce, tomato and cucumber in small pieces and mix together. for a basic salad. As extra you can add olives jalapenos and a red union.",timer:0},{title:"Serve",body:"Dived the salad over the dish and Serve with garlicsauce and hot sauce.",timer:0}],tip:"A classic Dutch dish."},
  {id:52974,photo:"https://www.themealdb.com/images/media/meals/8x09hy1560460923.jpg",name:"Keleya Zaara",emoji:"",xp:98,difficulty:"Medium",time:"5 min",category:"Mediterranean",diets:["Gluten-free"],macros:{calories:357,protein:19,carbs:38,fat:14,fiber:5},done:false,ingredients:["4 tbs Olive Oil","750g Lamb","1 1/2 tsp Saffron","1 Large Chopped Onion","25 ml Water","30g Parsley","1 tbs Butter","1 Lemon"],steps:[{title:"Preheat",body:"Heat the vegetable oil in a large frying pan over medium-high heat. Add the lamb and cook until browned on all sides, about 5 minutes. Season with saffron, salt and pepper to taste; stir in all but 4 tablespoons of the onion, and pour in the water. Bring to the boil, then cover, ",timer:300},{title:"Mix",body:"Uncover the pan, stir in the butter and allow the sauce reduce 5 to 10 minutes to desired consistency. Season to taste with salt and pepper, then pour into a serving dish. Sprinkle with the remaining chopped onions and parsley. Garnish with lemon wedges to serve.",timer:300}],tip:"Original recipe: http://allrecipes.co.uk/recipe/43723/keleya-zaara-tunisian-lamb-with-saffron.aspx"},
  {id:53257,photo:"https://www.themealdb.com/images/media/meals/lgmnff1763789847.jpg",name:"kofta burgers",emoji:"",xp:117,difficulty:"Hard",time:"6 min",category:"Mediterranean",diets:["No restrictions"],macros:{calories:373,protein:17,carbs:38,fat:14,fiber:6},done:false,ingredients:["1kg Lamb","2 Onion","1 Garlic Bulb","6 tablespoons Garam Masala","Bunch Coriander","1 tablespoon Chilli Sauce","8 Pita Bread","4 sliced Tomato","1/2 Red Cabbage","1 sliced Red Onions","Small pack Yogurt"],steps:[{title:"Mix",body:"Tip the mince into a large bowl (use a clean washing-up bowl if you don’t have anything big enough) with all the other burger ingredients and a good pinch of salt. Roll up your sleeves, get your hands into the mix and squelch everything together through your fingers until complet",timer:0},{title:"Preheat",body:"To cook, heat grill to its highest setting and lay the burgers in a single layer on a baking tray (you may need to do this in batches, depending on how big your tray is). Grill on the highest shelf for 5-6 mins on each side until browned and cooked through. Pile burgers onto a pl",timer:360}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/diy-kofta-burgers"},
  {id:53277,photo:"https://www.themealdb.com/images/media/meals/72fgzj1764109947.jpg",name:"Lamb & apricot meatballs",emoji:"",xp:149,difficulty:"Hard",time:"5 min",category:"Mediterranean",diets:["Dairy-free"],macros:{calories:342,protein:18,carbs:33,fat:17,fiber:6},done:false,ingredients:["2 tablespoons Olive Oil","2 chopped Red Onions","4 Cloves Crushed Garlic","2 tsp Ground Cumin","2 tsp Ground Coriander","400g Tinned Tomatos","1/2 teaspoon Sugar","10g Mint","500g Lamb Mince","8 Dried Apricots","50g Breadcrumbs","To serve Pita Bread"],steps:[{title:"Preheat",body:"Heat 2 tsp oil in a pan and soften the onions for 5 mins. Add the garlic and spices and cook for a few mins more. Spoon half the onion mixture into a bowl and set aside to cool. Add the tomatoes, sugar and seasoning to the remaining onions in the pan and simmer for about 10 mins ",timer:300},{title:"Mix",body:"Meanwhile, add the mint, lamb, apricots and breadcrumbs to the cooled onions, season and mix well with your hands. Shape into little meatballs.",timer:0},{title:"Preheat",body:"Heat the rest of the oil in a non-stick pan and fry the meatballs until golden (in batches if you need to). Stir in the sauce with a splash of water and gently cook everything for a few mins until the meatballs are cooked through. Serve with pitta bread and salad.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/lamb-apricot-meatballs"},
  {id:53009,photo:"https://www.themealdb.com/images/media/meals/rjhf741585564676.jpg",name:"Lamb and Lemon Souvlaki",emoji:"",xp:75,difficulty:"Medium",time:"30 min",category:"Mediterranean",diets:["Dairy-free"],macros:{calories:352,protein:21,carbs:35,fat:22,fiber:4},done:false,ingredients:["2 cloves Garlic","2 tsp Sea Salt","4 tbs Olive Oil","Zest and juice of 1 Lemon","1 tbs Dill","750g Lamb Leg","To serve Pita Bread"],steps:[{title:"Mix",body:"Pound the garlic with sea salt in a pestle and mortar (or use a small food processor), until the garlic forms a paste. Whisk together the oil, lemon juice, zest, dill and garlic. Mix in the lamb and combine well. Cover and marinate for at least 2 hrs or overnight in the fridge. I",timer:0},{title:"Preheat",body:"If you’ve prepared the lamb the previous day, take it out of the fridge 30 mins before cooking. Thread the meat onto the soaked or metal skewers. Heat the grill to high or have a hot griddle pan or barbecue ready. Cook the skewers for 2-3 mins on each side, basting with the remai",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/lamb-lemon-dill-souvlaki"},
  {id:52877,photo:"https://www.themealdb.com/images/media/meals/sxrpws1511555907.jpg",name:"Lamb and Potato pie",emoji:"",xp:96,difficulty:"Medium",time:"40 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:558,protein:29,carbs:47,fat:28,fiber:6},done:false,ingredients:["500g Lamb Shoulder","1 tbls Flour","Dash Vegetable Oil","1 sliced Onion","2 sliced Carrots","350ml/12fl Vegetable Stock","500g Potatoes","450g Shortcrust Pastry","To Glaze Eggs"],steps:[{title:"Prepare",body:"Dust the meat with flour to lightly coat.",timer:0},{title:"Preheat",body:"Heat enough vegetable oil in a large saucepan to fill the base, and fry the onion and meat until lightly browned. Season with salt and pepper.",timer:0},{title:"Season",body:"Add the carrots, stock and more seasoning to taste.",timer:0},{title:"Preheat",body:"Bring to the boil, cover and reduce the heat to a simmer. Simmer for at least an hour or until the meat is tender. Take your time cooking the meat, the longer you leave it to cook, the better the flavour will be.",timer:0},{title:"Preheat",body:"Preheat the oven to 180C/350F/Gas 4.",timer:0},{title:"Combine",body:"Add the drained potato cubes to the lamb.",timer:0},{title:"Mix",body:"Turn the mixture into a pie dish or casserole and cover with the shortcrust pastry. Make three slits in the top of the pastry to release any steam while cooking.",timer:0},{title:"Cook",body:"Brush with beaten egg and bake for about 40 minutes, until the pastry is golden brown.",timer:2400}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/lambandpotatopie_83913"},
  {id:52805,photo:"https://www.themealdb.com/images/media/meals/xrttsx1487339558.jpg",name:"Lamb Biryani",emoji:"",xp:120,difficulty:"Hard",time:"1 hr",category:"Indian",diets:["Gluten-free"],macros:{calories:450,protein:13,carbs:44,fat:17,fiber:8},done:false,ingredients:["12 Cashew nuts","½ tbsp Khus khus","½ tbsp Cumin seeds","3 sliced thinly Onions","2 tsp Ginger garlic paste","4 whole Garlic","Leaves Mint","Leaves Cilantro","½ tsp dissolved in ½ cup warm milk Saffron","2 tbsp Ghee","2 Cups Basmati rice","½ cup Full fat yogurt","1 tbsp Cumin Seeds","½ Bay leaf","1 thin piece Cinnamon","3 Cloves","2 Cardamom","1 lb Lamb","1 tsp Red Chilli powder","1 tbsp Biryani masala"],steps:[{title:"Prep",body:"Grind the cashew, poppy seeds and cumin seeds into a smooth paste, using as little water as possible. Set aside. . Deep fry the sliced onions when it is hot. Don’t overcrowd the oil. When the onions turn light brown, remove from oil and drain on paper towel. The fried onion will ",timer:0},{title:"Preheat",body:"Meanwhile, take a big wide pan, add oil in medium heat, add the sliced onions, add the blended paste, to it add the green chillies, ginger garlic paste and garlic and fry for a minute.. Then add the tomatoes and sauté them well till they are cooked and not mushy.. Then to it add ",timer:0},{title:"Preheat",body:"Add the yogurt and mix well. I always move the skillet away from the heat when adding yogurt which prevents it from curdling.. Now after returning the skillet back to the stove, add the washed lamb and salt and ½ cup water and mix well. Cook for 1 hour and cook it covered in medi",timer:3600},{title:"Preheat",body:"Now, the layering starts. To the lamb, pat and level it. Add the drained hot rice on the top of it. Garnish with fried onions, ghee, mint, coriander leaves and saffron dissolved in milk.. Cover the dish and bake in a 350f oven for 15 minutes or till the cooked but not mushy. Or c",timer:900},{title:"Preheat",body:"You can skip biryani masala if you don’t have and add just garam masala (1 tsp and red chilli powder – 3 tsp instead of 1 tsp). 3. If it is spicy in the end, squeeze some lemon, it will reduce the heat and enhance the flavors also.",timer:0}],tip:"Original recipe: http://www.relishthebite.com/restaurant-style-lamb-biryani/"},
  {id:53083,photo:"https://www.themealdb.com/images/media/meals/kos9av1699014767.jpg",name:"Lamb Pilaf (Plov)",emoji:"",xp:123,difficulty:"Hard",time:"1 hr",category:"Comfort",diets:["Gluten-free"],macros:{calories:578,protein:28,carbs:46,fat:30,fiber:4},done:false,ingredients:["50g Lamb","120g Prunes","1 tbs Lemon Juice","2 tbs Butter","1 chopped Onion","450g Lamb","2 cloves Garlic","600ml Vegetable Stock","2 cups Rice","Pinch Saffron","Garnish Parsley"],steps:[{title:"Prep",body:"Place the raisins and prunes into a small bowl and pour over enough water to cover. Add lemon juice and let soak for at least 1 hour. Drain. Roughly chop the prunes.",timer:3600},{title:"Preheat",body:"Meanwhile, heat the butter in a large pan, add the onion, and cook for 5 minutes. Add cubed lamb, ground lamb, and crushed garlic cloves. Fry for 5 minutes, stirring constantly until browned.",timer:300},{title:"Preheat",body:"Pour 2/3 cup (150 milliliters) of stock into the pan. Bring to a boil, then lower the heat, cover, and simmer for 1 hour, or until the lamb is tender.",timer:3600},{title:"Mix",body:"Add the remaining stock and bring to a boil. Add rinsed long-grain white rice and a large pinch of saffron. Stir, then cover, and simmer for 15 minutes, or until the rice is tender.",timer:900},{title:"Preheat",body:"Add the drained raisins, drained chopped prunes, and salt and pepper to taste. Heat through for a few minutes, then turn out onto a warmed serving dish and garnish with sprigs of flat-leaf parsley.",timer:0}],tip:"Original recipe: https://www.thespruceeats.com/russian-lamb-pilaf-plov-recipe-1137309"},
  {id:52808,photo:"https://www.themealdb.com/images/media/meals/vvstvq1487342592.jpg",name:"Lamb Rogan josh",emoji:"",xp:115,difficulty:"Hard",time:"5 min",category:"Indian",diets:["Gluten-free"],macros:{calories:429,protein:12,carbs:52,fat:13,fiber:5},done:false,ingredients:["2 quartered Onion","4 tbsp Sunflower Oil","4 cloves Garlic","Thumb sized peeled and very finely grated Ginger","2 tbsp Madras Paste","2 tsp Paprika","1 cinnamon stick","6 bashed to break shells Cardamom","4 Cloves","2 Bay Leaf","1 tbsp Tomato Purée","1kg cubed Lamb","150ml Greek yogurt","Garnish chopped Coriander"],steps:[{title:"Preheat",body:"Put the onions in a food processor and whizz until very finely chopped. Heat the oil in a large heavy-based pan, then fry the onion with the lid on, stirring every now and then, until it is really golden and soft. Add the garlic and ginger, then fry for 5 mins more.",timer:300},{title:"Preheat",body:"Tip the curry paste, all the spices and the bay leaves into the pan, with the tomato purée. Stir well over the heat for about 30 secs, then add the meat and 300ml water. Stir to mix, turn down the heat, then add the yogurt.",timer:0},{title:"Serve",body:"Cover the pan, then gently simmer for 40-60 mins until the meat is tender and the sauce nice and thick. Serve scattered with coriander, with plain basmati or pilau rice.",timer:3600}],tip:"Original recipe: http://www.bbcgoodfood.com/recipes/9643/onepan-rogan-josh"},
  {id:52843,photo:"https://www.themealdb.com/images/media/meals/yuwtuu1511295751.jpg",name:"Lamb Tagine",emoji:"",xp:147,difficulty:"Hard",time:"1 hr",category:"Mediterranean",diets:["Gluten-free"],macros:{calories:374,protein:15,carbs:22,fat:14,fiber:3},done:false,ingredients:["2 tblsp Olive Oil","1 finely sliced Onion","2 chopped Carrots","500g Lamb Leg","2 cloves minced Garlic","½ tsp Cumin","½ tsp Ginger","¼ tsp Saffron","1 tsp Cinnamon","1 tblsp Honey","100g Apricot","1 Vegetable Stock Cube","1 medium chopped Butternut Squash","Steamed Couscous","Chopped Parsley"],steps:[{title:"Preheat",body:"Heat the olive oil in a heavy-based pan and add the onion and carrot. Cook for 3- 4 mins until softened.",timer:240},{title:"Mix",body:"Add the diced lamb and brown all over. Stir in the garlic and all the spices and cook for a few mins more or until the aromas are released.",timer:0},{title:"Mix",body:"Add the honey and apricots, crumble in the stock cube and pour over roughly 500ml boiling water or enough to cover the meat. Give it a good stir and bring to the boil. Turn down to a simmer, put the lid on and cook for 1 hour.",timer:3600},{title:"Mix",body:"Remove the lid and cook for a further 30 mins, then stir in the squash. Cook for 20 – 30 mins more until the squash is soft and the lamb is tender. Serve alongside rice or couscous and sprinkle with parsley and pine nuts, if using.",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/2303638/family-meals-easy-lamb-tagine-"},
  {id:52782,photo:"https://www.themealdb.com/images/media/meals/qtwtss1468572261.jpg",name:"Lamb tomato and sweet spices",emoji:"",xp:112,difficulty:"Hard",time:"10 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:357,protein:14,carbs:38,fat:21,fiber:7},done:false,ingredients:["2 tbsp olive oil","4cm piece finely chopped ginger","2 cloves peeled and chopped garlic","800g peeled and chopped tomatoes","2 tbsp lemon juice","1 tsp caster sugar","50 vine leaves","1 large fennel bulb","400g lamb mince","1 medium onion","1 small peeled and coarsely grated potatoes","2 tbsp basmati rice","2 tbsp chopped parsley","2 tbsp chopped coriander","1 tbsp lemon juice","2 cloves garlic","½ tsp ground clove","½ tsp ground cinnamon","2 medium tomatoes"],steps:[{title:"Serve",body:"Use pickled vine leaves here, preserved in brine. Small delicate leaves are better than the large bristly ones but, if only large leaves are to hand, then trim them to roughly 12 by 12 cms so that you don't get too many layers of leaves around the filling. And remove any stalks. ",timer:600},{title:"Serve",body:"Basmati rice with butter and pine nuts is an ideal accompaniment. Couscous is great, too. Serves four.",timer:0},{title:"Mix",body:"First make the filling. Put all the ingredients, apart from the tomatoes, in a bowl. Cut the tomatoes in half, coarsely grate into the bowl and discard the skins. Add half a teaspoon of salt and some black pepper, and stir. Leave on the side, or in the fridge, for up to a day. Be",timer:0},{title:"Preheat",body:"To make the sauce, heat the oil in a medium pan. Add the ginger and garlic, cook for a minute or two, taking care not to burn them, then add the tomato, lemon juice and sugar. Season, and simmer for 20 minutes.",timer:1200},{title:"Prep",body:"While the sauce is bubbling away, prepare the vine leaves. Use any torn or broken leaves to line the base of a wide, heavy saucepan. Trim any leaves from the fennel, cut it vertically into 0.5cm-thick slices and spread over the base of the pan to cover completely.",timer:0},{title:"Combine",body:"Lay a prepared vine leaf (see intro) on a work surface, veiny side up. Put two teaspoons of filling at the base of the leaf in a 2cm-long by 1cm-wide strip. Fold the sides of the leaf over the filling, then roll it tightly from bottom to top, in a cigar shape. Place in the pan, s",timer:0},{title:"Preheat",body:"Pour the sauce over the leaves (and, if needed, add water just to cover). Place a plate on top, to weigh the leaves down, then cover with a lid. Bring to a boil, reduce the heat and cook on a bare simmer for 70 minutes. Most of the liquid should evaporate. Remove from the heat, a",timer:4200}],tip:"Original recipe: http://www.ottolenghi.co.uk/recipes/meat/lamb-tomato-and-sweet-spices-shop"},
  {id:53010,photo:"https://www.themealdb.com/images/media/meals/k420tj1585565244.jpg",name:"Lamb Tzatziki Burgers",emoji:"",xp:134,difficulty:"Hard",time:"10 min",category:"Mediterranean",diets:["No restrictions"],macros:{calories:343,protein:17,carbs:32,fat:19,fiber:7},done:false,ingredients:["25g Bulgur Wheat","500g Lamb Mince","1 tsp Cumin","1 tsp Coriander","1 tsp Paprika","1 clove finely chopped Garlic","For frying Olive Oil","4 Bun","Grated Cucumber","200g Greek Yogurt","2 tbs Mint"],steps:[{title:"Simmer",body:"Tip the bulghar into a pan, cover with water and boil for 10 mins. Drain really well in a sieve, pressing out any excess water.",timer:600},{title:"Mix",body:"To make the tzatziki, squeeze and discard the juice from the cucumber, then mix into the yogurt with the chopped mint and a little salt.",timer:0},{title:"Cook",body:"Work the bulghar into the lamb with the spices, garlic (if using) and seasoning, then shape into 4 burgers. Brush with a little oil and fry or barbecue for about 5 mins each side until cooked all the way through. Serve in the buns (toasted if you like) with the tzatziki, tomatoes",timer:300}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/lamb-burgers-tzatziki"},
  {id:52884,photo:"https://www.themealdb.com/images/media/meals/uttrxw1511637813.jpg",name:"Lancashire hotpot",emoji:"",xp:94,difficulty:"Medium",time:"8 min",category:"Comfort",diets:["No restrictions"],macros:{calories:555,protein:33,carbs:31,fat:31,fiber:4},done:false,ingredients:["100g Butter","900g Lamb","3 Lamb Kidney","2 medium Onions","4 sliced Carrots","25g Plain Flour","2 tsp Worcestershire Sauce","500ml Chicken Stock","2 Bay Leaves","900g Potatoes"],steps:[{title:"Preheat",body:"Heat oven to 160C/fan 140C/gas 3. Heat some dripping or butter in a large shallow casserole dish, brown the lamb in batches, lift to a plate, then repeat with the kidneys.",timer:0},{title:"Preheat",body:"Fry the onions and carrots in the pan with a little more dripping until golden. Sprinkle over the flour, allow to cook for a couple of mins, shake over the Worcestershire sauce, pour in the stock, then bring to the boil. Stir in the meat and bay leaves, then turn off the heat. Ar",timer:0},{title:"Cook",body:"Remove the lid, brush the potatoes with a little more dripping, then turn the oven up to brown the potatoes, or finish under the grill for 5-8 mins until brown.",timer:480}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/9099/lancashire-hotpot"},
  {id:52880,photo:"https://www.themealdb.com/images/media/meals/vssrtx1511557680.jpg",name:"McSinghs Scotch pie",emoji:"",xp:105,difficulty:"Hard",time:"30 min",category:"Comfort",diets:["No restrictions"],macros:{calories:579,protein:31,carbs:33,fat:25,fiber:5},done:false,ingredients:["2 tsp Cumin","1 tbs Rapeseed Oil","2 finely chopped Red Onions","6 Garlic Clove","3 finely chopped Green Chilli","1 finely chopped Red Pepper","1 tsp Nutmeg","2 tsp Coriander","1kg Lamb Mince","1 tsp Pepper","3 tbs Coriander","340g Plain Flour","½ tsp Salt","90 ml Milk","150g Lard","Beaten Egg Yolks"],steps:[{title:"Preheat",body:"Heat a large frying pan and toast the cumin seeds for a few minutes, then set aside. Heat the oil in the same pan and fry the onion, garlic, chilli, pepper and a good pinch of salt for around eight minutes, until there is no moisture left. Remove from the heat, stir in the toaste",timer:0},{title:"Preheat",body:"Preheat the oven to 200C/400F/Gas 6 and generously grease a 20cm/8in diameter loose-bottomed or springform round cake tin with lard.. To make the pastry, sift the flour and salt in a large bowl and make a well in the centre.",timer:0},{title:"Preheat",body:"Put the milk, lard and 90ml/3fl oz of water in a saucepan and heat gently. When the lard has melted, increase the heat and bring to the boil.. Pour the boiling liquid into the flour, and use a wooden spoon to combine until cool enough to handle. Bring together into a ball.",timer:0},{title:"Serve",body:"Dust a work surface with flour and, working quickly, knead the dough briefly – it will be soft and moist. Set aside a third of the pastry and roll the rest out on a well-floured surface. Line the pie dish with the pastry, pressing it right up the sides until it pokes just over th",timer:0},{title:"Preheat",body:"Brush the top of the pie with a little beaten egg yolk, and bake in the preheated oven for 30 minutes (put a tray on the shelf below to catch any drips). Then reduce the temperature to 160C/325F/Gas 3 and cook for a further 1¼ hours until golden-brown. Leave to cool completely be",timer:1800}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/mcsinghs_scotch_pie_98356"},
  {id:52783,photo:"https://www.themealdb.com/images/media/meals/qtqvys1468573168.jpg",name:"Rigatoni with fennel sausage sauce",emoji:"",xp:140,difficulty:"Hard",time:"10 min",category:"Italian",diets:["Gluten-free","Dairy-free"],macros:{calories:510,protein:16,carbs:64,fat:26,fiber:5},done:false,ingredients:["2½ tbsp olive oil","6 cut into 1.5cm-thick slices Italian fennel sausages","1 large peeled and chopped onion","1 trimmed and roughly chopped; reserve any fronds to garnish fennel bulb","½ tsp smoky paprika","1 clove, peeled and sliced garlic","2 tsp lightly toasted and then gently crushed fennel seeds","100ml red wine","400g tinned chopped tomatoes","½ tsp caster sugar","50g cut in half lengthways pitted black olives","500g rigatoni","30g roughly crumbled into 0.5cm pieces pecorino","1  rinsed and patted dry anchovy fillet","1 clove, peeled and crushed garlic","60ml olive oil","50g torn basil leaves"],steps:[{title:"Preheat",body:"Heat a tablespoon of oil in a large saute pan for which you have a lid. Add the sausage pieces and fry on a medium-high heat for 10 minutes, stirring regularly, until golden-brown all over. Transfer the sausages to a plate, then add the onion and fennel to the hot pan and fry for",timer:600},{title:"Preheat",body:"Bring a large pot of salted water to a boil, add the pasta and cook for 12-14 minutes (or according to the instructions on the packet), until al dente. Meanwhile, reheat the sauce. Drain the pasta, return it to the pot, stir in a tablespoon of oil, then divide between the bowls.",timer:840},{title:"Mix",body:"Put all the pesto ingredients except the basil in the small bowl of a food processor. Add a tablespoon of water and blitz to a rough paste. Add the basil, then blitz until just combined (the pesto has a much better texture if the basil is not overblended).",timer:0},{title:"Prep",body:"Spoon over the ragù and top with a spoonful of pesto. Finish with a sprinkling of chopped fennel fronds, if you have any, and serve at once.",timer:0}],tip:"Original recipe: http://www.ottolenghi.co.uk/recipes/meat/rigatoni-with-fennel-sausage-sauce-and-pecorino-and-anchovy-pesto-shop"},
  {id:53260,photo:"https://www.themealdb.com/images/media/meals/gr4lo51763791826.jpg",name:"Slow-roast lamb with cinnamon, fennel & citrus",emoji:"",xp:98,difficulty:"Medium",time:"20 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:351,protein:18,carbs:35,fat:21,fiber:6},done:false,ingredients:["1 Lamb Leg","Zest and juice of 1 Lemon","4 tablespoons Olive Oil","2 tablespoons Clear Honey","1 tablespoon Cinnamon","1 tablespoon Fennel Seeds","1 tablespoon Ground Cumin","3 Cloves Crushed Garlic"],steps:[{title:"Rest",body:"Put the lamb into a large food bag with all the juice and marinate overnight.",timer:0},{title:"Preheat",body:"The next day, take the lamb out of the fridge 1 hr before you want to cook it. Heat oven to 220C/200C fan/gas 7. Take the lamb out of the marinade (reserve remaining marinade) and pat dry. Rub with half the oil and roast for 15-20 mins until browned. Remove lamb and reduce oven t",timer:1200},{title:"Mix",body:"Mix the zests, remaining oil, honey, spices and garlic with plenty of seasoning. Lay a large sheet of baking parchment on a large sheet of foil. Sit the lamb leg on top, rub all over with the paste and pull up the sides of the foil. Drizzle marinade into base, and scrunch foil to",timer:0},{title:"Cook",body:"Roast for 4 hrs, until very tender. Rest, still wrapped, for 30 mins. Unwrap and serve with juices.",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/slow-roast-lamb-cinnamon-fennel-citrus"},
  {id:53175,photo:"https://www.themealdb.com/images/media/meals/9kwatm1763327074.jpg",name:"Spanish-style slow-cooked lamb shoulder & beans",emoji:"",xp:123,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:556,protein:32,carbs:39,fat:32,fiber:4},done:false,ingredients:["2.5kg Lamb Shoulder","1 tblsp Olive Oil","2 chopped Onion","4 Chopped Carrots","1 Garlic Bulb","500ml Chicken Stock","1200g Butter Beans","450g Roasted pepper","300g Black Olives","4 tablespoons Parsley","4 Cloves Crushed Garlic","1 tablespoon Hot smoked paprika","4 tablespoons Olive Oil","1/2 teaspoon Rosemary"],steps:[{title:"Mix",body:"To make the spice mix, combine all of the ingredients together with a large pinch of salt. Slash the lamb shoulder all over with a sharp knife and rub in. If you have the time, marinate for up to 24 hrs, but this is not essential.",timer:0},{title:"Preheat",body:"Heat the oven to 150C/130C fan/gas 2. Heat the oil in a large flameproof casserole dish or roasting tin over a medium-high heat, add the onions, carrots and garlic and sizzle for 5 mins until the onions and carrots are softened. Pour over the stock, then bring to the boil. Nestle",timer:300},{title:"Mix",body:"Uncover and transfer the lamb to a plate using tongs. Stir the beans, peppers and olives through the stock in the pan, sit the lamb back on top and return to the oven, uncovered, for 1 hr 30 mins until the lamb is cooked through. Transfer the lamb to a board and shred using two f",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/spanish-style-slow-cooked-lamb-shoulder-beans"},
  {id:53008,photo:"https://www.themealdb.com/images/media/meals/u55lbp1585564013.jpg",name:"Stuffed Lamb Tomatoes",emoji:"",xp:156,difficulty:"Hard",time:"10 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:356,protein:16,carbs:31,fat:20,fiber:7},done:false,ingredients:["4 large Tomatoes","Pinch Sugar","4 tbs Olive Oil","1 chopped Onion","2 finely chopped Garlic Clove","200g Lamb","1 tbs Cinnamon","2 tbs chopped Tomato Puree","50g Rice","100ml Chicken Stock","4 tbs Dill","2 tbs Chopped Parsley","1 tbs Mint"],steps:[{title:"Preheat",body:"Heat oven to 180C/160C fan/gas 4. Slice the tops off the tomatoes and reserve. Scoop out most of the pulp with a teaspoon, being careful not to break the skin. Finely chop the pulp, and keep any juices. Sprinkle the insides of the tomatoes with a little sugar to take away the aci",timer:0},{title:"Preheat",body:"Heat 2 tbsp olive oil in a large frying pan, add the onion and garlic, then gently cook for about 10 mins until soft but not coloured. Add the lamb, cinnamon and tomato purée, turn up the heat, then fry until the meat is browned. Add the tomato pulp and juice, the rice and the st",timer:600},{title:"Cook",body:"Stuff the tomatoes up to the brim, top tomatoes with their lids, drizzle with 2 tbsp more olive oil, sprinkle 3 tbsp water into the tray, then bake for 35 mins. Serve with salad and crusty bread, hot or cold.",timer:2100}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/stuffed-tomatoes-lamb-mince-dill-rice"},
  {id:52972,photo:"https://www.themealdb.com/images/media/meals/t8mn9g1560460231.jpg",name:"Tunisian Lamb Soup",emoji:"",xp:154,difficulty:"Hard",time:"5 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:357,protein:17,carbs:32,fat:20,fiber:8},done:false,ingredients:["500g Lamb Mince","2 cloves minced Garlic","1 Onion","300g Spinach","3 tbs Tomato Puree","1 tbs Cumin","1 Litre Chicken Stock","3 tsp Harissa Spice","400g Chickpeas","1/2 Lemon Juice","150g Macaroni","Pinch Salt","Pinch Pepper"],steps:[{title:"Preheat",body:"Add the lamb to a casserole and cook over high heat. When browned, remove from the heat and set aside.",timer:0},{title:"Preheat",body:"Keep a tablespoon of fat in the casserole and discard the rest. Reduce to medium heat then add the garlic, onion and spinach and cook until the onion is translucent and the spinach wilted or about 5 minutes.",timer:300},{title:"Preheat",body:"Return the lamb to the casserole with the onion-spinach mixture, add the tomato puree, cumin, harissa, chicken, chickpeas, lemon juice, salt and pepper in the pan. Simmer over low heat for about 20 minutes.",timer:1200},{title:"Cook",body:"Add the pasta and cook for 15 minutes or until pasta is cooked.",timer:900}],tip:"Original recipe: http://allrecipes.co.uk/recipe/16694/tunisian-lamb-soup.aspx"},
  {id:52848,photo:"https://www.themealdb.com/images/media/meals/vxuyrx1511302687.jpg",name:"Bean & Sausage Hotpot",emoji:"",xp:35,difficulty:"Easy",time:"10 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:579,protein:29,carbs:43,fat:30,fiber:3},done:false,ingredients:["8 large Sausages","1 Jar Tomato Sauce","1200g Butter Beans","1 tbls Black Treacle","1 tsp English Mustard"],steps:[{title:"Cook",body:"In a large casserole, fry the sausages until brown all over – about 10 mins.",timer:600},{title:"Mix",body:"Add the tomato sauce, stirring well, then stir in the beans, treacle or sugar and mustard. Bring to the simmer, cover and cook for 30 mins. Great served with crusty bread or rice.",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/339607/bean-and-sausage-hotpot"},
  {id:52939,photo:"https://www.themealdb.com/images/media/meals/ussyxw1515364536.jpg",name:"Callaloo Jamaican Style",emoji:"",xp:94,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:558,protein:31,carbs:43,fat:31,fiber:5},done:false,ingredients:["1  bunch Kale","2 strips Bacon","3 cloves Chopped Garlic","1 medium Onion","1/2 tsp Paprika","1 Sprig Thyme","1 Tomato","1 Red Pepper","4 Banana","Splash Vegetable Oil"],steps:[{title:"Prep",body:"Cut leaves and soft stems from the kale branches, them soak in a bowl of cold water for about 5-10 minutes or until finish with prep.. Proceed to slicing the onions, mincing the garlic and dicing the tomatoes. Set aside.",timer:600},{title:"Mix",body:"Remove kale from water cut in chunks.. Place bacon on saucepan and cook until crispy. Then add onions, garlic, thyme, stir for about a minute or more.",timer:0},{title:"Preheat",body:"Add tomatoes; scotch bonnet pepper, smoked paprika. Sauté for about 2-3 more minutes.. Finally add vegetable, salt, mix well, and steamed for about 6-8 minutes or until leaves are tender. Add a tiny bit of water as needed. Adjust seasonings and turn off the heat.",timer:480},{title:"Prep",body:"Using a sharp knife cut both ends off the plantain. This will make it easy to grab the skin of the plantains. Slit a shallow line down the long seam of the plantain; peel only as deep as the peel. Remove plantain peel by pulling it back.. Slice the plantain into medium size lengt",timer:0},{title:"Preheat",body:"Coat a large frying pan with cooking oil spray. Spray the tops of the plantains with a generous layer of oil spray and sprinkle with salt, freshly ground pepper.. Let the plantains \"fry\" on medium heat, shaking the frying pan to redistribute them every few minutes.",timer:0},{title:"Cook",body:"As the plantains brown, continue to add more cooking oil spray, salt and pepper (if needed) until they have reached the desired color and texture.. Remove and serve with kale.",timer:0}],tip:"Original recipe: https://www.africanbites.com/callaloo-jamaican-style/"},
  {id:52969,photo:"https://www.themealdb.com/images/media/meals/gpz67p1560458984.jpg",name:"Chakchouka ",emoji:"",xp:157,difficulty:"Hard",time:"3 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:352,protein:18,carbs:22,fat:15,fiber:6},done:false,ingredients:["4 Tomatoes","2 tbs Olive Oil","1 Diced Onion","1 sliced Red Pepper","1 sliced Green Pepper","3 Cloves Crushed Garlic","1 tsp Cumin","1 tsp Paprika","3/4 teaspoon Salt","1/2 teaspoon Chili Powder","4 Eggs"],steps:[{title:"Preheat",body:"In a large cast iron skillet or sauté pan with a lid, heat oil over medium high heat. Add the onion and sauté for 2-3 minutes, until softened.",timer:180},{title:"Cook",body:"Add the peppers and garlic, and sauté for an additional 3-5 minutes. Add the tomatoes, cumin, paprika, salt, and chili powder.",timer:300},{title:"Preheat",body:"Mix well and bring the mixture to a simmer. Reduce the heat to medium low and continue to simmer, uncovered, 10-15 minutes until the mixture has thickened to your desired consistency.",timer:900},{title:"Mix",body:"(Taste the sauce at this point and adjust for salt and spice, as desired.) Using the back of a spoon, make four craters in the mixture, large enough to hold an egg. Crack one egg into each of the craters.",timer:0},{title:"Serve",body:"Cover the skillet and simmer for 5-7 minutes, until the eggs have set. Serve immediately with crusty bread or pita.",timer:420}],tip:"Original recipe: https://www.curiouscuisiniere.com/chakchouka/"},
  {id:52907,photo:"https://www.themealdb.com/images/media/meals/wvpvsu1511786158.jpg",name:"Duck Confit",emoji:"",xp:108,difficulty:"Hard",time:"2 hrs",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:561,protein:30,carbs:36,fat:31,fiber:5},done:false,ingredients:["Handful Sea Salt","4 Bay Leaf","4 cloves Garlic","Handful Thyme","4 Duck Legs","100ml White Wine"],steps:[{title:"Season",body:"The day before you want to make the dish, scatter half the salt, half the garlic and half of the herbs over the base of a small shallow dish. Lay the duck legs, skin-side up, on top, then scatter over the remaining salt, garlic and herbs. Cover the duck and refrigerate overnight.",timer:0},{title:"Preheat",body:"Pour the wine into a saucepan that will snugly fit the duck legs in a single layer. Brush the salt off the duck legs and place them, skin-side down, in the wine. Cover the pan with a lid and place over a medium heat. As soon as the wine starts to bubble, turn the heat down to the",timer:7200},{title:"Cook",body:"The duck legs are now cooked and can be eaten immediately – or you can follow the next step if you like them crisp. If you are preparing ahead, pack the duck legs tightly into a plastic container or jar and pour over the fat, but not the liquid at the bottom of the pan. Cover and",timer:0},{title:"Preheat",body:"To reheat and crisp up the duck legs, heat oven to 220C/fan 200C/gas 7. Remove the legs from the fat and place them, skin-side down, in an ovenproof frying pan. Roast for 30-40 mins, turning halfway through, until brown and crisp. Serve with the reheated gravy, a crisp salad and ",timer:2400}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/2085/barneys-confit-of-duck"},
  {id:52815,photo:"https://www.themealdb.com/images/media/meals/vwwspt1487394060.jpg",name:"French Lentils With Garlic and Thyme",emoji:"",xp:86,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:576,protein:35,carbs:39,fat:30,fiber:4},done:false,ingredients:["3 tablespoons Olive Oil","1 Onion","2 cloves Garlic","1 Carrots","2 1/4 cups French Lentils","1 teaspoon Thyme","3 Bay Leaf","1 tablespoon Salt","2 sticks Celery"],steps:[{title:"Preheat",body:"Place a large saucepan over medium heat and add oil. When hot, add chopped vegetables and sauté until softened, 5 to 10 minutes.",timer:300},{title:"Season",body:"Add 6 cups water, lentils, thyme, bay leaves and salt. Bring to a boil, then reduce to a fast simmer.",timer:0},{title:"Preheat",body:"Simmer lentils until they are tender and have absorbed most of the water, 20 to 25 minutes. If necessary, drain any excess water after lentils have cooked. Serve immediately, or allow them to cool and reheat later.",timer:1200},{title:"Simmer",body:"For a fuller taste, use some chicken stock and reduce the water by the same amount.",timer:0}],tip:"A classic French dish."},
  {id:52915,photo:"https://www.themealdb.com/images/media/meals/yvpuuy1511797244.jpg",name:"French Omelette",emoji:"",xp:133,difficulty:"Hard",time:"1 hr 30 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:542,protein:32,carbs:44,fat:28,fiber:5},done:false,ingredients:["3 Eggs","2 knobs Butter","1 tsp Parmesan","3 chopped Tarragon Leaves","1 tbs chopped Parsley","1 tbs chopped Chives","4 tbs Gruyère"],steps:[{title:"Preheat",body:"Get everything ready. Warm a 20cm (measured across the top) non-stick frying pan on a medium heat. Crack the eggs into a bowl and beat them with a fork so they break up and mix, but not as completely as you would for scrambled egg. With the heat on medium-hot, drop one knob of bu",timer:0},{title:"Preheat",body:"Let the eggs bubble slightly for a couple of seconds, then take a wooden fork or spatula and gently draw the mixture in from the sides of the pan a few times, so it gathers in folds in the centre. Leave for a few seconds, then stir again to lightly combine uncooked egg with cooke",timer:0},{title:"Serve",body:"Grip the handle underneath. Tilt the pan down away from you and let the omelette fall to the edge. Fold the side nearest to you over by a third with your fork, and keep it rolling over, so the omelette tips onto a plate – or fold it in half, if that’s easier. For a neat finish, c",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1669/ultimate-french-omelette"},
  {id:53146,photo:"https://www.themealdb.com/images/media/meals/5sgsob1763196284.jpg",name:"Locro",emoji:"",xp:154,difficulty:"Hard",time:"3 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:542,protein:36,carbs:40,fat:28,fiber:4},done:false,ingredients:["500g Dried white corn","200g Dried white beans","300g Pumpkin","200g Potatoes","300g Beef","200g Pork","1 Chorizo","1 chopped Onion","1 teaspoon Paprika","To taste Salt","To taste Pepper"],steps:[{title:"Prepare",body:"Soak: Soak corn and beans overnight in water.",timer:0},{title:"Cook",body:"Cook Meats: In a large pot, brown the beef and pork. Add onions and spices, cooking until translucent.",timer:0},{title:"Simmer",body:"Simmer the Stew: Add soaked corn and beans, pumpkin, potato, and enough water to cover. Simmer for 2-3 hours, until thick.",timer:10800},{title:"Serve",body:"Serve: Enjoy hot, with bread on the side.",timer:0},{title:"Add",body:"Toasting the corn slightly before adding it to the stew enhances its flavor.",timer:0},{title:"Preheat",body:"Add a spoonful of paprika or a dash of cumin for an extra layer of warmth and complexity.",timer:0}],tip:"Original recipe: https://www.munchery.com/blog/the-ten-iconic-dishes-of-argentina-and-how-to-cook-them-at-home/"},
  {id:53086,photo:"https://www.themealdb.com/images/media/meals/xd9aj21740432378.jpg",name:"Migas",emoji:"",xp:26,difficulty:"Easy",time:"30 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:551,protein:28,carbs:40,fat:28,fiber:6},done:false,ingredients:["1 large Bread","1 1/2 L Olive Oil","Half Garlic","1 Handfull Pork"],steps:[{title:"Prepare",body:"Crumble the bread into small pieces. Sprinkle with cold water, cover with a damp cloth and leave for 30 minutes.",timer:1800},{title:"Preheat",body:"Heat 2 tsp of olive oil in a deep pan. Add the garlic cloves separated, skins on; just make a small cut with a knife to open them and keep frying for 5 minutes. Set the garlic aside.",timer:300},{title:"Mix",body:"In the same oil, where we fried everything, simmer the bread, stirring constantly for 15 minutes and add a grinding of black pepper.",timer:900},{title:"Mix",body:"Add the garlic, continue stirring for about 20 minutes. It will be ready when the bread is soft and golden.",timer:1200}],tip:"Original recipe: https://www.ibericafood.com/Recipes/post/migas-with-pork"},
  {id:53223,photo:"https://www.themealdb.com/images/media/meals/i5o2b61763739053.jpg",name:"Mutabbaq",emoji:"",xp:119,difficulty:"Hard",time:"15 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:568,protein:32,carbs:43,fat:31,fiber:6},done:false,ingredients:["500g Mincemeat","1.5 tbs minced Garlic","1.5 tbs minced Ginger","1 Egg","1 large Tomato","4 Spring Onions","12 Filo Pastry","1 1/2 cups Melted Butter","1 tsp Salt","1 tsp Paprika","1 tsp Cumin","1 tsp Allspice","1 tsp Turmeric","1 tsp Black Pepper","1 tsp Sugar"],steps:[{title:"Preheat",body:"Heat the frying pan and add in some oil. Fry the mashed garlic and ginger first and then add in the minced meat and all seasoning. When the meat is cooked, set aside to cool down.",timer:0},{title:"Prep",body:"Get another big bowl. Add in egg, chopped tomato, chopped spring onion and minced meat.",timer:0},{title:"Mix",body:"Get one 2 sheets of filo pastry or 1 sheet spring roll wrap. Brush it with some butter and then put some filling in the middle. Fold the pastry and brush more butter on the seal part.",timer:0},{title:"Preheat",body:"Heat a frying pan and add in some oil to cook the parcel until its both sides and 4 edges all turn into golden brown. (Or brush melted butter all over the parcel and bake it in 180°C oven for 10-15 minutes).",timer:900}],tip:"Original recipe: https://cookpad.com/eng/recipes/14701273?ref=search&search_term=saudi+arabia"},
  {id:52810,photo:"https://www.themealdb.com/images/media/meals/wwuqvt1487345467.jpg",name:"Osso Buco alla Milanese",emoji:"",xp:109,difficulty:"Hard",time:"2 hrs",category:"Italian",diets:["No restrictions"],macros:{calories:514,protein:21,carbs:64,fat:26,fiber:4},done:false,ingredients:["4 meaty shanks Veal","½ cup Flour","2 tablespoons Olive Oil","3 tablespoons Butter","1 medium chopped into ½-inch pieces Onion","1 chopped into ½-inch pieces Carrots","1 chopped into ½-inch pieces Celery","1 bulb chopped into ½-inch pieces Fennel","3 cloves Garlic","2 strips Orange Zest","1 ½ teaspoons Marjoram","1 Bay Leaf","1 cup Dry White Wine","½ cup Chicken Stock","1 cup chopped with juice Tomatoes","2 tablespoons chopped Parsley","1 teaspoon minced Garlic","1 teaspoon grated Lemon Zest"],steps:[{title:"Preheat",body:"Heat the oven to 300 degrees.. Dredging the shanks: pour the flour into a shallow dish (a pie plate works nicely). Season the veal shanks on all sides with salt and pepper. One at a time, roll the shanks around in the flour coat, and shake and pat the shank to remove any excuses ",timer:0},{title:"Preheat",body:"Browning the shanks: put the oil and 1 tablespoon of the butter in a wide Dutch oven or heavy braising pot (6 to 7 quart) and heat over medium-high heat. When the butter has melted and the oil is shimmering, lower the shanks into the pot, flat side down; if the shanks won’t fit w",timer:300},{title:"Preheat",body:"The braising liquid: add the wine, increase the heat to high, and bring to a boil. Boil, stirring occasionally, to reduce the wine by about half, 5 minutes. Add the stock and tomatoes, with their juice, and boil again to reduce the liquid to about 1 cup total, about 10 minutes.. ",timer:7200},{title:"Preheat",body:"The gremolata: While the shanks are braising, stir together the garlic, parsley, and lemon zest in a small bowl. Cover with plastic wrap and set aside in a cool place (or the refrigerator, if your kitchen is very warm.). The finish: When the veal is fork-tender and falling away f",timer:900},{title:"Preheat",body:"Using a slotted spatula or spoon, carefully lift the shanks from the braising liquid, doing your best to keep them intact. The shanks will be very tender and threatening to fall into pieces, and the marrow will be wobbly inside the bones, so this can be a bit tricky. But if they ",timer:300},{title:"Preheat",body:"Portioning the veal shanks: if the shanks are reasonably sized, serve one per person. If the shanks are gargantuan or you’re dealing with modest appetites, pull apart the larger shanks, separating them at their natural seams, and serve smaller amounts. Be sure to give the marrow ",timer:0}],tip:"Original recipe: https://www.cookstr.com/Meat/Osso-Buco-alla-Milanese"},
  {id:53014,photo:"https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg",name:"Pizza Express Margherita",emoji:"",xp:112,difficulty:"Hard",time:"15 min",category:"Italian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:503,protein:19,carbs:66,fat:26,fiber:4},done:false,ingredients:["150ml Water","1 tsp Sugar","15g Yeast","225g Plain Flour","1 1/2 tsp Salt","Drizzle Olive Oil","80g Passata","70g Mozzarella","Peeled and Sliced Oregano","Leaves Basil","Pinch Black Pepper"],steps:[{title:"Preheat",body:"Preheat the oven to 230°C.. 2 Add the sugar and crumble the fresh yeast into warm water.",timer:0},{title:"Preheat",body:"Allow the mixture to stand for 10 – 15 minutes in a warm place (we find a windowsill on a sunny day works best) until froth develops on the surface.. 4 Sift the flour and salt into a large mixing bowl, make a well in the middle and pour in the yeast mixture and olive oil.",timer:900},{title:"Mix",body:"Lightly flour your hands, and slowly mix the ingredients together until they bind.. 6 Generously dust your surface with flour.",timer:0},{title:"Season",body:"Throw down the dough and begin kneading for 10 minutes until smooth, silky and soft.. 8 Place in a lightly oiled, non-stick baking tray (we use a round one, but any shape will do!).",timer:600},{title:"Season",body:"Spread the passata on top making sure you go to the edge.. 10 Evenly place the mozzarella (or other cheese) on top, season with the oregano and black pepper, then drizzle with a little olive oil.",timer:0},{title:"Cook",body:"Cook in the oven for 10 – 12 minutes until the cheese slightly colours.. 12 When ready, place the basil leaf on top and tuck in!.",timer:720}],tip:"Original recipe: https://www.dailymail.co.uk/femail/food/article-8240361/Pizza-Express-release-secret-recipe-Margherita-Pizza-make-home.html"},
  {id:52804,photo:"https://www.themealdb.com/images/media/meals/uuyrrx1487327597.jpg",name:"Poutine",emoji:"",xp:44,difficulty:"Easy",time:"5 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:561,protein:31,carbs:35,fat:24,fiber:2},done:false,ingredients:["Dash Vegetable Oil","1 Can Beef Gravy","5 thin cut Potatoes","2 cups Cheese Curds"],steps:[{title:"Preheat",body:"Heat oil in a deep fryer or deep heavy skillet to 365°F (185°C).",timer:0},{title:"Preheat",body:"Warm gravy in saucepan or microwave.",timer:0},{title:"Cook",body:"Place the fries into the hot oil, and cook until light brown, about 5 minutes.",timer:300},{title:"Serve",body:"Remove to a paper towel lined plate to drain.",timer:0},{title:"Add",body:"Place the fries on a serving platter, and sprinkle the cheese over them.",timer:0},{title:"Serve",body:"Ladle gravy over the fries and cheese, and serve immediately.",timer:0}],tip:"Original recipe: http://www.food.com/recipe/real-canadian-poutine-113388"},
  {id:53230,photo:"https://www.themealdb.com/images/media/meals/xnv4wf1763756529.jpg",name:"Purple sprouting broccoli tempura with nuoc cham",emoji:"",xp:92,difficulty:"Medium",time:"3 min",category:"Asian",diets:["Dairy-free"],macros:{calories:414,protein:21,carbs:43,fat:18,fiber:5},done:false,ingredients:["50g Corn Flour","100g Plain Flour","1 tablespoon Sesame Seed","For frying Vegetable Oil","250ml Soda Water","200g Purple Sprouting Broccoli","2 tablespoons Fish Sauce","Juice of 2 Lime","1 chopped Birds-eye Chillies","2 tablespoons Sugar"],steps:[{title:"Mix",body:"For the nuoc cham, whisk together all of the ingredients with 5 tbsp hot water in a small bowl. Set aside while you make the tempura.",timer:0},{title:"Preheat",body:"Whisk the cornflour, plain flour, sesame seeds (if using) and a large pinch of salt together. Fill a large, deep pan no more than a third full with the vegetable oil and heat until it reaches 180C or a cube of bread dropped in browns in 20 seconds.",timer:0},{title:"Mix",body:"Quickly whisk the soda water into the flour mixture, being careful not to overmix, then dunk in the broccoli using tongs. Carefully lower into the hot oil and cook for 2-3 mins until crisp. Drain on kitchen paper, then serve with the nuoc cham on the side for dipping.",timer:180}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/purple-sprouting-broccoli-tempura-with-nuoc-cham"},
  {id:53383,photo:"https://www.themealdb.com/images/media/meals/ip5xtp1769779958.jpg",name:"Ramen Noodles with Boiled Egg",emoji:"",xp:92,difficulty:"Medium",time:"4 hrs",category:"Asian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:427,protein:24,carbs:46,fat:13,fiber:4},done:false,ingredients:["1 Packet Noodles","2 cups Water","1 large Egg","1 tbsp Soy Sauce","1/2 tsp Chilli Sauce","1 tbls Spring Onions","1/2 tsp Salt","1/2 tbs Pepper"],steps:[{title:"Cook",body:"Boil: Bring water to a boil, gently add eggs, and cook for exactly 6½ to 7 minutes.",timer:420},{title:"Cook",body:"Ice Bath: Immediately transfer the eggs to a bowl of ice water for 3–5 minutes to stop cooking.",timer:300},{title:"Mix",body:"Marinate (Optional but recommended): Peel the eggs and marinate in a mix of 2 tbsp soy sauce, 2 tbsp mirin, 1 tsp sugar, and 4 tbsp water for at least 4 hours (or overnight).",timer:14400},{title:"Prep",body:"Serve: Slice in half, letting the yolk flow into the broth.",timer:0}],tip:"A classic Chinese dish."},
  {id:53215,photo:"https://www.themealdb.com/images/media/meals/crd1jz1763592990.jpg",name:"Shakshouka",emoji:"",xp:83,difficulty:"Medium",time:"5 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:547,protein:32,carbs:45,fat:26,fiber:4},done:false,ingredients:["250g Tomato","40 ml Extra Virgin Olive Oil","4 Egg","4 sliced Garlic Clove","To taste Black Pepper","To taste Salt"],steps:[{title:"Preheat",body:"First, pan fry the black pepper and garlic over a dry medium heat until fragrant.",timer:0},{title:"Cook",body:"Add a good amount of extra virgin olive oil and infuse for a minute.",timer:0},{title:"Preheat",body:"Once the oil heats up, add the tomatoes and salt, and cover with a lid. Simmer for 5 minutes.",timer:300},{title:"Simmer",body:"Remove the lid and mash the tomatoes. Reduce until you reach the desired consistency of choice.",timer:0},{title:"Preheat",body:"Make craters for the eggs and lower the heat. Carefully crack the eggs into the craters, making sure it touches the pan and not the tomato sauce.",timer:0},{title:"Combine",body:"Cover the eggs and leave it for 5 minutes without lifting the lid.",timer:300},{title:"Preheat",body:"Remove from the heat and let the residual heat steam the eggs for 1-2 minutes.",timer:120},{title:"Serve",body:"Serve with flatbread. Enjoy!.",timer:0}],tip:"Original recipe: https://cookpad.com/eng/recipes/24999905?ref=search&search_term=saudi+arabia"},
  {id:53219,photo:"https://www.themealdb.com/images/media/meals/wpkfin1763597958.jpg",name:"Shakshuka Feta Cheese",emoji:"",xp:152,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:574,protein:35,carbs:46,fat:26,fiber:3},done:false,ingredients:["4 large Egg","3  tablespoons Tomato Sauce","1 tablespoon Olive Oil","1 chopped Shallots","1 Celery","1 clove peeled crushed Garlic","1 cup Spinach","1/2 cup Feta","1/2 Red Pepper","1 tsp Ground Cumin","1/2 teaspoon Salt","1/2 teaspoon Black Pepper"],steps:[{title:"Preheat",body:"In a pan heat the oil medium to high heat, with a tablespoon of olive oil.",timer:0},{title:"Mix",body:"Add the chopped vegetables as onions, garlic, celery and red pepper. Stir all together for 5 mins.",timer:300},{title:"Cook",body:"Add the cumin powder and salt and pepper and the tomato sauce and let it cook for another 7 mins.",timer:420},{title:"Season",body:"Add the eggs, cover and leave to coo for 8 mins. Add the fresh spinach and feta cheese at the end.",timer:480},{title:"Serve",body:"Serve with fresh bread.",timer:0}],tip:"Original recipe: https://cookpad.com/eng/recipes/22551672?ref=search&search_term=saudi+arabia"},
  {id:53183,photo:"https://www.themealdb.com/images/media/meals/2wt8721763334199.jpg",name:"Spanish meatballs with clams, chorizo & squid",emoji:"",xp:133,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["No restrictions"],macros:{calories:556,protein:27,carbs:30,fat:27,fiber:5},done:false,ingredients:["25g Butter","3 diced Shallots","1 teaspoon Smoked Paprika","2 cloves minced Garlic","1 clove finely chopped Garlic","2 tblsp Dry sherry","50g Breadcrumbs","300g Pork","1 Egg Yolks","50 ml Olive Oil","300g Chorizo","300g Squid","100 ml White Wine","300g Tomato","400g Clams","Handful Parsley","Drizzle Extra Virgin Olive Oil"],steps:[{title:"Cook",body:"Melt the butter in a heavy-based casserole, then soften the shallots for 5 mins. Add the paprika and crushed garlic and cook for 1 min until the paprika becomes fragrant. Splash in the sherry, then pour the whole lot into a bowl with the breadcrumbs. Season and cool.",timer:300},{title:"Preheat",body:"Add the pork mince and the egg yolk to the bowl, then beat well. Shape into 18 small meatballs. Wipe the pan, put on a medium-high heat, then add the oil. Fry the meatballs for 5 mins, just to colour, then lift onto a plate, but keep the oil in the pan. Sizzle the chorizo with th",timer:300}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/spanish-meatballs-clams-chorizo-squid"},
  {id:53089,photo:"https://www.themealdb.com/images/media/meals/54xzk31760524666.jpg",name:"Syrian Bread",emoji:"",xp:72,difficulty:"Medium",time:"5 min",category:"Comfort",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:542,protein:32,carbs:44,fat:28,fiber:2},done:false,ingredients:["1 and 1/8 cup Water","2 tblsp Vegetable Oil","1/2 teaspoon Sugar","1 1/2 tsp Salt","3 Cups Flour","1 1/2 tsp Yeast"],steps:[{title:"Prepare",body:"Place ingredients in the pan of the bread machine in the order recommended by the manufacturer. Select Dough cycle; press Start.",timer:0},{title:"Preheat",body:"When the Dough cycle is almost complete, preheat the oven to 475 degrees F (245 degrees C).",timer:0},{title:"Rest",body:"Turn dough out onto a lightly floured surface. Divide into eight equal pieces and form into rounds. Cover the rounds with a damp cloth and let rest.",timer:0},{title:"Preheat",body:"Roll dough into thin flat circles, about 8 inches in diameter. Cook two at a time on preheated baking sheets or a baking stone until puffed up and golden brown, about 5 minutes. Repeat for remaining loaves.",timer:300}],tip:"Original recipe: https://www.allrecipes.com/recipe/20834/syrian-bread/"},
  {id:53095,photo:"https://www.themealdb.com/images/media/meals/zg2b9l1760524940.jpg",name:"Syrian Rice with Meat",emoji:"",xp:92,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:552,protein:31,carbs:45,fat:27,fiber:1},done:false,ingredients:["1/4 cup Butter","2 Pounds Ground Beef","2 teaspoons Salt","1/2 teaspoon Allspice","1/2 teaspoon Cinnamon","1/2 teaspoon Black Pepper","5 Cups Chicken Stock","2 cups Rice","2 tablespoons Butter","1/2 cup Pine Nuts"],steps:[{title:"Preheat",body:"Heat 1/4 cup butter in a large saucepan over medium-high heat. Add ground beef and season with salt, allspice, cinnamon, and black pepper. Cook and stir until beef is browned and crumbly, 7 to 10 minutes.",timer:420},{title:"Preheat",body:"Stir chicken broth and rice into beef in the saucepan; bring to a boil. Reduce heat to low, cover, and cook until liquid is absorbed, about 20 minutes.",timer:1200},{title:"Preheat",body:"Meanwhile, melt 2 tablespoons butter in a small skillet over medium heat. Cook and stir pine nuts in hot butter until lightly browned, 3 to 5 minutes.",timer:180},{title:"Mix",body:"Mix pine nuts into beef-rice mixture before serving.",timer:0}],tip:"Original recipe: https://www.allrecipes.com/recipe/272233/syrian-rice-with-meat/"},
  {id:52912,photo:"https://www.themealdb.com/images/media/meals/sxwquu1511793428.jpg",name:"Three-cheese souffles",emoji:"",xp:124,difficulty:"Hard",time:"15 min",category:"Comfort",diets:["Vegetarian"],macros:{calories:545,protein:30,carbs:41,fat:24,fiber:5},done:false,ingredients:["50g Butter","25g Parmesan","300ml Milk","2 Bay Leaves","5 tbs Plain Flour","½ tsp English Mustard","Pod of Cayenne Pepper","140g Gruyère","3 Eggs","8 slices Goats Cheese","150ml Double Cream","to serve Spinach"],steps:[{title:"Preheat",body:"Heat oven to 200C/180C fan/ gas 6 and butter 4 small (about 200ml) ramekins. Sprinkle the Parmesan into the ramekins, turning until all sides are covered. Place the milk and bay leaves in a large saucepan over a gentle heat and bring to the boil. Turn off the heat and leave to in",timer:900},{title:"Preheat",body:"Discard the bay leaves, add the butter and flour, and return to a low heat. Very gently simmer, stirring continuously with a balloon whisk, for about 6 mins until you get a smooth, thick white sauce. Make sure that you get right into the corners of the pan to stop the sauce from ",timer:360},{title:"Mix",body:"Once thickened, transfer the sauce to a large bowl and stir in the mustard powder, cayenne pepper, Gruyère and egg yolks until fully combined.",timer:0},{title:"Mix",body:"In a spotlessly clean bowl and with a clean whisk, beat the egg whites just until peaks begin to form.",timer:0},{title:"Mix",body:"Carefully fold the egg whites into the cheese sauce in three stages making sure you fold, rather than stir, to keep the egg whites light and airy. Fill the prepared ramekins with the soufflé mix.",timer:0},{title:"Prep",body:"Top each soufflé with a slice of goat’s cheese, then place on a baking tray. Bake for 20-25 mins or until springy and well risen but cooked through.",timer:1500},{title:"Rest",body:"Leave to cool, then run a knife around the edge of each dish and remove the soufflés. If preparing in advance, place soufflés upside down (for neat presentation), on a tray. Cover tray in cling film. Chill for a few days or freeze for up to 1 month.",timer:0},{title:"Preheat",body:"When ready to re-bake, heat oven to 200C/180C fan/gas 6. Place the upside-down soufflés in a shallow baking dish, top with the remaining goat’s cheese slices and pour over the cream (this stops them from drying out when baked for the second time). Cook for 8-10 mins until golden.",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/3028701/threecheese-souffls"},
  {id:53249,photo:"https://www.themealdb.com/images/media/meals/1wj8w31763781990.jpg",name:"Turkey Bánh mì",emoji:"",xp:132,difficulty:"Hard",time:"15 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:424,protein:28,carbs:49,fat:17,fiber:3},done:false,ingredients:["2 small Baguette","50g Chicken Liver","1/4 Cucumber","140g Turkey","1 tablespoon Mayonnaise","1 sliced Red Chilli","Handful Mint","2 small Carrots","75g Red Cabbage","1/4 tsp Ground Ginger","½ tablespoon Rice Vinegar","1/2 teaspoon Golden Caster Sugar"],steps:[{title:"Mix",body:"To make the pickled slaw, tip the carrots and cabbage into a large bowl. In a small bowl, combine the ginger, rice vinegar, sugar and a few pinches of salt. Pour over the vegetables and toss together. Set aside for at least 15 mins.",timer:900},{title:"Mix",body:"Halve the baguettes lengthways and spread the pâté over the bottom half. Top with the pickled slaw, cucumber and turkey. Mix the mayonnaise with the chopped chilli and dollop over the top. Scatter over the mint leaves and sliced chilli. Sandwich together and dig in.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/turkey-banh-mi"},
  {id:52845,photo:"https://www.themealdb.com/images/media/meals/ypuxtw1511297463.jpg",name:"Turkey Meatloaf",emoji:"",xp:159,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:574,protein:28,carbs:34,fat:26,fiber:2},done:false,ingredients:["1 tblsp Olive Oil","1 large Onion","1 clove peeled crushed Garlic","2 tblsp Worcestershire Sauce","3 tsp Tomato Puree","500g Turkey Mince","1 large Eggs","85g Breadcrumbs","2 tblsp Barbeque Sauce","800g Cannellini Beans","2 tblsp Parsley"],steps:[{title:"Preheat",body:"Heat oven to 180C/160C fan/gas 4. Heat the oil in a large frying pan and cook the onion for 8-10 mins until softened. Add the garlic, Worcestershire sauce and 2 tsp tomato purée, and stir until combined. Set aside to cool.",timer:600},{title:"Mix",body:"Put the turkey mince, egg, breadcrumbs and cooled onion mix in a large bowl and season well. Mix everything to combine, then shape into a rectangular loaf and place in a large roasting tin. Spread 2 tbsp barbecue sauce over the meatloaf and bake for 30 mins.",timer:1800},{title:"Season",body:"Meanwhile, drain 1 can of beans only, then pour both cans into a large bowl. Add the remaining barbecue sauce and tomato purée. Season and set aside.",timer:0},{title:"Prep",body:"When the meatloaf has had its initial cooking time, scatter the beans around the outside and bake for 15 mins more until the meatloaf is cooked through and the beans are piping hot. Scatter over the parsley and serve the meatloaf in slices.",timer:900}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/turkey-meatloaf"},
  {id:53252,photo:"https://www.themealdb.com/images/media/meals/xw1ruy1763786501.jpg",name:"Turkish rice (vermicelli rice)",emoji:"",xp:81,difficulty:"Medium",time:"10 min",category:"Mediterranean",diets:["No restrictions"],macros:{calories:368,protein:20,carbs:36,fat:21,fiber:3},done:false,ingredients:["300g Rice","3  tablespoons Vegetable Oil","70g Vermicelli Pasta","30g Unsalted Butter","600ml Chicken Stock"],steps:[{title:"Cook",body:"Pour the rice into a very large bowl under cold running water and carefully drain the water out of the bowl through a sieve. Repeat a few times until the water in the bowl is clear, then fill the bowl up with cold water and leave rice to soak for 10 mins while you cook the vermic",timer:600},{title:"Preheat",body:"Put the oil into a medium pan over medium heat. Add the vermicelli and stir continuously until the strands turn a rich golden brown, 2-3 mins. Remove from the heat, stir through the butter until it melts and allow the vermicelli to cool for 1-2 mins.",timer:180},{title:"Preheat",body:"Drain the rice thoroughly through a sieve. Add the rice to the pan and stir well. Pour the hot stock into the pan, sprinkle in ½ tsp salt, stir well then return the pan to the hob over a high heat. Bring to the boil, then reduce the heat to the lowest it will go, put the lid on t",timer:540}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/turkish-rice-vermicelli-rice"},
  {id:53097,photo:"https://www.themealdb.com/images/media/meals/x5qz5k1761595900.jpg",name:"Yorkshire Puddings",emoji:"",xp:70,difficulty:"Medium",time:"25 min",category:"Comfort",diets:["Vegetarian"],macros:{calories:543,protein:29,carbs:31,fat:31,fiber:5},done:false,ingredients:["140g Flour","4 Egg","200ml Milk","Drizzle Sunflower Oil"],steps:[{title:"Preheat",body:"Heat oven to 230C/fan 210C/gas 8.",timer:0},{title:"Preheat",body:"Drizzle a little sunflower oil evenly into two 4-hole Yorkshire pudding tins or two 12-hole non-stick muffin tins and place in the oven to heat through.",timer:0},{title:"Mix",body:"To make the batter, tip 140g plain flour into a bowl and beat in 4 eggs until smooth.",timer:0},{title:"Mix",body:"Gradually add 200ml milk and carry on beating until the mix is completely lump-free. Season with salt and pepper.",timer:0},{title:"Add",body:"Pour the batter into a jug, then remove the hot tins from the oven. Carefully and evenly pour the batter into the holes.",timer:0},{title:"Cook",body:"Place the tins back in the oven and leave undisturbed for 20-25 mins until the puddings have puffed up and browned.",timer:1500},{title:"Serve",body:"Serve immediately. You can now cool them and freeze for up to 1 month.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/best-yorkshire-puddings"},
  {id:52839,photo:"https://www.themealdb.com/images/media/meals/usywpp1511189717.jpg",name:"Chilli prawn linguine",emoji:"",xp:101,difficulty:"Hard",time:"3 min",category:"Italian",diets:["Dairy-free"],macros:{calories:528,protein:13,carbs:60,fat:25,fiber:1},done:false,ingredients:["280g Linguine Pasta","200g Sugar Snap Peas","2 tblsp Olive Oil","2 cloves chopped Garlic Clove","1 large Red Chilli","24 Skinned King Prawns","12 Cherry Tomatoes","Handful Basil Leaves","Leaves Lettuce","to serve Bread","2 tbsp Fromage Frais","Grated Zest of 2 Lime","2 tsp Caster Sugar"],steps:[{title:"Mix",body:"Mix the dressing ingredients in a small bowl and season with salt and pepper. Set aside.",timer:0},{title:"Cook",body:"Cook the pasta according to the packet instructions. Add the sugar snap peas for the last minute or so of cooking time.",timer:0},{title:"Preheat",body:"Meanwhile, heat the oil in a wok or large frying pan, toss in the garlic and chilli and cook over a fairly gentle heat for about 30 seconds without letting the garlic brown. Tip in the prawns and cook over a high heat, stirring frequently, for about 3 minutes until they turn pink",timer:180},{title:"Mix",body:"Add the tomatoes and cook, stirring occasionally, for 3 minutes until they just start to soften. Drain the pasta and sugar snaps well, then toss into the prawn mixture. Tear in the basil leaves, stir, and season with salt and pepper.",timer:180},{title:"Preheat",body:"Serve with salad leaves drizzled with the lime dressing, and warm crusty bread.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1269/chilli-prawn-linguine"},
  {id:53064,photo:"https://www.themealdb.com/images/media/meals/0jv5gx1661040802.jpg",name:"Fettuccine Alfredo",emoji:"",xp:62,difficulty:"Medium",time:"40 min",category:"Italian",diets:["Vegetarian","Gluten-free"],macros:{calories:508,protein:18,carbs:75,fat:21,fiber:4},done:false,ingredients:["1 lb Fettuccine","1/2 cup Heavy Cream","1/2 cup Butter","1/2 cup Parmesan","2 tbsp Parsley","Black Pepper"],steps:[{title:"Cook",body:"Cook pasta according to package instructions in a large pot of boiling water and salt.",timer:0},{title:"Preheat",body:"Add heavy cream and butter to a large skillet over medium heat until the cream bubbles and the butter melts.",timer:0},{title:"Mix",body:"Whisk in parmesan and add seasoning (salt and black pepper).",timer:0},{title:"Season",body:"Let the sauce thicken slightly and then add the pasta and toss until coated in sauce.",timer:0},{title:"Serve",body:"Garnish with parsley, and it's ready.",timer:0}],tip:"Original recipe: https://www.delish.com/cooking/recipe-ideas/a55312/best-homemade-fettuccine-alfredo-recipe/"},
  {id:52835,photo:"https://www.themealdb.com/images/media/meals/uquqtu1511178042.jpg",name:"Fettucine alfredo",emoji:"",xp:62,difficulty:"Medium",time:"4 min",category:"Italian",diets:["Vegetarian"],macros:{calories:527,protein:21,carbs:70,fat:18,fiber:2},done:false,ingredients:["227g Clotted Cream","25g Butter","1 tsp Corn Flour","100g Parmesan Cheese","Grated Nutmeg","250g Fettuccine","Chopped Parsley"],steps:[{title:"Preheat",body:"In a medium saucepan, stir the clotted cream, butter and cornflour over a low-ish heat and bring to a low simmer. Turn off the heat and keep warm.",timer:0},{title:"Mix",body:"Meanwhile, put the cheese and nutmeg in a small bowl and add a good grinding of black pepper, then stir everything together (don’t add any salt at this stage).",timer:0},{title:"Preheat",body:"Put the pasta in another pan with 2 tsp salt, pour over some boiling water and cook following pack instructions (usually 3-4 mins). When cooked, scoop some of the cooking water into a heatproof jug or mug and drain the pasta, but not too thoroughly.",timer:240},{title:"Preheat",body:"Add the pasta to the pan with the clotted cream mixture, then sprinkle over the cheese and gently fold everything together over a low heat using a rubber spatula. When combined, splash in 3 tbsp of the cooking water. At first, the pasta will look wet and sloppy: keep stirring unt",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/fettucine-alfredo"},
  {id:52829,photo:"https://www.themealdb.com/images/media/meals/xutquv1505330523.jpg",name:"Grilled Mac and Cheese Sandwich",emoji:"",xp:135,difficulty:"Hard",time:"1 hr",category:"Italian",diets:["Vegetarian"],macros:{calories:532,protein:16,carbs:76,fat:26,fiber:5},done:false,ingredients:["8 ounces (230 grams) Macaroni","1/3 cup Plain Flour","3/4 teaspoon Mustard Powder","1/2 teaspoon Garlic powder","1/2 teaspoon Kosher salt","1/2 teaspoon Black pepper","1/8 teaspoon Cayenne pepper","6 tablespoons (85 grams) Butter","1 1/2 cups (360 milliliters) Whole Milk","1 cup (240 milliliters) Heavy Cream","1 pound (455 grams) Monterey Jack Cheese","4 tablespoons (55 grams) Butter","1 teaspoon garlic powder","16 slices square Bread","8 slices mild Cheddar Cheese","8 slices Colby Jack Cheese","4 tablespoons (55 grams) Butter"],steps:[{title:"Mix",body:"Make the mac and cheese. 1. Bring a medium saucepan of generously salted water (you want it to taste like seawater) to a boil. Add the pasta and cook, stirring occasionally, until al dente, 8 to 10 minutes, or according to the package directions. The pasta should be tender but st",timer:480},{title:"Preheat",body:"Drain the pasta in a colander. Place the empty pasta pan (no need to wash it) over low heat and add the butter. When the butter has melted, whisk in the flour mixture and continue to cook, whisking frequently, until the mixture is beginning to brown and has a pleasant, nutty arom",timer:3600},{title:"Preheat",body:"Make the grilled cheese. 6. Heat a large cast-iron or nonstick skillet over medium-low heat.. 7. In a small bowl, stir together the 4 tablespoons (55 grams) butter and garlic powder until well blended.",timer:0},{title:"Preheat",body:"Remove the mac and cheese from the refrigerator and peel off the top layer of parchment paper. Carefully cut into 8 equal pieces. Each piece will make 1 grilled mac and cheese sandwich. (You can stash each individual portion in a double layer of resealable plastic bags and refrig",timer:240},{title:"Prep",body:"Repeat with the remaining ingredients. Cut the sandwiches in half, if desired, and serve.",timer:0}],tip:"Original recipe: https://leitesculinaria.com/103647/recipes-grilled-mac-and-cheese-sandwich.html"},
  {id:52987,photo:"https://www.themealdb.com/images/media/meals/xr0n4r1576788363.jpg",name:"Lasagna Sandwiches",emoji:"",xp:83,difficulty:"Medium",time:"40 min",category:"Italian",diets:["No restrictions"],macros:{calories:533,protein:19,carbs:74,fat:24,fiber:2},done:false,ingredients:["1/4 cup Sour Cream","2 tbs Chopped Onion","1/2 tbs Dried Oregano","1/4 tsp Salt","8 slices Bread","8 slices Bacon","8 slices Tomato","4 slices Mozzarella","2 1/2 Tbs Butter"],steps:[{title:"Mix",body:"In a small bowl, combine the first four ingredients; spread on four slices of bread. Layer with bacon, tomato and cheese; top with remaining bread.",timer:0},{title:"Cook",body:"In a large skillet or griddle, melt 2 tablespoons butter. Toast sandwiches until lightly browned on both sides and cheese is melted, adding butter if necessary.",timer:0},{title:"Mix",body:"sandwich: 445 calories, 24g fat (12g saturated fat), 66mg cholesterol, 1094mg sodium, 35g carbohydrate (3g sugars, 2g fiber), 21g protein.",timer:0}],tip:"A classic American dish."},
  {id:52844,photo:"https://www.themealdb.com/images/media/meals/wtsvxx1511296896.jpg",name:"Lasagne",emoji:"",xp:156,difficulty:"Hard",time:"5 min",category:"Italian",diets:["Gluten-free"],macros:{calories:505,protein:18,carbs:73,fat:22,fiber:2},done:false,ingredients:["1 tblsp Olive Oil","2 Bacon","1 finely chopped Onion","1 Stick Celery","1 medium Carrots","2 cloves chopped Garlic","500g Minced Beef","1 tbls Tomato Puree","800g Chopped Tomatoes","1 tblsp Honey","500g Lasagne Sheets","400ml Creme Fraiche","125g Mozzarella Balls","50g Parmesan Cheese","Topping Basil Leaves"],steps:[{title:"Preheat",body:"Heat the oil in a large saucepan. Use kitchen scissors to snip the bacon into small pieces, or use a sharp knife to chop it on a chopping board. Add the bacon to the pan and cook for just a few mins until starting to turn golden. Add the onion, celery and carrot, and cook over a ",timer:300},{title:"Mix",body:"Add the garlic and cook for 1 min, then tip in the mince and cook, stirring and breaking it up with a wooden spoon, for about 6 mins until browned all over.",timer:60},{title:"Mix",body:"Stir in the tomato purée and cook for 1 min, mixing in well with the beef and vegetables. Tip in the chopped tomatoes. Fill each can half full with water to rinse out any tomatoes left in the can, and add to the pan. Add the honey and season to taste. Simmer for 20 mins.",timer:60},{title:"Preheat",body:"Heat oven to 200C/180C fan/gas 6. To assemble the lasagne, ladle a little of the ragu sauce into the bottom of the roasting tin or casserole dish, spreading the sauce all over the base. Place 2 sheets of lasagne on top of the sauce overlapping to make it fit, then repeat with mor",timer:0},{title:"Mix",body:"Put the crème fraîche in a bowl and mix with 2 tbsp water to loosen it and make a smooth pourable sauce. Pour this over the top of the pasta, then top with the mozzarella. Sprinkle Parmesan over the top and bake for 25–30 mins until golden and bubbling. Serve scattered with basil",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/classic-lasagne"},
  {id:52837,photo:"https://www.themealdb.com/images/media/meals/vvtvtr1511180578.jpg",name:"Pilchard puttanesca",emoji:"",xp:72,difficulty:"Medium",time:"4 min",category:"Italian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:508,protein:21,carbs:62,fat:21,fiber:2},done:false,ingredients:["300g Spaghetti","1 tbls Olive Oil","1 finely chopped Onion","2 cloves minced Garlic","1 Red Chilli","1 tbls Tomato Puree","425g Pilchards","70g Black Olives","Shaved Parmesan"],steps:[{title:"Preheat",body:"Cook the pasta following pack instructions. Heat the oil in a non-stick frying pan and cook the onion, garlic and chilli for 3-4 mins to soften. Stir in the tomato purée and cook for 1 min, then add the pilchards with their sauce. Cook, breaking up the fish with a wooden spoon, t",timer:240},{title:"Cook",body:"Drain the pasta and add to the pan with 2-3 tbsp of the cooking water. Toss everything together well, then divide between plates and serve, scattered with Parmesan.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/pilchard-puttanesca"},
  {id:52982,photo:"https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg",name:"Spaghetti alla Carbonara",emoji:"",xp:102,difficulty:"Hard",time:"10 min",category:"Italian",diets:["Gluten-free","Dairy-free"],macros:{calories:539,protein:19,carbs:65,fat:20,fiber:5},done:false,ingredients:["320g Spaghetti","6 Egg Yolks","As required Salt","150g Bacon","50g Pecorino","As required Black Pepper"],steps:[{title:"Mix",body:"Put a large saucepan of water on to boil.. Finely chop the 100g pancetta, having first removed any rind. Finely grate 50g pecorino cheese and 50g parmesan and mix them together.",timer:0},{title:"Cook",body:"Beat the 3 large eggs in a medium bowl and season with a little freshly grated black pepper. Set everything aside.. Add 1 tsp salt to the boiling water, add 350g spaghetti and when the water comes back to the boil, cook at a constant simmer, covered, for 10 minutes or until al de",timer:600},{title:"Cook",body:"Squash 2 peeled plump garlic cloves with the blade of a knife, just to bruise it.. While the spaghetti is cooking, fry the pancetta with the garlic. Drop 50g unsalted butter into a large frying pan or wok and, as soon as the butter has melted, tip in the pancetta and garlic.",timer:0},{title:"Preheat",body:"Leave to cook on a medium heat for about 5 minutes, stirring often, until the pancetta is golden and crisp. The garlic has now imparted its flavour, so take it out with a slotted spoon and discard.. Keep the heat under the pancetta on low. When the pasta is ready, lift it from th",timer:300},{title:"Preheat",body:"Mix most of the cheese in with the eggs, keeping a small handful back for sprinkling over later.. Take the pan of spaghetti and pancetta off the heat. Now quickly pour in the eggs and cheese. Using the tongs or a long fork, lift up the spaghetti so it mixes easily with the egg mi",timer:0},{title:"Cook",body:"Add extra pasta cooking water to keep it saucy (several tablespoons should do it). You don’t want it wet, just moist. Season with a little salt, if needed.. Use a long-pronged fork to twist the pasta on to the serving plate or bowl. Serve immediately with a little sprinkling of t",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/ultimate-spaghetti-carbonara-recipe"},
  {id:53093,photo:"https://www.themealdb.com/images/media/meals/5fu4ew1760524857.jpg",name:"Syrian Spaghetti",emoji:"",xp:97,difficulty:"Medium",time:"1 hr",category:"Italian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:533,protein:18,carbs:75,fat:18,fiber:3},done:false,ingredients:["16 ounces Spaghetti","8 ounces Tomato Sauce","6 oz Tomato Puree","1 teaspoon Cinnamon","1/4 cup Vegetable Oil","Dash Salt","Dash Pepper"],steps:[{title:"Preheat",body:"Preheat oven to 350 degrees F (175 degrees C). Grease a 9x13 inch baking dish.",timer:0},{title:"Mix",body:"Bring a large pot of lightly salted water to a boil. Add spaghetti and cook for 8 to 10 minutes or until al dente; drain and stir in tomato sauce, tomato paste, cinnamon, oil, salt and pepper. Transfer to prepared dish.",timer:480},{title:"Preheat",body:"Bake in preheated oven for 1 hour, or until top is crunchy.",timer:3600}],tip:"Original recipe: https://www.allrecipes.com/recipe/26303/syrian-spaghetti/"},
  {id:52838,photo:"https://www.themealdb.com/images/media/meals/qvrwpt1511181864.jpg",name:"Venetian Duck Ragu",emoji:"",xp:143,difficulty:"Hard",time:"10 min",category:"Italian",diets:["No restrictions"],macros:{calories:518,protein:17,carbs:64,fat:19,fiber:4},done:false,ingredients:["1 tbls Olive Oil","4 Duck Legs","2 finely chopped Onions","2 cloves minced Garlic","2 tsp ground Cinnamon","2 tsp Plain Flour","250ml Red Wine","800g Chopped Tomatoes","1 Chicken Stock Cube","3 sprigs Rosemary","2 Bay Leaves","1 tsp Sugar","2 tbs Milk","600g Paccheri Pasta","Grated Parmesan Cheese"],steps:[{title:"Preheat",body:"Heat the oil in a large pan. Add the duck legs and brown on all sides for about 10 mins. Remove to a plate and set aside. Add the onions to the pan and cook for 5 mins until softened. Add the garlic and cook for a further 1 min, then stir in the cinnamon and flour and cook for a ",timer:600},{title:"Cook",body:"Carefully lift the duck legs out of the sauce and place on a plate – they will be very tender so try not to lose any of the meat. Pull off and discard the fat, then shred the meat with 2 forks and discard the bones. Add the meat back to the sauce with the milk and simmer, uncover",timer:900},{title:"Mix",body:"Cook the pasta following pack instructions, then drain, reserving a cup of the pasta water, and add the pasta to the ragu. Stir to coat all the pasta in the sauce and cook for 1 min more, adding a splash of cooking liquid if it looks dry. Serve with grated Parmesan, if you like.",timer:60}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/venetian-duck-ragu"},
  {id:52885,photo:"https://www.themealdb.com/images/media/meals/xusqvw1511638311.jpg",name:" Bubble & Squeak",emoji:"",xp:77,difficulty:"Medium",time:"6 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:574,protein:30,carbs:30,fat:23,fiber:3},done:false,ingredients:["1 tbs Butter","4 Bacon","1 finely sliced Onion","1 chopped Garlic Clove","20 Brussels Sprouts","400g Potatoes"],steps:[{title:"Prep",body:"Melt the fat in a non-stick pan, allow it to get nice and hot, then add the bacon. As it begins to brown, add the onion and garlic. Next, add the sliced sprouts or cabbage and let it colour slightly. All this will take 5-6 mins.",timer:360},{title:"Mix",body:"Next, add the potato. Work everything together in the pan and push it down so that the mixture covers the base of the pan – allow the mixture to catch slightly on the base of the pan before turning it over and doing the same again. It’s the bits of potato that catch in the pan th",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/164622/bubble-and-squeak"},
  {id:53156,photo:"https://www.themealdb.com/images/media/meals/qt4i0n1763256454.jpg",name:"Arroz al horno (baked rice)",emoji:"",xp:147,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:557,protein:35,carbs:33,fat:23,fiber:3},done:false,ingredients:["2 tbsp Extra Virgin Olive Oil","800g Pork belly slices","150g Black Pudding","100g Bacon lardon","1 chopped Onion","2 Red Pepper","1 chopped Plum Tomatoes","8 Garlic Clove","4 teaspoons Paprika","1/2 teaspoon Chilli Flakes","200g Dried white beans","1 1/2 L Chicken Stock","6 parts Thyme","375g Paella Rice","1 Lemon Juice"],steps:[{title:"Preheat",body:"Heat oven to 200C/180C/gas 6. Heat half the oil in a deep frying or sauté pan (or shallow casserole dish) measuring around 30cm in diameter. Over a high heat, colour the pork belly slices on each side in several batches, then transfer to a bowl. Add the remaining oil to the pan a",timer:600},{title:"Mix",body:"Sprinkle the rice around the pork belly, pushing it underneath the stock. Let the stock come to the boil again, season well, then transfer to the oven (leave it uncovered). Cook for 20 mins without stirring, then check to see how the rice is doing. The rice should be tender and t",timer:1200},{title:"Mix",body:"Squeeze lemon juice over the top and drizzle over some extra virgin olive oil just before serving, if you like.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/arroz-al-horno-baked-rice"},
  {id:53242,photo:"https://www.themealdb.com/images/media/meals/tzsy461763769901.jpg",name:"Barbecue pork buns",emoji:"",xp:80,difficulty:"Medium",time:"5 min",category:"Asian",diets:["Dairy-free"],macros:{calories:416,protein:22,carbs:55,fat:15,fiber:3},done:false,ingredients:["85g Sugar","500g White Bread Mix","1 tablespoon Sunflower Oil","12 Bacon","Knob Ginger","2 cloves chopped Garlic","2 tablespoons Soy Sauce","3  tablespoons Clear Honey","3  tablespoons Tomato Puree","1 beaten Egg"],steps:[{title:"Preheat",body:"Heat the oven to 200C/fan 180C/gas. Mix the sugar into the bread mix in a large bowl, then add water as instructed on the pack. Bring the dough together with a wooden spoon, then knead on a lightly floured surface for 5 mins until smooth. Put into a large bowl, cover with oiled c",timer:300},{title:"Preheat",body:"Meanwhile, heat the oil in a pan, then fry the bacon until crisp, about 5 mins. Add the ginger and garlic and fry for 1 min until soft, then tip in the soy, honey and tomato purée and stir well. Can be made up to 3 days ahead.",timer:300},{title:"Preheat",body:"Turn out the dough and knead briefly, then pull into 12 even-sized balls. Flatten with your hands, then put a teaspoon-size blob of the filling in the middle. Draw the dough up and pinch it closed like a purse, then turn the bun over and sit it on a large baking sheet. Cover with",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/barbecue-pork-buns"},
  {id:52995,photo:"https://www.themealdb.com/images/media/meals/atd5sh1583188467.jpg",name:"BBQ Pork Sloppy Joes",emoji:"",xp:157,difficulty:"Hard",time:"25 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:563,protein:32,carbs:46,fat:26,fiber:4},done:false,ingredients:["2 Potatoes","1 Red Onions","2 cloves Garlic","1 Lime","2 Bread","1 lb Pork","Barbeque Sauce","Hotsauce","Tomato Ketchup","Sugar","Vegetable Oil","Salt","Pepper"],steps:[{title:"Preheat",body:"Preheat oven to 450 degrees. Wash and dry all produce. Cut sweet potatoes into ½-inch-thick wedges. Toss on a baking sheet with a drizzle of oil, salt, and pepper. Roast until browned and tender, 20-25 minutes.",timer:1500},{title:"Prep",body:"Meanwhile, halve and peel onion. Slice as thinly as possible until you have ¼ cup (½ cup for 4 servings); finely chop remaining onion. Peel and finely chop garlic. Halve lime; squeeze juice into a small bowl. Halve buns. Add 1 TBSP butter (2 TBSP for 4) to a separate small microw",timer:0},{title:"Mix",body:"To bowl with lime juice, add sliced onion, ¼ tsp sugar (½ tsp for 4 servings), and a pinch of salt. Stir to combine; set aside to quick-pickle.",timer:0},{title:"Preheat",body:"Heat a drizzle of oil in a large pan over medium-high heat. Add chopped onion and season with salt and pepper. Cook, stirring, until softened, 4-5 minutes. Add garlic and cook until fragrant, 30 seconds more. Add pork and season with salt and pepper. Cook, breaking up meat into p",timer:300},{title:"Mix",body:"While pork cooks, in a third small bowl, combine BBQ sauce, pickling liquid from onion, 3 TBSP ketchup (6 TBSP for 4 servings), ½ tsp sugar (1 tsp for 4), and ¼ cup water (⅓ cup for 4). Once pork is cooked through, add BBQ sauce mixture to pan. Cook, stirring, until sauce is thic",timer:180},{title:"Serve",body:"Meanwhile, toast buns in oven or toaster oven until golden, 3-5 minutes. Divide toasted buns between plates and fill with as much BBQ pork as you’d like. Top with pickled onion and hot sauce. Serve with sweet potato wedges on the side.",timer:300}],tip:"A classic American dish."},
  {id:53018,photo:"https://www.themealdb.com/images/media/meals/md8w601593348504.jpg",name:"Bigos (Hunters Stew)",emoji:"",xp:115,difficulty:"Hard",time:"3 hrs",category:"Comfort",diets:["Dairy-free"],macros:{calories:553,protein:36,carbs:43,fat:26,fiber:5},done:false,ingredients:["2 sliced Bacon","1 lb Kielbasa","1 lb Pork","1/4 cup Flour","3 chopped Garlic","1 Diced Onion","1 1/2 cup Mushrooms","4 cups Cabbage","1 Jar Sauerkraut","1/4 cup Red Wine","1 Bay Leaf","1 tsp Basil","1 tsp Marjoram","1 tbs Paprika","1/8 teaspoon Caraway Seed","1 dash Hotsauce","5 Cups Beef Stock","2 tbs Tomato Puree","1 cup Diced Tomatoes","1 dash Worcestershire Sauce"],steps:[{title:"Preheat",body:"Preheat the oven to 350 degrees F (175 degrees C).",timer:0},{title:"Preheat",body:"Heat a large pot over medium heat. Add the bacon and kielbasa; cook and stir until the bacon has rendered its fat and sausage is lightly browned. Use a slotted spoon to remove the meat and transfer to a large casserole or Dutch oven.",timer:0},{title:"Preheat",body:"Coat the cubes of pork lightly with flour and fry them in the bacon drippings over medium-high heat until golden brown. Use a slotted spoon to transfer the pork to the casserole. Add the garlic, onion, carrots, fresh mushrooms, cabbage and sauerkraut. Reduce heat to medium; cook ",timer:600},{title:"Mix",body:"Deglaze the pan by pouring in the red wine and stirring to loosen all of the bits of food and flour that are stuck to the bottom. Season with the bay leaf, basil, marjoram, paprika, salt, pepper, caraway seeds and cayenne pepper; cook for 1 minute.",timer:60},{title:"Preheat",body:"Mix in the dried mushrooms, hot pepper sauce, Worcestershire sauce, beef stock, tomato paste and tomatoes. Heat through just until boiling. Pour the vegetables and all of the liquid into the casserole dish with the meat. Cover with a lid.",timer:0},{title:"Preheat",body:"Bake in the preheated oven for 2 1/2 to 3 hours, until meat is very tender.",timer:10800}],tip:"Original recipe: https://www.allrecipes.com/recipe/138131/bigos-hunters-stew/"},
  {id:53036,photo:"https://www.themealdb.com/images/media/meals/naqyel1608588563.jpg",name:"Boxty Breakfast",emoji:"",xp:153,difficulty:"Hard",time:"15 min",category:"Comfort",diets:["No restrictions"],macros:{calories:574,protein:33,carbs:28,fat:32,fiber:3},done:false,ingredients:["4 large Potatoes","1  bunch Spring Onions","100g Plain Flour","1 Egg White","150ml Milk","1 tsp Bicarbonate Of Soda","3 tbs Butter","2 tbs Vegetable Oil","6 Cherry Tomatoes","12 Bacon","6 Egg"],steps:[{title:"Preheat",body:"Before you start, put your oven on its lowest setting, ready to keep things warm. Peel the potatoes, grate 2 of them, then set aside. Cut the other 2 into large chunks, then boil for 10-15 mins or until tender. Meanwhile, squeeze as much of the liquid from the grated potatoes as ",timer:900},{title:"Mix",body:"Whisk the egg white in a large bowl until it holds soft peaks. Fold in the buttermilk, then add the bicarbonate of soda. Fold into the potato mix.",timer:0},{title:"Preheat",body:"Heat a large non-stick frying pan over a medium heat, then add 1 tbsp butter and some of the oil. Drop 3-4 spoonfuls of the potato mixture into the pan, then gently cook for 3-5 mins on each side until golden and crusty. Keep warm on a plate in the oven while you cook the next ba",timer:300},{title:"Preheat",body:"Heat the grill to medium and put the tomatoes in a heavy-based pan. Add a good knob of butter and a little oil, then fry for about 5 mins until softened. Grill the bacon, then pile onto a plate and keep warm. Stack up the boxty, bacon and egg, and serve the tomatoes on the side.",timer:300}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/boxty-bacon-eggs-tomatoes"},
  {id:53190,photo:"https://www.themealdb.com/images/media/meals/g33c901763365484.jpg",name:"Bryndzové Halušky",emoji:"",xp:78,difficulty:"Medium",time:"3 min",category:"Comfort",diets:["No restrictions"],macros:{calories:565,protein:29,carbs:33,fat:32,fiber:5},done:false,ingredients:["500g Potatoes","200g Plain Flour","1 Egg","1 teaspoon Salt","250g Bryndza cheese","200g Bacon","Garnish Chives"],steps:[{title:"Mix",body:"Grate the potatoes finely using a hand grater or food processor. Place the grated potatoes in a bowl and mix them with flour, egg, and salt until a sticky dough forms. The consistency should be thick but pliable.",timer:0},{title:"Cook",body:"Cook the Dumplings.",timer:0},{title:"Prep",body:"Bring a large pot of salted water to a boil. Using a halušky maker (similar to a spaetzle maker), press the dough directly into the boiling water. If you don’t have one, use a tilted cutting board and a knife to scrape small pieces of dough into the water.",timer:0},{title:"Cook",body:"Let the dumplings cook until they float to the surface, usually within 2-3 minutes. Scoop them out with a slotted spoon and set aside in a large bowl.",timer:180},{title:"Add",body:"Prepare the Toppings.",timer:0},{title:"Preheat",body:"Chop the bacon into small pieces and fry in a skillet over medium heat until crispy. If using a bryndza substitute, mix crumbled feta with a dollop of sour cream to mimic the tangy flavour of traditional Slovak sheep cheese.",timer:0},{title:"Prep",body:"Toss the cooked dumplings with the bryndza cheese (or substitute) until they’re well-coated and creamy. Top with the crispy bacon and its drippings. Garnish with chopped chives or parsley for an extra touch of colour and flavour.",timer:0}],tip:"Original recipe: https://www.slovakia-foods.co.uk/blog/post/bryndzove-halusky-recipe-a-taste-of-slovakia-national-dish.html"},
  {id:53330,photo:"https://www.themealdb.com/images/media/meals/lrfdwz1764438393.jpg",name:"Cassava pizza",emoji:"",xp:60,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:576,protein:30,carbs:31,fat:29,fiber:5},done:false,ingredients:["6 cut thick slices Casabe","450g Tomato Sauce","225g Chorizo","225g Turkey Ham","75g Sweetcorn","40g Green Olives","55g Paprika","50g Mozzarella"],steps:[{title:"Preheat",body:"Preheat the oven to 200ºC.",timer:0},{title:"Prep",body:"Cut the bacon or chorizo into medium pieces and the paprika into strips.",timer:0},{title:"Mix",body:"Spread a little tomato sauce and mozzarella cheese on each portion of cassava.",timer:0},{title:"Season",body:"Add the bacon or chorizo, corn, turkey ham, some olives and paprika.",timer:0},{title:"Cook",body:"Bake for 7 to 10 minutes.",timer:420},{title:"Combine",body:"Remove from the oven and enjoy.",timer:0}],tip:"Original recipe: https://goya.es/en/recipes/cassava-pizza"},
  {id:53166,photo:"https://www.themealdb.com/images/media/meals/xvnx8j1763287209.jpg",name:"Chickpea, chorizo & spinach stew",emoji:"",xp:109,difficulty:"Hard",time:"4 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:568,protein:36,carbs:45,fat:28,fiber:5},done:false,ingredients:["4 tablespoons Extra Virgin Olive Oil","1 chopped Onion","1 Diced Carrots","1 Diced Celery","3 Thyme","2 Bay Leaves","2 cloves chopped Garlic","200g Chorizo","1/4 tsp Cinnamon","1 teaspoon Paprika","800g Chickpeas","2 tblsp Sherry vinegar","400g Spinach"],steps:[{title:"Preheat",body:"Heat the oil in a large pan, then gently fry the onion for 3-4 mins until it begins to soften. Stir in the carrot, celery, thyme and bay leaves. Season, then cook for 2-3 mins, stirring occasionally. Add the garlic, chorizo, cinnamon and smoked paprika. Gently fry until the veget",timer:240},{title:"Preheat",body:"Stir in the chickpeas, vinegar and 150ml water, then bring to a simmer for 1-2 mins until the chickpeas have heated up. Add the spinach, then stir through the chickpeas until it wilts a little. Remove from the heat, season to taste, then serve warm with crusty bread.",timer:120}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chickpea-chorizo-spinach-stew"},
  {id:53136,photo:"https://www.themealdb.com/images/media/meals/5i25sg1763075353.jpg",name:"Choripán",emoji:"",xp:37,difficulty:"Easy",time:"15 min",category:"Comfort",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:571,protein:30,carbs:31,fat:32,fiber:3},done:false,ingredients:["4 Chorizo","4 Crusty Bread","Drizzle Chimichurri sauce"],steps:[{title:"Cook",body:"Grill the Chorizos: Cook the chorizos on a grill or pan until fully cooked, about 10-15 minutes.",timer:900},{title:"Prep",body:"Prepare the Rolls: Slice the rolls and toast them lightly on the grill or in a pan.",timer:0},{title:"Prep",body:"Assemble: Slice each chorizo lengthwise and place in a roll. Top with a generous amount of chimichurri sauce.",timer:0},{title:"Serve",body:"Serve: Enjoy immediately while hot.",timer:0},{title:"Preheat",body:"Grill the chorizo slowly on medium heat to prevent the skin from bursting and to ensure it cooks evenly throughout.",timer:0},{title:"Cook",body:"Toast the bread on the grill to absorb some of the chorizo's flavors.",timer:0}],tip:"Original recipe: https://www.munchery.com/blog/the-ten-iconic-dishes-of-argentina-and-how-to-cook-them-at-home/"},
  {id:53168,photo:"https://www.themealdb.com/images/media/meals/kggfo91763288633.jpg",name:"Chorizo & chickpea soup",emoji:"",xp:76,difficulty:"Medium",time:"6 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:540,protein:29,carbs:35,fat:23,fiber:3},done:false,ingredients:["400g Tinned Tomatos","110g Chorizo","140g Savoy Cabbage","Sprinkling Chilli Flakes","400g can Chickpeas","1 Chicken Stock","To serve Crusty Bread"],steps:[{title:"Preheat",body:"Put a medium pan on the heat and tip in the tomatoes, followed by a can of water. While the tomatoes are heating, quickly chop the chorizo into chunky pieces (removing any skin) and shred the cabbage.",timer:0},{title:"Preheat",body:"Pile the chorizo and cabbage into the pan with the chilli flakes and chickpeas, then crumble in the stock cube. Stir well, cover and leave to bubble over a high heat for 6 mins or until the cabbage is just tender. Ladle into bowls and eat with crusty or garlic bread.",timer:360}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chorizo-chickpea-soup"},
  {id:53157,photo:"https://www.themealdb.com/images/media/meals/v8eaed1763257313.jpg",name:"Chorizo & soft-boiled egg salad",emoji:"",xp:99,difficulty:"Medium",time:"12 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:579,protein:27,carbs:38,fat:28,fiber:5},done:false,ingredients:["500g Baby New Potatoes","4 Egg","225g Green Beans","225g Chorizo","1 sliced Garlic Clove","2 tbsp Sherry vinegar","2 tbsp chopped Parsley"],steps:[{title:"Cook",body:"Cook the potatoes in a large pan of boiling salted water for 12 mins, adding the eggs after 6 mins, and the beans for the final 2 mins. Drain everything and cool the eggs under cold running water.",timer:720},{title:"Prep",body:"Meanwhile fry chorizo slices for 1-2 mins, until beginning to crisp. Remove from the pan with a slotted spoon and set aside, leaving the oil from the chorizo in the pan. Add the garlic to the pan and cook gently for 1 min.",timer:120},{title:"Preheat",body:"Remove the pan from the heat, stir in the vinegar and parsley, then toss with the potatoes, beans, chorizo and seasoning. Shell the eggs, cut into quarters and add to the salad.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chorizo-soft-boiled-egg-salad"},
  {id:53185,photo:"https://www.themealdb.com/images/media/meals/6cskio1763338156.jpg",name:"Chorizo & tomato salad",emoji:"",xp:93,difficulty:"Medium",time:"40 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:565,protein:28,carbs:31,fat:23,fiber:1},done:false,ingredients:["3 Beef tomatoes","1/2 Red Onions","Sprigs of fresh Thyme","1 tablespoon Sherry vinegar","2 tblsp Extra Virgin Olive Oil","100g Chorizo"],steps:[{title:"Cook",body:"Put the tomatoes in a bowl with the onion and thyme. Season, then drizzle with the vinegar and oil. Let the flavours mingle while you cook the chorizo.",timer:0},{title:"Prep",body:"In a hot, dry pan, fry the chorizo slices until browned on both sides. Serve the tomatoes with the fried chorizo, drizzled with a little oil from the pan.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chorizo-tomato-salad"},
  {id:53159,photo:"https://www.themealdb.com/images/media/meals/0y6uvc1763258983.jpg",name:"Chorizo, potato & cheese omelette",emoji:"",xp:85,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:549,protein:33,carbs:46,fat:31,fiber:4},done:false,ingredients:["1 small Potatoes","1 teaspoon Olive Oil","50g Chorizo","3 Egg","Chopped Parsley","25g Cheddar Cheese"],steps:[{title:"Cook",body:"step 1 Cook the potato in boiling water for 8-10 mins or until tender.",timer:600},{title:"Cook",body:"Drain and allow to steam-dry.",timer:0},{title:"Preheat",body:"Heat oil in an omelette pan, add chorizo and cook for 2 mins.",timer:120},{title:"Cook",body:"Add the potato and cook for a further 5 mins until the potato starts to crisp.",timer:300},{title:"Cook",body:"Spoon pan contents out, wipe pan and cook a 2 or 3-egg omelette in the same pan.",timer:0},{title:"Cook",body:"When almost cooked, scatter with the chorizo and potato, parsley and cheese.",timer:0},{title:"Cook",body:"Fold the omelette in the pan and cook for 1 min more to melt the cheese.",timer:60}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chorizo-potato-cheese-omelette"},
  {id:53037,photo:"https://www.themealdb.com/images/media/meals/7vpsfp1608588991.jpg",name:"Coddled pork with cider",emoji:"",xp:73,difficulty:"Medium",time:"3 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:572,protein:31,carbs:38,fat:23,fiber:4},done:false,ingredients:["Knob Butter","2 Pork Chops","4 Bacon","2 Potatoes","1 Carrots","1/2 Swede","1/2 Cabbage","1 Bay Leaf","100ml Cider","100g Chicken Stock"],steps:[{title:"Preheat",body:"Heat the butter in a casserole dish until sizzling, then fry the pork for 2-3 mins on each side until browned. Remove from the pan.",timer:180},{title:"Mix",body:"Tip the bacon, carrot, potatoes and swede into the pan, then gently fry until slightly coloured. Stir in the cabbage, sit the chops back on top, add the bay leaf, then pour over the cider and stock. Cover the pan, then leave everything to gently simmer for 20 mins until the pork ",timer:1200},{title:"Serve",body:"Serve at the table spooned straight from the dish.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/irish-coddled-pork-cider"},
  {id:52999,photo:"https://www.themealdb.com/images/media/meals/st1ifa1583267248.jpg",name:"Crispy Sausages and Greens",emoji:"",xp:97,difficulty:"Medium",time:"15 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:549,protein:33,carbs:35,fat:29,fiber:1},done:false,ingredients:["1  bunch Kale","8 Italian Fennel Sausages","1 Head chopped Cabbage","8 Garlic Clove","Sliced Onion","Sliced Shiitake Mushrooms","1 cup Chicken Stock","Salt","Pepper"],steps:[{title:"Preheat",body:"Preheat the oven to 350°. Remove the stems from one bunch of Tuscan kale and tear the leaves into 1\" pieces (mustard greens, collards, spinach, and chard are great, too). Coarsely chop half a head of green cabbage. Combine the greens in a large baking dish and add 4 cloves of th",timer:900},{title:"Preheat",body:"Meanwhile, heat a little olive oil in a large skillet over medium-high. Prick four sweet Italian sausages with a fork and cook until browned on all sides and cooked through, 10 to 12 minutes. When the greens are done, slice the sausage and toss into the greens with a splash of yo",timer:600}],tip:"Original recipe: https://www.bonappetit.com/columns/cooking-without-recipes/article/kale-cabbage-sausage-weeknight-dinner"},
  {id:53188,photo:"https://www.themealdb.com/images/media/meals/gtpvwp1763363947.jpg",name:"Fašírky",emoji:"",xp:135,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["No restrictions"],macros:{calories:554,protein:30,carbs:36,fat:28,fiber:4},done:false,ingredients:["500g Ground Pork","1 medium chopped Onion","2 cloves minced Garlic","2 sliced Bread","1 shot Milk","1 Egg","1 teaspoon Salt","1/2 teaspoon Black Pepper","1 teaspoon Marjoram","1 tsp Mustard","1 tablespoon chopped Parsley","1/2 cup Flour","1 beaten Egg","1 cup Breadcrumbs","For frying Vegetable Oil"],steps:[{title:"Mix",body:"Prepare the Bread Mixture. Soak the bread slices in milk or water until soft.. Squeeze out excess liquid and mash into small crumbs.",timer:0},{title:"Mix",body:"Mix the Ingredients. In a large bowl, combine ground meat, chopped onions, garlic, soaked bread, egg, and seasonings.. Mix well until evenly combined.",timer:0},{title:"Mix",body:"Shape the Meat Patties. Take portions of the mixture and shape them into palm-sized patties.. Flatten slightly to help with even cooking.",timer:0},{title:"Preheat",body:"Lightly dust each patty with flour.. Dip into beaten egg, then coat with breadcrumbs for a crispy finish.. Heat vegetable oil in a pan over medium heat.",timer:0},{title:"Cook",body:"Fry the patties for 4-5 minutes per side until golden brown and fully cooked.. Transfer to a paper towel-lined plate to drain excess oil.. Serve Fašírky hot with mashed potatoes, cabbage salad, or fresh bread.",timer:300},{title:"Combine",body:"Enjoy with mustard, pickles, or garlic sauce for extra flavor.",timer:0}],tip:"Original recipe: https://www.slovakia-foods.co.uk/blog/post/fasirky-recipe-how-to-make-authentic-slovak-meat-patties.html"},
  {id:53179,photo:"https://www.themealdb.com/images/media/meals/6dpa7m1763331105.jpg",name:"Ham croquetas",emoji:"",xp:141,difficulty:"Hard",time:"1 min",category:"Comfort",diets:["Vegetarian"],macros:{calories:573,protein:28,carbs:33,fat:26,fiber:6},done:false,ingredients:["75g Plain Flour","2 large Egg","75g Breadcrumbs","For frying Sunflower Oil","4 tbsp Extra Virgin Olive Oil","1/2 Leek","70g jamón ibérico","60g Plain Flour","75 ml Vegetable Stock","330ml Milk","Grated Nutmeg"],steps:[{title:"Preheat",body:"To make the filling, heat the olive oil in a pan until it starts to shimmer. Add the leek and sauté until soft but not coloured. Stir in the ham with a wooden spoon, fry for 1 min, then stir in the flour and fry over a medium heat, stirring occasionally, until the mixture is gold",timer:60},{title:"Preheat",body:"Once you’ve incorporated all the milk stock, continue to cook the filling over a medium heat for about 10 mins or until it thickens and leaves the sides of the pan when you stir it.. Season with black pepper, taste and adjust the salt if necessary – the ham can be very salty to s",timer:600},{title:"Mix",body:"Smooth the mixture onto a baking tray (30 x 20cm is fine). Once it has stopped steaming, cover with cling film to stop it drying out. Leave to cool before putting it in the fridge for 1 hr.. When you're ready for the next stage, line up three bowls: the first filled with the flou",timer:0},{title:"Mix",body:"Roll a spoonful of the mixture between your palms. The size and shape of the croquetas is up to you, but the easiest is a walnut-sized ball. Then begin coating as follows.. Dunk the croquetas into the flour – you want a dusting – followed by the egg, then the breadcrumbs. Put the",timer:1800},{title:"Preheat",body:"If you have a deep-fat fryer, heat the oil to 180C and fry for a couple of mins. If not, heat the oil in a deep, heavy-bottomed saucepan until it starts to shimmer. Then add 5-6 croquetas at a time and fry until golden all over. Once cooked, drain on kitchen paper and eat straigh",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/ham-croquetas"},
  {id:53035,photo:"https://www.themealdb.com/images/media/meals/n41ny81608588066.jpg",name:"Ham hock colcannon",emoji:"",xp:73,difficulty:"Medium",time:"15 min",category:"Comfort",diets:["No restrictions"],macros:{calories:559,protein:29,carbs:30,fat:29,fiber:4},done:false,ingredients:["800g Floury Potatoes","50g Butter","3 chopped Garlic Clove","1 chopped Cabbage","8 Spring Onions","100ml Double Cream","2 tbs Mustard","180g Ham","4 Eggs"],steps:[{title:"Prep",body:"Peel and cut the potatoes into even, medium-sized chunks. Put in a large pan filled with cold salted water, bring to the boil and cook for 10-15 mins until a knife can be inserted into the potatoes easily.",timer:900},{title:"Preheat",body:"Meanwhile, melt the butter in a large sauté pan over a medium heat. Add the garlic, cabbage, spring onions and some seasoning. Stir occasionally until the cabbage is wilted but still retains a little bite, then set aside.",timer:0},{title:"Preheat",body:"Drain the potatoes, leave to steam-dry for a couple of mins, then mash with the cream, mustard and seasoning in the same saucepan. Stir in the cabbage and ham hock. Keep warm over a low heat.",timer:0},{title:"Preheat",body:"Reheat the pan you used to cook the cabbage (no need to wash first), add a splash of oil, crack in the eggs and fry to your liking. To serve, divide the colcannon between bowls and top each with a fried egg.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/ham-hock-colcannon"},
  {id:52954,photo:"https://www.themealdb.com/images/media/meals/1529445893.jpg",name:"Hot and Sour Soup",emoji:"",xp:151,difficulty:"Hard",time:"1 hr 30 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:413,protein:25,carbs:47,fat:19,fiber:2},done:false,ingredients:["1/3 cup Mushrooms","1/3 cup Wood Ear Mushrooms","2/3 Cup Tofu","1/2 cup Pork","2-1/2 cups Chicken Stock","1/2 tsp Salt","1/4 tsp Sugar","1 tsp Sesame Seed Oil","1/4 tsp Pepper","1/2 tsp Hotsauce","1-½ cups Vinegar","1 tsp Soy Sauce","1 tbs Cornstarch","2 tbs Water","1/4 cup Spring Onions"],steps:[{title:"Prepare",body:"STEP 1 - MAKING THE SOUP.",timer:0},{title:"Simmer",body:"In a wok add chicken broth and wait for it to boil.",timer:0},{title:"Mix",body:"Next add salt, sugar, sesame seed oil, white pepper, hot pepper sauce, vinegar and soy sauce and stir for few seconds.",timer:0},{title:"Season",body:"Add Tofu, mushrooms, black wood ear mushrooms to the wok.",timer:0},{title:"Mix",body:"To thicken the sauce, whisk together 1 Tablespoon of cornstarch and 2 Tablespoon of water in a bowl and slowly add to your soup until it's the right thickness.",timer:0},{title:"Mix",body:"Next add 1 egg slightly beaten with a knife or fork and add it to the soup and stir for 8 seconds.",timer:0},{title:"Prep",body:"Serve the soup in a bowl and add the bbq pork and sliced green onions on top.",timer:0}],tip:"Original recipe: https://sueandgambo.com/pages/chinese-hot-and-sour-soup"},
  {id:53145,photo:"https://www.themealdb.com/images/media/meals/zc9cwz1763196177.jpg",name:"Jamon & wild garlic croquetas",emoji:"",xp:147,difficulty:"Hard",time:"30 min",category:"Comfort",diets:["Vegetarian"],macros:{calories:556,protein:30,carbs:36,fat:27,fiber:5},done:false,ingredients:["150g Wild Garlic Leaves","350g Milk","45g Olive Oil","65g Flour","35g manchego","80g jamón ibérico","1 Egg","75g Breadcrumbs","1 L Vegetable Oil"],steps:[{title:"Prep",body:"Wash the wild garlic leaves well in a colander, then pour over boiling water from the kettle until just wilted. Immediately rinse under cold running water, then squeeze out the excess water and finely chop.",timer:0},{title:"Preheat",body:"Warm the milk in a pan over a low heat until just steaming. Heat the oil or butter in a second pan and, once warm or melted, stir in the flour for a couple of minutes until it starts to brown a little. Gradually add the warm milk, a little at a time, until you have a thick, silky",timer:0},{title:"Mix",body:"Add the manchego, jamón and wild garlic to the pan, and beat to combine. Tip out onto a lightly oiled baking tray or plate, spread out then cover and chill for at least 1 hr. Will keep chilled for up to 24 hrs.",timer:0},{title:"Mix",body:"Lightly oil your hands and shape the mixture into 18-20 even-sized balls. Arrange on a baking tray and freeze for 30 mins to firm up.",timer:1800},{title:"Preheat",body:"Beat the egg in a shallow dish with a little seasoning. Tip the panko into a second dish. Dip each of the croquetas in the egg, then turn to coat in the breadcrumbs. At this point, the raw croquetas can be frozen for up to three months. Pour the oil into a large, deep pan ensurin",timer:180}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/jamon-wild-garlic-croquetas"},
  {id:53034,photo:"https://www.themealdb.com/images/media/meals/d8f6qx1604182128.jpg",name:"Japanese Katsudon",emoji:"",xp:83,difficulty:"Medium",time:"3 min",category:"Japanese",diets:["Gluten-free","Dairy-free"],macros:{calories:382,protein:26,carbs:43,fat:9,fiber:3},done:false,ingredients:["1 tbs Vegetable Oil","1 large Onion","1 chopped Pork","150ml Vegetable Stock","1 tbs Soy Sauce","1 tsp Mirin","1 tsp Sugar","2 Beaten Eggs","200g Sushi Rice","Chopped Chives"],steps:[{title:"Preheat",body:"Heat the oil in a pan, fry the sliced onion until golden brown, then add the tonkatsu (see recipe here), placing it in the middle of the pan. Mix the dashi, soy, mirin and sugar together and tip three-quarters of the mixture around the tonkatsu. Sizzle for a couple of mins so the",timer:0},{title:"Mix",body:"Tip the beaten eggs around the tonkatsu and cook for 2-3 mins until the egg is cooked through but still a little runny. Divide the rice between two bowls, then top each with half the egg and tonkatsu mix, sprinkle over the chives and serve immediately, drizzling with a little mor",timer:180}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/japanese-katsudon"},
  {id:53301,photo:"https://www.themealdb.com/images/media/meals/cyuhwp1764362103.jpg",name:"Pork & sauerkraut goulash",emoji:"",xp:133,difficulty:"Hard",time:"8 min",category:"Comfort",diets:["No restrictions"],macros:{calories:560,protein:30,carbs:37,fat:24,fiber:3},done:false,ingredients:["3  tablespoons Lard","4 Chopped Onion","1 tablespoon Cumin Seeds","800g Pork Shoulder","4 Cloves Crushed Garlic","2 tablespoons Plain Flour","2 tablespoons Paprika","1 1/2 L Beef Stock","4 Bay Leaves","400g White Sauerkraut","200ml Whipping Cream","4 tablespoons Sour Cream"],steps:[{title:"Preheat",body:"Heat the lard in a saucepan over a medium heat and fry the finely chopped onion until golden, around 5-8 mins. Tip in the cumin and pork, and fry for 10 mins all over until browned. Add the garlic, season well and scatter over the flour. Cook for about a minute, then add the papr",timer:480},{title:"Preheat",body:"Pour in half of the stock, add the bay leaves, and simmer with the lid on over a low heat for 30 mins.",timer:1800},{title:"Mix",body:"Add the sauerkraut, remaining stock and a drizzle of the sauerkraut pickling juices. Simmer with the lid for 30 mins, stirring occasionally, until the meat is tender. Stir in the cream and simmer for 5 mins to combine the flavours. Season to taste, the serve garnished with a spoo",timer:1800},{title:"Season",body:"This recipe has been provided by Apetit Online and not been re-tested by us.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/pork-sauerkraut-goulash"},
  {id:52847,photo:"https://www.themealdb.com/images/media/meals/wxuvuv1511299147.jpg",name:"Pork Cassoulet",emoji:"",xp:117,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:571,protein:31,carbs:31,fat:29,fiber:3},done:false,ingredients:["4 tbsp Goose Fat","350g Pork","1 large Onion","10 Garlic","1 thinly sliced Carrots","1 tsp Fennel Seeds","2 tblsp Red Wine Vinegar","600ml Vegetable Stock","1 tblsp Tomato Puree","2 sticks Rosemary","Handful Parsley","400g Haricot Beans","2 tblsp Breadcrumbs","drizzle Oil","to serve Bread","to serve Broccoli"],steps:[{title:"Preheat",body:"Heat oven to 140C/120C fan/gas 1. Put a large ovenproof pan (with a tight-fitting lid) on a high heat. Add your fat and diced meat, cook for a few mins to seal the edges, giving it a quick stir to cook evenly. Reduce the heat to low, add the sliced onion, whole garlic cloves, car",timer:0},{title:"Mix",body:"Pour over the red wine vinegar, scraping any meaty bits off the bottom of the pan. Add the stock, tomato purée, and half the rosemary and parsley. Bring to the boil and simmer for 10 mins, then season, cover with a lid and put into the oven for 2 hrs, removing the lid for the fin",timer:600},{title:"Preheat",body:"Remove the pan from the oven and heat the grill. Scatter the top with the remaining herbs and breadcrumbs, drizzle a little oil over the top, and return to the oven for 5-10 mins, until the breadcrumbs are golden. Serve with crusty bread and green veg.",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/jacks-pork-cassoulet"},
  {id:53306,photo:"https://www.themealdb.com/images/media/meals/om5hsl1764364721.jpg",name:"Pork rib bortsch",emoji:"",xp:153,difficulty:"Hard",time:"20 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:540,protein:36,carbs:39,fat:25,fiber:3},done:false,ingredients:["1kg Pork Back Ribs","2 Bay Leaves","1 tablespoon Dried white beans","1 large Carrots","1 sliced Onion","3 sliced thinly Garlic Clove","1 chopped Red Pepper","2 chopped Red Chilli","2 Beetroot","3 chopped Potatoes","3  tablespoons Tomato Puree","1/2 White Cabbage","Handful Parsley","Handful Dill","300g Sour Cream"],steps:[{title:"Preheat",body:"Cut the meat into large pieces, put in your largest saucepan and cover with 5 litres water. Bring to the boil over a high heat, skimming away any foam that rises to the surface. Add the bay leaves. Season. Turn the heat down to a simmer and cook for 1 hr, or until the meat is sof",timer:0},{title:"Preheat",body:"Turn the heat up. Bring back to the boil, then reduce the heat and simmer for another 20 mins – the beans should still be slightly raw. Add the carrots, onions, garlic and pepper. Stir well, then add the chillies, if using. Cook for 15 mins more.",timer:1200},{title:"Preheat",body:"Stir in the beetroot and cook for 10 mins before adding the potatoes. After 15 mins, add the tomato purée to taste and beans, if using canned, and bring to the boil. Cook for 5 mins, add the cabbage and cook for 5 mins more. Season, then garnish with the parsley and dill. Turn of",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/pork-rib-bortsch"},
  {id:53147,photo:"https://www.themealdb.com/images/media/meals/jc6oub1763196663.jpg",name:"Arroz con gambas y calamar",emoji:"",xp:85,difficulty:"Medium",time:"5 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:551,protein:36,carbs:28,fat:26,fiber:6},done:false,ingredients:["24 Raw King Prawns","2 tbsp Olive Oil","1 small Onion","1 Bay Leaf","1 pinch Saffron","450g Paella Rice","2 teaspoons Tomato Puree","200ml White Wine","650ml Seafood stock","3 Medium Squid"],steps:[{title:"Preheat",body:"Peel and devein most of the prawns (a fishmonger should be able to do this for you), keeping a few whole for decoration, if you like. Heat the olive oil in a large frying pan or shallow flameproof casserole over a medium-low heat and fry the onion for 5 mins until softened. Add t",timer:300},{title:"Preheat",body:"Pour in the wine and bubble for 1-2 mins, then pour in the seafood stock and 150ml water. Cook for 5 mins, then add the squid, season well and stir to combine. Bring to the boil, then cover and reduce the heat to a gentle simmer. Cook for 12 mins more, adding a little more water ",timer:120},{title:"Mix",body:"Uncover the pan and stir through the peeled prawns, then arrange any whole prawns on top of the rice mixture. Cover again and simmer for a further 5-6 mins until the prawns are pink and cooked through. Leave to stand for a couple of minutes before serving from the pan.",timer:360}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/arroz-con-gambas-y-calamar"},
  {id:52959,photo:"https://www.themealdb.com/images/media/meals/1548772327.jpg",name:"Baked salmon with fennel & tomatoes",emoji:"",xp:81,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:577,protein:28,carbs:47,fat:27,fiber:3},done:false,ingredients:["2 medium Fennel","2 tbs chopped Parsley","Juice of 1 Lemon","175g Cherry Tomatoes","1 tbs Olive Oil","350g Salmon","to serve Black Olives"],steps:[{title:"Preheat",body:"Heat oven to 180C/fan 160C/gas 4. Trim the fronds from the fennel and set aside. Cut the fennel bulbs in half, then cut each half into 3 wedges. Cook in boiling salted water for 10 mins, then drain well. Chop the fennel fronds roughly, then mix with the parsley and lemon zest.",timer:600},{title:"Cook",body:"Spread the drained fennel over a shallow ovenproof dish, then add the tomatoes. Drizzle with olive oil, then bake for 10 mins. Nestle the salmon among the veg, sprinkle with lemon juice, then bake 15 mins more until the fish is just cooked. Scatter over the parsley and serve.",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/7745/baked-salmon-with-fennel-and-tomatoes"},
  {id:53239,photo:"https://www.themealdb.com/images/media/meals/4xcfai1763765676.jpg",name:"Bang bang prawn salad",emoji:"",xp:61,difficulty:"Medium",time:"40 min",category:"Asian",diets:["Gluten-free"],macros:{calories:421,protein:27,carbs:47,fat:17,fiber:2},done:false,ingredients:["140g Rice Noodles","3 tablespoons Peanut Butter","4 tablespoons Coconut Milk","3  tablespoons sweet chilli sauce","3 sliced thinly Spring Onions","1 sliced Cucumber","300g Bean Sprouts","200g Prawns"],steps:[{title:"Mix",body:"Cook the noodles following pack instructions, then rinse under cold water and drain thoroughly. In a small saucepan melt together the peanut butter, coconut milk, sweet chilli sauce and half the spring onions, adding 1-2 tbsp of water to loosen the mixture to a drizzling consiste",timer:0},{title:"Mix",body:"Mix the noodles, cucumber and beansprouts in a serving dish. Top with the prawns, drizzle over the peanut sauce and scatter over the remaining spring onions.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/bang-bang-prawn-salad"},
  {id:53103,photo:"https://www.themealdb.com/images/media/meals/4o4wh11761848573.jpg",name:"Barramundi with Moroccan spices",emoji:"",xp:70,difficulty:"Medium",time:"30 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:540,protein:31,carbs:44,fat:28,fiber:2},done:false,ingredients:["2 x 400g barramundi","1/2 teaspoon Ground Cumin","1/2 tsp Coriander","Pinch Paprika","Pinch Chili Powder","2 Garlic Clove","Juice of 1 Lemon","5 tablespoons Olive Oil","Bunch Coriander"],steps:[{title:"Season",body:"Tip all the dressing ingredients into a food processor with a pinch of salt and blitz to a dressing. Slash the fish three times on each side, coat with half of the dressing, then set aside to marinate for about 30 mins.",timer:1800},{title:"Preheat",body:"Heat oven to 220C/fan 200C/gas 7. Place the fish on a roasting tray, then cook in the oven for 20 mins until the flesh is firm and the eyes have turned white. Serve the fish with the rest of the dressing and steamed couscous or rice.",timer:1200},{title:"Cook",body:"KNOW HOW: HOW TO COOK IT: Cooking barramundi on the bone, as we have done here, has its advantages – it will stay more moist during cooking, and some would say that the flavour is enhanced, too. If you want to take out the bones they are easy to locate and less likely to be lodge",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/barramundi-moroccan-spices"},
  {id:52819,photo:"https://www.themealdb.com/images/media/meals/uvuyxu1503067369.jpg",name:"Cajun spiced fish tacos",emoji:"",xp:143,difficulty:"Hard",time:"10 min",category:"Mexican",diets:["No restrictions"],macros:{calories:492,protein:26,carbs:60,fat:17,fiber:6},done:false,ingredients:["2 tbsp cajun","1 tsp cayenne pepper","4 fillets white fish","1 tsp vegetable oil","8 flour tortilla","1 sliced avocado","2 shredded little gem lettuce","4 shredded Spring Onions","1 x 300ml salsa","1 pot sour cream","1 lemon","1 clove finely chopped garlic"],steps:[{title:"Cook",body:"Cooking in a cajun spice and cayenne pepper marinade makes this fish super succulent and flavoursome. Top with a zesty dressing and serve in a tortilla for a quick, fuss-free main that's delightfully summery.",timer:0},{title:"Mix",body:"On a large plate, mix the cajun spice and cayenne pepper with a little seasoning and use to coat the fish all over.",timer:0},{title:"Preheat",body:"Heat a little oil in a frying pan, add in the fish and cook over a medium heat until golden. Reduce the heat and continue frying until the fish is cooked through, about 10 minutes. Cook in batches if you don’t have enough room in the pan.",timer:600},{title:"Season",body:"Meanwhile, prepare the dressing by combining all the ingredients with a little seasoning.",timer:0},{title:"Preheat",body:"Soften the tortillas by heating in the microwave for 5-10 seconds. Pile high with the avocado, lettuce and spring onion, add a spoonful of salsa, top with large flakes of fish and drizzle over the dressing.",timer:0}],tip:"Original recipe: https://realfood.tesco.com/recipes/cajun-spiced-fish-tacos.html"},
  {id:53154,photo:"https://www.themealdb.com/images/media/meals/92wbmf1763252334.jpg",name:"Clam, chorizo & white bean stew",emoji:"",xp:63,difficulty:"Medium",time:"5 min",category:"Comfort",diets:["Vegetarian"],macros:{calories:564,protein:32,carbs:32,fat:26,fiber:1},done:false,ingredients:["50g Chorizo","1 chopped Onion","1 Garlic Clove","Bunch Parsley","200ml Vegetable Stock","400g Tinned Tomatos","400g Butter Beans","1 teaspoon Sherry vinegar","600g Clams","To serve Crusty Bread"],steps:[{title:"Preheat",body:"Fry the chorizo in a large frying pan with a lid, over a medium heat until it is starting to crisp up and release its oil. Add the onion and cook for 5 mins until starting to soften. Then add the garlic and finely chopped parsley, and fry for 1 min more.",timer:300},{title:"Preheat",body:"Pour on the stock and tomatoes. Bring to the boil, reduce the heat, then add the beans and sherry vinegar. Simmer for 10 mins until the liquid is slightly reduced.",timer:600},{title:"Prep",body:"Scatter over the clams, cover with the lid and steam for 2-4 mins, shaking the pan occasionally until the clams are open. Have a little taste before seasoning, as the clams can be quite salty. Then scatter over the chopped parsley. Eat with lots of crusty bread.",timer:240}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/clam-chorizo-white-bean-stew"},
  {id:53370,photo:"https://www.themealdb.com/images/media/meals/47y6ii1765658818.jpg",name:"Egg Foo Young",emoji:"",xp:107,difficulty:"Hard",time:"3 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:411,protein:28,carbs:49,fat:17,fiber:5},done:false,ingredients:["1 cup Unsalted Beef Stock","1 tablespoon Soy Sauce","1 tablespoon Shaoxing Wine","1 tablespoon Oyster Sauce","1/2 tsp Pepper","1 tablespoon Cornstarch","1 tablespoon Water","1 tablespoon Cornstarch","1 tablespoon Water","8 large Egg","1/2 tsp Kosher Salt","1/4 tsp Sugar","1 Spring Onions","1 cup Mung Bean Sprouts","20 Shrimp","3 Cups Vegetable Oil","2 cups Jasmine Rice"],steps:[{title:"Preheat",body:"In a small saucepan, add the beef stock, soy sauce, Shaoxing wine, oyster sauce, and white pepper powder over medium heat. Whisk together and bring to a simmer. . Combine the cornstarch and water in a small bowl and whisk to dissolve. Add to the saucepan and whisk until the gravy",timer:120},{title:"Mix",body:"Make the egg foo young batter:. In a medium bowl, whisk together the cornstarch and water until dissolved. Add the eggs, salt, and sugar. Whisk until well combined and there are no more egg white clumps.",timer:0},{title:"Mix",body:"Add the green onion, bean sprouts, and shrimp. Stir until everything is evenly coated.. Fry the egg foo young:.",timer:0},{title:"Preheat",body:"Add the vegetable oil to a large wok; it should reach about 2 inches up the sides. Heat the oil over medium-high heat to 350°F, or until vigorous bubbles form around an inserted wooden chopstick. . With a ladle, gently and slowly add 1/4 of the omelet batter. Egg foo young should",timer:120},{title:"Prep",body:"Egg foo young can be a bit tricky to flip. The easiest method is to put a tool in each hand (a spider, slotted spoon, tongs, and large chopsticks are all good candidates) and gently coax the omelet over, pulling up on one side and pushing down and around on the other.. Remove the",timer:300},{title:"Preheat",body:"Plate each egg foo young over a bed of rice. Spoon the warm gravy over the top and serve immediately.",timer:0}],tip:"Original recipe: https://www.simplyrecipes.com/egg-foo-young-recipe-6890222"},
  {id:52944,photo:"https://www.themealdb.com/images/media/meals/1520084413.jpg",name:"Escovitch Fish",emoji:"",xp:155,difficulty:"Hard",time:"7 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:578,protein:27,carbs:35,fat:27,fiber:1},done:false,ingredients:["2 Pounds Red Snapper","1/2 cup Vegetable Oil","1 clove peeled crushed Garlic","1/2 tsp Ginger","2 sprigs Thyme","1 Bay Leaf","0.5 Red Pepper","0.5 Yellow Pepper","1 sliced Onion","1 chopped Carrots","1 tbs Sugar","1/2 tsp Allspice","1 tsp Worcestershire Sauce","1 Scotch Bonnet","1 Lime","3/4 cup Malt Vinegar","pinch Pepper"],steps:[{title:"Preheat",body:"Rinse fish; rub with lemon or lime, seasoned with salt and pepper or use your favorite seasoning. I used creole seasoning. Set aside or place in the oven to keep it warm until sauce is ready.",timer:0},{title:"Preheat",body:"In large skillet heat oil over medium heat, until hot, add the fish, cook each side- for about 5-7 minutes until cooked through and crispy on both sides. Remove fish and set aside. Drain oil and leave about 2-3 tablespoons of oil.",timer:420},{title:"Mix",body:"Add, bay leave, garlic and ginger, stir-fry for about a minute making sure the garlic does not burn.",timer:0},{title:"Mix",body:"Then add onion, bell peppers, thyme, scotch bonnet, sugar, all spice-continue stirring for about 2-3 minutes. Add vinegar, mix an adjust salt and pepper according to preference. Let it simmer for about 2 more minutes.",timer:180},{title:"Serve",body:"Discard bay leave, thyme spring and serve over fish with a side of this bammy. You may make the sauce about 2 days in advance.",timer:0}],tip:"Original recipe: https://www.africanbites.com/jamaican-escovitched-fish/"},
  {id:53043,photo:"https://www.themealdb.com/images/media/meals/a15wsa1614349126.jpg",name:"Fish fofos",emoji:"",xp:105,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:552,protein:35,carbs:34,fat:26,fiber:1},done:false,ingredients:["600g Haddock","300g Potatoes","1 chopped Green Chilli","3 tbs Coriander","1 tsp Cumin Seeds","1/2 tsp Pepper","3 cloves Garlic","2 pieces Ginger","2 tbs Flour","3 Eggs","75g Breadcrumbs","For frying Vegetable Oil"],steps:[{title:"Preheat",body:"Put the fish into a lidded pan and pour over enough water to cover. Bring to a simmer and gently poach for 10 minutes over a low heat with the lid on. Drain and flake the fish.",timer:600},{title:"Mix",body:"Put the fish, potato, green chilli, coriander, cumin, black pepper, garlic and ginger in a large bowl. Season, add the rice flour, mix well and break in 1 egg. Stir the mixture and divide into 15, then form into small logs. Break the remaining eggs into a bowl and whisk lightly. ",timer:1200},{title:"Preheat",body:"Heat 1cm of oil in a large frying pan over a medium heat. Fry the fofos in batches for 2 minutes on each side, turning gently to get an even golden brown colour all over. Drain on kitchen paper and repeat with the remaining fofos.",timer:120},{title:"Mix",body:"For the onion salad, mix together the onion, coriander and lemon juice with a pinch of salt. Serve with the fofos and mango chutney.",timer:0}],tip:"Original recipe: https://www.olivemagazine.com/recipes/fish-and-seafood/fish-fofos/"},
  {id:52802,photo:"https://www.themealdb.com/images/media/meals/ysxwuq1487323065.jpg",name:"Fish pie",emoji:"",xp:131,difficulty:"Hard",time:"15 min",category:"Comfort",diets:["No restrictions"],macros:{calories:540,protein:34,carbs:42,fat:30,fiber:2},done:false,ingredients:["900g Floury Potatoes","2 tbsp Olive Oil","600ml Semi-skimmed Milk","800g White Fish Fillets","1 tbsp Plain flour","Grating Nutmeg","3 tbsp Double Cream","200g Jerusalem Artichokes","1 finely sliced Leek","200g peeled raw Prawns","Large handful Parsley","Handful Dill","Grated zest of 1 Lemon","25g grated Gruyère","Juice of 1 Lemon"],steps:[{title:"Preheat",body:"Put the potatoes in a large pan of cold salted water and bring to the boil. Lower the heat, cover, then simmer gently for 15 minutes until tender. Drain, then return to the pan over a low heat for 30 seconds to drive off any excess water. Mash with 1 tbsp olive oil, then season.",timer:900},{title:"Preheat",body:"Meanwhile put the milk in a large sauté pan, add the fish and bring to the boil. Remove from the heat, cover and stand for 3 minutes. Remove the fish (reserving the milk) and pat dry with kitchen paper, then gently flake into an ovenproof dish, discarding the skin and any bones.",timer:180},{title:"Preheat",body:"Heat the remaining oil in a pan, stir in the flour and cook for 30 seconds. Gradually stir in 200-250ml of the reserved milk (discard the rest). Grate in nutmeg, season, then bubble until thick. Stir in the cream.",timer:0},{title:"Preheat",body:"Preheat the oven to 190°C/fan170°C/gas 5. Grate the artichokes and add to the dish with the leek, prawns and herbs. Stir the lemon zest and juice into the sauce, then pour over. Mix gently with a wooden spoon.",timer:0},{title:"Mix",body:"Spoon the mash onto the fish mixture, then use a fork to make peaks, which will crisp and brown as it cooks. Sprinkle over the cheese, then bake for 35-40 minutes until golden and bubbling. Serve with wilted greens.",timer:2400}],tip:"A classic British dish."},
  {id:53079,photo:"https://www.themealdb.com/images/media/meals/7n8su21699013057.jpg",name:"Fish Soup (Ukha)",emoji:"",xp:81,difficulty:"Medium",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:571,protein:31,carbs:35,fat:30,fiber:5},done:false,ingredients:["2 tbs Olive Oil","1 sliced Onion","2 medium Carrots","3 cups Fish Stock","3 cups Water","4 large Potatoes","3 Bay Leaf","1 Cod","1 Salmon"],steps:[{title:"Preheat",body:"In a medium pot, heat the olive oil over medium-high heat. Add the onions and cook, stirring occasionally until the onions start to caramelize. Add the carrots and cook until the carrots start to soften, about 4 more minutes.",timer:0},{title:"Preheat",body:"Add the stock, water, potatoes, bay leaves, and black peppercorns. Season with salt and bring to a boil. Reduce heat, cover and cook for 10 minutes. Add the millet and cook for 15 more minutes until millet and potatoes are cooked.",timer:600},{title:"Mix",body:"Gently add the fish cubes. Stir and bring the soup to a simmer. The fish will cook through very fast, so make sure to not overcook them. They are done when the flesh is opaque and flakes easily.",timer:0},{title:"Prep",body:"Garnish the soup with chopped fresh dill or parsley before serving.",timer:0}],tip:"Original recipe: https://www.curiouscuisiniere.com/ukha-russian-fish-soup/"},
  {id:52918,photo:"https://www.themealdb.com/images/media/meals/vptqpw1511798500.jpg",name:"Fish Stew with Rouille",emoji:"",xp:113,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:560,protein:36,carbs:37,fat:28,fiber:2},done:false,ingredients:["6 large Prawns","3 tbs Olive Oil","150ml Dry White Wine","200ml Fish Stock","1 small finely diced Fennel","1 small finely diced Onion","3 cloves Chopped Garlic","1 large Potatoes","1 Orange","1 Star Anise","1 Bay Leaf","1 1/2 tsp Harissa Spice","2 tbs Tomato Puree","400g Chopped Tomatoes","Handful Mussels","200g White Fish","2 Thyme","to serve Bread"],steps:[{title:"Cook",body:"Twist the heads from the prawns, then peel away the legs and shells, but leave the tails intact. Devein each prawn. Fry the shells in 1 tbsp oil for 5 mins, until dark pink and golden in patches. Add the wine, boil down by two thirds, then pour in the stock. Strain into a jug, di",timer:300},{title:"Preheat",body:"Heat the rest of the oil in a deep frying pan or casserole. Add the fennel, onion and garlic, season, then cover and gently cook for 10 mins until softened. Meanwhile, peel the potato and cut into 2cm-ish chunks. Put into a pan of cold water, bring to the boil and cook for 5 mins",timer:600},{title:"Cook",body:"Peel a strip of zest from the orange. Put the zest, star anise, bay and ½ tsp harissa into the pan. Fry gently, uncovered, for 5-10 mins, until the vegetables are soft, sweet and golden.",timer:600},{title:"Preheat",body:"Stir in the tomato purée, cook for 2 mins, then add the tomatoes and stock. Simmer for 10 mins until the sauce thickens slightly. Season to taste. The sauce can be made ahead, then reheated later in the day. Meantime, scrub the mussels or clams and pull away any stringy beards. A",timer:120},{title:"Preheat",body:"Reheat the sauce if necessary, then stir the potato, chunks of fish and prawns very gently into the stew. Bring back to the boil, then cover and gently simmer for 3 mins. Scatter the mussels or clams over the stew, then cover and cook for 2 mins more or until the shells have open",timer:180},{title:"Mix",body:"To make the quick rouille, stir the rest of the harissa through the mayonnaise. Serve the stew in bowls, topped with spoonfuls of rouille, which will melt into the sauce and enrich it. Have some good bread ready, as you’ll definitely want to mop up the juices.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/532640/summer-fish-stew-with-rouille"},
  {id:53122,photo:"https://www.themealdb.com/images/media/meals/raqjbj1762773035.jpg",name:"Fiskesuppe (Creamy Norwegian Fish Soup)",emoji:"",xp:147,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["No restrictions"],macros:{calories:550,protein:27,carbs:40,fat:30,fiber:2},done:false,ingredients:["1 lb Fish fillet","1 clove Garlic","2 medium Potatoes","2 Carrots","1 Leek","3  tablespoons Butter","5 tablespoons Flour","4 cups Fish Stock","1 cup Milk","1 1/4 cup Creme Fraiche","1 cup Shrimp","1 tablespoon Chives"],steps:[{title:"Prep",body:"Cut the fish fillets in cubes or strips. Crush or chop the garlic. Rinse the vegetables and cut into thin strips.",timer:0},{title:"Preheat",body:"Heat the butter in a pot and add the garlic. Once the garlic starts to turn golden add the flour, whisking well.",timer:0},{title:"Mix",body:"Add the fish stock and continue to whisk until there are no lumps.",timer:0},{title:"Cook",body:"Add the vegetables and milk and bring to a boil. Cook for about 10 minutes.",timer:600},{title:"Preheat",body:"Add the crème fraîche (or sour cream). Bring the soup back to a simmer and once the soup begins to bubble again turn off the heat. Keep the soup on the burner and add the fish. Let the fish cook in the hot soup for 5 minutes. If using shrimp, add right before serving.",timer:300},{title:"Combine",body:"Sprinkle with chives (or dill or parsley) before serving.",timer:0}],tip:"Original recipe: https://scandinaviancookbook.com/fiskesuppe-creamy-norwegian-fish-soup/"},
  {id:53178,photo:"https://www.themealdb.com/images/media/meals/yhi46r1763330279.jpg",name:"Fried calamari",emoji:"",xp:79,difficulty:"Medium",time:"3 min",category:"Comfort",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:547,protein:28,carbs:35,fat:31,fiber:2},done:false,ingredients:["300g Squid","200g Plain Flour","2 tblsp Capers","1 clove peeled crushed Garlic","5 tblsp Mayonnaise","For frying Vegetable Oil","To serve Lemon"],steps:[{title:"Mix",body:"Cut the squid into rings about ½cm thick. Tip the flour into a freezer bag and season well. Add the capers, then give everything a good shake to mix together. Tip the squid into the bag, then shake again until all the rings are well coated. Mix together the garlic and mayonnaise,",timer:0},{title:"Preheat",body:"Pour some oil into a large pan until it comes about 7cm up the sides, but the pan is no more than a third full. Place over a medium heat and let the oil warm up. To test that the oil is ready, place a small piece of bread in the pan – it should sizzle when it touches the oil.",timer:0},{title:"Cook",body:"Remove a handful of squid from the flour and shake off any excess. Gently drop into the oil, then cook for about 3 mins until crisp. Remove with a slotted spoon and place on kitchen paper. Repeat with the remaining squid. Serve straight away with the mayonnaise and lemon wedges.",timer:180}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/crispy-squid-capers"},
  {id:53144,photo:"https://www.themealdb.com/images/media/meals/ze8uwg1763196123.jpg",name:"Gambas al ajillo",emoji:"",xp:69,difficulty:"Medium",time:"2 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:572,protein:29,carbs:42,fat:30,fiber:1},done:false,ingredients:["12 Raw King Prawns","3 Garlic Clove","100 ml Olive Oil","3 Cayenne Pepper","1 tablespoon chopped Parsley"],steps:[{title:"Cook",body:"Peel the prawns, leaving the tails intact, and, using a cocktail stick, remove the digestive tracts. Or, if you are using a frying pan rather than a terracotta pot, you can cook the prawns in their shells. Season with a little sea salt.",timer:0},{title:"Preheat",body:"Put the garlic, olive oil and chillies in a flameproof terracotta pot or frying pan and set over a high heat. When the garlic starts to turn golden, add the prawns and cook for 1-2 mins on each side until just pink. Sprinkle over the chopped parsley and some freshly cracked black",timer:120}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/gambas-al-ajillo"},
  {id:52764,photo:"https://www.themealdb.com/images/media/meals/wuvryu1468232995.jpg",name:"Garides Saganaki",emoji:"",xp:72,difficulty:"Medium",time:"5 min",category:"Mediterranean",diets:["Gluten-free"],macros:{calories:344,protein:20,carbs:25,fat:17,fiber:4},done:false,ingredients:["500g Raw king prawns","3 tablespoons Olive oil","1 Chopped onion","pinch Freshly chopped parsley","250ml White wine","1 (400g) tin Chopped tomatoes","1/2 teaspoon Minced garlic","1 (200g) pack Cubed Feta cheese"],steps:[{title:"Simmer",body:"Place the prawns in a pot and add enough water to cover. Boil for 5 minutes. Drain, reserving the liquid, and set aside.",timer:300},{title:"Preheat",body:"Heat 2 tablespoons of oil in a saucepan. Add the onion; cook and stir until soft. Mix in the parsley, wine, tomatoes, garlic and remaining olive oil. Simmer, stirring occasionally, for about 30 minutes, or until the sauce is thickened.",timer:1800},{title:"Rest",body:"While the sauce is simmering, the prawns should become cool enough to handle. First remove the legs by pinching them, and then pull off the shells, leaving the head and tail on.",timer:0},{title:"Preheat",body:"When the sauce has thickened, stir in the prawns. Bring to a simmer again if the sauce has cooled with the prawns, and cook for about 5 minutes. Add the feta and remove from the heat. Let stand until the cheese starts to melt. Serve warm with slices of crusty bread.",timer:300},{title:"Serve",body:"Though completely untraditional, you can add a few tablespoons of stock or passata to this recipe to make a delicious pasta sauce. Toss with pasta after adding the feta, and serve.",timer:0}],tip:"A classic Greek dish."},
  {id:53180,photo:"https://www.themealdb.com/images/media/meals/u2lhqb1763331899.jpg",name:"Garlicky prawns with sherry",emoji:"",xp:37,difficulty:"Easy",time:"20 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:572,protein:30,carbs:42,fat:32,fiber:5},done:false,ingredients:["3  tablespoons Olive Oil","3 cloves Chopped Garlic","400g Prawns","2 tbsp Dry sherry","Handful Parsley"],steps:[{title:"Preheat",body:"Heat the olive oil in a large frying pan. Tip in the garlic slices and cook for a few secs. Then stir through the prawns and cook for a couple of mins until they start to turn pink.",timer:0},{title:"Cook",body:"Pour over the sherry and cook for a few mins more, just until the prawns are cooked through. Sprinkle with parsley before serving.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/garlicky-prawns-sherry"},
  {id:53041,photo:"https://www.themealdb.com/images/media/meals/lpd4wy1614347943.jpg",name:"Grilled Portuguese sardines",emoji:"",xp:77,difficulty:"Medium",time:"5 min",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:562,protein:32,carbs:42,fat:30,fiber:3},done:false,ingredients:["8 Sardines","2 tbs Olive Oil","3 cloves Garlic","1 tbs Paprika","1/2 Lemon","4 sprigs Rosemary","1 Red Chilli"],steps:[{title:"Mix",body:"Put all of the ingredients, except the sardines, into a bowl and mix together with some seasoning. Pour into a baking dish, add the sardines and toss really well. Cover and chill for a few hours.",timer:0},{title:"Preheat",body:"Heat a BBQ or griddle pan until hot. Cook the sardines for 4-5 minutes on each side or until really caramelised and charred. Put onto a serving plate, drizzle with oil, sprinkle with a little more paprika and squeeze over the lemon wedges.",timer:300}],tip:"Original recipe: https://www.olivemagazine.com/recipes/fish-and-seafood/grilled-portuguese-sardines/"},
  {id:52773,photo:"https://www.themealdb.com/images/media/meals/xxyupu1468262513.jpg",name:"Honey Teriyaki Salmon",emoji:"",xp:32,difficulty:"Easy",time:"20 min",category:"Japanese",diets:["Gluten-free","Dairy-free"],macros:{calories:386,protein:19,carbs:53,fat:14,fiber:4},done:false,ingredients:["1 lb Salmon","1 tablespoon Olive oil","2 tablespoons Soy Sauce","2 tablespoons Sake","4 tablespoons Sesame Seed"],steps:[{title:"Mix",body:"Mix all the ingredients in the Honey Teriyaki Glaze together. Whisk to blend well. Combine the salmon and the Glaze together.",timer:0},{title:"Preheat",body:"Heat up a skillet on medium-low heat. Add the oil, Pan-fry the salmon on both sides until it’s completely cooked inside and the glaze thickens.",timer:0},{title:"Serve",body:"Garnish with sesame and serve immediately.",timer:0}],tip:"A classic Japanese dish."},
  {id:53362,photo:"https://www.themealdb.com/images/media/meals/n7h5zs1765318909.jpg",name:"Jamaican Curry Shrimp Recipe",emoji:"",xp:130,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:556,protein:34,carbs:39,fat:30,fiber:3},done:false,ingredients:["1 lb Jumbo Shrimp","2.5 tbsp Jamaican Curry Powder","1 tsp All-purpose Seasoning","2 tablespoons Olive Oil","1 sliced Onion","1 sliced Red Pepper","1 sliced Green Pepper","1 sliced Scotch Bonnet","3 cloves Chopped Garlic","380g Unsweetened Coconut Milk","1/2 tbs Tomato Ketchup","4 sprigs Thyme","To taste Salt","To taste Pepper"],steps:[{title:"Prep",body:"Season shrimp with 1 Tablespoon of curry powder and all-purpose seasoning and set aside for about 10 minutes while you prepare the other ingredients like chopping your onions, peppers, and garlic.",timer:600},{title:"Preheat",body:"Heat 2 Tablespoons of olive oil in a large skillet over medium heat. Add sliced yellow onion, red bell pepper, green bell pepper, scotch bonnet pepper, if using, and chopped garlic and stir for 5 minutes, until peppers are slightly softened.",timer:300},{title:"Mix",body:"Add 1.5 Tablespoons of curry powder to the skillet and stir for an additional minute.",timer:0},{title:"Season",body:"Then add coconut milk, seasoned shrimp, ketchup, and thyme, making sure the shrimp is covered in the sauce.",timer:0},{title:"Preheat",body:"Allow the sauce to come to a simmer and continue to cook over medium heat, stirring occasionally and flipping the shrimp halfway, until the shrimp is fully cooked on both sides. This should take about 5-6 minutes. Salt and pepper to taste.",timer:360}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-curry-shrimp/#recipe"},
  {id:53349,photo:"https://www.themealdb.com/images/media/meals/bx07m71764792853.jpg",name:"Jamaican Pepper Shrimp",emoji:"",xp:144,difficulty:"Hard",time:"10 min",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:574,protein:33,carbs:41,fat:30,fiber:2},done:false,ingredients:["1 lb Shrimp","2 chopped Scotch Bonnet","1 tablespoon All-purpose Seasoning","2 tsp Ground Annatto","2 tsp Allspice","3/4 cup Shrimp Stock","1/4 cup Onion","2 cloves minced Garlic","2 tablespoons White Vinegar","3 sprigs Thyme","To taste Salt"],steps:[{title:"Mix",body:"In a medium bowl, combine shrimp with minced Scotch Bonnet peppers, all-purpose seasoning, ground annatto, and grounf allspice. Toss well to coat evenly and let marinate for 10 minutes.",timer:600},{title:"Preheat",body:"Heat a large pan over medium heat. Add the shrimp stock and bring to a gentle simmer. Stir in the diced onion and garlic, cooking until softened and fragrant, about 2 minutes.",timer:120},{title:"Mix",body:"Add the seasoned shrimp and thyme sprigs, spreading the shrimp in the pan. Cover and cook for about 5–7 minutes, stirring occasionally, until the shrimp turn bright orange and are cooked through.",timer:420},{title:"Mix",body:"Add the white vinegar, stir, and cook for another minute. Taste; add salt to taste. Using a slotted spoon, transfer the shrimp to a plate. Serve hot with some cooking liquid drizzled on top.",timer:0}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-pepper-shrimp-recipe/#recipe"},
  {id:52887,photo:"https://www.themealdb.com/images/media/meals/utxqpt1511639216.jpg",name:"Kedgeree",emoji:"",xp:118,difficulty:"Hard",time:"5 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:541,protein:33,carbs:35,fat:27,fiber:5},done:false,ingredients:["300g Smoked Haddock","2 Bay Leaves","300ml Milk","4 Eggs","Handful Parsley","Handful Coriander","2 tbs Vegetable Oil","1 chopped Onion","1 tsp Coriander","2 tsp Curry Powder","300g Rice"],steps:[{title:"Preheat",body:"For the rice, heat the oil in a large, lidded pan, add the onion, then gently fry for 5 mins until softened but not coloured. Add the spices, season with salt, then continue to fry until the mix start to go brown and fragrant; about 3 mins.",timer:300},{title:"Preheat",body:"Add the rice and stir in well. Add 600ml water, stir, then bring to the boil. Reduce to a simmer, then cover for 10 mins. Take off the heat and leave to stand, covered, for 10-15 mins more. The rice will be perfectly cooked if you do not lift the lid before the end of the cooking",timer:600},{title:"Mix",body:"Meanwhile, put the haddock and bay leaves in a frying pan, cover with the milk, then poach for 10 mins until the flesh flakes. Remove from the milk, peel away the skin, then flake the flesh into thumbsize pieces. Place the eggs in a pan, cover with water, bring to the boil, then ",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/10421/kedgeree"},
  {id:52946,photo:"https://www.themealdb.com/images/media/meals/1525873040.jpg",name:"Kung Po Prawns",emoji:"",xp:124,difficulty:"Hard",time:"10 min",category:"Asian",diets:["Dairy-free"],macros:{calories:405,protein:22,carbs:45,fat:18,fiber:6},done:false,ingredients:["400g Prawns","2 tbs Soy Sauce","1 tsp Tomato Puree","1 tsp Corn Flour","1 tsp Caster Sugar","1 tsp Sunflower Oil","85g Peanuts","3 Large Chilli","1 tbs Brown Sugar","6 cloves Garlic Clove","450g Water Chestnut","to taste Ginger"],steps:[{title:"Mix",body:"Mix the cornflour and 1 tbsp soy sauce, toss in the prawns and set aside for 10 mins. Stir the vinegar, remaining soy sauce, tomato purée, sugar and 2 tbsp water together to make a sauce.",timer:600},{title:"Preheat",body:"When you’re ready to cook, heat a large frying pan or wok until very hot, then add 1 tbsp oil. Fry the prawns until they are golden in places and have opened out– then tip them out of the pan.",timer:0},{title:"Preheat",body:"Heat the remaining oil and add the peanuts, chillies and water chestnuts. Stir-fry for 2 mins or until the peanuts start to colour, then add the ginger and garlic and fry for 1 more min. Tip in the prawns and sauce and simmer for 2 mins until thickened slightly. Serve with rice.",timer:120}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1415664/kung-po-prawns"},
  {id:52821,photo:"https://www.themealdb.com/images/media/meals/rvypwy1503069308.jpg",name:"Laksa King Prawn Noodles",emoji:"",xp:72,difficulty:"Medium",time:"1 min",category:"Asian",diets:["Gluten-free"],macros:{calories:438,protein:21,carbs:46,fat:18,fiber:2},done:false,ingredients:["1 tbsp Olive Oil","1 finely sliced Red Chilli","2 ½ tbsp Thai red curry paste","1 vegetable stock cube","400ml can coconut milk","2 tsp fish sauce","100g rice noodles","2 juice of 1, the other halved lime","150g king prawns","½ small pack coriander"],steps:[{title:"Preheat",body:"Heat the oil in a medium saucepan and add the chilli. Cook for 1 min, then add the curry paste, stir and cook for 1 min more. Dissolve the stock cube in a large jug in 700ml boiling water, then pour into the pan and stir to combine. Tip in the coconut milk and bring to the boil.",timer:60},{title:"Preheat",body:"Add the fish sauce and a little seasoning. Toss in the noodles and cook for a further 3-4 mins until softening. Squeeze in the lime juice, add the prawns and cook through until warm, about 2-3 mins. Scatter over some of the coriander.",timer:240},{title:"Serve",body:"Serve in bowls with the remaining coriander and lime wedges on top for squeezing over.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/prawn-laksa-curry-bowl"},
  {id:52777,photo:"https://www.themealdb.com/images/media/meals/wvqpwt1468339226.jpg",name:"Mediterranean Pasta Salad",emoji:"",xp:77,difficulty:"Medium",time:"10 min",category:"Italian",diets:["Gluten-free","Dairy-free"],macros:{calories:535,protein:16,carbs:77,fat:23,fiber:4},done:false,ingredients:["200 g mozzarella balls","250 g baby plum tomatoes","1  bunch fresh basil","350 g farfalle","3  tablespoons extra virgin olive oil","40 g Green Olives","200 g tuna","to taste salt","to taste pepper"],steps:[{title:"Season",body:"Bring a large saucepan of salted water to the boil.",timer:0},{title:"Mix",body:"Add the pasta, stir once and cook for about 10 minutes or as directed on the packet.",timer:600},{title:"Prep",body:"Meanwhile, wash the tomatoes and cut into quarters. Slice the olives. Wash the basil.",timer:0},{title:"Mix",body:"Put the tomatoes into a salad bowl and tear the basil leaves over them. Add a tablespoon of olive oil and mix.",timer:0},{title:"Rest",body:"When the pasta is ready, drain into a colander and run cold water over it to cool it quickly.",timer:0},{title:"Combine",body:"Toss the pasta into the salad bowl with the tomatoes and basil.",timer:0},{title:"Mix",body:"Add the sliced olives, drained mozzarella balls, and chunks of tuna. Mix well and let the salad rest for at least half an hour to allow the flavours to mingle.",timer:0},{title:"Season",body:"Sprinkle the pasta with a generous grind of black pepper and drizzle with the remaining olive oil just before serving.",timer:0}],tip:"Original recipe: https://thelemonsqueezy.com/recipe/mediterranean-pasta-salad/"},
  {id:53373,photo:"https://www.themealdb.com/images/media/meals/grhn401765687086.jpg",name:"Air Fryer Egg Rolls",emoji:"",xp:156,difficulty:"Hard",time:"4 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:433,protein:26,carbs:55,fat:20,fiber:6},done:false,ingredients:["1 tablespoon Olive Oil","1 lb Ground Pork","1 clove peeled crushed Garlic","1 tablespoon Ginger","1 medium Carrots","3 chopped Scallions","3 Cups Cabbage","1 tablespoon Soy Sauce","1 tablespoon Rice Vinegar","12 Egg Roll Wrappers","For brushing Oil","To serve Duck Sauce","To serve Plum Sauce","To serve Soy Sauce"],steps:[{title:"Preheat",body:"Alternative Pan Fry Method: If you don’t have access to an air fryer, you can make these egg rolls using a traditional pan fry method. Add enough oil to a medium skillet with high walls so the oil is about 1/2 inch up the side of the skillet. Heat oil on medium high heat until it",timer:180},{title:"Preheat",body:"Add garlic, ginger, carrot, scallions, and cabbage. Continue to cook until cabbage wilts down and is soft, another 3 to 4 minutes, stirring regularly. Season the filling with soy sauce and rice wine vinegar, and take off the heat to cool. (This filling can be made in advance.). A",timer:180},{title:"Mix",body:"Place a single egg roll wrapper on a dry surface with one point of the square facing you (like a diamond). Place about 1/4 cup of the egg roll filling mixture in the middle of the wrapper.. Dip your fingers in water and run around the edges of the wrapper. Then fold the edges of ",timer:0},{title:"Cook",body:"Air fry the egg rolls:. Place the egg rolls in the basket of your air fryer. Spray or brush them lightly with oil. Add as many as you can without stacking the egg rolls, making sure they don’t touch. Air needs to circulate around them. Brush the egg rolls lightly with oil.",timer:0},{title:"Cook",body:"Place the basket in the air fryer and turn the air fryer to 350°F. Cook for 6 to 7 minutes, then flip the egg rolls, spray or brush with oil a second time on the bottom side, and cook for another 4 to 5 minutes.. Finished egg rolls should be golden brown and crispy! Serve immedia",timer:360}],tip:"Original recipe: https://www.simplyrecipes.com/recipes/air_fryer_chinese_egg_rolls/"},
  {id:53284,photo:"https://www.themealdb.com/images/media/meals/se5vhk1764114880.jpg",name:"Algerian Bouzgene Berber Bread with Roasted Pepper Sauce",emoji:"",xp:150,difficulty:"Hard",time:"8 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:281,protein:13,carbs:39,fat:8,fiber:8},done:false,ingredients:["2 Red Pepper","4 Tomato","1 tablespoon Olive Oil","4 Cloves Chopped Garlic","1 chopped Jalapeno","To taste Salt","2 Lbs Semolina","1 1/2 tsp Salt","3 Cups Water","4 tablespoons Olive Oil","6 tablespoons Olive Oil"],steps:[{title:"Preheat",body:"Preheat your oven's broiler. Place red bell peppers and tomatoes on a baking sheet, and roast under the broiler for about 8 minutes, turning occasionally. This should blacken the skin and help it peel off more easily. Cool, then scrape the skins off of the tomatoes and peppers, a",timer:480},{title:"Preheat",body:"Heat 1 tablespoon of olive oil in a skillet over medium heat. Add the jalapenos and garlic, and cook until tender, stirring frequently. Remove from heat, and transfer the garlic and jalapeno to the bowl with the tomatoes and red peppers. Using two sharp steak knives (one in each ",timer:0},{title:"Mix",body:"Place the semolina in a large bowl, and stir in salt and 4 tablespoons of olive oil. Gradually add water while mixing and squeezing with your hand until the dough holds together without being sticky or dry, and molds easily with the hand. Divide into 6 pieces and form into balls.",timer:0},{title:"Preheat",body:"For each round, heat 1 tablespoon of olive oil in a large heavy skillet over medium heat. Roll out dough one round at a time, to no thicker than 1/4 inch. Fry in the hot skillet until dark brown spots appear on the surface, and they are crispy. Remove from the skillet, and wrap i",timer:0},{title:"Add",body:"To eat the bread and sauce, break off pieces of the bread, and scoop them into the sauce. It will slide off, but just keep reaching in!.",timer:0}],tip:"Original recipe: https://www.allrecipes.com/recipe/72363/algerian-bouzgene-berber-bread-with-roasted-pepper-sauce/"},
  {id:53282,photo:"https://www.themealdb.com/images/media/meals/o2cd4r1764113576.jpg",name:"Algerian Carrots",emoji:"",xp:147,difficulty:"Hard",time:"6 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:283,protein:16,carbs:40,fat:9,fiber:8},done:false,ingredients:["1 1/2 cup Water","2 Lbs Carrots","5 tablespoons Olive Oil","1 tsp Salt","1/2 teaspoon Black Pepper","1/2 teaspoon Ground Cinnamon","1/2 teaspoon Ground Cumin","3 Cloves Crushed Garlic","1/2 teaspoon Thyme","1 Bay Leaf","1 tsp Lemon Juice"],steps:[{title:"Preheat",body:"Place a steamer insert into a saucepan, and fill with 1 1/2 cups of water, or just below the bottom of the steamer. Cover, and bring the water to a boil over high heat. Add the sliced carrots, reduce the heat to medium, and cover the pan again. Steam until tender but not mushy, 4",timer:240},{title:"Preheat",body:"Heat the olive oil in a skillet over medium heat. Reduce the heat to low and stir in the salt, pepper, cinnamon, cumin, garlic, and thyme. Cook the spices and garlic, stirring frequently, until fragrant, about 10 minutes. Add the 1/2 cup reserved cooking liquid and the bay leaf, ",timer:600},{title:"Preheat",body:"Stir in the carrots, tossing well to coat with the spice mixture, and cook until heated through, about 2 to 3 minutes. Sprinkle with lemon juice and remove the bay leaf before serving.",timer:120}],tip:"Original recipe: https://www.allrecipes.com/recipe/99244/algerian-carrots/"},
  {id:53094,photo:"https://www.themealdb.com/images/media/meals/dlmh401760524897.jpg",name:"Baba Ghanoush",emoji:"",xp:65,difficulty:"Medium",time:"30 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:299,protein:13,carbs:45,fat:7,fiber:8},done:false,ingredients:["4 large Egg Plants","2 cloves Garlic","2 teaspoons Kosher Salt","1 Lemon","3  tablespoons Tahini","3  tablespoons Extra Virgin Olive Oil","2 tablespoons Greek Yogurt","1 pinch Cayenne Pepper","1 Leaf Mint","2 tablespoons Parsley"],steps:[{title:"Preheat",body:"Preheat an outdoor grill for medium-high heat and lightly oil the grate. Prick the surface of the skin of eggplants several times with the tip of a knife.",timer:0},{title:"Cook",body:"Place eggplants directly on grill. Turn frequently with tongs while skin chars. Cook until eggplants have collapsed and are very soft, 25 to 30 minutes. Transfer to a bowl and cover tightly with aluminum foil and allow to cool, about 15 minutes.",timer:1500},{title:"Rest",body:"When eggplants are cool enough to handle, split them in half and scrape flesh into a colander placed over a bowl. Drain 5 or 10 minutes.",timer:600},{title:"Mix",body:"Transfer eggplant to mixing bowl. Add crushed garlic and salt; mash until creamy but with a little texture, about 5 minutes. Whisk in lemon juice, tahini, olive oil, and cayenne pepper. Stir in yogurt.",timer:300},{title:"Mix",body:"Cover bowl with plastic wrap and refrigerate until completely chilled. Stir in mint and parsley, and taste to adjust seasonings before serving.",timer:0}],tip:"Original recipe: https://www.allrecipes.com/recipe/244553/chef-johns-baba-ghanoush/"},
  {id:53080,photo:"https://www.themealdb.com/images/media/meals/0206h11699013358.jpg",name:"Blini Pancakes",emoji:"",xp:72,difficulty:"Medium",time:"1 hr",category:"Healthy",diets:["Vegetarian"],macros:{calories:284,protein:15,carbs:40,fat:12,fiber:7},done:false,ingredients:["1/2 cup Buckwheat","2/3 Cup Flour","1/2 tsp Salt","1 tsp Yeast","1 cup Milk","2 tbs Butter","1 Seperated Egg"],steps:[{title:"Preheat",body:"In a large bowl, whisk together 1/2 cup buckwheat flour, 2/3 cup all-purpose flour, 1/2 teaspoon salt, and 1 teaspoon yeast.. Make a well in the center and pour in 1 cup warm milk, whisking until the batter is smooth.",timer:0},{title:"Rest",body:"Cover the bowl and let the batter rise until doubled, about 1 hour.. Enrich and Rest the Batter.",timer:3600},{title:"Mix",body:"Stir 2 tablespoons melted butter and 1 egg yolk into the batter.. In a separate bowl, whisk 1 egg white until stiff, but not dry.",timer:0},{title:"Mix",body:"Fold the whisked egg white into the batter.. Cover the bowl and let the batter stand 20 minutes.",timer:1200},{title:"Preheat",body:"Heat butter in a large nonstick skillet over medium heat.. Drop quarter-sized dollops of batter into the pan, being careful not to overcrowd the pan. Cook for about 1 minute or until bubbles form.",timer:60},{title:"Preheat",body:"Turn and cook for about 30 additional seconds.. Remove the finished blini onto a plate and cover them with a clean kitchen towel to keep warm. Add more butter to the pan and repeat the frying process with the remaining batter.",timer:0}],tip:"Original recipe: https://www.thespruceeats.com/russian-blini-recipe-buckwheat-pancakes-1136797"},
  {id:52914,photo:"https://www.themealdb.com/images/media/meals/qywups1511796761.jpg",name:"Boulangère Potatoes",emoji:"",xp:27,difficulty:"Easy",time:"5 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:297,protein:16,carbs:41,fat:7,fiber:5},done:false,ingredients:["2 finely chopped Onions","sprigs of fresh Thyme","2 tbs Olive Oil","1.5kg Potatoes","425g Vegetable Stock"],steps:[{title:"Preheat",body:"Heat oven to 200C/fan 180C/gas 6. Fry the onions and thyme sprigs in the oil until softened and lightly coloured (about 5 mins).",timer:300},{title:"Cook",body:"Spread a layer of potatoes over the base of a 1.5-litre oiled gratin dish. Sprinkle over a few onions (see picture, above) and continue layering, finishing with a layer of potatoes. Pour over the stock and bake for 50-60 mins until the potatoes are cooked and the top is golden an",timer:3600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/5056/boulangre-potatoes"},
  {id:52913,photo:"https://www.themealdb.com/images/media/meals/qqpwsy1511796276.jpg",name:"Brie wrapped in prosciutto & brioche",emoji:"",xp:64,difficulty:"Medium",time:"5 min",category:"Healthy",diets:["Vegetarian"],macros:{calories:295,protein:13,carbs:43,fat:6,fiber:7},done:false,ingredients:["375g Plain Flour","50g Caster Sugar","7g Yeast","75g Milk","3 Large Eggs","To Glaze Eggs","180g Butter","250g Brie","8 slices Prosciutto"],steps:[{title:"Mix",body:"Mix the flour, 1 tsp salt, caster sugar, yeast, milk and eggs together in a mixer using the dough attachment for 5 mins until the dough is smooth. Add the butter and mix for a further 4 mins on medium speed. Scrape the dough bowl and mix again for 1 min. Place the dough in a cont",timer:300},{title:"Preheat",body:"Wrap the Brie in the prosciutto and set aside. Turn out the dough onto a lightly floured surface. Roll into a 25cm circle. Place the wrapped Brie in the middle of the circle and fold the edges in neatly. Put the parcel onto a baking tray lined with baking parchment and brush with",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1803634/brie-wrapped-in-prosciutto-and-brioche"},
  {id:53060,photo:"https://www.themealdb.com/images/media/meals/tkxquw1628771028.jpg",name:"Burek",emoji:"",xp:69,difficulty:"Medium",time:"40 min",category:"Healthy",diets:["Gluten-free","Dairy-free"],macros:{calories:283,protein:8,carbs:42,fat:6,fiber:10},done:false,ingredients:["1 Packet Filo Pastry","150g Minced Beef","150g Onion","40g Oil","Dash Salt","Dash Pepper"],steps:[{title:"Prep",body:"Fry the finely chopped onions and minced meat in oil.",timer:0},{title:"Season",body:"Add the salt and pepper.",timer:0},{title:"Mix",body:"Grease a round baking tray and put a layer of pastry in it.",timer:0},{title:"Season",body:"Cover with a thin layer of filling and cover this with another layer of filo pastry which must be well coated in oil.",timer:0},{title:"Add",body:"Put another layer of filling and cover with pastry.",timer:0},{title:"Prep",body:"When you have five or six layers, cover with filo pastry, bake at 200ºC/392ºF for half an hour and cut in quarters and serve.",timer:0}],tip:"Original recipe: https://www.visit-croatia.co.uk/croatian-cuisine/croatian-recipes/"},
  {id:53256,photo:"https://www.themealdb.com/images/media/meals/16zbeu1763789342.jpg",name:"Cacik",emoji:"",xp:95,difficulty:"Medium",time:"40 min",category:"Mediterranean",diets:["Vegetarian","Gluten-free"],macros:{calories:346,protein:14,carbs:34,fat:13,fiber:8},done:false,ingredients:["500g Natural Yoghurt","2 tsp Lemon Juice","1 tablespoon Extra Virgin Olive Oil","1 tablespoon Dried Mint","1 Cucumber","2 cloves minced Garlic"],steps:[{title:"Prepare",body:"Put a sieve over a large bowl, line it with a thick sheet of non-dyed kitchen paper or a clean muslin cloth, and spoon in the yogurt. Cover with another sheet of kitchen paper and leave to strain in the fridge for a minimum of 12 hrs.",timer:0},{title:"Mix",body:"Add the lemon juice, most of the olive oil and the dried mint to a bowl and stir well for the dried mint to soften and soak up the juices. Mix in the strained yogurt, then pour away the strained yogurt liquid and leave that bowl to one side.",timer:0},{title:"Mix",body:"Halve the cucumber(s) lengthways and remove the seeds by running a teaspoon from the top to the bottom of the flesh, halve the cucumbers widthways to make them shorter and easier to handle, then coarsely grate each one into the bowl the yogurt was straining over. Using clean hand",timer:0},{title:"Mix",body:"Add the strained, grated cucumber, garlic and ¾ tsp flaky salt to the rest of the ingredients and mix well. Garnish with a drizzle of extra virgin olive oil and a sprinkling of dried mint.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/cacik"},
  {id:53361,photo:"https://www.themealdb.com/images/media/meals/73o3vq1765317873.jpg",name:"Callaloo and SaltFish",emoji:"",xp:65,difficulty:"Medium",time:"2 min",category:"Healthy",diets:["Gluten-free","Dairy-free"],macros:{calories:272,protein:12,carbs:45,fat:14,fiber:10},done:false,ingredients:["1/2 lb Salt Cod","4 Bacon","525g Callaloo","1 chopped Onion","2 chopped Spring Onions","2 cloves minced Garlic","1 chopped Scotch Bonnet","2 chopped Plum Tomatoes","2 sprigs Thyme","1/4 tsp Black Pepper"],steps:[{title:"Preheat",body:"Soak salted fish in water overnight. Next, heat salted fish in water on stove until water boils. You should see a foam on top. Remove from heat and drain. Set aside and shred salted fish once it cools.",timer:0},{title:"Preheat",body:"Cook bacon in skillet over medium heat until crispy. Remove bacon from heat and drain the majority of the bacon grease, leaving about 1 tablespoon in the skillet.",timer:0},{title:"Mix",body:"Add yellow onion, green onion, scotch bonnet pepper, and garlic to the skillet and stir. Cook for about 2 minutes or until onions soften. Add salted fish to skillet and stir. Cook for about a minute.",timer:120},{title:"Preheat",body:"Next, add callaloo, roma tomatoes, thyme, and black pepper. Stir to combine and cook until heated through, about 2 minutes.",timer:120}],tip:"Original recipe: https://www.myforkinglife.com/callaloo-and-saltfish/#recipe"},
  {id:53310,photo:"https://www.themealdb.com/images/media/meals/fm01ky1764366365.jpg",name:"Challah",emoji:"",xp:119,difficulty:"Hard",time:"10 min",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:268,protein:13,carbs:34,fat:9,fiber:7},done:false,ingredients:["500g Strong white bread flour","70g Caster Sugar","10g Yeast","2 Beaten Egg","70 ml Sunflower Oil","1 tablespoon Poppy Seeds"],steps:[{title:"Preheat",body:"Combine the yeast, a pinch of the sugar and a couple tablespoons of lukewarm water in a small bowl. Stir to dissolve the yeast, then leave for 10 mins until foamy.",timer:600},{title:"Preheat",body:"Meanwhile, combine the flour, the remaining sugar and 2 tsp fine salt in a large bowl. Make a well in the centre, then add half the beaten egg, the yeast mixture and the oil. Pour in 200ml lukewarm water (it should feel slightly warm to the touch) and stir with a spoon, then mix ",timer:0},{title:"Preheat",body:"Once the dough has come together, turn it out onto a lightly floured surface. Knead using both hands for 10 mins until smooth and a bit springy. If it gets very sticky, add a very small amount of flour – as little as possible. A dough scraper is useful if the dough is sticking to",timer:600},{title:"Season",body:"Line a baking sheet with baking parchment. Turn the dough out onto a clean work surface and divide into three equal pieces, weighing for accuracy, if you like. Roll each piece into a long sausage shape about 25cm long, tapering them slightly at both ends. Lay the pieces out in fr",timer:2400},{title:"Preheat",body:"Meanwhile, heat the oven to 200C/180C fan/gas 6. Gently brush the rest of the beaten egg all over the challah, getting it into all the crevices, and sprinkle with the poppy or sesame seeds, if using. Bake on a middle shelf of the oven for 25-30 mins, until the loaf is golden brow",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/challah"},
  {id:53290,photo:"https://www.themealdb.com/images/media/meals/oal8x31764119345.jpg",name:"Cheese Borek",emoji:"",xp:97,difficulty:"Medium",time:"30 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:283,protein:8,carbs:36,fat:8,fiber:9},done:false,ingredients:["1 beaten Egg","1  bunch Parsley","2 cloves minced Garlic","3/4 teaspoon Red Pepper","6 oz Gouda Cheese","6 oz Emmentaler Cheese","12 Phyllo Dough","1 1/2 cups Unsalted Butter"],steps:[{title:"Mix",body:"In a medium bowl, whisk together egg, parsley, garlic and crushed red pepper. Mix in Gouda and Emmentaler.",timer:0},{title:"Mix",body:"One sheet at a time, place phyllo dough on a flat surface and brush with about 1 tablespoon butter. Cut lengthwise into 4 strips. Place a rounded teaspoon of the egg mixture at one end of each strip. Fold corner of strip over the filling, forming a triangular fold. Continue foldi",timer:0},{title:"Preheat",body:"Preheat oven to 350 degrees F (175 degrees C). Lightly butter a large baking sheet.",timer:0},{title:"Preheat",body:"Arrange stuffed phyllo triangles in a single layer on the prepared baking sheet. Bake in the preheated oven 30 minutes, or until lightly browned. Serve warm.",timer:1800}],tip:"Original recipe: https://www.allrecipes.com/recipe/26728/cheese-borek/"},
  {id:52977,photo:"https://www.themealdb.com/images/media/meals/58oia61564916529.jpg",name:"Corba",emoji:"",xp:148,difficulty:"Hard",time:"3 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:367,protein:13,carbs:27,fat:15,fiber:3},done:false,ingredients:["1 cup Lentils","1 large Onion","1 large Carrots","1 tbs Tomato Puree","2 tsp Cumin","1 tsp Paprika","1/2 tsp Mint","1/2 tsp Thyme","1/4 tsp Black Pepper","1/4 tsp Red Pepper Flakes","4 cups Vegetable Stock","1 cup Water","Pinch Sea Salt"],steps:[{title:"Prepare",body:"Pick through your lentils for any foreign debris, rinse them 2 or 3 times, drain, and set aside.  Fair warning, this will probably turn your lentils into a solid block that you’ll have to break up later.",timer:0},{title:"Preheat",body:"In a large pot over medium-high heat, sauté the olive oil and the onion with a pinch of salt for about 3 minutes, then add the carrots and cook for another 3 minutes.",timer:180},{title:"Mix",body:"Add the tomato paste and stir it around for around 1 minute. Now add the cumin, paprika, mint, thyme, black pepper, and red pepper as quickly as you can and stir for 10 seconds to bloom the spices. Congratulate yourself on how amazing your house now smells.",timer:60},{title:"Season",body:"Immediately add the lentils, water, broth, and salt. Bring the soup to a (gentle) boil.",timer:0},{title:"Preheat",body:"After it has come to a boil, reduce heat to medium-low, cover the pot halfway, and cook for 15-20 minutes or until the lentils have fallen apart and the carrots are completely cooked.",timer:1200},{title:"Cook",body:"After the soup has cooked and the lentils are tender, blend the soup either in a blender or simply use a hand blender to reach the consistency you desire. Taste for seasoning and add more salt if necessary.",timer:0},{title:"Season",body:"Serve with crushed-up crackers, torn up bread, or something else to add some extra thickness.  You could also use a traditional thickener (like cornstarch or flour), but I prefer to add crackers for some texture and saltiness.  Makes great leftovers, stays good in the fridge for ",timer:0}],tip:"Original recipe: https://findingtimeforcooking.com/main-dishes/red-lentil-soup-corba/"},
  {id:53139,photo:"https://www.themealdb.com/images/media/meals/849jd81763075251.jpg",name:"Fainá",emoji:"",xp:42,difficulty:"Easy",time:"4 hrs",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:293,protein:15,carbs:27,fat:10,fiber:8},done:false,ingredients:["200g Chickpea Flour","600ml Water","4 tablespoons Olive Oil","To taste Salt","To taste Pepper"],steps:[{title:"Mix",body:"Prepare the Batter: Whisk together chickpea flour, water, salt, and pepper. Let sit for at least 4 hours.",timer:14400},{title:"Preheat",body:"Bake: Preheat the oven to 220°C (430°F). Pour olive oil into a round baking dish and heat in the oven. Pour in the batter and bake for 25-30 minutes, until golden.",timer:1800},{title:"Prep",body:"Serve: Slice and serve hot, optionally with black pepper on top.",timer:0},{title:"Rest",body:"Let the batter rest for at least 2 hours, or overnight in the refrigerator, to ensure the chickpea flour fully hydrates and the flavors meld.",timer:7200},{title:"Preheat",body:"For a crispy edge, preheat the baking pan with oil in the oven before adding the batter.",timer:0}],tip:"Original recipe: https://www.munchery.com/blog/the-ten-iconic-dishes-of-argentina-and-how-to-cook-them-at-home/"},
  {id:52919,photo:"https://www.themealdb.com/images/media/meals/ytttsv1511798734.jpg",name:"Fennel Dauphinoise",emoji:"",xp:78,difficulty:"Medium",time:"10 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:269,protein:13,carbs:35,fat:5,fiber:6},done:false,ingredients:["225g Potatoes","1 small Fennel","1 clove finely chopped Garlic","75 ml Milk","100ml Double Cream","For Greasing Butter","to serve Parmesan Cheese"],steps:[{title:"Preheat",body:"Heat oven to 180C/160C fan/gas 4. Put potatoes, fennel, and garlic in a medium non-stick pan. Pour in milk and double cream, season well and simmer gently, covered, for 10 mins, stirring halfway through, until potatoes are just tender.",timer:600},{title:"Mix",body:"Divide the mixture between 2 small (about 150ml) buttered ramekins and scatter with Parmesan. Bake for 40 mins until the potatoes are golden and tender when pierced with a knife. Snip the reserved fennel fronds over before serving.",timer:2400}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/fennel-dauphinoise"},
  {id:53030,photo:"https://www.themealdb.com/images/media/meals/9f4z6v1598734293.jpg",name:"Feteer Meshaltet",emoji:"",xp:158,difficulty:"Hard",time:"10 min",category:"Mediterranean",diets:["Vegetarian"],macros:{calories:364,protein:15,carbs:28,fat:17,fiber:3},done:false,ingredients:["4 cups Flour","1 1/2 cups Water","1/4 tsp Salt","1 cup Unsalted Butter","1/4 cup Olive Oil"],steps:[{title:"Mix",body:"Mix the flour and salt then pour one cup of water and start kneading.. If you feel the dough is still not coming together or too dry, gradually add the remaining water until you get a dough that is very elastic so that when you pull it and it won’t be torn.. Let the dough rest fo",timer:600},{title:"Preheat",body:"Warm up the butter/ghee or oil you are using and pour into a deep bowl.. Immerse the dough balls into the warm butter. Let it rest for 15 to 20 minutes.. Preheat oven to 550F.",timer:900},{title:"Mix",body:"Stretch the first ball with your hands on a clean countertop. Stretch it as thin as you can, the goal here is to see your countertop through the dough.. Fold the dough over itself to form a square brushing in between folds with the butter mixture.. Set aside and start making the ",timer:0},{title:"Mix",body:"Stretch the second one thin as we have done for the first ball.. Place the previous one on the middle seam side down. Fold the outer one over brushing with more butter mixture as you fold. Set aside.. Keep doing this for the third and fourth balls. Now we have one ready, place on",timer:0},{title:"Preheat",body:"Repeat for the remaining 4 balls to make a second one. With your hands lightly press the folded feteer to spread it on the baking dish.. Place in preheated oven for 10 minutes when the feteer starts puffing turn on the broiler to brown the top.. When it is done add little butter ",timer:600}],tip:"Original recipe: https://amiraspantry.com/egyptian-feteer-meshaltet/"},
  {id:52903,photo:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",name:"French Onion Soup",emoji:"",xp:63,difficulty:"Medium",time:"10 min",category:"Healthy",diets:["No restrictions"],macros:{calories:289,protein:12,carbs:37,fat:5,fiber:7},done:false,ingredients:["50g Butter","1 tbs Olive Oil","1 kg Onion","1 tsp Sugar","4 sliced Garlic Clove","2 tbs Plain Flour","250ml Dry White Wine","1L Beef Stock","4 sliced Bread","140g Gruyère"],steps:[{title:"Mix",body:"Melt the butter with the oil in a large heavy-based pan. Add the onions and fry with the lid on for 10 mins until soft. Sprinkle in the sugar and cook for 20 mins more, stirring frequently, until caramelised. The onions should be really golden, full of flavour and soft when pinch",timer:600},{title:"Preheat",body:"Add the garlic for the final few mins of the onions’ cooking time, then sprinkle in the flour and stir well. Increase the heat and keep stirring as you gradually add the wine, followed by the hot stock. Cover and simmer for 15-20 mins.",timer:1200},{title:"Preheat",body:"To serve, turn on the grill, and toast the bread. Ladle the soup into heatproof bowls. Put a slice or two of toast on top of the bowls of soup, and pile on the cheese. Grill until melted. Alternatively, you can complete the toasts under the grill, then serve them on top.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/3020694/french-onion-soup"},
  {id:53061,photo:"https://www.themealdb.com/images/media/meals/nv5lf31628771380.jpg",name:"Fresh sardines",emoji:"",xp:22,difficulty:"Easy",time:"20 min",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:274,protein:12,carbs:33,fat:13,fiber:6},done:false,ingredients:["500g Sardines","Dash Vegetable Oil","To Glaze Flour","Dash Salt"],steps:[{title:"Prepare",body:"Wash the fish under the cold tap.",timer:0},{title:"Cook",body:"Roll in the flour and deep fry in oil until crispy.",timer:0},{title:"Prep",body:"Lay on kitchen towel to get rid of the excess oil and serve hot or cold with a slice of lemon.",timer:0}],tip:"Original recipe: https://www.visit-croatia.co.uk/croatian-cuisine/croatian-recipes/"},
  {id:53272,photo:"https://www.themealdb.com/images/media/meals/8825lo1763815264.jpg",name:"Griddled flatbreads",emoji:"",xp:85,difficulty:"Medium",time:"1 hr",category:"Mediterranean",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:355,protein:17,carbs:32,fat:22,fiber:7},done:false,ingredients:["250g Strong Wholemeal Flour","250g Strong white bread flour","15g Yeast","1 tsp Sugar","2 tablespoons Olive Oil"],steps:[{title:"Preheat",body:"Tip the flours into a food processor. Add the yeast, sugar and 1tsp salt, then mix well. Pour in 350ml warm water and the oil, then process to a soft dough. Mix for 1 min, then leave until doubled in size, about 1 hour.",timer:3600},{title:"Preheat",body:"Pulse the dough a couple of times just to knock out the air, then tip onto a floured surface. Cut the dough in half and roll out one half to a rectangle about 20 x 40cm. Trim the edges using a large sharp knife, then cut into eight 10cm squares. Line a large tray or two baking sh",timer:1800},{title:"Cook",body:"Place bread directly onto the BBQ racks and cook for a couple of mins until they puff up, then flip over and cook on the other side. Tip into a basket and serve with the dips.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/griddled-flatbreads"},
  {id:53269,photo:"https://www.themealdb.com/images/media/meals/gpon5u1763801180.jpg",name:"Hummus",emoji:"",xp:28,difficulty:"Easy",time:"20 min",category:"Mediterranean",diets:["Vegetarian","Gluten-free"],macros:{calories:373,protein:22,carbs:26,fat:15,fiber:5},done:false,ingredients:["400g Chickpeas","1 tablespoon Tahini Paste","1 large Garlic Clove","3  tablespoons Greek Yogurt","Juice of half Lemon"],steps:[{title:"Prepare",body:"Drain the chickpeas into a sieve set over a bowl or jug to catch the liquid. Tip the chickpeas, tahini, garlic and yogurt into a food processor or blender and whizz to smooth.",timer:0},{title:"Cook",body:"Whizz in a tbsp of the chickpea liquid at a time until you have a nice consistency, then scrape into a bowl.",timer:0},{title:"Mix",body:"Stir in a squeeze of lemon juice and season to taste.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/easy-hummus-recipe"},
  {id:53353,photo:"https://www.themealdb.com/images/media/meals/tsdbcq1764795636.jpg",name:"Jamaican Boiled Dumplings",emoji:"",xp:85,difficulty:"Medium",time:"20 min",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:297,protein:10,carbs:39,fat:8,fiber:7},done:false,ingredients:["8 cups Water","1/2 tbs Salt","2 cups All purpose flour","1 tsp Salt","1/2 cup Water"],steps:[{title:"Season",body:"In a large pot, bring water and salt to a boil to boil the dumplings.",timer:0},{title:"Mix",body:"In a large mixing bowl, combine the all-purpose flour and salt, stirring to distribute the salt evenly throughout the flour. Gradually add water to the flour mixture, mixing with your hands until a dough forms.",timer:0},{title:"Mix",body:"Divide the dough into equal-sized pieces, rolling each into a smooth ball. Flatten each ball slightly with the palm of your hand to form a round, circular dumpling. It should look like a thick disk.",timer:0},{title:"Mix",body:"Carefully drop the dumplings into the boiling water, one at a time, ensuring that they don't stick together. You can use a wooden spoon to stir the dumplings in the water.",timer:0},{title:"Mix",body:"Boil the dumplings for 15-20 minutes, or until they are cooked through and have risen to the surface of the water. Stir occasionally to prevent sticking.",timer:1200},{title:"Cook",body:"Use a slotted spoon to remove the cooked dumplings from the pot, allowing any excess water to drain.",timer:0},{title:"Serve",body:"Serve with your favorite recipes.",timer:0}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-boiled-dumplings/#recipe"},
  {id:53355,photo:"https://www.themealdb.com/images/media/meals/g6xb8m1764875029.jpg",name:"Jamaican Festival (Sweet Dumpling)",emoji:"",xp:95,difficulty:"Medium",time:"6 min",category:"Healthy",diets:["Vegetarian"],macros:{calories:272,protein:16,carbs:39,fat:6,fiber:7},done:false,ingredients:["1 1/2 cups All purpose flour","1/2 cup Cornmeal","6 tablespoons Sugar","2 tsp Baking Powder","1 tsp Vanilla Extract","1/2 tsp Salt","3/4 cup Milk","For frying Oil"],steps:[{title:"Preheat",body:"Heat a heavy bottom pot of oil that has at least 3 inches of oil in it or use a deep fryer if you have one. Turn the heat over medium heat until the temperature reaches 350 degrees Fahrenheit.",timer:0},{title:"Mix",body:"Add the all-purpose flour, cornmeal, granulated sugar, baking powder, and salt to a large bowl and stir to combine.",timer:0},{title:"Mix",body:"Add the vanilla extract and milk and stir until the dough comes together. Then use your hands to lightly form the mixture into a ball.",timer:0},{title:"Season",body:"Pinch off pieces of dough and roll them into long oval shapes. Make about 12 dumplings.",timer:0},{title:"Cook",body:"Once the oil has reached the temperature of 350 degrees Fahrenheit, fry the dough on all sides, until golden brown. This should take about 4-6 minutes.",timer:360},{title:"Serve",body:"Remove dough and drain off any excess grease. Serve and enjoy.",timer:0}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-festival-recipe/#recipe"},
  {id:53356,photo:"https://www.themealdb.com/images/media/meals/dd7t4d1764877271.jpg",name:"Jamaican Fried Dumplings",emoji:"",xp:73,difficulty:"Medium",time:"3 min",category:"Healthy",diets:["Vegetarian"],macros:{calories:280,protein:13,carbs:30,fat:12,fiber:7},done:false,ingredients:["2 cups All purpose flour","2 tsp Baking Powder","1 tsp Salt","3/4 cup Milk","1 1/2 cup Oil"],steps:[{title:"Mix",body:"Add flour, baking powder, and salt in a large bowl and stir to combine. Pour in the milk and stir until combined. Then roll the mixture into a ball and lightly knead until it comes together.",timer:0},{title:"Cook",body:"Break off about 10 pieces of dough and form them into balls. Set them aside.",timer:0},{title:"Preheat",body:"In a 10-inch skillet, heat enough oil over medium heat to fry the dumplings, until the oil is about 350 degrees.",timer:0},{title:"Cook",body:"Once the dumplings are browned on one side, flip them and cook until both sides are browned, about 2-3 minutes each.",timer:180},{title:"Rest",body:"Once done, remove the dumplings from the oil and place them on paper towels or a cooling rack to drain off any excess oil.",timer:0}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-fried-dumplings/#recipe"},
  {id:53364,photo:"https://www.themealdb.com/images/media/meals/paejva1765321314.jpg",name:"Jamaican Steamed Cabbage",emoji:"",xp:139,difficulty:"Hard",time:"10 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:266,protein:13,carbs:41,fat:12,fiber:6},done:false,ingredients:["1/2 Cabbage","2 sliced Carrots","1 chopped Plum Tomatoes","1 chopped Onion","4 Cloves Chopped Garlic","4 Chopped Spring Onions","4 sprigs Thyme","1/2 Scotch Bonnet","2 tablespoons Water","2 tablespoons Olive Oil","4 tablespoons Unsalted Butter","2 tsp Kosher Salt","1 tsp Black Pepper"],steps:[{title:"Preheat",body:"Add all the ingredients to a large pan over medium heat and cover with a lid.",timer:0},{title:"Preheat",body:"Cook on medium heat for 10 minutes, stirring occasionally.",timer:600},{title:"Preheat",body:"After 10 minutes, reduce the heat to low and continue to cook for an additional 5 minutes, until the cabbage is soft and tender. Remove from the heat and remove the stalks of thyme before serving.",timer:600}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-cabbage/#recipe"},
  {id:53033,photo:"https://www.themealdb.com/images/media/meals/kw92t41604181871.jpg",name:"Japanese gohan rice",emoji:"",xp:81,difficulty:"Medium",time:"15 min",category:"Japanese",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:366,protein:18,carbs:39,fat:16,fiber:2},done:false,ingredients:["300g Sushi Rice","1 tbs Mirin","Garnish Pickle Juice","Garnish Spring Onions"],steps:[{title:"Prepare",body:"Rinsing and soaking your rice is key to achieving the perfect texture. Measure the rice into a bowl, cover with cold water, then use your fingers to massage the grains of rice – the water will become cloudy. Drain and rinse again with fresh water. Repeat five more times until the",timer:0},{title:"Preheat",body:"Tip the rinsed rice into a saucepan with 400ml water, or 200ml dashi and 200ml water, bring to the boil, then turn down the heat to a low simmer, cover with a tight-fitting lid with a steam hole and cook for 15 mins. Remove from the heat and leave to sit for another 15 mins, then",timer:900}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/japanese-rice-gohan"},
  {id:53169,photo:"https://www.themealdb.com/images/media/meals/5jdtie1763289302.jpg",name:"Ajo blanco",emoji:"",xp:36,difficulty:"Easy",time:"10 min",category:"Quick",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:329,protein:11,carbs:27,fat:9,fiber:3},done:false,ingredients:["150g White bread","200g Almonds","50 ml Extra Virgin Olive Oil","1 Garlic Clove","1 ½ tbsp Red Wine Vinegar"],steps:[{title:"Prepare",body:"Tip the bread into a bowl and pour over 350ml water. Leave to soak for 10 mins.",timer:600},{title:"Season",body:"Blend the ingredients together with 350ml water and 1 tsp salt.",timer:0},{title:"Season",body:"Let the soup cool in the fridge for 1 hr or so, then serve with a drizzle of oil and some black pepper.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/ajo-blanco"},
  {id:52842,photo:"https://www.themealdb.com/images/media/meals/tvvxpv1511191952.jpg",name:"Broccoli & Stilton soup",emoji:"",xp:66,difficulty:"Medium",time:"5 min",category:"Quick",diets:["Vegetarian","Gluten-free"],macros:{calories:309,protein:18,carbs:36,fat:16,fiber:5},done:false,ingredients:["2 tblsp Rapeseed Oil","1 finely chopped Onion","1 Celery","1 sliced Leek","1 medium Potatoes","1 knob Butter","1 litre hot Vegetable Stock","1 Head chopped Broccoli","140g Stilton Cheese"],steps:[{title:"Preheat",body:"Heat the rapeseed oil in a large saucepan and then add the onions. Cook on a medium heat until soft. Add a splash of water if the onions start to catch.",timer:0},{title:"Mix",body:"Add the celery, leek, potato and a knob of butter. Stir until melted, then cover with a lid. Allow to sweat for 5 minutes. Remove the lid.",timer:300},{title:"Cook",body:"Pour in the stock and add any chunky bits of broccoli stalk. Cook for 10 – 15 minutes until all the vegetables are soft.",timer:900},{title:"Mix",body:"Add the rest of the broccoli and cook for a further 5 minutes. Carefully transfer to a blender and blitz until smooth. Stir in the stilton, allowing a few lumps to remain. Season with black pepper and serve.",timer:300}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/1940679/broccoli-and-stilton-soup"},
  {id:52840,photo:"https://www.themealdb.com/images/media/meals/rvtvuw1511190488.jpg",name:"Clam chowder",emoji:"",xp:144,difficulty:"Hard",time:"2 min",category:"Quick",diets:["No restrictions"],macros:{calories:302,protein:11,carbs:37,fat:15,fiber:2},done:false,ingredients:["1½ kg Clams","50g Butter","150g Bacon","1 finely chopped Onion","sprigs of fresh Thyme","1 Bay Leaf","1 tbls Plain Flour","150ml Milk","150ml Double Cream","2 medium Potatoes","Chopped Parsley"],steps:[{title:"Rest",body:"Rinse the clams in several changes of cold water and drain well. Tip the clams into a large pan with 500ml of water. Cover, bring to the boil and simmer for 2 mins until the clams have just opened. Tip the contents of the pan into a colander over a bowl to catch the clam stock. W",timer:120},{title:"Preheat",body:"Heat the butter in the same pan and sizzle the bacon for 3-4 mins until it starts to brown. Stir in the onion, thyme and bay and cook everything gently for 10 mins until the onion is soft and golden. Scatter over the flour and stir in to make a sandy paste, cook for 2 mins more, ",timer:240},{title:"Preheat",body:"Throw in the potatoes, bring everything to a simmer and leave to bubble away gently for 10 mins or until the potatoes are cooked. Use a fork to crush a few of the potato chunks against the side of the pan to help thicken – you still want lots of defined chunks though. Stir throug",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/clam-chowder"},
  {id:52779,photo:"https://www.themealdb.com/images/media/meals/wurrux1468416624.jpg",name:"Cream Cheese Tart",emoji:"",xp:146,difficulty:"Hard",time:"25 min",category:"Quick",diets:["Vegetarian"],macros:{calories:301,protein:17,carbs:31,fat:16,fiber:4},done:false,ingredients:["250g Flour","125g Butter","1 Egg","Pinch Salt","300g Cheese","100ml milk Milk","3 Eggs","100g Parmesan Cheese","350g Plum tomatoes","3tbsp White Vinegar","1 tbsp Honey","Topping Basil"],steps:[{title:"Mix",body:"Crust: make a dough from 250g flour (I like mixing different flours like plain and wholegrain spelt flour), 125g butter, 1 egg and a pinch of salt, press it into a tart form and place it in the fridge. Filling: stir 300g cream cheese and 100ml milk until smooth, add in 3 eggs, 10",timer:0},{title:"Cook",body:"Take the crust out of the fridge and prick the bottom with a fork. Pour in the filling and bake at 175 degrees C for about 25 minutes.",timer:1500},{title:"Prep",body:"Cover the tart with some aluminium foil after half the time. In the mean time, slice about 350g mini tomatoes.",timer:0},{title:"Preheat",body:"In a small pan heat 3tbsp olive oil, 3tbsp white vinegar, 1 tbsp honey, salt and pepper and combine well. Pour over the tomato slices and mix well.",timer:0},{title:"Prep",body:"With a spoon, place the tomato slices on the tart, avoiding too much liquid on it. Decorate with basil leaves and enjoy.",timer:0}],tip:"Original recipe: https://www.instagram.com/p/BHyuMZ1hZX0"},
  {id:52841,photo:"https://www.themealdb.com/images/media/meals/stpuws1511191310.jpg",name:"Creamy Tomato Soup",emoji:"",xp:138,difficulty:"Hard",time:"15 min",category:"Quick",diets:["Vegetarian","Gluten-free"],macros:{calories:326,protein:18,carbs:28,fat:16,fiber:4},done:false,ingredients:["3 tbsp Olive Oil","2 chopped Onions","2 sticks Celery","300g Carrots","500g Potatoes","4 Bay Leaf","5 tblsp Tomato Puree","2 tblsp Sugar","2 tblsp White Vinegar","1½ kg Chopped Tomatoes","500g Passata","3 Vegetable Stock Cube","400ml Whole Milk"],steps:[{title:"Cook",body:"Put the oil, onions, celery, carrots, potatoes and bay leaves in a big casserole dish, or two saucepans. Fry gently until the onions are softened – about 10-15 mins. Fill the kettle and boil it.",timer:900},{title:"Mix",body:"Stir in the tomato purée, sugar, vinegar, chopped tomatoes and passata, then crumble in the stock cubes. Add 1 litre boiling water and bring to a simmer. Cover and simmer for 15 mins until the potato is tender, then remove the bay leaves. Purée with a stick blender (or ladle into",timer:900},{title:"Preheat",body:"To serve, reheat the soup, stirring in the milk – try not to let it boil. Serve in small bowls with cheesy sausage rolls.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/2604646/creamy-tomato-soup"},
  {id:53173,photo:"https://www.themealdb.com/images/media/meals/h5qmn31763304965.jpg",name:"Quick gazpacho",emoji:"",xp:76,difficulty:"Medium",time:"40 min",category:"Quick",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:309,protein:19,carbs:30,fat:18,fiber:5},done:false,ingredients:["250g Passata","1 chopped Red Pepper","1 chopped Red Chilli","1 clove peeled crushed Garlic","1 teaspoon Sherry vinegar","Juice of 1/2 Lime"],steps:[{title:"Season",body:"step 1 In a blender (or with a stick blender), whizz together the passata, red pepper, chilli, garlic, sherry vinegar and lime juice until smooth.",timer:0},{title:"Season",body:"Season to taste, then serve with ice cubes.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/quick-gazpacho"},
  {id:53092,photo:"https://www.themealdb.com/images/media/meals/21yc5s1760524759.jpg",name:"Fasoliyyeh Bi Z-Zayt (Syrian Green Beans with Olive Oil)",emoji:"",xp:61,difficulty:"Medium",time:"40 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:263,protein:8,carbs:34,fat:11,fiber:6},done:false,ingredients:["16 ounces Green Beans","1/4 cup Olive Oil","Dash Salt","1 clove Garlic","1/4 cup Cilantro"],steps:[{title:"Preheat",body:"Place the green beans into a large pot, and drizzle with olive oil. Season with salt to taste, and put the lid on the pot. Cook over medium-high heat, stirring occasionally, until beans are cooked to your desired doneness. Syrians like it cooked until the green beans are turning ",timer:0},{title:"Preheat",body:"Add cilantro and garlic to the beans, and continue to cook just until the cilantro has started to wilt. Eat as a main course by scooping up with warm pita bread or serve as a side dish.",timer:0}],tip:"Original recipe: https://www.allrecipes.com/recipe/56161/fasoliyyeh-bi-z-zayt-syrian-green-beans-with-olive-oil/"},
  {id:53150,photo:"https://www.themealdb.com/images/media/meals/0ljvc51763248075.jpg",name:"Padron peppers",emoji:"",xp:25,difficulty:"Easy",time:"3 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:275,protein:7,carbs:32,fat:10,fiber:6},done:false,ingredients:["1 tablespoon Olive Oil","500g Padron peppers"],steps:[{title:"Preheat",body:"Heat the olive oil in a large frying pan over a high heat, or if using an air-fryer, heat to 205C for 3 mins. Fry the peppers, stirring frequently, for 5 mins until blistered and wilted. The peppers should be soft and slightly charred.",timer:180},{title:"Season",body:"Transfer the peppers to a serving plate and season with some sea salt. Serve with dips or as part of a tapas spread, if you like.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/padron-peppers"},
  {id:53115,photo:"https://www.themealdb.com/images/media/meals/ppodrp1762325183.jpg",name:"Red onion pickle",emoji:"",xp:98,difficulty:"Medium",time:"40 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:262,protein:16,carbs:34,fat:5,fiber:6},done:false,ingredients:["3 Large Red Onions","2 tsp Sea Salt","200ml Cider Vinegar","50g Granulated Sugar","1 tsp Black Pepper","4 Bay Leaves"],steps:[{title:"Prep",body:"Peel the onions, cut them in half from top to bottom and finely slice into half-moon pieces. Put in a colander placed over a bowl and sprinkle with salt, lightly turning over the onion pieces with your hands so the surfaces are all covered. Set aside for an hour or so to brine.",timer:0},{title:"Mix",body:"Meanwhile put the vinegar, 50ml/2fl oz water and the sugar in a saucepan. Bring to a simmer, stirring to help the sugar dissolve, and cook for a couple of minutes. Set aside.",timer:0},{title:"Preheat",body:"Pack the onions into the sterilised jars, sprinkling in a little pepper as you go. Cover with the warm vinegar and finish by tucking a couple of bay leaves down the side of the jars. Seal. The onions are best kept in the fridge and used within to 4 weeks.",timer:0}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/red_onion_pickle_98165"},
  {id:52942,photo:"https://www.themealdb.com/images/media/meals/1520081754.jpg",name:"Roast fennel and aubergine paella",emoji:"",xp:144,difficulty:"Hard",time:"20 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:270,protein:10,carbs:32,fat:9,fiber:10},done:false,ingredients:["6 small Baby Aubergine","4 small Fennel","1 thinly sliced Red Pepper","1 medium Courgettes","1 finely chopped Onion","300g Paella Rice","1 tsp Paprika","pinch Saffron","200ml White Wine","700ml Vegetable Stock","100g Frozen Peas","1 chopped Lemon","Handful Parsley","pinch Salt","pinch Black Pepper"],steps:[{title:"Cook",body:"Put the fennel, aubergine, pepper and courgette in a roasting tray. Add a glug of olive oil, season with salt and pepper and toss around to coat the veggies in the oil. Roast in the oven for 20 minutes, turning a couple of times until the veg are pretty much cooked through and tu",timer:1200},{title:"Preheat",body:"Meanwhile, heat a paella pan or large frying pan over a low– medium heat and add a glug of olive oil. Sauté the onion for 8–10 minutes until softened. Increase the heat to medium and stir in the rice, paprika and saffron. Cook for around 1 minute to start toasting the rice, then ",timer:600},{title:"Mix",body:"Stir in the peas, add some seasoning, then gently mix in the roasted veg. Pour over the remaining stock, arrange the lemon wedges on top and cover with a lid or some aluminium foil. Cook for a further 10 minutes.",timer:600},{title:"Preheat",body:"To ensure you get the classic layer of toasted rice at the bottom of the pan, increase the heat to high until you hear a slight crackle. Remove from the heat and sit for 5 minutes before sprinkling over the parsley and serving.",timer:300}],tip:"Original recipe: https://www.homestylemag.co.uk/recipe/517/main-courses/roast-fennel-and-aubergine-paella"},
  {id:53250,photo:"https://www.themealdb.com/images/media/meals/sonirb1763782831.jpg",name:"Vegan banh mi",emoji:"",xp:90,difficulty:"Medium",time:"5 min",category:"Asian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:415,protein:26,carbs:57,fat:17,fiber:5},done:false,ingredients:["150g Raw Vegetables","3  tablespoons Vegan White Wine Vinegar","1 tsp Golden Caster Sugar","1 large Baguette","100g Hummus","175g Tempeh","Handful Coriander","Handful Mint","To serve Hotsauce"],steps:[{title:"Season",body:"Put the shredded veg in a bowl and add the vinegar, sugar and 1 tsp salt. Toss everything together, then set aside to pickle quickly while you prepare the rest of the sandwich.",timer:0},{title:"Preheat",body:"Heat oven to 180C/160C fan/gas 4. Cut the baguette into four, then slice each piece horizontally in half. Put the baguette pieces in the oven for 5 mins until lightly toasted and warm. Spread each piece with a layer of hummus, then top four pieces with the tempeh slices and pile ",timer:300}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/boxing-day-banh-mi"},
  {id:52794,photo:"https://www.themealdb.com/images/media/meals/qxutws1486978099.jpg",name:"Vegan Chocolate Cake",emoji:"",xp:67,difficulty:"Medium",time:"45 min",category:"Healthy",diets:["Vegetarian"],macros:{calories:271,protein:7,carbs:30,fat:7,fiber:5},done:false,ingredients:["1 1/4 cup Self-raising Flour","1/2 cup coco sugar","1/3 cup raw cacao","1 tsp baking powder","2 flax eggs","1/2 cup almond milk","1 tsp vanilla","1/2 cup boiling water"],steps:[{title:"Mix",body:"Simply mix all dry ingredients with wet ingredients and blend altogether.",timer:0},{title:"Cook",body:"Bake for 45 min on 180 degrees.",timer:2700},{title:"Mix",body:"Decorate with some melted vegan chocolate.",timer:0}],tip:"A classic American dish."},
  {id:52775,photo:"https://www.themealdb.com/images/media/meals/rvxxuy1468312893.jpg",name:"Vegan Lasagna",emoji:"",xp:144,difficulty:"Hard",time:"7 min",category:"Italian",diets:["Vegetarian"],macros:{calories:521,protein:15,carbs:77,fat:19,fiber:1},done:false,ingredients:["1 cups green red lentils","1 Carrots","1 onion","1 small zucchini","sprinking coriander","150g spinach","10 lasagne sheets","35g vegan butter","4 tablespoons flour","300ml soya milk","1.5 teaspoons mustard","1 teaspoon vinegar"],steps:[{title:"Preheat",body:") Preheat oven to 180 degrees celcius.",timer:0},{title:"Mix",body:") Boil vegetables for 5-7 minutes, until soft. Add lentils and bring to a gentle simmer, adding a stock cube if desired. Continue cooking and stirring until the lentils are soft, which should take about 20 minutes.",timer:420},{title:"Mix",body:") Blanch spinach leaves for a few minutes in a pan, before removing and setting aside.",timer:0},{title:"Cook",body:") Top up the pan with water and cook the lasagne sheets. When cooked, drain and set aside.",timer:0},{title:"Mix",body:") To make the sauce, melt the butter and add the flour, then gradually add the soya milk along with the mustard and the vinegar. Cook and stir until smooth and then assemble the lasagne as desired in a baking dish.",timer:0},{title:"Preheat",body:") Bake in the preheated oven for about 25 minutes.",timer:1500}],tip:"A classic Italian dish."},
  {id:53158,photo:"https://www.themealdb.com/images/media/meals/3m8yae1763257951.jpg",name:"Air fryer patatas bravas",emoji:"",xp:86,difficulty:"Medium",time:"30 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:265,protein:16,carbs:42,fat:7,fiber:6},done:false,ingredients:["900g Potatoes","3  tablespoons Olive Oil","1 chopped Onion","1 clove peeled crushed Garlic","1 tblsp Paprika","1 tblsp Tomato Puree","225g Tinned Tomatos","To serve Basil Leaves"],steps:[{title:"Preheat",body:"Soak the potatoes in just-boiled water for 30 mins, then drain and leave to air-dry for 5 mins. Heat the air fryer to 200C. Tip the potatoes into a bowl and drizzle over 1 tbsp of the oil and add 1/2 tsp each of salt and freshly ground black pepper. Mix to coat the potatoes all o",timer:1800},{title:"Preheat",body:"Meanwhile, heat the remaining oil in a small pan over a medium-low heat and fry the onion for 8-10 mins until softened but not golden. Stir in the garlic and cook for a minute before adding the paprika and cooking for 30 seconds more. Stir in the tomato purée, cook for 1 min, the",timer:600},{title:"Cook",body:"Once the potatoes are cooked, tip out onto a platter and pour over the tomato sauce. Sprinkle with the basil leaves, then serve.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/air-fryer-patatas-bravas"},
  {id:53288,photo:"https://www.themealdb.com/images/media/meals/tbj1bs1764118062.jpg",name:"Algerian Flafla (Bell Pepper Salad)",emoji:"",xp:94,difficulty:"Medium",time:"45 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:261,protein:16,carbs:44,fat:13,fiber:6},done:false,ingredients:["3 Green Pepper","1 tablespoon Olive Oil","1 tablespoon chopped Red Onions","1 clove peeled crushed Garlic","To taste Salt","To taste Pepper","1 Diced Plum Tomatoes"],steps:[{title:"Preheat",body:"Preheat an oven to 450 degrees F (230 degrees C). Place the whole peppers on aluminum foil. Bake until the skin is spotted black and the peppers are soft, 30 to 45 minutes, turning the peppers once if necessary.",timer:1800},{title:"Prep",body:"Remove peppers from the oven and set aside to cool for 10 minutes. Peel off the skin and remove the stem and seeds. Chop the roasted peppers into half-inch pieces.",timer:600},{title:"Preheat",body:"Heat the olive oil in a skillet over medium heat. Stir in the onion and cook, stirring frequently, until the onion has softened and turned translucent, about 5 minutes. Add the garlic, salt, and pepper; stir in the chopped peppers and tomato. Cook over medium heat, stirring occas",timer:300}],tip:"Original recipe: https://www.allrecipes.com/recipe/153802/algerian-flafla-bell-pepper-salad/"},
  {id:53278,photo:"https://www.themealdb.com/images/media/meals/zub3s91764110535.jpg",name:"Aubergine & hummus grills",emoji:"",xp:95,difficulty:"Medium",time:"15 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:348,protein:21,carbs:32,fat:14,fiber:4},done:false,ingredients:["2 Aubergine","2 tablespoons Vegetable Oil","3 sliced thinly Bread","300g Hummus","100g Walnuts","40g Parsley","200g Cherry Tomatoes","Juice of 1/2 Lemon","Splash Extra Virgin Olive Oil"],steps:[{title:"Prep",body:"Lay the aubergine out in one layer on a large baking sheet. Brush sparingly with vegetable oil, then season generously. Grill for 15 mins, turning twice and brushing with oil until the slices are softened and cooked through. Meanwhile, whizz the bread into crumbs. Add 2 tsp oil a",timer:900},{title:"Prep",body:"Spread a couple of tsps of hummus on top of each slice of aubergine. Tip the breadcrumbs onto a large plate, then press the hummus side of the aubergines into the crumbs to coat. Grill again, crumb-side up, for about 3 mins until golden.",timer:180},{title:"Cook",body:"Toss the walnuts, parsley and cherry tomatoes in a bowl, season, then add the lemon juice and olive oil and toss again. Serve the grills with the salad, a dollop more hummus and some pitta bread.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/aubergine-hummus-grills"},
  {id:53267,photo:"https://www.themealdb.com/images/media/meals/02s6gc1763799560.jpg",name:"Aubergine couscous salad",emoji:"",xp:75,difficulty:"Medium",time:"15 min",category:"Mediterranean",diets:["Vegetarian","Gluten-free"],macros:{calories:368,protein:18,carbs:30,fat:22,fiber:5},done:false,ingredients:["1 sliced Aubergine","3  tablespoons Olive Oil","140g Couscous","225g Vegetable Stock","200g Cherry Tomatoes","Handful Mint","100g Goats Cheese","Juice of 1/2 Lemon"],steps:[{title:"Preheat",body:"Heat grill to high. Put the aubergine on a baking sheet, brush with oil and season. Grill for about 15 mins, turning and brushing with more oil halfway, until browned and softened.",timer:900},{title:"Mix",body:"Meanwhile, tip the couscous into a large bowl, pour over the stock, then cover and leave for 10 mins. Mix the tomatoes, mint, goat’s cheese and remaining oil together. Fluff the couscous up with a fork, then stir in the aubergines, tomato mixture and lemon juice.",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/aubergine-couscous-salad"},
  {id:53107,photo:"https://www.themealdb.com/images/media/meals/flrajf1762341295.jpg",name:"Avocado dip with new potatoes",emoji:"",xp:94,difficulty:"Medium",time:"6 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:272,protein:12,carbs:44,fat:5,fiber:8},done:false,ingredients:["3 Large Avocado","200g Natural Yoghurt","Zest and juice of 1 Lime","Juice of 1/2 Lemon","1.25kg Baby New Potatoes","2 tablespoons Olive Oil","1 teaspoon Hot Chilli Powder","1 teaspoon Cumin Seeds","200g Tortillas"],steps:[{title:"Mix",body:"Whizz half the avocado flesh with the yogurt, lime and lemon juice and seasoning. Dice the remaining avocado, then gently stir into the whizzed mix with most of the lime zest. Cover, then chill until ready to serve.",timer:0},{title:"Rest",body:"Boil potatoes for 6 mins, then drain well and toss with olive oil, chilli powder and cumin seeds. Now set aside until half an hour before your guests arrive.",timer:360},{title:"Preheat",body:"Heat oven to 200C/180C fan/gas 6, then roast potatoes for about 30 mins, shaking the tray halfway, until golden and tender. Transfer the dip to one or two bowls, scatter with the remaining lime zest and serve with the hot potatoes, and tortilla chips for dipping.",timer:1800}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/avocado-citrus-dip-spicy-spuds-tortilla-chips"},
  {id:52807,photo:"https://www.themealdb.com/images/media/meals/urtpqw1487341253.jpg",name:"Baingan Bharta",emoji:"",xp:113,difficulty:"Hard",time:"3 min",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:452,protein:17,carbs:49,fat:14,fiber:8},done:false,ingredients:["1 large Aubergine","½ cup Onion","1 cup Tomatoes","6 cloves Garlic","1 Green Chilli","¼ teaspoon Red Chilli Powder","1.5 tablespoon Oil","1 tablespoon chopped Coriander Leaves","as required salt"],steps:[{title:"Cook",body:"Rinse the baingan (eggplant or aubergine) in water. Pat dry with a kitchen napkin. Apply some oil all over and. keep it for roasting on an open flame. You can also grill the baingan or roast in the oven. But then you won't get. the smoky flavor of the baingan. Keep the eggplant t",timer:120},{title:"Preheat",body:"easily in aubergines without any resistance. Remove the baingan and immerse in a bowl of water till it cools. 3. You can also do the dhungar technique of infusing charcoal smoky flavor in the baingan. This is an optional step.. Use natural charcoal for this method. Heat a small p",timer:0},{title:"Cook",body:"As soon as smoke begins to release from the charcoal, cover the entire plate tightly with a large bowl. Allow the. charcoal smoke to get infused for 1 to 2 minutes. The more you do, the more smoky the baingan bharta will. become. I just keep for a minute. Alternatively, you can a",timer:60},{title:"Preheat",body:"Chop the cooked eggplant finely or you can even mash it.. 8. In a kadai or pan, heat oil. Then add finely chopped onions and garlic.. 9. Saute the onions till translucent. Don't brown them.. 10. Add chopped green chilies and saute for a minute.. 11. Add the chopped tomatoes and m",timer:0},{title:"Mix",body:"Bhuno (saute) the tomatoes till the oil starts separating from the mixture.. 13. Now add the red chili powder. Stir and mix well.. 14. Add the chopped cooked baingan.. 15. Stir and mix the chopped baingan very well with the onion­tomato masala mixture.. 16. Season with salt. Stir",timer:240},{title:"Mix",body:"Finally stir in the coriander leaves with the baingan bharta or garnish it with them. Serve Baingan Bharta with. phulkas, rotis or chapatis. It goes well even with bread, toasted or grilled bread and plain rice or jeera rice.",timer:0}],tip:"Original recipe: http://www.vegrecipesofindia.com/baingan-bharta-recipe-punjabi-baingan-bharta-recipe/"},
  {id:53307,photo:"https://www.themealdb.com/images/media/meals/ra2k8a1764365055.jpg",name:"Beetroot & red cabbage sauerkraut",emoji:"",xp:92,difficulty:"Medium",time:"5 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:283,protein:8,carbs:38,fat:13,fiber:6},done:false,ingredients:["320g Beetroot","450g Red Cabbage","1 small Onion","2 tsp Caraway Seed","1 tsp Sea Salt"],steps:[{title:"Season",body:"Tip all the ingredients into a large bowl, add 1-1½ tsp freshly ground black pepper, then scrunch it all together with your hands for 5 mins. You might want to wear gloves to avoid staining your skin with the beetroot juices.",timer:300},{title:"Cook",body:"Press the veg down in the bowl with your hands, then cover the surface and up the side of the bowl with a large sheet of compostable cling film or something reusable like a beeswax wrap. Now place another similar-sized bowl on top. Press down hard and add anything heavy (packs of",timer:0},{title:"Mix",body:"Leave to ferment at room temperature for at least five days, but for maximum flavour, leave for one-five weeks (until the bubbling subsides).",timer:0},{title:"Mix",body:"Check the sauerkraut. After a few days, you will see bubbles that have built up as it ferments. Give it a stir, then cover and weigh it down again as before. The cabbage will become increasingly sour the longer it’s fermented, so taste it now and again. When you like the flavour,",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/beetroot-red-cabbage-sauerkraut"},
  {id:53313,photo:"https://www.themealdb.com/images/media/meals/qwicc91764368097.jpg",name:"Beetroot latkes",emoji:"",xp:119,difficulty:"Hard",time:"5 min",category:"Healthy",diets:["Vegetarian"],macros:{calories:278,protein:15,carbs:31,fat:11,fiber:5},done:false,ingredients:["1 tablespoon Rapeseed Oil","4 tablespoons Greek Yogurt","1/2 bag Mint","150g Rocket","130g Cherry Tomatoes","400g Beetroot","1 beaten Egg","1 tablespoon Plain Flour","1 clove finely chopped Garlic","1 tsp Caraway Seed","1/2 teaspoon Ground Cumin","Zest of 1 Lemon"],steps:[{title:"Preheat",body:"Heat the oven to 180C/160C fan/gas 4. Make the latkes by combining all of the ingredients.",timer:0},{title:"Preheat",body:"Heat the oil in a large non-stick pan. Spoon in the mixture to make six round latkes. Fry for 4-5 mins on each side, then transfer to a baking sheet and bake for 10 mins.",timer:300},{title:"Mix",body:"Combine the yogurt and mint in a small bowl. Toss the salad leaves and tomatoes together, then serve the latkes with the mint yogurt and salad.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/beetroot-latkes"},
  {id:53078,photo:"https://www.themealdb.com/images/media/meals/zadvgb1699012544.jpg",name:"Beetroot Soup (Borscht)",emoji:"",xp:73,difficulty:"Medium",time:"15 min",category:"Healthy",diets:["Gluten-free","Dairy-free"],macros:{calories:278,protein:7,carbs:35,fat:8,fiber:5},done:false,ingredients:["3 Beetroot","4 tbs Olive Oil","1 Chicken Stock Cube","6 cups Water","3 Potatoes","1 can Cannellini Beans","Garnish Dill"],steps:[{title:"Prep",body:"Chop the beetroot, add water and stock cube and cook for 15mins.",timer:900},{title:"Simmer",body:"Add the other ingredients and boil until soft.",timer:0},{title:"Cook",body:"Finally add the beans and cook for 5mins.",timer:300},{title:"Serve",body:"Serve in the soup pot.",timer:0}],tip:"Original recipe: https://natashaskitchen.com/classic-russian-borscht-recipe/"},
  {id:53305,photo:"https://www.themealdb.com/images/media/meals/z267f71764364072.jpg",name:"Braised stuffed cabbage",emoji:"",xp:117,difficulty:"Hard",time:"2 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:285,protein:15,carbs:36,fat:7,fiber:6},done:false,ingredients:["6 large Cabbage Leaves","2 tablespoons Olive Oil","1 chopped Onion","2 tsp Rosemary","1 chopped Celery","140g Basmati Rice","140g Cooked Chestnut","50g Cranberry","300ml Vegetable Stock","1 tablespoon Balsamic Vinegar","1 tsp Clear Honey"],steps:[{title:"Preheat",body:"Heat oven to 180C/fan 160C/gas 4. Remove the tough central stalk from the cabbage leaves. Bring a large pan of salted water to the boil, add the cabbage, then cook for just 1-2 mins until the leaves are starting to wilt. Drain and refresh under cold running water. Drain well, the",timer:120},{title:"Preheat",body:"Heat the oil in a pan, add the onion, then fry for 5 mins until slightly browned. Add the rosemary and celery, then cook for 8 mins more. Stir in the rice, then cook for a min or so until the grains are glistening. Remove from the heat, stir in the chestnuts and cranberries, then",timer:300},{title:"Mix",body:"Spoon a little stuffing onto a cabbage leaf, roll up and fold in the sides to enclose the filling. Put in a single layer in a large, oiled, shallow ovenproof dish with the join underneath. Fill the remaining leaves in the same way. Mix the stock, vinegar and honey, then pour over",timer:900}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/braised-stuffed-cabbage"},
  {id:53077,photo:"https://www.themealdb.com/images/media/meals/60oc3k1699009846.jpg",name:"Cabbage Soup (Shchi)",emoji:"",xp:142,difficulty:"Hard",time:"3 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:294,protein:7,carbs:28,fat:5,fiber:8},done:false,ingredients:["3 tbs Unsalted Butter","1 large Onion","1 medium Cabbage","1 Carrots","1 Celery","1 Bay Leaf","8 cups Vegetable Stock","2 large Potatoes","2 large Tomatoes","Garnish Sour Cream","Garnish Dill"],steps:[{title:"Preheat",body:"Add the butter to a large Dutch oven or other heavy-duty pot over medium heat. When the butter has melted, add the onion and sauté until translucent.",timer:0},{title:"Mix",body:"Add the cabbage, carrot, and celery. Sauté until the vegetables begin to soften, stirring frequently, about 3 minutes.",timer:180},{title:"Preheat",body:"Add the bay leaf and vegetable stock and bring to a boil over high heat. Reduce the heat to low and simmer, covered, until the vegetables are crisp-tender, about 15 minutes.",timer:900},{title:"Preheat",body:"Add the potatoes and bring it back to a boil over high heat. Reduce the heat to low and simmer, covered, until the potatoes are tender, about 10 minutes.",timer:600},{title:"Preheat",body:"Add the tomatoes (or undrained canned tomatoes) and bring the soup back to a boil over high heat. Reduce the heat to low and simmer, uncovered, for 5 minutes. Season to taste with salt and pepper.",timer:300},{title:"Combine",body:"emove and discard the bay leaf from the pot.",timer:0},{title:"Serve",body:"Serve topped with fresh sour cream and fresh dill.",timer:0}],tip:"Original recipe: https://www.thespruceeats.com/traditional-russian-cabbage-soup-shchi-recipe-1135534"},
  {id:52870,photo:"https://www.themealdb.com/images/media/meals/tvtxpq1511464705.jpg",name:"Chickpea Fajitas",emoji:"",xp:133,difficulty:"Hard",time:"25 min",category:"Mexican",diets:["Vegetarian","Gluten-free"],macros:{calories:497,protein:22,carbs:55,fat:16,fiber:5},done:false,ingredients:["400g Chickpeas","1 tblsp Olive Oil","pinch Paprika","2 small cut chunks Tomatoes","1 finely sliced Red Onions","2 tsp Red Wine Vinegar","1 Avocado","Juice of 1 Lime","Chopped Lime","100g Sour Cream","2 tsp Harissa Spice","4 Corn Tortillas","to serve Coriander"],steps:[{title:"Preheat",body:"Heat oven to 200C/180C fan/gas 6 and line a baking tray with foil. Drain the chickpeas, pat dry and tip onto the prepared baking tray. Add the oil and paprika, toss to coat, then roast for 20-25 mins until browned and crisp, shaking halfway through cooking.",timer:1500},{title:"Mix",body:"Meanwhile, put the tomatoes and onion in a small bowl with the vinegar and set aside to pickle. Put the avocado in another bowl and mash with a fork, leaving some larger chunks. Stir in the lime juice and season well. Mix the soured cream with the harissa and set aside until read",timer:0},{title:"Preheat",body:"Heat a griddle pan until nearly smoking. Add the tortillas , one at a time, charring each side until hot with griddle lines.",timer:0},{title:"Cook",body:"Put everything on the table and build the fajitas : spread a little of the harissa cream over the tortilla, top with roasted chickpeas, guacamole, pickled salsa and coriander, if you like. Serve with the lime wedges for squeezing over.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/chickpea-fajitas"},
  {id:53372,photo:"https://www.themealdb.com/images/media/meals/rwvw8q1765660071.jpg",name:"Chinese Tomato Egg Stir Fry",emoji:"",xp:82,difficulty:"Medium",time:"5 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:439,protein:23,carbs:55,fat:14,fiber:5},done:false,ingredients:["1 lb Plum Tomatoes","1 tablespoon Vegetable Oil","5 Large Eggs","1 tsp Sesame Seed Oil","2 tsp Chicken Bouillon Powder","2 tsp Sugar","1/2 tsp Pepper","1/4 tsp Salt","1 Spring Onions","2 cups Jasmine Rice"],steps:[{title:"Prep",body:"You can use chicken broth in place of the chicken bouillon powder. Add 1/4 cup of broth followed by 2 teaspoons of cornstarch dissolved in 1 tablespoPrepare the tomatoes:. Slice the tomatoes in half. Remove the tough stem from each half that connects to the vine. Cut each half in",timer:0},{title:"Preheat",body:"Make the soft scrambled eggs:. In a cold, 8 to 10-inch nonstick skillet, add the vegetable oil and beaten eggs. Turn the heat to medium. Once a thin layer of eggs is just beginning to cook on the bottom, push the eggs in one direction to create layers of scrambled eggs.",timer:0},{title:"Mix",body:"Cook, gently stirring the whole time, until the scramble eggs are mostly set but still slightly wet and shiny, 2 to 5 minutes. Remove the eggs to a plate and, if needed, wipe out the pan.. Stir-fry the tomatoes and seasonings:.",timer:120},{title:"Preheat",body:"Add the sesame oil to the pan followed by the tomatoes and stir-fry over medium heat until the tomatoes are softened but not mushy, about 3 minutes. Add the chicken bouillon powder, sugar, and white pepper. Toss until combined and the sugar and bouillon have dissolved, about 1 mi",timer:180},{title:"Preheat",body:"Add the eggs back to the pan with the tomatoes. Stir-fry for about 2 minutes to heat through and combine. Taste, adding salt only if needed. Sprinkle with the green onions and serve with steamed rice.on of water, plus salt to taste.",timer:120}],tip:"Original recipe: https://www.simplyrecipes.com/chinese-tomato-egg-recipe-7562056"},
  {id:53283,photo:"https://www.themealdb.com/images/media/meals/q8pu1k1764114334.jpg",name:"Chtitha Batata (Algerian Potato Stew)",emoji:"",xp:131,difficulty:"Hard",time:"4 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:272,protein:8,carbs:31,fat:10,fiber:6},done:false,ingredients:["4 cloves Garlic","1 small Red Chilli","1 tsp Ground Cumin","1 teaspoon Paprika","1/2 teaspoon Black Pepper","1/2 teaspoon Cayenne Pepper","1/2 teaspoon Salt","2 tablespoons Olive Oil","2 Lbs New Potatoes","1 tablespoon Tomato Puree","Boiled Water","To taste Salt"],steps:[{title:"Mix",body:"Combine garlic, chile pepper, cumin, paprika, black pepper, cayenne, and salt in a mortar; grind with a pestle until it forms a paste. Add olive oil and mix dersa well.",timer:0},{title:"Preheat",body:"Heat a large saucepan over medium heat and stir-fry dersa until fragrant, 2 to 4 minutes. Add potato halves and stir to combine with the dersa. Stir in tomato paste. Pour in enough water to just cover the potatoes and bring to a boil. Reduce heat and simmer until potatoes are ten",timer:120},{title:"Mix",body:"Ladle potatoes into a serving bowl. Spoon any remaining sauce over the potatoes.",timer:0}],tip:"Original recipe: https://www.allrecipes.com/recipe/265319/chtitha-batata-algerian-potato-stew/"},
  {id:53072,photo:"https://www.themealdb.com/images/media/meals/c7lzrl1683208757.jpg",name:"Crispy Eggplant",emoji:"",xp:63,difficulty:"Medium",time:"30 min",category:"Asian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:405,protein:25,carbs:41,fat:11,fiber:4},done:false,ingredients:["1 large Egg Plants","1 cup Breadcrumbs","50g Sesame Seed","2 Eggs","To taste Salt","To taste Pepper","For frying Vegetable Oil"],steps:[{title:"Prep",body:"Slice eggplant into 1 cm (0.4-inch) slices. Place them in a bowl and sprinkle them with salt. allow them to sit for 30 minutes to render some of their liquid and bitterness.",timer:1800},{title:"Prep",body:"After 30 minutes wash eggplant slices from salt and pat dry with a kitchen towel.",timer:1800},{title:"Season",body:"In a large bowl/plate place breadcrumbs and sesame seeds. In another bowl beat 2 eggs with pinch salt and pepper.",timer:0},{title:"Preheat",body:"Heal oil in a large skillet over high heat.",timer:0},{title:"Prep",body:"Dip eggplant slices in egg, then in crumbs, and place in hot oil. Fry 2 to 3 minutes on each side, or until golden brown. Drain on a paper towel.",timer:120}],tip:"Original recipe: https://yummyfood.ph/recipe/crispiest-fried-eggplant/"},
  {id:53309,photo:"https://www.themealdb.com/images/media/meals/ei21r61764365935.jpg",name:"Cucumber & fennel salad",emoji:"",xp:97,difficulty:"Medium",time:"10 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:297,protein:16,carbs:29,fat:8,fiber:8},done:false,ingredients:["1 large Cucumber","1 tsp Sugar","1 sliced Fennel Bulb","150ml Sour Cream","Juice of 1 Lemon","1 tablespoon White Wine Vinegar","Bunch Dill"],steps:[{title:"Season",body:"Put cucumber in a sieve. Sprinkle with 1 tsp salt and the sugar, then leave for 10 mins. Add fennel.",timer:600},{title:"Mix",body:"Mix soured cream, lemon juice, vinegar and dill, then season with black pepper and add to fennel mix.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/cucumber-fennel-salad"},
  {id:52785,photo:"https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",name:"Dal fry",emoji:"",xp:102,difficulty:"Hard",time:"30 min",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:455,protein:12,carbs:54,fat:22,fiber:8},done:false,ingredients:["1 cup Toor dal","2-1/2 cups Water","1 tsp Salt","1/4 tsp Turmeric","3 tbs Ghee","1 cup Chopped tomatoes","1/2 tsp Cumin seeds","1/2 tsp Mustard Seeds","2 Bay Leaf","1 tbs chopped Green Chilli","2 tsp shredded Ginger","2 tbs Cilantro","1/2 tsp Red Pepper","1/2 tsp Salt","1 tsp Sugar","1/4 tsp Garam Masala"],steps:[{title:"Prepare",body:"Wash and soak toor dal in approx. 3 cups of water, for at least one hours. Dal will be double in volume after soaking. Drain the water.",timer:0},{title:"Preheat",body:"Cook dal with 2-1/2 cups water and add salt, turmeric, on medium high heat, until soft in texture (approximately 30 mins) it should be like thick soup.",timer:1800},{title:"Preheat",body:"In a frying pan, heat the ghee. Add cumin seeds, and mustard seeds. After the seeds crack, add bay leaves, green chili, ginger and chili powder. Stir for a few seconds.",timer:0},{title:"Mix",body:"Add tomatoes, salt and sugar stir and cook until tomatoes are tender and mushy.",timer:0},{title:"Cook",body:"Add cilantro and garam masala cook for about one minute.",timer:0},{title:"Mix",body:"Pour the seasoning over dal mix it well and cook for another minute.",timer:0}],tip:"Original recipe: https://www.instagram.com/p/BO21bpYD3Fu"},
  {id:52955,photo:"https://www.themealdb.com/images/media/meals/1529446137.jpg",name:"Egg Drop Soup",emoji:"",xp:63,difficulty:"Medium",time:"40 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:423,protein:25,carbs:51,fat:11,fiber:4},done:false,ingredients:["3 cups Chicken Stock","1/4 tsp Salt","1/4 tsp Sugar","pinch Pepper","1 tsp Sesame Seed Oil","1/3 cup Peas","1/3 cup Mushrooms","1 tbs Cornstarch","2 tbs Water","1/4 cup Spring Onions"],steps:[{title:"Simmer",body:"In a wok add chicken broth and wait for it to boil.",timer:0},{title:"Season",body:"Next add salt, sugar, white pepper, sesame seed oil.",timer:0},{title:"Simmer",body:"When the chicken broth is boiling add the vegetables to the wok.",timer:0},{title:"Mix",body:"To thicken the sauce, whisk together 1 Tablespoon of cornstarch and 2 Tablespoon of water in a bowl and slowly add to your soup until it's the right thickness.",timer:0},{title:"Mix",body:"Next add 1 egg slightly beaten with a knife or fork and add it to the soup slowly and stir for 8 seconds.",timer:0},{title:"Serve",body:"Serve the soup in a bowl and add the green onions on top.",timer:0}],tip:"Original recipe: https://sueandgambo.com/pages/egg-drop-soup"},
  {id:53073,photo:"https://www.themealdb.com/images/media/meals/y7h0lq1683208991.jpg",name:"Eggplant Adobo",emoji:"",xp:148,difficulty:"Hard",time:"2 hrs",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:406,protein:26,carbs:49,fat:17,fiber:6},done:false,ingredients:["1 lb Egg Plants","2 tbs Sugar","1 tsp Salt","1 tsp Pepper","1 whole Garlic","3 tbs Olive Oil","4 oz Ground Pork","3 tbs Rice Vinegar","2 tbs Soy Sauce","2 Bay Leaf"],steps:[{title:"Prep",body:"Slice 1 lb. small Japanese or Italian eggplant (about 3) into quarters lengthwise, then cut crosswise into 2\"-wide pieces. Place in a medium bowl. Add 1 Tbsp. sugar, 1 tsp. Diamond Crystal or ½ tsp. Morton kosher salt, and ½ tsp. freshly ground black pepper. Toss to evenly coat ",timer:7200},{title:"Preheat",body:"Peel and thinly slice 8 garlic cloves. Add 3 Tbsp. vegetable oil and half of garlic to a medium Dutch oven or other heavy pot. Cook over medium-high heat, stirring constantly with a wooden spoon, until light golden and crisp, about 5 minutes. Using a slotted spoon, transfer garli",timer:300},{title:"Cook",body:"Place 4 oz. ground pork in same pot and break up into small pieces with wooden spoon. Season with ¼ tsp. Diamond Crystal or Morton kosher salt and cook, undisturbed, until deeply browned underneath, about 5 minutes. Using a slotted spoon, transfer to another plate, leaving fat be",timer:300},{title:"Season",body:"Place eggplant on a clean kitchen towel and blot away any moisture the salt has drawn out.",timer:0},{title:"Cook",body:"Working in batches and adding more oil if needed, cook eggplant in the same pot until lightly browned, about 3 minutes per side. Transfer to a plate with pork.",timer:180},{title:"Preheat",body:"Pour 1½ cups of water into the pot and scrape up browned bits from the bottom with a wooden spoon. Add remaining garlic, 3 Tbsp. coconut vinegar or unseasoned rice vinegar, 2 Tbsp. soy sauce, 2 bay leaves, 1 tsp. freshly ground black pepper, and remaining 1 Tbsp. sugar. Bring to ",timer:1500},{title:"Cook",body:"Top with garlic chips and serve with cooked white rice.",timer:0}],tip:"Original recipe: https://salu-salo.com/eggplant-adobo/"},
  {id:53254,photo:"https://www.themealdb.com/images/media/meals/pb6mj11763788331.jpg",name:"Ezme",emoji:"",xp:102,difficulty:"Hard",time:"1 hr 30 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:346,protein:14,carbs:37,fat:21,fiber:5},done:false,ingredients:["3 Large Tomato","1 medium Romano Pepper","1 medium Green Chilli","1 small Onion","2 cloves minced Garlic","25g Parsley","2 tablespoons Red Pepper Paste","1 tablespoon Tomato Puree","2 tablespoons Pomegranate Molasses","1 tablespoon Pul Biber","2 tsp Sumac","1 tablespoon Dried Mint","60 ml Extra Virgin Olive Oil"],steps:[{title:"Prep",body:"Put the tomatoes and all of the peppers in a food processor and blitz until finely chopped. Tip out into a sieve, set over a bowl and leave to strain. Add the onions, garlic and parsley to the food processor and blitz until finely chopped, then set aside.",timer:0},{title:"Mix",body:"Add red pepper paste, tomato purée, pomegranate molasses, pul biber, sumac, dried mint and most of the extra virgin olive oil to a serving bowl and whisk well so everything comes together as a sauce. Tip in the blitzed onion mixture and the strained pepper mixture along with 1 ts",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/ezme"},
  {id:53266,photo:"https://www.themealdb.com/images/media/meals/u5e9qq1763795441.jpg",name:"Falafel",emoji:"",xp:85,difficulty:"Medium",time:"5 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:374,protein:17,carbs:36,fat:22,fiber:6},done:false,ingredients:["2 tablespoons Sunflower Oil","1 chopped Onion","1 clove peeled crushed Garlic","400g Chickpeas","1 tsp Ground Cumin","1 tsp Ground Coriander","Handful Parsley","1 beaten Egg"],steps:[{title:"Preheat",body:"Heat 1 tbsp oil in a large pan, then fry the onion and garlic over a low heat for 5 mins until softened. Tip into a large mixing bowl with the chickpeas and spices, then mash together with a fork or potato masher until the chickpeas are totally broken down. Stir in the parsley or",timer:300},{title:"Preheat",body:"Mould the mix into 6 balls, then flatten into patties. Heat the remaining oil in the pan, then fry the falafels on a medium heat for 3 mins on each side, until golden brown and firm. Serve hot or cold with couscous, pitta bread or salad.",timer:180}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/spicy-falafels"},
  {id:53091,photo:"https://www.themealdb.com/images/media/meals/ae6clc1760524712.jpg",name:"Falafel Pita Sandwich with Tahini Sauce",emoji:"",xp:131,difficulty:"Hard",time:"10 min",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:297,protein:15,carbs:33,fat:7,fiber:8},done:false,ingredients:["12 Falafel","1/4 cup Tahini","1/4 cup Water","2 tablespoons Lemon Juice","2 cloves Garlic","1/4 tsp Paprika","6 Pita Bread","1 Lettuce","1 Tomato","1/2 Cucumber","1 Dill Pickles","1/4 Red Onions","3 tsp Harissa Spice"],steps:[{title:"Preheat",body:"Preheat the oven to 450 degrees F (230 degrees C). Place falafel on a baking sheet.",timer:0},{title:"Preheat",body:"Bake in the preheated oven until heated through, 8 to 10 minutes.",timer:480},{title:"Mix",body:"While falafel bake, whisk tahini, water, lemon juice, garlic, and paprika together in a bowl.",timer:0},{title:"Prep",body:"Cut about 1 inch from the top of each pita to form a pocket. Add 2 falafel to each pita with equal amounts lettuce, tomato, cucumber, pickle, and red onion. Drizzle each with about 1 tablespoon tahini sauce and some harissa.",timer:0}],tip:"Original recipe: https://www.allrecipes.com/recipe/266014/falafel-pita-sandwich-with-tahini-sauce/"},
  {id:52906,photo:"https://www.themealdb.com/images/media/meals/wssvvs1511785879.jpg",name:"Flamiche",emoji:"",xp:157,difficulty:"Hard",time:"20 min",category:"Healthy",diets:["No restrictions"],macros:{calories:282,protein:13,carbs:29,fat:9,fiber:9},done:false,ingredients:["75g Butter","1kg Leek","½ tsp Salt","300ml Creme Fraiche","1 Egg","3 Egg Yolks","¼ teaspoon Nutmeg","225g Plain Flour","½ tsp Salt","60g Butter","60g Lard","50g Cheddar Cheese","2 tbs Water"],steps:[{title:"Mix",body:"For the pastry, sift the flour and salt into the bowl of a food processor, add the butter and lard, then whizz together briefly until the mixture looks like fine breadcrumbs. Tip the mixture into a bowl, then stir in the cheese and enough of the water for the mixture to come toge",timer:1200},{title:"Preheat",body:"Melt the 75g butter in a saucepan over a low heat, then add the leeks and the salt. Cover and cook for ?10 minutes until soft. Uncover the pan, increase the heat and cook ?for 2 minutes, stirring occasionally, until the liquid has evaporated. Spoon onto a plate and leave to cool.",timer:600},{title:"Preheat",body:"Preheat the oven to 200°C/fan180°C/gas 6. Line the pastry case with baking paper and baking beans or rice and blind bake for 15-20 minutes until the edges are biscuit-coloured. Remove the paper and beans/rice and return the case to the oven for 7-10 minutes until the base is cris",timer:1200},{title:"Mix",body:"Put the crème fraîche into a bowl with the whole egg, egg yolks and nutmeg. Lightly beat together, then season. Stir in the leeks. Spoon ?the mixture into the tart case and bake for 35-40 minutes until set ?and lightly golden. Remove from ?the oven and leave for 10 minutes. Take ",timer:2400}],tip:"Original recipe: http://www.deliciousmagazine.co.uk/recipes/flamiche-flemish-leek-tart/"},
  {id:53025,photo:"https://www.themealdb.com/images/media/meals/lvn2d51598732465.jpg",name:"Ful Medames",emoji:"",xp:129,difficulty:"Hard",time:"2 hrs",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:346,protein:22,carbs:32,fat:14,fiber:7},done:false,ingredients:["2 cups Broad Beans","1/3 cup Parsley","Dash Olive Oil","3 Lemons","4 Garlic Clove","Sprinking Cumin"],steps:[{title:"Preheat",body:"As the cooking time varies depending on the quality and age of the beans, it is good to cook them in advance and to reheat them when you are ready to serve. Cook the drained beans in a fresh portion of unsalted water in a large saucepan with the lid on until tender, adding water ",timer:7200},{title:"Season",body:"Pass round the dressing ingredients for everyone to help themselves: a bottle of extra-virgin olive oil, the quartered lemons, salt and pepper, a little saucer with the crushed garlic, one with chili-pepper flakes, and one with ground cumin.. The beans are eaten gently crushed wi",timer:0},{title:"Prep",body:"Peel hard-boiled eggs—1 per person—to cut up in the bowl with the beans.. Top the beans with a chopped cucumber-and-tomato salad and thinly sliced mild onions or scallions. Otherwise, pass round a good bunch of scallions and quartered tomatoes and cucumbers cut into sticks.",timer:0},{title:"Prep",body:"Serve with tahina cream sauce (page 65) or salad (page 67), with pickles and sliced onions soaked in vinegar for 30 minutes.. Another way of serving ful medames is smothered in a garlicky tomato sauce (see page 464).",timer:1800},{title:"Cook",body:"In Syria and Lebanon, they eat ful medames with yogurt or feta cheese, olives, and small cucumbers.. A traditional way of thickening the sauce is to throw a handful of red lentils (1/4 cup) into the water at the start of the cooking.",timer:0},{title:"Cook",body:"In Iraq, large brown beans are used instead of the small Egyptian ones, in a dish called badkila, which is also sold for breakfast in the street.",timer:0}],tip:"Original recipe: https://www.epicurious.com/recipes/food/views/ful-medames-352993"},
  {id:53012,photo:"https://www.themealdb.com/images/media/meals/b79r6f1585566277.jpg",name:"Gigantes Plaki",emoji:"",xp:77,difficulty:"Medium",time:"50 min",category:"Mediterranean",diets:["Vegetarian","Gluten-free"],macros:{calories:354,protein:19,carbs:22,fat:14,fiber:7},done:false,ingredients:["400g Butter Beans","3 tbs Olive Oil","1 chopped Onion","2 chopped Garlic Clove","2 tbs Tomato Puree","800g Tomatoes","1 tbs Sugar","1 tbs Dried Oregano","Pinch Cinnamon","2 tbs Chopped Parsley"],steps:[{title:"Preheat",body:"Soak the beans overnight in plenty of water. Drain, rinse, then place in a pan covered with water. Bring to the boil, reduce the heat, then simmer for approx 50 mins until slightly tender but not soft. Drain, then set aside.",timer:3000},{title:"Preheat",body:"Heat oven to 180C/160C fan/gas 4. Heat the olive oil in a large frying pan, tip in the onion and garlic, then cook over a medium heat for 10 mins until softened but not browned. Add the tomato purée, cook for a further min, add remaining ingredients, then simmer for 2-3 mins. Sea",timer:600}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/gigantes-plaki"},
  {id:53076,photo:"https://www.themealdb.com/images/media/meals/hqaejl1695738653.jpg",name:"Bread omelette",emoji:"",xp:22,difficulty:"Easy",time:"20 min",category:"Indian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:425,protein:19,carbs:46,fat:20,fiber:9},done:false,ingredients:["2 Bread","2 Egg","0.5 Salt"],steps:[],tip:"A classic Indian dish."},
  {id:52965,photo:"https://www.themealdb.com/images/media/meals/1550441882.jpg",name:"Breakfast Potatoes",emoji:"",xp:62,difficulty:"Medium",time:"10 min",category:"Breakfast",diets:["Gluten-free","Dairy-free"],macros:{calories:382,protein:11,carbs:38,fat:14,fiber:2},done:false,ingredients:["3 Medium Potatoes","1 tbs Olive Oil","2 strips Bacon","Minced Garlic Clove","1 tbs Maple Syrup","Garnish Parsley","Pinch Salt","Pinch Pepper","To taste Allspice"],steps:[{title:"Prep",body:"Before you do anything, freeze your bacon slices that way when you're ready to prep, it'll be so much easier to chop!. Wash the potatoes and cut medium dice into square pieces. To prevent any browning, place the already cut potatoes in a bowl filled with water.",timer:0},{title:"Preheat",body:"In the meantime, heat 1-2 tablespoons of oil in a large skillet over medium-high heat. Tilt the skillet so the oil spreads evenly.. Once the oil is hot, drain the potatoes and add to the skillet. Season with salt, pepper, and Old Bay as needed.",timer:0},{title:"Mix",body:"Cook for 10 minutes, stirring the potatoes often, until brown. If needed, add a tablespoon more of oil.. Chop up the bacon and add to the potatoes. The bacon will start to render and the fat will begin to further cook the potatoes. Toss it up a bit! The bacon will take 5-6 minute",timer:600},{title:"Preheat",body:"Once the bacon is cooked, reduce the heat to medium-low, add the minced garlic and toss. Season once more. Add dried or fresh parsley. Control heat as needed.. Let the garlic cook until fragrant, about one minute.",timer:0},{title:"Preheat",body:"Just before serving, drizzle over the maple syrup and toss. Let that cook another minute, giving the potatoes a caramelized effect.. Serve in a warm bowl with a sunny side up egg!.",timer:0}],tip:"Original recipe: http://www.vodkaandbiscuits.com/2014/03/06/bangin-breakfast-potatoes/"},
  {id:53379,photo:"https://www.themealdb.com/images/media/meals/oaqz9f1766593912.jpg",name:"Dutch poffertjes (mini pancakes)",emoji:"",xp:68,difficulty:"Medium",time:"45 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:378,protein:17,carbs:40,fat:15,fiber:6},done:false,ingredients:["125g Flour","125g Buckwheat Flour","2 Eggs","1 knob Butter","300ml Milk","10g Yeast","1tsp vanilla sugar","To serve Butter","To serve Icing Sugar"],steps:[{title:"Preheat",body:"Mix the dry yeast with some of the luke warm milk en stir until dissolved.",timer:0},{title:"Preheat",body:"Place buckwheat and the flour together in a bowl and make a small circle in the middle. Add the yeast mixture into it. Add the milk and stir until you have a smooth batter.",timer:0},{title:"Mix",body:"Add the eggs, salt and vanille sugar and stir through. Leave to stand and rise for about 45 minutes.",timer:2700},{title:"Preheat",body:"Heat the poffertjespan and add a bit of butter into each hole. Fill halfway with batter and first bake one side until you can see the top dry out a little. Turn the poffertjes around with a small fork and bake the other side until cooked and golden brown.",timer:0},{title:"Serve",body:"Serve the poffertjes with butter and icing sugar.",timer:0}],tip:"Original recipe: https://insimoneskitchen.com/old-dutch-poffertjes/#recipe"},
  {id:52895,photo:"https://www.themealdb.com/images/media/meals/utxryw1511721587.jpg",name:"English Breakfast",emoji:"",xp:111,difficulty:"Hard",time:"20 min",category:"Breakfast",diets:["Dairy-free"],macros:{calories:396,protein:16,carbs:39,fat:14,fiber:3},done:false,ingredients:["2 Sausages","3 Bacon","2 Mushrooms","2 Tomatoes","1 Slice Black Pudding","2 Eggs","1 Slice Bread"],steps:[{title:"Preheat",body:"Heat the flat grill plate over a low heat, on top of 2 rings/flames if it fits, and brush sparingly with light olive oil.. Cook the sausages first. Add the sausages to the hot grill plate/the coolest part if there is one and allow to cook slowly for about 15-20 minutes, turning o",timer:1200},{title:"Prep",body:"Snip a few small cuts into the fatty edge of the bacon. Place the bacon straight on to the grill plate and fry for 2-4 minutes each side or until your preferred crispiness is reached. Like the sausages, the cooked bacon can be kept hot on a plate in the oven.. For the mushrooms, ",timer:240},{title:"Prep",body:"For the tomatoes, cut the tomatoes across the centre/or in half lengthways if using plum tomatoes , and with a small, sharp knife remove the green 'eye'. Season with salt and pepper and drizzle with a little olive oil. Place cut-side down on the grill plate and cook without movin",timer:120},{title:"Preheat",body:"For 'proper' fried bread it's best to cook it in a separate pan. Ideally, use bread that is a couple of days old. Heat a frying pan to a medium heat and cover the base with oil. Add the bread and cook for 2-3 minutes each side until crispy and golden. If the pan becomes too dry, ",timer:180},{title:"Preheat",body:"Once all the ingredients are cooked, serve on warm plates and enjoy straight away with a good squeeze of tomato ketchup or brown sauce.",timer:0}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/stressfreefullenglis_67721"},
  {id:52957,photo:"https://www.themealdb.com/images/media/meals/1543774956.jpg",name:"Fruit and Cream Cheese Breakfast Pastries",emoji:"",xp:64,difficulty:"Medium",time:"20 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:360,protein:11,carbs:35,fat:15,fiber:1},done:false,ingredients:["1 1/4 oz Cream Cheese","1 1/4 cup Sugar","1 teaspoon Vanilla Extract","Flour","2 Puff Pastry","Strawberries","Raspberries","Blackberries"],steps:[{title:"Preheat",body:"Preheat oven to 400ºF (200ºC), and prepare two cookie sheets with parchment paper. In a bowl, mix cream cheese, sugar, and vanilla until fully combined. Lightly flour the surface and roll out puff pastry on top to flatten. Cut each sheet of puff pastry into 9 equal squares. On th",timer:0},{title:"Cook",body:"NOTE: This L shape should reach all the way down and across the square, however both L shapes should not meet at the ends. Your pastry should look like a picture frame with two corners still intact.",timer:0},{title:"Mix",body:"Take the upper right corner and fold down towards the inner bottom corner. You will now have a diamond shape.",timer:0},{title:"Season",body:"Place 1 to 2 teaspoons of the cream cheese filling in the middle, then place berries on top.",timer:0},{title:"Add",body:"Repeat with the remaining pastry squares and place them onto the parchment covered baking sheet.",timer:0},{title:"Cook",body:"Bake for 15-20 minutes or until pastry is golden brown and puffed.",timer:1200}],tip:"A classic American dish."},
  {id:52896,photo:"https://www.themealdb.com/images/media/meals/sqrtwu1511721265.jpg",name:"Full English Breakfast",emoji:"",xp:119,difficulty:"Hard",time:"20 min",category:"Breakfast",diets:["Dairy-free"],macros:{calories:397,protein:14,carbs:44,fat:19,fiber:4},done:false,ingredients:["4 Sausages","4 Bacon","4 Mushrooms","3 Tomatoes","2 sliced Black Pudding","2 Eggs","1 Slice Bread","100g Baked Beans"],steps:[{title:"Preheat",body:"Heat the flat grill plate over a low heat, on top of 2 rings/flames if it fits, and brush sparingly with light olive oil.. Cook the sausages first. Add the sausages to the hot grill plate/the coolest part if there is one and allow to cook slowly for about 15-20 minutes, turning o",timer:1200},{title:"Prep",body:"Snip a few small cuts into the fatty edge of the bacon. Place the bacon straight on to the grill plate and fry for 2-4 minutes each side or until your preferred crispiness is reached. Like the sausages, the cooked bacon can be kept hot on a plate in the oven.. For the mushrooms, ",timer:240},{title:"Prep",body:"For the tomatoes, cut the tomatoes across the centre/or in half lengthways if using plum tomatoes , and with a small, sharp knife remove the green 'eye'. Season with salt and pepper and drizzle with a little olive oil. Place cut-side down on the grill plate and cook without movin",timer:120},{title:"Preheat",body:"For 'proper' fried bread it's best to cook it in a separate pan. Ideally, use bread that is a couple of days old. Heat a frying pan to a medium heat and cover the base with oil. Add the bread and cook for 2-3 minutes each side until crispy and golden. If the pan becomes too dry, ",timer:180},{title:"Preheat",body:"Once all the ingredients are cooked, serve on warm plates and enjoy straight away with a good squeeze of tomato ketchup or brown sauce.",timer:0}],tip:"Original recipe: https://www.bbc.co.uk/food/recipes/stressfreefullenglis_67721"},
  {id:52967,photo:"https://www.themealdb.com/images/media/meals/thazgm1555350962.jpg",name:"Home-made Mandazi",emoji:"",xp:133,difficulty:"Hard",time:"4 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:363,protein:15,carbs:36,fat:18,fiber:5},done:false,ingredients:["750g Self-raising Flour","6 tablespoons Sugar","2 Eggs","1 cup Milk"],steps:[{title:"Prepare",body:"This is one recipe a lot of people have requested and I have tried to make it as simple as possible and I hope it will work for you. Make sure you use the right flour which is basically one with raising agents. Adjust the amount of sugar to your taste and try using different flav",timer:0},{title:"Mix",body:"For “healthy looking” mandazis do not roll the dough too thin before frying and use the procedure I have indicated above.. 1. Mix the flour,cinnamon and sugar in a suitable bowl.",timer:0},{title:"Mix",body:"In a separate bowl whisk the egg into the milk. 3. Make a well at the centre of the flour and add the milk and egg mixture and slowly mix to form a dough.",timer:0},{title:"Rest",body:"Knead the dough for 3-4 minutes or until it stops sticking to the sides of the bowl and you have a smooth surface.. 5. Cover the dough with a damp cloth  and allow to rest for 15 minutes.",timer:240},{title:"Prep",body:"Roll the dough on a lightly floured surface into a 1cm thick piece.. 7. Using a sharp small knife, cut the dough into the desired size setting aside ready for deep frying.",timer:0},{title:"Preheat",body:"Heat your oil in a suitable pot and gently dip the mandazi pieces to cook until light brown on the first side then turn to cook on the second side.. 9. Serve them warm or cold.",timer:0}],tip:"Original recipe: http://chef-raphael.com/home-made-mandazi-recipe/#more-106"},
  {id:53363,photo:"https://www.themealdb.com/images/media/meals/sng9bm1765320170.jpg",name:"Jamaican Cornmeal Porridge",emoji:"",xp:83,difficulty:"Medium",time:"1 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:399,protein:15,carbs:44,fat:22,fiber:5},done:false,ingredients:["4 cups Water","380g Coconut Milk","1 cup Fine Yellow Cornmeal","1 1/2 tsp Vanilla Extract","1/2 tsp Ground Cinnamon","1/2 tsp Ground Nutmeg","1/4 tsp Ground Allspice","1/2 cup Sweetened Condensed Milk"],steps:[{title:"Preheat",body:"Add 2 ½ cups water, 1 can coconut milk to a 4 QT heavy bottomed pot. Bring to a boil over medium-high heat.",timer:0},{title:"Mix",body:"Meanwhile, add 1 cup cornmeal and 1 ½ cup water to a large mixing cup and whisk until smooth.",timer:0},{title:"Preheat",body:"Once the pot begins to boil, whisk in cornmeal mixture and continue to whisk for about 1 minute, ensuring there are no lumps. Reduce heat to low and cover with a tight fitting lid.",timer:60},{title:"Preheat",body:"Cook over low heat for 15-20 minutes, stirring occasionally. When there is about 5 minutes left, stir in vanilla extract, cinnamon, nutmeg, and all-spice. Remove from heat and sweeten with condensed milk.",timer:1200}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-cornmeal-porridge/#recipe"},
  {id:53331,photo:"https://www.themealdb.com/images/media/meals/c400ok1764439058.jpg",name:"Oatmeal pancakes",emoji:"",xp:77,difficulty:"Medium",time:"10 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:363,protein:17,carbs:33,fat:21,fiber:3},done:false,ingredients:["1 medium Egg","80 ml Milk","1 tablespoon Sugar","1 tsp Baking Powder","Pinch Salt","1 dash Vanilla Extract","150g Ground Oats","150g Butter","1 tablespoon Sugar Syrup","3 Strawberries"],steps:[{title:"Prepare",body:"Place all the ingredients in the glass and beat.",timer:0},{title:"Mix",body:"Let the mixture stand for 10 minutes.",timer:600},{title:"Mix",body:"Grease a hot frying pan with a little butter and pour a little of the mixture.",timer:0},{title:"Preheat",body:"When it starts to bubble on the surface, turn over with a spatula. Cook over medium-low heat so that they do not burn.",timer:0},{title:"Add",body:"Finally, add the caramel and strawberries.",timer:0}],tip:"Original recipe: https://goya.es/en/recipes/oatmeal-pancakes"},
  {id:53118,photo:"https://www.themealdb.com/images/media/meals/hyk47c1762772689.jpg",name:"Rømmegrøt – Norwegian Sour Cream Porridge",emoji:"",xp:79,difficulty:"Medium",time:"5 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:384,protein:18,carbs:46,fat:20,fiber:5},done:false,ingredients:["2 cups Full fat sour cream","3/4 cup Flour","2 cups Milk","1 tsp Salt","Sprinkling Sugar","Sprinkling Cinnamon","To taste Butter"],steps:[{title:"Preheat",body:"Cook the sour cream in a covered saucepan on medium heat for about 5 minutes.",timer:300},{title:"Preheat",body:"Turn down the heat and add half of the flour and stir well with a whisk. Once the flour is fully incorporated, let the mixture continue to cook, stirring occasionally, until fat starts to release. Use a spoon to gather as much of the fat as you can in a small bowl, saving for lat",timer:0},{title:"Preheat",body:"Whisk in the rest of the flour and then slowly add the milk, whisking constantly to avoid lumps. Let the porridge continue to cook on low heat for 5 minutes and then add salt.",timer:300},{title:"Serve",body:"Serve with sugar, cinnamon, and the fat from the porridge. If you're using lower fat sour cream you can top the rømmegrøt with some butter instead.",timer:0}],tip:"Original recipe: https://scandinaviancookbook.com/rommegrot-norwegian-sour-cream-porridge/"},
  {id:52962,photo:"https://www.themealdb.com/images/media/meals/1550440197.jpg",name:"Salmon Eggs Eggs Benedict",emoji:"",xp:69,difficulty:"Medium",time:"4 min",category:"Breakfast",diets:["Gluten-free"],macros:{calories:397,protein:12,carbs:33,fat:18,fiber:4},done:false,ingredients:["4 Eggs","2 tbs White Wine Vinegar","2 English Muffins","To serve Butter","8 slices Smoked Salmon","2 tsp Lemon Juice","2 tsp White Wine Vinegar","3 Yolkes Egg","125g Unsalted Butter"],steps:[{title:"Preheat",body:"First make the Hollandaise sauce. Put the lemon juice and vinegar in a small bowl, add the egg yolks and whisk with a balloon whisk until light and frothy. Place the bowl over a pan of simmering water and whisk until mixture thickens. Gradually add the butter, whisking constantly",timer:0},{title:"Preheat",body:"To poach the eggs, bring a large pan of water to the boil and add the vinegar. Lower the heat so that the water is simmering gently. Stir the water so you have a slight whirlpool, then slide in the eggs one by one. Cook each for about 4 mins, then remove with a slotted spoon.",timer:240},{title:"Prep",body:"Lightly toast and butter the muffins, then put a couple of slices of salmon on each half. Top each with an egg, spoon over some Hollandaise and garnish with chopped chives.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/73606/eggs-benedict-with-smoked-salmon-and-chives"},
  {id:52964,photo:"https://www.themealdb.com/images/media/meals/1550441275.jpg",name:"Smoked Haddock Kedgeree",emoji:"",xp:114,difficulty:"Hard",time:"5 min",category:"Indian",diets:["Gluten-free"],macros:{calories:428,protein:19,carbs:50,fat:15,fiber:5},done:false,ingredients:["50g Butter","1 chopped Onion","3 Pods Cardamom","1/4 tsp Turmeric","1 small Cinnamon Stick","Sprigs of fresh Bay Leaf","450g Basmati Rice","1 Litre Chicken Stock","750g Smoked Haddock","3 Eggs","3 tblsp chopped Parsley","1 chopped Lemon"],steps:[{title:"Preheat",body:"Melt 50g butter in a large saucepan (about 20cm across), add 1 finely chopped medium onion and cook gently over a medium heat for 5 minutes, until softened but not browned.. Stir in 3 split cardamom pods, ¼ tsp turmeric, 1 small cinnamon stick and 2 bay leaves, then cook for 1 mi",timer:300},{title:"Preheat",body:"Tip in 450g basmati rice and stir until it is all well coated in the spicy butter.. Pour in 1 litre chicken or fish stock, add ½ teaspoon salt and bring to the boil, stir once to release any rice from the bottom of the pan. Cover with a close-fitting lid, reduce the heat to low a",timer:720},{title:"Cook",body:"Meanwhile, bring some water to the boil in a large shallow pan. Add 750g un-dyed smoked haddock fillet and simmer for 4 minutes, until the fish is just cooked. Lift it out onto a plate and leave until cool enough to handle.. Hard-boil 3 eggs for 8 minutes.",timer:240},{title:"Preheat",body:"Flake the fish, discarding any skin and bones. Drain the eggs, cool slightly, then peel and chop. . Uncover the rice and remove the bay leaves, cinnamon stick and cardamom pods if you wish to. Gently fork in the fish and the chopped eggs, cover again and return to the heat for 2-",timer:180},{title:"Mix",body:"Gently stir in almost all the 3 tbsp chopped fresh parsley, and season with a little salt and black pepper to taste. Serve scattered with the remaining parsley and garnished with 1 lemon, cut into wedges.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/2256/smoked-haddock-kedgeree"},
  {id:53165,photo:"https://www.themealdb.com/images/media/meals/f3ee3y1763309332.jpg",name:"Torrijas with sherry",emoji:"",xp:73,difficulty:"Medium",time:"10 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:363,protein:16,carbs:48,fat:18,fiber:5},done:false,ingredients:["2 medium Egg","2 tbsp Double Cream","2 tblsp Milk","3 tsp Golden Caster Sugar","3  tablespoons Sweet Sherry","4 thick slices Bread","For frying Olive Oil","To serve Icing Sugar","To serve Creme Fraiche"],steps:[{title:"Mix",body:"In a wide, shallow bowl, beat the eggs with the cream, milk, golden caster sugar and sherry. Cut each slice of bread in two and dip them into the egg mix, turning to make sure they get a good coating on either side. Soak bread in egg mixture for 10 mins to absorb the liquid (care",timer:600},{title:"Preheat",body:"Heat 1½ tbsp olive oil in a large frying pan and cook the bread for about 3 mins on each side until dark golden and crisp on the edge. Keep the slices warm in a low oven as you cook the rest.",timer:180},{title:"Serve",body:"Divide the torrijas between plates and dust with the icing sugar. Serve with crème fraîche or Greek yogurt on the side.",timer:0}],tip:"Original recipe: https://www.bbcgoodfood.com/recipes/torrijas-sherry"},
  {id:53114,photo:"https://www.themealdb.com/images/media/meals/smoa3h1762341142.jpg",name:"Ugali – Kenyan cornmeal",emoji:"",xp:84,difficulty:"Medium",time:"40 min",category:"Breakfast",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:364,protein:13,carbs:34,fat:15,fiber:6},done:false,ingredients:["2 cups Water","1 1/2 cups White Cornmeal"],steps:[{title:"Simmer",body:"Bring the water to a boil in a medium saucepan.",timer:0},{title:"Preheat",body:"Reduce the heat to low, and stirring constantly with a whisk, slowly add the cornmeal to the boiling water. The ugali will begin to thicken quite quickly.",timer:0},{title:"Preheat",body:"Continue cooking on low heat, stirring constantly with a sturdy wooden spoon, until the ugali begins to pull away from the sides of the pan, hold together, and takes on the aroma of roasted corn. Turn it out immediately onto a serving plate. If you would like, using a spoon or sp",timer:0},{title:"Prep",body:"The ugali will continue to firm as it cools and will be thick enough to cut with a knife (similar to firm polenta).",timer:0}],tip:"Original recipe: https://tasteoftheplace.com/ugali-kenyan-cornmeal/"},
  {id:53225,photo:"https://www.themealdb.com/images/media/meals/30s7vf1763741844.jpg",name:"Yemeni Lahsa (Elite Shakshuka)",emoji:"",xp:72,difficulty:"Medium",time:"5 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:386,protein:13,carbs:51,fat:16,fiber:4},done:false,ingredients:["5 Egg","1 Diced Onion","1 Diced Tomato","2 tablespoons Olive Oil","1/4 tsp Allspice","1/4 tsp Black Pepper","3  tablespoons Liquid Cheese"],steps:[{title:"Preheat",body:"First, On medium heat, heat the olive oil and add the diced onion until it wethers. Next, add the tomatoes and cook for another 4-5 min. Lastly, add the all spice, salt, and cracked pepper.",timer:300},{title:"Mix",body:"Add the eggs and mix throughly for 2 minutes and cover to cook 5-6 minutes until top is solidified. Lastly, spread the liquid cheese and have it covered for a minute.",timer:120},{title:"Cook",body:"I served mine Mediterranean style with hash-browns, Egyptian fava beans, Turkish salami and olives, cheese wedges, and greek feta.",timer:0}],tip:"Original recipe: https://cookpad.com/eng/recipes/24629321?ref=search&search_term=saudi+arabia"},
  {id:53354,photo:"https://www.themealdb.com/images/media/meals/uc9qp11764796575.jpg",name:"Jamaican Curry Goat",emoji:"",xp:156,difficulty:"Hard",time:"4 hrs",category:"Comfort",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:571,protein:36,carbs:30,fat:27,fiber:5},done:false,ingredients:["3 Lbs Goat Meat","2.5 tbsp Jamaican Curry Powder","1/2 tsp Ground Ginger","1/2 tsp All-purpose Seasoning","1/4 tsp Allspice","1 chopped Onion","6 cloves sliced Garlic","3 sprigs Thyme","2 tablespoons Oil","1 1/4 cup Water","1 Scotch Bonnet","1 large Russet Potato","To taste Salt","To taste Pepper"],steps:[{title:"Prepare",body:"Rinse goat meat with vinegar and water.",timer:0},{title:"Season",body:"Season goat meat with 1 ½ tablespoon curry powder, all-purpose seasoning, ground ginger, allspice, onion, garlic cloves, and thyme. Marinate for at least 4 hours or up to overnight.",timer:14400},{title:"Mix",body:"Remove onion and garlic from goat and set aside.",timer:0},{title:"Cook",body:"Set an electric pressure cooker, like an Instant Pot, on high sauté and add oil. Add goat meat and brown, about 2-3 minutes per side. Remove goat from insert and add 1 tablespoon oil and remaining curry powder and sauté for about 10 seconds. Then add onions and garlic and sauté u",timer:180},{title:"Cook",body:"Add goat and water to the pressure cooker and cover the pressure cooker. Cook for 40 minutes on high pressure. Allow to naturally release for 10 minutes, then release the remaining pressure.",timer:2400},{title:"Cook",body:"Once all the pressure has been released, open the pressure cooker. Place on sauté for 10-15 minutes, add potatoes and a whole scotch bonnet pepper. Cook until potatoes have softened. Remove scotch bonnet pepper.",timer:900}],tip:"Original recipe: https://www.myforkinglife.com/jamaican-curry-goat/#recipe"},
  {id:52968,photo:"https://www.themealdb.com/images/media/meals/cuio7s1555492979.jpg",name:"Mbuzi Choma (Roasted Goat)",emoji:"",xp:91,difficulty:"Medium",time:"50 min",category:"Comfort",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:573,protein:36,carbs:43,fat:25,fiber:4},done:false,ingredients:["1 kg Goat Meat","1 kg Corn Flour","2 Tomatoes","Pinch Salt","1 Onion","1 Green Chilli","1  bunch Coriander Leaves"],steps:[{title:"Prepare",body:"Steps for the Meat:.",timer:0},{title:"Preheat",body:"Roast meat over medium heat for 50 minutes and salt it as you turn it.",timer:3000},{title:"Mix",body:"Bring the water and salt to a boil in a heavy-bottomed saucepan. Stir in the cornmeal slowly, letting it fall through the fingers of your hand.",timer:0},{title:"Preheat",body:"Reduce heat to medium-low and continue stirring regularly, smashing any lumps with a spoon, until the mush pulls away from the sides of the pot and becomes very thick, about 10 minutes.",timer:600},{title:"Preheat",body:"Remove from heat and allow to cool.",timer:0},{title:"Serve",body:"Place the ugali into a large serving bowl. Wet your hands with water, form a ball and serve.",timer:0},{title:"Mix",body:"Steps for Kachumbari: Mix the tomatoes, onions, chili and coriander leaves in a bowl.",timer:0}],tip:"A classic Kenyan dish."},
];


/* ═══ SOCIAL DATA ═════════════════════════════════════════════════════════ */
const LEAGUES = [
  {id:"bronze",name:"Bronze League",  icon:"",color:"#CD7F32"},
  {id:"silver",name:"Silver League",  icon:"",color:"#A8A9AD"},
  {id:"gold",  name:"Gold League",    icon:"",color:"#F5C842"},
  {id:"diamond",name:"Diamond League",icon:"",color:"#4A90D9"},
];
function getLeague(rank){if(rank<=5)return LEAGUES[3];if(rank<=10)return LEAGUES[2];if(rank<=20)return LEAGUES[1];return LEAGUES[0];}

const LEADERBOARD = [
  {rank:1,name:"Sofia R.",  avatar:"👩‍🍳",weeklyXp:620,streak:12},
  {rank:2,name:"Jake M.",   avatar:"🧑‍🍳",weeklyXp:540,streak:7},
  {rank:3,name:"Priya K.",  avatar:"👩‍🦱",weeklyXp:480,streak:5},
  {rank:4,name:"Marcus T.", avatar:"",  weeklyXp:390,streak:9},
  {rank:5,name:"You",       avatar:"🧑",  weeklyXp:130,streak:4,isMe:true},
  {rank:6,name:"Yuki A.",   avatar:"👩",  weeklyXp:110,streak:2},
  {rank:7,name:"Liam B.",   avatar:"👨",  weeklyXp:80, streak:1},
];

const SEED_POSTS = [
  {id:"p1",user:{name:"Sofia R.",  avatar:"👩‍🍳",level:"Sous Chef"},  recipe:"Beef Bourguignon",  emoji:"",photo:null,caption:"Three hours of love. Look at that colour 🤤 So worth it #sundaycooking",                   time:"2h ago", mwah:14,myMwah:false,comments:[{user:"Jake M.",text:"This is insane 🔥"},{user:"Priya K.",text:"Recipe?? 👀"}]},
  {id:"p2",user:{name:"Jake M.",   avatar:"🧑‍🍳",level:"Home Cook"}, recipe:"Sourdough Focaccia", emoji:"",photo:null,caption:"Finally nailed the dimples after 4 attempts. Sea salt flakes are everything 🤌",         time:"5h ago", mwah:22,myMwah:false,comments:[{user:"Sofia R.",text:"The crust looks perfect 😍"}]},
  {id:"p3",user:{name:"Priya K.",  avatar:"👩‍🦱",level:"Intermediate"},recipe:"Miso Ramen",        emoji:"",photo:null,caption:"Homemade tonkotsu broth. 6 hours. My entire flat smells incredible ",                    time:"1d ago", mwah:31,myMwah:false,comments:[{user:"Jake M.",text:"6 hours! Absolute legend"},{user:"Marcus T.",text:"Recipe please 🙏"}]},
  {id:"p4",user:{name:"Marcus T.", avatar:"",  level:"Advanced"},   recipe:"Tarte Tatin",        emoji:"",photo:null,caption:"Third attempt at this. Caramelisation is a discipline. Finally nailed it. #persistence",  time:"2d ago", mwah:19,myMwah:false,comments:[{user:"Priya K.",text:"That colour is everything 🙌"}]},
];

const STREAK_GOALS=[
  {id:"daily",  label:"Every day",   sub:"Full commitment",              icon:"",target:7,color:C.flame},
  {id:"5x",     label:"5× a week",   sub:"Weekday warrior",              icon:"",target:5,color:C.ember},
  {id:"3x",     label:"3× a week",   sub:"Balanced, sustainable",        icon:"",target:3,color:C.sage},
  {id:"weekend",label:"Weekends",    sub:"Relaxed weekend cooking",      icon:"",target:2,color:C.gold},
  {id:"weekly", label:"Once a week", sub:"Busy schedule — no pressure",  icon:"",target:1,color:C.sky},
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

  const FEATURES=[
    ["Cooking challenges — solo or with friends"],
    ["Strava-style social feed — share your dishes"],
    ["Heat and rank system — level up as you cook"],
    ["200+ recipes — beginner to advanced"],
    ["Streak goals that fit your real life"],
  ];

  const SKILLS=[
    {id:"Beginner",     label:"Beginner",     sub:"I mostly stick to simple, familiar things"},
    {id:"Home Cook",    label:"Home Cook",     sub:"I cook regularly and enjoy it"},
    {id:"Intermediate", label:"Intermediate",  sub:"I can tackle most recipes confidently"},
    {id:"Advanced",     label:"Advanced",      sub:"I seek out complex techniques"},
    {id:"Chef",         label:"Chef-level",    sub:"Professional or equivalent experience"},
  ];

  const IconBox = ({color, children}) => (
    <div style={{width:52,height:52,borderRadius:16,background:`${color}18`,border:`2px solid ${color}33`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
      {children}
    </div>
  );

  const screens=[
    ()=>(
      <div style={{padding:"40px 28px 36px",textAlign:"center"}}>
        <IconBox color={C.flame}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.flame} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </IconBox>
        <div style={{fontWeight:900,fontSize:30,color:C.bark,fontFamily:DF,lineHeight:1.2,marginBottom:12}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
        <div style={{fontSize:14,color:"#6A5C52",lineHeight:1.7,marginBottom:28}}>Cook more. Level up. Share the journey.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32,textAlign:"left"}}>
          {FEATURES.map(([t])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:12,background:C.cream,borderRadius:12,padding:"11px 14px",border:`1px solid ${C.border}`}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.flame,flexShrink:0}}/>
              <span style={{fontSize:14,color:C.bark,fontWeight:600}}>{t}</span>
            </div>
          ))}
        </div>
        <Btn onClick={next} full style={{fontSize:16,padding:"15px"}}>Get Started</Btn>
      </div>
    ),
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <IconBox color={C.flame}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.flame} strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </IconBox>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:6}}>How often will you cook?</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Pick an honest goal. You can change this any time.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {STREAK_GOALS.map(g=>{
            const a=goal.id===g.id;
            return(
              <button key={g.id} className="tap" onClick={()=>setGoal(g)} style={{background:a?`${g.color}14`:C.cream,border:`2px solid ${a?g.color:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all .18s",fontFamily:"inherit"}}>
                <div style={{width:40,height:40,borderRadius:10,background:a?g.color:`${g.color}22`,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{g.label}</div>
                  <div style={{fontSize:12,color:C.muted}}>{g.sub}</div>
                </div>
                <div style={{fontWeight:800,fontSize:15,color:a?g.color:C.muted,flexShrink:0}}>{g.target}×/wk</div>
                {a&&<div style={{width:20,height:20,borderRadius:"50%",background:g.color,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <Btn onClick={next} full>Continue</Btn>
      </div>
    ),
    ()=>(
      <div style={{padding:"28px 24px 36px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <IconBox color={C.sage}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </IconBox>
          <div style={{fontWeight:900,fontSize:24,color:C.bark,fontFamily:DF,marginBottom:6}}>What's your cooking level?</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Be honest — we'll match your challenges and recipes to your level.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {SKILLS.map(l=>{
            const a=skill===l.id;
            return(
              <button key={l.id} className="tap" onClick={()=>setSkill(l.id)} style={{background:a?`${C.flame}12`:C.cream,border:`2px solid ${a?C.flame:C.border}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all .18s",fontFamily:"inherit"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:a?C.flame:"#D8D0C8",flexShrink:0,transition:"background .18s"}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:C.bark}}>{l.label}</div>
                  <div style={{fontSize:12,color:C.muted}}>{l.sub}</div>
                </div>
                {a&&<div style={{width:20,height:20,borderRadius:"50%",background:C.flame,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <Btn onClick={next} full>Continue</Btn>
      </div>
    ),
    ()=>(
      <div style={{textAlign:"center",padding:"40px 28px"}}>
        <IconBox color={C.sage}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        </IconBox>
        <div style={{fontWeight:900,fontSize:28,color:C.bark,fontFamily:DF,marginBottom:12}}>You're all set!</div>
        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px",marginBottom:24,color:"#fff",textAlign:"left"}}>
          {[["Goal",goal.label],["Skill level",skill],["Starting rank","Prep Hand"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:13,opacity:.6}}>{k}</span>
              <span style={{fontSize:13,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:28}}>Start with a challenge. Cook something. Post it to the feed. Build your cook library.</div>
        <Btn onClick={()=>onComplete({goal,skill})} full style={{fontSize:16,padding:"15px"}}>Start Cooking</Btn>
      </div>
    ),
  ];

  const S=screens[step];
  const pct=(step+1)/4;
  return(
    <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto"}}>
      {step>0&&<div style={{padding:"20px 24px 0"}}><div style={{background:"#E8DDD4",borderRadius:99,height:4,overflow:"hidden"}}><div style={{width:`${pct*100}%`,height:"100%",background:C.flame,borderRadius:99,transition:"width .4s ease"}}/></div></div>}
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
    <div style={{background:C.paper,paddingBottom:30}}>
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
            <span>{recipe.time}</span><span>{recipe.xp} Heat</span><span>{(recipe.ingredients||[]).length} ingredients</span>
          </div>
        </div>
      </div>

      <div style={{display:"flex",margin:"16px 16px 0",background:C.pill,borderRadius:14,padding:4,gap:4}}>
        {[["overview","Overview"],["cook","Cook Mode"]].map(([m,lbl])=>(
          <button key={m} onClick={()=>setMode(m)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:11,padding:"9px",fontWeight:800,fontSize:13,background:mode===m?"#fff":"transparent",color:mode===m?C.bark:C.muted,boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .18s"}}>{lbl}</button>
        ))}
      </div>

      <div style={{padding:"16px 16px 200px"}}>
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
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              <button onClick={()=>{
                const ings = (recipe.ingredients||[]);
                setToast({emoji:"",title:"Added to grocery list!",subtitle:`${ings.length} ingredients from ${recipe.name}`});
              }} className="tap" style={{flex:1,padding:"12px 8px",borderRadius:14,border:`2px solid ${C.border}`,background:C.cream,cursor:"pointer",fontWeight:700,fontSize:12,color:C.muted}}>
                + Grocery List
              </button>
            </div>
            {recipe.tip&&<div style={{background:`${C.gold}18`,border:`1px solid ${C.gold}55`,borderRadius:18,padding:"14px 18px",marginBottom:16}}><div style={{fontWeight:800,fontSize:13,color:C.bark,marginBottom:6}}>Chef's Tip</div><div style={{fontSize:13,color:"#6A5C52",lineHeight:1.65}}>{recipe.tip}</div></div>}
            {recipe.isImported&&recipe.sourceUrl&&(
              <div style={{background:`${C.sky}0E`,border:`1.5px solid ${C.sky}28`,borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
                
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.sky}}>Imported from {recipe.sourceName}</div>
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.muted,textDecoration:"underline"}}>View original recipe →</a>
                </div>
              </div>
            )}
            {done?<div style={{textAlign:"center",padding:"12px",fontWeight:700,color:C.sage,fontSize:15}}>Cooked!</div>:null}
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
                  {done?"Cooked!":"Complete"}
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
              <div><div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Dish complete!</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Add it to your cook library and share it</div></div>
              <CloseBtn onClose={handleSkip}/>
            </div>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"14px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
              <AvatarIcon username={recipe.name} size={44} fontSize={18}/>
              <div><div style={{fontWeight:900,fontSize:16,color:"#fff"}}>{recipe.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:2}}>+{recipe.xp} 🔥 Heat earned</div></div>
            </div>
            {/* Star rating */}
            <div style={{background:C.cream,borderRadius:16,padding:"14px 16px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:700,fontSize:13,color:C.bark,marginBottom:10}}>How did it go?</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setRating(n)} className="tap" style={{fontSize:32,background:"none",border:"none",cursor:"pointer",opacity:n<=rating?1:.3,transition:"opacity .18s"}}><svg width="24" height="24" viewBox="0 0 24 24" fill={n<=rating?"#F5C842":"none"} stroke={n<=rating?"#F5C842":"#C8BEB4"} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
                ))}
              </div>
              {rating>0&&<div style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:8}}>{["","Needs work","Getting there","Pretty good!","Really pleased!","Perfect! 🌟"][rating]}</div>}
            </div>
            {!photoPreview
              ?<div onClick={()=>fileRef.current?.click()} style={{border:`3px dashed ${C.border}`,borderRadius:18,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:C.cream,marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:14,color:C.muted,marginBottom:8}}>Add a photo</div>
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
              <Btn onClick={handlePost} color={C.sage} style={{flex:2}}>Save & Share</Btn>
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
    <div style={{background:C.paper}}>
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
function CookLibrary({cookLog,allRecipes,earnedBadges,onShowCalendar,onOpen}){
  const [filter,setFilter]=useState("all");
  const [sort,setSort]=useState("recent");
  const [libTab,setLibTab]=useState("log"); // log | recipes | badges

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
          {[["Cooked",cookLog.length],["Cuisines",uniqueCuisines.length],["Avg Rating",avgRating||"—"]].map(([l,v])=>(
            <div key={l} style={{flex:1,background:"rgba(255,255,255,.1)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:900}}>{v}</div>
              <div style={{fontSize:9,opacity:.6,textTransform:"uppercase",letterSpacing:".08em",marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{display:"flex",margin:"0 16px 16px",background:C.pill,borderRadius:14,padding:4,gap:4}}>
        {[["log","My Cooks"],["recipes","My Recipes"],["badges","Badges"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setLibTab(id)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:11,padding:"9px",fontWeight:800,fontSize:13,background:libTab===id?"#fff":"transparent",color:libTab===id?C.bark:C.muted,boxShadow:libTab===id?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .18s"}}>{lbl}</button>
        ))}
      </div>

      {/* Quick actions */}
      {libTab==="log"&&(
        <div style={{display:"flex",gap:10,margin:"0 16px 16px"}}>
          <button onClick={onShowCalendar} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:2}}></div>
            <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Streak Calendar</div>
          </button>

        </div>
      )}

      {libTab==="recipes"&&(
        <div style={{padding:"0 16px"}}>
          {allRecipes.filter(r=>r.isPersonal).length===0?(
            <div style={{textAlign:"center",padding:"48px 20px"}}>
              <div style={{fontSize:48,marginBottom:12,opacity:.3}}>↓</div>
              <div style={{fontWeight:800,fontSize:16,color:C.bark,marginBottom:8}}>No imported recipes yet</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Use the Import button to save recipes from any website to your personal library.</div>
            </div>
          ):(
            allRecipes.filter(r=>r.isPersonal).map(r=>(
              <div key={r.id} onClick={()=>onOpen&&onOpen(r)} className="tap ch" style={{background:C.cream,borderRadius:18,overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:12,cursor:"pointer"}}>
                <div style={{padding:"14px 16px"}}>
                  <div style={{fontWeight:800,fontSize:15,color:C.bark,marginBottom:4}}>{r.name}</div>
                  <div style={{fontSize:12,color:C.muted}}>{r.time} · {r.difficulty} · {r.ingredients?.length||0} ingredients</div>
                  {r.sourceName&&<div style={{fontSize:11,color:C.sky,marginTop:4}}>Imported</div>}
                </div>
              </div>
            ))
          )}
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
                      {entry.rating>0&&<div style={{fontSize:13}}>{entry.rating > 0 ? Array.from({length:entry.rating}).map((_,i)=><svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F5C842" stroke="#F5C842" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>) : null}</div>}
                      <div style={{fontSize:11,fontWeight:700,color:C.sage,marginTop:2}}>+{entry.xp} 🔥 Heat</div>
                    </div>
                  </div>
                  {entry.caption&&<div style={{fontSize:13,color:"#6A5C52",lineHeight:1.55,padding:"10px 12px",background:C.cream,borderRadius:10,fontStyle:"italic"}}>{entry.caption}</div>}
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
function CommunityTab({allRecipes,onOpen,onSaveToLibrary}){
  const [filter,setFilter]=useState("all");
  const [sortBy,setSortBy]=useState("popular");
  const [selected,setSelected]=useState(null);

  // Unsplash food photos — free to use, no attribution required under Unsplash license
  const COMMUNITY_RECIPES=[
    {id:"c1",name:"Grandma's Carbonara",emoji:"",
     photo:"https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&q=80&fit=crop&auto=format",
     author:"Sofia R.",avatar:"👩‍🍳",rating:4.8,saves:124,category:"Italian",difficulty:"Medium",time:"25 min",xp:80,
     desc:"The real deal — no cream, ever. My grandmother's recipe from Naples, unchanged for 40 years.",reviews:42},
    {id:"c2",name:"Spicy Miso Ramen",emoji:"",
     photo:"https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80&fit=crop&auto=format",
     author:"Jake M.",avatar:"🧑‍🍳",rating:4.9,saves:89,category:"Japanese",difficulty:"Hard",time:"2 hrs",xp:130,
     desc:"6 hours of love. Real tonkotsu broth, chashu pork, soft egg. Worth every minute.",reviews:31},
    {id:"c3",name:"Mum's Butter Chicken",emoji:"",
     photo:"https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80&fit=crop&auto=format",
     author:"Priya K.",avatar:"👩‍🦱",rating:4.7,saves:203,category:"Indian",difficulty:"Medium",time:"1 hr",xp:100,
     desc:"Not the restaurant version. The one my mum made every Sunday. The secret is whole spices toasted fresh.",reviews:78},
    {id:"c4",name:"Crispy Roast Potatoes",emoji:"",
     photo:"https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80&fit=crop&auto=format",
     author:"Marcus T.",avatar:"",rating:4.6,saves:156,category:"Comfort",difficulty:"Easy",time:"1h 20m",xp:60,
     desc:"The crunchiest roast potatoes you will ever eat. Parboil, rough up the edges, screaming hot oven.",reviews:55},
    {id:"c5",name:"Açaí Power Bowl",emoji:"",
     photo:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&fit=crop&auto=format",
     author:"Yuki A.",avatar:"👩",rating:4.5,saves:67,category:"Healthy",difficulty:"Easy",time:"10 min",xp:35,
     desc:"Morning ritual. Frozen açaí, oat milk, banana, topped with granola and everything good.",reviews:23},
    {id:"c6",name:"Tres Leches Cake",emoji:"",
     photo:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop&auto=format",
     author:"Liam B.",avatar:"👨",rating:4.8,saves:112,category:"Baking",difficulty:"Medium",time:"1 hr",xp:90,
     desc:"Soaked in three milks overnight. The most tender, creamy cake you have ever had.",reviews:44},
    {id:"c7",name:"Thai Basil Fried Rice",emoji:"",
     photo:"https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop&auto=format",
     author:"Sofia R.",avatar:"👩‍🍳",rating:4.6,saves:98,category:"Asian",difficulty:"Easy",time:"15 min",xp:55,
     desc:"Proper Thai street food at home. Day-old rice, holy basil, a fried egg on top. Done in 15 minutes.",reviews:36},
    {id:"c8",name:"Shakshuka with Feta",emoji:"",
     photo:"https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80&fit=crop&auto=format",
     author:"Priya K.",avatar:"👩‍🦱",rating:4.7,saves:145,category:"Breakfast",difficulty:"Easy",time:"25 min",xp:65,
     desc:"The ultimate weekend breakfast. Bold tomato sauce, soft-set eggs, crumbled feta. Eat from the pan.",reviews:61},
  ];

  const FILTERS=["all","Italian","Indian","Japanese","Healthy","Baking","Comfort","Asian","Breakfast"];

  const filtered=COMMUNITY_RECIPES
    .filter(r=>filter==="all"||r.category===filter)
    .sort((a,b)=>sortBy==="popular"?b.saves-a.saves:b.rating-a.rating);

  // Detail view
  if(selected){
    return(
      <div style={{background:C.paper}}>
        <div style={{position:"relative",height:280,overflow:"hidden",flexShrink:0}}>
          <img src={selected.photo} alt={selected.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.15),rgba(20,10,5,.85))"}}/>
          <button onClick={()=>setSelected(null)} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,padding:"7px 14px"}}>← Back</button>
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px"}}>
            <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{background:"rgba(255,255,255,.18)",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#fff"}}>{selected.difficulty}</span>
              <span style={{background:"rgba(255,255,255,.18)",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#fff"}}>⏱ {selected.time}</span>
              <span style={{background:"rgba(255,255,255,.18)",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#fff"}}>⭐ {selected.rating}</span>
            </div>
            <div style={{fontSize:22,fontWeight:900,color:"#fff",fontFamily:DF,marginBottom:4}}>{selected.name}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.65)"}}>shared by {selected.author}</div>
          </div>
        </div>
        <div style={{padding:"20px 16px 100px"}}>
          <p style={{fontSize:14,color:"#6A5C52",lineHeight:1.7,marginBottom:16}}>{selected.desc}</p>
          <div style={{display:"flex",gap:16,marginBottom:24,padding:"14px 16px",background:C.cream,borderRadius:14,border:`1px solid ${C.border}`}}>
            <div style={{textAlign:"center",flex:1}}><div style={{fontWeight:900,fontSize:18,color:C.bark}}>{selected.saves}</div><div style={{fontSize:11,color:C.muted}}>saves</div></div>
            <div style={{textAlign:"center",flex:1}}><div style={{fontWeight:900,fontSize:18,color:C.bark}}>{selected.reviews}</div><div style={{fontSize:11,color:C.muted}}>reviews</div></div>
            <div style={{textAlign:"center",flex:1}}><div style={{fontWeight:900,fontSize:18,color:C.flame}}>+{selected.xp} 🔥</div><div style={{fontSize:11,color:C.muted}}>Heat</div></div>
          </div>
          <Btn onClick={()=>{onSaveToLibrary(selected);setSelected(null);}} full color={C.sage}>Save to My Recipes</Btn>
        </div>
      </div>
    );
  }

  return(
    <div style={{paddingBottom:24}}>
      {/* Header */}
      <div style={{margin:"4px 16px 16px",background:C.dark,borderRadius:20,padding:"18px 20px",color:"#fff"}}>
        <div style={{fontWeight:900,fontSize:20,fontFamily:DF,marginBottom:4}}>Community Recipes</div>
        <div style={{fontSize:13,opacity:.6}}>{filtered.length} recipes shared by home cooks</div>
      </div>
      {/* Filters */}
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 16px 8px"}}>
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className="tap"
            style={{whiteSpace:"nowrap",padding:"7px 14px",borderRadius:99,border:`2px solid ${filter===f?C.flame:C.border}`,background:filter===f?C.flame:C.cream,color:filter===f?"#fff":C.muted,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>
            {f==="all"?"All":f}
          </button>
        ))}
      </div>
      {/* Sort */}
      <div style={{display:"flex",gap:8,padding:"4px 16px 14px",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:700}}>Sort:</span>
        {[["popular","Most Saved"],["rating","Top Rated"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setSortBy(id)} className="tap"
            style={{padding:"5px 12px",borderRadius:99,border:`1.5px solid ${sortBy===id?C.sky:C.border}`,background:sortBy===id?`${C.sky}18`:"transparent",color:sortBy===id?C.sky:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s"}}>
            {lbl}
          </button>
        ))}
      </div>
      {/* Cards */}
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:14}}>
        {filtered.map((r,idx)=>(
          <div key={r.id} onClick={()=>setSelected(r)} className="ch"
            style={{background:"#fff",borderRadius:20,overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 2px 14px rgba(0,0,0,.06)",animation:`fadeUp .3s ease ${idx*.05}s both`,transition:"transform .18s,box-shadow .18s",cursor:"pointer"}}>
            <div style={{position:"relative",height:180,overflow:"hidden"}}>
              <img src={r.photo} alt={r.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.55))"}}/>
              <div style={{position:"absolute",bottom:12,left:14,right:14,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div>
                  <div style={{fontWeight:900,fontSize:16,color:"#fff",fontFamily:DF}}>{r.name}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:2}}>by {r.author}</div>
                </div>
                <div style={{background:"rgba(0,0,0,.45)",borderRadius:8,padding:"4px 8px",display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:12,color:"#FFD700"}}>★</span>
                  <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{r.rating}</span>
                </div>
              </div>
              <div style={{position:"absolute",top:10,left:12,display:"flex",gap:6}}>
                <span style={{background:"rgba(0,0,0,.45)",borderRadius:8,padding:"3px 8px",fontSize:10,fontWeight:700,color:"#fff"}}>{r.difficulty}</span>
                <span style={{background:"rgba(0,0,0,.45)",borderRadius:8,padding:"3px 8px",fontSize:10,fontWeight:700,color:"#fff"}}>{r.time}</span>
              </div>
            </div>
            <div style={{padding:"12px 14px"}}>
              <p style={{fontSize:13,color:"#6A5C52",lineHeight:1.5,margin:"0 0 10px"}}>{r.desc}</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:12}}>
                  <span style={{fontSize:12,color:C.muted}}>{r.saves} saves</span>
                  <span style={{fontSize:12,color:C.muted}}>{r.reviews} reviews</span>
                </div>
                <Btn onClick={(e)=>{e.stopPropagation();onSaveToLibrary(r);}} sm color={C.sage}>Save</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


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
              {[{name:"Sofia R.",avatar:"👩‍🍳",cooked:4,xp:620,streak:12},{name:"Jake M.",avatar:"🧑‍🍳",cooked:2,xp:110,streak:7},{name:"Priya K.",avatar:"👩‍🦱",cooked:3,xp:195,streak:5},{name:"Marcus T.",avatar:"",cooked:1,xp:80,streak:3}].map((f,i)=>(
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
                    <span style={{fontSize:18}}></span>
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
function HomeTab({xp,setXp,recipes,onOpen,onComplete,goal,cookedDays,setCookedDays,onEditGoal,challengeProgress,levelInfo,onQuickLog,onShowRecap,onShowCalendar,seasonalEvent,null}){
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
      <div style={{margin:"0 16px 18px",maxWidth:"calc(100% - 32px)",background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"20px 20px 18px",color:"#fff",position:"relative",overflow:"hidden"}}>
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
        <div style={{fontSize:11,opacity:.6,marginBottom:14}}>{goalDone?" Goal smashed this week!":`${goal.target-weekDone} more cook${goal.target-weekDone===1?"":"s"} to go`}</div>
        <div style={{display:"flex",gap:3,marginBottom:16}}>
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
            <span style={{fontSize:12,color:C.muted,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"60%"}}>Next: {levelInfo.next.title} {levelInfo.next.icon}</span>
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
            <div style={{fontSize:9,color:C.muted,fontWeight:600,background:C.pill,padding:"3px 6px",borderRadius:8,flexShrink:0,whiteSpace:"nowrap"}}>Ends {seasonalEvent.ends}</div>
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
          <div style={{fontSize:20,marginBottom:3}}></div>
          <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Quick Log</div>
        </button>
        <button onClick={onShowCalendar} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:3}}></div>
          <div style={{fontSize:11,fontWeight:800,color:C.bark}}>History</div>
        </button>
        <button onClick={onShowRecap} className="tap" style={{flex:1,background:C.cream,border:`2px solid ${C.border}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:3}}>📊</div>
          <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Weekly Recap</div>
        </button>
        {null&&(
          <div style={{flex:1,background:`${C.flame}0F`,border:`2px solid ${C.flame}22`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:3}}>{null.emoji}</div>
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
                <div style={{fontWeight:800,fontSize:14,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0}}>{r.name}</div>
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
    let rs=allRecipes.filter(r=>!r.isPersonal).filter(r=>{
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
          <div style={{fontSize:20,marginBottom:3}}></div>
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
                  <div style={{fontWeight:800,fontSize:14,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0}}>{r.name}</div>
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
      id:Date.now(),name:name.trim(),emoji:"",photo:null,
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
  const [text,setText]=useState("");
  const [name,setName]=useState("");
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  const parseRecipe=()=>{
    if(!text.trim()||text.trim().length<30){
      setError("Paste at least the ingredients and steps.");
      return;
    }
    if(!name.trim()){
      setError("Please enter a recipe name.");
      return;
    }
    setError("");

    const lines=text.split("\n").map(l=>l.trim()).filter(l=>l.length>2);

    // Detect ingredients - lines that look like measurements
    const ingPattern=/^(\d+|\d+\/\d+|\d+\.\d+|a |an |some |handful|pinch|splash|bunch|to taste|salt|pepper)/i;
    const stepPattern=/^(step|\d+\.|\d+\)|method|instructions|directions)/i;

    let ingredients=[];
    let steps=[];
    let inIngredients=false;
    let inSteps=false;
    let stepNum=0;

    for(const line of lines){
      // Detect section headers
      if(/^ingredient/i.test(line)){inIngredients=true;inSteps=false;continue;}
      if(/^(method|instruction|direction|step|how to|preparation)/i.test(line)){inIngredients=false;inSteps=true;continue;}

      if(inIngredients||ingPattern.test(line)){
        if(!inSteps) ingredients.push(line);
      } else if(inSteps||stepPattern.test(line)){
        const body=line.replace(/^(step\s*\d+[:.]?|\d+[.)]\s*)/i,"").trim();
        if(body.length>10){
          stepNum++;
          steps.push({title:`Step ${stepNum}`,body,timer:0});
        }
      }
    }

    // Fallback: if detection failed, split smartly
    if(ingredients.length===0&&steps.length===0){
      // Just split everything into steps
      const chunks=lines.filter(l=>l.length>15);
      chunks.forEach((body,i)=>steps.push({title:`Step ${i+1}`,body,timer:0}));
    } else if(ingredients.length===0){
      // First quarter of lines are probably ingredients
      const quarter=Math.ceil(lines.length/4);
      ingredients=lines.slice(0,quarter);
      if(steps.length===0){
        lines.slice(quarter).forEach((body,i)=>{
          if(body.length>15) steps.push({title:`Step ${i+1}`,body,timer:0});
        });
      }
    }

    if(steps.length===0&&ingredients.length===0){
      setError("Couldn't find a recipe in that text. Try copying just the ingredients and steps.");
      return;
    }

    setResult({
      name:name.trim(),
      ingredients:ingredients.slice(0,30),
      steps:steps.slice(0,15),
    });
  };

  const handleSave=()=>{
    if(!result)return;
    onSave({
      id:Date.now(),
      name:result.name,
      emoji:"",
      photo:null,
      xp:60,
      difficulty:"Medium",
      time:"30 min",
      category:"Comfort",
      diets:["No restrictions"],
      macros:null,
      done:false,
      ingredients:result.ingredients,
      steps:result.steps,
      tip:null,
      isImported:true,
      isPersonal:true,
      sourceUrl:null,
      sourceName:null,
    });
    onClose();
  };

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Import Recipe</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Copy from any recipe website</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        {!result&&(
          <>
            <div style={{background:`${C.sky}0E`,border:`1.5px solid ${C.sky}28`,borderRadius:14,padding:"11px 14px",marginBottom:16}}>
              <div style={{fontSize:12,color:C.sky,fontWeight:700,lineHeight:1.7}}>
                <div>1. Find a recipe on any website</div>
                <div>2. Select the ingredients and steps text</div>
                <div>3. Copy and paste it below</div>
              </div>
            </div>

            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Recipe name</div>
            <input
              value={name}
              onChange={e=>setName(e.target.value)}
              placeholder="e.g. Spaghetti Bolognese"
              style={{width:"100%",padding:"11px 14px",borderRadius:14,border:`2px solid ${name?C.ember:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box",marginBottom:14,fontFamily:"inherit"}}
            />

            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Ingredients + steps</div>
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              placeholder={"Paste the ingredients and instructions here...

e.g.
200g spaghetti
100g beef mince
2 cloves garlic

1. Boil pasta for 10 minutes
2. Fry beef with garlic..."}
              style={{width:"100%",minHeight:200,padding:"12px 14px",borderRadius:14,border:`2px solid ${text?C.ember:C.border}`,background:C.cream,fontSize:13,color:C.bark,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box",marginBottom:8}}
            />
            <div style={{fontSize:11,color:C.muted,marginBottom:14}}>
              {text.length>0?`${text.length} characters pasted`:"Tip: you can paste just the ingredients and steps — no need for the whole page"}
            </div>

            {error&&<div style={{background:`${C.flame}12`,border:`1.5px solid ${C.flame}30`,borderRadius:12,padding:"11px 14px",fontSize:13,color:C.flame,marginBottom:12,lineHeight:1.5}}>{error}</div>}

            <Btn onClick={parseRecipe} disabled={!text.trim()||!name.trim()} full>
              Extract Recipe
            </Btn>
          </>
        )}

        {result&&(
          <div>
            <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"16px 18px",marginBottom:14,color:"#fff"}}>
              <div style={{fontWeight:900,fontSize:18,fontFamily:DF,marginBottom:4}}>{result.name}</div>
              <div style={{fontSize:11,opacity:.7}}>{result.ingredients.length} ingredients · {result.steps.length} steps</div>
            </div>

            <div style={{background:C.cream,borderRadius:16,padding:"12px 14px",marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Ingredients</div>
              {result.ingredients.slice(0,5).map((ing,i)=>(
                <div key={i} style={{fontSize:13,color:C.bark,padding:"4px 0",borderBottom:i<Math.min(4,result.ingredients.length-1)?`1px solid ${C.border}`:"none"}}>{ing}</div>
              ))}
              {result.ingredients.length>5&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>+{result.ingredients.length-5} more</div>}
            </div>

            <div style={{background:C.cream,borderRadius:16,padding:"12px 14px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Steps</div>
              {result.steps.slice(0,3).map((s,i)=>(
                <div key={i} style={{fontSize:13,color:C.bark,padding:"4px 0",borderBottom:i<Math.min(2,result.steps.length-1)?`1px solid ${C.border}`:"none"}}>{s.body.slice(0,80)}{s.body.length>80?"…":""}</div>
              ))}
              {result.steps.length>3&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>+{result.steps.length-3} more steps</div>}
            </div>

            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>{setResult(null);setError("");}} outline color={C.muted} style={{flex:1}}>Edit</Btn>
              <Btn onClick={handleSave} color={C.sage} style={{flex:2}}>Save to My Library</Btn>
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
    mwah:      {color:C.flame,  bg:`${C.flame}12`,  icon:""},
    comment:   {color:C.sky,    bg:`${C.sky}12`,    icon:""},
    friend_req:{color:C.sage,   bg:`${C.sage}12`,   icon:""},
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}> Share Your Dish</div>
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}> Quick Log</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Cooked something not in the library? Log it here.</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"18px 20px",marginBottom:18,color:"#fff"}}>
          <div style={{fontSize:11,opacity:.6,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>This Week</div>
          <div style={{fontSize:36,fontWeight:900,fontFamily:DF}}>{weekDone}/{goal.target} {goal.icon}</div>
          <div style={{fontSize:13,opacity:.7,marginTop:4}}>
            {weekDone>=goal.target?" Goal achieved!":
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

        <Btn onClick={()=>onLog(note)} full>Log Today's Cook </Btn>
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
              <span style={{fontSize:36}}>{recipe?.emoji||""}</span>
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
                :<Btn onClick={onClose} color={C.sage} style={{flex:2}}>Finish! </Btn>
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
    {name:"Marcus T.", avatar:"",   level:"Line Cook",     mutual:0},
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}> Cooking History</div>
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
            {[["",weekDone,"Days cooked"],["🔥",weeklyXp,"Heat earned"],["📈",levelInfo.current.level,levelInfo.current.title]].map(([icon,val,label])=>(
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
/* ═══ ROOT APP ════════════════════════════════════════════════════════════ */
function HeartsBar({hearts,maxHearts=5,hasFreeze,onUseFreeze}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {Array.from({length:maxHearts}).map((_,i)=>(
        <span key={i} style={{fontSize:18,filter:i<hearts?"none":"grayscale(1)",opacity:i<hearts?1:.3,transition:"all .3s"}}>❤️</span>
      ))}
      {hasFreeze&&(
        <button onClick={onUseFreeze} className="tap" style={{marginLeft:4,background:`${C.sky}18`,border:`1.5px solid ${C.sky}33`,borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:700,color:C.sky,cursor:"pointer"}}>
          🧊 Freeze
        </button>
      )}
    </div>
  );
}

function WantToCookSheet({wantToCook,allRecipes,onRemove,onCookNow,onClose}){
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Want to Cook</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{wantToCook.length} recipes saved</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>
        {wantToCook.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:48,marginBottom:12}}>🔖</div>
            <div style={{fontWeight:800,fontSize:16,color:C.bark,marginBottom:6}}>Nothing saved yet</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Tap the bookmark icon on any recipe to save it here for later.</div>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {wantToCook.map((recipeId,i)=>{
            const r=allRecipes.find(r=>r.id===recipeId);
            if(!r)return null;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.cream,borderRadius:16,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                {r.photo?<img src={r.photo} alt="" style={{width:48,height:48,borderRadius:12,objectFit:"cover",flexShrink:0}}/>
                  :<AvatarIcon username={r.name} size={48} fontSize={20}/>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:13,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{r.time} · {r.difficulty}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <Btn onClick={()=>onCookNow(r)} sm color={C.flame}>Cook</Btn>
                  <button onClick={()=>onRemove(recipeId)} style={{background:`${C.flame}14`,border:`1.5px solid ${C.flame}30`,borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.flame,fontWeight:800,fontSize:14}}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

function YearInReviewSheet({cookLog,xp,levelInfo,earnedBadges,allRecipes,onClose}){
  const year=new Date().getFullYear();
  const totalCooked=cookLog.length;
  const totalHeat=xp;
  const cuisines=[...new Set(cookLog.map(e=>e.category).filter(Boolean))];
  const topRecipe=cookLog.filter(e=>e.rating===5)[0];
  const avgRating=cookLog.filter(e=>e.rating>0).length?
    (cookLog.filter(e=>e.rating>0).reduce((a,e)=>a+e.rating,0)/cookLog.filter(e=>e.rating>0).length).toFixed(1):"—";

  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"24px 20px 44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}> {year} in Review</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Your cooking year at a glance</div>
          </div>
          <CloseBtn onClose={onClose}/>
        </div>

        <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:20,padding:"24px 20px",color:"#fff",marginBottom:16}}>
          <div style={{fontSize:11,opacity:.5,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>{year} Summary</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
            {[["",totalCooked,"Dishes Cooked"],["🔥",totalHeat,"Total Heat Earned"],["🌍",cuisines.length,"Cuisines Explored"],["🏅",earnedBadges.length,"Badges Earned"]].map(([icon,val,label])=>(
              <div key={label as string} style={{background:"rgba(255,255,255,.08)",borderRadius:14,padding:"14px 12px",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:4}}>{icon}</div>
                <div style={{fontSize:26,fontWeight:900,fontFamily:DF}}>{val}</div>
                <div style={{fontSize:10,opacity:.55,marginTop:3}}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:14,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:32}}></div>
            <div>
              <div style={{fontSize:11,opacity:.5}}>Current Rank</div>
              <div style={{fontWeight:800,fontSize:16}}>{levelInfo.current.title}</div>
            </div>
            <div style={{marginLeft:"auto",textAlign:"right"}}>
              <div style={{fontSize:11,opacity:.5}}>Avg Rating</div>
              <div style={{fontWeight:800,fontSize:16}}>⭐ {avgRating}</div>
            </div>
          </div>
        </div>

        {topRecipe&&(
          <div style={{background:`${C.gold}14`,border:`1.5px solid ${C.gold}44`,borderRadius:16,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>⭐ Best Dish of the Year</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:32}}>{topRecipe.emoji}</span>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:C.bark}}>{topRecipe.name}</div>
                <div style={{fontSize:12,color:C.muted}}>{topRecipe.date}</div>
              </div>
            </div>
          </div>
        )}

        {cuisines.length>0&&(
          <div style={{background:C.cream,borderRadius:16,padding:"14px 16px",marginBottom:16,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:".07em"}}>Cuisines Explored</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {cuisines.map(cat=>{
                const skill=SKILL_MAP[cat];
                return<div key={cat} style={{display:"flex",alignItems:"center",gap:5,background:`${skill?.color||C.muted}18`,borderRadius:8,padding:"4px 10px"}}>
                  <span>{skill?.icon||"🍽️"}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.bark}}>{cat}</span>
                </div>;
              })}
            </div>
          </div>
        )}

        <Btn onClick={onClose} full>Close</Btn>
      </div>
    </Sheet>
  );
}

function DrawerSectionHeader({title, onBack}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
      <button onClick={onBack} style={{background:C.pill,border:`1.5px solid ${C.border}`,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.bark} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div style={{fontWeight:900,fontSize:18,color:C.bark,fontFamily:DF}}>{title}</div>
    </div>
  );
}

function PrivacySettings({onBack}){
  const [postVis, setPostVis] = useState('everyone');
  const [profileVis, setProfileVis] = useState('everyone');
  const [followers, setFollowers] = useState(true);
  const opts = ["everyone","friends","only me"];
  return(
    <div>
      <DrawerSectionHeader title="Privacy" onBack={onBack}/>
      {[["Who can see your posts",postVis,setPostVis],["Who can see your profile",profileVis,setProfileVis]].map(([label,val,set])=>(
        <div key={label} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:600,fontSize:13,color:C.bark,marginBottom:8}}>{label}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {opts.map(o=>(
              <button key={o} onClick={()=>set(o)} style={{padding:"7px 14px",borderRadius:99,border:`1.5px solid ${val===o?C.flame:C.border}`,background:val===o?`${C.flame}12`:"transparent",color:val===o?C.flame:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{o}</button>
            ))}
          </div>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0"}}>
        <div>
          <div style={{fontWeight:600,fontSize:14,color:C.bark}}>Allow followers</div>
          <div style={{fontSize:11,color:C.muted}}>Let others follow your cooking activity</div>
        </div>
        <button onClick={()=>setFollowers(!followers)} style={{width:44,height:26,borderRadius:13,background:followers?C.sage:"#D8D0C8",border:"none",cursor:"pointer",position:"relative",transition:"all .2s",flexShrink:0}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:followers?21:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
        </button>
      </div>
      <div style={{marginTop:16}}><Btn onClick={onBack} full outline color={C.muted}>Save</Btn></div>
    </div>
  );
}

function NotificationSettings({onBack}){
  const [notifs, setNotifs] = useState({streaks:true,mwah:true,followers:true,challenges:false,recap:true,newRecipes:false});
  const [reminderTime, setReminderTime] = useState('18:00');
  return(
    <div>
      <DrawerSectionHeader title="Notifications" onBack={onBack}/>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Daily reminder time</div>
        <input type="time" value={reminderTime} onChange={e=>setReminderTime(e.target.value)}
          style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.paper,fontSize:14,color:C.bark,outline:"none",fontFamily:"inherit"}}/>
      </div>
      {[["streaks","Streak reminders","Before your streak resets"],["mwah","Mwah received","When someone mwahs your post"],["followers","New followers","When someone follows you"],["challenges","Challenge updates","Your challenge progress"],["recap","Weekly recap","Sunday cooking summary"],["newRecipes","New community recipes","Fresh from the community"]].map(([key,title,desc],i,arr)=>(
        <div key={key} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14,color:C.bark}}>{title}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>{desc}</div>
          </div>
          <button onClick={()=>setNotifs(n=>({...n,[key]:!n[key]}))} style={{width:44,height:26,borderRadius:13,background:notifs[key]?C.sage:"#D8D0C8",border:"none",cursor:"pointer",position:"relative",transition:"all .2s",flexShrink:0}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:notifs[key]?21:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
          </button>
        </div>
      ))}
      <div style={{marginTop:16}}><Btn onClick={onBack} full>Save</Btn></div>
    </div>
  );
}

function CookingPrefsSettings({onBack, goal, onEditGoal}){
  const diets = ["None","Vegetarian","Vegan","Gluten-free","Dairy-free","Keto"];
  const skills = ["Beginner","Intermediate","Advanced","Chef"];
  const [selectedDiet, setSelectedDiet] = useState("None");
  const [selectedSkill, setSelectedSkill] = useState("Beginner");
  return(
    <div>
      <DrawerSectionHeader title="Cooking Preferences" onBack={onBack}/>
      <div style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:13,color:C.bark,marginBottom:10}}>Dietary preference</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {diets.map(d=><button key={d} onClick={()=>setSelectedDiet(d)} style={{padding:"7px 14px",borderRadius:99,border:`1.5px solid ${selectedDiet===d?C.sage:C.border}`,background:selectedDiet===d?`${C.sage}14`:"transparent",color:selectedDiet===d?C.sage:C.muted,fontWeight:600,fontSize:12,cursor:"pointer"}}>{d}</button>)}
        </div>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:13,color:C.bark,marginBottom:10}}>Skill level</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {skills.map(s=><button key={s} onClick={()=>setSelectedSkill(s)} style={{padding:"7px 14px",borderRadius:99,border:`1.5px solid ${selectedSkill===s?C.flame:C.border}`,background:selectedSkill===s?`${C.flame}14`:"transparent",color:selectedSkill===s?C.flame:C.muted,fontWeight:600,fontSize:12,cursor:"pointer"}}>{s}</button>)}
        </div>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:13,color:C.bark,marginBottom:8}}>Weekly cooking goal</div>
        <button onClick={onEditGoal} style={{width:"100%",padding:"12px 14px",borderRadius:14,border:`2px solid ${C.border}`,background:C.cream,cursor:"pointer",textAlign:"left",fontWeight:600,fontSize:14,color:C.bark,fontFamily:"inherit"}}>
          Current: {goal.label} ({goal.target}x / week) →
        </button>
      </div>
      <Btn onClick={onBack} full>Save Preferences</Btn>
    </div>
  );
}

function DataSettings({onBack, signOut}){
  return(
    <div>
      <DrawerSectionHeader title="Your Data" onBack={onBack}/>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[["Export cook history","Download all your recipes and notes as CSV"],["Download my data","Get a copy of everything we store about you"]].map(([title,sub])=>(
          <button key={title} style={{padding:"14px 16px",borderRadius:14,border:`1.5px solid ${C.border}`,background:C.cream,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
            <div style={{fontWeight:700,fontSize:14,color:C.bark}}>{title}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{sub}</div>
          </button>
        ))}
        <div style={{height:1,background:C.border}}/>
        <button onClick={signOut} style={{padding:"14px 16px",borderRadius:14,border:`1.5px solid #E05C7A33`,background:"#E05C7A08",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
          <div style={{fontWeight:700,fontSize:14,color:"#E05C7A"}}>Delete account</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Permanently remove your account and all data</div>
        </button>
      </div>
    </div>
  );
}

function SideDrawer({user,profile,xp,levelInfo,goal,cookedDays,onClose,onShowCalendar,onShowRecap,onShowYearReview,onEditGoal,signOut,supabase,onProfileUpdate,setTab}){
  const [section, setSection] = useState(null);
  const weekDone = cookedDays.filter(Boolean).length;

  if(section==='account') return <AccountSettings onBack={()=>setSection(null)} user={user} profile={profile} supabase={supabase} onProfileUpdate={onProfileUpdate}/>;
  if(section==='privacy') return <PrivacySettings onBack={()=>setSection(null)}/>;
  if(section==='notifications') return <NotificationSettings onBack={()=>setSection(null)}/>;
  if(section==='cooking') return <CookingPrefsSettings onBack={()=>setSection(null)} goal={goal} onEditGoal={()=>{onEditGoal();onClose();}}/>;
  if(section==='data') return <DataSettings onBack={()=>setSection(null)} signOut={signOut}/>;

  const MenuItem = ({label,sub,onClick})=>(
    <button onClick={onClick} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",fontFamily:"inherit"}}>
      <div style={{textAlign:"left"}}>
        <div style={{fontWeight:600,fontSize:14,color:C.bark}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{sub}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );

  return(
    <div>
      {/* Profile card */}
      <div style={{background:`linear-gradient(135deg,${C.bark},#5C3A20)`,borderRadius:18,padding:"18px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
        <AvatarIcon username={profile?.username||user?.email||"?"} size={52} fontSize={22}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:900,fontSize:17,color:"#fff",fontFamily:DF,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.username||user?.email?.split("@")[0]||"Chef"}</div>
          <div style={{marginTop:4}}><span style={{background:levelInfo.current.color,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700,color:"#fff"}}>{levelInfo.current.title}</span></div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:4}}>{xp} Heat earned</div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[["Streak Calendar",()=>{onShowCalendar();onClose();}],["Weekly Recap",()=>{onShowRecap();onClose();}],["Year in Review",()=>{onShowYearReview();onClose();}],["Challenges",()=>{setTab("challenges");onClose();}]].map(([label,action])=>(
          <button key={label} onClick={action} style={{padding:"12px 10px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.cream,cursor:"pointer",fontSize:12,fontWeight:700,color:C.bark,textAlign:"center",fontFamily:"inherit"}}>{label}</button>
        ))}
      </div>

      <div style={{height:1,background:C.border,marginBottom:4}}/>

      <MenuItem label="Cooking Goal" sub={`${goal.label} — ${weekDone}/${goal.target} this week`} onClick={()=>{onEditGoal();}}/>

      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",margin:"14px 0 4px"}}>Settings</div>
      <MenuItem label="Account" sub="Email, password, username" onClick={()=>setSection('account')}/>
      <MenuItem label="Privacy" sub="Who can see your activity" onClick={()=>setSection('privacy')}/>
      <MenuItem label="Notifications" sub="Reminders and alerts" onClick={()=>setSection('notifications')}/>
      <MenuItem label="Cooking preferences" sub="Diet, skill level, goal" onClick={()=>setSection('cooking')}/>
      <MenuItem label="Your data" sub="Export or delete your data" onClick={()=>setSection('data')}/>

      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",margin:"14px 0 4px"}}>About</div>
      <MenuItem label="Help & support" sub="hello@misenplace.app" onClick={()=>{}}/>
      <MenuItem label="Privacy policy" sub="How we use your data" onClick={()=>{}}/>
      <MenuItem label="Terms of service" onClick={()=>{}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"}}>
        <span style={{fontSize:12,color:C.muted}}>mise.en.place</span>
        <span style={{fontSize:12,color:C.muted}}>v9.0</span>
      </div>
      <div style={{marginTop:8}}>
        <button onClick={signOut} style={{width:"100%",padding:"13px",borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:C.muted,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
      </div>
    </div>
  );
}


function ProfileTab({user,profile,xp,levelInfo,allRecipes,cookLog,earnedBadges,cookedDays,onShowSettings,onShowCalendar,onShowYearReview,signOut,weeklyXp,challengeProgress,goal,onEditGoal}){
  const totalCooked = allRecipes.filter(r=>r.done).length;
  const uniqueCuisines = [...new Set(cookLog.map(e=>e.category).filter(Boolean))].length;
  const totalHeat = xp;

  return(
    <div style={{paddingBottom:30}}>
      {/* Profile hero */}
      <div style={{background:`linear-gradient(160deg,${C.bark},#5C3A20)`,padding:"28px 20px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:120,opacity:.06}}></div>

        {/* Settings button */}
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={onShowSettings} className="tap" style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,padding:"6px 12px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Settings</button>
        </div>

        {/* Avatar + name */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
          <div style={{width:72,height:72,borderRadius:20,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,flexShrink:0,border:"3px solid rgba(255,255,255,.2)"}}>
            <AvatarIcon username={profile?.username||user?.email||"?"} size={60} fontSize={26}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:22,color:"#fff",fontFamily:DF}}>
              {profile?.username||user?.email?.split("@")[0]||"Chef"}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
              <div style={{background:levelInfo.current.color,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:800,color:"#fff"}}>
                {levelInfo.current.title}
              </div>
            </div>
          </div>
        </div>



        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[["🍳",totalCooked,"Cooked"],["🔥",totalHeat,"Heat"],["🌍",uniqueCuisines,"Cuisines"],["🏅",earnedBadges.length,"Badges"]].map(([icon,val,label])=>(
            <div key={label} style={{textAlign:"center",background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 4px"}}>
              <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
              <div style={{fontSize:18,fontWeight:900,color:"#fff",fontFamily:DF}}>{val}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cooking Goal */}
      <div style={{margin:"16px 16px 0",background:C.cream,borderRadius:18,padding:"16px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:14,color:C.bark}}>Cooking Goal</div>
          <button onClick={onEditGoal} className="tap" style={{background:`${C.flame}14`,border:`1.5px solid ${C.flame}30`,borderRadius:10,padding:"5px 12px",fontSize:12,fontWeight:700,color:C.flame,cursor:"pointer"}}>Change</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:`${goal.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{goal.icon}</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:C.bark}}>{goal.label}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{goal.sub}</div>
          </div>
          <div style={{marginLeft:"auto",fontWeight:900,fontSize:20,color:goal.color}}>{goal.target}×/wk</div>
        </div>
      </div>

      {/* Rank progress */}
      <div style={{margin:"12px 16px 0",background:C.cream,borderRadius:18,padding:"16px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:800,fontSize:14,color:C.bark}}>Rank Progress</div>
          {levelInfo.next&&<div style={{fontSize:12,color:C.muted}}>{levelInfo.xpIntoLevel}/{levelInfo.xpForLevel} 🔥</div>}
        </div>
        <XPBar pct={levelInfo.pct} color={levelInfo.current.color}/>
        {levelInfo.next&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>Next rank:  {levelInfo.next.title}</div>}
      </div>

      {/* Quick actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"12px 16px 0"}}>
        {[
          {icon:"📅",label:"Cooking History",action:onShowCalendar,color:C.sky},

          {icon:"📊",label:"Year in Review",action:onShowYearReview,color:C.sage},
          {icon:"🏅",label:"My Badges",action:()=>setTab("library"),color:C.gold},
        ].map(({icon,label,action,color})=>(
          <button key={label} onClick={action||undefined} className="tap" style={{background:C.cream,border:`2px solid ${color}22`,borderRadius:16,padding:"14px 12px",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span style={{fontSize:28}}>{icon}</span>
            <span style={{fontSize:12,fontWeight:800,color:C.bark}}>{label}</span>
          </button>
        ))}
      </div>

      {/* Recent cooks */}
      {cookLog.length>0&&(
        <div style={{margin:"16px 16px 0"}}>
          <div style={{fontWeight:900,fontSize:16,color:C.bark,marginBottom:10,fontFamily:DF}}>Recent Cooks</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cookLog.slice(0,4).map((entry,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.cream,borderRadius:14,padding:"10px 14px",border:`1px solid ${C.border}`}}>
                {entry.photo
                  ?<img src={entry.photo} alt="" style={{width:44,height:44,borderRadius:10,objectFit:"cover",flexShrink:0}}/>
                  :<div style={{width:44,height:44,borderRadius:10,background:`${C.ember}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{entry.emoji}</div>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{entry.date}</div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:C.sage,flexShrink:0}}>+{entry.xp} 🔥</div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Sign out */}
      <div style={{margin:"12px 16px 0"}}>
        <button onClick={signOut} className="tap" style={{width:"100%",padding:"13px",borderRadius:14,border:`2px solid ${C.border}`,background:"transparent",color:C.muted,fontWeight:700,fontSize:14,cursor:"pointer"}}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function App(){
  const { user, profile, loading, saveXp, logCompletedRecipe, signOut, supabase } = useAuth();
  const userIdRef = useRef(null);
  useEffect(()=>{
    if(user?.id) userIdRef.current = user.id;
    console.log("Auth user:", user?.email || "NOT LOGGED IN");
  },[user]);
  const [onboarded,  setOnboarded]  = useState(()=>{ try{ return localStorage.getItem("mep_onboarded")==="true"; }catch{ return false; } });
  const [tab,        setTab]        = useState("home");
  const [mounted,    setMounted]    = useState(false);
  const [xp,         setXp]         = useState(0);
  const [weeklyXp,   setWeeklyXp]   = useState(130);
  const [allRecipes, setAllRecipes] = useState(RECIPES);
  const [detailRecipe,setDetailRecipe]=useState(null);
  const [showGoal,   setShowGoal]   = useState(false);
  const [posts,      setPosts]      = useState(SEED_POSTS);
  const [goal,setGoal]=useState(()=>{ try{ const g=localStorage.getItem('mep_goal'); return g?JSON.parse(g):STREAK_GOALS[2]; }catch{ return STREAK_GOALS[2]; } });
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

  const [showInstaShare,setShowInstaShare]=useState(null); // post object
  const [showCookTogether,setShowCookTogether]=useState(null); // recipe object
  const [showSettings,    setShowSettings]    = useState(false);
  const [showDrawer,      setShowDrawer]      = useState(false);
  const [showWantToCook,  setShowWantToCook]  = useState(false);
  const [showYearReview,  setShowYearReview]  = useState(false);
  const [showCommunity,   setShowCommunity]   = useState(false);
  const [wantToCook,      setWantToCook]      = useState([]);
  const [hearts,          setHearts]          = useState(5);
  const [hasFreeze,       setHasFreeze]       = useState(true);
  const [localProfile,    setLocalProfile]    = useState(null);
  const [activeTab,       setActiveTab]       = useState("home");

  const [seasonalEvent] = useState({
    name:"Basics Month",
    desc:"Master 3 foundational techniques this month",
    ends:"Apr 30",
    goal:3,
    progress:0,
    color:"#5C7A4E",
    badge:{emoji:"",label:"Foundations Master"},
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
  useEffect(()=>{
    if(profile){
      if(profile.xp>0) setXp(profile.xp);
      // If user has a profile, they've been onboarded
      if(!onboarded){
        setOnboarded(true);
        try{ localStorage.setItem("mep_onboarded","true"); }catch{}
      }
    }
  },[profile]);

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
    const uid = user?.id || userIdRef.current;
    if(uid) saveXp(uid, newXp);
    if(uid) logCompletedRecipe(uid, {...recipe, rating});
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
        caption:caption||`Just cooked ${recipe.name}! `,
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

  const openRecipe=useCallback((recipe)=>{
    setDetailRecipe(allRecipes.find(r=>r.id===recipe.id)||recipe);
    // Push history state so Android back button works within app
    window.history.pushState({recipe:true},'','');
    setTimeout(()=>{
      const el=document.querySelector('[data-scroll-area]');
      if(el) el.scrollTop=0;
    },10);
  },[allRecipes]);

  // Handle Android/browser back button
  useEffect(()=>{
    const handlePop=()=>{
      if(detailRecipe) setDetailRecipe(null);
    };
    window.addEventListener('popstate',handlePop);
    return()=>window.removeEventListener('popstate',handlePop);
  },[detailRecipe]);

  const toggleWantToCook=(recipeId)=>{
    setWantToCook(w=>w.includes(recipeId)?w.filter(id=>id!==recipeId):[...w,recipeId]);
  };

  const saveToLibrary=(communityRecipe)=>{
    const r={...communityRecipe,id:Date.now(),done:false,isImported:true,
      ingredients:[],steps:[],tip:null};
    setAllRecipes(rs=>[r,...rs]);
    setToast({emoji:"💾",title:"Saved!",subtitle:`${communityRecipe.name} added to your recipes`});
  };

  const effectiveProfile = localProfile || profile;

  const handleProfileUpdate = (updated) => {
    setLocalProfile(updated);
  };

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
    {id:"home",       label:"Today",      svg:'<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'},
    {id:"recipes",    label:"Recipes",    svg:'<path d="M4 6h16M4 12h16M4 18h10"/>'},
    {id:"challenges", label:"Challenges", svg:'<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'},
    {id:"feed",       label:"Feed",       svg:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>'},
    {id:"library",    label:"Library",    svg:'<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>'},
  ];

  const weekDone=cookedDays.filter(Boolean).length;

  if(!onboarded)return(
    <>
      <style>{CSS}</style>
      <Onboarding onComplete={({goal:g})=>{setGoal(g);setOnboarded(true);try{localStorage.setItem('mep_onboarded','true');localStorage.setItem('mep_goal',JSON.stringify(g));}catch{};}}/>
    </>
  );



  return(
    <>
      <style>{CSS}</style>
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <div style={{fontFamily:BF,background:C.paper,minHeight:"100vh",maxWidth:420,margin:"0 auto",opacity:mounted?1:0,transform:mounted?"none":"translateY(10px)",transition:"all .35s cubic-bezier(.4,0,.2,1)"}}>
        {/* Header */}
        <div style={{background:C.paper,padding:"12px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"fixed",top:0,left:0,right:0,maxWidth:420,margin:"0 auto",zIndex:50,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:900,fontSize:22,color:C.bark,letterSpacing:"-.03em",fontFamily:DF}}>mise<span style={{color:C.flame}}>.</span>en<span style={{color:C.flame}}>.</span>place</div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button onClick={()=>setTab("notifications")} className="tap" style={{position:"relative",background:"none",border:"none",padding:4,cursor:"pointer",display:"flex",alignItems:"center"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.bark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              {notifications.filter(n=>!n.read).length>0&&<div style={{position:"absolute",top:0,right:0,width:14,height:14,borderRadius:"50%",background:C.flame,color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{notifications.filter(n=>!n.read).length}</div>}
            </button>
            <button onClick={()=>setShowDrawer(true)} className="tap" style={{background:"none",border:"none",padding:4,cursor:"pointer",display:"flex",alignItems:"center"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.bark} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div style={{minHeight:"calc(100vh - 118px)",paddingTop:84,paddingBottom:80}}>
          {detailRecipe&&(()=>{const live=allRecipes.find(r=>r.id===detailRecipe.id)||detailRecipe;return <RecipeDetail recipe={live} onBack={()=>setDetailRecipe(null)} onComplete={(r,p,c_,rating)=>{handleComplete(r,p,c_,rating);setDetailRecipe(null);}}/>;})()}
          {!detailRecipe&&tab==="home"&&<HomeTab xp={xp} setXp={setXp} recipes={allRecipes} onOpen={openRecipe} onComplete={handleComplete} goal={goal} cookedDays={cookedDays} setCookedDays={setCookedDays} onEditGoal={()=>setShowGoal(true)} challengeProgress={challengeProgress} levelInfo={levelInfo} onQuickLog={()=>setShowQuickLog(true)} onShowRecap={()=>setShowRecap(true)} onShowCalendar={()=>setShowCalendar(true)} seasonalEvent={seasonalEvent} hearts={hearts} hasFreeze={hasFreeze} setHearts={setHearts} setHasFreeze={setHasFreeze}/>}
          {!detailRecipe&&tab==="recipes"&&<RecipesTab allRecipes={allRecipes} onOpen={openRecipe} onShowCreate={()=>setShowCreate(true)} onShowImport={()=>setShowImport(true)}/>}
          {!detailRecipe&&tab==="challenges"&&<ChallengesTab challengeProgress={challengeProgress} onInvite={(name,ch)=>alert(`Challenge sent to ${name}! 💪`)}/>}
          {!detailRecipe&&tab==="feed"&&<FeedTab posts={posts} setPosts={setPosts} xp={xp} weeklyXp={weeklyXp} levelInfo={levelInfo} onAddFriends={()=>setShowAddFriends(true)} onShareInsta={(post)=>setShowInstaShare(post)}/>}
          {!detailRecipe&&tab==="library"&&<CookLibrary cookLog={cookLog} allRecipes={allRecipes} earnedBadges={earnedBadges} onShowCalendar={()=>setShowCalendar(true)} onOpen={openRecipe}/>}
          {!detailRecipe&&tab==="profile"&&<ProfileTab user={user} profile={effectiveProfile} xp={xp} levelInfo={levelInfo} allRecipes={allRecipes} cookLog={cookLog} earnedBadges={earnedBadges} cookedDays={cookedDays} onShowSettings={()=>setShowSettings(true)} onShowCalendar={()=>setShowCalendar(true)} onShowYearReview={()=>setShowYearReview(true)} signOut={signOut} weeklyXp={weeklyXp} challengeProgress={challengeProgress} goal={goal} onEditGoal={()=>setShowGoal(true)}/>}
          {!detailRecipe&&tab==="notifications"&&<NotificationsTab notifications={notifications} setNotifications={setNotifications} setTab={setTab}/>}
        </div>

        <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:420,margin:"0 auto",background:C.cream,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 env(safe-area-inset-bottom,12px)",zIndex:50,width:"100%"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",transition:"all .18s"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab===t.id?C.flame:"#B0A09A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:t.svg}}/>
              <div style={{fontSize:9,fontWeight:800,letterSpacing:".06em",textTransform:"uppercase",color:tab===t.id?C.flame:"#B0A09A",transition:"color .18s"}}>{t.label}</div>
              {tab===t.id&&<div style={{width:16,height:2,borderRadius:99,background:C.flame,marginTop:1}}/>}
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

      {showInstaShare&&<InstagramShareSheet post={showInstaShare} onClose={()=>setShowInstaShare(null)}/>}
      {showCookTogether&&<CookTogetherSheet recipe={showCookTogether} onClose={()=>setShowCookTogether(null)}/>}
      {showDrawer&&(
        <div style={{position:"fixed",inset:0,zIndex:200}} onClick={e=>e.target===e.currentTarget&&setShowDrawer(false)}>
          <div style={{background:"rgba(0,0,0,.45)",position:"absolute",inset:0,backdropFilter:"blur(2px)"}} onClick={()=>setShowDrawer(false)}/>
          <div style={{background:C.paper,width:"88%",maxWidth:360,height:"100%",overflowY:"auto",position:"absolute",right:0,top:0,padding:"0 20px 40px",boxShadow:"-8px 0 40px rgba(0,0,0,.15)",animation:"slideRight .25s cubic-bezier(.4,0,.2,1)"}}>
            <div style={{display:"flex",justifyContent:"flex-end",padding:"14px 0 8px"}}>
              <button onClick={()=>setShowDrawer(false)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.bark} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <SideDrawer user={user} profile={effectiveProfile} xp={xp} levelInfo={levelInfo} goal={goal} cookedDays={cookedDays} onClose={()=>setShowDrawer(false)} onShowCalendar={()=>{setShowCalendar(true);setShowDrawer(false);}} onShowRecap={()=>{setShowRecap(true);setShowDrawer(false);}} onShowYearReview={()=>{setShowYearReview(true);setShowDrawer(false);}} onEditGoal={()=>{setShowGoal(true);setShowDrawer(false);}} signOut={signOut} supabase={supabase} onProfileUpdate={handleProfileUpdate} setTab={(t)=>{setTab(t);setShowDrawer(false);}}/>
          </div>
        </div>
      )}
      {showSettings&&<SettingsSheet user={user} profile={effectiveProfile} onClose={()=>setShowSettings(false)} supabase={supabase} onProfileUpdate={handleProfileUpdate} goal={goal} onGoalChange={g=>{setGoal(g);setShowGoal(false);}}/>}
      {showWantToCook&&<WantToCookSheet wantToCook={wantToCook} allRecipes={allRecipes} onRemove={id=>setWantToCook(w=>w.filter(x=>x!==id))} onCookNow={(r)=>{openRecipe(r);setShowWantToCook(false);}} onClose={()=>setShowWantToCook(false)}/>}
      {showYearReview&&<YearInReviewSheet cookLog={cookLog} xp={xp} levelInfo={levelInfo} earnedBadges={earnedBadges} allRecipes={allRecipes} onClose={()=>setShowYearReview(false)}/>}
    </>
  );
}