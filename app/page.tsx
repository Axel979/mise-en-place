'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

/* ═══ TOKENS ═════════════════════
  {id:151,photo:"https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80&fit=crop",name:"Shakshuka Verde",emoji:"🥬",xp:60,difficulty:"Easy",time:"25 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:280,protein:16,carbs:18,fat:18,fiber:5},done:false,
   ingredients:["6 eggs","300g tomatillos or green tomatoes","2 jalapeños","1 onion","4 cloves garlic","Handful fresh spinach","100g feta","Fresh coriander","Avocado","Olive oil","Salt"],
   steps:[{title:"Make green sauce",body:"Roast tomatillos, jalapeños, onion, and garlic under the broiler until charred. Blend with coriander until smooth."},{title:"Simmer",body:"Cook the green sauce in olive oil 5 minutes. Add spinach and wilt.",timer:300},{title:"Add eggs",body:"Make wells, crack in eggs. Cover and cook 5-7 minutes.",timer:420},{title:"Serve",body:"Top with crumbled feta and avocado. Serve with warm tortillas."}],
   tip:"The charred tomatillos give a smoky, tangy quality very different from the red shakshuka. Both are excellent — this one is brighter and more herbaceous."},
  {id:152,photo:"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&fit=crop",name:"Canelés",emoji:"🍫",xp:140,difficulty:"Hard",time:"2 days",category:"Baking",diets:["Vegetarian"],macros:{calories:180,protein:4,carbs:28,fat:6,fiber:0},done:false,
   ingredients:["500ml whole milk","1 vanilla pod, split","250g icing sugar","100g plain flour","2 eggs plus 2 yolks","50g unsalted butter, melted","2 tbsp dark rum","Beeswax and butter for the moulds (or just butter)"],
   steps:[{title:"Make the batter",body:"Heat milk with vanilla. Whisk sugar, flour, eggs, and yolks. Pour warm milk in slowly. Add melted butter and rum. Strain."},{title:"Rest overnight",body:"Refrigerate the batter for 24-48 hours — non-negotiable. This develops the crispy crust.",timer:0},{title:"Prepare moulds",body:"If using copper moulds, coat with melted beeswax and butter. For silicone, just butter."},{title:"Bake",body:"Fill moulds ¾ full with cold batter. Bake at 250°C for 10 minutes, then reduce to 180°C for 50-60 minutes until deeply mahogany brown.",timer:4200}],
   tip:"Canelés from Bordeaux are one of the great pastries of France. The 24-hour rest and the extremely hot initial bake are both non-negotiable for the signature dark crust and custardy interior."},
  {id:153,photo:"https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&fit=crop",name:"Lamb Chops with Herb Crust",emoji:"🥩",xp:90,difficulty:"Medium",time:"25 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:520,protein:42,carbs:8,fat:36,fiber:2},done:false,
   ingredients:["8 lamb cutlets","Herb crust: 50g breadcrumbs, 2 tbsp Dijon mustard, 1 tbsp fresh rosemary, 1 tbsp fresh thyme, 2 cloves garlic, 2 tbsp olive oil","Salt and pepper"],
   steps:[{title:"Season and sear",body:"Season cutlets. Sear in a very hot pan 2 minutes per side until caramelised.",timer:240},{title:"Apply crust",body:"Brush the top of each cutlet with Dijon mustard. Press herb and breadcrumb mixture firmly on top."},{title:"Finish in oven",body:"Transfer to a rack. Bake at 200°C for 8-10 minutes for pink, 12-15 for well done.",timer:600},{title:"Rest",body:"Rest 5 minutes before serving.",timer:300}],
   tip:"The Dijon acts as glue for the herb crust. Press the breadcrumbs on firmly so they adhere during the oven stage."},
  {id:154,photo:"https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&q=80&fit=crop",name:"Apple Tarte Tatin",emoji:"🍎",xp:110,difficulty:"Hard",time:"1 hr 20 min",category:"Baking",diets:["Vegetarian"],macros:{calories:380,protein:4,carbs:52,fat:18,fiber:3},done:false,
   ingredients:["6 Golden Delicious or Granny Smith apples, peeled, cored and halved","150g caster sugar","80g unsalted butter","Ready-rolled puff pastry (or homemade)","Crème fraîche to serve"],
   steps:[{title:"Make the caramel",body:"Cook sugar in a 24cm ovenproof frying pan without stirring until amber. Add butter, swirl to combine."},{title:"Add apples",body:"Arrange apples rounded-side down in the caramel. Cook on medium heat 15 minutes.",timer:900},{title:"Top with pastry",body:"Drape pastry over the apples, tucking the edges down around them."},{title:"Bake",body:"Bake at 200°C for 25-30 minutes until pastry is golden.",timer:1800},{title:"Invert",body:"Cool 5 minutes. Place a plate over the pan. Flip in one confident motion. Serve with crème fraîche."}],
   tip:"The inversion is the most nerve-wracking step. Let it cool 5 minutes but not longer — the caramel will stick if it cools too much. One confident flip."},
  {id:155,photo:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop",name:"Baingan Bharta",emoji:"🍆",xp:70,difficulty:"Medium",time:"40 min",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:200,protein:6,carbs:22,fat:10,fiber:8},done:false,
   ingredients:["2 large eggplants","1 onion, finely diced","3 tomatoes, finely diced","4 cloves garlic","1 tsp ginger","2 green chillies","1 tsp cumin seeds","1 tsp coriander","1 tsp garam masala","3 tbsp oil","Fresh coriander"],
   steps:[{title:"Char the eggplants",body:"Place eggplants directly on a gas flame, turning every 2-3 minutes until completely charred and collapsed — about 15 minutes.",timer:900},{title:"Peel and mash",body:"Cool, peel off charred skin. Roughly mash the flesh. This is the heart of the dish."},{title:"Cook aromatics",body:"Fry cumin seeds. Add onion and cook 10 minutes. Add garlic, ginger, chilli, and spices."},{title:"Add tomatoes and eggplant",body:"Add tomatoes and cook 5 minutes. Add mashed eggplant. Cook 5-10 minutes until thick. Add garam masala.",timer:600}],
   tip:"The open-flame charring of the eggplant is essential — it creates the smoky flavour that defines this dish. Oven-roasting doesn't achieve the same result."},
  {id:156,photo:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80&fit=crop",name:"Ssambap",emoji:"🥬",xp:55,difficulty:"Easy",time:"20 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:380,protein:28,carbs:28,fat:18,fiber:4},done:false,
   ingredients:["400g thinly sliced pork belly or beef","Butter lettuce leaves for wrapping","Perilla leaves","Steamed short-grain rice","Ssamjang sauce: 3 tbsp doenjang (soybean paste), 1 tbsp gochujang, 1 tsp sesame oil, 1 tsp sesame seeds, 1 clove garlic","Kimchi, pickled vegetables, sliced garlic, sliced green chillies"],
   steps:[{title:"Make ssamjang",body:"Mix all sauce ingredients."},{title:"Cook the meat",body:"Grill or pan-fry meat over high heat until caramelised.",timer:300},{title:"Assemble wraps",body:"Place a perilla leaf inside a butter lettuce leaf. Add rice, then meat, ssamjang, and accompaniments."},{title:"Roll and eat",body:"Fold the leaves around the filling and eat in one bite."}],
   tip:"The ssam (wrap) experience is communal and interactive — lay everything in the centre of the table and let everyone build their own. One of the most fun ways to eat."},
  {id:157,photo:"https://images.unsplash.com/photo-1559058789-672da06263d8?w=600&q=80&fit=crop",name:"Pesto Pasta",emoji:"🍝",xp:35,difficulty:"Easy",time:"15 min",category:"Italian",diets:["Vegetarian"],macros:{calories:540,protein:18,carbs:68,fat:24,fiber:4},done:false,
   ingredients:["400g trofie or linguine","For pesto: 80g fresh basil leaves, 30g pine nuts (toasted), 60g Parmesan, 1 small clove garlic, 100ml extra-virgin olive oil, salt","Parmesan to serve"],
   steps:[{title:"Make pesto",body:"Blend basil, pine nuts, Parmesan, and garlic with a little oil. Slowly add remaining oil until smooth. Season."},{title:"Cook pasta",body:"Cook pasta in heavily salted water until al dente. Reserve pasta water."},{title:"Combine",body:"Away from heat, toss pasta with pesto, adding pasta water to loosen. The heat must be off — pesto turns bitter when cooked."},{title:"Serve",body:"Plate immediately with extra Parmesan."}],
   tip:"Never cook pesto — add it to pasta off the heat. High temperature destroys the colour and turns the basil bitter. The residual heat from the pasta is all it needs."},
  {id:158,photo:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80&fit=crop",name:"Roasted Duck Legs",emoji:"🦆",xp:100,difficulty:"Medium",time:"2 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:560,protein:44,carbs:8,fat:40,fiber:1},done:false,
   ingredients:["4 duck legs","1 tsp five spice","1 tsp garlic powder","1 tsp salt","1 tsp black pepper","Orange zest","Roasted vegetables to serve"],
   steps:[{title:"Score and season",body:"Score the duck skin in a crosshatch pattern. Mix spices and rub all over. Refrigerate overnight uncovered — this dries the skin.",timer:0},{title:"Slow roast",body:"Place duck legs skin-side up on a rack over a tray. Roast at 160°C for 1.5 hours — the fat renders slowly.",timer:5400},{title:"Crisp the skin",body:"Increase oven to 220°C. Roast 15-20 more minutes until skin is deeply golden and shatteringly crispy.",timer:1200},{title:"Rest",body:"Rest 10 minutes before serving.",timer:600}],
   tip:"The overnight uncovered rest in the fridge dries the skin — this is the secret to the crackling finish. Wet skin steams, dry skin crisps."},
  {id:159,photo:"https://images.unsplash.com/photo-1484723091739-30990106e7a3?w=600&q=80&fit=crop",name:"Pain Perdu",emoji:"🍞",xp:40,difficulty:"Easy",time:"15 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:440,protein:13,carbs:52,fat:20,fiber:2},done:false,
   ingredients:["4 thick slices stale bread (baguette or challah)","3 eggs","150ml whole milk","50ml double cream","2 tbsp sugar","1 tsp vanilla","Pinch of cinnamon","2 tbsp butter","Honey, fresh fruit, or jam to serve"],
   steps:[{title:"Make custard",body:"Whisk eggs, milk, cream, sugar, vanilla, and cinnamon."},{title:"Soak",body:"Submerge bread in custard for 2 minutes per side — stale bread needs more time to absorb.",timer:240},{title:"Fry",body:"Melt butter in a pan over medium heat. Cook soaked bread 3-4 minutes per side until golden and custardy.",timer:480},{title:"Serve",body:"Drizzle with honey or serve with fresh fruit and jam."}],
   tip:"Pain perdu is the original French toast, literally 'lost bread' — a thrifty way to use stale bread. Stale bread absorbs the custard better than fresh."},
  {id:160,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Spicy Nduja Pasta",emoji:"🌶️",xp:65,difficulty:"Easy",time:"20 min",category:"Italian",diets:["Dairy-free"],macros:{calories:560,protein:20,carbs:72,fat:24,fiber:4},done:false,
   ingredients:["400g rigatoni","100g nduja (spicy Calabrian spreadable salami)","400g can whole tomatoes","4 cloves garlic","3 tbsp olive oil","Parmesan to serve","Fresh parsley"],
   steps:[{title:"Melt the nduja",body:"Add nduja to a pan over medium heat. It will melt completely into a spicy, red oil — about 2 minutes."},{title:"Add garlic and tomatoes",body:"Add garlic to the nduja oil. Cook 1 minute. Add tomatoes, breaking up. Simmer 10 minutes.",timer:600},{title:"Cook and combine pasta",body:"Cook rigatoni in salted water. Reserve pasta water. Toss with sauce and pasta water."},{title:"Serve",body:"Top with Parmesan and parsley."}],
   tip:"Nduja is the Calabrian secret weapon — it melts into a spicy, paprika-rich sauce that tastes like it took hours. Find it at Italian delis or good supermarkets."},
  {id:161,photo:"https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80&fit=crop",name:"Spanakopita",emoji:"🥬",xp:90,difficulty:"Medium",time:"1 hr 10 min",category:"Mediterranean",diets:["Vegetarian"],macros:{calories:360,protein:14,carbs:32,fat:22,fiber:4},done:false,
   ingredients:["500g fresh spinach","300g feta, crumbled","4 eggs","1 onion, finely diced","3 cloves garlic","Fresh dill and mint","Salt, pepper, nutmeg","12 sheets filo pastry","100ml olive oil or melted butter"],
   steps:[{title:"Make the filling",body:"Wilt spinach, squeeze all water out. Mix with feta, eggs, onion, garlic, dill, mint, salt, pepper, and nutmeg."},{title:"Layer the filo",body:"Brush a baking tin with oil. Layer 6 sheets of filo, brushing each with oil."},{title:"Add filling and top",body:"Spread filling evenly. Layer remaining 6 sheets of filo on top, brushing each."},{title:"Score and bake",body:"Score the top into diamonds. Bake at 180°C for 45 minutes until golden.",timer:2700}],
   tip:"Squeezing every drop of water from the spinach is essential — wet filling makes soggy pastry."},
  {id:162,photo:"https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=600&q=80&fit=crop",name:"Udon Noodle Soup",emoji:"🍜",xp:55,difficulty:"Easy",time:"20 min",category:"Japanese",diets:["Dairy-free"],macros:{calories:380,protein:18,carbs:52,fat:10,fiber:3},done:false,
   ingredients:["400g fresh or dried udon noodles","1L dashi stock","3 tbsp soy sauce","2 tbsp mirin","1 tbsp sake","Toppings: poached chicken or tempura, spring onions, fish cakes (narutomaki), nori, soft-boiled egg, togarashi"],
   steps:[{title:"Make the broth",body:"Bring dashi to a simmer. Add soy sauce, mirin, and sake. Taste — it should be deeply savoury and slightly sweet."},{title:"Cook noodles",body:"Cook udon per package directions. Drain and divide into bowls."},{title:"Serve",body:"Pour hot broth over noodles. Arrange toppings on top."},{title:"Season at the table",body:"Let each person add togarashi and extra soy sauce to taste."}],
   tip:"The broth is everything — good dashi makes the difference between mediocre and exceptional udon soup. Dried dashi powder works well for a weeknight."},
  {id:163,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Pappardelle with Wild Mushrooms",emoji:"🍄",xp:85,difficulty:"Medium",time:"30 min",category:"Italian",diets:["Vegetarian"],macros:{calories:560,protein:18,carbs:72,fat:24,fiber:6},done:false,
   ingredients:["400g pappardelle","500g mixed wild mushrooms (porcini, chanterelles, oyster)","4 cloves garlic","3 tbsp olive oil","50g butter","100ml dry white wine","100ml double cream","Fresh thyme","Parmesan","Salt and pepper"],
   steps:[{title:"Cook mushrooms properly",body:"Cook mushrooms in batches over very high heat until deeply golden — crowd the pan and they'll steam. Season after coloured.",timer:480},{title:"Build sauce",body:"Add garlic and thyme. Add wine and reduce. Add cream and simmer 3 minutes.",timer:300},{title:"Cook pasta",body:"Cook pappardelle in salted water. Reserve pasta water."},{title:"Combine",body:"Toss pasta with mushroom sauce, pasta water, and butter until glossy. Finish with Parmesan."}],
   tip:"Cook mushrooms in batches — one layer at a time in a very hot pan. Crowded mushrooms steam and become watery; properly cooked mushrooms caramelise and become deeply flavourful."},
  {id:164,photo:"https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80&fit=crop",name:"Khao Pad",emoji:"🍚",xp:45,difficulty:"Easy",time:"15 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:420,protein:14,carbs:54,fat:16,fiber:2},done:false,
   ingredients:["400g cold cooked jasmine rice","2 eggs","150g chicken, pork, or prawns","1 onion, diced","4 cloves garlic","2 tbsp fish sauce","1 tbsp oyster sauce","1 tsp white sugar","Cucumber, spring onions, lime to serve"],
   steps:[{title:"Fry aromatics",body:"Heat oil in wok until smoking. Fry onion and garlic 1 minute."},{title:"Add protein",body:"Add meat or prawns. Cook until just done.",timer:180},{title:"Add rice",body:"Add cold rice. Spread and press. Cook 1 minute without stirring. Toss."},{title:"Season and eggs",body:"Add fish sauce, oyster sauce, and sugar. Push rice aside. Scramble eggs in centre, fold in. Serve with cucumber, spring onions, and lime."}],
   tip:"Cold rice is mandatory — freshly cooked rice is too wet and clumps. Plan ahead and cook rice the day before."},
  {id:165,photo:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80&fit=crop",name:"Lamb Kofta",emoji:"🍢",xp:70,difficulty:"Medium",time:"30 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:420,protein:30,carbs:10,fat:30,fiber:2},done:false,
   ingredients:["500g ground lamb","1 onion, grated","3 cloves garlic","2 tsp cumin","1 tsp coriander","1 tsp cinnamon","½ tsp cayenne","Large handful fresh parsley and mint","Salt and pepper","Pita, tzatziki, and salad to serve"],
   steps:[{title:"Mix the kofta",body:"Combine lamb, grated onion, garlic, spices, and herbs. Mix vigorously until sticky."},{title:"Shape onto skewers",body:"Divide into 8 portions. Wet your hands. Mould each portion around a flat metal skewer into a sausage shape."},{title:"Grill",body:"Grill over high heat, turning every 2 minutes, until charred outside and cooked through.",timer:480},{title:"Serve",body:"Serve in warm pita with tzatziki, tomato, onion, and parsley."}],
   tip:"The sticky mixture from vigorous mixing holds the kofta on the skewer. If it's not sticking, mix more. The fat in lamb also helps — leaner meats are harder to keep on skewers."},
  {id:166,photo:"https://images.unsplash.com/photo-1612392062631-94f9e6d3a0b8?w=600&q=80&fit=crop",name:"Chicken Souvlaki",emoji:"🍗",xp:65,difficulty:"Easy",time:"30 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:380,protein:36,carbs:12,fat:22,fiber:2},done:false,
   ingredients:["600g chicken thighs, cut into chunks","Marinade: 4 tbsp olive oil, juice of 1 lemon, 3 cloves garlic, 1 tsp oregano, 1 tsp paprika, salt, pepper","Pita, tzatziki, tomato, onion, parsley to serve"],
   steps:[{title:"Marinate",body:"Toss chicken in marinade. Refrigerate at least 1 hour.",timer:3600},{title:"Thread skewers",body:"Thread chicken onto metal skewers."},{title:"Grill",body:"Grill over high heat, turning every 2-3 minutes, until charred and cooked through.",timer:480},{title:"Serve",body:"Serve in warm pita with tzatziki, tomato, red onion, and parsley."}],
   tip:"Chicken thighs over breasts — they stay juicy under the high heat of the grill and don't dry out."},
  {id:167,photo:"https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?w=600&q=80&fit=crop",name:"Banh Mi",emoji:"🥖",xp:80,difficulty:"Medium",time:"30 min",category:"Asian",diets:["Dairy-free"],macros:{calories:460,protein:26,carbs:52,fat:18,fiber:4},done:false,
   ingredients:["2 baguettes","300g pork belly or chicken, marinated in soy sauce, fish sauce, garlic, and five spice","Quick-pickled vegetables: carrot and daikon soaked in 100ml rice vinegar, 2 tbsp sugar, 1 tsp salt for 20 minutes","Mayonnaise","Pâté (optional)","Fresh coriander","Sliced cucumber","Sliced jalapeño","Maggi seasoning or soy sauce"],
   steps:[{title:"Pickle the vegetables",body:"Combine rice vinegar, sugar, and salt. Stir until dissolved. Add julienned carrot and daikon. Marinate 20 minutes minimum.",timer:1200},{title:"Cook the protein",body:"Grill or roast the marinated pork or chicken until caramelised.",timer:900},{title:"Assemble",body:"Split the baguette. Spread mayo and pâté. Add protein, pickled vegetables, cucumber, coriander, and jalapeño."},{title:"Season",body:"Drizzle a few drops of Maggi seasoning or soy sauce inside. Close and eat immediately."}],
   tip:"The pickled daikon and carrot are non-negotiable — they provide the crunch and acidity that balance the rich protein and mayo. Make more than you need; they keep for a week."},
  {id:168,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Sicilian Pasta alla Norma",emoji:"🍝",xp:75,difficulty:"Medium",time:"35 min",category:"Italian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:520,protein:16,carbs:76,fat:20,fiber:8},done:false,
   ingredients:["400g rigatoni or penne","2 medium eggplants, cut into 2cm cubes","2×400g cans whole tomatoes","4 cloves garlic","Fresh basil","100g ricotta salata or feta, crumbled","Olive oil","Salt"],
   steps:[{title:"Salt and fry eggplant",body:"Salt eggplant cubes, rest 20 minutes, squeeze dry. Fry in generous olive oil until deeply golden. Drain.",timer:1200},{title:"Make tomato sauce",body:"Sauté garlic in olive oil. Add tomatoes, simmer 15 minutes.",timer:900},{title:"Combine",body:"Add fried eggplant to sauce. Simmer 5 minutes."},{title:"Cook pasta and serve",body:"Cook pasta until al dente. Toss with sauce. Top with torn basil and crumbled ricotta salata."}],
   tip:"Don't be shy with the oil for frying the eggplant — it needs to absorb a lot to get properly golden. Too little oil and it burns on the outside while remaining raw inside."},
  {id:169,photo:"https://images.unsplash.com/photo-1561043433-aaf687c4cf04?w=600&q=80&fit=crop",name:"Kouign-Amann",emoji:"🫓",xp:130,difficulty:"Hard",time:"3 hrs",category:"Baking",diets:["Vegetarian"],macros:{calories:440,protein:7,carbs:58,fat:22,fiber:1},done:false,
   ingredients:["400g bread flour","7g instant yeast","1 tsp salt","250ml warm water","200g cold unsalted butter, cubed","200g caster sugar","Flaky sea salt"],
   steps:[{title:"Make the dough",body:"Mix flour, yeast, salt, and water into a dough. Knead 8 minutes. Rest 1 hour.",timer:3600},{title:"Layer butter and sugar",body:"Roll dough, scatter butter over. Fold and roll again. Scatter most of the sugar. Fold and roll again — like making rough croissants."},{title:"Shape",body:"Press into a buttered 25cm round tin. Scatter remaining sugar and sea salt on top."},{title:"Prove and bake",body:"Rest 30 minutes. Bake at 200°C for 30-35 minutes until deeply caramelised.",timer:2100},{title:"Cool and flip",body:"Flip immediately onto a rack to prevent sticking. The caramelised bottom is the top."}],
   tip:"Kouign-amann means 'butter cake' in Breton. It's essentially laminated bread with sugar caramelised into and around it. The result is somewhere between bread, croissant, and caramel tart."},
  {id:170,photo:"https://images.unsplash.com/photo-1474625342403-d1a7d0f9e89e?w=600&q=80&fit=crop",name:"Mole Negro",emoji:"🍫",xp:160,difficulty:"Hard",time:"3 hrs",category:"Mexican",diets:["Gluten-free","Dairy-free"],macros:{calories:320,protein:22,carbs:28,fat:14,fiber:8},done:false,
   ingredients:["For mole: 4 dried mulato chillies, 4 dried ancho chillies, 2 chipotle chillies, 50g dark chocolate, 2 tomatoes (roasted), 1 onion (charred), 5 cloves garlic, 1 slice stale bread (fried), 1 tortilla (toasted), 50g raisins, 30g sesame seeds, 1 tsp each cumin and cinnamon","Chicken pieces to serve"],
   steps:[{title:"Toast and soak chillies",body:"Toast dried chillies briefly in a dry pan. Remove seeds. Soak in hot water 30 minutes.",timer:1800},{title:"Blend the base",body:"Blend soaked chillies, roasted tomatoes, charred onion, garlic, fried bread, toasted tortilla, raisins, and sesame seeds until smooth."},{title:"Cook the mole",body:"Fry the mole paste in oil until it darkens and thickens — about 20 minutes. Add chicken stock gradually. Add chocolate.",timer:1200},{title:"Simmer",body:"Add chicken pieces. Simmer gently 1-1.5 hours until chicken is tender and mole is thick.",timer:5400}],
   tip:"Mole negro is one of the most complex sauces in the world, with over 30 ingredients. The chocolate is secondary — the layered chilli flavour is the point."},
  {id:171,photo:"https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&fit=crop",name:"Beef Wellington",emoji:"🥩",xp:170,difficulty:"Hard",time:"2 hrs",category:"Comfort",diets:["No restrictions"],macros:{calories:680,protein:48,carbs:32,fat:42,fiber:3},done:false,
   ingredients:["800g beef fillet","250g chestnut mushrooms (make duxelles: blend and cook dry)","6 slices Parma ham","Ready-rolled puff pastry (500g)","1 tbsp Dijon mustard","1 egg, beaten","Salt and pepper"],
   steps:[{title:"Sear and brush beef",body:"Season beef. Sear all over in a very hot pan until brown all over. Brush with Dijon while hot. Refrigerate 30 minutes.",timer:1800},{title:"Make duxelles",body:"Cook blended mushrooms in a dry pan until all moisture evaporates — they must be dry.",timer:600},{title:"Wrap",body:"Lay Parma ham on clingfilm, overlapping. Spread duxelles. Roll beef in the ham. Wrap tightly. Chill 15 minutes.",timer:900},{title:"Wrap in pastry",body:"Roll pastry. Wrap the beef roll. Seal with egg. Brush all over with egg. Score decoratively. Chill 20 minutes.",timer:1200},{title:"Bake",body:"Bake at 200°C for 25-30 minutes for medium-rare. Rest 10 minutes before slicing.",timer:1800}],
   tip:"Dry duxelles is the critical step — any moisture turns the bottom pastry soggy. Cook the mushrooms until completely dry before wrapping."},
  {id:172,photo:"https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80&fit=crop",name:"Zha Jiang Mian",emoji:"🍜",xp:75,difficulty:"Medium",time:"30 min",category:"Asian",diets:["Dairy-free"],macros:{calories:560,protein:24,carbs:68,fat:22,fiber:5},done:false,
   ingredients:["400g fresh or dried wheat noodles","300g ground pork","3 tbsp sweet bean paste (tianmianjiang)","1 tbsp dark soy sauce","1 tbsp Shaoxing wine","4 cloves garlic","1 tsp ginger","2 tbsp neutral oil","Cucumber, julienned","Bean sprouts","Spring onions, sliced","A little sesame oil"],
   steps:[{title:"Cook the meat sauce",body:"Fry garlic and ginger in oil. Add pork and brown well. Add sweet bean paste, soy sauce, and wine. Add 200ml water. Simmer 15 minutes until thick and glossy.",timer:900},{title:"Cook noodles",body:"Cook noodles until al dente. Drain and rinse."},{title:"Assemble",body:"Noodles in a bowl. Ladle meat sauce on top. Arrange cucumber, bean sprouts, and spring onions around it."},{title:"Toss at the table",body:"Drizzle sesame oil. Mix vigorously at the table — the noodles should be fully coated in the sauce."}],
   tip:"Zhajiangmian is Beijing's beloved noodle dish. The sweet fermented bean paste is the defining ingredient — find it at Asian grocery stores."},
  {id:173,photo:"https://images.unsplash.com/photo-1559058789-672da06263d8?w=600&q=80&fit=crop",name:"Crab Linguine",emoji:"🦀",xp:90,difficulty:"Medium",time:"20 min",category:"Italian",diets:["Dairy-free"],macros:{calories:480,protein:28,carbs:62,fat:16,fiber:3},done:false,
   ingredients:["400g linguine","250g white crab meat (fresh or good canned)","100g brown crab meat","3 cloves garlic","1 red chilli","100ml dry white wine","3 tbsp olive oil","Juice of 1 lemon","Fresh parsley","Salt"],
   steps:[{title:"Cook aromatics",body:"Gently cook garlic and chilli in olive oil 2 minutes. Add wine, reduce."},{title:"Add crab",body:"Add brown crab meat and stir into the oil. Add white crab meat gently — you want chunks.",timer:120},{title:"Cook pasta",body:"Cook linguine until al dente. Reserve pasta water."},{title:"Combine",body:"Toss pasta with crab sauce and pasta water. Squeeze lemon over. Add parsley. Serve immediately."}],
   tip:"Brown crab meat is the intensely flavoured part — it seasons and enriches the sauce. White crab provides texture. Using both is what makes crab pasta special."},
  {id:174,photo:"https://images.unsplash.com/photo-1548940740-204726a19be3?w=600&q=80&fit=crop",name:"Slow Cooker Beef Stew",emoji:"🥣",xp:80,difficulty:"Easy",time:"8 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:480,protein:38,carbs:28,fat:22,fiber:5},done:false,
   ingredients:["1kg beef chuck, cut into 5cm cubes","4 carrots, cut into chunks","4 potatoes, cut into chunks","1 onion, diced","3 cloves garlic","200ml red wine","400ml beef stock","2 tbsp tomato paste","2 tsp Worcestershire sauce","Fresh thyme and rosemary","Salt and pepper"],
   steps:[{title:"Brown the beef",body:"Season beef and sear in batches in a hot pan until deeply browned. This step is worth doing — don't skip it."},{title:"Deglaze",body:"Add wine to the pan, scrape up all the bits."},{title:"Slow cook",body:"Transfer everything to a slow cooker. Cook on low for 8 hours or high for 4-5 hours.",timer:28800},{title:"Finish",body:"Taste and adjust seasoning. The sauce should be thick and glossy. If too thin, remove lid and cook 30 more minutes."}],
   tip:"Browning the beef before slow cooking is the most impactful step. Unbrowned beef in a slow cooker produces grey, flavourless meat. The Maillard crust adds enormous depth."},
  {id:175,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Spaghetti Nerano",emoji:"🍝",xp:70,difficulty:"Medium",time:"25 min",category:"Italian",diets:["Vegetarian"],macros:{calories:560,protein:22,carbs:70,fat:24,fiber:4},done:false,
   ingredients:["400g spaghetti","4 zucchini, very thinly sliced","4 cloves garlic","100g Parmesan, grated","50g Provolone del Monaco or Gruyère, grated","Fresh basil","Olive oil","Salt and pepper"],
   steps:[{title:"Fry the zucchini",body:"Fry zucchini slices in plenty of olive oil until golden and soft — about 10 minutes. Drain and set aside.",timer:600},{title:"Cook pasta",body:"Cook spaghetti in salted water. Reserve 300ml pasta water."},{title:"Create the cream",body:"In a hot pan, add fried zucchini. Add half the pasta water. Add drained pasta. Toss vigorously."},{title:"Add cheese off heat",body:"Off the heat, add Parmesan and Provolone. Toss vigorously until creamy, adding pasta water as needed. Add basil."}],
   tip:"This dish became famous after the Stanley Tucci Italy show. The zucchini must be fried until truly golden and soft — not steamed. The fried zucchini melts into a creamy sauce as you toss."},
  {id:176,photo:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&fit=crop",name:"Okonomi Yaki",emoji:"🥞",xp:70,difficulty:"Medium",time:"30 min",category:"Japanese",diets:["No restrictions"],macros:{calories:420,protein:20,carbs:38,fat:22,fiber:4},done:false,
   ingredients:["200g plain flour","200ml dashi stock","2 eggs","300g cabbage, finely shredded","100g diced pork belly or bacon","Toppings: okonomiyaki sauce, Japanese mayo, dried bonito flakes, aonori (seaweed flakes), pickled ginger"],
   steps:[{title:"Make the batter",body:"Whisk flour and dashi until smooth. Add eggs and mix."},{title:"Add cabbage",body:"Fold in shredded cabbage — it should be mostly cabbage with batter just holding it together."},{title:"Cook",body:"Heat oil in a frying pan. Add pork belly to the pan. Pour batter over. Cook on medium heat 5-6 minutes until set on bottom.",timer:360},{title:"Flip",body:"Flip confidently. Cook another 5 minutes.",timer:300},{title:"Top and serve",body:"Spread okonomiyaki sauce and mayo in stripes. Top with bonito, aonori, and pickled ginger."}],
   tip:"Okonomi yaki means 'what you like grilled'. The batter should be mostly cabbage — not a thick pancake with some cabbage. The cabbage is the hero."},
  {id:177,photo:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop",name:"Moroccan Harira",emoji:"🍲",xp:70,difficulty:"Medium",time:"1 hr",category:"Mediterranean",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:280,protein:14,carbs:42,fat:6,fiber:12},done:false,
   ingredients:["200g dried chickpeas, soaked overnight","100g red lentils","400g can chopped tomatoes","1 onion, diced","3 stalks celery, diced","3 cloves garlic","1 tsp ginger","1 tsp turmeric","1 tsp cinnamon","1 tsp cumin","Pinch saffron","Large bunch fresh coriander and parsley","Lemon","Salt"],
   steps:[{title:"Cook chickpeas",body:"Boil soaked chickpeas until tender — about 45 minutes.",timer:2700},{title:"Make the soup",body:"Cook onion, celery, and garlic in olive oil 8 minutes. Add spices and saffron."},{title:"Add remaining ingredients",body:"Add tomatoes, lentils, chickpeas, and enough water to make a thick soup. Simmer 20 minutes.",timer:1200},{title:"Finish",body:"Add coriander, parsley, and lemon juice. Season. Serve with crusty bread and dates."}],
   tip:"Harira is the soup that breaks the fast during Ramadan throughout the Maghreb. It's a complete meal in a bowl — hearty, spiced, and sustaining."},
  {id:178,photo:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&fit=crop",name:"Mango Lassi",emoji:"🥭",xp:15,difficulty:"Easy",time:"5 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:240,protein:6,carbs:44,fat:6,fiber:2},done:false,
   ingredients:["2 ripe mangoes (or 300g frozen mango)","300ml full-fat yoghurt","100ml whole milk","2 tbsp honey or sugar","½ tsp cardamom","Pinch of salt","Ice cubes"],
   steps:[{title:"Blend",body:"Blend mango, yoghurt, milk, honey, cardamom, and salt until very smooth."},{title:"Taste",body:"Adjust sweetness and cardamom to taste."},{title:"Serve",body:"Pour over ice. Serve immediately."}],
   tip:"The cardamom and pinch of salt are what elevate a lassi from a smoothie. The salt enhances the mango flavour without tasting salty."},
  {id:179,photo:"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&fit=crop",name:"Madeleines",emoji:"🍪",xp:60,difficulty:"Medium",time:"1 hr",category:"Baking",diets:["Vegetarian"],macros:{calories:140,protein:3,carbs:18,fat:7,fiber:0},done:false,
   ingredients:["100g unsalted butter, browned","100g plain flour","100g caster sugar","2 eggs","1 tsp baking powder","Zest of 1 lemon","Pinch of salt","1 tbsp honey"],
   steps:[{title:"Brown the butter",body:"Cook butter until it smells nutty and turns amber. Cool completely.",timer:300},{title:"Mix",body:"Whisk eggs and sugar until pale and thick. Fold in flour, baking powder, salt, lemon zest, and honey. Fold in cooled brown butter."},{title:"Rest the batter",body:"Refrigerate 1 hour minimum — non-negotiable. This creates the characteristic hump.",timer:3600},{title:"Bake",body:"Fill buttered madeleine moulds ¾ full. Bake at 210°C for 10-12 minutes until golden with the iconic bump.",timer:720}],
   tip:"The cold batter going into the hot oven is what creates the famous madeleine hump. Don't skip the rest — it's what defines the shape."},
  {id:180,photo:"https://images.unsplash.com/photo-1615361200141-f45040f367be?w=600&q=80&fit=crop",name:"Goulash",emoji:"🍖",xp:90,difficulty:"Medium",time:"1.5 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:480,protein:36,carbs:28,fat:24,fiber:5},done:false,
   ingredients:["800g beef chuck, cut into 3cm cubes","3 large onions, sliced","4 tbsp sweet Hungarian paprika","1 tsp caraway seeds","400ml beef stock","400g can chopped tomatoes","3 cloves garlic","2 tbsp lard or oil","Salt and pepper","Sour cream and egg noodles to serve"],
   steps:[{title:"Caramelise the onions",body:"Cook onions in lard over medium-low heat for 20 minutes until deeply golden.",timer:1200},{title:"Add paprika",body:"Off the heat, add paprika and caraway seeds — cooking paprika over heat burns it. Stir, then return to heat."},{title:"Brown the beef",body:"Add beef, brown on all sides."},{title:"Simmer",body:"Add stock and tomatoes. Simmer covered on lowest heat for 1-1.5 hours until beef is very tender.",timer:5400},{title:"Serve",body:"Serve with egg noodles or potatoes and a dollop of sour cream."}],
   tip:"Hungarian sweet paprika is the non-negotiable ingredient. It should be fresh — paprika goes stale quickly and loses its flavour. Add it off the heat to prevent bitterness."},
  {id:181,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Linguine with Bottarga",emoji:"🐟",xp:80,difficulty:"Easy",time:"15 min",category:"Italian",diets:["Dairy-free"],macros:{calories:490,protein:22,carbs:66,fat:18,fiber:2},done:false,
   ingredients:["400g linguine","50-60g bottarga (cured fish roe), grated or thinly sliced","4 cloves garlic","1 red chilli","100ml dry white wine","4 tbsp olive oil","Fresh parsley","Lemon zest"],
   steps:[{title:"Cook garlic and chilli",body:"Gently cook garlic and chilli in olive oil — do not brown."},{title:"Add wine",body:"Add wine and reduce by half."},{title:"Cook pasta",body:"Cook linguine. Reserve pasta water."},{title:"Combine",body:"Toss pasta with oil mixture and pasta water until silky."},{title:"Add bottarga",body:"Off the heat, grate bottarga over the pasta. Add parsley and lemon zest. Toss once and serve immediately."}],
   tip:"Bottarga is cured mullet or tuna roe — intensely savoury and briny. Add it off the heat only — it's a condiment, not an ingredient to cook. The heat from the pasta is enough."},
  {id:182,photo:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop",name:"Bao Buns",emoji:"🫓",xp:90,difficulty:"Medium",time:"2 hrs",category:"Asian",diets:["Dairy-free"],macros:{calories:380,protein:16,carbs:52,fat:14,fiber:3},done:false,
   ingredients:["For dough: 300g plain flour, 7g instant yeast, 1 tbsp sugar, 150ml warm milk, 2 tbsp neutral oil, 1 tsp baking powder","For filling: 400g pork belly slices, braised in soy sauce, hoisin, ginger, garlic, and five spice until tender","Pickled cucumber, sriracha mayo, fresh coriander, crushed peanuts"],
   steps:[{title:"Make dough",body:"Combine flour, yeast, sugar, milk, and oil. Knead 10 minutes. Rest 1 hour.",timer:3600},{title:"Shape bao",body:"Divide into 12 balls. Roll each into an oval. Fold over a greased chopstick. Remove chopstick."},{title:"Prove and steam",body:"Rest 30 minutes. Steam in a bamboo steamer 10-12 minutes until puffed and soft.",timer:1800},{title:"Fill",body:"Open each bao. Fill with pork belly, pickled cucumber, sriracha mayo, coriander, and peanuts."}],
   tip:"The folded shape of the bao comes from the greased chopstick method — it prevents the two halves from sealing together during steaming."},
  {id:183,photo:"https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80&fit=crop",name:"Cauliflower Cheese",emoji:"🧀",xp:50,difficulty:"Easy",time:"35 min",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:380,protein:18,carbs:22,fat:26,fiber:5},done:false,
   ingredients:["1 large head cauliflower, broken into florets","50g unsalted butter","50g plain flour","600ml whole milk","150g mature cheddar, grated","50g Gruyère, grated","1 tsp Dijon mustard","Pinch cayenne","Salt and pepper"],
   steps:[{title:"Blanch cauliflower",body:"Cook cauliflower in salted boiling water 4 minutes. It should be just tender — it will cook more in the oven. Drain.",timer:240},{title:"Make cheese sauce",body:"Make a béchamel with butter, flour, and milk. Off the heat, stir in cheddar and Gruyère. Add mustard and cayenne."},{title:"Bake",body:"Pour cauliflower into a baking dish. Cover with cheese sauce. Top with extra cheese. Bake at 200°C for 20 minutes until golden and bubbling.",timer:1200}],
   tip:"Partially cooking the cauliflower before baking is essential. Fully raw cauliflower never gets tender enough in the oven — it stays hard in the centre."},
  {id:184,photo:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80&fit=crop",name:"Palak Dal",emoji:"🥬",xp:50,difficulty:"Easy",time:"35 min",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:280,protein:14,carbs:38,fat:8,fiber:10},done:false,
   ingredients:["200g yellow toor dal or red lentils","300g fresh spinach","1 onion, diced","3 tomatoes, diced","4 cloves garlic","1 tsp turmeric","1 tsp cumin seeds","1 tsp garam masala","2 tbsp ghee or oil","Salt","Lemon"],
   steps:[{title:"Cook dal",body:"Boil dal with turmeric and salt until completely soft and mushy.",timer:1200},{title:"Make the tadka",body:"Heat ghee. Fry cumin seeds until spluttering. Add onion, cook 8 minutes. Add garlic and tomatoes, cook 5 minutes.",timer:480},{title:"Combine",body:"Add cooked dal to the tadka. Add spinach and stir until wilted."},{title:"Finish",body:"Add garam masala and lemon juice. Simmer 5 minutes. Serve with rice."}],
   tip:"The tadka (tempered oil with spices and aromatics) is the most important step in Indian dal. It's added at the end and provides the distinctive flavour layer that elevates the dish."},
  {id:185,photo:"https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600&q=80&fit=crop",name:"Arancini",emoji:"🍚",xp:100,difficulty:"Hard",time:"1.5 hrs",category:"Italian",diets:["Vegetarian"],macros:{calories:380,protein:14,carbs:48,fat:16,fiber:2},done:false,
   ingredients:["For risotto: leftover saffron risotto or make fresh","For filling: small cubes of mozzarella or ragù","Breadcrumbs for coating","2 eggs, beaten","Oil for deep frying"],
   steps:[{title:"Shape the arancini",body:"Wet your hands. Take a handful of cold risotto. Flatten in your palm. Add a cube of mozzarella. Close around it and shape into a ball."},{title:"Bread them",body:"Dip in beaten egg. Roll in breadcrumbs until fully coated."},{title:"Fry",body:"Deep fry at 180°C for 4-5 minutes until deep golden all over.",timer:300},{title:"Serve",body:"Drain briefly. Eat while the mozzarella is still hot and stretchy."}],
   tip:"Arancini exist to use leftover risotto. Cold risotto shapes much better than warm. The mozzarella must be fresh and cubed — it melts into a stretchy, molten centre."},
  {id:186,photo:"https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=600&q=80&fit=crop",name:"Paneer Tikka",emoji:"🧀",xp:70,difficulty:"Medium",time:"30 min",category:"Indian",diets:["Vegetarian","Gluten-free"],macros:{calories:380,protein:22,carbs:14,fat:26,fiber:3},done:false,
   ingredients:["400g paneer, cut into 3cm cubes","Marinade: 150g full-fat yoghurt, 2 tsp garam masala, 1 tsp cumin, 1 tsp turmeric, 1 tsp chilli powder, 1 tbsp tandoori masala, juice of 1 lemon, salt","1 red pepper, 1 green pepper, cut into chunks","1 red onion, cut into chunks","Mint chutney to serve"],
   steps:[{title:"Marinate",body:"Mix marinade ingredients. Coat paneer and vegetables thoroughly. Marinate 2 hours minimum.",timer:7200},{title:"Thread skewers",body:"Alternate paneer, peppers, and onion on metal skewers."},{title:"Grill",body:"Grill over high heat, turning every 2 minutes, until charred and smoky.",timer:480},{title:"Serve",body:"Serve with mint chutney, sliced onion, and lemon."}],
   tip:"The char is part of the flavour — you want dark spots on the paneer. The yoghurt marinade protects the paneer from drying out while allowing the spices to caramelise."},
  {id:187,photo:"https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=600&q=80&fit=crop",name:"Som Tam",emoji:"🌮",xp:55,difficulty:"Medium",time:"20 min",category:"Asian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:160,protein:4,carbs:24,fat:6,fiber:5},done:false,
   ingredients:["1 green papaya, julienned","2 tomatoes, quartered","4 long beans or green beans, cut into 5cm pieces","3 cloves garlic","2-4 bird's eye chillies","2 tbsp fish sauce (or soy sauce for vegan)","2 tbsp lime juice","1 tbsp palm sugar","30g roasted peanuts","Dried shrimp (optional)"],
   steps:[{title:"Pound aromatics",body:"In a large mortar pound garlic and chillies coarsely."},{title:"Add flavourings",body:"Add fish sauce, lime juice, and sugar. Muddle together."},{title:"Add papaya and beans",body:"Add papaya and beans. Pound gently to bruise — not pulverise."},{title:"Add tomatoes",body:"Add tomatoes, pound a few times. Taste — adjust hot, sour, salty, sweet."},{title:"Serve",body:"Top with peanuts. Serve with sticky rice."}],
   tip:"Som tam should be fiercely hot, bright with lime, and addictive. Taste constantly and adjust — every lime and chilli is different."},
  {id:188,photo:"https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80&fit=crop",name:"Gazpacho",emoji:"🍅",xp:35,difficulty:"Easy",time:"15 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:160,protein:4,carbs:22,fat:8,fiber:5},done:false,
   ingredients:["1kg very ripe tomatoes","1 cucumber, peeled and deseeded","1 red pepper, deseeded","1 green pepper, deseeded","2 cloves garlic","50g stale bread, soaked in water","4 tbsp extra-virgin olive oil","2 tbsp red wine vinegar","Salt","Ice cold water"],
   steps:[{title:"Blend",body:"Blend all vegetables, bread, oil, and vinegar until completely smooth."},{title:"Season",body:"Season generously with salt and vinegar. Taste — it should be bright and sharp."},{title:"Chill",body:"Refrigerate at least 2 hours until very cold.",timer:7200},{title:"Serve",body:"Serve in cold bowls. Drizzle with olive oil. Add finely diced tomato, cucumber, and pepper on top."}],
   tip:"Gazpacho must be served very cold. The acidity and salt levels that seem too strong at room temperature will be perfect when the soup is properly chilled."},
  {id:189,photo:"https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80&fit=crop",name:"Galbi (Korean Short Ribs)",emoji:"🍖",xp:100,difficulty:"Medium",time:"4 hrs",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:560,protein:38,carbs:28,fat:36,fiber:1},done:false,
   ingredients:["1.5kg beef short ribs, cut flanken-style (across the bones)","Marinade: 100ml soy sauce, 50ml mirin, 50ml sake, 1 Asian pear (grated), 4 cloves garlic, 1 tsp ginger, 2 tbsp sesame oil, 2 tbsp brown sugar, 1 tsp black pepper","Sesame seeds and spring onions"],
   steps:[{title:"Score and soak",body:"Score the meat. Soak ribs in cold water 30 minutes to remove blood. Pat dry.",timer:1800},{title:"Marinate",body:"Mix marinade. Coat ribs thoroughly. Marinate 2 hours minimum, overnight ideally.",timer:7200},{title:"Grill over charcoal",body:"Grill over very high heat, turning every 2 minutes, until caramelised and sticky.",timer:480},{title:"Serve",body:"Scatter sesame seeds and spring onions. Serve with steamed rice and kimchi."}],
   tip:"The grated Asian pear in the marinade is the Korean tenderising secret — its enzymes break down the collagen. The short marination turns these into remarkably tender ribs."},
  {id:190,photo:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&fit=crop",name:"Clafoutis",emoji:"🍒",xp:60,difficulty:"Easy",time:"50 min",category:"Baking",diets:["Vegetarian","Gluten-free"],macros:{calories:280,protein:10,carbs:36,fat:12,fiber:2},done:false,
   ingredients:["400g fresh cherries, unpitted","3 eggs","100g caster sugar","50g plain flour","300ml whole milk","50ml double cream","1 tsp vanilla","Pinch of salt","Butter for the dish","Icing sugar to serve"],
   steps:[{title:"Prepare dish",body:"Butter a gratin dish. Arrange cherries in a single layer."},{title:"Make the batter",body:"Whisk eggs and sugar until pale. Add flour and salt. Slowly whisk in milk, cream, and vanilla until smooth."},{title:"Bake",body:"Pour batter over cherries. Bake at 180°C for 35-40 minutes until set and golden but still slightly wobbly.",timer:2400},{title:"Serve",body:"Dust with icing sugar. Serve warm from the dish."}],
   tip:"Leave the cherry stones in — French bakers insist they add flavour during baking. Remove them as you eat. The batter should be poured thin, not thick."},
  {id:191,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Ragù alla Salsiccia",emoji:"🍝",xp:75,difficulty:"Easy",time:"35 min",category:"Italian",diets:["No restrictions"],macros:{calories:580,protein:28,carbs:68,fat:24,fiber:5},done:false,
   ingredients:["400g rigatoni or orecchiette","400g Italian pork sausages, squeezed from their casings","1 onion, finely diced","3 cloves garlic","100ml dry white wine","400g can whole tomatoes","Fresh fennel fronds or dried fennel seeds","Parmesan","3 tbsp olive oil","Salt, pepper, chilli"],
   steps:[{title:"Cook the sausage",body:"Break sausage meat into chunks in the pan. Cook over high heat, leaving it without stirring for 2 minutes to brown well."},{title:"Add aromatics",body:"Add onion and fennel seeds. Cook 5 minutes. Add garlic and chilli."},{title:"Deglaze and simmer",body:"Add wine. Reduce. Add tomatoes, breaking up. Simmer 20 minutes.",timer:1200},{title:"Cook and finish pasta",body:"Cook pasta until al dente. Toss with sauce and pasta water. Finish with Parmesan and fennel fronds."}],
   tip:"Squeeze sausage from the casing and break into irregular chunks — not mince. The different-sized pieces give varied texture and the casing stays behind, avoiding a tough result."},
  {id:192,photo:"https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80&fit=crop",name:"Chicken Tikka",emoji:"🍗",xp:70,difficulty:"Medium",time:"30 min",category:"Indian",diets:["Gluten-free","Dairy-free"],macros:{calories:320,protein:38,carbs:8,fat:16,fiber:2},done:false,
   ingredients:["700g chicken thighs, boneless, cut into chunks","Marinade: 150g yoghurt, 2 tbsp lemon juice, 2 tsp tandoori masala, 1 tsp cumin, 1 tsp coriander, 1 tsp turmeric, 1 tsp chilli powder, 4 cloves garlic, 1 tsp ginger, salt","Oil for basting","Lemon, onion, chutney to serve"],
   steps:[{title:"Marinate",body:"Mix marinade. Coat chicken thoroughly. Marinate minimum 2 hours, overnight for best results.",timer:7200},{title:"Skewer",body:"Thread chicken onto metal skewers."},{title:"Grill",body:"Grill under very high heat, turning and basting with oil every 3-4 minutes, until charred and cooked.",timer:720},{title:"Serve",body:"Serve with raw sliced onion, lemon wedges, and mint chutney."}],
   tip:"The yoghurt marinade serves two purposes: tenderising the chicken and creating a protective coating that allows the exterior to char without the inside drying out."},
  {id:193,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Pide",emoji:"🫓",xp:85,difficulty:"Medium",time:"2 hrs",category:"Mediterranean",diets:["No restrictions"],macros:{calories:480,protein:22,carbs:58,fat:18,fiber:3},done:false,
   ingredients:["For dough: 400g bread flour, 7g yeast, 1 tsp salt, 250ml warm water, 2 tbsp olive oil","For filling: 300g ground lamb or beef, 1 onion, 2 tomatoes, 2 green peppers, 1 tsp cumin, 1 tsp paprika, salt, pepper, 2 eggs for cracking in"],
   steps:[{title:"Make dough",body:"Combine flour, yeast, salt, water, and oil. Knead 8 minutes. Rest 1 hour.",timer:3600},{title:"Make filling",body:"Brown meat with onion, tomatoes, peppers, and spices. Season well."},{title:"Shape",body:"Divide dough into 2-3 pieces. Roll each into a long oval. Fold up edges to form a boat shape."},{title:"Fill and bake",body:"Fill with meat mixture. Bake at 230°C for 12 minutes. Crack an egg into each pide in the last 5 minutes.",timer:720}],
   tip:"Pide is the Turkish flatbread-pizza. The egg cracked in at the end is the traditional topping — its runny yolk mixes with the meat filling as you eat."},
  {id:194,photo:"https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80&fit=crop",name:"Ma Po Tofu",emoji:"🌶️",xp:70,difficulty:"Medium",time:"20 min",category:"Asian",diets:["Dairy-free"],macros:{calories:320,protein:18,carbs:16,fat:20,fiber:4},done:false,
   ingredients:["400g silken or soft tofu, cut into 2cm cubes","200g ground pork or beef","3 tbsp doubanjiang (spicy bean paste)","2 tbsp fermented black beans, chopped","4 cloves garlic","1 tsp ginger","200ml chicken stock","1 tsp Sichuan peppercorns, toasted and ground","Spring onions","1 tbsp cornstarch dissolved in 2 tbsp water"],
   steps:[{title:"Fry the paste",body:"Cook doubanjiang in oil 1-2 minutes until the oil turns red."},{title:"Add meat",body:"Add meat and brown. Add garlic, ginger, and black beans."},{title:"Add tofu and stock",body:"Add stock and bring to a simmer. Very gently add tofu — don't stir or it breaks.",timer:120},{title:"Thicken and finish",body:"Add cornstarch slurry to thicken. Scatter ground Sichuan pepper and spring onions."}],
   tip:"Sichuan peppercorns don't add heat — they add numbing tingle (mala) that is completely unique. Combined with the chilli heat of doubanjiang, this is what defines Sichuan cuisine."},
  {id:195,photo:"https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80&fit=crop",name:"Chicken Pastilla",emoji:"🥧",xp:140,difficulty:"Hard",time:"2 hrs",category:"Mediterranean",diets:["No restrictions"],macros:{calories:480,protein:28,carbs:38,fat:26,fiber:4},done:false,
   ingredients:["500g chicken thighs","1 onion, grated","2 tsp ginger","2 tsp cinnamon","½ tsp turmeric","Pinch saffron","Large handful parsley and coriander","3 eggs, scrambled into the braising liquid","50g almonds, toasted and coarsely ground","50g icing sugar plus extra for dusting","12 sheets filo pastry","100g butter, melted"],
   steps:[{title:"Braise the chicken",body:"Cook chicken with onion, spices, and water until very tender. Remove, shred. Reduce braising liquid. Scramble eggs into the reduced liquid.",timer:3600},{title:"Mix the filling",body:"Combine shredded chicken with egg mixture, herbs, almonds, and sugar."},{title:"Layer filo",body:"Butter a round tin. Layer 6 sheets of filo, brushing each."},{title:"Fill and seal",body:"Add filling. Layer remaining filo on top. Tuck in edges."},{title:"Bake and dust",body:"Bake at 190°C for 25-30 minutes until golden. Dust heavily with icing sugar and cinnamon.",timer:1800}],
   tip:"Pastilla is the sweet-savoury showpiece of Moroccan cuisine. The icing sugar on the savoury filling sounds unusual but is entirely correct and completely delicious."},
  {id:196,photo:"https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=600&q=80&fit=crop",name:"Chocolate Fondant",emoji:"🍫",xp:100,difficulty:"Hard",time:"30 min",category:"Baking",diets:["Vegetarian"],macros:{calories:440,protein:9,carbs:38,fat:30,fiber:3},done:false,
   ingredients:["200g dark chocolate (70%+)","150g unsalted butter","3 eggs","3 egg yolks","150g caster sugar","60g plain flour","Pinch of salt","Cocoa powder for dusting","Vanilla ice cream to serve"],
   steps:[{title:"Melt and cool",body:"Melt chocolate and butter together. Cool to room temperature."},{title:"Whisk eggs and sugar",body:"Whisk eggs, yolks, and sugar until pale and thick — about 3 minutes with a mixer.",timer:180},{title:"Combine",body:"Fold chocolate into egg mixture. Fold in flour and salt."},{title:"Fill and bake",body:"Pour into buttered, cocoa-dusted ramekins. Bake at 200°C for exactly 12 minutes.",timer:720},{title:"Unmould and serve",body:"Rest 1 minute. Run a knife around edge. Invert onto a plate. Serve immediately with ice cream."}],
   tip:"Timing is everything. 12 minutes produces a liquid centre. 14 minutes and it's set through. Know your oven — do a test fondant before serving to guests."},
  {id:197,photo:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop",name:"Cauliflower Biryani",emoji:"🍚",xp:90,difficulty:"Medium",time:"1 hr",category:"Indian",diets:["Vegetarian","Gluten-free"],macros:{calories:420,protein:12,carbs:62,fat:14,fiber:8},done:false,
   ingredients:["400g basmati rice","1 large head cauliflower, broken into florets","2 onions, thinly sliced","4 cloves garlic","1 tsp ginger","Biryani spice: 2 cardamoms, 4 cloves, 1 cinnamon stick, 2 bay leaves, 1 tsp cumin, 1 tsp coriander, ½ tsp turmeric","150g yoghurt","Saffron in 2 tbsp warm milk","Fresh coriander and mint","3 tbsp ghee"],
   steps:[{title:"Fry the onions",body:"Deep-fry onion slices until golden brown and crispy. These are the garnish and flavouring.",timer:600},{title:"Marinate cauliflower",body:"Toss cauliflower with yoghurt, garlic, ginger, turmeric, and salt. Marinate 30 minutes.",timer:1800},{title:"Parboil rice",body:"Cook rice until 70% done — still chalky in the centre. Drain."},{title:"Layer and steam",body:"In a heavy pot, layer rice and cauliflower alternately. Sprinkle fried onions, saffron milk, mint, and coriander between layers. Seal and cook on very low heat 25 minutes.",timer:1500}],
   tip:"The dum cooking method — sealed and steamed in its own moisture — is what makes biryani unique. The seal traps all the fragrant steam inside."},
  {id:198,photo:"https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&fit=crop",name:"Steak Diane",emoji:"🥩",xp:90,difficulty:"Medium",time:"20 min",category:"Comfort",diets:["Gluten-free"],macros:{calories:520,protein:42,carbs:8,fat:36,fiber:1},done:false,
   ingredients:["4 beef fillet medallions, about 150g each, pounded thin","200g chestnut mushrooms, sliced","2 shallots, finely diced","2 cloves garlic","3 tbsp brandy","200ml beef stock","100ml double cream","2 tbsp Worcestershire sauce","1 tsp Dijon mustard","2 tbsp butter","Fresh parsley"],
   steps:[{title:"Sear the steaks",body:"Season steaks. Sear in very hot butter 2 minutes per side for medium-rare. Rest while making sauce.",timer:240},{title:"Cook mushrooms and shallots",body:"In the same pan, cook mushrooms and shallots until golden.",timer:300},{title:"Flambé",body:"Add brandy carefully. Tilt pan to flambé or ignite with a lighter. Let flames subside."},{title:"Finish the sauce",body:"Add stock, Worcestershire, and mustard. Reduce. Add cream. Simmer until coating consistency."},{title:"Serve",body:"Return steaks to the pan briefly. Plate and pour sauce over. Scatter parsley."}],
   tip:"Steak Diane was a 1950s tableside restaurant dish — the flambé was theatrical. The Worcestershire and brandy are the defining flavours."},
  {id:199,photo:"https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=600&q=80&fit=crop",name:"Fish and Chips",emoji:"🐟",xp:90,difficulty:"Medium",time:"45 min",category:"Comfort",diets:["Dairy-free"],macros:{calories:680,protein:36,carbs:72,fat:30,fiber:4},done:false,
   ingredients:["4 thick cod or haddock fillets","For batter: 250g plain flour, 330ml ice-cold lager beer, 1 tsp baking powder, salt","For chips: 1kg floury potatoes, cut into thick chips","Oil for deep frying","Malt vinegar, salt, mushy peas, tartare sauce to serve"],
   steps:[{title:"Make the chips",body:"Parboil chips in salted water 5 minutes. Drain and dry completely. Fry at 130°C until just cooked but not coloured. Drain.",timer:300},{title:"Make the batter",body:"Mix flour, baking powder, and salt. Whisk in cold lager until a smooth batter forms. Keep cold."},{title:"Fry the chips",body:"Increase oil to 180°C. Fry chips a second time until golden and crispy.",timer:300},{title:"Fry the fish",body:"Dip fish in batter. Fry at 180°C for 6-8 minutes until batter is golden and crispy.",timer:480},{title:"Serve",body:"Drain. Season immediately. Serve with malt vinegar, salt, mushy peas, and tartare sauce."}],
   tip:"The double-frying of chips is the British chip shop secret — the first fry cooks them through, the second crisps them. A single fry produces chips that are crispy outside but undercooked inside."},
  {id:200,photo:"https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&q=80&fit=crop",name:"Pain au Chocolat",emoji:"🍫",xp:150,difficulty:"Hard",time:"2 days",category:"Baking",diets:["Vegetarian"],macros:{calories:380,protein:7,carbs:38,fat:24,fiber:2},done:false,
   ingredients:["500g strong white bread flour","10g instant yeast","10g fine salt","60g caster sugar","350ml cold whole milk","300g cold unsalted butter (for lamination)","Good quality dark chocolate batons or bars cut into rectangles","1 egg beaten for glazing"],
   steps:[{title:"Make the dough",body:"Mix flour, yeast, salt, sugar, and milk into a smooth dough. Chill overnight.",timer:0},{title:"Laminate with butter",body:"Beat cold butter into a flat rectangle. Encase in dough. Fold and roll 3 times (like croissants), chilling 30 minutes between each fold.",timer:5400},{title:"Shape",body:"Roll dough to 3mm. Cut rectangles. Place a chocolate baton at the base of each. Roll tightly."},{title:"Prove",body:"Arrange on baking sheets. Prove at room temperature until doubled and wobbly — about 2-3 hours.",timer:9000},{title:"Glaze and bake",body:"Glaze gently with egg. Bake at 200°C for 15-18 minutes until deeply golden.",timer:1080}],
   tip:"Laminated pastries require cold butter and a cold environment. If the butter breaks through or melts, the layers are lost. Work quickly and chill without hesitation."},
═════════════════════════════════════════ */
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
const LEVELS = BASE_RANKS.map((r,i)=>({level:i+1,title:r.title,icon:"",color:r.color,minXp:r.minDishes*60}));
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
  {id:37,photo:"https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop",name:"Eggs Benedict",emoji:"🥚",xp:90,difficulty:"Hard",time:"30 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:480,protein:22,carbs:28,fat:32,fiber:1},done:false,
   ingredients:["4 large eggs","4 slices Canadian bacon or ham","2 English muffins, split and toasted","For hollandaise: 3 egg yolks, 200g unsalted butter (clarified), 1 tbsp lemon juice, pinch cayenne, salt"],
   steps:[{title:"Make hollandaise",body:"Melt butter and skim foam. In a heatproof bowl over simmering water, whisk yolks with lemon juice until pale and doubled in volume. Off heat, slowly drizzle in warm clarified butter whisking constantly until thick. Season with cayenne and salt."},{title:"Warm the ham",body:"Briefly pan-fry or microwave the Canadian bacon until warmed through. Place on toasted muffin halves."},{title:"Poach the eggs",body:"Bring a wide pan of water to a gentle simmer with a splash of vinegar. Crack each egg into a cup, swirl the water, and slide in. Poach 3 minutes for runny yolks.",timer:180},{title:"Assemble",body:"Egg on ham on muffin. Spoon hollandaise generously over everything. Serve immediately."}],
   tip:"Hollandaise is just patience and gentle heat. If it splits, whisk in an ice cube off the heat to bring it back."},
  {id:38,photo:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&fit=crop",name:"Crepes",emoji:"🥞",xp:55,difficulty:"Medium",time:"25 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:220,protein:7,carbs:30,fat:8,fiber:1},done:false,
   ingredients:["125g plain flour","2 large eggs","300ml whole milk","25g melted butter, plus extra for frying","Pinch of salt","Filling: lemon juice and caster sugar, or Nutella and banana"],
   steps:[{title:"Make the batter",body:"Whisk flour, eggs, milk, melted butter and salt until completely smooth. Rest 30 minutes — this is important.",timer:1800},{title:"Cook the crepes",body:"Heat a crepe pan or non-stick frying pan over medium-high heat. Add a tiny knob of butter. Pour in a small ladle of batter and swirl immediately to coat the pan thinly. Cook 1 minute until edges lift.",timer:60},{title:"Flip",body:"Flip with a spatula or by tossing. Cook 30 more seconds on the other side.",timer:30},{title:"Serve",body:"Fill with your choice: lemon and sugar, Nutella and banana, or smoked salmon and cream cheese for savoury."}],
   tip:"The first crepe is always a test crepe. Don't be disheartened — it calibrates the heat and butter level for the rest."},
  {id:39,photo:"https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80&fit=crop",name:"Smoked Salmon Bagel",emoji:"🥯",xp:25,difficulty:"Easy",time:"5 min",category:"Breakfast",diets:["No restrictions"],macros:{calories:420,protein:24,carbs:48,fat:14,fiber:2},done:false,
   ingredients:["1 sesame or everything bagel","100g smoked salmon","3 tbsp cream cheese","Capers","Red onion, very thinly sliced","Fresh dill","Lemon wedge","Black pepper"],
   steps:[{title:"Toast the bagel",body:"Split and toast the bagel until lightly golden."},{title:"Spread cream cheese",body:"Apply cream cheese generously to both halves."},{title:"Build",body:"Layer smoked salmon, capers, red onion, and dill. Squeeze lemon over everything. Finish with lots of black pepper."}],
   tip:"Everything bagel seasoning on a plain bagel is a great shortcut if you can't find everything bagels."},
  {id:40,photo:"https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=600&q=80&fit=crop",name:"Granola",emoji:"🥣",xp:40,difficulty:"Easy",time:"40 min",category:"Breakfast",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:290,protein:7,carbs:38,fat:13,fiber:4},done:false,
   ingredients:["400g rolled oats","100g mixed nuts (almonds, cashews, pecans), roughly chopped","80ml maple syrup or honey","60ml coconut oil, melted","1 tsp vanilla extract","1 tsp cinnamon","Pinch of salt","100g dried fruit (raisins, cranberries, apricots) — added after baking"],
   steps:[{title:"Preheat",body:"Preheat oven to 160°C. Line a large baking tray with parchment."},{title:"Mix",body:"Combine oats, nuts, maple syrup, coconut oil, vanilla, cinnamon, and salt. Mix thoroughly so everything is coated."},{title:"Spread and bake",body:"Spread evenly across the tray in a single layer. Bake 25-30 minutes, stirring once halfway through, until golden.",timer:1800},{title:"Cool and add fruit",body:"Remove from oven. Don't touch it for 15 minutes — it crisps as it cools. Then stir in the dried fruit.",timer:900}],
   tip:"The secret to clumpy granola is not stirring it while it cools. Let it set into clusters then break apart to your preferred size."},
  {id:41,photo:"https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&q=80&fit=crop",name:"Smoothie Bowl",emoji:"🫐",xp:25,difficulty:"Easy",time:"10 min",category:"Breakfast",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:310,protein:8,carbs:58,fat:7,fiber:9},done:false,
   ingredients:["2 frozen bananas","100g frozen mixed berries","60ml oat milk","Toppings: granola, sliced banana, fresh berries, chia seeds, nut butter, coconut flakes"],
   steps:[{title:"Blend",body:"Blend frozen bananas, berries, and oat milk until thick and smooth. Add the minimum liquid — the bowl should be thick enough to eat with a spoon, not drink through a straw."},{title:"Pour and top",body:"Pour into a bowl immediately. Top with granola, fresh fruit, chia seeds, a swirl of nut butter, and coconut flakes."}],
   tip:"Freeze your bananas when they're overripe — peel them first, then freeze in a bag. They're sweeter and creamier than fresh."},
  {id:42,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Penne Arrabbiata",emoji:"🍝",xp:45,difficulty:"Easy",time:"20 min",category:"Italian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:480,protein:14,carbs:76,fat:14,fiber:5},done:false,
   ingredients:["400g penne","3 tbsp extra-virgin olive oil","4 cloves garlic, thinly sliced","1-2 tsp dried chilli flakes (arrabbiata means angry — it should have heat)","2×400g cans whole tomatoes","Salt","Fresh flat-leaf parsley to serve"],
   steps:[{title:"Start the sauce",body:"Gently fry garlic in olive oil over medium-low heat until pale golden. Add chilli flakes. Stir 30 seconds."},{title:"Add tomatoes",body:"Add tomatoes, breaking them up with a spoon. Season generously. Simmer 15 minutes until thickened and rich.",timer:900},{title:"Cook pasta",body:"Cook penne in heavily salted boiling water until al dente. Reserve a cup of pasta water before draining."},{title:"Combine",body:"Toss drained pasta through the sauce with a splash of pasta water until glossy. Finish with parsley and more olive oil."}],
   tip:"Arrabbiata should be spicy. Taste the sauce before adding pasta — if it doesn't have a kick, add more chilli."},
  {id:43,photo:"https://images.unsplash.com/photo-1551183053-bf91798d792b?w=600&q=80&fit=crop",name:"Gnocchi with Sage Butter",emoji:"🥔",xp:100,difficulty:"Hard",time:"1 hr",category:"Italian",diets:["Vegetarian"],macros:{calories:540,protein:12,carbs:72,fat:24,fiber:4},done:false,
   ingredients:["1kg floury potatoes (Desiree or King Edward)","200g plain flour, plus extra for dusting","1 egg yolk","1 tsp fine salt","For sage butter: 100g unsalted butter, 12 fresh sage leaves, Parmesan to serve"],
   steps:[{title:"Cook and rice potatoes",body:"Bake potatoes whole at 200°C for 1 hour until completely tender. Scoop out flesh while hot and rice or mash until completely smooth — no lumps.",timer:3600},{title:"Make the dough",body:"On a clean surface, mix warm riced potato with flour, egg yolk, and salt. Work quickly — overworking makes tough gnocchi. Stop as soon as a soft dough forms."},{title:"Shape",body:"Roll dough into long ropes about 2cm thick. Cut into 2cm pillows. Roll over a fork for ridges if desired."},{title:"Cook gnocchi",body:"Drop into a large pot of salted boiling water. Cook until they float, then 30 more seconds.",timer:120},{title:"Sage butter",body:"Brown butter in a frying pan until nut-brown. Add sage leaves — they'll crisp in seconds. Toss in cooked gnocchi. Serve with Parmesan."}],
   tip:"Dry potatoes make light gnocchi. Baking instead of boiling removes moisture. Don't add too much flour — the dough should be soft and slightly sticky."},
  {id:44,photo:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80&fit=crop",name:"Osso Buco",emoji:"🍖",xp:140,difficulty:"Hard",time:"2.5 hrs",category:"Italian",diets:["Gluten-free"],macros:{calories:520,protein:42,carbs:18,fat:28,fiber:3},done:false,
   ingredients:["4 veal or beef osso buco (cross-cut shanks, about 300g each)","1 onion, finely diced","2 carrots, finely diced","3 stalks celery, finely diced","4 cloves garlic","200ml dry white wine","400ml beef or veal stock","1×400g can chopped tomatoes","Gremolata: zest of 1 lemon, 1 garlic clove minced, large handful parsley chopped","Olive oil, salt, pepper, plain flour for dusting"],
   steps:[{title:"Sear the shanks",body:"Season shanks, dust with flour. Sear in hot olive oil in a heavy casserole over high heat until deep brown on both sides. Remove and set aside.",timer:480},{title:"Build the soffritto",body:"In the same pan over medium heat, cook onion, carrot, celery for 10 minutes until soft. Add garlic, cook 2 minutes.",timer:720},{title:"Deglaze and braise",body:"Add wine, scrape the bottom. Add stock and tomatoes. Return shanks — they should be half submerged. Cover and cook at 160°C for 1.5-2 hours until meat is falling from the bone.",timer:5400},{title:"Make gremolata",body:"Mix lemon zest, garlic, and parsley together. This is added at the very end."},{title:"Serve",body:"Plate shanks with the braising sauce. Scatter gremolata over the top. Serve with risotto Milanese or polenta."}],
   tip:"The gremolata is not optional — it brightens and cuts through the rich braised meat. Add it at the last moment, never cook it."},
  {id:45,photo:"https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80&fit=crop",name:"Korean Bibimbap",emoji:"🍚",xp:110,difficulty:"Medium",time:"45 min",category:"Asian",diets:["Vegetarian","Gluten-free"],macros:{calories:520,protein:18,carbs:72,fat:18,fiber:8},done:false,
   ingredients:["300g short-grain rice, cooked","2 eggs","1 zucchini, julienned","1 carrot, julienned","200g spinach, blanched and squeezed dry","100g bean sprouts, blanched","4 dried shiitake mushrooms, rehydrated and sliced","For the sauce: 4 tbsp gochujang, 2 tbsp sesame oil, 1 tbsp soy sauce, 1 tbsp rice vinegar, 1 tsp sugar, 2 cloves garlic","Sesame oil and toasted sesame seeds"],
   steps:[{title:"Make bibimbap sauce",body:"Whisk gochujang, sesame oil, soy sauce, rice vinegar, sugar, and garlic until smooth. Taste — it should be spicy, savoury, and slightly tangy."},{title:"Prepare vegetables",body:"Season each vegetable separately with salt and a little sesame oil. Sauté zucchini, carrot, and mushrooms individually in a hot pan until just cooked."},{title:"Fry the egg",body:"Fry an egg sunny-side-up in a hot pan with a little oil — the yolk should be runny.",timer:120},{title:"Assemble",body:"Serve rice in a wide bowl. Arrange each vegetable in a separate section around the bowl. Place the egg on top. Serve the bibimbap sauce on the side."},{title:"Mix at the table",body:"Add sauce to taste, mix everything together with a spoon. The runny egg yolk coats the rice — this is the whole point."}],
   tip:"The word 'bibimbap' means 'mixed rice'. Mix it vigorously at the table — it shouldn't be neat. The more you mix, the better it gets."},
  {id:46,photo:"https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80&fit=crop",name:"Japchae",emoji:"🍜",xp:85,difficulty:"Medium",time:"35 min",category:"Asian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:380,protein:8,carbs:62,fat:12,fiber:4},done:false,
   ingredients:["200g sweet potato glass noodles (dangmyeon)","200g spinach","1 carrot, julienned","1 onion, thinly sliced","3 shiitake mushrooms, sliced","3 cloves garlic","Sauce: 3 tbsp soy sauce, 1 tbsp sesame oil, 1 tbsp sugar, 1 tsp toasted sesame seeds","2 tbsp neutral oil"],
   steps:[{title:"Cook noodles",body:"Soak glass noodles in hot water 20 minutes, then boil 5 minutes until translucent and chewy. Drain and cut into shorter lengths. Toss with soy sauce and sesame oil.",timer:1500},{title:"Blanch spinach",body:"Blanch spinach in boiling water for 30 seconds. Drain, squeeze out all water, season with soy sauce and sesame oil."},{title:"Stir-fry vegetables",body:"Stir-fry carrot, onion, and mushrooms separately over high heat until tender-crisp. Season each with a little salt and garlic."},{title:"Combine and season",body:"In a large bowl, mix noodles, spinach, and all vegetables together. Add remaining sauce and sesame seeds. Toss well. Taste and adjust seasoning."}],
   tip:"Cook each component separately before combining — it keeps the colours vibrant and textures distinct."},
  {id:47,photo:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80&fit=crop",name:"Vietnamese Pho",emoji:"🍜",xp:130,difficulty:"Hard",time:"3 hrs",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:380,protein:28,carbs:42,fat:8,fiber:3},done:false,
   ingredients:["For broth: 1.5kg beef bones, 1 large onion (charred), 5cm ginger (charred), 3 star anise, 4 cloves, 1 cinnamon stick, 1 tsp coriander seeds, fish sauce, salt","For serving: 200g flat rice noodles, 200g beef sirloin (very thinly sliced), bean sprouts, fresh basil, lime, sliced chillies, hoisin sauce"],
   steps:[{title:"Char the aromatics",body:"Char the onion and ginger directly over a gas flame or under the broiler until blackened on all sides. This creates the distinctive smoky-sweet pho flavour."},{title:"Parboil the bones",body:"Cover bones with cold water, bring to a boil for 10 minutes. Drain and rinse — this removes impurities for a clear broth.",timer:600},{title:"Simmer the broth",body:"Toast spices in a dry pan. Add bones, charred aromatics, and toasted spices to a large pot. Cover with cold water, bring to a boil, then simmer very gently for 2-3 hours.",timer:7200},{title:"Season the broth",body:"Strain the broth. Season generously with fish sauce and salt. It should be complex, deeply savoury, and aromatic."},{title:"Assemble",body:"Cook noodles per packet. Ladle hot broth into bowls over noodles. Add raw beef slices — the hot broth cooks them instantly. Serve with all accompaniments on the side."}],
   tip:"The quality of pho is entirely in the broth. Don't rush it. A clear, golden, intensely flavoured broth is the goal — keep the heat very low throughout."},
  {id:48,photo:"https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80&fit=crop",name:"Kung Pao Chicken",emoji:"🐔",xp:85,difficulty:"Medium",time:"25 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:380,protein:32,carbs:18,fat:22,fiber:3},done:false,
   ingredients:["500g chicken breast, cut into 2cm cubes","50g roasted peanuts","8-10 dried red chillies, snipped","3 cloves garlic, minced","1 tsp fresh ginger, minced","3 spring onions, sliced","Sauce: 2 tbsp soy sauce, 1 tbsp Shaoxing rice wine, 1 tbsp rice vinegar, 1 tsp dark soy sauce, 1 tsp sugar, 1 tsp cornstarch mixed with 2 tbsp water","Marinade: 1 tbsp soy sauce, 1 tsp cornstarch, 1 tsp Shaoxing wine"],
   steps:[{title:"Marinate chicken",body:"Toss chicken in marinade. Rest 15 minutes.",timer:900},{title:"Mix the sauce",body:"Whisk together all sauce ingredients in a small bowl. Set aside."},{title:"Fry chillies and Sichuan pepper",body:"Heat wok over highest heat. Add oil, then dried chillies. Fry 30 seconds until darkened and fragrant — the oil should turn red."},{title:"Stir-fry chicken",body:"Add marinated chicken. Stir-fry over highest heat until cooked through and slightly charred.",timer:300},{title:"Add aromatics and sauce",body:"Add garlic, ginger, and spring onions. Stir 30 seconds. Pour in sauce. Toss until everything is coated and sauce has thickened."},{title:"Add peanuts",body:"Toss in roasted peanuts right at the end so they stay crunchy. Serve over steamed rice."}],
   tip:"High heat is everything. You need the wok screaming hot for proper wok hei — that slightly smoky flavour that defines good Chinese stir-fry."},
  {id:49,photo:"https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80&fit=crop",name:"Gyoza",emoji:"🥟",xp:105,difficulty:"Medium",time:"1 hr",category:"Japanese",diets:["Dairy-free"],macros:{calories:320,protein:16,carbs:38,fat:12,fiber:3},done:false,
   ingredients:["300g ground pork","200g napa cabbage, very finely shredded and salted","3 cloves garlic, minced","1 tsp fresh ginger, minced","2 tbsp soy sauce","1 tbsp sesame oil","1 tsp white pepper","30 gyoza wrappers","Dipping sauce: soy sauce, rice vinegar, chilli oil"],
   steps:[{title:"Prepare the cabbage",body:"Salt the shredded cabbage and let sit 10 minutes. Squeeze out every drop of moisture with your hands — this is critical to prevent watery filling."},{title:"Mix the filling",body:"Combine pork, squeezed cabbage, garlic, ginger, soy sauce, sesame oil, and white pepper. Mix vigorously in one direction for 2 minutes until the filling becomes sticky."},{title:"Fold the gyoza",body:"Place a teaspoon of filling in the centre of each wrapper. Wet the edges, fold in half, and crimp one side into pleats against the flat side. The classic gyoza has 7 pleats."},{title:"Fry and steam",body:"Heat oil in a frying pan over medium-high heat. Add gyoza flat-side down. Fry 2-3 minutes until the bottoms are golden. Add 100ml water, cover immediately. Steam 3-4 minutes.",timer:360},{title:"Serve",body:"Remove the lid, let any water evaporate. Serve with dipping sauce — soy sauce, rice vinegar, and a few drops of chilli oil."}],
   tip:"The pleated side faces you; the flat side gets the crust. Perfect gyoza have a crispy bottom and a soft steamed top — this is achieved by the fry-steam-fry technique."},
  {id:50,photo:"https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop",name:"Tonkatsu",emoji:"🐷",xp:75,difficulty:"Medium",time:"25 min",category:"Japanese",diets:["Dairy-free"],macros:{calories:560,protein:38,carbs:42,fat:28,fiber:2},done:false,
   ingredients:["2 pork loin chops, about 2cm thick","50g plain flour","2 eggs, beaten","100g panko breadcrumbs","Neutral oil for frying","Tonkatsu sauce (store-bought) or make: 3 tbsp Worcestershire sauce, 2 tbsp ketchup, 1 tbsp soy sauce","White cabbage, finely shredded, to serve"],
   steps:[{title:"Prepare the pork",body:"Score the fat around the edge of each chop at 2cm intervals — this prevents them curling during frying. Season with salt and pepper."},{title:"Bread the cutlets",body:"Dust in flour, dip in beaten egg, then press firmly into panko breadcrumbs until evenly coated."},{title:"Fry",body:"Fill a pan with 2cm of neutral oil. Heat to 170°C. Fry cutlets 3-4 minutes per side until deeply golden and internal temperature reaches 65°C.",timer:480},{title:"Rest and slice",body:"Rest on a rack for 3 minutes. Slice into 2cm strips using a sharp knife in a single clean motion.",timer:180},{title:"Serve",body:"Plate over shredded white cabbage. Drizzle tonkatsu sauce over the top. Serve with steamed rice and miso soup."}],
   tip:"Panko breadcrumbs are non-negotiable — they create a lighter, crunchier coating than regular breadcrumbs. Press them firmly into the meat so they adhere."},
  {id:51,photo:"https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80&fit=crop",name:"Teriyaki Chicken",emoji:"🍗",xp:55,difficulty:"Easy",time:"20 min",category:"Japanese",diets:["Gluten-free","Dairy-free"],macros:{calories:380,protein:36,carbs:22,fat:16,fiber:1},done:false,
   ingredients:["4 chicken thighs, boneless and skin-on","Teriyaki sauce: 4 tbsp soy sauce, 2 tbsp mirin, 2 tbsp sake, 1 tbsp sugar","Sesame seeds and spring onions to serve","Steamed rice"],
   steps:[{title:"Score the chicken",body:"Score the skin deeply — this allows fat to render and sauce to penetrate. Pat completely dry."},{title:"Make the sauce",body:"Combine soy sauce, mirin, sake, and sugar. Stir to dissolve sugar."},{title:"Pan-fry skin-side down",body:"Place chicken skin-side down in a cold non-stick pan. Turn heat to medium. Cook 8-10 minutes until skin is deeply golden and most of the fat has rendered. Flip and cook 3-4 minutes more.",timer:780},{title:"Add the sauce",body:"Pour in the teriyaki sauce. It will bubble vigorously. Reduce heat and coat the chicken, turning regularly, until the sauce reduces to a glaze — about 2 minutes.",timer:120},{title:"Rest and serve",body:"Rest 3 minutes. Slice and plate over rice. Spoon remaining glaze over the top. Scatter sesame seeds and spring onions.",timer:180}],
   tip:"Starting skin-side down in a cold pan lets the fat render slowly, producing crispy skin without burning."},
  {id:52,photo:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&fit=crop",name:"Saag Paneer",emoji:"🥬",xp:80,difficulty:"Medium",time:"35 min",category:"Indian",diets:["Vegetarian","Gluten-free"],macros:{calories:380,protein:18,carbs:16,fat:26,fiber:6},done:false,
   ingredients:["400g paneer, cut into 2cm cubes","500g fresh spinach (or frozen, thawed and squeezed)","1 large onion, finely diced","4 cloves garlic","2 tsp fresh ginger","2 green chillies","1 tsp cumin seeds","1 tsp turmeric","1 tsp garam masala","3 tbsp neutral oil","100ml double cream or yoghurt","Salt"],
   steps:[{title:"Fry the paneer",body:"Pan-fry paneer cubes in oil until golden on all sides. Remove and set aside."},{title:"Cook aromatics",body:"In the same pan, add cumin seeds — let them splutter. Add onion, cook 10 minutes until golden. Add garlic, ginger, and green chillies.",timer:600},{title:"Add spices and spinach",body:"Add turmeric. Stir 1 minute. Add spinach and cook until wilted. Add a splash of water, cover and cook 5 minutes.",timer:300},{title:"Blend (optional)",body:"For smooth saag, blend half or all of the spinach mixture. For chunky, leave as is."},{title:"Finish",body:"Return paneer to the pan. Stir in cream or yoghurt and garam masala. Simmer gently 5 minutes. Season and serve with naan."}],
   tip:"Frying the paneer before adding to the curry gives it a golden crust and firmer texture that holds up better in the sauce."},
  {id:53,photo:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80&fit=crop",name:"Aloo Gobi",emoji:"🥔",xp:60,difficulty:"Easy",time:"35 min",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:280,protein:8,carbs:42,fat:10,fiber:8},done:false,
   ingredients:["400g potatoes, peeled and cut into 3cm chunks","1 head cauliflower, broken into florets","1 onion, sliced","4 cloves garlic","1 tsp fresh ginger","2 tsp cumin seeds","1 tsp turmeric","1 tsp coriander","1 tsp garam masala","3 tbsp neutral oil","Fresh coriander, lemon to serve"],
   steps:[{title:"Fry aromatics",body:"Heat oil over medium heat. Add cumin seeds until they splutter. Add onion, cook 8 minutes until golden. Add garlic and ginger.",timer:480},{title:"Add spices and potatoes",body:"Add turmeric and coriander. Stir 1 minute. Add potatoes and stir to coat in spices."},{title:"Add cauliflower",body:"Add cauliflower. Add 100ml water, cover and cook on medium-low for 20 minutes, stirring occasionally, until both vegetables are completely tender.",timer:1200},{title:"Finish",body:"Add garam masala. Taste and adjust salt. Finish with lemon juice and coriander. Serve with roti or rice."}],
   tip:"Don't add too much water — this dish should be dry, not soupy. The vegetables should steam and absorb the spices rather than boil in liquid."},
  {id:54,photo:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80&fit=crop",name:"Dal Makhani",emoji:"🫘",xp:90,difficulty:"Medium",time:"1.5 hrs",category:"Indian",diets:["Vegetarian","Gluten-free"],macros:{calories:420,protein:18,carbs:48,fat:18,fiber:12},done:false,
   ingredients:["200g whole black lentils (urad dal), soaked overnight","50g kidney beans, soaked overnight","1 large onion, finely diced","5 cloves garlic","2 tsp fresh ginger","2×400g cans chopped tomatoes","3 tbsp butter or ghee","150ml double cream","1 tsp cumin seeds","2 tsp garam masala","1 tsp smoked paprika","Salt"],
   steps:[{title:"Cook the lentils",body:"Pressure cook or boil soaked lentils and kidney beans with salt until completely soft — about 45 minutes to 1 hour on the stovetop.",timer:2700},{title:"Make the base",body:"Fry cumin seeds in butter until they splutter. Add onion, cook 12 minutes until deeply golden. Add garlic and ginger.",timer:720},{title:"Add tomatoes",body:"Add chopped tomatoes. Cook 15 minutes until oil separates.",timer:900},{title:"Combine and simmer",body:"Add cooked lentils to the tomato base. Add 200ml water. Simmer uncovered on very low heat for 30 minutes, stirring occasionally.",timer:1800},{title:"Finish",body:"Stir in cream, garam masala, and smoked paprika. Simmer 10 more minutes. Top with a knob of butter. Serve with naan."}],
   tip:"Dal makhani improves dramatically overnight — the spices deepen and the texture becomes richer. Make it the day before if you can."},
  {id:55,photo:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop",name:"Chicken Enchiladas",emoji:"🌮",xp:90,difficulty:"Medium",time:"50 min",category:"Mexican",diets:["No restrictions"],macros:{calories:520,protein:34,carbs:48,fat:22,fiber:6},done:false,
   ingredients:["500g chicken breast, cooked and shredded","8 medium flour tortillas","400ml enchilada sauce (store-bought or homemade)","200g cheddar or Monterey Jack, grated","1 onion, diced and sautéed","1 can black beans, drained","1 tsp cumin","Sour cream, avocado, coriander to serve"],
   steps:[{title:"Prepare the filling",body:"Mix shredded chicken with sautéed onion, black beans, cumin, half the enchilada sauce, and half the cheese."},{title:"Fill the tortillas",body:"Spread a spoonful of enchilada sauce across the base of a baking dish. Fill each tortilla with chicken mixture, roll tightly, and place seam-down in the dish."},{title:"Top and bake",body:"Pour remaining enchilada sauce over the top. Cover completely with remaining cheese. Bake at 190°C for 20-25 minutes until bubbling and golden.",timer:1500},{title:"Serve",body:"Top with sour cream, avocado, and fresh coriander. Serve directly from the dish."}],
   tip:"The key to good enchiladas is rolling them tightly and packing them close together in the dish so they hold their shape during baking."},
  {id:56,photo:"https://images.unsplash.com/photo-1549208886-02acfa609dea?w=600&q=80&fit=crop",name:"Guacamole",emoji:"🥑",xp:20,difficulty:"Easy",time:"10 min",category:"Mexican",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:160,protein:2,carbs:10,fat:14,fiber:6},done:false,
   ingredients:["3 ripe avocados","1 lime, juiced","1 small white onion, very finely diced","1-2 jalapeños, seeds removed, very finely diced","Large handful fresh coriander, chopped","1 small tomato, deseeded and finely diced","Salt"],
   steps:[{title:"Check the avocados",body:"Avocados must be properly ripe — soft when gently pressed. A hard avocado makes inferior guacamole."},{title:"Mash coarsely",body:"Halve and stone avocados. Scoop flesh into a bowl. Add lime juice immediately. Mash with a fork to a chunky texture — never smooth."},{title:"Add the flavourings",body:"Fold in onion, jalapeño, coriander, and tomato. Season generously with salt. Taste — it should be bright, salty, and slightly spicy."},{title:"Serve immediately",body:"Serve at once with tortilla chips or alongside tacos. If storing, press clingfilm directly onto the surface to prevent browning."}],
   tip:"Chunky guacamole is better than smooth. The lime juice does two things: brightens the flavour and prevents oxidation. Don't be shy with it."},
  {id:57,photo:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80&fit=crop",name:"Salsa Verde",emoji:"🌿",xp:25,difficulty:"Easy",time:"15 min",category:"Mexican",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:80,protein:2,carbs:12,fat:3,fiber:4},done:false,
   ingredients:["500g tomatillos, husked and halved","3 jalapeños","1 small white onion, quartered","4 cloves garlic","Large handful fresh coriander","Juice of 1 lime","Salt"],
   steps:[{title:"Char the vegetables",body:"Place tomatillos, jalapeños, onion, and garlic on a baking tray. Broil under high heat for 5-7 minutes until charred and blistered.",timer:420},{title:"Blend",body:"Transfer to a blender. Add coriander and lime juice. Blend to your preferred consistency — completely smooth or slightly chunky."},{title:"Season",body:"Taste and season with salt. If too thick, add a splash of water. If too mild, add another jalapeño."}],
   tip:"Charring the tomatillos and jalapeños under the broiler adds a smoky depth that makes this salsa far more complex than the raw version."},
  {id:58,photo:"https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80&fit=crop",name:"Greek Salad",emoji:"🫒",xp:25,difficulty:"Easy",time:"10 min",category:"Mediterranean",diets:["Vegetarian","Gluten-free"],macros:{calories:280,protein:10,carbs:12,fat:22,fiber:4},done:false,
   ingredients:["4 large ripe tomatoes, cut into wedges","1 cucumber, cut into half-moons","1 green bell pepper, sliced","1 red onion, thinly sliced","200g good-quality feta (block, not crumbled)","80g kalamata olives","4 tbsp extra-virgin olive oil","1 tsp dried oregano","Salt and pepper"],
   steps:[{title:"Prepare the vegetables",body:"Cut all vegetables and arrange in a wide shallow bowl — don't toss, just layer."},{title:"Add the feta",body:"Place the block of feta on top — do not crumble it. Greeks serve it as a whole slab."},{title:"Dress",body:"Pour olive oil generously over everything. Scatter olives. Season with dried oregano, salt, and pepper."}],
   tip:"Use a block of feta in brine, not pre-crumbled. Break it with your fork at the table. The quality of olive oil and feta is everything in this dish."},
  {id:59,photo:"https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=600&q=80&fit=crop",name:"Shakshuka with Merguez",emoji:"🍳",xp:80,difficulty:"Medium",time:"30 min",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:420,protein:26,carbs:22,fat:26,fiber:5},done:false,
   ingredients:["200g merguez sausages, sliced","6 eggs","2×400g cans chopped tomatoes","1 red onion, diced","4 cloves garlic","2 roasted red peppers from a jar, sliced","2 tsp smoked paprika","1 tsp ground cumin","1 tsp harissa","3 tbsp olive oil","Fresh parsley and crusty bread to serve"],
   steps:[{title:"Fry the merguez",body:"Brown the merguez slices in olive oil until caramelised. Remove and set aside."},{title:"Build the sauce",body:"Cook onion in the same pan 8 minutes. Add garlic, smoked paprika, cumin, and harissa. Add tomatoes and roasted peppers. Simmer 10 minutes.",timer:480},{title:"Add eggs",body:"Return merguez to the pan. Make 6 wells, crack eggs in. Cover and cook 5-8 minutes to your preference.",timer:360},{title:"Serve",body:"Scatter parsley over the top. Bring the pan to the table and serve with crusty bread."}],
   tip:"Merguez sausage adds a spicy, deeply savoury base that transforms the shakshuka from a vegetable dish into a proper main."},
  {id:60,photo:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80&fit=crop",name:"Falafel",emoji:"🧆",xp:80,difficulty:"Medium",time:"45 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:340,protein:14,carbs:38,fat:16,fiber:10},done:false,
   ingredients:["400g dried chickpeas, soaked overnight (NOT canned)","1 small onion, roughly chopped","4 cloves garlic","Large bunch fresh parsley","Large bunch fresh coriander","2 tsp cumin","1 tsp coriander","1 tsp baking powder","1 tsp salt","Oil for frying"],
   steps:[{title:"Blend the mixture",body:"Drain soaked chickpeas (raw, not cooked). Blend with onion, garlic, herbs, spices, and salt until it resembles fine breadcrumbs — not smooth. Add baking powder and mix."},{title:"Rest in the fridge",body:"Refrigerate the mixture 30 minutes — this makes shaping easier and helps them hold together.",timer:1800},{title:"Shape",body:"Shape into small balls or flat discs. If the mixture doesn't hold together, add a tablespoon of flour."},{title:"Fry",body:"Heat oil to 180°C. Fry in batches 3-4 minutes until deep golden brown all over. Don't crowd the pan.",timer:240},{title:"Serve",body:"Serve in warm pita with hummus, cucumber, tomato, pickles, and tahini."}],
   tip:"Dried chickpeas only — canned chickpeas are too wet and will cause falafel to fall apart. The raw dried chickpea, soaked but not cooked, is what holds the falafel together."},
  {id:61,photo:"https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&fit=crop",name:"BBQ Ribs",emoji:"🍖",xp:130,difficulty:"Hard",time:"4 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:680,protein:48,carbs:22,fat:44,fiber:1},done:false,
   ingredients:["1.5kg pork spare ribs or baby back ribs","Dry rub: 3 tbsp brown sugar, 2 tbsp smoked paprika, 1 tbsp garlic powder, 1 tbsp onion powder, 1 tsp cumin, 1 tsp black pepper, 1 tsp salt, ½ tsp cayenne","300ml BBQ sauce"],
   steps:[{title:"Apply the rub",body:"Mix all dry rub ingredients. Remove the membrane from the back of the ribs. Apply rub generously on all sides. Wrap tightly in foil. Refrigerate at least 1 hour, ideally overnight.",timer:3600},{title:"Low and slow in the oven",body:"Bake wrapped ribs at 150°C for 2.5-3 hours until the meat has pulled back from the bone tips.",timer:9000},{title:"Glaze on the grill",body:"Unwrap ribs. Brush generously with BBQ sauce. Grill or broil at high heat 5-8 minutes per side until the sauce caramelises and chars at the edges.",timer:480},{title:"Rest and serve",body:"Rest 10 minutes. Cut between each rib. Serve with more BBQ sauce, coleslaw, and corn.",timer:600}],
   tip:"Low and slow is the law. Rushing ribs produces tough meat. The 3-hour oven cook does the work — the grill just adds the finish."},
  {id:62,photo:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80&fit=crop",name:"Mac and Cheese",emoji:"🧀",xp:65,difficulty:"Medium",time:"35 min",category:"Comfort",diets:["Vegetarian"],macros:{calories:620,protein:24,carbs:62,fat:32,fiber:2},done:false,
   ingredients:["400g macaroni or cavatappi","50g unsalted butter","50g plain flour","600ml whole milk","200g mature cheddar, grated","100g Gruyère, grated","1 tsp Dijon mustard","Pinch of cayenne","Salt and pepper","For the topping: 50g breadcrumbs, 30g Parmesan, 2 tbsp melted butter"],
   steps:[{title:"Cook the pasta",body:"Cook pasta in salted water until just under al dente — it will cook more in the oven. Drain."},{title:"Make the béchamel",body:"Melt butter over medium heat. Add flour and stir constantly for 2 minutes to cook out the raw flour taste. Gradually add milk, whisking constantly until smooth and thickened.",timer:300},{title:"Add the cheese",body:"Remove from heat. Add cheddar and Gruyère, stirring until melted. Add mustard and cayenne. Season well."},{title:"Combine and bake",body:"Mix pasta through the cheese sauce. Pour into a baking dish. Top with breadcrumb mixture. Bake at 190°C for 20 minutes until golden and bubbling.",timer:1200}],
   tip:"Take the sauce off the heat before adding cheese — overheated cheese turns grainy and the sauce splits. Off the heat, it melts into a silky, smooth sauce."},
  {id:63,photo:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&fit=crop",name:"Classic Beef Chilli",emoji:"🌶️",xp:80,difficulty:"Easy",time:"1 hr",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:480,protein:32,carbs:38,fat:22,fiber:12},done:false,
   ingredients:["500g ground beef","2 cans kidney beans, drained","1×400g can chopped tomatoes","1 large onion, diced","4 cloves garlic","2 tbsp tomato paste","2 tsp ground cumin","2 tsp smoked paprika","1-2 tsp chilli powder","1 tsp oregano","300ml beef stock","3 tbsp oil","Salt","To serve: sour cream, cheddar, jalapeños, tortilla chips"],
   steps:[{title:"Brown the beef",body:"Cook beef over high heat, breaking it up, until deeply browned — not grey. This is the flavour base of the chilli.",timer:480},{title:"Add aromatics",body:"Add onion. Cook 6 minutes. Add garlic, all spices, and tomato paste. Stir 2 minutes."},{title:"Add liquid and beans",body:"Add chopped tomatoes and beef stock. Bring to a boil."},{title:"Simmer",body:"Add kidney beans. Reduce heat to low. Simmer uncovered 40 minutes, stirring occasionally, until thick and rich.",timer:2400},{title:"Serve",body:"Top with sour cream, grated cheddar, jalapeños, and serve with tortilla chips or cornbread."}],
   tip:"Chilli improves dramatically the next day. The spices deepen and the beans absorb the sauce. Make it ahead whenever you can."},
  {id:64,photo:"https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=600&q=80&fit=crop",name:"Shepherd's Pie",emoji:"🥧",xp:100,difficulty:"Medium",time:"1.5 hrs",category:"Comfort",diets:["Gluten-free"],macros:{calories:520,protein:28,carbs:48,fat:24,fiber:6},done:false,
   ingredients:["500g ground lamb (shepherd's) or beef (cottage pie)","1kg floury potatoes, peeled and cubed","1 large onion, diced","2 carrots, diced","2 stalks celery, diced","3 cloves garlic","2 tbsp tomato paste","200ml red wine","400ml lamb or beef stock","1 tsp Worcestershire sauce","Fresh thyme and rosemary","50g butter","100ml milk","Salt and pepper"],
   steps:[{title:"Brown the meat",body:"Cook lamb in a heavy casserole over high heat until deeply browned. Remove, leaving fat in the pan.",timer:480},{title:"Cook the vegetables",body:"Cook onion, carrot, and celery in the same pan for 8 minutes. Add garlic, tomato paste, and herbs.",timer:480},{title:"Build the sauce",body:"Return meat. Add wine, reduce. Add stock and Worcestershire. Simmer 30 minutes until thickened.",timer:1800},{title:"Make the mash",body:"Boil potatoes until tender. Drain well. Mash with butter and warm milk until smooth. Season generously."},{title:"Assemble and bake",body:"Pour filling into a baking dish. Top with mash, spreading to the edges and roughing up the surface with a fork. Bake at 200°C for 25-30 minutes until the top is golden.",timer:1800}],
   tip:"Rough up the mash topping with a fork before baking — the peaks catch the heat and become beautifully golden and slightly crispy."},
  {id:65,photo:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&fit=crop",name:"Quinoa Salad",emoji:"🥗",xp:35,difficulty:"Easy",time:"20 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:320,protein:12,carbs:44,fat:12,fiber:8},done:false,
   ingredients:["200g quinoa, rinsed","1 cucumber, diced","1 cup cherry tomatoes, halved","1 red onion, finely diced","Large handful fresh parsley","Large handful fresh mint","100g chickpeas, drained","Dressing: 3 tbsp olive oil, juice of 1.5 lemons, 1 tsp cumin, salt and pepper"],
   steps:[{title:"Cook quinoa",body:"Bring quinoa and 400ml salted water to a boil. Cover, reduce to lowest heat, cook 15 minutes. Remove from heat, steam covered 5 more minutes.",timer:1200},{title:"Make dressing",body:"Whisk olive oil, lemon juice, cumin, salt, and pepper."},{title:"Assemble",body:"Fluff cooled quinoa with a fork. Combine with all vegetables and herbs. Pour over dressing and toss well. Taste and adjust seasoning — it will need more salt and lemon than you expect."}],
   tip:"Let the quinoa cool completely before dressing — warm quinoa turns soggy. The salad improves over an hour as the flavours develop."},
  {id:66,photo:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&fit=crop",name:"Minestrone",emoji:"🍲",xp:55,difficulty:"Easy",time:"45 min",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:260,protein:10,carbs:42,fat:6,fiber:10},done:false,
   ingredients:["2 carrots, diced","3 stalks celery, diced","1 onion, diced","2 zucchini, diced","400g can chopped tomatoes","400g can cannellini beans","1.5L vegetable stock","100g small pasta (ditalini or broken spaghetti)","3 cloves garlic","2 tbsp olive oil","1 tsp dried oregano","1 tsp dried basil","Parmesan rind (optional but excellent)","Fresh basil and Parmesan to serve"],
   steps:[{title:"Sweat aromatics",body:"Cook onion, carrot, and celery in olive oil for 10 minutes until soft. Add garlic and dried herbs.",timer:600},{title:"Add vegetables and tomatoes",body:"Add zucchini, tomatoes, stock, and Parmesan rind if using. Bring to a boil, reduce and simmer 15 minutes.",timer:900},{title:"Add pasta and beans",body:"Add pasta and cannellini beans. Cook 10 more minutes until pasta is al dente.",timer:600},{title:"Serve",body:"Remove Parmesan rind. Season generously. Ladle into bowls. Finish with fresh basil, a drizzle of olive oil, and grated Parmesan."}],
   tip:"A Parmesan rind dropped into the broth adds a deep umami richness that you cannot get any other way. Save them in the freezer whenever you finish a block."},
  {id:67,photo:"https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&fit=crop",name:"Lentil Soup",emoji:"🥣",xp:40,difficulty:"Easy",time:"30 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:280,protein:16,carbs:42,fat:6,fiber:14},done:false,
   ingredients:["300g red lentils","1 large onion, diced","3 carrots, diced","4 cloves garlic","1.5L vegetable stock","1×400g can chopped tomatoes","2 tsp cumin","1 tsp turmeric","1 tsp smoked paprika","Juice of 1 lemon","3 tbsp olive oil","Fresh parsley"],
   steps:[{title:"Cook aromatics",body:"Cook onion and carrot in olive oil for 8 minutes. Add garlic, cumin, turmeric, and paprika. Stir 1 minute.",timer:480},{title:"Add lentils and stock",body:"Add rinsed lentils, chopped tomatoes, and stock. Bring to a boil."},{title:"Simmer",body:"Reduce to a simmer. Cook 20 minutes until lentils are completely soft and beginning to dissolve.",timer:1200},{title:"Finish",body:"Squeeze in lemon juice. Taste — season generously. Add fresh parsley. Serve with crusty bread."}],
   tip:"Red lentils dissolve as they cook, creating a naturally thick, creamy soup without any blending. The lemon added at the end is essential — it lifts and brightens the whole pot."},
  {id:68,photo:"https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600&q=80&fit=crop",name:"Tabbouleh",emoji:"🌿",xp:30,difficulty:"Easy",time:"20 min",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:180,protein:5,carbs:24,fat:8,fiber:5},done:false,
   ingredients:["80g fine bulgur wheat","Large bunch fresh flat-leaf parsley (about 100g leaves), very finely chopped","Large bunch fresh mint, finely chopped","3 ripe tomatoes, deseeded and very finely diced","4 spring onions, very finely sliced","Juice of 2 lemons","4 tbsp good extra-virgin olive oil","Salt"],
   steps:[{title:"Soak the bulgur",body:"Pour just enough boiling water over the bulgur to cover. Let absorb 10 minutes until tender. Drain any excess. Cool completely.",timer:600},{title:"Prepare the herbs",body:"Tabbouleh is a herb salad, not a grain salad. Chop parsley and mint very finely — this takes time but defines the dish."},{title:"Combine and dress",body:"Mix everything together. Dress with lemon juice and olive oil. Season generously. Taste — it should be very lemony and bright."},{title:"Rest",body:"Let the salad sit 15 minutes before serving so the bulgur absorbs the dressing.",timer:900}],
   tip:"The parsley is the hero, not the bulgur. A proper Lebanese tabbouleh is mostly herb with a small amount of grain — not the other way around."},
  {id:69,photo:"https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80&fit=crop",name:"Roasted Tomato Soup",emoji:"🍅",xp:50,difficulty:"Easy",time:"50 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:200,protein:5,carbs:26,fat:10,fiber:5},done:false,
   ingredients:["1kg ripe tomatoes, halved","1 large onion, quartered","8 cloves garlic, unpeeled","4 tbsp olive oil","500ml vegetable stock","1 tsp sugar","Fresh basil","Salt and pepper","Optional: dollop of cream to serve"],
   steps:[{title:"Roast the vegetables",body:"Place tomatoes, onion, and unpeeled garlic on a large tray. Drizzle generously with olive oil, season with salt, pepper, and sugar. Roast at 200°C for 35 minutes until caramelised.",timer:2100},{title:"Blend",body:"Squeeze garlic from skins. Transfer everything including all the roasting juices to a blender. Add stock. Blend until smooth."},{title:"Season and serve",body:"Pass through a sieve if you want a smooth soup. Heat through, taste, and adjust seasoning. Serve with a swirl of cream and fresh basil and crusty bread."}],
   tip:"Roasting the tomatoes is the entire point — it concentrates their sweetness and adds caramelised depth that no amount of cooking on the stovetop can replicate."},
  {id:70,photo:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80&fit=crop",name:"Chicken Noodle Soup",emoji:"🍜",xp:60,difficulty:"Easy",time:"1 hr",category:"Healthy",diets:["Dairy-free"],macros:{calories:320,protein:28,carbs:30,fat:8,fiber:3},done:false,
   ingredients:["1 whole chicken (1.5kg) or 4 chicken thighs","2 carrots, sliced","3 stalks celery, sliced","1 large onion, halved","4 cloves garlic","1 bay leaf","Fresh thyme","200g egg noodles or pasta","Salt and pepper","Fresh parsley"],
   steps:[{title:"Make the broth",body:"Place chicken, onion halves, celery tops, garlic, bay leaf, and thyme in a large pot. Cover with cold water. Bring to a boil, skim the foam, reduce to a gentle simmer. Cook 45 minutes.",timer:2700},{title:"Remove chicken",body:"Remove chicken. Strain the broth into a clean pot — discard vegetables. Shred the chicken meat, discarding skin and bones."},{title:"Build the soup",body:"Return broth to a boil. Add sliced carrot and celery. Cook 10 minutes. Add noodles. Cook per packet instructions.",timer:600},{title:"Finish",body:"Add shredded chicken back to the soup. Season generously. Serve with fresh parsley and crusty bread."}],
   tip:"The whole chicken gives you the richest, most gelatinous broth. Don't rush the simmering — the depth of flavour comes from time."},
  {id:71,photo:"https://images.unsplash.com/photo-1559058789-672da06263d8?w=600&q=80&fit=crop",name:"Prawn Stir Fry",emoji:"🍤",xp:55,difficulty:"Easy",time:"15 min",category:"Quick",diets:["Gluten-free","Dairy-free"],macros:{calories:280,protein:26,carbs:18,fat:12,fiber:3},done:false,
   ingredients:["400g raw king prawns, peeled","2 heads pak choi, halved","3 cloves garlic","1 tsp fresh ginger","2 tbsp oyster sauce","1 tbsp soy sauce","1 tsp sesame oil","1 tbsp neutral oil","Steamed rice to serve"],
   steps:[{title:"Prep everything",body:"Have all ingredients ready before you start — stir fries cook in minutes. Pat prawns completely dry."},{title:"Stir-fry prawns",body:"Heat oil in a wok over highest heat until smoking. Add prawns in a single layer. Cook 1 minute without touching. Flip. Cook 1 minute more. Remove.",timer:120},{title:"Stir-fry pak choi",body:"Add pak choi to the hot wok. Stir-fry 2 minutes until wilted but still bright green.",timer:120},{title:"Add aromatics and sauce",body:"Add garlic and ginger. Stir 30 seconds. Add oyster sauce and soy sauce. Return prawns. Toss everything together. Finish with sesame oil."}],
   tip:"Cook prawns separately before the vegetables — they overcook in seconds and become rubbery. Adding them back at the end keeps them perfectly tender."},
  {id:72,photo:"https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80&fit=crop",name:"Caprese Salad",emoji:"🍅",xp:20,difficulty:"Easy",time:"5 min",category:"Quick",diets:["Vegetarian","Gluten-free"],macros:{calories:320,protein:18,carbs:8,fat:24,fiber:1},done:false,
   ingredients:["4 large ripe tomatoes, sliced 1cm thick","250g fresh buffalo mozzarella, sliced","Large bunch fresh basil","3 tbsp extra-virgin olive oil — the best you have","Flaky sea salt and black pepper","Optional: aged balsamic vinegar"],
   steps:[{title:"Slice",body:"Slice tomatoes and mozzarella to equal thickness. Alternate them overlapping in a circle on a plate."},{title:"Add basil",body:"Tuck whole basil leaves between the slices."},{title:"Dress",body:"Drizzle olive oil over everything generously. Scatter flaky sea salt and black pepper. Add a few drops of aged balsamic if using."}],
   tip:"This dish is entirely about ingredient quality. A truly ripe tomato, fresh buffalo mozzarella, and excellent olive oil make something extraordinary. An unripe tomato makes something disappointing."},
  {id:73,photo:"https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80&fit=crop",name:"Quesadillas",emoji:"🫓",xp:30,difficulty:"Easy",time:"12 min",category:"Quick",diets:["Vegetarian"],macros:{calories:520,protein:22,carbs:46,fat:28,fiber:4},done:false,
   ingredients:["4 large flour tortillas","200g cheddar or Monterey Jack, grated","1 can black beans, drained","1 red pepper, thinly sliced and sautéed","½ red onion, thinly sliced","Sour cream, guacamole, salsa to serve"],
   steps:[{title:"Assemble",body:"On one half of each tortilla, layer cheese, black beans, peppers, and onion. Fold the other half over to make a semi-circle."},{title:"Cook",body:"In a dry frying pan over medium heat, cook quesadilla 2-3 minutes per side, pressing gently with a spatula, until golden and the cheese has melted.",timer:300},{title:"Cut and serve",body:"Cut into wedges with a pizza cutter. Serve immediately with sour cream, guacamole, and salsa."}],
   tip:"Don't overfill — too much filling and the quesadilla won't hold together when you flip it. A single, even layer of cheese and filling is all you need."},
  {id:74,photo:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop",name:"Niçoise Salad",emoji:"🥗",xp:55,difficulty:"Medium",time:"25 min",category:"Healthy",diets:["Gluten-free","Dairy-free"],macros:{calories:420,protein:32,carbs:24,fat:22,fiber:6},done:false,
   ingredients:["4 eggs","200g green beans, trimmed","4 small potatoes, halved and boiled","4 ripe tomatoes, quartered","2 cans good quality tuna in olive oil","80g Niçoise or kalamata olives","4 anchovy fillets","Dressing: 3 tbsp olive oil, 1 tbsp red wine vinegar, 1 tsp Dijon mustard, 1 clove garlic minced, salt and pepper"],
   steps:[{title:"Boil eggs and beans",body:"Boil eggs exactly 8 minutes for jammy yolks. Cool in cold water, peel and halve. Blanch green beans 3 minutes, refresh in cold water.",timer:480},{title:"Make dressing",body:"Whisk all dressing ingredients together. Taste — it should be sharp and mustardy."},{title:"Assemble",body:"Arrange all components in separate sections on a large platter — this is key to a proper niçoise. Don't toss it."},{title:"Dress",body:"Spoon dressing over everything. Lay anchovy fillets over the tuna. Serve immediately."}],
   tip:"A niçoise is an arranged salad — each component has its own space on the platter. Never toss it. The visual organisation is part of the dish."},
  {id:75,photo:"https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80&fit=crop",name:"Sourdough Toast with Ricotta",emoji:"🍞",xp:20,difficulty:"Easy",time:"8 min",category:"Quick",diets:["Vegetarian"],macros:{calories:340,protein:14,carbs:36,fat:16,fiber:3},done:false,
   ingredients:["2 thick slices sourdough","200g whole-milk ricotta","2 tbsp honey","Handful of walnuts, toasted and roughly chopped","Fresh thyme leaves","Flaky sea salt","Optional: thinly sliced pear or fresh figs"],
   steps:[{title:"Toast the bread",body:"Toast sourdough until deep golden and crunchy."},{title:"Top with ricotta",body:"Spread ricotta thickly on each slice — this is not a thin spread, it should be generous."},{title:"Add toppings",body:"Drizzle honey over the ricotta. Scatter walnuts and thyme. Add sea salt. Add sliced pear or figs if using."}],
   tip:"The combination of creamy ricotta, honey, and crunchy walnuts with the tang of sourdough makes this infinitely better than it sounds. Use the best ricotta and honey you can find."},
  {id:76,photo:"https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80&fit=crop",name:"Croissant French Toast",emoji:"🥐",xp:50,difficulty:"Easy",time:"15 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:490,protein:12,carbs:44,fat:28,fiber:2},done:false,
   ingredients:["4 day-old croissants, halved lengthways","3 eggs","150ml whole milk","1 tbsp caster sugar","1 tsp vanilla","½ tsp cinnamon","2 tbsp butter","To serve: icing sugar, fresh berries, maple syrup"],
   steps:[{title:"Make the custard",body:"Whisk eggs, milk, sugar, vanilla, and cinnamon."},{title:"Soak",body:"Dip croissant halves in custard, letting them soak for 30 seconds each side.",timer:60},{title:"Fry",body:"Melt butter in a non-stick pan over medium heat. Cook croissants 2-3 minutes per side until golden and caramelised.",timer:300},{title:"Serve",body:"Dust with icing sugar. Top with berries and a pour of maple syrup."}],
   tip:"Day-old croissants work better than fresh — they're drier and absorb the custard without becoming soggy and falling apart."},
  {id:77,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Beef Stroganoff",emoji:"🥩",xp:95,difficulty:"Medium",time:"30 min",category:"Comfort",diets:["No restrictions"],macros:{calories:560,protein:38,carbs:28,fat:34,fiber:3},done:false,
   ingredients:["500g beef sirloin or fillet, cut into thin strips","300g chestnut mushrooms, sliced","1 onion, finely diced","3 cloves garlic","1 tbsp tomato paste","1 tbsp Dijon mustard","200ml sour cream","150ml beef stock","2 tbsp olive oil","1 tbsp butter","Fresh parsley","Egg noodles or rice to serve"],
   steps:[{title:"Sear the beef",body:"Season beef strips. Sear in a very hot pan in batches until browned but still pink inside — about 1-2 minutes. Do not crowd the pan. Remove and set aside.",timer:120},{title:"Cook mushrooms",body:"In the same pan, cook mushrooms in butter until deeply golden and all moisture has evaporated.",timer:480},{title:"Build the sauce",body:"Add onion, cook 5 minutes. Add garlic, tomato paste, and mustard. Stir 1 minute. Add beef stock, simmer 5 minutes.",timer:420},{title:"Add sour cream",body:"Remove from heat. Stir in sour cream. Return beef to the pan. Heat gently — do not boil or the sour cream will split.",timer:60},{title:"Serve",body:"Serve immediately over egg noodles with fresh parsley."}],
   tip:"Sear the beef in batches over very high heat — crowding produces grey, steamed meat with no flavour. Each strip should be well-browned outside and still pink inside."},
  {id:78,photo:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&fit=crop",name:"Soufflé",emoji:"🍮",xp:150,difficulty:"Hard",time:"45 min",category:"Baking",diets:["Vegetarian"],macros:{calories:280,protein:12,carbs:18,fat:18,fiber:0},done:false,
   ingredients:["4 eggs, separated","50g dark chocolate (70%) or 50g grated Parmesan (for savoury)","20g butter plus extra for ramekins","20g plain flour","150ml whole milk","Caster sugar for coating ramekins","Pinch of cream of tartar","Pinch of salt"],
   steps:[{title:"Prepare ramekins",body:"Butter ramekins thoroughly. Coat with sugar (for sweet) or Parmesan (for savoury). This coating helps the soufflé grip and rise straight."},{title:"Make the base",body:"Melt butter, add flour, cook 1 minute. Add milk gradually, stir until thick. Add chocolate or Parmesan off the heat. Mix in egg yolks."},{title:"Whip the whites",body:"Whisk egg whites with cream of tartar and salt until stiff peaks form. The whites should hold their shape when you lift the whisk.",timer:300},{title:"Fold",body:"Add a spoonful of whites to the base and beat in vigorously. Then gently fold in the remaining whites in three additions, preserving as much air as possible."},{title:"Bake and serve instantly",body:"Fill ramekins to just below the rim. Run your thumb around the inside edge to help the soufflé rise straight. Bake at 190°C for 12-14 minutes. Serve immediately — a soufflé waits for no one.",timer:780}],
   tip:"A soufflé is just about following the steps calmly and serving it immediately. The myth that they collapse if you speak too loudly is exactly that — a myth. They collapse because they're left to wait."},
  {id:79,photo:"https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&fit=crop",name:"Scones",emoji:"🫓",xp:50,difficulty:"Easy",time:"25 min",category:"Baking",diets:["Vegetarian"],macros:{calories:240,protein:5,carbs:34,fat:10,fiber:1},done:false,
   ingredients:["300g self-raising flour","Pinch of salt","1 tsp baking powder","80g cold unsalted butter, cut into cubes","2 tbsp caster sugar","1 egg","150ml cold buttermilk or whole milk","For brushing: beaten egg","To serve: clotted cream, strawberry jam"],
   steps:[{title:"Rub in the butter",body:"Mix flour, salt, baking powder, and sugar. Add cold butter. Rub between your fingers until it resembles coarse breadcrumbs — there should still be some pea-sized pieces of butter."},{title:"Add liquid",body:"Beat egg into buttermilk. Add to the flour mixture. Mix with a knife until just combined — do not overwork."},{title:"Shape and cut",body:"Turn out onto a floured surface. Pat to 3cm thick — never roll with a rolling pin. Cut rounds with a straight cutter, pressing straight down without twisting.",timer:0},{title:"Bake",body:"Brush tops with egg. Bake at 220°C for 12-15 minutes until risen and golden.",timer:780}],
   tip:"Cold butter, minimum mixing, and a hot oven are the three rules of scones. Overworking the dough develops gluten and makes tough scones. Stop as soon as it just comes together."},
  {id:80,photo:"https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&q=80&fit=crop",name:"Lemon Tart",emoji:"🍋",xp:120,difficulty:"Hard",time:"1.5 hrs",category:"Baking",diets:["Vegetarian"],macros:{calories:380,protein:7,carbs:44,fat:20,fiber:1},done:false,
   ingredients:["For pastry: 200g plain flour, 100g cold butter, 50g icing sugar, 1 egg yolk, 2-3 tbsp cold water","For filling: 4 eggs, 3 egg yolks, 180g caster sugar, 180ml double cream, juice and zest of 3 lemons"],
   steps:[{title:"Make the pastry",body:"Pulse flour, butter, and icing sugar until breadcrumbs. Add egg yolk and water until it just comes together. Wrap and chill 30 minutes.",timer:1800},{title:"Blind bake",body:"Roll pastry 3mm thick, line a 23cm tart tin, chill 15 minutes. Line with baking paper and baking beans. Bake at 180°C for 15 minutes. Remove paper and beans, bake 10 more minutes until golden.",timer:1500},{title:"Make the filling",body:"Whisk eggs, yolks, sugar, cream, lemon juice and zest until combined."},{title:"Bake the filling",body:"Pour filling into the hot pastry case. Reduce oven to 150°C. Bake 25-30 minutes until just set with a slight wobble in the centre.",timer:1800},{title:"Cool completely",body:"Cool completely at room temperature, then refrigerate at least 2 hours before slicing. Serve with crème fraîche.",timer:7200}],
   tip:"The filling should have a wobble like set jelly when you remove it from the oven — it will continue setting as it cools. Overbaking makes it grainy."},
  {id:81,photo:"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&fit=crop",name:"Tiramisu",emoji:"☕",xp:90,difficulty:"Medium",time:"30 min",category:"Baking",diets:["Vegetarian"],macros:{calories:480,protein:10,carbs:44,fat:28,fiber:1},done:false,
   ingredients:["400g mascarpone","4 eggs, separated","100g caster sugar","300ml strong espresso, cooled","3 tbsp Marsala wine or dark rum","About 24 Savoiardi (ladyfinger biscuits)","Cocoa powder to finish"],
   steps:[{title:"Make the cream",body:"Beat egg yolks and sugar until pale and thick. Fold in mascarpone until smooth."},{title:"Whip the whites",body:"Whisk egg whites to stiff peaks. Gently fold into the mascarpone mixture in three additions."},{title:"Dip the biscuits",body:"Mix espresso and Marsala. Briefly dip each biscuit — 2 seconds per side. They should be moist but not sodden."},{title:"Layer",body:"Lay a single layer of dipped biscuits in a dish. Cover with half the cream mixture. Repeat. Top with the remaining cream."},{title:"Chill and serve",body:"Refrigerate at least 4 hours, ideally overnight. Dust heavily with cocoa powder just before serving.",timer:14400}],
   tip:"Dip the biscuits briefly — 2 seconds. They will absorb more moisture from the cream as they sit in the fridge. Over-soaked biscuits make a wet, sloppy tiramisu."},
  {id:82,photo:"https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80&fit=crop",name:"Brownies",emoji:"🍫",xp:65,difficulty:"Easy",time:"35 min",category:"Baking",diets:["Vegetarian"],macros:{calories:320,protein:5,carbs:38,fat:18,fiber:2},done:false,
   ingredients:["200g dark chocolate (70%), roughly chopped","150g unsalted butter","300g caster sugar","3 large eggs","1 tsp vanilla extract","100g plain flour","30g cocoa powder","Pinch of salt"],
   steps:[{title:"Melt chocolate and butter",body:"Melt chocolate and butter together in a heatproof bowl over simmering water, or in the microwave in 30-second bursts. Let cool slightly."},{title:"Mix wet ingredients",body:"Whisk sugar, eggs, and vanilla into the chocolate mixture until combined."},{title:"Fold in dry ingredients",body:"Sift flour, cocoa, and salt over the chocolate mixture. Fold gently until just combined."},{title:"Bake",body:"Pour into a lined 20×20cm tin. Bake at 180°C for 20-25 minutes. The top should have a matte crust and the centre should still have a slight wobble.",timer:1500},{title:"Cool in tin",body:"Cool completely in the tin before cutting — at least 2 hours. The brownie sets as it cools.",timer:7200}],
   tip:"Underbake brownies. A skewer should come out with moist crumbs, not clean. A clean skewer means overcooked, dry brownies. The wobble in the centre is exactly right."},
  {id:83,photo:"https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80&fit=crop",name:"Puttanesca",emoji:"🍝",xp:50,difficulty:"Easy",time:"20 min",category:"Italian",diets:["Dairy-free"],macros:{calories:490,protein:16,carbs:74,fat:16,fiber:6},done:false,
   ingredients:["400g spaghetti","3 tbsp olive oil","4 cloves garlic, sliced","8 anchovy fillets","1 tsp chilli flakes","2×400g cans whole tomatoes","100g pitted black olives, halved","3 tbsp capers","Fresh parsley"],
   steps:[{title:"Melt the anchovies",body:"Cook garlic and anchovies gently in olive oil. After a few minutes the anchovies will completely dissolve into the oil — this is the point. Add chilli flakes."},{title:"Build the sauce",body:"Add tomatoes, breaking them up. Add olives and capers. Simmer 15 minutes until thickened.",timer:900},{title:"Cook and combine pasta",body:"Cook spaghetti in well-salted water until al dente. Reserve pasta water. Toss with the sauce, adding pasta water until glossy."},{title:"Serve",body:"Plate immediately with fresh parsley. No Parmesan — this is a southern Italian dish where the rule is no cheese with fish-based sauces."}],
   tip:"The anchovies are the seasoning agent — they completely dissolve and nobody will know they're there, but the sauce will be intensely savoury in a way that can't be achieved any other way."},
  {id:84,photo:"https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80&fit=crop",name:"Bucatini Amatriciana",emoji:"🍝",xp:70,difficulty:"Medium",time:"30 min",category:"Italian",diets:["No restrictions"],macros:{calories:560,protein:22,carbs:72,fat:22,fiber:4},done:false,
   ingredients:["400g bucatini or rigatoni","200g guanciale (cured pork cheek) or pancetta, diced","1×400g can whole San Marzano tomatoes","1 dried chilli","100ml dry white wine","Pecorino Romano, generously grated","Black pepper"],
   steps:[{title:"Render the guanciale",body:"Cook guanciale in a cold dry pan over medium heat. Render slowly until the fat is translucent and the meat is crisp. Remove the meat, leave the fat.",timer:480},{title:"Build the sauce",body:"Add chilli to the hot fat. Add wine, let bubble 1 minute. Add tomatoes, breaking them up. Simmer 15-20 minutes until thickened.",timer:1200},{title:"Cook pasta",body:"Cook bucatini in heavily salted water until 2 minutes under al dente. Reserve pasta water."},{title:"Combine",body:"Toss pasta in the sauce with the crispy guanciale and pasta water over medium heat for 2 minutes. Remove from heat. Add a generous amount of Pecorino and toss vigorously."}],
   tip:"Guanciale (cured cheek) is authentic and has a richer, more complex fat than pancetta. If you can find it, use it. The fat you render is the soul of this sauce."},
  {id:85,photo:"https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80&fit=crop",name:"Chicken Marsala",emoji:"🍗",xp:85,difficulty:"Medium",time:"30 min",category:"Italian",diets:["No restrictions"],macros:{calories:480,protein:38,carbs:16,fat:26,fiber:2},done:false,
   ingredients:["4 chicken breasts, butterflied and pounded thin","200g chestnut mushrooms, sliced","150ml dry Marsala wine","150ml chicken stock","2 cloves garlic","3 tbsp plain flour","50g butter","3 tbsp olive oil","Fresh parsley","Salt and pepper"],
   steps:[{title:"Pound and flour the chicken",body:"Pound chicken to even thickness. Season. Dust with flour, shaking off excess."},{title:"Sear the chicken",body:"Cook in olive oil over medium-high heat 3 minutes per side until golden and cooked through. Remove and keep warm.",timer:360},{title:"Cook mushrooms",body:"Melt butter in the same pan. Cook mushrooms until golden. Add garlic."},{title:"Make the sauce",body:"Add Marsala wine — it will sizzle. Let reduce by half. Add chicken stock. Simmer 5 minutes until sauce coats a spoon.",timer:300},{title:"Serve",body:"Return chicken to pan to warm through. Spoon sauce and mushrooms over. Finish with parsley."}],
   tip:"Marsala wine is the defining ingredient — don't substitute. Dry Marsala gives a complex, slightly nutty depth. Sweet Marsala makes the dish cloying."},
  {id:86,photo:"https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80&fit=crop",name:"Beef Bulgogi",emoji:"🥩",xp:80,difficulty:"Medium",time:"30 min",category:"Asian",diets:["Dairy-free"],macros:{calories:420,protein:36,carbs:28,fat:18,fiber:2},done:false,
   ingredients:["600g beef sirloin or ribeye, very thinly sliced (freeze for 30 min to slice easily)","Marinade: 4 tbsp soy sauce, 2 tbsp sugar, 1 tbsp sesame oil, 4 cloves garlic minced, 1 Asian pear or kiwi grated, 1 tsp fresh ginger, 1 spring onion sliced, black pepper","Sesame seeds and spring onions to serve","Steamed rice and lettuce leaves"],
   steps:[{title:"Make the marinade",body:"Combine all marinade ingredients. The grated pear contains enzymes that tenderise the beef — this is the Korean secret."},{title:"Marinate",body:"Add thinly sliced beef to the marinade. Mix thoroughly. Marinate minimum 30 minutes, ideally 2 hours.",timer:1800},{title:"Cook over high heat",body:"Cook in a very hot pan or grill in batches. The sugars in the marinade will caramelise quickly — this is the goal. Cook just 1-2 minutes per batch.",timer:120},{title:"Serve",body:"Serve over rice, or wrap in lettuce leaves with rice and kimchi. Scatter sesame seeds and spring onions."}],
   tip:"The grated Asian pear is the tenderising secret. It breaks down the muscle fibres and produces the silky texture that distinguishes good bulgogi. Kiwi works as a substitute."},
  {id:87,photo:"https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80&fit=crop",name:"Green Papaya Salad",emoji:"🥗",xp:60,difficulty:"Medium",time:"20 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:180,protein:8,carbs:22,fat:8,fiber:4},done:false,
   ingredients:["1 green (unripe) papaya, peeled and julienned","100g cherry tomatoes, halved","50g roasted peanuts","4 cloves garlic","2-4 red bird's eye chillies","Dressing: 3 tbsp fish sauce, 2 tbsp lime juice, 1 tbsp palm sugar or brown sugar","Long beans or green beans, blanched and chopped (optional)"],
   steps:[{title:"Pound the aromatics",body:"In a large mortar, pound garlic and chillies to a rough paste."},{title:"Make the dressing",body:"Add fish sauce, lime juice, and sugar to the mortar. Mix until the sugar dissolves. Taste — it should be hot, sour, salty, and sweet in equal measure."},{title:"Pound the papaya",body:"Add julienned papaya and gently pound — you want to bruise it, not mash it. Add tomatoes, beans if using, and toss."},{title:"Finish",body:"Transfer to a plate. Scatter roasted peanuts generously over the top. Serve immediately."}],
   tip:"The balance of hot, sour, salty, and sweet is everything in Thai cuisine. Taste the dressing constantly and adjust each element until all four flavours are in harmony."},
  {id:88,photo:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80&fit=crop",name:"Chicken Shawarma",emoji:"🫓",xp:90,difficulty:"Medium",time:"1 hr",category:"Mediterranean",diets:["Gluten-free","Dairy-free"],macros:{calories:440,protein:36,carbs:22,fat:24,fiber:3},done:false,
   ingredients:["700g chicken thighs","Marinade: 3 tbsp olive oil, juice of 1 lemon, 4 cloves garlic minced, 2 tsp cumin, 2 tsp smoked paprika, 1 tsp turmeric, 1 tsp cinnamon, ½ tsp cayenne, salt","To serve: flatbread or pita, hummus, tahini sauce, sliced tomato, cucumber, pickles, fresh parsley"],
   steps:[{title:"Marinate",body:"Mix marinade and toss with chicken thighs. Marinate at least 2 hours, overnight for best results.",timer:7200},{title:"Roast",body:"Spread chicken on a baking tray in a single layer. Roast at 220°C for 25-30 minutes until deeply caramelised and charred at the edges.",timer:1800},{title:"Rest and slice",body:"Rest 5 minutes. Slice chicken into thin strips.",timer:300},{title:"Build the wrap",body:"Warm flatbread. Spread hummus. Add chicken, tahini sauce, tomato, cucumber, pickles, and parsley. Roll tightly."}],
   tip:"The high oven temperature and single layer is essential — you want char and caramelisation, not steaming. The spice crust should be crispy and slightly blackened at the edges."},
  {id:89,photo:"https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop",name:"Turkish Eggs",emoji:"🥚",xp:45,difficulty:"Easy",time:"15 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:340,protein:16,carbs:8,fat:28,fiber:1},done:false,
   ingredients:["4 eggs","400g thick Greek yoghurt, at room temperature","2 cloves garlic, minced","50g unsalted butter","1 tsp Turkish red pepper flakes (Aleppo pepper) or chilli flakes","1 tsp paprika","Fresh dill","Crusty bread to serve"],
   steps:[{title:"Make the yoghurt base",body:"Mix yoghurt with minced garlic and a pinch of salt. Spread across a wide plate or shallow bowl."},{title:"Poach the eggs",body:"Poach eggs to runny yolks (3 minutes). Place on the yoghurt.",timer:180},{title:"Make the butter sauce",body:"Melt butter in a small pan until just beginning to brown. Add paprika and pepper flakes — they'll sizzle.",timer:60},{title:"Serve",body:"Pour the hot spiced butter over the eggs and yoghurt. Scatter fresh dill. Serve immediately with crusty bread."}],
   tip:"The yoghurt must be at room temperature — cold yoghurt against warm eggs creates an unpleasant contrast and the yoghurt doesn't mix into the butter sauce properly."},
  {id:90,photo:"https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80&fit=crop",name:"Bircher Muesli",emoji:"🥣",xp:30,difficulty:"Easy",time:"5 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:360,protein:12,carbs:54,fat:10,fiber:7},done:false,
   ingredients:["200g rolled oats","300ml apple juice","200g natural yoghurt","1 large apple, grated (with skin)","Juice of 1 lemon","2 tbsp honey","To serve: fresh berries, toasted almonds, extra yoghurt"],
   steps:[{title:"Combine everything",body:"Mix oats, apple juice, yoghurt, grated apple, lemon juice, and honey. Stir well."},{title:"Refrigerate overnight",body:"Cover and refrigerate overnight. The oats will absorb the liquid and swell significantly.",timer:0},{title:"Serve",body:"In the morning, stir and add a little more apple juice if too thick. Top with berries, toasted almonds, and extra yoghurt."}],
   tip:"Bircher muesli was invented by Swiss physician Maximilian Bircher-Benner for his patients. The apple juice and grated apple give it a light, fresh quality that's very different from overnight oats."},
  {id:91,photo:"https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=600&q=80&fit=crop",name:"Fish Tacos",emoji:"🌮",xp:65,difficulty:"Easy",time:"20 min",category:"Mexican",diets:["Dairy-free"],macros:{calories:380,protein:28,carbs:38,fat:14,fiber:4},done:false,
   ingredients:["500g white fish fillets (cod, tilapia, or basa)","Spice rub: 1 tsp cumin, 1 tsp smoked paprika, ½ tsp garlic powder, salt","8 corn tortillas","Slaw: ¼ cabbage shredded, 1 carrot grated, juice of 1 lime, salt","Chipotle mayo: 2 tbsp mayo, 1 tsp chipotle sauce","Avocado, lime, fresh coriander"],
   steps:[{title:"Make the slaw",body:"Toss cabbage, carrot, lime juice, and salt. Let sit while you cook the fish."},{title:"Season and cook fish",body:"Rub fish with spices and salt. Pan-fry in a little oil over medium-high heat 3-4 minutes per side until cooked through and lightly charred.",timer:480},{title:"Flake the fish",body:"Break fish into large pieces."},{title:"Assemble",body:"Warm tortillas. Build: slaw, fish, chipotle mayo, avocado. Squeeze lime generously."}],
   tip:"The slaw is just as important as the fish — the crunch, acidity, and freshness balance the soft, spiced fish perfectly. Don't skip it."},
  {id:92,photo:"https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80&fit=crop",name:"Aloo Tikki",emoji:"🥔",xp:50,difficulty:"Easy",time:"30 min",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:240,protein:6,carbs:42,fat:8,fiber:5},done:false,
   ingredients:["600g floury potatoes, boiled and mashed","1 can chickpeas, drained and roughly mashed","2 green chillies, finely diced","2 tsp garam masala","1 tsp cumin","1 tsp amchoor (dried mango powder) — makes them tangy","Large handful fresh coriander","Salt","Neutral oil for frying","To serve: yoghurt, mint chutney, tamarind chutney"],
   steps:[{title:"Make the mixture",body:"Combine mashed potato with roughly mashed chickpeas, chillies, spices, amchoor, coriander, and salt. Mix well and taste."},{title:"Shape",body:"Divide into 12 equal portions. Shape into flat, round patties about 1cm thick."},{title:"Pan-fry",body:"Heat a thin layer of oil in a frying pan over medium heat. Cook patties 3-4 minutes per side until deep golden and crispy.",timer:480},{title:"Serve",body:"Serve hot with yoghurt, mint chutney, and tamarind chutney."}],
   tip:"The amchoor (dried mango powder) gives the tikki their characteristic tangy flavour. It's worth finding at an Indian grocery store — nothing substitutes for it exactly."},
  {id:93,photo:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop",name:"Prawn Curry",emoji:"🍤",xp:80,difficulty:"Medium",time:"25 min",category:"Indian",diets:["Gluten-free","Dairy-free"],macros:{calories:360,protein:28,carbs:18,fat:20,fiber:4},done:false,
   ingredients:["500g raw king prawns","400ml coconut milk","1×400g can chopped tomatoes","1 onion, finely diced","4 cloves garlic","1 tsp fresh ginger","2 tsp curry powder","1 tsp turmeric","1 tsp ground coriander","½ tsp cayenne","3 tbsp neutral oil","Fresh coriander and rice to serve"],
   steps:[{title:"Build the base",body:"Cook onion in oil for 8 minutes until golden. Add garlic and ginger. Add all spices, stir 1 minute.",timer:480},{title:"Add tomatoes",body:"Add chopped tomatoes. Cook 5 minutes until reduced."},{title:"Add coconut milk",body:"Add coconut milk. Stir well. Bring to a gentle simmer."},{title:"Add prawns",body:"Add raw prawns. Simmer 3-4 minutes until fully pink and opaque. Do not overcook.",timer:240},{title:"Serve",body:"Taste and adjust seasoning. Serve with rice and fresh coriander."}],
   tip:"Add prawns at the very end and pull them off the heat the moment they turn pink. Overcooked prawns are rubbery — they need literally 3-4 minutes."},
  {id:94,photo:"https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop",name:"Fried Rice with Egg",emoji:"🍚",xp:40,difficulty:"Easy",time:"12 min",category:"Quick",diets:["Vegetarian","Dairy-free"],macros:{calories:360,protein:12,carbs:52,fat:12,fiber:2},done:false,
   ingredients:["400g cold cooked rice","3 eggs","4 cloves garlic, minced","2 tbsp soy sauce","1 tsp sesame oil","2 tbsp neutral oil","Spring onions","White pepper"],
   steps:[{title:"High heat",body:"Heat oil in a wok over maximum heat until smoking."},{title:"Fry the rice",body:"Add cold rice. Press flat. Don't stir for 1 minute. Toss and stir-fry 2 more minutes.",timer:180},{title:"Add garlic and eggs",body:"Push rice to the sides. Add garlic to centre, stir 20 seconds. Crack eggs into centre, scramble quickly, fold into rice before fully set."},{title:"Season",body:"Add soy sauce, sesame oil, and white pepper. Toss well. Scatter spring onions. Serve immediately."}],
   tip:"White pepper not black — white pepper is the authentic seasoning for Chinese-style fried rice. It has a different, more pungent quality that works perfectly here."},
  {id:95,photo:"https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80&fit=crop",name:"Tuna Poke Bowl",emoji:"🐟",xp:55,difficulty:"Easy",time:"15 min",category:"Healthy",diets:["Gluten-free","Dairy-free"],macros:{calories:420,protein:32,carbs:42,fat:14,fiber:4},done:false,
   ingredients:["300g sushi-grade tuna, diced","Marinade: 2 tbsp soy sauce, 1 tbsp sesame oil, 1 tsp rice vinegar, 1 tsp grated ginger","200g sushi rice, cooked and cooled","1 avocado, diced","1 cucumber, diced","Edamame beans","Pickled ginger","Sesame seeds and spring onions","Sriracha mayo: 2 tbsp mayo, 1 tsp sriracha"],
   steps:[{title:"Marinate tuna",body:"Toss diced tuna with marinade. Rest 10 minutes.",timer:600},{title:"Prepare the bowl",body:"Season cooled sushi rice with a little rice vinegar and salt."},{title:"Build",body:"Place rice in bowl. Arrange tuna, avocado, cucumber, and edamame in separate sections."},{title:"Dress",body:"Drizzle sriracha mayo over the bowl. Top with pickled ginger, sesame seeds, and spring onions."}],
   tip:"Use sushi-grade tuna only — it's specifically handled and frozen to kill parasites, making it safe to eat raw. Never use standard fresh tuna for a poke bowl."},
  {id:96,photo:"https://images.unsplash.com/photo-1548940740-204726a19be3?w=600&q=80&fit=crop",name:"Pulled Pork",emoji:"🐷",xp:120,difficulty:"Medium",time:"6 hrs",category:"Comfort",diets:["Gluten-free","Dairy-free"],macros:{calories:520,protein:40,carbs:18,fat:32,fiber:1},done:false,
   ingredients:["2kg pork shoulder, bone-in","Dry rub: 3 tbsp brown sugar, 2 tbsp smoked paprika, 1 tbsp garlic powder, 1 tsp onion powder, 1 tsp cumin, 1 tsp black pepper, 1 tsp salt, ½ tsp cayenne","200ml apple cider vinegar","BBQ sauce to serve","Brioche buns and coleslaw"],
   steps:[{title:"Apply the rub",body:"Coat the pork shoulder generously in dry rub on all sides. Wrap and refrigerate overnight if possible.",timer:0},{title:"Slow cook",body:"Place pork in a roasting tin. Add 200ml water. Cover tightly with foil. Cook at 150°C for 5-6 hours until completely tender and a fork slides in with no resistance.",timer:18000},{title:"Rest and pull",body:"Remove from oven. Rest covered for 30 minutes. Pull the meat apart using two forks — it should fall apart completely.",timer:1800},{title:"Serve",body:"Mix with some of the cooking juices and a little BBQ sauce. Serve in brioche buns with coleslaw."}],
   tip:"You cannot rush pulled pork. The collagen in the shoulder converts to gelatin at low temperatures over many hours — this is what makes it tender and moist. Rushing it at high heat produces dry, tough meat."},
  {id:101,photo:"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&fit=crop",name:"Beef Tacos",emoji:"🌮",xp:55,difficulty:"Easy",time:"20 min",category:"Mexican",diets:["Gluten-free","Dairy-free"],macros:{calories:480,protein:32,carbs:34,fat:22,fiber:4},done:false,
   ingredients:["500g ground beef","8 corn tortillas","1 onion, finely diced","3 cloves garlic","2 tsp cumin","2 tsp smoked paprika","1 tsp oregano","Salt","Toppings: diced white onion, fresh coriander, lime, salsa, sliced radishes"],
   steps:[{title:"Brown the beef",body:"Cook beef in a hot dry pan over high heat, breaking it up until deeply browned. Drain excess fat."},{title:"Season",body:"Add onion and garlic. Cook 3 minutes. Add cumin, paprika, oregano, and salt. Stir 1 minute. Add a splash of water and simmer 5 minutes.",timer:300},{title:"Warm tortillas",body:"Warm corn tortillas directly over a gas flame or in a dry pan until they develop a few char spots."},{title:"Build",body:"Load beef into tortillas. Top with diced onion, coriander, a squeeze of lime, salsa, and sliced radishes."}],
   tip:"Street tacos are small and loaded, not giant and wrapped. Two small tortillas stacked makes the authentic vessel — the double layer prevents tearing."},
  {id:102,photo:"https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=600&q=80&fit=crop",name:"Miso Soup",emoji:"🍵",xp:20,difficulty:"Easy",time:"10 min",category:"Japanese",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:80,protein:6,carbs:8,fat:3,fiber:2},done:false,
   ingredients:["1L dashi stock (or water with 1 tbsp dashi powder)","4 tbsp white or red miso paste","200g silken tofu, cubed","2 spring onions, sliced","Optional: wakame seaweed, rehydrated"],
   steps:[{title:"Heat the dashi",body:"Bring dashi to a gentle simmer. Do not boil miso soup once the miso is added — boiling destroys the flavour."},{title:"Add tofu and seaweed",body:"Add tofu and rehydrated wakame. Warm through 2 minutes.",timer:120},{title:"Dissolve the miso",body:"Ladle some hot stock into a small bowl. Whisk in miso paste until completely dissolved. Pour back into the pot."},{title:"Serve",body:"Ladle into bowls. Top with sliced spring onions. Serve immediately."}],
   tip:"Never boil the soup after adding miso — it kills the beneficial bacteria and dramatically changes the flavour. Warm, never boiling."},
  {id:103,photo:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80&fit=crop",name:"Onion Soup",emoji:"🧅",xp:90,difficulty:"Medium",time:"1.5 hrs",category:"Comfort",diets:["Vegetarian"],macros:{calories:380,protein:16,carbs:42,fat:18,fiber:4},done:false,
   ingredients:["1.5kg white onions, thinly sliced","60g unsalted butter","2 tbsp olive oil","1 tsp sugar","200ml dry white wine","1L beef or vegetable stock","Fresh thyme","1 bay leaf","For the croute: thick slices baguette, 150g Gruyère, grated","Salt and pepper"],
   steps:[{title:"Caramelise the onions",body:"Melt butter and oil in a large heavy pan. Add onions and sugar. Cook over medium-low heat for 45-60 minutes, stirring every 5-10 minutes, until deeply golden and jammy.",timer:3600},{title:"Deglaze",body:"Add wine, scraping the bottom. Reduce by half."},{title:"Add stock",body:"Add stock, thyme, and bay leaf. Simmer 20 minutes.",timer:1200},{title:"Toast the croutes",body:"Toast baguette slices. Top with Gruyère and grill until bubbling."},{title:"Serve",body:"Ladle soup into bowls. Float croutes on top. Grill the whole bowl briefly until the cheese is golden."}],
   tip:"The caramelisation process cannot be rushed. Low and slow for a full hour produces the deep, sweet, complex onion base. Any shortcut produces inferior results."},
  {id:104,photo:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop",name:"Stuffed Bell Peppers",emoji:"🫑",xp:70,difficulty:"Easy",time:"55 min",category:"Healthy",diets:["Gluten-free"],macros:{calories:380,protein:22,carbs:38,fat:16,fiber:6},done:false,
   ingredients:["4 large bell peppers","300g ground beef or lamb","150g cooked rice","1 onion, finely diced","3 cloves garlic","1×400g can chopped tomatoes","1 tsp cumin","1 tsp paprika","100g feta or cheddar, crumbled","3 tbsp olive oil","Salt and pepper","Fresh herbs to serve"],
   steps:[{title:"Prepare peppers",body:"Cut tops off peppers and remove seeds. Blanch in boiling water 3 minutes. Drain."},{title:"Make the filling",body:"Cook onion in oil 5 minutes. Brown meat. Add garlic, spices, and tomatoes. Cook 5 minutes. Mix in rice."},{title:"Fill and bake",body:"Pack filling into peppers. Top with crumbled cheese. Place in a baking dish with a little water in the bottom. Bake at 190°C for 30 minutes until peppers are tender.",timer:1800},{title:"Serve",body:"Scatter fresh herbs. Serve immediately."}],
   tip:"Blanching the peppers briefly before stuffing ensures they cook through properly in the oven without the filling drying out."},
  {id:105,photo:"https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop",name:"Huevos Rancheros",emoji:"🥚",xp:50,difficulty:"Easy",time:"20 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:420,protein:18,carbs:38,fat:22,fiber:8},done:false,
   ingredients:["4 eggs","2×400g cans chopped tomatoes","1 onion, diced","3 cloves garlic","2 jalapeños, diced","1 tsp cumin","1 tsp smoked paprika","4 corn tortillas","1 can black beans, heated","Avocado, sour cream, fresh coriander, lime"],
   steps:[{title:"Make the ranchero sauce",body:"Cook onion and jalapeños in oil 5 minutes. Add garlic, cumin, paprika. Add tomatoes, simmer 15 minutes until thick.",timer:1200},{title:"Fry the eggs",body:"Fry eggs in a separate pan to your liking."},{title:"Assemble",body:"Warm tortillas. Spread black beans. Add ranchero sauce. Top with fried egg."},{title:"Garnish",body:"Top with avocado, sour cream, coriander, and a squeeze of lime."}],
   tip:"The ranchero sauce can be made ahead and keeps for days in the fridge, making this a very quick weekday breakfast."},
  {id:106,photo:"https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80&fit=crop",name:"Pad See Ew",emoji:"🍜",xp:75,difficulty:"Medium",time:"20 min",category:"Asian",diets:["Dairy-free"],macros:{calories:520,protein:26,carbs:62,fat:18,fiber:3},done:false,
   ingredients:["300g wide flat rice noodles (fresh or soaked dried)","300g chicken breast, thinly sliced","3 eggs","200g Chinese broccoli or broccolini, stems and leaves separated","3 cloves garlic","Sauce: 2 tbsp oyster sauce, 1 tbsp dark soy sauce, 1 tbsp light soy sauce, 1 tsp sugar","2 tbsp neutral oil"],
   steps:[{title:"Mix sauce",body:"Combine all sauce ingredients in a bowl."},{title:"Sear the chicken",body:"In a smoking-hot wok, sear chicken in batches until caramelised. Remove."},{title:"Stir-fry broccoli stems",body:"Add oil, garlic, and broccoli stems. Stir-fry 2 minutes. Add leaves."},{title:"Add noodles and eggs",body:"Add noodles and sauce. Toss until coated and noodles have some char. Push to side, scramble eggs in centre, fold in."},{title:"Return chicken",body:"Return chicken. Toss everything together. Serve immediately."}],
   tip:"Wok hei — the smoky breath of the wok — is only achievable over very high heat. Don't move the noodles for 30 seconds at a time, letting them char slightly against the pan."},
  {id:107,photo:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80&fit=crop",name:"Hummus",emoji:"🫘",xp:30,difficulty:"Easy",time:"15 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:180,protein:8,carbs:20,fat:9,fiber:6},done:false,
   ingredients:["2×400g cans chickpeas","4 tbsp good tahini","Juice of 2 lemons","2 cloves garlic","4 tbsp ice-cold water","4 tbsp extra-virgin olive oil","½ tsp cumin","Salt","To serve: olive oil, paprika, whole chickpeas, parsley"],
   steps:[{title:"Peel chickpeas (optional but worth it)",body:"For ultra-smooth hummus, remove the skins from the chickpeas by pinching them off. This takes time but produces restaurant-quality hummus."},{title:"Blend tahini first",body:"Blend tahini, lemon juice, and garlic alone in the food processor for 1 minute until pale and creamy. This step is the secret to light hummus."},{title:"Add chickpeas",body:"Add chickpeas. Blend, adding ice-cold water tablespoon by tablespoon until very smooth and light. Season generously with salt and cumin."},{title:"Plate",body:"Serve in a wide bowl. Use the back of a spoon to create a well in the centre. Fill with olive oil, paprika, a few whole chickpeas, and parsley."}],
   tip:"Blend the tahini and lemon alone first — this creates an airy, almost whipped base that makes the hummus significantly lighter and smoother than blending everything together at once."},
  {id:108,photo:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80&fit=crop",name:"Dosa with Sambar",emoji:"🫓",xp:120,difficulty:"Hard",time:"1 day",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:380,protein:12,carbs:62,fat:10,fiber:8},done:false,
   ingredients:["For batter: 300g long-grain rice, 100g urad dal (split black lentils) — soak separately overnight, then grind and ferment 8-12 hours","For sambar: 200g toor dal (split pigeon peas), 1 onion, 2 tomatoes, 200g mixed vegetables, 2 tsp sambar powder, tamarind paste","Coconut chutney: 100g fresh coconut, green chilli, ginger, salt, oil for tempering"],
   steps:[{title:"Grind the batter",body:"Drain soaked rice and dal. Grind separately to a smooth batter. Combine with salt. Ferment at room temperature overnight.",timer:0},{title:"Make sambar",body:"Cook toor dal until soft. Cook onion, tomatoes, and vegetables with sambar powder. Combine with dal, add tamarind. Simmer 20 minutes.",timer:1200},{title:"Make coconut chutney",body:"Blend coconut, chilli, and ginger with a little water. Temper with mustard seeds in hot oil."},{title:"Cook dosa",body:"Heat a cast-iron pan until very hot. Spread batter in a thin spiral, moving outward. Drizzle ghee around edges. Cook until deep golden and the edges lift.",timer:180},{title:"Serve",body:"Roll or fold the crispy dosa. Serve with sambar and coconut chutney."}],
   tip:"Fermentation is non-negotiable — it creates the distinctive sour flavour and the bubbles that make dosa light and crispy. A warm kitchen ferments the batter faster."},
  {id:109,photo:"https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600&q=80&fit=crop",name:"Beetroot Salad with Goat's Cheese",emoji:"🫐",xp:35,difficulty:"Easy",time:"15 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:280,protein:10,carbs:24,fat:16,fiber:6},done:false,
   ingredients:["4 medium beetroot, roasted and peeled","150g soft goat's cheese","80g walnuts, toasted","Large handful rocket or watercress","Dressing: 2 tbsp extra-virgin olive oil, 1 tbsp red wine vinegar, 1 tsp honey, 1 tsp Dijon mustard, salt and pepper","Fresh thyme leaves"],
   steps:[{title:"Slice beetroot",body:"Slice roasted beetroot into wedges or rounds."},{title:"Make dressing",body:"Whisk olive oil, vinegar, honey, and mustard. Season."},{title:"Assemble",body:"Spread rocket on a platter. Arrange beetroot over the top. Crumble goat's cheese generously. Scatter toasted walnuts."},{title:"Dress",body:"Spoon dressing over everything. Scatter thyme leaves."}],
   tip:"Roast beetroot wrapped in foil at 200°C for 1 hour — far better flavour than boiling. The skins slip off easily once cooled."},
  {id:110,photo:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&fit=crop",name:"Sloppy Joes",emoji:"🍔",xp:45,difficulty:"Easy",time:"25 min",category:"Comfort",diets:["No restrictions"],macros:{calories:520,protein:32,carbs:48,fat:22,fiber:4},done:false,
   ingredients:["500g ground beef","1 onion, finely diced","1 green pepper, diced","3 cloves garlic","200ml tomato ketchup","2 tbsp Worcestershire sauce","1 tbsp brown sugar","1 tbsp cider vinegar","1 tsp Dijon mustard","1 tsp smoked paprika","4 brioche buns","Pickles to serve"],
   steps:[{title:"Brown the beef",body:"Cook beef over high heat, breaking up, until browned. Drain excess fat."},{title:"Cook vegetables",body:"Add onion and pepper. Cook 5 minutes. Add garlic and paprika."},{title:"Add sauce",body:"Add ketchup, Worcestershire, brown sugar, vinegar, and mustard. Stir well. Simmer 10 minutes until thick.",timer:600},{title:"Serve",body:"Pile into toasted brioche buns with pickles. Eat immediately and messily."}],
   tip:"A sloppy joe should be, as the name suggests, sloppy. If it holds its shape on the bun, the sauce needs more time to reduce."},
  {id:111,photo:"https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80&fit=crop",name:"Congee",emoji:"🍚",xp:45,difficulty:"Easy",time:"1 hr",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:220,protein:14,carbs:32,fat:4,fiber:1},done:false,
   ingredients:["200g jasmine or short-grain rice","1.5L chicken or vegetable stock","2cm fresh ginger, sliced","2 spring onions","Salt","Toppings: soft-boiled egg, sesame oil, white pepper, fried shallots, soy sauce, fresh ginger julienne, spring onions"],
   steps:[{title:"Cook the rice",body:"Combine rice and stock in a pot. Bring to a boil, reduce to lowest heat. Cook uncovered 45-60 minutes, stirring occasionally, until rice has completely broken down into a creamy porridge.",timer:3600},{title:"Season",body:"Add ginger and salt. Remove ginger slices. The congee should be silky and flowing."},{title:"Serve",body:"Ladle into bowls. Let each person add their own toppings: sesame oil, white pepper, soy sauce, egg, fried shallots, spring onions."}],
   tip:"Congee is Chinese comfort food at its purest. The secret is patience — the longer it cooks, the more completely the rice breaks down and the silkier the texture becomes."},
  {id:112,photo:"https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop",name:"Pad Thai",emoji:"🍜",xp:95,difficulty:"Medium",time:"25 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:540,protein:24,carbs:68,fat:20,fiber:3},done:false,
   ingredients:["300g flat rice noodles","300g prawns or chicken, or firm tofu for vegan","3 eggs","100g bean sprouts","3 spring onions, sliced","3 cloves garlic","3 tbsp fish sauce (or soy sauce for vegan)","2 tbsp tamarind paste","2 tbsp palm sugar or brown sugar","2 tbsp neutral oil","To serve: crushed peanuts, lime, chilli flakes, extra bean sprouts"],
   steps:[{title:"Soak noodles",body:"Soak rice noodles in cold water 30 minutes until flexible but still firm.",timer:1800},{title:"Mix sauce",body:"Combine fish sauce, tamarind paste, and sugar."},{title:"Stir-fry protein",body:"In a screaming hot wok, cook protein until caramelised. Push to side."},{title:"Add noodles",body:"Add noodles and sauce. Toss constantly until sauce coats everything and noodles are just tender."},{title:"Eggs and sprouts",body:"Push everything to side. Scramble eggs in centre. Fold in before fully set. Add sprouts and spring onions.",timer:60},{title:"Serve",body:"Plate with crushed peanuts, lime wedge, chilli flakes. Let each person customise their bowl."}],
   tip:"A proper pad thai has a balance of sweet, sour, and salty from the tamarind, fish sauce, and palm sugar. Taste the sauce before adding and adjust each element."},
  {id:113,photo:"https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80&fit=crop",name:"Shakshuka",emoji:"🍳",xp:55,difficulty:"Easy",time:"25 min",category:"Breakfast",diets:["Vegetarian","Gluten-free"],macros:{calories:320,protein:18,carbs:22,fat:18,fiber:5},done:false,
   ingredients:["6 eggs","2×400g cans chopped tomatoes","1 red onion, diced","4 cloves garlic","2 red peppers, diced","2 tsp smoked paprika","1 tsp cumin","½ tsp chilli flakes","3 tbsp olive oil","100g feta (optional)","Fresh parsley and crusty bread"],
   steps:[{title:"Cook vegetables",body:"Cook onion and peppers in olive oil 8 minutes. Add garlic, paprika, cumin, and chilli.",timer:480},{title:"Add tomatoes",body:"Add tomatoes. Simmer 10 minutes until thickened into a rich sauce.",timer:600},{title:"Add eggs",body:"Make wells and crack in eggs. Cover and cook 5-7 minutes until whites are set but yolks still runny.",timer:420},{title:"Serve",body:"Crumble feta over the top. Scatter parsley. Bring pan to table."}],
   tip:"Don't fully cook the yolks — they should be runny and mix into the tomato sauce as you eat. Cover the pan and cook over gentle heat for the perfect set white and runny yolk."},
  {id:114,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Cacio e Pepe",emoji:"🍝",xp:85,difficulty:"Hard",time:"20 min",category:"Italian",diets:["Vegetarian"],macros:{calories:580,protein:22,carbs:72,fat:24,fiber:3},done:false,
   ingredients:["400g tonnarelli or spaghetti","100g Pecorino Romano, very finely grated","50g Parmesan, very finely grated","2 tsp black pepper, very coarsely ground — use a mortar","Salt for pasta water"],
   steps:[{title:"Toast the pepper",body:"Toast coarsely ground pepper in a dry frying pan until fragrant. Remove from heat."},{title:"Cook pasta",body:"Cook pasta in generously salted water. Reserve 300ml pasta water before draining."},{title:"Create the emulsion",body:"Add a ladleful of pasta water to the toasted pepper pan. Add pasta and toss over medium heat."},{title:"Add cheese",body:"Remove from heat. Add Pecorino and Parmesan off the heat — this is critical. Toss vigorously, adding pasta water a little at a time until a creamy, clinging sauce forms. This takes 2-3 minutes of vigorous work.",timer:180}],
   tip:"Never add the cheese over heat. The sauce forms through emulsification of starch, fat, and cheese — heat makes the cheese clump. Off the heat and vigorous tossing is the technique."},
  {id:115,photo:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&fit=crop",name:"Beet Burger",emoji:"🍔",xp:70,difficulty:"Medium",time:"30 min",category:"Healthy",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:420,protein:16,carbs:54,fat:16,fiber:10},done:false,
   ingredients:["2 large beetroot, cooked and grated","1 can black beans, drained and mashed","100g rolled oats","1 onion, grated","3 cloves garlic","2 tsp cumin","2 tsp smoked paprika","Salt and pepper","2 tbsp olive oil","Burger buns, lettuce, tomato, avocado, sriracha mayo"],
   steps:[{title:"Mix the patty",body:"Combine grated beetroot, mashed black beans, oats, grated onion, garlic, and spices. Mix well. Season. If too wet, add more oats."},{title:"Shape",body:"Form into 4 patties. Refrigerate 15 minutes.",timer:900},{title:"Pan-fry",body:"Cook in oil over medium heat 4-5 minutes per side until a crust forms.",timer:600},{title:"Assemble",body:"Build with lettuce, tomato, avocado, and sriracha mayo."}],
   tip:"Refrigerating the patties before cooking firms them up significantly and prevents them falling apart in the pan."},
  {id:116,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Linguine alle Vongole",emoji:"🐚",xp:100,difficulty:"Medium",time:"25 min",category:"Italian",diets:["Dairy-free"],macros:{calories:490,protein:28,carbs:66,fat:14,fiber:3},done:false,
   ingredients:["400g linguine","1kg fresh clams, scrubbed","150ml dry white wine","4 cloves garlic, sliced","2 tbsp olive oil","1 red chilli, sliced","Large handful flat-leaf parsley","Salt"],
   steps:[{title:"Purge the clams",body:"Soak clams in cold salted water 30 minutes. Discard any that don't close when tapped.",timer:1800},{title:"Cook pasta",body:"Cook linguine in heavily salted water."},{title:"Steam the clams",body:"In a wide pan over high heat, heat oil, garlic, and chilli. Add clams and wine. Cover and cook 3-4 minutes, shaking, until all clams open. Discard any that don't.",timer:240},{title:"Combine",body:"Drain pasta just before al dente. Add to the clam pan. Toss over high heat with a ladleful of pasta water until the sauce coats the linguine. Add parsley."}],
   tip:"The clam liquor released as they open is the sauce. Don't add stock or extra liquid — the clams provide everything."},
  {id:117,photo:"https://images.unsplash.com/photo-1625937330012-a95e53fa47ae?w=600&q=80&fit=crop",name:"Mango Sticky Rice",emoji:"🥭",xp:60,difficulty:"Medium",time:"45 min",category:"Asian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:420,protein:6,carbs:78,fat:10,fiber:4},done:false,
   ingredients:["300g glutinous (sticky) rice","400ml coconut milk","60g caster sugar","½ tsp salt","2 ripe mangoes, peeled and sliced","For the sauce: 100ml coconut milk, 1 tbsp sugar, pinch salt, 1 tsp cornstarch"],
   steps:[{title:"Soak and steam rice",body:"Soak sticky rice overnight. Steam in a bamboo steamer 25-30 minutes until translucent and chewy.",timer:1800},{title:"Make coconut rice",body:"Warm coconut milk, sugar, and salt until dissolved. Pour over hot cooked rice. Stir and let absorb 20 minutes.",timer:1200},{title:"Make the sauce",body:"Heat remaining coconut milk, sugar, and salt. Stir in cornstarch dissolved in a little water. Cook until thickened slightly."},{title:"Serve",body:"Mound sticky rice alongside sliced mango. Drizzle coconut sauce over both."}],
   tip:"The rice must be glutinous (sticky) rice — regular rice doesn't have the right starch content to absorb the coconut milk and become sticky and chewy."},
  {id:118,photo:"https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=600&q=80&fit=crop",name:"Chicken Caesar Wrap",emoji:"🌯",xp:40,difficulty:"Easy",time:"15 min",category:"Quick",diets:["No restrictions"],macros:{calories:520,protein:36,carbs:42,fat:22,fiber:3},done:false,
   ingredients:["2 chicken breasts, grilled and sliced","4 large flour tortillas","1 romaine lettuce, shredded","Caesar dressing: 3 tbsp mayo, 2 tbsp lemon juice, 1 tsp Worcestershire, 1 tsp Dijon, 2 cloves garlic, 3 anchovy fillets (optional), Parmesan","50g Parmesan, shaved","Croutons"],
   steps:[{title:"Make dressing",body:"Blend mayo, lemon juice, Worcestershire, Dijon, garlic, and anchovies until smooth. Season."},{title:"Toss the salad",body:"Toss lettuce with dressing. Don't overdress."},{title:"Assemble",body:"Lay tortilla flat. Add chicken, dressed lettuce, Parmesan shavings, and croutons."},{title:"Roll",body:"Fold in sides, roll tightly. Slice diagonally and serve."}],
   tip:"Warm the tortilla briefly before rolling — it becomes more pliable and wraps without cracking."},
  {id:119,photo:"https://images.unsplash.com/photo-1464347744102-11db6282f854?w=600&q=80&fit=crop",name:"Pavlova",emoji:"🍓",xp:100,difficulty:"Hard",time:"2 hrs",category:"Baking",diets:["Vegetarian","Gluten-free","Dairy-free"],macros:{calories:320,protein:5,carbs:58,fat:8,fiber:2},done:false,
   ingredients:["6 egg whites","350g caster sugar","2 tsp cornstarch","1 tsp white wine vinegar","1 tsp vanilla","For topping: 300ml double cream, whipped, fresh passionfruit, strawberries, kiwi, raspberries"],
   steps:[{title:"Whip the meringue",body:"Beat egg whites to soft peaks. Gradually add sugar a tablespoon at a time, beating constantly until stiff and glossy. Fold in cornstarch, vinegar, and vanilla."},{title:"Shape and bake",body:"Spread on a baking parchment circle — build up the sides to create a well in the centre. Bake at 120°C for 1.5 hours.",timer:5400},{title:"Cool in the oven",body:"Turn off the oven and leave the pavlova inside with the door ajar until completely cool. This prevents cracking.",timer:3600},{title:"Top and serve",body:"Top with whipped cream and all the fruit. Serve immediately — pavlova waits for no one once topped."}],
   tip:"The vinegar and cornstarch create the characteristic marshmallow centre. Don't skip them. The pavlova should have a crisp shell and a soft, chewy, marshmallow interior."},
  {id:120,photo:"https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&q=80&fit=crop",name:"Açaí Bowl",emoji:"🫐",xp:25,difficulty:"Easy",time:"5 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:320,protein:6,carbs:48,fat:12,fiber:8},done:false,
   ingredients:["200g frozen açaí pulp","1 frozen banana","100ml coconut milk","Toppings: granola, sliced banana, fresh berries, coconut flakes, chia seeds, honey or maple syrup"],
   steps:[{title:"Blend",body:"Blend frozen açaí and banana with just enough coconut milk to blend — keep it thick."},{title:"Pour",body:"Pour into a bowl immediately — it melts quickly."},{title:"Top",body:"Working fast, arrange toppings in sections: granola, banana, berries, coconut flakes, chia seeds. Drizzle honey."}],
   tip:"The bowl should be thick enough to eat with a spoon, not a straw. Use the absolute minimum liquid to blend — add more frozen banana to thicken if too runny."},
  {id:121,photo:"https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&q=80&fit=crop",name:"Baklava",emoji:"🍯",xp:110,difficulty:"Hard",time:"1.5 hrs",category:"Baking",diets:["Vegetarian"],macros:{calories:380,protein:6,carbs:44,fat:22,fiber:3},done:false,
   ingredients:["500g filo pastry","300g mixed nuts (pistachios and walnuts), finely chopped","200g unsalted butter, melted","2 tsp cinnamon","For syrup: 300g sugar, 200ml water, 3 tbsp honey, 1 tbsp rose water, 1 tsp lemon juice"],
   steps:[{title:"Prepare nut filling",body:"Mix chopped nuts with cinnamon."},{title:"Layer the baklava",body:"Brush a baking dish with butter. Layer 8 sheets of filo, brushing each with butter. Spread nut filling. Continue layering and buttering filo sheets. Score the top into diamond shapes.",timer:0},{title:"Bake",body:"Bake at 180°C for 35-40 minutes until deeply golden.",timer:2400},{title:"Make syrup",body:"Boil sugar and water 10 minutes. Add honey, rose water, and lemon juice.",timer:600},{title:"Pour syrup",body:"Pour cold syrup over hot baklava. Let absorb completely before serving — at least 2 hours.",timer:7200}],
   tip:"The rule of baklava: hot pastry gets cold syrup, or cold pastry gets hot syrup. Never pour hot syrup over hot baklava — it becomes soggy rather than crisp and sticky."},
  {id:122,photo:"https://images.unsplash.com/photo-1516901121982-4ba246805c56?w=600&q=80&fit=crop",name:"Chicken Pot Pie",emoji:"🥧",xp:110,difficulty:"Medium",time:"1.5 hrs",category:"Comfort",diets:["No restrictions"],macros:{calories:580,protein:30,carbs:44,fat:32,fiber:4},done:false,
   ingredients:["For filling: 600g cooked chicken, diced; 3 carrots, diced; 3 stalks celery, diced; 1 onion, diced; 200g frozen peas; 50g butter; 50g plain flour; 500ml chicken stock; 200ml double cream; fresh thyme; salt and pepper","For pastry: 300g plain flour, 150g cold butter, 1 egg, 2-3 tbsp cold water"],
   steps:[{title:"Make the filling",body:"Cook onion, carrot, celery in butter 8 minutes. Add flour, stir 2 minutes. Add stock gradually, then cream. Simmer until thickened. Add chicken, peas, and thyme. Season well."},{title:"Make shortcrust pastry",body:"Rub butter into flour until breadcrumbs. Add egg and water to form a dough. Chill 30 minutes.",timer:1800},{title:"Assemble",body:"Pour filling into a deep pie dish. Roll pastry to 3mm, cover the dish, seal and crimp edges. Make a steam hole. Brush with egg."},{title:"Bake",body:"Bake at 200°C for 30-35 minutes until golden.",timer:2100}],
   tip:"The filling should be slightly thicker than you think — it will loosen under the pastry as it bakes and the steam makes it more flowing."},
  {id:123,photo:"https://images.unsplash.com/photo-1484723091739-30990106e7a3?w=600&q=80&fit=crop",name:"French Toast",emoji:"🍞",xp:35,difficulty:"Easy",time:"15 min",category:"Breakfast",diets:["Vegetarian"],macros:{calories:420,protein:14,carbs:48,fat:20,fiber:2},done:false,
   ingredients:["4 thick slices brioche or sourdough","3 eggs","100ml whole milk","1 tbsp caster sugar","1 tsp vanilla","½ tsp cinnamon","2 tbsp butter","To serve: maple syrup, icing sugar, fresh berries, crispy bacon"],
   steps:[{title:"Make the custard",body:"Whisk eggs, milk, sugar, vanilla, and cinnamon."},{title:"Soak",body:"Dip bread slices in the custard, letting each side soak for 30 seconds.",timer:60},{title:"Fry",body:"Melt butter in a non-stick pan over medium heat. Cook soaked bread 2-3 minutes per side until golden.",timer:300},{title:"Serve",body:"Dust with icing sugar. Serve with maple syrup, berries, and bacon."}],
   tip:"Thick-sliced brioche is ideal — it absorbs the custard without falling apart and becomes impossibly rich and golden when fried."},
  {id:124,photo:"https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80&fit=crop",name:"Pasta e Fagioli",emoji:"🍝",xp:65,difficulty:"Easy",time:"40 min",category:"Italian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:420,protein:18,carbs:62,fat:10,fiber:14},done:false,
   ingredients:["2×400g cans cannellini beans","200g small pasta (ditalini or broken spaghetti)","1 onion, diced","2 carrots, diced","3 stalks celery, diced","5 cloves garlic","1×400g can chopped tomatoes","1L vegetable stock","2 sprigs rosemary","3 tbsp olive oil","Salt, pepper, Parmesan rind"],
   steps:[{title:"Cook the soffritto",body:"Cook onion, carrot, and celery in olive oil 10 minutes. Add garlic and rosemary.",timer:600},{title:"Add beans and tomatoes",body:"Add tomatoes and one can of beans (drained). Cook 5 minutes. Remove rosemary."},{title:"Blend partially",body:"Blend the other can of beans with some of the liquid to a smooth purée. Add to the pot — this thickens the soup."},{title:"Add pasta and stock",body:"Add stock and Parmesan rind. Bring to a boil. Add pasta and cook 10 minutes.",timer:600},{title:"Serve",body:"Remove Parmesan rind. Season. Serve with a generous drizzle of olive oil."}],
   tip:"Blending one can of beans creates a creamy, thick base without adding cream. This is the Italian way of enriching a bean soup."},
  {id:125,photo:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop",name:"Sweet Potato Curry",emoji:"🍠",xp:65,difficulty:"Easy",time:"35 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:380,protein:10,carbs:52,fat:16,fiber:10},done:false,
   ingredients:["2 large sweet potatoes, peeled and cubed","400ml coconut milk","1×400g can chopped tomatoes","1 can chickpeas, drained","1 onion, diced","4 cloves garlic","1 tsp fresh ginger","2 tsp curry powder","1 tsp turmeric","1 tsp garam masala","3 tbsp coconut oil","Fresh coriander, rice to serve"],
   steps:[{title:"Cook aromatics",body:"Cook onion in coconut oil 8 minutes. Add garlic, ginger, curry powder, and turmeric.",timer:480},{title:"Add vegetables",body:"Add sweet potato and stir to coat in spices."},{title:"Add liquid",body:"Add coconut milk and tomatoes. Bring to a simmer."},{title:"Cook and add chickpeas",body:"Cook 20 minutes until sweet potato is completely tender. Add chickpeas. Simmer 5 more minutes.",timer:1500},{title:"Finish",body:"Add garam masala. Season well. Serve with rice and fresh coriander."}],
   tip:"Sweet potato becomes more flavourful the longer you let it cook in the coconut milk. Don't rush — let it become very tender and begin absorbing the sauce."},
  {id:126,photo:"https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80&fit=crop",name:"Chicken Piccata",emoji:"🍗",xp:70,difficulty:"Medium",time:"25 min",category:"Italian",diets:["No restrictions"],macros:{calories:380,protein:38,carbs:14,fat:20,fiber:1},done:false,
   ingredients:["4 chicken breasts, butterflied and pounded thin","50g plain flour","60ml dry white wine","150ml chicken stock","3 tbsp capers","Juice of 2 lemons","50g cold unsalted butter, cubed","3 tbsp olive oil","Fresh parsley","Salt and pepper"],
   steps:[{title:"Flour the chicken",body:"Season chicken. Dust with flour, shaking off excess."},{title:"Sear",body:"Cook in olive oil over medium-high heat 3 minutes per side until golden and cooked through. Remove.",timer:360},{title:"Make the sauce",body:"Deglaze with wine. Add stock and lemon juice. Simmer 3 minutes.",timer:180},{title:"Finish with butter",body:"Remove from heat. Whisk in cold butter cubes until the sauce emulsifies and becomes glossy."},{title:"Serve",body:"Return chicken to pan. Scatter capers and parsley. Serve immediately with pasta or crusty bread."}],
   tip:"Cold butter whisked into a hot sauce creates an emulsion — this is what makes the sauce silky and glossy. It must go in off the heat; otherwise the butter splits."},
  {id:127,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Tagliatelle with Ragù",emoji:"🍝",xp:130,difficulty:"Hard",time:"3 hrs",category:"Italian",diets:["No restrictions"],macros:{calories:620,protein:36,carbs:68,fat:26,fiber:5},done:false,
   ingredients:["500g fresh tagliatelle or pappardelle","For ragù: 300g ground beef, 200g ground pork, 150g chicken livers (optional but traditional), 150ml dry white wine, 200ml full-fat milk, 400g can whole tomatoes, 1 onion, 2 carrots, 3 stalks celery, 3 cloves garlic, 50g butter, salt, pepper, nutmeg"],
   steps:[{title:"Make the soffritto",body:"Finely dice onion, carrot, and celery. Cook in butter 15 minutes until very soft — this is the base.",timer:900},{title:"Add meat",body:"Add beef and pork, breaking up. Cook until browned. Add chicken livers if using, stir until coloured."},{title:"Add wine and milk",body:"Add wine, simmer until evaporated. Add milk, simmer until evaporated. This is the authentic Bolognese technique — milk tenderises the meat.",timer:600},{title:"Add tomatoes and cook slowly",body:"Add tomatoes. Season with salt, pepper, and a little nutmeg. Simmer on lowest heat for 2-3 hours, stirring occasionally.",timer:7200},{title:"Serve",body:"Toss with freshly cooked pasta and a knob of butter. No cream — ever. Finish with Parmesan."}],
   tip:"Authentic Bolognese uses minimal tomato and cooks for hours. The meat, milk, and wine are the dominant flavours — not tomato. It should be a rich, meaty sauce, not a tomato sauce."},
  {id:128,photo:"https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=600&q=80&fit=crop",name:"Pork Dumplings",emoji:"🥟",xp:100,difficulty:"Medium",time:"1 hr",category:"Asian",diets:["Dairy-free"],macros:{calories:380,protein:22,carbs:42,fat:16,fiber:2},done:false,
   ingredients:["For filling: 400g ground pork, 200g napa cabbage (salted and squeezed), 3 cloves garlic, 1 tsp ginger, 2 tbsp soy sauce, 1 tbsp sesame oil, 1 egg, white pepper","30 round dumpling wrappers","Dipping sauce: 3 tbsp soy sauce, 2 tbsp rice vinegar, 1 tsp chilli oil, sesame seeds"],
   steps:[{title:"Make filling",body:"Combine all filling ingredients. Mix vigorously in one direction until sticky."},{title:"Fold dumplings",body:"Place 1 tsp filling in wrapper centre. Wet edges. Fold in half and pleat one edge against the flat side."},{title:"Steam or boil",body:"Steam in a bamboo steamer 10 minutes, or boil 4-5 minutes until cooked through.",timer:600},{title:"Pan-fry option",body:"For potstickers: fry flat-side down until golden, then steam with 100ml water covered until cooked."},{title:"Serve",body:"Serve with dipping sauce immediately."}],
   tip:"The filling must be mixed until sticky — this activates the proteins in the pork and holds everything together. Don't under-mix."},
  {id:129,photo:"https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80&fit=crop",name:"Waldorf Salad",emoji:"🥗",xp:25,difficulty:"Easy",time:"15 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:280,protein:6,carbs:24,fat:18,fiber:4},done:false,
   ingredients:["2 Granny Smith apples, cored and diced (toss in lemon juice)","3 stalks celery, sliced","80g walnut halves, toasted","100g seedless red grapes, halved","Dressing: 4 tbsp mayonnaise, 2 tbsp Greek yoghurt, 1 tbsp lemon juice, 1 tsp honey, salt and pepper","Lettuce leaves to serve"],
   steps:[{title:"Make the dressing",body:"Whisk mayo, yoghurt, lemon juice, and honey. Season."},{title:"Combine",body:"In a large bowl, gently combine apple, celery, grapes, and walnuts."},{title:"Dress",body:"Add dressing and toss gently. Taste and adjust."},{title:"Serve",body:"Spoon onto lettuce leaves. Serve immediately."}],
   tip:"Toss the apple in lemon juice immediately after cutting to prevent browning. The acid doesn't affect the flavour but keeps the salad looking fresh."},
  {id:130,photo:"https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80&fit=crop",name:"Tom Kha Gai",emoji:"🍲",xp:80,difficulty:"Medium",time:"30 min",category:"Asian",diets:["Gluten-free","Dairy-free"],macros:{calories:320,protein:24,carbs:14,fat:20,fiber:3},done:false,
   ingredients:["400ml coconut milk","400ml chicken stock","400g chicken breast, thinly sliced","200g mushrooms, sliced","3 stalks lemongrass, bashed and cut","5cm galangal or ginger, sliced","5 kaffir lime leaves","3 bird's eye chillies","3 tbsp fish sauce","2 tbsp lime juice","1 tsp palm sugar or brown sugar","Fresh coriander and basil"],
   steps:[{title:"Infuse the broth",body:"Bring stock to a simmer. Add lemongrass, galangal, lime leaves, and chillies. Simmer 15 minutes to infuse.",timer:900},{title:"Add coconut milk",body:"Add coconut milk. Bring back to a gentle simmer."},{title:"Add chicken and mushrooms",body:"Add chicken and mushrooms. Cook 5-6 minutes until chicken is cooked through.",timer:360},{title:"Season",body:"Season with fish sauce, lime juice, and palm sugar. Taste — it should be hot, sour, salty, and fragrant."},{title:"Serve",body:"Ladle into bowls. Add fresh coriander and basil. Serve with rice."}],
   tip:"Don't eat the lemongrass, galangal, or lime leaves — they are flavouring only. Remove them or let guests know to push them aside."},
  {id:131,photo:"https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80&fit=crop",name:"Churros",emoji:"🍩",xp:65,difficulty:"Medium",time:"30 min",category:"Baking",diets:["Vegetarian","Dairy-free"],macros:{calories:380,protein:6,carbs:52,fat:18,fiber:2},done:false,
   ingredients:["250ml water","200g plain flour","1 tsp salt","1 tbsp sugar","1 tbsp olive oil","2 eggs","Oil for deep frying","Cinnamon sugar: 100g caster sugar + 2 tsp cinnamon","Chocolate sauce: 200g dark chocolate, 150ml double cream"],
   steps:[{title:"Make the dough",body:"Bring water, salt, sugar, and oil to a boil. Remove from heat. Beat in flour vigorously until a smooth dough forms. Cool 5 minutes. Beat in eggs one at a time."},{title:"Make chocolate sauce",body:"Heat cream until simmering. Pour over chopped chocolate. Stir until smooth."},{title:"Pipe and fry",body:"Fill a piping bag with star nozzle. Pipe 10cm lengths directly into hot oil (180°C). Fry 3-4 minutes until golden.",timer:240},{title:"Coat and serve",body:"Drain on paper. Roll immediately in cinnamon sugar. Serve with chocolate sauce."}],
   tip:"The dough must be smooth and free of lumps — beat vigorously. The eggs should be beaten in when the dough has cooled slightly, or they'll scramble on contact."},
  {id:132,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Meatballs in Tomato Sauce",emoji:"🍝",xp:85,difficulty:"Medium",time:"50 min",category:"Italian",diets:["No restrictions"],macros:{calories:520,protein:32,carbs:36,fat:28,fiber:4},done:false,
   ingredients:["For meatballs: 500g ground beef, 100g breadcrumbs soaked in milk, 1 egg, 50g Parmesan, 2 cloves garlic minced, large handful parsley, salt, pepper, nutmeg","For sauce: 2×400g cans whole tomatoes, 1 onion, 4 cloves garlic, 3 tbsp olive oil, salt","To serve: spaghetti and Parmesan"],
   steps:[{title:"Make the meatballs",body:"Combine all meatball ingredients. Mix gently — overmixing makes them dense. Form into balls the size of golf balls."},{title:"Brown the meatballs",body:"Fry in batches in olive oil until browned all over. Remove.",timer:480},{title:"Make the sauce",body:"In the same pan cook onion and garlic 5 minutes. Add tomatoes, breaking them up. Season."},{title:"Simmer together",body:"Return meatballs to the sauce. Simmer gently 25 minutes.",timer:1500},{title:"Serve",body:"Serve with spaghetti. Scatter Parmesan."}],
   tip:"The milk-soaked breadcrumbs (panade) make the meatballs tender and moist. This is the Italian secret — never skip it."},
  {id:133,photo:"https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80&fit=crop",name:"Nihari",emoji:"🍖",xp:140,difficulty:"Hard",time:"4 hrs",category:"Indian",diets:["Gluten-free","Dairy-free"],macros:{calories:580,protein:44,carbs:18,fat:36,fiber:4},done:false,
   ingredients:["1kg beef shank or bone-in leg","1 onion, sliced and fried until deep golden (birista)","Nihari spice mix: 2 tsp cumin, 2 tsp coriander, 1 tsp fennel seeds, ½ tsp black pepper, ¼ tsp cloves, 2 cardamoms — grind together","2 tbsp wheat flour or cornflour","1 tsp ginger paste","1 tsp garlic paste","Oil or ghee","Salt","To serve: ginger julienne, fresh coriander, lemon, naan"],
   steps:[{title:"Fry the onions",body:"Deep-fry sliced onions until deep golden brown and crispy. Drain and cool — these are the birista."},{title:"Cook the meat",body:"Brown beef in oil over high heat. Add ginger-garlic paste and spice mix. Stir 2 minutes."},{title:"Slow braise",body:"Add 1.5L water and half the fried onions. Cover and cook on very low heat 3-4 hours until meat is falling from the bone.",timer:10800},{title:"Thicken",body:"Mix flour with water. Add to the pot stirring constantly. Simmer 15 minutes until the broth becomes velvety.",timer:900},{title:"Serve",body:"Top with remaining fried onions, ginger julienne, coriander, and lemon. Serve with naan."}],
   tip:"Nihari is Pakistan's national dish, traditionally eaten for breakfast after the Fajr prayer. The slow overnight cooking makes the bone marrow melt into the broth."},
  {id:134,photo:"https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&q=80&fit=crop",name:"Churros con Chocolate",emoji:"🍫",xp:60,difficulty:"Easy",time:"20 min",category:"Baking",diets:["Vegetarian"],macros:{calories:480,protein:8,carbs:62,fat:24,fiber:3},done:false,
   ingredients:["Store-bought churros or use churros recipe","For thick Spanish hot chocolate: 500ml whole milk, 100g dark chocolate (70%), 20g cornstarch, 50g sugar"],
   steps:[{title:"Make the chocolate",body:"Mix cornstarch with 4 tbsp cold milk. Heat remaining milk with sugar to a simmer. Whisk in the cornstarch mixture. Add chocolate, stir until melted and smooth. Cook 3-4 minutes until thick.",timer:240},{title:"Serve",body:"Pour into cups. Serve with churros for dipping."}],
   tip:"Spanish hot chocolate for churros is intentionally thick — almost like a sauce. It should coat the churros heavily when you dip them, not drip off."},
  {id:135,photo:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&fit=crop",name:"Cheeseburger",emoji:"🍔",xp:75,difficulty:"Medium",time:"20 min",category:"Comfort",diets:["No restrictions"],macros:{calories:680,protein:40,carbs:42,fat:38,fiber:2},done:false,
   ingredients:["500g ground beef (80/20 fat ratio)","4 brioche buns","4 slices American or cheddar cheese","Burger sauce: 3 tbsp mayo, 1 tbsp ketchup, 1 tsp yellow mustard, 1 tsp pickle juice, 1 tsp onion powder","Lettuce, tomato, pickles, onion","Salt and pepper"],
   steps:[{title:"Form the patties",body:"Divide beef into 4 balls. Season generously with salt and pepper — outside only. Don't add anything to the meat itself."},{title:"Cook in a cast-iron pan",body:"Heat a cast-iron pan or griddle until smoking. Place balls and immediately smash flat with a spatula. Cook 2-3 minutes.",timer:180},{title:"Add cheese",body:"Flip patties. Add cheese immediately. Cook 1 minute. The cheese should be completely melted.",timer:60},{title:"Build",body:"Spread sauce on both bun halves. Add lettuce on bottom. Patty. Tomato. Pickles. Onion. Top bun."}],
   tip:"The smash burger technique — flattening a ball of meat — creates maximum crust through Maillard reaction. This edge-to-edge caramelisation is why smash burgers taste different from regular patties."},
  {id:136,photo:"https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80&fit=crop",name:"Banana Bread",emoji:"🍌",xp:50,difficulty:"Easy",time:"1 hr 15 min",category:"Baking",diets:["Vegetarian"],macros:{calories:280,protein:5,carbs:42,fat:11,fiber:2},done:false,
   ingredients:["3 very ripe bananas (black-spotted)","180g plain flour","150g caster sugar","2 eggs","100g unsalted butter, melted","1 tsp baking soda","1 tsp vanilla","½ tsp salt","Optional: 100g walnuts or chocolate chips"],
   steps:[{title:"Mash bananas",body:"Mash bananas in a large bowl until smooth. The riper and blacker, the better — they're sweeter and more flavourful."},{title:"Mix wet ingredients",body:"Add melted butter, sugar, eggs, and vanilla to the mashed banana. Mix well."},{title:"Add dry ingredients",body:"Add flour, baking soda, and salt. Fold until just combined. Add walnuts or chocolate chips if using."},{title:"Bake",body:"Pour into a greased loaf tin. Bake at 175°C for 55-65 minutes until a skewer comes out clean.",timer:3600}],
   tip:"Use the ripest bananas you can find — black and spotted. They're sweeter and more flavourful than yellow ones. Freeze overripe bananas as they become available."},
  {id:137,photo:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop",name:"Chickpea Masala",emoji:"🫘",xp:55,difficulty:"Easy",time:"30 min",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:340,protein:14,carbs:48,fat:12,fiber:12},done:false,
   ingredients:["2×400g cans chickpeas","2×400g cans chopped tomatoes","1 large onion, finely diced","5 cloves garlic","1 tsp fresh ginger","2 tsp garam masala","1 tsp turmeric","1 tsp cumin","1 tsp smoked paprika","3 tbsp neutral oil","Juice of half a lemon","Fresh coriander","Rice or naan"],
   steps:[{title:"Cook aromatics",body:"Cook onion in oil for 10 minutes until golden. Add garlic, ginger, and all spices. Cook 1-2 minutes.",timer:600},{title:"Add tomatoes",body:"Add chopped tomatoes. Simmer 10 minutes until reduced.",timer:600},{title:"Add chickpeas",body:"Drain chickpeas, add to the pan. Simmer 10 more minutes. Mash some chickpeas against the side of the pan to thicken.",timer:600},{title:"Finish",body:"Add lemon juice. Season generously. Top with coriander. Serve with rice or naan."}],
   tip:"Mashing some of the chickpeas directly in the pan thickens the sauce naturally without adding any starch. It also makes the texture more interesting."},
  {id:138,photo:"https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80&fit=crop",name:"Couscous Salad",emoji:"🥗",xp:30,difficulty:"Easy",time:"15 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:320,protein:9,carbs:52,fat:10,fiber:6},done:false,
   ingredients:["250g couscous","300ml hot vegetable stock","1 red pepper, diced","1 cucumber, diced","Large handful cherry tomatoes, halved","80g kalamata olives","Large handful fresh parsley and mint","Dressing: 3 tbsp olive oil, 2 tbsp lemon juice, 1 tsp cumin, salt and pepper"],
   steps:[{title:"Cook couscous",body:"Pour hot stock over couscous. Cover and steam 5 minutes. Fluff with a fork. Allow to cool.",timer:300},{title:"Prepare dressing",body:"Whisk olive oil, lemon juice, and cumin. Season."},{title:"Combine",body:"Mix couscous with all vegetables and herbs. Pour over dressing and toss well."},{title:"Season",body:"Taste — couscous absorbs a lot of salt. Adjust. Serve at room temperature or chilled."}],
   tip:"Season generously — couscous absorbs salt and flavour unevenly and often needs more than you expect."},
  {id:139,photo:"https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80&fit=crop",name:"Focaccia",emoji:"🍞",xp:80,difficulty:"Medium",time:"3 hrs",category:"Baking",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:280,protein:8,carbs:44,fat:9,fiber:2},done:false,
   ingredients:["500g bread flour","7g instant yeast","1 tsp salt","350ml warm water","100ml olive oil, divided","Flaky sea salt","Toppings: rosemary, olives, sliced tomatoes, red onion"],
   steps:[{title:"Make the dough",body:"Mix flour, yeast, salt, water, and 50ml oil until a shaggy dough forms. Cover and rest 30 minutes.",timer:1800},{title:"Stretch and fold",body:"Every 30 minutes for 2 hours, perform 4 stretch-and-folds to build structure.",timer:7200},{title:"Pan and dimple",body:"Pour remaining oil into a 30×40cm tin. Spread the dough to fill. Dimple aggressively with your fingers. Add toppings and scatter flaky salt."},{title:"Final proof",body:"Cover and rest 30 minutes. The dough should be puffy.",timer:1800},{title:"Bake",body:"Bake at 225°C for 20-25 minutes until deeply golden. Cool on a rack.",timer:1500}],
   tip:"The generous amount of olive oil isn't optional — it's what creates the crispy, almost fried bottom crust that makes focaccia different from regular bread."},
  {id:140,photo:"https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&q=80&fit=crop",name:"Crème Caramel",emoji:"🍮",xp:100,difficulty:"Hard",time:"1.5 hrs",category:"Baking",diets:["Vegetarian","Gluten-free"],macros:{calories:360,protein:8,carbs:48,fat:14,fiber:0},done:false,
   ingredients:["For caramel: 200g caster sugar, 3 tbsp water","For custard: 500ml whole milk, 4 eggs, 2 egg yolks, 80g caster sugar, 1 tsp vanilla"],
   steps:[{title:"Make the caramel",body:"Cook sugar and water in a saucepan without stirring until deep amber. Swirl the pan, never stir. Pour immediately into 6 ramekins, tilting to coat the base."},{title:"Make the custard",body:"Warm milk with vanilla. Whisk eggs, yolks, and sugar. Pour warm milk in slowly, whisking constantly. Strain through a sieve."},{title:"Bake in bain-marie",body:"Pour custard into ramekins. Bake in a water bath at 150°C for 30-35 minutes until just set.",timer:2100},{title:"Chill",body:"Refrigerate at least 4 hours or overnight.",timer:14400},{title:"Unmould",body:"Run a thin knife around the edge. Invert onto a plate — the caramel pours over the custard as a sauce."}],
   tip:"The caramel must be deep amber, almost burnt-looking. Pale caramel is too sweet. Dark amber gives the complex, slightly bitter flavour that balances the sweet custard."},
  {id:141,photo:"https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80&fit=crop",name:"Saltimbocca",emoji:"🍖",xp:80,difficulty:"Medium",time:"20 min",category:"Italian",diets:["Gluten-free"],macros:{calories:360,protein:40,carbs:4,fat:22,fiber:0},done:false,
   ingredients:["4 veal or chicken escalopes, pounded thin","4 slices prosciutto","8 fresh sage leaves","50g plain flour","50g butter","100ml dry white wine","Salt and pepper"],
   steps:[{title:"Prepare the escalopes",body:"Place 2 sage leaves on each escalope. Lay prosciutto on top, pressing firmly. Secure with a toothpick if needed. Dust lightly with flour on the plain side only."},{title:"Cook",body:"In hot butter, cook escalopes prosciutto-side down first, 2 minutes until crispy. Flip, cook 1 more minute.",timer:180},{title:"Make the pan sauce",body:"Remove escalopes. Deglaze with white wine, scraping up the brown bits. Reduce by half. Whisk in a knob of cold butter."},{title:"Serve",body:"Plate escalopes, prosciutto-side up. Spoon sauce over. Serve immediately."}],
   tip:"Saltimbocca means 'jump in the mouth' — it should be bold and immediate. The crispy prosciutto and sage together with the white wine butter sauce is one of the great simple combinations in Italian cooking."},
  {id:142,photo:"https://images.unsplash.com/photo-1535400255456-984e675c0f80?w=600&q=80&fit=crop",name:"Borscht",emoji:"🫐",xp:70,difficulty:"Medium",time:"1 hr",category:"Comfort",diets:["Vegetarian","Gluten-free"],macros:{calories:220,protein:8,carbs:32,fat:8,fiber:8},done:false,
   ingredients:["600g raw beetroot, peeled and grated","3 carrots, grated","3 stalks celery, sliced","1 onion, diced","¼ white cabbage, shredded","3 cloves garlic","2 tbsp tomato paste","1.5L vegetable stock","2 tbsp red wine vinegar","1 tsp sugar","3 tbsp neutral oil","Sour cream and dill to serve"],
   steps:[{title:"Sauté vegetables",body:"Cook onion, carrot, and celery in oil for 8 minutes. Add garlic and tomato paste."},{title:"Add beetroot",body:"Add grated beetroot. Cook 5 minutes stirring."},{title:"Add stock and cabbage",body:"Add stock and cabbage. Bring to a boil, reduce and simmer 30 minutes.",timer:1800},{title:"Season",body:"Add vinegar and sugar. Season generously — it should be sweet-sour and earthy."},{title:"Serve",body:"Ladle into bowls. Top with a dollop of sour cream and fresh dill."}],
   tip:"The vinegar and sugar are what make borscht borscht — the sweet-sour balance is essential. Add them at the end to preserve the vibrant red colour."},
  {id:143,photo:"https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80&fit=crop",name:"Gado Gado",emoji:"🥜",xp:70,difficulty:"Medium",time:"30 min",category:"Asian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:420,protein:16,carbs:38,fat:24,fiber:8},done:false,
   ingredients:["2 potatoes, boiled and sliced","2 eggs, hard-boiled","100g green beans, blanched","100g bean sprouts","¼ cabbage, blanched","1 cucumber, sliced","Tofu or tempeh, fried","Peanut sauce: 200g peanut butter, 400ml coconut milk, 2 tbsp soy sauce, 2 tbsp lime juice, 1 tbsp sugar, 2 cloves garlic, 1 tsp chilli","Prawn crackers to serve"],
   steps:[{title:"Make peanut sauce",body:"Blend all peanut sauce ingredients. Heat gently in a pan, adding water to reach pouring consistency. Season."},{title:"Prepare all components",body:"Arrange all vegetables, eggs, and tofu on a large platter."},{title:"Pour and serve",body:"Pour peanut sauce generously over everything. Serve with prawn crackers."}],
   tip:"Gado gado is an Indonesian salad where the peanut sauce is the star. Be generous — it should heavily coat everything, not just drizzle."},
  {id:144,photo:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop",name:"Mujaddara",emoji:"🌿",xp:45,difficulty:"Easy",time:"50 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:380,protein:14,carbs:58,fat:12,fiber:12},done:false,
   ingredients:["300g green or brown lentils","150g long-grain rice","3 large onions, thinly sliced","1 tsp cumin","1 tsp coriander","½ tsp cinnamon","4 tbsp olive oil","Salt","Yoghurt and fresh herbs to serve"],
   steps:[{title:"Caramelise the onions",body:"Cook onions in oil over medium-low heat for 35-40 minutes until deeply golden and caramelised.",timer:2400},{title:"Cook lentils",body:"Boil lentils in salted water until just cooked. Reserve the cooking water."},{title:"Add rice and spices",body:"Add rice, spices, and enough lentil water to cook the rice. Cover and simmer 15-20 minutes.",timer:1200},{title:"Combine",body:"Mix cooked rice and lentils with most of the caramelised onions."},{title:"Serve",body:"Top with remaining crispy onions. Serve with yoghurt and a fresh salad."}],
   tip:"Mujaddara is a Lebanese peasant dish that is dramatically better than its humble ingredients suggest. The caramelised onions are the key — don't rush them."},
  {id:145,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Spaghetti with Clam Sauce",emoji:"🐚",xp:85,difficulty:"Medium",time:"25 min",category:"Italian",diets:["Dairy-free"],macros:{calories:490,protein:26,carbs:66,fat:14,fiber:3},done:false,
   ingredients:["400g spaghetti","2 cans clams in brine","4 cloves garlic, sliced","1 red chilli","100ml dry white wine","3 tbsp olive oil","Large handful flat-leaf parsley","Salt","Lemon to serve"],
   steps:[{title:"Cook pasta",body:"Cook spaghetti in well-salted water."},{title:"Build the sauce",body:"Sauté garlic and chilli in olive oil until golden. Add wine, reduce by half."},{title:"Add clams",body:"Add canned clams with their brine. Simmer 3 minutes.",timer:180},{title:"Combine",body:"Toss drained pasta through the clam sauce with pasta water until glossy. Add parsley and toss."},{title:"Serve",body:"Plate immediately with a squeeze of lemon."}],
   tip:"Canned clams work perfectly for this weeknight version and are pantry staples. Use the brine — it's full of flavour."},
  {id:146,photo:"https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80&fit=crop",name:"Fattoush",emoji:"🥗",xp:35,difficulty:"Easy",time:"15 min",category:"Mediterranean",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:220,protein:5,carbs:28,fat:10,fiber:5},done:false,
   ingredients:["2 pita breads, torn and toasted","4 large tomatoes, roughly chopped","1 cucumber, roughly chopped","4 radishes, sliced","Spring onions, sliced","Large handful flat-leaf parsley and mint","Dressing: 3 tbsp olive oil, 2 tbsp lemon juice, 1 clove garlic, 1 tsp sumac, salt"],
   steps:[{title:"Toast the pita",body:"Toast or bake torn pita until golden and crispy."},{title:"Prepare vegetables",body:"Combine all vegetables and herbs in a bowl."},{title:"Make dressing",body:"Whisk olive oil, lemon juice, garlic, and sumac. Season."},{title:"Combine and serve",body:"Toss vegetables with dressing. Add pita just before serving — it should be crunchy, not soggy."}],
   tip:"Sumac is what makes this distinctly Middle Eastern. Its tangy, lemony flavour is impossible to replicate. Find it at a Middle Eastern grocery."},
  {id:147,photo:"https://images.unsplash.com/photo-1484723091739-30990106e7a3?w=600&q=80&fit=crop",name:"Eggs in Purgatory",emoji:"🥚",xp:40,difficulty:"Easy",time:"20 min",category:"Breakfast",diets:["Vegetarian","Gluten-free","Dairy-free"],macros:{calories:280,protein:16,carbs:20,fat:16,fiber:4},done:false,
   ingredients:["6 eggs","2×400g cans whole tomatoes","4 cloves garlic","1 tsp chilli flakes","3 tbsp olive oil","Fresh basil","Salt","Crusty bread"],
   steps:[{title:"Make the sauce",body:"Cook garlic and chilli in olive oil until golden. Add tomatoes, breaking up. Season. Simmer 10 minutes.",timer:600},{title:"Add eggs",body:"Make wells in the sauce. Crack eggs in. Cover and cook 5-7 minutes until whites are set.",timer:420},{title:"Serve",body:"Top with basil and more olive oil. Serve directly from the pan with bread."}],
   tip:"This is the Italian version of shakshuka — simpler, less spiced, and perfect. The quality of your canned tomatoes matters enormously."},
  {id:148,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Lobster Bisque",emoji:"🦞",xp:150,difficulty:"Hard",time:"2 hrs",category:"Comfort",diets:["Gluten-free"],macros:{calories:380,protein:22,carbs:20,fat:24,fiber:2},done:false,
   ingredients:["2 whole lobsters (or use shells from 600g lobster tails)","1 onion","2 carrots","3 stalks celery","4 cloves garlic","100ml brandy","200ml dry white wine","1L fish stock","200ml double cream","2 tbsp tomato paste","3 tbsp butter","Fresh tarragon","Salt and cayenne"],
   steps:[{title:"Cook and extract lobster",body:"Steam lobster 8 minutes. Remove meat and refrigerate. Keep the shells.",timer:480},{title:"Make the bisque base",body:"Sauté shells in butter with vegetables until pink. Add tomato paste."},{title:"Flambé",body:"Add brandy carefully and flambé. Add wine and reduce."},{title:"Simmer and strain",body:"Add stock. Simmer 40 minutes. Strain through a fine sieve, pressing the shells to extract all flavour.",timer:2400},{title:"Finish",body:"Add cream. Simmer until velvety. Season with salt and cayenne. Add lobster meat back at the end."}],
   tip:"The shells are where the bisque lives. Crushing and cooking them with butter extracts the fat-soluble flavour compounds that give bisque its distinctive richness."},
  {id:149,photo:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80&fit=crop",name:"Dhokla",emoji:"🫓",xp:75,difficulty:"Medium",time:"1 hr",category:"Indian",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:200,protein:8,carbs:32,fat:6,fiber:4},done:false,
   ingredients:["200g chickpea flour (besan)","1 tsp turmeric","1 tsp ginger paste","1 tbsp lemon juice","1 tsp sugar","1.5 tsp Eno fruit salt or baking soda","Salt","For tempering: 2 tbsp oil, 1 tsp mustard seeds, 8-10 curry leaves, 2 green chillies, 1 tbsp sugar dissolved in 100ml water","Fresh coriander and grated coconut"],
   steps:[{title:"Make the batter",body:"Whisk chickpea flour, turmeric, ginger, lemon, sugar, and salt with enough water to make a smooth, thick batter."},{title:"Add Eno and steam",body:"Add Eno and stir quickly. Pour immediately into a greased tin. Steam over boiling water for 20-25 minutes until a toothpick comes out clean.",timer:1500},{title:"Make the tempering",body:"Heat oil. Add mustard seeds. When they pop, add curry leaves and chillies."},{title:"Dress",body:"Pour sugar water over the hot dhokla. Pour tempering over. Scatter coriander and coconut."}],
   tip:"Add Eno and pour into the tin immediately — the fizzing reaction creates all the bubbles that make dhokla light and spongy. Delay makes them flat."},
  {id:150,photo:"https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80&fit=crop",name:"Broccoli Soup",emoji:"🥦",xp:35,difficulty:"Easy",time:"25 min",category:"Healthy",diets:["Vegetarian","Gluten-free"],macros:{calories:200,protein:8,carbs:18,fat:12,fiber:6},done:false,
   ingredients:["1 large head broccoli, cut into florets","1 onion, diced","3 cloves garlic","800ml vegetable stock","100ml double cream","40g mature cheddar, grated","2 tbsp butter","Salt and pepper","Nutmeg"],
   steps:[{title:"Cook aromatics",body:"Melt butter. Cook onion until soft. Add garlic."},{title:"Add broccoli and stock",body:"Add broccoli and stock. Bring to a boil. Simmer 12 minutes until broccoli is very tender.",timer:720},{title:"Blend",body:"Remove from heat. Add cream. Blend until completely smooth."},{title:"Season and serve",body:"Stir in cheddar. Season with salt, pepper, and nutmeg. Serve with crusty bread."}],
   tip:"Blend immediately and don't overcook the broccoli — the vibrant green colour is part of what makes this soup appealing, and it fades quickly."},

  {id:97,photo:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&fit=crop",name:"Anchovy Pasta",emoji:"🍝",xp:45,difficulty:"Easy",time:"20 min",category:"Italian",diets:["Dairy-free"],macros:{calories:480,protein:18,carbs:72,fat:16,fiber:3},done:false,
   ingredients:["400g spaghetti","10 anchovy fillets in oil","4 cloves garlic, finely sliced","1 tsp chilli flakes","3 tbsp extra-virgin olive oil","Large handful fresh parsley","Lemon zest and juice","Salt","Toasted breadcrumbs (optional but excellent)"],
   steps:[{title:"Melt the anchovies",body:"Gently heat olive oil, garlic, and anchovies over low heat. Stir until anchovies completely dissolve — about 5 minutes. Add chilli flakes."},{title:"Cook pasta",body:"Cook spaghetti in heavily salted water until al dente. Reserve 300ml pasta water."},{title:"Combine",body:"Toss drained pasta in the anchovy oil with pasta water until silky and coated."},{title:"Finish",body:"Add parsley, lemon zest, and a squeeze of lemon. Top with toasted breadcrumbs if using — they add crucial texture."}],
   tip:"The melted anchovies are invisible but their flavour permeates everything. People who claim to hate anchovies frequently love this dish — because they can't taste 'anchovy', they taste 'deep, savoury, intensely flavourful pasta'."},
  {id:98,photo:"https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80&fit=crop",name:"Roasted Cauliflower",emoji:"🥦",xp:35,difficulty:"Easy",time:"30 min",category:"Healthy",diets:["Vegan","Vegetarian","Gluten-free","Dairy-free"],macros:{calories:160,protein:6,carbs:18,fat:8,fiber:6},done:false,
   ingredients:["1 large head cauliflower, broken into florets","3 tbsp olive oil","1 tsp smoked paprika","1 tsp cumin","½ tsp garlic powder","Salt and pepper","Optional: tahini sauce, pomegranate seeds, fresh herbs to serve"],
   steps:[{title:"Preheat oven high",body:"Preheat oven to 230°C — it needs to be very hot for proper caramelisation."},{title:"Season and roast",body:"Toss florets with olive oil, smoked paprika, cumin, garlic powder, salt, and pepper. Spread across a large baking tray in a single layer — don't crowd them. Roast 25-30 minutes, tossing once, until deeply golden and charred at the edges.",timer:1800},{title:"Serve",body:"Serve as a side dish or over grains as a main. Drizzle with tahini sauce and scatter pomegranate seeds and fresh herbs if desired."}],
   tip:"Very high heat is the secret. At lower temperatures cauliflower steams and goes soggy. At 230°C it caramelises and the edges char — transforming a bland vegetable into something genuinely craveable."},
  {id:99,photo:"https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=600&q=80&fit=crop",name:"Panzanella",emoji:"🍅",xp:40,difficulty:"Easy",time:"20 min",category:"Italian",diets:["Vegan","Vegetarian","Dairy-free"],macros:{calories:320,protein:8,carbs:42,fat:14,fiber:4},done:false,
   ingredients:["400g stale sourdough or ciabatta, torn into chunks","600g ripe tomatoes, roughly chopped","1 cucumber, deseeded and chopped","1 red onion, thinly sliced and soaked in cold water 10 minutes","Large handful fresh basil","Dressing: 4 tbsp extra-virgin olive oil, 2 tbsp red wine vinegar, 1 tsp Dijon mustard, salt and pepper"],
   steps:[{title:"Toast the bread",body:"Toss bread chunks with a little olive oil. Toast in the oven at 180°C for 10-12 minutes until golden and crunchy but not completely hard.",timer:720},{title:"Prepare vegetables",body:"Combine tomatoes, cucumber, and drained red onion. Season with salt. Let sit 10 minutes to draw out juices."},{title:"Make dressing",body:"Whisk olive oil, red wine vinegar, and mustard. Season."},{title:"Combine",body:"Toss toasted bread with the vegetables and all their juices. Pour over dressing. Tear in basil. Toss well and let sit 10 minutes before serving so the bread absorbs the tomato juices.",timer:600}],
   tip:"This dish is designed for stale bread — fresh bread turns to mush. The bread soaks up the tomato juices and dressing to become the best part of the salad."},
  {id:100,photo:"https://images.unsplash.com/photo-1619894991209-9f9694be045a?w=600&q=80&fit=crop",name:"Creme Brulee",emoji:"🍮",xp:110,difficulty:"Hard",time:"1 hr 30 min",category:"Baking",diets:["Vegetarian","Gluten-free"],macros:{calories:420,protein:7,carbs:28,fat:32,fiber:0},done:false,
   ingredients:["500ml double cream","5 egg yolks","100g caster sugar, plus extra for the topping","1 vanilla pod, split and scraped","Pinch of salt"],
   steps:[{title:"Heat the cream",body:"Warm cream with vanilla pod and seeds until just below a simmer. Remove from heat. Let infuse 10 minutes.",timer:600},{title:"Whisk yolks and sugar",body:"Beat egg yolks and sugar together until pale and slightly thickened."},{title:"Combine",body:"Slowly pour warm cream into the egg mixture, whisking constantly. Do not add it all at once or you will scramble the eggs. Strain through a sieve."},{title:"Bake in a bain-marie",body:"Pour into 6 ramekins. Place in a deep baking dish. Fill with hot water to come halfway up the sides. Bake at 150°C for 30-35 minutes until just set with a wobble in the centre.",timer:2100},{title:"Chill",body:"Cool to room temperature then refrigerate at least 3 hours.",timer:10800},{title:"Brulee",body:"Sprinkle a thin, even layer of sugar over each custard. Use a kitchen torch to caramelise until amber and hard. Serve immediately — the contrast of the cold custard and hot caramel is the point.",timer:0}],
   tip:"The wobble is everything — the custard should jiggle like jelly when you tap the ramekin. If it's completely set in the oven, it will be overcooked. It sets further as it cools in the fridge."},

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
  {id:"p3",user:{name:"Priya K.",  avatar:"👩‍🦱",level:"Intermediate"},recipe:"Miso Ramen",        emoji:"🍜",photo:null,caption:"Homemade tonkotsu broth. 6 hours. My entire flat smells incredible ",                    time:"1d ago", mwah:31,myMwah:false,comments:[{user:"Jake M.",text:"6 hours! Absolute legend"},{user:"Marcus T.",text:"Recipe please 🙏"}]},
  {id:"p4",user:{name:"Marcus T.", avatar:"🧔",  level:"Advanced"},   recipe:"Tarte Tatin",        emoji:"🥧",photo:null,caption:"Third attempt at this. Caramelisation is a discipline. Finally nailed it. #persistence",  time:"2d ago", mwah:19,myMwah:false,comments:[{user:"Priya K.",text:"That colour is everything 🙌"}]},
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
    <div style={{background:C.paper,borderRadius:"24px 24px 0 0",width:"100%",maxHeight:"92vh",overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch",animation:"slideUp .28s cubic-bezier(.4,0,.2,1)"}}>{children}</div>
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
                setToast({emoji:"🛒",title:"Added to grocery list!",subtitle:`${ings.length} ingredients from ${recipe.name}`});
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
                  <button key={n} onClick={()=>setRating(n)} className="tap" style={{fontSize:32,background:"none",border:"none",cursor:"pointer",opacity:n<=rating?1:.3,transition:"opacity .18s"}}>{n<=rating?"⭐":"☆"}</button>
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
function CookLibrary({cookLog,allRecipes,earnedBadges,onShowCalendar}){
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
        {[["log","My Cooks"],["badges","Badges"]].map(([id,lbl])=>(
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
function FeedTab({posts,setPosts,xp,weeklyXp,levelInfo,onAddFriends,onShareInsta}){
  const [activeTab,setActiveTab]=useState("league");
  const [showComments,setShowComments]=useState(null);
  const [newComment,setNewComment]=useState("");
  const league=getLeague(5);

  const giveMwah=(pid)=>{ setPosts(ps=>[...ps.map(p=>p.id!==pid?p:{...p,mwah:p.myMwah?p.mwah-1:p.mwah+1,myMwah:!p.myMwah})]); };
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
          <div style={{width:44,height:44,borderRadius:"50%",background:`${levelInfo.current.color}18`,border:`2px solid ${levelInfo.current.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}></div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:800,fontSize:14,color:C.bark}}>Lv.{levelInfo.current.level} · {levelInfo.current.title}</span>
              {levelInfo.next&&<span style={{fontSize:11,color:C.muted}}>{levelInfo.xpIntoLevel}/{levelInfo.xpForLevel} 🔥 Heat</span>}
            </div>
            <div style={{marginTop:6}}><XPBar pct={levelInfo.pct} color={levelInfo.current.color} h={7}/></div>
            {levelInfo.next&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>Next: {levelInfo.next.title} </div>}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Following</div>
          <button onClick={onAddFriends} className="tap" style={{background:`${C.sage}14`,border:`2px solid ${C.sage}33`,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontWeight:800,fontSize:12,color:C.sage}}>Add Friends</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {posts.map((post,idx)=>(
            <div key={post.id} style={{background:"#fff",borderRadius:20,overflow:"hidden",border:`1px solid ${C.border}`,animation:`fadeUp .35s ease ${idx*.06}s both`,boxShadow:"0 2px 14px rgba(0,0,0,.06)"}}>
              <div style={{padding:"14px 16px 12px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,borderRadius:13,background:`${C.ember}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}><AvatarIcon username={post.user.name} size={36} fontSize={15}/></div>
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
                    <span style={{fontSize:13,fontWeight:800,color:post.myMwah?C.flame:C.muted,border:`1.5px solid ${post.myMwah?C.flame:C.border}`,borderRadius:8,padding:"4px 10px",background:post.myMwah?`${C.flame}10`:"transparent",transition:"all .2s"}}>Mwah</span>
                    <span style={{fontSize:13,fontWeight:700,color:post.myMwah?C.flame:C.muted}}>Mwah {post.mwah}</span>
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
function HomeTab({xp,setXp,recipes,onOpen,onComplete,goal,cookedDays,setCookedDays,challengeProgress,levelInfo,onQuickLog,onShowRecap,onShowCalendar,seasonalEvent,hearts,hasFreeze,setHearts,setHasFreeze}){

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
        {/* Hearts */}
        <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <HeartsBar hearts={hearts} hasFreeze={hasFreeze} onUseFreeze={()=>{if(hasFreeze){setHasFreeze(false);setToast({emoji:"🧊",title:"Streak Frozen!",subtitle:"Your streak is safe for today"});}}}/>
          <span style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>Lose a heart each day you miss your goal</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:14}}>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Total Heat</div><div style={{fontSize:20,fontWeight:900}}>{xp.toLocaleString()}</div></div>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Level</div><div style={{fontSize:20,fontWeight:900}}>{levelInfo.current.title}</div></div>
          <div><div style={{fontSize:10,opacity:.55,textTransform:"uppercase",letterSpacing:".1em"}}>Cooked</div><div style={{fontSize:20,fontWeight:900}}>{recipes.filter(r=>r.done).length}</div></div>
        </div>
      </div>

      {/* Level bar */}
      {levelInfo.next&&(
        <div style={{margin:"0 16px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:C.muted,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"60%"}}>Next: {levelInfo.next.title} </span>
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
          <div style={{fontSize:20,marginBottom:3}}></div>
          <div style={{fontSize:11,fontWeight:800,color:C.bark}}>Weekly Recap</div>
        </button>

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
  :<div style={{width:52,height:52,borderRadius:14,background:r.done?"#E0D5CB":`${C.ember}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{r.done?"✓":r.name?.[0]||"?"}</div>
}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:14,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0}}>{r.name}</div>
                <div style={{display:"flex",gap:8,marginTop:4}}><span style={{fontSize:11,color:C.muted}}>⏱ {r.time}</span><DiffBadge level={r.difficulty}/></div>
                {r.macros&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{r.macros.calories} kcal · {r.macros.protein}g protein</div>}
              </div>
              {!r.done&&(
                <div style={{background:`${C.flame}12`,borderRadius:12,padding:"6px 10px",flexShrink:0}}>
                  <div style={{fontSize:11,fontWeight:800,color:C.flame}}>+{r.xp} 🔥</div>
                </div>
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
  const SORTS=[["default","Default"],["easy","Easiest first"],["cals","Lowest calories"],["protein","Most protein"],["xp","Most Heat"]];
  const [cat,setCat]=useState("All");
  const [diet,setDiet]=useState("All");
  const [sort,setSort]=useState("default");
  const [search,setSearch]=useState("");
  const [showFilters,setShowFilters]=useState(false);

  const filtered=useMemo(()=>{
    let rs=allRecipes.filter(r=>{
      const mc=cat==="All"||r.category===cat;
      const md=diet==="All"||(r.diets||[]).includes(diet);
      return mc&&md&&r.name.toLowerCase().includes(search.toLowerCase());
    });
    if(sort==="cals")   rs=[...rs].sort((a,b)=>(a.macros?.calories||0)-(b.macros?.calories||0));
    if(sort==="protein")rs=[...rs].sort((a,b)=>(b.macros?.protein||0)-(a.macros?.protein||0));
    if(sort==="xp")     rs=[...rs].sort((a,b)=>b.xp-a.xp);
    if(sort==="easy")   rs=[...rs].sort((a,b)=>({Easy:0,Medium:1,Hard:2}[a.difficulty]||0)-({Easy:0,Medium:1,Hard:2}[b.difficulty]||0));
    return rs;
  },[allRecipes,cat,diet,search,sort]);

  const activeFilters = (cat!=="All"?1:0)+(diet!=="All"?1:0)+(sort!=="default"?1:0);
  const sortLabel = SORTS.find(([k])=>k===sort)?.[1]||"Default";

  const resetFilters=()=>{setCat("All");setDiet("All");setSort("default");};

  return(
    <div style={{paddingBottom:24}}>

      {/* Search + Filter bar */}
      <div style={{display:"flex",gap:8,padding:"4px 16px 12px",alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search recipes…"
            style={{width:"100%",padding:"11px 14px",borderRadius:14,border:`2px solid ${search?C.ember:C.border}`,background:C.cream,fontSize:14,color:C.bark,outline:"none",boxSizing:"border-box",transition:"border-color .18s"}}/>
        </div>
        <button onClick={()=>setShowFilters(true)} className="tap" style={{position:"relative",flexShrink:0,background:activeFilters>0?C.bark:C.cream,border:`2px solid ${activeFilters>0?C.bark:C.border}`,borderRadius:14,padding:"11px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontWeight:700,fontSize:13,color:activeFilters>0?"#fff":C.bark,transition:"all .2s"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
          Filter
          {activeFilters>0&&<div style={{position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:C.flame,color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{activeFilters}</div>}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilters>0&&(
        <div style={{display:"flex",gap:8,padding:"0 16px 12px",flexWrap:"wrap",alignItems:"center"}}>
          {cat!=="All"&&<div style={{display:"flex",alignItems:"center",gap:5,background:C.bark,borderRadius:99,padding:"4px 10px 4px 12px"}}><span style={{fontSize:12,color:"#fff",fontWeight:700}}>{cat}</span><button onClick={()=>setCat("All")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:"50%",width:16,height:16,cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button></div>}
          {diet!=="All"&&<div style={{display:"flex",alignItems:"center",gap:5,background:C.bark,borderRadius:99,padding:"4px 10px 4px 12px"}}><span style={{fontSize:12,color:"#fff",fontWeight:700}}>{diet}</span><button onClick={()=>setDiet("All")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:"50%",width:16,height:16,cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button></div>}
          {sort!=="default"&&<div style={{display:"flex",alignItems:"center",gap:5,background:C.bark,borderRadius:99,padding:"4px 10px 4px 12px"}}><span style={{fontSize:12,color:"#fff",fontWeight:700}}>{sortLabel}</span><button onClick={()=>setSort("default")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:"50%",width:16,height:16,cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button></div>}
          <button onClick={resetFilters} style={{background:"none",border:"none",fontSize:12,color:C.flame,fontWeight:700,cursor:"pointer",padding:"4px 0"}}>Clear all</button>
        </div>
      )}

      {/* Results count + Create/Import */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 16px",marginBottom:12}}>
        <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{filtered.length} recipe{filtered.length!==1?"s":""}</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onShowCreate} className="tap" style={{background:`${C.sage}14`,border:`1.5px solid ${C.sage}33`,borderRadius:10,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:12,color:C.sage}}>+ Create</button>
          <button onClick={onShowImport} className="tap" style={{background:`${C.sky}14`,border:`1.5px solid ${C.sky}33`,borderRadius:10,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:12,color:C.sky}}>Import URL</button>
        </div>
      </div>

      {/* Recipe list */}
      <div style={{padding:"0 16px"}}>
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}>
            <div style={{fontWeight:700,marginBottom:4}}>No recipes match</div>
            <div style={{fontSize:13}}>Try adjusting your filters</div>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((r,idx)=>(
            <div key={r.id} className="ch" onClick={()=>onOpen(r)}
              style={{background:r.done?"#F5F0EB":C.cream,border:`2px solid ${r.done?"#E0D5CB":C.border}`,borderRadius:18,padding:"15px",display:"flex",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)",animation:`fadeUp .3s ease ${idx*.04}s both`,transition:"transform .18s,box-shadow .18s"}}>
              {r.photo&&!r.done
                ?<img src={r.photo} alt={r.name} style={{width:58,height:58,borderRadius:16,objectFit:"cover",flexShrink:0}}/>
                :<div style={{width:58,height:58,borderRadius:16,background:r.done?"#E8E0D8":`${C.ember}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{r.done?"✓":r.emoji}</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:15,color:C.bark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:5}}>{r.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:5}}>
                  <DiffBadge level={r.difficulty}/>
                  {(r.diets||[]).filter(d=>d!=="No restrictions").slice(0,2).map(d=><Chip key={d} label={d} color={C.sage}/>)}
                </div>
                {r.macros&&(
                  <div style={{display:"flex",gap:10,marginBottom:5}}>
                    <span style={{fontSize:11,color:C.muted}}>{r.macros.calories} kcal</span>
                    <span style={{fontSize:11,color:C.muted}}>{r.macros.protein}g protein</span>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:C.muted}}>⏱ {r.time}</span>
                  <span style={{fontSize:12,fontWeight:800,color:r.done?C.sage:C.flame}}>{r.done?"✓ Cooked":`+${r.xp} 🔥`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bottom sheet */}
      {showFilters&&(
        <Sheet onClose={()=>setShowFilters(false)}>
          <div style={{padding:"24px 20px 44px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Filter Recipes</div>
              <CloseBtn onClose={()=>setShowFilters(false)}/>
            </div>

            {/* Cuisine */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Cuisine</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {CATS.map(name=>(
                  <button key={name} onClick={()=>setCat(name)} className="tap"
                    style={{padding:"8px 14px",borderRadius:99,border:`2px solid ${cat===name?C.flame:C.border}`,background:cat===name?C.flame:"transparent",color:cat===name?"#fff":C.bark,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s"}}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Dietary</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {DIETS.map(d=>(
                  <button key={d} onClick={()=>setDiet(d)} className="tap"
                    style={{padding:"8px 14px",borderRadius:99,border:`2px solid ${diet===d?C.sage:C.border}`,background:diet===d?C.sage:"transparent",color:diet===d?"#fff":C.bark,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s"}}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Sort by</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {SORTS.map(([k,l])=>(
                  <button key={k} onClick={()=>setSort(k)} className="tap"
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:14,border:`2px solid ${sort===k?C.sky:C.border}`,background:sort===k?`${C.sky}08`:"transparent",cursor:"pointer",transition:"all .15s"}}>
                    <span style={{fontWeight:sort===k?800:600,fontSize:14,color:sort===k?C.sky:C.bark}}>{l}</span>
                    {sort===k&&<div style={{width:18,height:18,borderRadius:"50%",background:C.sky,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={resetFilters} className="tap" style={{flex:1,padding:"13px",borderRadius:14,border:`2px solid ${C.border}`,background:"transparent",color:C.muted,fontWeight:700,fontSize:14,cursor:"pointer"}}>Reset</button>
              <Btn onClick={()=>setShowFilters(false)} style={{flex:2}}>Show {filtered.length} recipes</Btn>
            </div>
          </div>
        </Sheet>
      )}
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
                <div style={{width:48,height:48,borderRadius:14,background:a?g.color:`${g.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}></div>
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
                {CATS.map(cat=><button key={cat} onClick={()=>setCategory(cat)} style={{padding:"6px 12px",borderRadius:99,border:`2px solid ${category===cat?C.sage:C.border}`,background:category===cat?C.sage:"transparent",color:category===cat?"#fff":C.muted,fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s"}}>{catName}</button>)}
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
      const proxyUrl=`https://corsproxy.io/?${encodeURIComponent(url)}`;
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Share Your Dish</div>
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Quick Log</div>
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Add Friends</div>
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Cooking History</div>
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
            <div style={{fontWeight:900,fontSize:20,color:C.bark,fontFamily:DF}}>Weekly Recap</div>
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
            <div style={{fontSize:22}}></div>
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

/* ═══ PROFILE TAB ══════════════════════════════════════════════════════════ */
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

/* ═══ SETTINGS SHEET ═══════════════════════════════════════════════════════ */
/* ═══ SIDE DRAWER SECTIONS ══════════════════════════════════════════════════ */
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

/* ═══ SIDE DRAWER ════════════════════════════════════════════════════════════ */
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


/* ═══ ACCOUNT SETTINGS ═══════════════════════════════════════════════════════ */
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


/* ═══ COMMUNITY RECIPES TAB ════════════════════════════════════════════════ */
function CommunityTab({allRecipes,onOpen,onSaveToLibrary}){
  const [filter,setFilter]=useState("all");
  const [sortBy,setSortBy]=useState("popular");
  const [selected,setSelected]=useState(null);

  // Unsplash food photos — free to use, no attribution required under Unsplash license
  const COMMUNITY_RECIPES=[
    {id:"c1",name:"Grandma's Carbonara",emoji:"🍝",
     photo:"https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&q=80&fit=crop&auto=format",
     author:"Sofia R.",avatar:"👩‍🍳",rating:4.8,saves:124,category:"Italian",difficulty:"Medium",time:"25 min",xp:80,
     desc:"The real deal — no cream, ever. My grandmother's recipe from Naples, unchanged for 40 years.",reviews:42},
    {id:"c2",name:"Spicy Miso Ramen",emoji:"🍜",
     photo:"https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80&fit=crop&auto=format",
     author:"Jake M.",avatar:"🧑‍🍳",rating:4.9,saves:89,category:"Japanese",difficulty:"Hard",time:"2 hrs",xp:130,
     desc:"6 hours of love. Real tonkotsu broth, chashu pork, soft egg. Worth every minute.",reviews:31},
    {id:"c3",name:"Mum's Butter Chicken",emoji:"🍗",
     photo:"https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80&fit=crop&auto=format",
     author:"Priya K.",avatar:"👩‍🦱",rating:4.7,saves:203,category:"Indian",difficulty:"Medium",time:"1 hr",xp:100,
     desc:"Not the restaurant version. The one my mum made every Sunday. The secret is whole spices toasted fresh.",reviews:78},
    {id:"c4",name:"Crispy Roast Potatoes",emoji:"🥔",
     photo:"https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80&fit=crop&auto=format",
     author:"Marcus T.",avatar:"🧔",rating:4.6,saves:156,category:"Comfort",difficulty:"Easy",time:"1h 20m",xp:60,
     desc:"The crunchiest roast potatoes you will ever eat. Parboil, rough up the edges, screaming hot oven.",reviews:55},
    {id:"c5",name:"Açaí Power Bowl",emoji:"🫐",
     photo:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&fit=crop&auto=format",
     author:"Yuki A.",avatar:"👩",rating:4.5,saves:67,category:"Healthy",difficulty:"Easy",time:"10 min",xp:35,
     desc:"Morning ritual. Frozen açaí, oat milk, banana, topped with granola and everything good.",reviews:23},
    {id:"c6",name:"Tres Leches Cake",emoji:"🎂",
     photo:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop&auto=format",
     author:"Liam B.",avatar:"👨",rating:4.8,saves:112,category:"Baking",difficulty:"Medium",time:"1 hr",xp:90,
     desc:"Soaked in three milks overnight. The most tender, creamy cake you have ever had.",reviews:44},
    {id:"c7",name:"Thai Basil Fried Rice",emoji:"🍚",
     photo:"https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop&auto=format",
     author:"Sofia R.",avatar:"👩‍🍳",rating:4.6,saves:98,category:"Asian",difficulty:"Easy",time:"15 min",xp:55,
     desc:"Proper Thai street food at home. Day-old rice, holy basil, a fried egg on top. Done in 15 minutes.",reviews:36},
    {id:"c8",name:"Shakshuka with Feta",emoji:"🍳",
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


/* ═══ WANT TO COOK SHEET ════════════════════════════════════════════════════ */
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

/* ═══ YEAR IN REVIEW ════════════════════════════════════════════════════════ */
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
            {[["🍳",totalCooked,"Dishes Cooked"],["🔥",totalHeat,"Total Heat Earned"],["🌍",cuisines.length,"Cuisines Explored"],["🏅",earnedBadges.length,"Badges Earned"]].map(([icon,val,label])=>(
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

/* ═══ STAR RATING ═══════════════════════════════════════════════════════════ */
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


/* ═══ AVATAR ICON (initials-based) ══════════════════════════════════════════ */
const AVATAR_COLORS = ['#E05C7A','#4A90D9','#5C7A4E','#FF8C42','#9B5DE5','#F5C842','#FF4D1C','#CC2200','#4A90D9','#8BAF78','#E05C7A','#FF8C42'];
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


/* ═══ ROOT APP ════════════════════════════════════════════════════════════ */
export default function App(){
  const { user, profile, loading, saveXp, logCompletedRecipe, signOut, supabase } = useAuth();
  const userIdRef = useRef<string|null>(null);
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

  const toggleWantToCook=(recipeId:number)=>{
    setWantToCook(w=>w.includes(recipeId)?w.filter(id=>id!==recipeId):[...w,recipeId]);
  };

  const saveToLibrary=(communityRecipe:any)=>{
    const r={...communityRecipe,id:Date.now(),done:false,isImported:true,
      ingredients:[],steps:[],tip:null};
    setAllRecipes(rs=>[r,...rs]);
    setToast({emoji:"💾",title:"Saved!",subtitle:`${communityRecipe.name} added to your recipes`});
  };

  const effectiveProfile = localProfile || profile;

  const handleProfileUpdate = (updated:any) => {
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
          {!detailRecipe&&tab==="library"&&<CookLibrary cookLog={cookLog} allRecipes={allRecipes} earnedBadges={earnedBadges} onShowCalendar={()=>setShowCalendar(true)}/>}
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