/**
 * Fix Recipe Images Script
 * Updates recipe thumbnail_url and image_url to working image URLs.
 * source.unsplash.com is deprecated — replaced with reliable food images.
 * Run: node src/seed/fixRecipeImages.js
 */

require('dotenv').config();
const pool = require('../config/db');

// Curated working image URLs from Unsplash CDN (free, no auth needed)
const recipeImages = [
  {
    name: 'Honey Garlic Chicken Stir Fry',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop',
  },
  {
    name: 'Egg White Scramble with Veggies',
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop',
  },
  {
    name: 'High Protein Overnight Oats',
    image_url: 'https://images.unsplash.com/photo-1618076964729-6b93ef33c3a6?w=600&auto=format&fit=crop',
  },
  {
    name: 'Tuna Avocado Wrap',
    image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop',
  },
  {
    name: 'Banana Protein Smoothie Bowl',
    image_url: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&auto=format&fit=crop',
  },
  {
    name: 'Cottage Cheese Protein Bowl',
    image_url: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&auto=format&fit=crop',
  },
  {
    name: 'Scrambled Eggs with Spinach & Feta',
    image_url: 'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?w=600&auto=format&fit=crop',
  },
  {
    name: 'Avocado Toast with Eggs',
    image_url: 'https://images.unsplash.com/photo-1603046891726-36bfd957e0bf?w=600&auto=format&fit=crop',
  },
  {
    name: 'Caprese Pasta',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format&fit=crop',
  },
  {
    name: 'Greek Quinoa Salad',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop',
  },
  {
    name: 'Protein Pancakes',
    image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop',
  },
  {
    name: 'Crispy Tofu Vegetable Stir Fry',
    image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop',
  },
  {
    name: 'Mediterranean Tuna Salad',
    image_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&auto=format&fit=crop',
  },
  {
    name: 'Blackened Tilapia Fish Tacos',
    image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop',
  },
  {
    name: 'Garlic Shrimp with Zucchini Noodles',
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop',
  },
  {
    name: 'Lemon Butter Salmon',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop',
  },
  {
    name: 'Shrimp Fried Rice',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop',
  },
  {
    name: 'Asian Turkey Lettuce Wraps',
    image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop',
  },
  {
    name: 'Beef and Broccoli',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop',
  },
  {
    name: 'One-Pan Chicken Fajitas',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop',
  },
  {
    name: 'Chicken Caesar Salad',
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&auto=format&fit=crop',
  },
  {
    name: 'Turkey Meatballs with Rice',
    image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop',
  },
  {
    name: 'Grilled Chicken Burrito Bowl',
    image_url: 'https://images.unsplash.com/photo-1543340904-0d1c94d72d6f?w=600&auto=format&fit=crop',
  },
  {
    name: 'Vegetable Omelette',
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop',
  },
  {
    name: 'Chicken Alfredo Pasta',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format&fit=crop',
  },
  {
    name: 'BBQ Chicken Pizza',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
  },
  {
    name: 'Beef Tacos',
    image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop',
  },
  {
    name: 'Mushroom Risotto',
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&auto=format&fit=crop',
  },
  {
    name: 'Baked Cod with Vegetables',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop',
  },
  {
    name: 'Chicken Noodle Soup',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop',
  },
  {
    name: 'Beef Chili',
    image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&auto=format&fit=crop',
  },
  {
    name: 'Chicken Teriyaki Bowl',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop',
  },
  {
    name: 'Lentil Soup',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop',
  },
  {
    name: 'Stuffed Bell Peppers',
    image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop',
  },
  {
    name: 'Garlic Butter Steak Bites',
    image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop',
  },
  {
    name: 'Chicken Shawarma Wrap',
    image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop',
  },
  {
    name: 'Spinach and Ricotta Lasagna',
    image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop',
  },
  {
    name: 'Thai Chicken Curry',
    image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&auto=format&fit=crop',
  },
  {
    name: 'Salmon Rice Bowl',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop',
  },
  {
    name: 'Mediterranean Chicken Bowl',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop',
  },
];

async function fixImages() {
  const conn = await pool.getConnection();
  try {
    console.log('🖼️  Fixing recipe image URLs...\n');

    let updated = 0;
    let notFound = 0;

    for (const r of recipeImages) {
      const [result] = await conn.query(
        `UPDATE recipes SET image_url = ?, thumbnail_url = ? WHERE name = ?`,
        [r.image_url, r.image_url, r.name]
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

fixImages();
