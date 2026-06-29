const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware  = require('../middlewares/authMiddleware');
const roleMiddleware  = require('../middlewares/roleMiddleware');

const adminOnly = [authMiddleware, roleMiddleware('admin')];

router.get('/stats',                        ...adminOnly, adminController.getStats);
router.get('/users',                        ...adminOnly, adminController.getUsers);
router.get('/doctors',                      ...adminOnly, adminController.getDoctors);
router.put('/users/:username/subscription', ...adminOnly, adminController.updateSubscription);
router.post('/users/:username/promote',     ...adminOnly, adminController.promoteToDoctor);
router.delete('/users/:username',           ...adminOnly, adminController.deleteUser);
router.post('/doctors/:username/downgrade', ...adminOnly, adminController.downgradeDoctor);
router.delete('/doctors/:username',         ...adminOnly, adminController.deleteDoctor);
router.post('/foods',                       ...adminOnly, adminController.addFood);
router.get('/foods',                        ...adminOnly, adminController.getAllFoods);
router.put('/foods/:foodId',                ...adminOnly, adminController.updateFood);
router.delete('/foods/:foodId',             ...adminOnly, adminController.deleteFood);
router.get('/recipes',                      ...adminOnly, adminController.getAllRecipes);
router.post('/recipes',                     ...adminOnly, adminController.addRecipe);
router.put('/recipes/:recipeId',            ...adminOnly, adminController.updateRecipe);
router.delete('/recipes/:recipeId',         ...adminOnly, adminController.deleteRecipe);
router.get('/exercises',                    ...adminOnly, adminController.getAllExercises);
router.post('/exercises',                   ...adminOnly, adminController.addExercise);
router.put('/exercises/:exerciseId',        ...adminOnly, adminController.updateExercise);
router.delete('/exercises/:exerciseId',     ...adminOnly, adminController.deleteExercise);
router.get('/plans',                        ...adminOnly, adminController.getAllDietPlans);
router.post('/plans',                       ...adminOnly, adminController.addDietPlan);
router.put('/plans/:planId',                ...adminOnly, adminController.updateDietPlan);
router.delete('/plans/:planId',             ...adminOnly, adminController.deleteDietPlan);

module.exports = router;
