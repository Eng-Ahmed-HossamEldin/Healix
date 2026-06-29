const pool = require("../config/db");

const getRecipes = async () => {
  const [rows] = await pool.query(`SELECT * FROM recipes ORDER BY created_at DESC`);
  return rows;
};

const getExercises = async () => {
  const [rows] = await pool.query(`SELECT * FROM exercises ORDER BY created_at DESC`);
  return rows;
};

module.exports = {
  getRecipes,
  getExercises
};
