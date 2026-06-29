require("dotenv").config();
const pool = require("../config/db");

const conditions = [
  {
    condition_name: "Diabetes",
    description: "Condition requiring carbohydrate awareness and balanced dietary intake."
  },
  {
    condition_name: "Hypertension",
    description: "Condition associated with the need to monitor sodium intake."
  },
  {
    condition_name: "Chronic Kidney Disease",
    description: "Condition requiring careful dietary management depending on stage."
  },
  {
    condition_name: "Obesity",
    description: "Condition often addressed through energy-controlled diet planning."
  },
  {
    condition_name: "Hyperlipidemia",
    description: "Condition associated with managing saturated fat and cholesterol intake."
  }
];

const run = async () => {
  try {
    for (const c of conditions) {
      await pool.query(
        `INSERT IGNORE INTO medical_condition (condition_name, description)
         VALUES (?, ?)`,
        [c.condition_name, c.description]
      );
    }
    console.log("Conditions seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();