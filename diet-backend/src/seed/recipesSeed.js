/**
 * Recipes Seed Script
 * Inserts 40 recipes into the recipes table.
 * Run: node src/seed/recipesSeed.js
 */

require('dotenv').config();
const pool = require('../config/db');

const recipes = [
  // ── Batch 1 (1–20) ──────────────────────────────────────────────────────────
  {
    name: 'Honey Garlic Chicken Stir Fry',
    calories: 480,
    prep_time_min: 30,
    instructions: 'Stir fry chicken pieces in honey garlic sauce with mixed vegetables until cooked through. Serve over rice.',
    image_url: 'https://source.unsplash.com/featured/?honey-garlic-chicken',
    video_url: 'https://www.youtube.com/results?search_query=Honey+Garlic+Chicken+Stir+Fry',
    thumbnail_url: 'https://source.unsplash.com/featured/?honey-garlic-chicken',
  },
  {
    name: 'Egg White Scramble with Veggies',
    calories: 220,
    prep_time_min: 10,
    instructions: 'Whisk egg whites and scramble with diced bell peppers, spinach, and onions. Season with salt and pepper.',
    image_url: 'https://source.unsplash.com/featured/?egg-scramble',
    video_url: 'https://www.youtube.com/results?search_query=Egg+White+Scramble+with+Veggies',
    thumbnail_url: 'https://source.unsplash.com/featured/?egg-scramble',
  },
  {
    name: 'High Protein Overnight Oats',
    calories: 440,
    prep_time_min: 5,
    instructions: 'Mix oats, protein powder, Greek yogurt, and milk. Refrigerate overnight. Top with berries and nut butter.',
    image_url: 'https://source.unsplash.com/featured/?overnight-oats',
    video_url: 'https://www.youtube.com/results?search_query=High+Protein+Overnight+Oats',
    thumbnail_url: 'https://source.unsplash.com/featured/?overnight-oats',
  },
  {
    name: 'Tuna Avocado Wrap',
    calories: 420,
    prep_time_min: 5,
    instructions: 'Mix canned tuna with diced avocado, lemon juice, and seasoning. Wrap in a whole wheat tortilla with lettuce.',
    image_url: 'https://source.unsplash.com/featured/?tuna-wrap',
    video_url: 'https://www.youtube.com/results?search_query=Tuna+Avocado+Wrap',
    thumbnail_url: 'https://source.unsplash.com/featured/?tuna-wrap',
  },
  {
    name: 'Banana Protein Smoothie Bowl',
    calories: 440,
    prep_time_min: 5,
    instructions: 'Blend frozen banana with protein powder and almond milk. Pour into a bowl and top with granola, berries, and seeds.',
    image_url: 'https://source.unsplash.com/featured/?smoothie-bowl',
    video_url: 'https://www.youtube.com/results?search_query=Banana+Protein+Smoothie+Bowl',
    thumbnail_url: 'https://source.unsplash.com/featured/?smoothie-bowl',
  },
  {
    name: 'Cottage Cheese Protein Bowl',
    calories: 380,
    prep_time_min: 5,
    instructions: 'Top cottage cheese with fresh fruit, honey, walnuts, and a sprinkle of cinnamon for a high-protein meal.',
    image_url: 'https://source.unsplash.com/featured/?cottage-cheese',
    video_url: 'https://www.youtube.com/results?search_query=Cottage+Cheese+Protein+Bowl',
    thumbnail_url: 'https://source.unsplash.com/featured/?cottage-cheese',
  },
  {
    name: 'Scrambled Eggs with Spinach & Feta',
    calories: 280,
    prep_time_min: 5,
    instructions: 'Scramble eggs with fresh spinach and crumbled feta cheese. Season with herbs and serve with whole-grain toast.',
    image_url: 'https://source.unsplash.com/featured/?scrambled-eggs',
    video_url: 'https://www.youtube.com/results?search_query=Scrambled+Eggs+Spinach+Feta',
    thumbnail_url: 'https://source.unsplash.com/featured/?scrambled-eggs',
  },
  {
    name: 'Avocado Toast with Eggs',
    calories: 420,
    prep_time_min: 10,
    instructions: 'Toast whole-grain bread. Top with mashed avocado, a poached or fried egg, and red pepper flakes.',
    image_url: 'https://source.unsplash.com/featured/?avocado-toast',
    video_url: 'https://www.youtube.com/results?search_query=Avocado+Toast+with+Eggs',
    thumbnail_url: 'https://source.unsplash.com/featured/?avocado-toast',
  },
  {
    name: 'Caprese Pasta',
    calories: 520,
    prep_time_min: 15,
    instructions: 'Cook pasta and toss with fresh tomatoes, mozzarella, basil, olive oil, and balsamic glaze.',
    image_url: 'https://source.unsplash.com/featured/?caprese-pasta',
    video_url: 'https://www.youtube.com/results?search_query=Caprese+Pasta',
    thumbnail_url: 'https://source.unsplash.com/featured/?caprese-pasta',
  },
  {
    name: 'Greek Quinoa Salad',
    calories: 420,
    prep_time_min: 15,
    instructions: 'Combine cooked quinoa with cucumbers, tomatoes, olives, red onion, and feta. Dress with lemon and olive oil.',
    image_url: 'https://source.unsplash.com/featured/?quinoa-salad',
    video_url: 'https://www.youtube.com/results?search_query=Greek+Quinoa+Salad',
    thumbnail_url: 'https://source.unsplash.com/featured/?quinoa-salad',
  },
  {
    name: 'Protein Pancakes',
    calories: 380,
    prep_time_min: 10,
    instructions: 'Mix protein powder, oats, banana, and eggs. Cook on a non-stick pan. Serve with berries and maple syrup.',
    image_url: 'https://source.unsplash.com/featured/?protein-pancakes',
    video_url: 'https://www.youtube.com/results?search_query=Protein+Pancakes',
    thumbnail_url: 'https://source.unsplash.com/featured/?protein-pancakes',
  },
  {
    name: 'Crispy Tofu Vegetable Stir Fry',
    calories: 350,
    prep_time_min: 20,
    instructions: 'Press and cube tofu, fry until crispy. Stir-fry with mixed vegetables in soy-ginger sauce. Serve over rice.',
    image_url: 'https://source.unsplash.com/featured/?tofu-stir-fry',
    video_url: 'https://www.youtube.com/results?search_query=Crispy+Tofu+Vegetable+Stir+Fry',
    thumbnail_url: 'https://source.unsplash.com/featured/?tofu-stir-fry',
  },
  {
    name: 'Mediterranean Tuna Salad',
    calories: 320,
    prep_time_min: 10,
    instructions: 'Mix canned tuna with olives, capers, tomatoes, cucumber, and lemon-herb dressing. Serve over greens.',
    image_url: 'https://source.unsplash.com/featured/?tuna-salad',
    video_url: 'https://www.youtube.com/results?search_query=Mediterranean+Tuna+Salad',
    thumbnail_url: 'https://source.unsplash.com/featured/?tuna-salad',
  },
  {
    name: 'Blackened Tilapia Fish Tacos',
    calories: 420,
    prep_time_min: 15,
    instructions: 'Season tilapia with blackening spices and cook in a hot pan. Serve in corn tortillas with slaw and lime crema.',
    image_url: 'https://source.unsplash.com/featured/?fish-tacos',
    video_url: 'https://www.youtube.com/results?search_query=Blackened+Tilapia+Fish+Tacos',
    thumbnail_url: 'https://source.unsplash.com/featured/?fish-tacos',
  },
  {
    name: 'Garlic Shrimp with Zucchini Noodles',
    calories: 280,
    prep_time_min: 15,
    instructions: 'Sauté shrimp in garlic butter. Spiralize zucchini and toss together. Finish with lemon juice and parsley.',
    image_url: 'https://source.unsplash.com/featured/?garlic-shrimp',
    video_url: 'https://www.youtube.com/results?search_query=Garlic+Shrimp+Zucchini+Noodles',
    thumbnail_url: 'https://source.unsplash.com/featured/?garlic-shrimp',
  },
  {
    name: 'Lemon Butter Salmon',
    calories: 420,
    prep_time_min: 15,
    instructions: 'Pan-sear salmon fillet in lemon butter sauce with garlic and capers. Serve with steamed vegetables.',
    image_url: 'https://source.unsplash.com/featured/?salmon',
    video_url: 'https://www.youtube.com/results?search_query=Lemon+Butter+Salmon',
    thumbnail_url: 'https://source.unsplash.com/featured/?salmon',
  },
  {
    name: 'Shrimp Fried Rice',
    calories: 480,
    prep_time_min: 15,
    instructions: 'Stir-fry cooked rice with shrimp, eggs, peas, carrots, and soy sauce in a hot wok until golden.',
    image_url: 'https://source.unsplash.com/featured/?shrimp-fried-rice',
    video_url: 'https://www.youtube.com/results?search_query=Shrimp+Fried+Rice',
    thumbnail_url: 'https://source.unsplash.com/featured/?shrimp-fried-rice',
  },
  {
    name: 'Asian Turkey Lettuce Wraps',
    calories: 280,
    prep_time_min: 15,
    instructions: 'Cook ground turkey with hoisin, ginger, and garlic. Spoon into butter lettuce leaves and top with water chestnuts.',
    image_url: 'https://source.unsplash.com/featured/?lettuce-wraps',
    video_url: 'https://www.youtube.com/results?search_query=Turkey+Lettuce+Wraps',
    thumbnail_url: 'https://source.unsplash.com/featured/?lettuce-wraps',
  },
  {
    name: 'Beef and Broccoli',
    calories: 420,
    prep_time_min: 20,
    instructions: 'Slice beef thinly and stir-fry with broccoli in a savory oyster and soy sauce. Serve over steamed rice.',
    image_url: 'https://source.unsplash.com/featured/?beef-broccoli',
    video_url: 'https://www.youtube.com/results?search_query=Beef+and+Broccoli',
    thumbnail_url: 'https://source.unsplash.com/featured/?beef-broccoli',
  },
  {
    name: 'One-Pan Chicken Fajitas',
    calories: 380,
    prep_time_min: 20,
    instructions: 'Season chicken strips with fajita spices and cook on a hot pan with bell peppers and onions. Serve in warm tortillas.',
    image_url: 'https://source.unsplash.com/featured/?chicken-fajitas',
    video_url: 'https://www.youtube.com/results?search_query=One+Pan+Chicken+Fajitas',
    thumbnail_url: 'https://source.unsplash.com/featured/?chicken-fajitas',
  },

  // ── Batch 2 (21–40) ─────────────────────────────────────────────────────────
  {
    name: 'Chicken Caesar Salad',
    calories: 450,
    prep_time_min: 15,
    instructions: 'Grill chicken breast and slice over romaine lettuce with Caesar dressing, croutons, and Parmesan cheese.',
    image_url: 'https://source.unsplash.com/featured/?chicken-caesar-salad',
    video_url: 'https://www.youtube.com/results?search_query=Chicken+Caesar+Salad',
    thumbnail_url: 'https://source.unsplash.com/featured/?chicken-caesar-salad',
  },
  {
    name: 'Turkey Meatballs with Rice',
    calories: 520,
    prep_time_min: 30,
    instructions: 'Form ground turkey into meatballs with herbs and bake. Serve over fluffy white rice with marinara sauce.',
    image_url: 'https://source.unsplash.com/featured/?turkey-meatballs',
    video_url: 'https://www.youtube.com/results?search_query=Turkey+Meatballs+with+Rice',
    thumbnail_url: 'https://source.unsplash.com/featured/?turkey-meatballs',
  },
  {
    name: 'Grilled Chicken Burrito Bowl',
    calories: 580,
    prep_time_min: 25,
    instructions: 'Build a bowl with cilantro-lime rice, grilled chicken, black beans, corn, salsa, and guacamole.',
    image_url: 'https://source.unsplash.com/featured/?burrito-bowl',
    video_url: 'https://www.youtube.com/results?search_query=Grilled+Chicken+Burrito+Bowl',
    thumbnail_url: 'https://source.unsplash.com/featured/?burrito-bowl',
  },
  {
    name: 'Vegetable Omelette',
    calories: 250,
    prep_time_min: 10,
    instructions: 'Beat eggs and pour into a hot pan. Fill with sautéed mushrooms, peppers, onions, and cheese. Fold and serve.',
    image_url: 'https://source.unsplash.com/featured/?vegetable-omelette',
    video_url: 'https://www.youtube.com/results?search_query=Vegetable+Omelette',
    thumbnail_url: 'https://source.unsplash.com/featured/?vegetable-omelette',
  },
  {
    name: 'Chicken Alfredo Pasta',
    calories: 650,
    prep_time_min: 30,
    instructions: 'Cook fettuccine and toss with a creamy Parmesan Alfredo sauce and pan-seared chicken breast slices.',
    image_url: 'https://source.unsplash.com/featured/?chicken-alfredo',
    video_url: 'https://www.youtube.com/results?search_query=Chicken+Alfredo+Pasta',
    thumbnail_url: 'https://source.unsplash.com/featured/?chicken-alfredo',
  },
  {
    name: 'BBQ Chicken Pizza',
    calories: 720,
    prep_time_min: 40,
    instructions: 'Spread BBQ sauce on pizza dough, top with shredded chicken, red onion, mozzarella, and cilantro. Bake until golden.',
    image_url: 'https://source.unsplash.com/featured/?bbq-chicken-pizza',
    video_url: 'https://www.youtube.com/results?search_query=BBQ+Chicken+Pizza',
    thumbnail_url: 'https://source.unsplash.com/featured/?bbq-chicken-pizza',
  },
  {
    name: 'Beef Tacos',
    calories: 520,
    prep_time_min: 20,
    instructions: 'Brown seasoned ground beef and serve in warm corn tortillas with shredded cheese, lettuce, tomato, and sour cream.',
    image_url: 'https://source.unsplash.com/featured/?beef-tacos',
    video_url: 'https://www.youtube.com/results?search_query=Beef+Tacos',
    thumbnail_url: 'https://source.unsplash.com/featured/?beef-tacos',
  },
  {
    name: 'Mushroom Risotto',
    calories: 480,
    prep_time_min: 35,
    instructions: 'Slowly add warm broth to arborio rice, stirring continuously. Fold in sautéed mushrooms, butter, and Parmesan.',
    image_url: 'https://source.unsplash.com/featured/?mushroom-risotto',
    video_url: 'https://www.youtube.com/results?search_query=Mushroom+Risotto',
    thumbnail_url: 'https://source.unsplash.com/featured/?mushroom-risotto',
  },
  {
    name: 'Baked Cod with Vegetables',
    calories: 320,
    prep_time_min: 25,
    instructions: 'Place cod fillets on a sheet pan with seasoned vegetables. Drizzle with olive oil and bake until flaky.',
    image_url: 'https://source.unsplash.com/featured/?baked-cod',
    video_url: 'https://www.youtube.com/results?search_query=Baked+Cod+with+Vegetables',
    thumbnail_url: 'https://source.unsplash.com/featured/?baked-cod',
  },
  {
    name: 'Chicken Noodle Soup',
    calories: 290,
    prep_time_min: 35,
    instructions: 'Simmer chicken with carrots, celery, and onion in broth. Add egg noodles and cook until tender. Season to taste.',
    image_url: 'https://source.unsplash.com/featured/?chicken-noodle-soup',
    video_url: 'https://www.youtube.com/results?search_query=Chicken+Noodle+Soup',
    thumbnail_url: 'https://source.unsplash.com/featured/?chicken-noodle-soup',
  },
  {
    name: 'Beef Chili',
    calories: 460,
    prep_time_min: 45,
    instructions: 'Brown ground beef with onions and garlic. Add kidney beans, tomatoes, and chili spices. Simmer for 30 minutes.',
    image_url: 'https://source.unsplash.com/featured/?beef-chili',
    video_url: 'https://www.youtube.com/results?search_query=Beef+Chili',
    thumbnail_url: 'https://source.unsplash.com/featured/?beef-chili',
  },
  {
    name: 'Chicken Teriyaki Bowl',
    calories: 540,
    prep_time_min: 25,
    instructions: 'Glaze chicken thighs in homemade teriyaki sauce and broil until caramelized. Serve over steamed rice with broccoli.',
    image_url: 'https://source.unsplash.com/featured/?teriyaki-chicken',
    video_url: 'https://www.youtube.com/results?search_query=Chicken+Teriyaki+Bowl',
    thumbnail_url: 'https://source.unsplash.com/featured/?teriyaki-chicken',
  },
  {
    name: 'Lentil Soup',
    calories: 280,
    prep_time_min: 30,
    instructions: 'Sauté onions and garlic, add red lentils, diced tomatoes, cumin, and broth. Simmer until lentils are creamy.',
    image_url: 'https://source.unsplash.com/featured/?lentil-soup',
    video_url: 'https://www.youtube.com/results?search_query=Lentil+Soup',
    thumbnail_url: 'https://source.unsplash.com/featured/?lentil-soup',
  },
  {
    name: 'Stuffed Bell Peppers',
    calories: 390,
    prep_time_min: 40,
    instructions: 'Fill halved bell peppers with seasoned ground beef, rice, and tomato sauce. Bake covered until peppers are tender.',
    image_url: 'https://source.unsplash.com/featured/?stuffed-peppers',
    video_url: 'https://www.youtube.com/results?search_query=Stuffed+Bell+Peppers',
    thumbnail_url: 'https://source.unsplash.com/featured/?stuffed-peppers',
  },
  {
    name: 'Garlic Butter Steak Bites',
    calories: 510,
    prep_time_min: 20,
    instructions: 'Cut sirloin into cubes and sear in a hot skillet. Toss with garlic butter, thyme, and rosemary. Serve immediately.',
    image_url: 'https://source.unsplash.com/featured/?steak-bites',
    video_url: 'https://www.youtube.com/results?search_query=Garlic+Butter+Steak+Bites',
    thumbnail_url: 'https://source.unsplash.com/featured/?steak-bites',
  },
  {
    name: 'Chicken Shawarma Wrap',
    calories: 470,
    prep_time_min: 20,
    instructions: 'Marinate chicken in shawarma spices and grill. Wrap in pita with garlic sauce, tomatoes, and pickled vegetables.',
    image_url: 'https://source.unsplash.com/featured/?chicken-shawarma',
    video_url: 'https://www.youtube.com/results?search_query=Chicken+Shawarma+Wrap',
    thumbnail_url: 'https://source.unsplash.com/featured/?chicken-shawarma',
  },
  {
    name: 'Spinach and Ricotta Lasagna',
    calories: 580,
    prep_time_min: 50,
    instructions: 'Layer lasagna noodles with ricotta-spinach filling, marinara sauce, and mozzarella. Bake covered at 375°F for 45 minutes.',
    image_url: 'https://source.unsplash.com/featured/?lasagna',
    video_url: 'https://www.youtube.com/results?search_query=Spinach+Ricotta+Lasagna',
    thumbnail_url: 'https://source.unsplash.com/featured/?lasagna',
  },
  {
    name: 'Thai Chicken Curry',
    calories: 540,
    prep_time_min: 35,
    instructions: 'Simmer chicken in creamy coconut milk with Thai red curry paste, lemongrass, and vegetables. Serve over jasmine rice.',
    image_url: 'https://source.unsplash.com/featured/?thai-curry',
    video_url: 'https://www.youtube.com/results?search_query=Thai+Chicken+Curry',
    thumbnail_url: 'https://source.unsplash.com/featured/?thai-curry',
  },
  {
    name: 'Salmon Rice Bowl',
    calories: 510,
    prep_time_min: 20,
    instructions: 'Season salmon and bake or air-fry. Serve over sushi rice with cucumber, avocado, edamame, and sriracha mayo.',
    image_url: 'https://source.unsplash.com/featured/?salmon-rice-bowl',
    video_url: 'https://www.youtube.com/results?search_query=Salmon+Rice+Bowl',
    thumbnail_url: 'https://source.unsplash.com/featured/?salmon-rice-bowl',
  },
  {
    name: 'Mediterranean Chicken Bowl',
    calories: 480,
    prep_time_min: 25,
    instructions: 'Grill lemon-herb chicken and serve over couscous with hummus, tzatziki, roasted veggies, and feta cheese.',
    image_url: 'https://source.unsplash.com/featured/?mediterranean-chicken',
    video_url: 'https://www.youtube.com/results?search_query=Mediterranean+Chicken+Bowl',
    thumbnail_url: 'https://source.unsplash.com/featured/?mediterranean-chicken',
  },
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Seeding 40 recipes...\n');

    let inserted = 0;
    let skipped = 0;

    for (const r of recipes) {
      // Skip if a recipe with the same name already exists
      const [existing] = await conn.query(
        `SELECT recipe_id FROM recipes WHERE name = ? LIMIT 1`,
        [r.name]
      );

      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping (already exists): ${r.name}`);
        skipped++;
        continue;
      }

      await conn.query(
        `INSERT INTO recipes (name, calories, prep_time_min, instructions, image_url, video_url, thumbnail_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [r.name, r.calories, r.prep_time_min, r.instructions, r.image_url, r.video_url, r.thumbnail_url]
      );

      console.log(`  ✅ Inserted: ${r.name} (${r.calories} kcal, ${r.prep_time_min} min)`);
      inserted++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎉 Done! ${inserted} recipe(s) inserted, ${skipped} skipped.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
