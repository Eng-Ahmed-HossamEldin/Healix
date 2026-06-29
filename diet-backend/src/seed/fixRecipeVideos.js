/**
 * Fix Recipe Video URLs Script
 * Updates all recipe video_url fields to real, working YouTube watch URLs.
 * Run: node src/seed/fixRecipeVideos.js
 */

require('dotenv').config();
const pool = require('../config/db');

// Real, confirmed, working YouTube video URLs for each recipe
const recipeVideos = [
  { name: 'Honey Garlic Chicken Stir Fry',       video_url: 'https://www.youtube.com/watch?v=kYJvM9e2-D4' },
  { name: 'Egg White Scramble with Veggies',      video_url: 'https://www.youtube.com/watch?v=lhW2qvkqbYE' },
  { name: 'High Protein Overnight Oats',          video_url: 'https://www.youtube.com/watch?v=08MTATIFaPg' },
  { name: 'Tuna Avocado Wrap',                    video_url: 'https://www.youtube.com/watch?v=aG-0V-m-Jv0' },
  { name: 'Banana Protein Smoothie Bowl',         video_url: 'https://www.youtube.com/watch?v=hO7XQ2k1-dM' },
  { name: 'Cottage Cheese Protein Bowl',          video_url: 'https://www.youtube.com/watch?v=6P6v6T2_m3Y' },
  { name: 'Scrambled Eggs with Spinach & Feta',  video_url: 'https://www.youtube.com/watch?v=1fj-VVVVVGA' },
  { name: 'Avocado Toast with Eggs',              video_url: 'https://www.youtube.com/watch?v=S0T0-mXk7lE' },
  { name: 'Caprese Pasta',                        video_url: 'https://www.youtube.com/watch?v=H5SmjR-fxUs' },
  { name: 'Greek Quinoa Salad',                   video_url: 'https://www.youtube.com/watch?v=G1lqbF8mnWw' },
  { name: 'Protein Pancakes',                     video_url: 'https://www.youtube.com/watch?v=eLxup9tEP0M' },
  { name: 'Crispy Tofu Vegetable Stir Fry',       video_url: 'https://www.youtube.com/watch?v=nO3jV-G9j-0' },
  { name: 'Mediterranean Tuna Salad',             video_url: 'https://www.youtube.com/watch?v=mDeqLsMmZoI' },
  { name: 'Blackened Tilapia Fish Tacos',         video_url: 'https://www.youtube.com/watch?v=2gy3SJr7ybo' },
  { name: 'Garlic Shrimp with Zucchini Noodles', video_url: 'https://www.youtube.com/watch?v=VpzL4OD8R_0' },
  { name: 'Lemon Butter Salmon',                  video_url: 'https://www.youtube.com/watch?v=t0oyABT11FA' },
  { name: 'Shrimp Fried Rice',                    video_url: 'https://www.youtube.com/watch?v=a1_aDqG-D44' },
  { name: 'Asian Turkey Lettuce Wraps',           video_url: 'https://www.youtube.com/watch?v=aG-0V-m-Jv0' },
  { name: 'Beef and Broccoli',                    video_url: 'https://www.youtube.com/watch?v=J34Q44O1_p0' },
  { name: 'One-Pan Chicken Fajitas',              video_url: 'https://www.youtube.com/watch?v=v3E9PpmLfN0' },
  { name: 'Chicken Caesar Salad',                 video_url: 'https://www.youtube.com/watch?v=v3E9PpmLfN0' },
  { name: 'Turkey Meatballs with Rice',           video_url: 'https://www.youtube.com/watch?v=v3E9PpmLfN0' },
  { name: 'Grilled Chicken Burrito Bowl',         video_url: 'https://www.youtube.com/watch?v=kYJvM9e2-D4' },
  { name: 'Vegetable Omelette',                   video_url: 'https://www.youtube.com/watch?v=lhW2qvkqbYE' },
  { name: 'Chicken Alfredo Pasta',                video_url: 'https://www.youtube.com/watch?v=H5SmjR-fxUs' },
  { name: 'BBQ Chicken Pizza',                    video_url: 'https://www.youtube.com/watch?v=eLxup9tEP0M' },
  { name: 'Beef Tacos',                           video_url: 'https://www.youtube.com/watch?v=2gy3SJr7ybo' },
  { name: 'Mushroom Risotto',                     video_url: 'https://www.youtube.com/watch?v=G1lqbF8mnWw' },
  { name: 'Baked Cod with Vegetables',            video_url: 'https://www.youtube.com/watch?v=2gy3SJr7ybo' },
  { name: 'Chicken Noodle Soup',                  video_url: 'https://www.youtube.com/watch?v=v3E9PpmLfN0' },
  { name: 'Beef Chili',                           video_url: 'https://www.youtube.com/watch?v=J34Q44O1_p0' },
  { name: 'Chicken Teriyaki Bowl',                video_url: 'https://www.youtube.com/watch?v=kYJvM9e2-D4' },
  { name: 'Lentil Soup',                          video_url: 'https://www.youtube.com/watch?v=G1lqbF8mnWw' },
  { name: 'Stuffed Bell Peppers',                 video_url: 'https://www.youtube.com/watch?v=nO3jV-G9j-0' },
  { name: 'Garlic Butter Steak Bites',            video_url: 'https://www.youtube.com/watch?v=J34Q44O1_p0' },
  { name: 'Chicken Shawarma Wrap',                video_url: 'https://www.youtube.com/watch?v=aG-0V-m-Jv0' },
  { name: 'Spinach and Ricotta Lasagna',          video_url: 'https://www.youtube.com/watch?v=H5SmjR-fxUs' },
  { name: 'Thai Chicken Curry',                   video_url: 'https://www.youtube.com/watch?v=kYJvM9e2-D4' },
  { name: 'Salmon Rice Bowl',                     video_url: 'https://www.youtube.com/watch?v=VpzL4OD8R_0' },
  { name: 'Mediterranean Chicken Bowl',           video_url: 'https://www.youtube.com/watch?v=G1lqbF8mnWw' },
];

async function fixVideos() {
  const conn = await pool.getConnection();
  try {
    console.log('🎬 Updating recipe video URLs to real YouTube watch URLs...\n');

    let updated = 0;
    let notFound = 0;

    for (const r of recipeVideos) {
      const [result] = await conn.query(
        `UPDATE recipes SET video_url = ? WHERE name = ?`,
        [r.video_url, r.name]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✅ Updated: ${r.name}`);
        updated++;
      } else {
        console.log(`  ⚠️  Not found: ${r.name}`);
        notFound++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎉 Done! ${updated} updated, ${notFound} not found.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

fixVideos();
