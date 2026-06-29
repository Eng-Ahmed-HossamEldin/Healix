import 'package:flutter/material.dart';
import 'package:healix_app/core/services/content_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';

import 'meal_plan.dart';

class RecipeBuilderPage extends StatefulWidget {
  const RecipeBuilderPage({super.key});

  @override
  State<RecipeBuilderPage> createState() => _RecipeBuilderPageState();
}

class _RecipeBuilderPageState extends State<RecipeBuilderPage> {
  final _recipeNameController = TextEditingController(text: 'Chicken & Rice Bowl');
  final _servingsController = TextEditingController(text: '2');
  final _prepTimeController = TextEditingController(text: '30 min');
  final _instructionsController = TextEditingController(
    text: '1. Cook chicken breast until golden brown\n'
        '2. Prepare rice according to package\n'
        '3. Steam broccoli for 5 minutes\n'
        '4. Combine all ingredients and serve',
  );
  final _searchController = TextEditingController();

  final List<_IngredientData> _ingredients = <_IngredientData>[
    _IngredientData(name: 'Chicken Breast', amount: '200', unit: 'g'),
    _IngredientData(name: 'Brown Rice', amount: '150', unit: 'g'),
    _IngredientData(name: 'Broccoli', amount: '100', unit: 'g'),
  ];

  static const List<String> _units = ['g', 'kg', 'ml', 'l', 'oz', 'cup', 'tbsp', 'tsp', 'piece'];

  static const Map<String, _NutritionPer100> _nutritionDb = {
    'chicken': _NutritionPer100(calories: 165, protein: 31, carbs: 0, fat: 4),
    'chicken breast': _NutritionPer100(calories: 165, protein: 31, carbs: 0, fat: 4),
    'rice': _NutritionPer100(calories: 130, protein: 3, carbs: 28, fat: 0),
    'brown rice': _NutritionPer100(calories: 120, protein: 3, carbs: 25, fat: 1),
    'broccoli': _NutritionPer100(calories: 35, protein: 3, carbs: 7, fat: 0),
    'salmon': _NutritionPer100(calories: 208, protein: 20, carbs: 0, fat: 13),
    'egg': _NutritionPer100(calories: 155, protein: 13, carbs: 1, fat: 11),
    'eggs': _NutritionPer100(calories: 155, protein: 13, carbs: 1, fat: 11),
    'oats': _NutritionPer100(calories: 389, protein: 17, carbs: 66, fat: 7),
    'yogurt': _NutritionPer100(calories: 59, protein: 10, carbs: 4, fat: 0),
    'greek yogurt': _NutritionPer100(calories: 59, protein: 10, carbs: 4, fat: 0),
    'apple': _NutritionPer100(calories: 52, protein: 0, carbs: 14, fat: 0),
    'banana': _NutritionPer100(calories: 89, protein: 1, carbs: 23, fat: 0),
    'almond': _NutritionPer100(calories: 579, protein: 21, carbs: 22, fat: 50),
    'almonds': _NutritionPer100(calories: 579, protein: 21, carbs: 22, fat: 50),
    'potato': _NutritionPer100(calories: 77, protein: 2, carbs: 17, fat: 0),
    'sweet potato': _NutritionPer100(calories: 86, protein: 2, carbs: 20, fat: 0),
    'beef': _NutritionPer100(calories: 250, protein: 26, carbs: 0, fat: 15),
    'turkey': _NutritionPer100(calories: 135, protein: 29, carbs: 0, fat: 1),
    'tuna': _NutritionPer100(calories: 132, protein: 29, carbs: 0, fat: 1),
    'milk': _NutritionPer100(calories: 60, protein: 3, carbs: 5, fat: 3),
    'protein powder': _NutritionPer100(calories: 380, protein: 76, carbs: 8, fat: 6),
    'olive oil': _NutritionPer100(calories: 884, protein: 0, carbs: 0, fat: 100),
    'avocado': _NutritionPer100(calories: 160, protein: 2, carbs: 9, fat: 15),
  };

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void dispose() {
    _recipeNameController.dispose();
    _servingsController.dispose();
    _prepTimeController.dispose();
    _instructionsController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  _NutritionPer100 _lookupNutrition(String name) {
    final key = name.trim().toLowerCase();
    if (key.isEmpty) return const _NutritionPer100(calories: 0, protein: 0, carbs: 0, fat: 0);
    if (_nutritionDb.containsKey(key)) return _nutritionDb[key]!;
    for (final entry in _nutritionDb.entries) {
      if (key.contains(entry.key) || entry.key.contains(key)) return entry.value;
    }
    return const _NutritionPer100(calories: 120, protein: 4, carbs: 18, fat: 3);
  }

  double _amountInBaseUnit(_IngredientData ingredient) {
    final amount = double.tryParse(ingredient.amount.trim()) ?? 0;
    switch (ingredient.unit) {
      case 'kg':
      case 'l':
        return amount * 1000;
      case 'oz':
        return amount * 28.35;
      case 'cup':
        return amount * 240;
      case 'tbsp':
        return amount * 15;
      case 'tsp':
        return amount * 5;
      case 'piece':
        return amount * 100;
      case 'g':
      case 'ml':
      default:
        return amount;
    }
  }

  _NutritionTotals _nutritionForIngredient(_IngredientData ingredient) {
    final base = _lookupNutrition(ingredient.name);
    final multiplier = _amountInBaseUnit(ingredient) / 100;
    return _NutritionTotals(
      calories: (base.calories * multiplier).round(),
      protein: (base.protein * multiplier).round(),
      carbs: (base.carbs * multiplier).round(),
      fat: (base.fat * multiplier).round(),
    );
  }

  _NutritionTotals get _totalNutrition {
    var total = const _NutritionTotals(calories: 0, protein: 0, carbs: 0, fat: 0);
    for (final ingredient in _ingredients) {
      total = total + _nutritionForIngredient(ingredient);
    }
    return total;
  }

  int get _servings => (int.tryParse(_servingsController.text.trim()) ?? 1).clamp(1, 99).toInt();
  _NutritionTotals get _perServing => _totalNutrition.dividedBy(_servings);

  void _addIngredient() => setState(() => _ingredients.add(_IngredientData(name: '', amount: '100', unit: 'g')));
  void _removeIngredient(int index) => setState(() => _ingredients.removeAt(index));

  void _saveRecipe() {
    final name = _recipeNameController.text.trim().isEmpty ? 'Untitled Recipe' : _recipeNameController.text.trim();
    final perServing = _perServing;
    if (perServing.calories <= 0) {
      AppActions.showSnack(context, 'Add valid ingredients before saving the recipe.', icon: Icons.info_outline, color: HealixColors.orange);
      return;
    }
    appState.addMeal(
      name,
      'Recipe Builder • $_servings serving${_servings == 1 ? '' : 's'} • ${_prepTimeController.text.trim()}',
      perServing.calories,
      proteinValue: perServing.protein,
      carbsValue: perServing.carbs,
      fatValue: perServing.fat,
    );
    AppActions.showSnack(context, '$name saved: ${perServing.calories} kcal per serving added to Food Logging.', icon: Icons.bookmark_added_outlined);
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Recipe Builder',
      selectedItem: 'Recipe Builder',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context),
          const SizedBox(height: 16),
          _buildSection(child: _buildBasicInfo()),
          const SizedBox(height: 16),
          _buildSection(child: _buildIngredients()),
          const SizedBox(height: 16),
          _buildSection(child: _buildNutrition()),
          const SizedBox(height: 16),
          _buildSection(child: _buildInstructions()),
          const SizedBox(height: 16),
          _buildButtons(),
          const SizedBox(height: 24),
          const Divider(color: HealixColors.border),
          const SizedBox(height: 16),
          const _RecipeLibrarySection(),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [HealixColors.navy, HealixColors.green], 
            begin: Alignment.topLeft, 
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: HealixColors.navy.withOpacity(0.12),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: const Row(
          children: [
            Icon(Icons.menu_book_outlined, color: Colors.white, size: 30),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Recipe Builder', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Ingredients now auto-calculate calories and macros', style: TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _buildBasicInfo() => LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 520;
          final name = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_label('Recipe Name'), const SizedBox(height: 8), _inputField(_recipeNameController)]);
          final servings = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_label('Servings'), const SizedBox(height: 8), _inputField(_servingsController, keyboardType: TextInputType.number, onChanged: (_) => setState(() {}))]);
          final prep = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_label('Prep Time'), const SizedBox(height: 8), _inputField(_prepTimeController)]);
          if (compact) return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [name, const SizedBox(height: 16), servings, const SizedBox(height: 16), prep]);
          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [name, const SizedBox(height: 16), Row(children: [Expanded(child: servings), const SizedBox(width: 12), Expanded(child: prep)])]);
        },
      );

  Widget _buildIngredients() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(child: Text('Ingredients', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HealixColors.navy))),
              OutlinedButton.icon(
                onPressed: _addIngredient, 
                icon: const Icon(Icons.add, size: 16), 
                label: const Text('Add'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: HealixColors.navy,
                  side: const BorderSide(color: HealixColors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._ingredients.asMap().entries.map((entry) {
            final index = entry.key;
            final ingredient = entry.value;
            final nutrition = _nutritionForIngredient(ingredient);
            return _IngredientRow(
              key: ValueKey(ingredient.id),
              ingredient: ingredient,
              units: _units,
              calories: nutrition.calories,
              onChanged: () => setState(() {}),
              onDelete: () => _removeIngredient(index),
            );
          }),
          const SizedBox(height: 12),
          InkWell(
            onTap: _addIngredient,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(border: Border.all(color: HealixColors.border), borderRadius: BorderRadius.circular(12)),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center, 
                children: [
                  Icon(Icons.add, size: 16, color: HealixColors.sub), 
                  SizedBox(width: 6), 
                  Text('Add Another Ingredient', style: TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ],
      );

  Widget _buildNutrition() {
    final total = _totalNutrition;
    final perServing = _perServing;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.grid_view_rounded, color: HealixColors.orange, size: 18), 
            SizedBox(width: 8), 
            Text('Auto-Calculated Nutrition', style: TextStyle(fontSize: 16, color: HealixColors.navy, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final boxes = [
              _calBox('Total Calories', '${total.calories}', icon: Icons.local_fire_department_rounded),
              _calBox('Per Serving', '${perServing.calories}', icon: Icons.room_service_outlined),
            ];
            if (constraints.maxWidth < 420) return Column(children: [boxes[0], const SizedBox(height: 12), boxes[1]]);
            return Row(children: [Expanded(child: boxes[0]), const SizedBox(width: 12), Expanded(child: boxes[1])]);
          },
        ),
        const SizedBox(height: 16),
        _macroBar('Protein', perServing.protein, appState.proteinGoal, const Color(0xFFEF4444)),
        const SizedBox(height: 10),
        _macroBar('Carbs', perServing.carbs, appState.carbsGoal, const Color(0xFF1A7AD4)),
        const SizedBox(height: 10),
        _macroBar('Fats', perServing.fat, appState.fatGoal, const Color(0xFFF59E0B)),
        const SizedBox(height: 12),
        const Text(
          'Values are estimated from common nutrition averages and update automatically when you change ingredient name, amount, unit, or servings.', 
          style: TextStyle(color: HealixColors.sub, fontSize: 12, height: 1.4, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  Widget _calBox(String label, String value, {required IconData icon}) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: HealixColors.navy.withOpacity(0.04), 
          borderRadius: BorderRadius.circular(12), 
          border: Border.all(color: HealixColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: HealixColors.orange, size: 24), 
            const SizedBox(height: 6), 
            Text(label, style: const TextStyle(color: HealixColors.sub, fontSize: 12, fontWeight: FontWeight.bold)), 
            const SizedBox(height: 4), 
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HealixColors.navy)),
          ],
        ),
      );

  Widget _macroBar(String label, int value, int max, Color color) {
    final progress = max <= 0 ? 0.0 : (value / max).clamp(0.0, 1.0).toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween, 
          children: [
            Text(label, style: const TextStyle(fontSize: 13, color: HealixColors.navy, fontWeight: FontWeight.bold)), 
            Text('${value}g', style: const TextStyle(fontSize: 13, color: HealixColors.navy, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999), 
          child: LinearProgressIndicator(
            value: progress, 
            minHeight: 8, 
            backgroundColor: HealixColors.border, 
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildInstructions() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Instructions', style: TextStyle(fontSize: 16, color: HealixColors.navy, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _instructionsController,
            maxLines: 4,
            decoration: InputDecoration(
              filled: true, 
              fillColor: HealixColors.navy.withOpacity(0.04), 
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), 
              contentPadding: const EdgeInsets.all(12),
            ),
            style: const TextStyle(fontSize: 13, color: HealixColors.navy, height: 1.6),
          ),
        ],
      );

  Widget _buildButtons() => LayoutBuilder(
        builder: (context, constraints) {
          final save = ElevatedButton.icon(
            onPressed: _saveRecipe, 
            icon: const Icon(Icons.save_outlined, color: Colors.white), 
            label: const Text('Save Recipe', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), 
            style: ElevatedButton.styleFrom(
              backgroundColor: HealixColors.navy, 
              padding: const EdgeInsets.symmetric(vertical: 14), 
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), 
              elevation: 0,
            ),
          );
          final mealPlan = OutlinedButton.icon(
            onPressed: () => _openScreen(const MealPlan()), 
            icon: const Icon(Icons.calendar_month_outlined), 
            label: const Text('Meal Plan'), 
            style: OutlinedButton.styleFrom(
              foregroundColor: HealixColors.navy,
              padding: const EdgeInsets.symmetric(vertical: 14), 
              side: const BorderSide(color: HealixColors.border), 
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
          if (constraints.maxWidth < 420) return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [save, const SizedBox(height: 12), mealPlan]);
          return Row(children: [Expanded(flex: 2, child: save), const SizedBox(width: 12), Expanded(child: mealPlan)]);
        },
      );

  Widget _buildSection({required Widget child}) => FeatureSectionCard(
        padding: const EdgeInsets.all(16), 
        radius: 16, 
        child: child,
      );

  Widget _label(String text) => Text(text, style: const TextStyle(fontSize: 13, color: HealixColors.sub, fontWeight: FontWeight.bold));

  Widget _inputField(TextEditingController controller, {String? hint, TextInputType? keyboardType, Function(String)? onChanged}) => TextField(
        controller: controller,
        keyboardType: keyboardType,
        onChanged: onChanged,
        decoration: InputDecoration(
          hintText: hint, 
          filled: true, 
          fillColor: HealixColors.navy.withOpacity(0.04), 
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), 
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
        style: const TextStyle(fontSize: 13, color: HealixColors.navy, fontWeight: FontWeight.w600),
      );
}

class _IngredientData {
  _IngredientData({required this.name, required this.amount, required this.unit}) : id = UniqueKey().toString();
  final String id;
  String name;
  String amount;
  String unit;
}

class _NutritionPer100 {
  const _NutritionPer100({required this.calories, required this.protein, required this.carbs, required this.fat});
  final int calories;
  final int protein;
  final int carbs;
  final int fat;
}

class _NutritionTotals {
  const _NutritionTotals({required this.calories, required this.protein, required this.carbs, required this.fat});
  final int calories;
  final int protein;
  final int carbs;
  final int fat;
  _NutritionTotals operator +(_NutritionTotals other) => _NutritionTotals(calories: calories + other.calories, protein: protein + other.protein, carbs: carbs + other.carbs, fat: fat + other.fat);
  _NutritionTotals dividedBy(int servings) => _NutritionTotals(calories: (calories / servings).round(), protein: (protein / servings).round(), carbs: (carbs / servings).round(), fat: (fat / servings).round());
}

class _IngredientRow extends StatefulWidget {
  const _IngredientRow({super.key, required this.ingredient, required this.units, required this.calories, required this.onChanged, required this.onDelete});
  final _IngredientData ingredient;
  final List<String> units;
  final int calories;
  final VoidCallback onChanged;
  final VoidCallback onDelete;

  @override
  State<_IngredientRow> createState() => _IngredientRowState();
}

class _IngredientRowState extends State<_IngredientRow> {
  late final TextEditingController _nameController;
  late final TextEditingController _amountController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.ingredient.name);
    _amountController = TextEditingController(text: widget.ingredient.amount);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  InputDecoration _decoration(String hint) => InputDecoration(
        hintText: hint, 
        filled: true, 
        fillColor: HealixColors.navy.withOpacity(0.04), 
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none), 
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10), 
        isDense: true,
      );

  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 560;
          final nameField = TextField(
            controller: _nameController,
            style: const TextStyle(fontSize: 13, color: HealixColors.navy, fontWeight: FontWeight.w600),
            decoration: _decoration('Ingredient'),
            onChanged: (value) {
              widget.ingredient.name = value;
              widget.onChanged();
            },
          );
          final amountField = TextField(
            controller: _amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(fontSize: 13, color: HealixColors.navy, fontWeight: FontWeight.w600),
            decoration: _decoration('Amount'),
            onChanged: (value) {
              widget.ingredient.amount = value;
              widget.onChanged();
            },
          );
          final unitField = _unitDropdown();
          final caloriesText = Text('${widget.calories} cal', style: const TextStyle(color: HealixColors.orange, fontWeight: FontWeight.bold, fontSize: 13));
          final deleteButton = IconButton(onPressed: widget.onDelete, icon: const Icon(Icons.delete_outline, color: Colors.redAccent), tooltip: 'Remove ingredient');

          if (wide) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [Expanded(flex: 3, child: nameField), const SizedBox(width: 8), Expanded(flex: 2, child: amountField), const SizedBox(width: 8), SizedBox(width: 110, child: unitField), const SizedBox(width: 10), SizedBox(width: 72, child: caloriesText), deleteButton]),
            );
          }
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: HealixColors.navy.withOpacity(0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: HealixColors.border)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, 
              children: [
                nameField, 
                const SizedBox(height: 8), 
                Row(
                  children: [
                    Expanded(child: amountField), 
                    const SizedBox(width: 8), 
                    SizedBox(width: 92, child: unitField), 
                    const SizedBox(width: 8), 
                    caloriesText, 
                    deleteButton,
                  ],
                ),
              ],
            ),
          );
        },
      );

  Widget _unitDropdown() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: HealixColors.border)),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: widget.units.contains(widget.ingredient.unit) ? widget.ingredient.unit : 'g',
            isExpanded: true,
            isDense: true,
            style: const TextStyle(fontSize: 13, color: HealixColors.navy, fontWeight: FontWeight.w600),
            items: widget.units.map((unit) => DropdownMenuItem(value: unit, child: Text(unit))).toList(),
            onChanged: (value) {
              if (value == null) return;
              widget.ingredient.unit = value;
              widget.onChanged();
            },
          ),
        ),
      );
}

class _RecipeLibrarySection extends StatefulWidget {
  const _RecipeLibrarySection();

  @override
  State<_RecipeLibrarySection> createState() => _RecipeLibrarySectionState();
}

class _RecipeLibrarySectionState extends State<_RecipeLibrarySection> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _sortValue = 'default';
  
  List<Map<String, dynamic>> _allRecipes = [];
  List<Map<String, dynamic>> _filteredRecipes = [];
  bool _isLoading = true;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _loadRecipes();
    _searchCtrl.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchCtrl.removeListener(_onSearchChanged);
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _filterAndSortRecipes();
  }

  Future<void> _loadRecipes() async {
    setState(() {
      _isLoading = true;
      _errorText = null;
    });
    try {
      final recipes = await ContentService.getRecipes();
      setState(() {
        _allRecipes = recipes;
        _isLoading = false;
      });
      _filterAndSortRecipes();
    } catch (e) {
      setState(() {
        _errorText = 'Could not load recipe library. Check your connection.';
        _isLoading = false;
      });
    }
  }

  void _filterAndSortRecipes() {
    final query = _searchCtrl.text.trim().toLowerCase();
    List<Map<String, dynamic>> temp = [];
    if (query.isEmpty) {
      temp = List.from(_allRecipes);
    } else {
      temp = _allRecipes.where((recipe) {
        final name = (recipe['name'] ?? '').toString().toLowerCase();
        final instructions = (recipe['instructions'] ?? '').toString().toLowerCase();
        return name.contains(query) || instructions.contains(query);
      }).toList();
    }

    if (_sortValue == 'cal_asc') {
      temp.sort((a, b) => _getInt(a['calories']).compareTo(_getInt(b['calories'])));
    } else if (_sortValue == 'cal_desc') {
      temp.sort((a, b) => _getInt(b['calories']).compareTo(_getInt(a['calories'])));
    } else if (_sortValue == 'time_asc') {
      temp.sort((a, b) => _getInt(a['prep_time_min'] ?? a['prepTime']).compareTo(_getInt(b['prep_time_min'] ?? b['prepTime'])));
    } else if (_sortValue == 'time_desc') {
      temp.sort((a, b) => _getInt(b['prep_time_min'] ?? b['prepTime']).compareTo(_getInt(a['prep_time_min'] ?? a['prepTime'])));
    }

    setState(() {
      _filteredRecipes = temp;
    });
  }

  int _getInt(dynamic val) {
    if (val == null) return 0;
    if (val is num) return val.round();
    return int.tryParse(val.toString()) ?? 0;
  }

  String _emojiForRecipe(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('salad')) return '🥗';
    if (lower.contains('stew') || lower.contains('soup')) return '🍲';
    if (lower.contains('pancake')) return '🥞';
    if (lower.contains('chicken')) return '🍗';
    if (lower.contains('beef') || lower.contains('steak')) return '🥩';
    if (lower.contains('fish') || lower.contains('salmon') || lower.contains('tuna')) return '🐟';
    if (lower.contains('egg')) return '🍳';
    if (lower.contains('rice') || lower.contains('bowl')) return '🍚';
    if (lower.contains('smoothie') || lower.contains('shake') || lower.contains('juice')) return '🥤';
    if (lower.contains('oat') || lower.contains('porridge')) return '🥣';
    if (lower.contains('toast') || lower.contains('bread') || lower.contains('sandwich')) return '🍞';
    return '🍳';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Recipe Library', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HealixColors.navy)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: HealixColors.border)),
                child: TextField(
                  controller: _searchCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Search recipes...',
                    border: InputBorder.none,
                    icon: Icon(Icons.search, size: 18, color: HealixColors.sub),
                  ),
                  style: const TextStyle(fontSize: 14, color: HealixColors.navy),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: HealixColors.border)),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _sortValue,
                  icon: const Icon(Icons.sort, size: 18, color: HealixColors.sub),
                  style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600, fontSize: 13),
                  items: const [
                    DropdownMenuItem(value: 'default', child: Text('Default')),
                    DropdownMenuItem(value: 'cal_asc', child: Text('Calories ↑')),
                    DropdownMenuItem(value: 'cal_desc', child: Text('Calories ↓')),
                    DropdownMenuItem(value: 'time_asc', child: Text('Prep Time ↑')),
                    DropdownMenuItem(value: 'time_desc', child: Text('Prep Time ↓')),
                  ],
                  onChanged: (v) {
                    if (v != null) {
                      setState(() => _sortValue = v);
                      _filterAndSortRecipes();
                    }
                  },
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Builder(
          builder: (_) {
            if (_isLoading) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: CircularProgressIndicator(color: HealixColors.navy),
                ),
              );
            }
            if (_errorText != null) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(
                    children: [
                      Text(_errorText!, style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loadRecipes,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HealixColors.navy,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              );
            }
            if (_filteredRecipes.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Text(
                    'No recipes found.',
                    style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold),
                  ),
                ),
              );
            }
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                mainAxisExtent: 150,
              ),
              itemCount: _filteredRecipes.length,
              itemBuilder: (context, index) {
                final recipe = _filteredRecipes[index];
                final name = (recipe['name'] ?? 'Recipe').toString();
                final calories = _getInt(recipe['calories']);
                final prepTime = _getInt(recipe['prep_time_min'] ?? recipe['prepTime']);
                final emoji = recipe['emoji'] ?? _emojiForRecipe(name);
                return InkWell(
                  onTap: () => _showRecipeDetails(context, recipe),
                  child: FeatureSectionCard(
                    padding: const EdgeInsets.all(12),
                    radius: 16,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(emoji, style: const TextStyle(fontSize: 36)),
                        const SizedBox(height: 8),
                        Text(
                          name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: HealixColors.navy),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$calories kcal • ${prepTime}m',
                          style: const TextStyle(color: HealixColors.sub, fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ],
    );
  }

  void _showRecipeDetails(BuildContext context, Map<String, dynamic> recipe) {
    final name = (recipe['name'] ?? 'Recipe').toString();
    final calories = _getInt(recipe['calories']);
    final prepTime = _getInt(recipe['prep_time_min'] ?? recipe['prepTime']);
    final instructions = (recipe['instructions'] ?? '').toString();
    final youtubeUri = Uri.https('www.youtube.com', '/results', {'search_query': '$name recipe how to make'});
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(name, style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Chip(
                    label: Text('$calories kcal'), 
                    backgroundColor: HealixColors.orange.withOpacity(0.12), 
                    labelStyle: const TextStyle(color: HealixColors.orange, fontWeight: FontWeight.bold),
                    side: BorderSide.none,
                  ),
                  const SizedBox(width: 8),
                  Chip(
                    label: Text('$prepTime mins'), 
                    backgroundColor: HealixColors.teal.withOpacity(0.12), 
                    labelStyle: const TextStyle(color: HealixColors.teal, fontWeight: FontWeight.bold),
                    side: BorderSide.none,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // YouTube button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final launched = await launchUrl(youtubeUri, mode: LaunchMode.externalApplication);
                    if (!ctx.mounted) return;
                    if (!launched) {
                      AppActions.showSnack(
                        ctx,
                        'Could not open YouTube.',
                        icon: Icons.error_outline_rounded,
                        color: HealixColors.orange,
                      );
                    }
                  },
                  icon: const Icon(Icons.ondemand_video_rounded, color: Colors.white),
                  label: const Text('Watch on YouTube', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF0000),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Instructions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: HealixColors.navy)),
              const SizedBox(height: 8),
              Text(instructions, style: const TextStyle(height: 1.5, color: HealixColors.navy, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx), 
            child: const Text('Close', style: TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
