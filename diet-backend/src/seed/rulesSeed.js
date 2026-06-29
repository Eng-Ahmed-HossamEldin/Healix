require("dotenv").config();
const pool = require("../config/db");

const rules = {
  Diabetes: [
    {
      nutrient_key: "added_sugar",
      rule_type: "moderate",
      threshold_value: null,
      threshold_unit: null,
      notes: "Limit added sugars and distribute carbohydrate intake sensibly across meals."
    },
    {
      nutrient_key: "total_carbs_g",
      rule_type: "moderate",
      threshold_value: null,
      threshold_unit: "g/meal",
      notes: "Monitor carbohydrate portions and balance with protein, fiber, and healthy fats."
    },
    {
      nutrient_key: "fiber_g",
      rule_type: "min",
      threshold_value: 25,
      threshold_unit: "g/day",
      notes: "Prefer higher-fiber foods where clinically appropriate."
    }
  ],
  Hypertension: [
    {
      nutrient_key: "sodium_mg",
      rule_type: "max",
      threshold_value: 1500,
      threshold_unit: "mg/day",
      notes: "Lower sodium target commonly used for blood pressure control."
    },
    {
      nutrient_key: "potassium_mg",
      rule_type: "prefer",
      threshold_value: null,
      threshold_unit: null,
      notes: "Prefer potassium-rich foods when clinically appropriate."
    },
    {
      nutrient_key: "saturated_fat_g",
      rule_type: "moderate",
      threshold_value: null,
      threshold_unit: null,
      notes: "Use a heart-healthy eating pattern."
    }
  ],
  "Chronic Kidney Disease": [
    {
      nutrient_key: "sodium_mg",
      rule_type: "max",
      threshold_value: 2000,
      threshold_unit: "mg/day",
      notes: "Adjust further depending on stage and clinician guidance."
    },
    {
      nutrient_key: "potassium_mg",
      rule_type: "moderate",
      threshold_value: null,
      threshold_unit: null,
      notes: "Restriction depends on stage, labs, and medical guidance."
    },
    {
      nutrient_key: "protein_g",
      rule_type: "moderate",
      threshold_value: null,
      threshold_unit: null,
      notes: "Protein targets should be individualized by clinician."
    }
  ],
  Obesity: [
    {
      nutrient_key: "calories",
      rule_type: "max",
      threshold_value: 1800,
      threshold_unit: "kcal/day",
      notes: "Sample general target only; personalize to user characteristics."
    },
    {
      nutrient_key: "fiber_g",
      rule_type: "min",
      threshold_value: 25,
      threshold_unit: "g/day",
      notes: "Prefer satiating, fiber-rich foods."
    }
  ],
  Hyperlipidemia: [
    {
      nutrient_key: "saturated_fat_g",
      rule_type: "max",
      threshold_value: 13,
      threshold_unit: "g/day",
      notes: "Illustrative limit within a heart-healthy plan."
    },
    {
      nutrient_key: "cholesterol_mg",
      rule_type: "moderate",
      threshold_value: null,
      threshold_unit: null,
      notes: "Focus overall on heart-healthy food patterns."
    },
    {
      nutrient_key: "fiber_g",
      rule_type: "min",
      threshold_value: 25,
      threshold_unit: "g/day",
      notes: "Prefer fiber-rich foods."
    }
  ]
};

const run = async () => {
  try {
    for (const [conditionName, conditionRules] of Object.entries(rules)) {
      const [conditionRows] = await pool.query(
        `SELECT condition_id FROM medical_condition WHERE condition_name = ?`,
        [conditionName]
      );

      if (conditionRows.length === 0) continue;

      const conditionId = conditionRows[0].condition_id;

      for (const rule of conditionRules) {
        await pool.query(
          `INSERT INTO condition_diet_rule
           (condition_id, nutrient_key, rule_type, threshold_value, threshold_unit, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            conditionId,
            rule.nutrient_key,
            rule.rule_type,
            rule.threshold_value,
            rule.threshold_unit,
            rule.notes
          ]
        );
      }
    }

    console.log("Condition diet rules seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();