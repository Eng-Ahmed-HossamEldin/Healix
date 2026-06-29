require("dotenv").config();
const pool = require("../config/db");
const foodModel = require("../models/foodModel");

const foodsDataset = [
  // ── Proteins ────────────────────────────────────────────────────────────
  { food_name: "Grilled Chicken Breast", category: "Meat", description: "Lean protein source, ideal for muscle gain.", serving_size: "100g",
    nutrition: { calories: 165, protein_g: 31, total_carbs_g: 0, total_fat_g: 3.6, saturated_fat_g: 1.0, sugar_g: 0, fiber_g: 0, cholesterol_mg: 85, sodium_mg: 74, potassium_mg: 256 }},
  { food_name: "Salmon Filet", category: "Seafood", description: "Rich in Omega-3 fatty acids.", serving_size: "100g",
    nutrition: { calories: 206, protein_g: 22, total_carbs_g: 0, total_fat_g: 13, saturated_fat_g: 3.1, sugar_g: 0, fiber_g: 0, cholesterol_mg: 55, sodium_mg: 59, potassium_mg: 363 }},
  { food_name: "Tuna (Canned in Water)", category: "Seafood", description: "High protein, low fat canned fish.", serving_size: "100g",
    nutrition: { calories: 116, protein_g: 26, total_carbs_g: 0, total_fat_g: 1, saturated_fat_g: 0.3, sugar_g: 0, fiber_g: 0, cholesterol_mg: 42, sodium_mg: 320, potassium_mg: 207 }},
  { food_name: "Ground Beef (90% Lean)", category: "Meat", description: "Lean ground beef for burgers and bowls.", serving_size: "100g",
    nutrition: { calories: 176, protein_g: 22, total_carbs_g: 0, total_fat_g: 10, saturated_fat_g: 3.8, sugar_g: 0, fiber_g: 0, cholesterol_mg: 70, sodium_mg: 72, potassium_mg: 318 }},
  { food_name: "Eggs (Whole)", category: "Dairy & Eggs", description: "Complete protein with healthy fats.", serving_size: "1 large egg (50g)",
    nutrition: { calories: 72, protein_g: 6, total_carbs_g: 0.4, total_fat_g: 5, saturated_fat_g: 1.6, sugar_g: 0.2, fiber_g: 0, cholesterol_mg: 186, sodium_mg: 71, potassium_mg: 69 }},
  { food_name: "Egg Whites", category: "Dairy & Eggs", description: "Pure protein, fat-free.", serving_size: "100g",
    nutrition: { calories: 52, protein_g: 11, total_carbs_g: 0.7, total_fat_g: 0.2, saturated_fat_g: 0, sugar_g: 0.5, fiber_g: 0, cholesterol_mg: 0, sodium_mg: 166, potassium_mg: 163 }},
  { food_name: "Turkey Breast", category: "Meat", description: "Very lean white meat protein.", serving_size: "100g",
    nutrition: { calories: 135, protein_g: 30, total_carbs_g: 0, total_fat_g: 1, saturated_fat_g: 0.3, sugar_g: 0, fiber_g: 0, cholesterol_mg: 69, sodium_mg: 63, potassium_mg: 293 }},
  { food_name: "Shrimp", category: "Seafood", description: "Low calorie, high protein seafood.", serving_size: "100g",
    nutrition: { calories: 85, protein_g: 18, total_carbs_g: 0.9, total_fat_g: 1, saturated_fat_g: 0.2, sugar_g: 0, fiber_g: 0, cholesterol_mg: 152, sodium_mg: 111, potassium_mg: 185 }},
  { food_name: "Whey Protein Powder", category: "Supplements", description: "Fast-digesting protein supplement.", serving_size: "1 scoop (30g)",
    nutrition: { calories: 120, protein_g: 24, total_carbs_g: 3, total_fat_g: 1.5, saturated_fat_g: 0.5, sugar_g: 1, fiber_g: 0, cholesterol_mg: 10, sodium_mg: 100, potassium_mg: 160 }},
  { food_name: "Greek Yogurt (Plain, 0% Fat)", category: "Dairy & Eggs", description: "High protein, probiotic-rich yogurt.", serving_size: "170g",
    nutrition: { calories: 100, protein_g: 17, total_carbs_g: 6, total_fat_g: 0.7, saturated_fat_g: 0, sugar_g: 6, fiber_g: 0, cholesterol_mg: 5, sodium_mg: 65, potassium_mg: 240 }},
  { food_name: "Cottage Cheese (Low Fat)", category: "Dairy & Eggs", description: "Slow-digesting casein protein source.", serving_size: "113g",
    nutrition: { calories: 81, protein_g: 14, total_carbs_g: 3, total_fat_g: 1.2, saturated_fat_g: 0.7, sugar_g: 3, fiber_g: 0, cholesterol_mg: 10, sodium_mg: 364, potassium_mg: 103 }},

  // ── Grains & Carbs ───────────────────────────────────────────────────────
  { food_name: "Brown Rice", category: "Grains", description: "Whole grain carb source with high fiber.", serving_size: "1 cup cooked (195g)",
    nutrition: { calories: 216, protein_g: 5, total_carbs_g: 45, total_fat_g: 1.8, saturated_fat_g: 0.4, sugar_g: 0.7, fiber_g: 3.5, cholesterol_mg: 0, sodium_mg: 10, potassium_mg: 84 }},
  { food_name: "White Rice", category: "Grains", description: "Refined grain, quick energy source.", serving_size: "1 cup cooked (186g)",
    nutrition: { calories: 242, protein_g: 4.4, total_carbs_g: 53, total_fat_g: 0.4, saturated_fat_g: 0.1, sugar_g: 0, fiber_g: 0.6, cholesterol_mg: 0, sodium_mg: 0, potassium_mg: 55 }},
  { food_name: "Oats (Rolled)", category: "Grains", description: "High fiber breakfast grain.", serving_size: "1/2 cup dry (40g)",
    nutrition: { calories: 150, protein_g: 5, total_carbs_g: 27, total_fat_g: 3, saturated_fat_g: 0.5, sugar_g: 1, fiber_g: 4, cholesterol_mg: 0, sodium_mg: 0, potassium_mg: 143 }},
  { food_name: "Whole Wheat Bread", category: "Grains", description: "High fiber bread alternative.", serving_size: "1 slice (28g)",
    nutrition: { calories: 69, protein_g: 3.6, total_carbs_g: 12, total_fat_g: 1.1, saturated_fat_g: 0.2, sugar_g: 1.4, fiber_g: 1.9, cholesterol_mg: 0, sodium_mg: 132, potassium_mg: 80 }},
  { food_name: "Quinoa", category: "Grains", description: "Complete protein grain, gluten-free.", serving_size: "1 cup cooked (185g)",
    nutrition: { calories: 222, protein_g: 8, total_carbs_g: 39, total_fat_g: 3.6, saturated_fat_g: 0.4, sugar_g: 1.6, fiber_g: 5, cholesterol_mg: 0, sodium_mg: 13, potassium_mg: 318 }},
  { food_name: "Pasta (Whole Wheat)", category: "Grains", description: "Higher fiber pasta option.", serving_size: "1 cup cooked (140g)",
    nutrition: { calories: 174, protein_g: 7.5, total_carbs_g: 37, total_fat_g: 0.8, saturated_fat_g: 0.2, sugar_g: 1.5, fiber_g: 4.5, cholesterol_mg: 0, sodium_mg: 4, potassium_mg: 123 }},
  { food_name: "Sweet Potato", category: "Vegetables", description: "Complex carbohydrate, great source of vitamin A.", serving_size: "1 medium (130g)",
    nutrition: { calories: 112, protein_g: 2, total_carbs_g: 26, total_fat_g: 0.1, saturated_fat_g: 0, sugar_g: 5.4, fiber_g: 3.9, cholesterol_mg: 0, sodium_mg: 73, potassium_mg: 438 }},
  { food_name: "White Potato (Boiled)", category: "Vegetables", description: "Starchy vegetable, good energy source.", serving_size: "1 medium (150g)",
    nutrition: { calories: 116, protein_g: 2.5, total_carbs_g: 27, total_fat_g: 0.1, saturated_fat_g: 0, sugar_g: 1.2, fiber_g: 2.4, cholesterol_mg: 0, sodium_mg: 6, potassium_mg: 515 }},

  // ── Vegetables ───────────────────────────────────────────────────────────
  { food_name: "Spinach", category: "Vegetables", description: "Leafy green packed with vitamins and minerals.", serving_size: "1 cup (30g)",
    nutrition: { calories: 7, protein_g: 0.9, total_carbs_g: 1.1, total_fat_g: 0.1, saturated_fat_g: 0, sugar_g: 0.1, fiber_g: 0.7, cholesterol_mg: 0, sodium_mg: 24, potassium_mg: 167 }},
  { food_name: "Broccoli", category: "Vegetables", description: "Cruciferous vegetable with vitamin C and fiber.", serving_size: "1 cup (91g)",
    nutrition: { calories: 31, protein_g: 2.6, total_carbs_g: 6, total_fat_g: 0.3, saturated_fat_g: 0.1, sugar_g: 1.5, fiber_g: 2.4, cholesterol_mg: 0, sodium_mg: 30, potassium_mg: 288 }},
  { food_name: "Carrots", category: "Vegetables", description: "High in beta-carotene and fiber.", serving_size: "1 medium (61g)",
    nutrition: { calories: 25, protein_g: 0.6, total_carbs_g: 6, total_fat_g: 0.1, saturated_fat_g: 0, sugar_g: 2.9, fiber_g: 1.7, cholesterol_mg: 0, sodium_mg: 42, potassium_mg: 195 }},
  { food_name: "Bell Pepper (Red)", category: "Vegetables", description: "High vitamin C content, sweet flavor.", serving_size: "1 medium (119g)",
    nutrition: { calories: 37, protein_g: 1.2, total_carbs_g: 7, total_fat_g: 0.4, saturated_fat_g: 0.1, sugar_g: 5, fiber_g: 2.5, cholesterol_mg: 0, sodium_mg: 6, potassium_mg: 251 }},
  { food_name: "Cucumber", category: "Vegetables", description: "Hydrating low-calorie vegetable.", serving_size: "1 cup sliced (119g)",
    nutrition: { calories: 16, protein_g: 0.7, total_carbs_g: 3.8, total_fat_g: 0.1, saturated_fat_g: 0, sugar_g: 1.7, fiber_g: 0.6, cholesterol_mg: 0, sodium_mg: 2, potassium_mg: 193 }},
  { food_name: "Tomato", category: "Vegetables", description: "Rich in lycopene and vitamin C.", serving_size: "1 medium (123g)",
    nutrition: { calories: 22, protein_g: 1.1, total_carbs_g: 4.8, total_fat_g: 0.2, saturated_fat_g: 0, sugar_g: 3.2, fiber_g: 1.5, cholesterol_mg: 0, sodium_mg: 6, potassium_mg: 292 }},
  { food_name: "Avocado", category: "Fruits", description: "Healthy monounsaturated fats and fiber.", serving_size: "1/2 fruit (68g)",
    nutrition: { calories: 114, protein_g: 1.3, total_carbs_g: 6, total_fat_g: 10.5, saturated_fat_g: 1.5, sugar_g: 0.2, fiber_g: 4.6, cholesterol_mg: 0, sodium_mg: 5, potassium_mg: 364 }},
  { food_name: "Cauliflower", category: "Vegetables", description: "Low carb vegetable, great rice substitute.", serving_size: "1 cup (107g)",
    nutrition: { calories: 27, protein_g: 2, total_carbs_g: 5.3, total_fat_g: 0.3, saturated_fat_g: 0.1, sugar_g: 2, fiber_g: 2.1, cholesterol_mg: 0, sodium_mg: 32, potassium_mg: 320 }},
  { food_name: "Zucchini", category: "Vegetables", description: "Low calorie summer squash.", serving_size: "1 cup sliced (113g)",
    nutrition: { calories: 19, protein_g: 1.5, total_carbs_g: 3.5, total_fat_g: 0.4, saturated_fat_g: 0.1, sugar_g: 2.7, fiber_g: 1.2, cholesterol_mg: 0, sodium_mg: 13, potassium_mg: 324 }},
  { food_name: "Kale", category: "Vegetables", description: "Nutrient-dense leafy green superfood.", serving_size: "1 cup (21g)",
    nutrition: { calories: 7, protein_g: 0.6, total_carbs_g: 0.9, total_fat_g: 0.3, saturated_fat_g: 0, sugar_g: 0.2, fiber_g: 0.9, cholesterol_mg: 0, sodium_mg: 15, potassium_mg: 73 }},

  // ── Fruits ───────────────────────────────────────────────────────────────
  { food_name: "Banana", category: "Fruits", description: "Quick energy source, high in potassium.", serving_size: "1 medium (118g)",
    nutrition: { calories: 105, protein_g: 1.3, total_carbs_g: 27, total_fat_g: 0.4, saturated_fat_g: 0.1, sugar_g: 14.4, fiber_g: 3.1, cholesterol_mg: 0, sodium_mg: 1, potassium_mg: 422 }},
  { food_name: "Apple", category: "Fruits", description: "High fiber fruit with antioxidants.", serving_size: "1 medium (182g)",
    nutrition: { calories: 95, protein_g: 0.5, total_carbs_g: 25, total_fat_g: 0.3, saturated_fat_g: 0.1, sugar_g: 19, fiber_g: 4.4, cholesterol_mg: 0, sodium_mg: 2, potassium_mg: 195 }},
  { food_name: "Blueberries", category: "Fruits", description: "Antioxidant-rich superfood berries.", serving_size: "1 cup (148g)",
    nutrition: { calories: 84, protein_g: 1.1, total_carbs_g: 21.4, total_fat_g: 0.5, saturated_fat_g: 0, sugar_g: 14.7, fiber_g: 3.6, cholesterol_mg: 0, sodium_mg: 1, potassium_mg: 114 }},
  { food_name: "Strawberries", category: "Fruits", description: "Low calorie, vitamin C rich berries.", serving_size: "1 cup (152g)",
    nutrition: { calories: 49, protein_g: 1, total_carbs_g: 11.7, total_fat_g: 0.5, saturated_fat_g: 0, sugar_g: 7.4, fiber_g: 3, cholesterol_mg: 0, sodium_mg: 1, potassium_mg: 233 }},
  { food_name: "Orange", category: "Fruits", description: "High vitamin C citrus fruit.", serving_size: "1 medium (131g)",
    nutrition: { calories: 62, protein_g: 1.2, total_carbs_g: 15.4, total_fat_g: 0.2, saturated_fat_g: 0, sugar_g: 12.2, fiber_g: 3.1, cholesterol_mg: 0, sodium_mg: 0, potassium_mg: 237 }},

  // ── Nuts, Seeds & Fats ────────────────────────────────────────────────────
  { food_name: "Almonds", category: "Nuts", description: "Healthy fats and vitamin E source.", serving_size: "1 oz (28g)",
    nutrition: { calories: 164, protein_g: 6, total_carbs_g: 6.1, total_fat_g: 14.2, saturated_fat_g: 1.1, sugar_g: 1.2, fiber_g: 3.5, cholesterol_mg: 0, sodium_mg: 0, potassium_mg: 208 }},
  { food_name: "Walnuts", category: "Nuts", description: "Omega-3 rich nuts for brain health.", serving_size: "1 oz (28g)",
    nutrition: { calories: 185, protein_g: 4.3, total_carbs_g: 3.9, total_fat_g: 18.5, saturated_fat_g: 1.7, sugar_g: 0.7, fiber_g: 1.9, cholesterol_mg: 0, sodium_mg: 1, potassium_mg: 125 }},
  { food_name: "Peanut Butter (Natural)", category: "Nuts", description: "Protein and healthy fat spread.", serving_size: "2 tbsp (32g)",
    nutrition: { calories: 191, protein_g: 7, total_carbs_g: 7, total_fat_g: 16, saturated_fat_g: 2.5, sugar_g: 3, fiber_g: 2, cholesterol_mg: 0, sodium_mg: 5, potassium_mg: 200 }},
  { food_name: "Chia Seeds", category: "Seeds", description: "High omega-3 and fiber superfood.", serving_size: "1 oz (28g)",
    nutrition: { calories: 138, protein_g: 4.7, total_carbs_g: 12, total_fat_g: 8.7, saturated_fat_g: 0.9, sugar_g: 0, fiber_g: 9.8, cholesterol_mg: 0, sodium_mg: 5, potassium_mg: 115 }},
  { food_name: "Olive Oil", category: "Fats & Oils", description: "Heart-healthy monounsaturated fat.", serving_size: "1 tbsp (14g)",
    nutrition: { calories: 119, protein_g: 0, total_carbs_g: 0, total_fat_g: 13.5, saturated_fat_g: 1.9, sugar_g: 0, fiber_g: 0, cholesterol_mg: 0, sodium_mg: 0, potassium_mg: 0 }},

  // ── Dairy ────────────────────────────────────────────────────────────────
  { food_name: "Milk (Whole)", category: "Dairy & Eggs", description: "Calcium-rich whole milk.", serving_size: "1 cup (244ml)",
    nutrition: { calories: 149, protein_g: 8, total_carbs_g: 11.7, total_fat_g: 8, saturated_fat_g: 4.6, sugar_g: 12.3, fiber_g: 0, cholesterol_mg: 24, sodium_mg: 105, potassium_mg: 349 }},
  { food_name: "Cheddar Cheese", category: "Dairy & Eggs", description: "Classic aged cheese with calcium.", serving_size: "1 oz (28g)",
    nutrition: { calories: 114, protein_g: 7, total_carbs_g: 0.4, total_fat_g: 9.4, saturated_fat_g: 5.4, sugar_g: 0.1, fiber_g: 0, cholesterol_mg: 29, sodium_mg: 176, potassium_mg: 28 }},

  // ── Legumes ──────────────────────────────────────────────────────────────
  { food_name: "Black Beans (Cooked)", category: "Legumes", description: "High protein and fiber legume.", serving_size: "1 cup (172g)",
    nutrition: { calories: 227, protein_g: 15, total_carbs_g: 41, total_fat_g: 0.9, saturated_fat_g: 0.2, sugar_g: 0.6, fiber_g: 15, cholesterol_mg: 0, sodium_mg: 1, potassium_mg: 611 }},
  { food_name: "Lentils (Cooked)", category: "Legumes", description: "Iron and protein rich legume.", serving_size: "1 cup (198g)",
    nutrition: { calories: 230, protein_g: 18, total_carbs_g: 40, total_fat_g: 0.8, saturated_fat_g: 0.1, sugar_g: 3.6, fiber_g: 15.6, cholesterol_mg: 0, sodium_mg: 4, potassium_mg: 731 }},
  { food_name: "Chickpeas (Cooked)", category: "Legumes", description: "Versatile legume, great in salads.", serving_size: "1 cup (164g)",
    nutrition: { calories: 269, protein_g: 15, total_carbs_g: 45, total_fat_g: 4.3, saturated_fat_g: 0.4, sugar_g: 7.9, fiber_g: 12.5, cholesterol_mg: 0, sodium_mg: 11, potassium_mg: 477 }},

  // ── Common Meals ─────────────────────────────────────────────────────────
  { food_name: "Mixed Salad (No Dressing)", category: "Salads", description: "Leafy greens with vegetables.", serving_size: "2 cups (100g)",
    nutrition: { calories: 20, protein_g: 1.5, total_carbs_g: 3.5, total_fat_g: 0.3, saturated_fat_g: 0, sugar_g: 2, fiber_g: 2, cholesterol_mg: 0, sodium_mg: 15, potassium_mg: 200 }},
  { food_name: "Caesar Salad (No Croutons)", category: "Salads", description: "Romaine with Caesar dressing.", serving_size: "1 cup (85g)",
    nutrition: { calories: 90, protein_g: 3, total_carbs_g: 4, total_fat_g: 7.5, saturated_fat_g: 1.5, sugar_g: 1, fiber_g: 1, cholesterol_mg: 10, sodium_mg: 200, potassium_mg: 150 }},
  { food_name: "Protein Bar (Generic)", category: "Supplements", description: "Convenient high-protein snack bar.", serving_size: "1 bar (60g)",
    nutrition: { calories: 200, protein_g: 20, total_carbs_g: 22, total_fat_g: 7, saturated_fat_g: 2, sugar_g: 5, fiber_g: 3, cholesterol_mg: 5, sodium_mg: 150, potassium_mg: 200 }},
  { food_name: "Hummus", category: "Legumes", description: "Chickpea dip rich in healthy fats.", serving_size: "2 tbsp (30g)",
    nutrition: { calories: 70, protein_g: 2, total_carbs_g: 6, total_fat_g: 4.5, saturated_fat_g: 0.5, sugar_g: 0.4, fiber_g: 1.4, cholesterol_mg: 0, sodium_mg: 130, potassium_mg: 72 }},
];

const run = async () => {
  try {
    console.log("Starting Food Data Seeding (extended dataset)...");
    let seeded = 0;
    let skipped = 0;

    for (const item of foodsDataset) {
      // Check if the food already exists to avoid duplicates
      const [existing] = await pool.query(
        "SELECT food_id FROM food WHERE food_name = ? LIMIT 1",
        [item.food_name]
      );

      let foodId;
      if (existing.length > 0) {
        foodId = existing[0].food_id;
        console.log(`  Skipping existing: ${item.food_name} (ID: ${foodId})`);
        skipped++;
      } else {
        foodId = await foodModel.createFood({
          food_name: item.food_name,
          category: item.category,
          description: item.description,
          serving_size: item.serving_size
        });
        console.log(`  Created: ${item.food_name} (ID: ${foodId})`);
        seeded++;
      }

      // Always upsert nutrition to ensure data is up to date
      await foodModel.upsertNutrition(foodId, {
        calories: item.nutrition.calories || 0,
        protein_g: item.nutrition.protein_g || 0,
        total_carbs_g: item.nutrition.total_carbs_g || 0,
        total_fat_g: item.nutrition.total_fat_g || 0,
        saturated_fat_g: item.nutrition.saturated_fat_g || 0,
        sugar_g: item.nutrition.sugar_g || 0,
        fiber_g: item.nutrition.fiber_g || 0,
        cholesterol_mg: item.nutrition.cholesterol_mg || 0,
        sodium_mg: item.nutrition.sodium_mg || 0,
        potassium_mg: item.nutrition.potassium_mg || 0,
        calcium_mg: item.nutrition.calcium_mg || 0,
        iron_mg: item.nutrition.iron_mg || 0,
        vitamin_a_mcg: item.nutrition.vitamin_a_mcg || 0,
        vitamin_c_mg: item.nutrition.vitamin_c_mg || 0
      });
    }

    console.log(`\nDone! Seeded: ${seeded} new foods, Updated: ${skipped} existing foods.`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed foods:", error);
    process.exit(1);
  }
};

run();