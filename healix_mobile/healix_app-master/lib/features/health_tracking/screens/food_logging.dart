import 'package:flutter/material.dart';
import 'package:healix_app/core/services/food_catalog_service.dart';
import 'package:healix_app/core/services/media_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';

class FoodLogging extends StatefulWidget {
  const FoodLogging({super.key});

  @override
  State<FoodLogging> createState() => _FoodLoggingState();
}

class _FoodLoggingState extends State<FoodLogging> {
  final TextEditingController _searchController = TextEditingController();
  DateTime _selectedDate = DateTime.now();

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshForDate(_selectedDate);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  /// Fetches food logs and recomputes macros for [date] from the backend.
  void _refreshForDate(DateTime date) {
    final dateText =
        '${date.year.toString().padLeft(4, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.day.toString().padLeft(2, '0')}';
    appState.fetchTrackingLogs(date: dateText);
  }

  void _warnIfCaloriesExceeded(int beforeCalories) {
    if (!mounted) return;
    final goal = appState.calorieGoal;
    final after = appState.caloriesConsumed;
    if (goal > 0 && beforeCalories <= goal && after > goal) {
      final over = after - goal;
      showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: HealixColors.orange),
              SizedBox(width: 10),
              Text('Calories goal exceeded'),
            ],
          ),
          content: Text('You are $over kcal over today\'s goal. Consider a lighter next meal or add a workout.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('OK')),
          ],
        ),
      );
    } else if (goal > 0 && after > goal) {
      AppActions.showSnack(context, 'You are ${after - goal} kcal over today\'s goal.', icon: Icons.warning_amber_rounded, color: HealixColors.orange);
    }
  }

  Future<void> _addMealAndNotify(
    String title, String description, int calories, {
    int protein = 0, int carbs = 0, int fat = 0,
    DateTime? date, String mealType = 'Snack',
    int? foodId,
  }) async {
    final before = appState.caloriesConsumed;
    await appState.addMeal(
      title, description, calories,
      proteinValue: protein, carbsValue: carbs, fatValue: fat,
      date: date, mealType: mealType, foodId: foodId,
    );
    _warnIfCaloriesExceeded(before);
  }

  Future<void> _manualEntry() async {
    final name = TextEditingController();
    String mealType = 'Breakfast';
    final calories = TextEditingController();
    final protein = TextEditingController();
    final carbs = TextEditingController();
    final fat = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text('Manual Meal Entry'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dialogField(name, 'Meal name'),
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: DropdownButtonFormField<String>(
                    value: mealType,
                    decoration: InputDecoration(labelText: 'Meal Type', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                    items: const ['Snack', 'Breakfast', 'Lunch', 'Dinner', 'Supper'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                    onChanged: (v) { if (v != null) setDialogState(() => mealType = v); },
                  ),
                ),
                _dialogField(calories, 'Calories', keyboardType: TextInputType.number),
                Row(children: [Expanded(child: _dialogField(protein, 'Protein g', keyboardType: TextInputType.number)), const SizedBox(width: 8), Expanded(child: _dialogField(carbs, 'Carbs g', keyboardType: TextInputType.number)), const SizedBox(width: 8), Expanded(child: _dialogField(fat, 'Fat g', keyboardType: TextInputType.number))]),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Save Entry')),
          ],
        ),
      ),
    );
    if (saved == true) {
      final parsedCalories = int.tryParse(calories.text) ?? 0;
      if (name.text.trim().isEmpty || parsedCalories <= 0) {
        if (mounted) AppActions.showSnack(context, 'Enter a meal name and calories first', icon: Icons.info_outline);
        return;
      }
      await _addMealAndNotify(
        name.text,
        mealType,
        parsedCalories,
        protein: int.tryParse(protein.text) ?? 0,
        carbs: int.tryParse(carbs.text) ?? 0,
        fat: int.tryParse(fat.text) ?? 0,
        date: _selectedDate,
        mealType: mealType,
      );
      if (mounted) AppActions.showSnack(context, 'Meal logged and nutrition totals updated', icon: Icons.restaurant_outlined);
    }
  }

  Widget _dialogField(TextEditingController controller, String label, {TextInputType? keyboardType}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
      ),
    );
  }

  Future<void> _createCustomFood() async {
    final name = TextEditingController();
    final category = TextEditingController();
    final serving = TextEditingController();
    final calories = TextEditingController();
    final protein = TextEditingController();
    final carbs = TextEditingController();
    final fat = TextEditingController();
    
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Create Custom Food'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _dialogField(name, 'Food name'),
            _dialogField(category, 'Category'),
            _dialogField(serving, 'Serving size'),
            _dialogField(calories, 'Calories', keyboardType: TextInputType.number),
            Row(children: [Expanded(child: _dialogField(protein, 'P (g)', keyboardType: TextInputType.number)), const SizedBox(width: 8), Expanded(child: _dialogField(carbs, 'C (g)', keyboardType: TextInputType.number)), const SizedBox(width: 8), Expanded(child: _dialogField(fat, 'F (g)', keyboardType: TextInputType.number))]),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save to Database')),
        ],
      ),
    );

    if (saved == true && name.text.trim().isNotEmpty) {
      final parsedCalories = int.tryParse(calories.text) ?? 0;
      if (parsedCalories <= 0) {
        if (mounted) AppActions.showSnack(context, 'Enter a valid calorie value', icon: Icons.info_outline);
        return;
      }
      try {
        final foodId = await FoodCatalogService.createFood(
          foodName: name.text.trim(),
          category: category.text.trim().isEmpty ? 'Custom' : category.text.trim(),
          servingSize: serving.text.trim().isEmpty ? '1 serving' : serving.text.trim(),
        );
        if (!mounted) return;
        if (foodId != null) {
          await FoodCatalogService.saveNutrition(
            foodId,
            calories: parsedCalories,
            protein: int.tryParse(protein.text) ?? 0,
            carbs: int.tryParse(carbs.text) ?? 0,
            fat: int.tryParse(fat.text) ?? 0,
          );
          AppActions.showSnack(context, 'Custom food saved to database', icon: Icons.save);
        } else {
          AppActions.showSnack(context, 'Failed to save custom food', icon: Icons.error_outline, color: Colors.red.shade700);
        }
      } catch (_) {
        if (mounted) AppActions.showSnack(context, 'Network error saving food', icon: Icons.error_outline, color: Colors.red.shade700);
      }
    }
  }

  Future<void> _searchFood() async {
    final queryCtrl = TextEditingController();
    List<Map<String, dynamic>> results = [];
    bool isSearching = false;
    String? errorText;

    Future<void> doSearch(String q, void Function(void Function()) setSheetState) async {
      if (q.isEmpty) return;
      setSheetState(() { isSearching = true; errorText = null; });
      try {
        final foods = await FoodCatalogService.searchFoods(q);
        setSheetState(() {
          results = foods;
          errorText = null;
          isSearching = false;
        });
      } catch (e) {
        setSheetState(() {
          errorText = 'Could not reach the server. Check your connection and try again.\n\nDetail: $e';
          isSearching = false;
        });
      }
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (sheetContext) => StatefulBuilder(
        builder: (ctx, setSheetState) => SafeArea(
          child: Padding(
            padding: EdgeInsets.only(left: 18, right: 18, top: 18, bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Search Food', style: TextStyle(color: HealixColors.navy, fontSize: 18, fontWeight: FontWeight.w900)),
                const SizedBox(height: 12),
                TextField(
                  controller: queryCtrl,
                  autofocus: true,
                  decoration: InputDecoration(
                    hintText: 'e.g. Chicken, Rice, Apple...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: isSearching
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                          )
                        : IconButton(
                            icon: const Icon(Icons.send_rounded, color: HealixColors.navy),
                            onPressed: () => doSearch(queryCtrl.text.trim(), setSheetState),
                          ),
                  ),
                  onSubmitted: (val) => doSearch(val.trim(), setSheetState),
                ),
                const SizedBox(height: 12),
                if (isSearching)
                  const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
                else if (errorText != null)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Icon(Icons.cloud_off_outlined, size: 40, color: Colors.red.shade300),
                        const SizedBox(height: 8),
                        Text(
                          errorText!.split('\n\nDetail:').first,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () => doSearch(queryCtrl.text.trim(), setSheetState),
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                else if (results.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Icon(Icons.search_off, size: 40, color: HealixColors.sub),
                        const SizedBox(height: 8),
                        Text(
                          queryCtrl.text.trim().isEmpty
                              ? 'Type a food name above and press search.'
                              : 'No foods found for "${queryCtrl.text.trim()}". Try a different keyword.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: HealixColors.sub, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                else
                  SizedBox(
                    height: 300,
                    child: ListView.builder(
                      itemCount: results.length,
                      itemBuilder: (context, index) {
                        final f = results[index];
                        final foodName = FoodCatalogService.nameOf(f);
                        final cal = FoodCatalogService.caloriesOf(f);
                        final p = FoodCatalogService.proteinOf(f);
                        final c = FoodCatalogService.carbsOf(f);
                        final fat = FoodCatalogService.fatOf(f);
                        return ListTile(
                          leading: const Icon(Icons.restaurant_outlined, color: HealixColors.navy),
                          title: Text(foodName, style: const TextStyle(fontWeight: FontWeight.w800)),
                          subtitle: Text('$cal kcal  •  P${p}g  C${c}g  F${fat}g'),
                          trailing: const Icon(Icons.add_circle_outline, color: HealixColors.green),
                          onTap: () async {
                            final fId = f['food_id'] as int?;
                            await _addMealAndNotify(
                              foodName, 'Searched item', cal,
                              protein: p, carbs: c, fat: fat,
                              date: _selectedDate,
                              foodId: fId,
                            );
                            if (!sheetContext.mounted) return;
                            Navigator.pop(sheetContext);
                            if (mounted) AppActions.showSnack(context, '$foodName added to food log');
                          },
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _scanBarcode() async {
    final result = await MediaService.pickFromCamera(actionName: 'barcode image');
    if (!mounted) return;
    if (!result.success) {
      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    await AppActions.simulateProcess(
      context,
      title: 'Scanning barcode',
      loadingMessage: 'Reading the captured barcode image...',
      successMessage: 'Barcode scanned: Protein Bar added',
    );
    await _addMealAndNotify('Protein Bar', 'Scanned from barcode camera capture', 220, protein: 20, carbs: 22, fat: 7, date: _selectedDate);
  }

  Future<void> _photoUpload() async {
    final result = await MediaService.pickFromGallery(actionName: 'meal photo');
    if (!mounted) return;
    if (!result.success) {
      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    await AppActions.simulateProcess(
      context,
      title: 'Analyzing meal photo',
      loadingMessage: 'Estimating calories and macros from your selected image...',
      successMessage: 'Photo analyzed: Mixed Plate added',
    );
    await _addMealAndNotify('Mixed Plate', 'Estimated from uploaded meal photo', 520, protein: 30, carbs: 55, fat: 20, date: _selectedDate);
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Food Logging',
      selectedItem: 'Food Logging',
      searchController: _searchController,
      openScreen: _openScreen,
      child: AnimatedBuilder(
        animation: appState,
        builder: (context, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Selector
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.88),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: HealixColors.border),
                boxShadow: [
                  BoxShadow(
                    color: HealixColors.navy.withOpacity(0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left, color: HealixColors.navy),
                    onPressed: () {
                      final newDate = _selectedDate.subtract(const Duration(days: 1));
                      setState(() => _selectedDate = newDate);
                      _refreshForDate(newDate);
                    },
                  ),
                  Text(
                    '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HealixColors.navy),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right, color: HealixColors.navy),
                    onPressed: () {
                      final newDate = _selectedDate.add(const Duration(days: 1));
                      setState(() => _selectedDate = newDate);
                      _refreshForDate(newDate);
                    },
                  ),
                ],
              ),
            ),
            _FoodHeroCard(calories: appState.caloriesConsumed, goal: appState.calorieGoal, progress: appState.caloriesProgress),
            const SizedBox(height: 20),
            _FoodActionsCard(onManual: _manualEntry, onSearch: _searchFood, onScan: _scanBarcode, onPhoto: _photoUpload, onCustom: _createCustomFood),
            const SizedBox(height: 20),
            _MealsLoggedCard(meals: appState.meals, onDelete: appState.removeMeal),
            const SizedBox(height: 20),
            _MacrosProgressCard(),
          ],
        ),
      ),
    );
  }
}

class _FoodHeroCard extends StatelessWidget {
  const _FoodHeroCard({required this.calories, required this.goal, required this.progress});
  final int calories;
  final int goal;
  final double progress;

  @override
  Widget build(BuildContext context) {
    final exceeded = goal > 0 && calories > goal;
    final difference = (calories - goal).abs();
    final progressValue = goal <= 0 ? 0.0 : (calories / goal).clamp(0.0, 1.0).toDouble();
    final statusText = exceeded ? '$difference over goal' : '${(goal - calories).clamp(0, goal)} remaining';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: HealixColors.navy,
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [HealixColors.navy, HealixColors.navyDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.15),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.restaurant_outlined, color: Colors.white, size: 30),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Food Logging', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Track your meals & nutrition', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), borderRadius: BorderRadius.circular(16)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        'Today\'s Calories\n$calories / $goal kcal',
                        style: const TextStyle(color: Colors.white, fontSize: 17, height: 1.4, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Text(
                      statusText,
                      textAlign: TextAlign.end,
                      style: TextStyle(color: exceeded ? HealixColors.orange : HealixColors.green, fontSize: 14, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: progressValue,
                    minHeight: 8,
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(exceeded ? HealixColors.orange : HealixColors.green),
                  ),
                ),
                if (exceeded) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: HealixColors.orange.withOpacity(.20), borderRadius: BorderRadius.circular(12)),
                    child: const Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Expanded(child: Text('You passed today\'s calorie goal.', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13))),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FoodActionsCard extends StatelessWidget {
  const _FoodActionsCard({required this.onManual, required this.onSearch, required this.onScan, required this.onPhoto, required this.onCustom});
  final VoidCallback onManual;
  final VoidCallback onSearch;
  final VoidCallback onScan;
  final VoidCallback onPhoto;
  final VoidCallback onCustom;

  @override
  Widget build(BuildContext context) {
    final actions = [
      _ActionData(Icons.add, 'Manual Entry', HealixColors.navy, onManual),
      _ActionData(Icons.search, 'Search Food', HealixColors.green, onSearch),
      _ActionData(Icons.qr_code_scanner, 'Scan Barcode', HealixColors.teal, onScan),
      _ActionData(Icons.camera_alt_outlined, 'Photo Upload', HealixColors.orange, onPhoto),
      _ActionData(Icons.restaurant_menu, 'Custom Food', Colors.purple, onCustom),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Log Food', style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final crossAxisCount = constraints.maxWidth < 420 ? 1 : 2;
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: actions.length,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossAxisCount,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                mainAxisExtent: 100,
              ),
              itemBuilder: (context, index) => _ActionCard(data: actions[index]),
            );
          },
        ),
      ],
    );
  }
}

class _MealsLoggedCard extends StatelessWidget {
  const _MealsLoggedCard({required this.meals, required this.onDelete});
  final List<MealLog> meals;
  final void Function(int) onDelete;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Today\'s Meals', style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        if (meals.isEmpty)
          const Text('No meals logged yet.', style: TextStyle(color: HealixColors.sub, fontSize: 14))
        else
          ...meals.asMap().entries.map((entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _MealTile(meal: entry.value, onDelete: () => onDelete(entry.key)),
              )),
      ],
    );
  }
}

class _MacrosProgressCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    double safe(int current, int total) => total == 0 ? 0 : (current / total).clamp(0.0, 1.0).toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Today\'s Macros', style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _MacroProgressRow(label: 'Protein', current: '${appState.protein}g', total: '${appState.proteinGoal}g', value: safe(appState.protein, appState.proteinGoal), color: const Color(0xFFEF4444)),
        const SizedBox(height: 12),
        _MacroProgressRow(label: 'Carbs', current: '${appState.carbs}g', total: '${appState.carbsGoal}g', value: safe(appState.carbs, appState.carbsGoal), color: const Color(0xFF1A7AD4)),
        const SizedBox(height: 12),
        _MacroProgressRow(label: 'Fats', current: '${appState.fat}g', total: '${appState.fatGoal}g', value: safe(appState.fat, appState.fatGoal), color: const Color(0xFFF59E0B)),
      ],
    );
  }
}

class _ActionData {
  const _ActionData(this.icon, this.label, this.color, this.onTap);
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.data});
  final _ActionData data;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(12),
      radius: 16,
      child: InkWell(
        onTap: data.onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(data.icon, color: data.color, size: 24),
            const SizedBox(height: 8),
            Text(
              data.label,
              textAlign: TextAlign.center,
              style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

class _MealTile extends StatelessWidget {
  const _MealTile({required this.meal, required this.onDelete});
  final MealLog meal;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(14),
      radius: 16,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: HealixColors.navy.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.restaurant, color: HealixColors.navy, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(meal.title, style: const TextStyle(color: HealixColors.navy, fontSize: 15, fontWeight: FontWeight.bold)), 
                const SizedBox(height: 4), 
                Text(meal.description, style: const TextStyle(color: HealixColors.sub, fontSize: 13, height: 1.35)),
                const SizedBox(height: 6),
                Text('P: ${meal.protein}g | C: ${meal.carbs}g | F: ${meal.fat}g', style: const TextStyle(color: HealixColors.navy, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${meal.calories} kcal', style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(meal.time, style: const TextStyle(color: HealixColors.sub, fontSize: 11)),
              IconButton(
                visualDensity: VisualDensity.compact,
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MacroProgressRow extends StatelessWidget {
  const _MacroProgressRow({required this.label, required this.current, required this.total, required this.value, required this.color});
  final String label;
  final String current;
  final String total;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(label, style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold))),
            Text('$current / $total', style: const TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: value,
            minHeight: 8,
            backgroundColor: HealixColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
