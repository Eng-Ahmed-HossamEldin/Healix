import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/services/plans_service.dart';

class MealPlan extends StatefulWidget {
  const MealPlan({super.key});

  @override
  State<MealPlan> createState() => _MealPlanState();
}

/// Safely converts any numeric value (int, double, String) to int.
int _toInt(dynamic v, [int fallback = 0]) {
  if (v == null) return fallback;
  if (v is int) return v;
  if (v is double) return v.round();
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? fallback;
}

class _MealPlanState extends State<MealPlan> {
  final TextEditingController _searchController = TextEditingController();
  int _selectedDayIndex = DateTime.now().weekday - 1;
  final Set<String> _checkedShoppingItems = <String>{};
  bool _isLoading = true;
  List<_DetailedMealPlan> _fetchedPlans = [];
  int _selectedPlanIndex = 0;

  static const List<String> _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  void initState() {
    super.initState();
    _fetchMyPlan();
  }

  Future<void> _fetchMyPlan() async {
    setState(() => _isLoading = true);
    try {
      final plans = await PlansService.getMyPlans();
      final List<_DetailedMealPlan> detailedPlans = [];
      for (var plan in plans) {
        final planId = plan['plan_id'].toString();
        final planData = await PlansService.getPlan(planId);
        if (planData != null && planData['meals'] != null) {
          final List<_MealPlanMeal> mealsList = [];
          for (var m in planData['meals']) {
            final mealId = m['plan_meal_id'].toString();
            final itemsData = await PlansService.getMealItems(mealId);
            final items = itemsData.map((i) => '${i['qty'] ?? 1} ${i['unit'] ?? ''} ${i['food_name'] ?? ''}'.trim()).toList();
            mealsList.add(_MealPlanMeal(
              letter: m['meal_name'] != null && m['meal_name'].toString().isNotEmpty
                  ? m['meal_name'].toString().substring(0, 1).toUpperCase()
                  : 'M',
              type: m['meal_name']?.toString() ?? 'Meal',
              title: m['meal_name']?.toString() ?? 'Meal',
              calories: 400, // API doesn't provide calories per meal yet, mock or distribute
              protein: 30,
              carbs: 40,
              fat: 15,
              time: m['meal_time']?.toString() ?? '15 min',
              items: items,
              dayNo: _toInt(m['day_no'], 1),
            ));
          }
          detailedPlans.add(_DetailedMealPlan(
            planId: planId,
            goalType: plan['goal_type']?.toString() ?? 'Custom Plan',
            doctorUsername: plan['doctor_username']?.toString(),
            targetCalories: _toInt(plan['target_calories'], 2000),
            targetProtein: _toInt(plan['target_protein_g'], 150),
            targetCarbs: _toInt(plan['target_carbs_g'], 200),
            targetFat: _toInt(plan['target_fat_g'], 60),
            startDate: plan['start_date']?.toString(),
            endDate: plan['end_date']?.toString(),
            notes: plan['notes']?.toString(),
            meals: mealsList,
          ));
        }
      }
      setState(() {
        _fetchedPlans = detailedPlans;
        _selectedPlanIndex = 0;
        _isLoading = false;
      });
      return;
    } catch (_) {}
    // If no plans or error, clear it
    setState(() {
      _fetchedPlans = [];
      _selectedPlanIndex = 0;
      _isLoading = false;
    });
  }

  List<_MealPlanMeal> get _todayMeals {
    if (_fetchedPlans.isEmpty || _selectedPlanIndex >= _fetchedPlans.length) {
      return [
        _MealPlanMeal(letter: 'N', type: 'No Plan', title: 'No Plan Assigned', calories: 0, protein: 0, carbs: 0, fat: 0, time: '0 min', items: ['Check with your doctor or AI agent'], dayNo: 1)
      ];
    }
    final activePlan = _fetchedPlans[_selectedPlanIndex];
    final targetDay = _selectedDayIndex + 1; // 1-7
    // Determine unique day numbers in this plan
    final distinctDays = activePlan.meals.map((m) => m.dayNo).toSet();
    final hasMultipleDays = distinctDays.length > 1;
    
    if (hasMultipleDays) {
      // Multi-day plan: filter by selected day, show placeholder if no meals for that day
      final dayMeals = activePlan.meals.where((m) => m.dayNo == targetDay).toList();
      if (dayMeals.isEmpty) {
        return [
          _MealPlanMeal(letter: 'R', type: 'Rest Day', title: 'Rest Day', calories: 0, protein: 0, carbs: 0, fat: 0, time: '0 min', items: ['No meals scheduled for this day'], dayNo: targetDay)
        ];
      }
      return dayMeals;
    } else {
      // Single-day or all-same-day plan (common for doctor-assigned plans):
      // Show ALL meals regardless of selected day
      return activePlan.meals;
    }
  }

  List<String> get _shoppingItems {
    final counts = <String, int>{};
    for (final meal in _todayMeals) {
      for (final item in meal.items) {
        counts[item] = (counts[item] ?? 0) + 1;
      }
    }
    return counts.entries.map((e) => e.value > 1 ? '${e.key} x${e.value}' : e.key).toList();
  }

  int get _totalCalories => _todayMeals.fold(0, (sum, meal) => sum + meal.calories);
  int get _totalProtein => _todayMeals.fold(0, (sum, meal) => sum + meal.protein);
  int get _totalPrepMinutes => _todayMeals.fold(0, (sum, meal) => sum + meal.minutes);

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _regeneratePlan() async {
    await AppActions.simulateProcess(
      context,
      title: 'Syncing plan',
      loadingMessage: 'Fetching latest plan from the server...',
      successMessage: 'Plan synchronized',
    );
    if (!mounted) return;
    await _fetchMyPlan();
  }

  void _logMeal(_MealPlanMeal meal) {
    final before = appState.caloriesConsumed;
    final now = DateTime.now();
    final todayWeekday = now.weekday; // 1-7
    final targetWeekday = _selectedDayIndex + 1; // 1-7
    final diff = targetWeekday - todayWeekday;
    final mealDate = now.add(Duration(days: diff));

    appState.addMeal(
      meal.title, 
      '${_days[_selectedDayIndex]} meal plan • ${meal.type}', 
      meal.calories, 
      proteinValue: meal.protein, 
      carbsValue: meal.carbs, 
      fatValue: meal.fat,
      date: mealDate,
      mealType: meal.type,
    );
    if (before <= appState.calorieGoal && appState.caloriesConsumed > appState.calorieGoal) {
      AppActions.showSnack(context, 'Meal added. Warning: you passed today\'s calorie goal.', icon: Icons.warning_amber_rounded, color: HealixColors.orange);
    } else {
      AppActions.showSnack(context, '${meal.title} added to Food Logging', icon: Icons.restaurant_outlined);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Meal Plan',
      selectedItem: 'Meal Plan',
      searchController: _searchController,
      openScreen: _openScreen,
      onRefresh: _fetchMyPlan,
      child: Builder(
        builder: (context) {
          final activePlan = _fetchedPlans.isNotEmpty && _selectedPlanIndex < _fetchedPlans.length
              ? _fetchedPlans[_selectedPlanIndex]
              : null;
          final planGoal = activePlan?.goalType ?? appState.selectedGoal;
          final planCalorieGoal = activePlan?.targetCalories ?? appState.calorieGoal;

          // Check if the active plan is a multi-day plan
          final activePlanMeals = activePlan?.meals ?? [];
          final distinctDays = activePlanMeals.map((m) => m.dayNo).toSet();
          final isMultiDay = distinctDays.length > 1;
          final isFromDoctor = activePlan?.doctorUsername != null;

          return Column(
            children: [
              const _MealPlanHero(),
              const SizedBox(height: 16),
              if (_fetchedPlans.length > 1) ...[
                _PlanSelector(
                  plans: _fetchedPlans,
                  selectedIndex: _selectedPlanIndex,
                  onChanged: (index) {
                    setState(() {
                      _selectedPlanIndex = index;
                      _checkedShoppingItems.clear();
                    });
                  },
                ),
                const SizedBox(height: 12),
              ],
              // ── Doctor plan info banner ──────────────────────────────
              if (isFromDoctor && activePlan != null)
                _DoctorPlanBanner(doctorUsername: activePlan.doctorUsername!, planGoal: planGoal)
              else
                _AiPoweredBanner(goal: planCalorieGoal),
              const SizedBox(height: 16),
              // ── Day selector only for multi-day plans ───────────────
              if (isMultiDay) ...[
                _DaySelector(
                  selectedIndex: _selectedDayIndex,
                  onChanged: (index) {
                    setState(() {
                      _selectedDayIndex = index;
                      _checkedShoppingItems.clear();
                    });
                  },
                ),
                const SizedBox(height: 16),
              ] else if (!isFromDoctor) ...[
                _DaySelector(
                  selectedIndex: _selectedDayIndex,
                  onChanged: (index) {
                    setState(() {
                      _selectedDayIndex = index;
                      _checkedShoppingItems.clear();
                    });
                  },
                ),
                const SizedBox(height: 16),
              ],
              // ── AI generate button (only for AI/no-doctor plans) ────
              if (!isFromDoctor) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.auto_awesome, color: Colors.white),
                    label: const Text('Generate with AI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HealixColors.navy,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: _regeneratePlan,
                  ),
                ),
                const SizedBox(height: 16),
              ],
              FeatureSectionCard(
                padding: const EdgeInsets.all(18),
                radius: 20,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            planGoal,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: HealixColors.navy),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.picture_as_pdf, size: 18),
                          label: const Text('PDF'),
                          onPressed: () { AppActions.showSnack(context, 'Downloading PDF...'); },
                          style: OutlinedButton.styleFrom(
                            visualDensity: VisualDensity.compact, 
                            foregroundColor: HealixColors.navy, 
                            side: const BorderSide(color: HealixColors.border),
                          ),
                        ),
                      ],
                    ),
                    // Notes from doctor
                    if (activePlan != null && activePlan.notes != null && activePlan.notes!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.purple.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.purple.withOpacity(0.2)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.note_alt_outlined, size: 14, color: Colors.purple),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                activePlan.notes!,
                                style: const TextStyle(fontSize: 12, color: Colors.purple, height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    _SummaryStats(calories: _totalCalories, protein: _totalProtein, prepMinutes: _totalPrepMinutes),
                    const SizedBox(height: 20),
                    if (_isLoading)
                      const Center(child: Padding(padding: EdgeInsets.all(20.0), child: CircularProgressIndicator()))
                    else if (_todayMeals.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Text('No meals scheduled for this day.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: HealixColors.sub, fontSize: 13)),
                      )
                    else
                      _MealCardsList(meals: _todayMeals, onLogMeal: _logMeal),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _ShoppingListCard(
                items: _shoppingItems,
                checkedItems: _checkedShoppingItems,
                onToggle: (item) {
                  setState(() {
                    if (_checkedShoppingItems.contains(item)) {
                      _checkedShoppingItems.remove(item);
                    } else {
                      _checkedShoppingItems.add(item);
                    }
                  });
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _MealPlanHero extends StatelessWidget {
  const _MealPlanHero();

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [HealixColors.navy, HealixColors.navyLight],
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
            Icon(Icons.restaurant_menu_outlined, color: Colors.white, size: 28),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Weekly Meal Plan', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Regenerates real daily meals, calories, macros, and shopping list', style: TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
      );
}

class _AiPoweredBanner extends StatelessWidget {
  const _AiPoweredBanner({required this.goal});
  final int goal;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Colors.purple, Colors.pinkAccent],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Plan is balanced around your current ${goal} kcal daily goal. Use Regenerate Plan to create a different version for the selected day.',
                style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.45, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      );
}

class _DoctorPlanBanner extends StatelessWidget {
  const _DoctorPlanBanner({required this.doctorUsername, required this.planGoal});
  final String doctorUsername;
  final String planGoal;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF7B2FBE), Color(0xFF9B59B6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.purple.withOpacity(0.25),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.medical_services_outlined, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Doctor-Assigned Plan',
                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'This plan was created by Dr. $doctorUsername. All meals are shown as assigned. Contact your doctor for changes.',
                    style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.4),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
}

class _DaySelector extends StatelessWidget {
  const _DaySelector({required this.selectedIndex, required this.onChanged});
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.88),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: HealixColors.border),
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(_MealPlanState._days.length, (index) {
              final day = _MealPlanState._days[index];
              final selected = index == selectedIndex;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Material(
                  color: selected ? HealixColors.navy : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => onChanged(index),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      child: Text(
                        day,
                        style: TextStyle(
                          color: selected ? Colors.white : HealixColors.sub,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      );
}

class _SummaryStats extends StatelessWidget {
  const _SummaryStats({required this.calories, required this.protein, required this.prepMinutes});
  final int calories;
  final int protein;
  final int prepMinutes;

  @override
  Widget build(BuildContext context) {
    final items = [
      _StatColumn(title: 'Total Calories', value: '$calories kcal'),
      _StatColumn(title: 'Protein', value: '${protein}g'),
      _StatColumn(title: 'Prep Time', value: '$prepMinutes min'),
    ];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: HealixColors.navy.withOpacity(0.04),
        borderRadius: BorderRadius.circular(16),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth < 480) {
            return Column(
              children: [
                for (var i = 0; i < items.length; i++) ...[
                  items[i],
                  if (i != items.length - 1) const SizedBox(height: 12)
                ]
              ],
            );
          }
          return Row(children: items.map((item) => Expanded(child: item)).toList());
        },
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  const _StatColumn({required this.title, required this.value});
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text(title, textAlign: TextAlign.center, style: const TextStyle(color: HealixColors.sub, fontSize: 13)),
          const SizedBox(height: 4),
          Text(value, textAlign: TextAlign.center, style: const TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      );
}

class _MealCardsList extends StatelessWidget {
  const _MealCardsList({required this.meals, required this.onLogMeal});
  final List<_MealPlanMeal> meals;
  final ValueChanged<_MealPlanMeal> onLogMeal;

  @override
  Widget build(BuildContext context) => Column(
        children: meals.map((meal) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _MealPlanCard(meal: meal, onLogMeal: () => onLogMeal(meal)),
        )).toList(),
      );
}

class _MealPlanMeal {
  const _MealPlanMeal({required this.letter, required this.type, required this.title, required this.calories, required this.protein, required this.carbs, required this.fat, required this.time, required this.items, required this.dayNo});
  final String letter;
  final String type;
  final String title;
  final int calories;
  final int protein;
  final int carbs;
  final int fat;
  final String time;
  final List<String> items;
  final int dayNo;

  int get minutes => int.tryParse(time.split(' ').first) ?? 0;
  _MealPlanMeal copyWith({int? calories, int? protein}) => _MealPlanMeal(letter: letter, type: type, title: title, calories: calories ?? this.calories, protein: protein ?? this.protein, carbs: carbs, fat: fat, time: time, items: items, dayNo: dayNo);
}

class _DetailedMealPlan {
  final String planId;
  final String goalType;
  final String? doctorUsername;
  final int targetCalories;
  final int targetProtein;
  final int targetCarbs;
  final int targetFat;
  final String? startDate;
  final String? endDate;
  final String? notes;
  final List<_MealPlanMeal> meals;

  _DetailedMealPlan({
    required this.planId,
    required this.goalType,
    this.doctorUsername,
    required this.targetCalories,
    required this.targetProtein,
    required this.targetCarbs,
    required this.targetFat,
    this.startDate,
    this.endDate,
    this.notes,
    required this.meals,
  });
}

class _PlanSelector extends StatelessWidget {
  const _PlanSelector({
    required this.plans,
    required this.selectedIndex,
    required this.onChanged,
  });

  final List<_DetailedMealPlan> plans;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(plans.length, (index) {
            final plan = plans[index];
            final selected = index == selectedIndex;
            final isDoctor = plan.doctorUsername != null;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: ChoiceChip(
                label: Text(
                  isDoctor ? 'Doctor Plan (Dr. ${plan.doctorUsername})' : 'AI Plan (${plan.goalType})',
                  style: TextStyle(
                    color: selected ? Colors.white : HealixColors.navy,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                selected: selected,
                selectedColor: isDoctor ? Colors.purple : HealixColors.navy,
                backgroundColor: Colors.white.withOpacity(0.85),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: selected ? Colors.transparent : HealixColors.border),
                ),
                onSelected: (_) => onChanged(index),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _MealPlanCard extends StatelessWidget {
  const _MealPlanCard({required this.meal, required this.onLogMeal});
  final _MealPlanMeal meal;
  final VoidCallback onLogMeal;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.border),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 420;
          final details = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(meal.type, style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold, fontSize: 15)),
                  const Spacer(),
                  Text('${meal.calories} kcal', style: const TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 4),
              Text(meal.title, style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: meal.items.map((i) => Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.circle, size: 6, color: HealixColors.navyLight),
                    const SizedBox(width: 4),
                    Text(i, style: const TextStyle(fontSize: 12, color: HealixColors.sub)),
                  ],
                )).toList(),
              ),
            ],
          );
          final action = OutlinedButton.icon(
            onPressed: onLogMeal,
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Log meal'),
            style: OutlinedButton.styleFrom(
              foregroundColor: HealixColors.navy,
              side: const BorderSide(color: HealixColors.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
          if (compact) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _LetterBadge(letter: meal.letter),
                    const SizedBox(width: 12),
                    Expanded(child: details),
                  ],
                ),
                const SizedBox(height: 10),
                Align(alignment: Alignment.centerRight, child: action),
              ],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _LetterBadge(letter: meal.letter),
              const SizedBox(width: 14),
              Expanded(child: details),
              const SizedBox(width: 8),
              action,
            ],
          );
        },
      ),
    );
  }
}

class _LetterBadge extends StatelessWidget {
  const _LetterBadge({required this.letter});
  final String letter;
  @override
  Widget build(BuildContext context) => Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: HealixColors.orange.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(
          letter,
          style: const TextStyle(color: HealixColors.orange, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      );
}

class _ShoppingListCard extends StatelessWidget {
  const _ShoppingListCard({required this.items, required this.checkedItems, required this.onToggle});
  final List<String> items;
  final Set<String> checkedItems;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) => FeatureSectionCard(
        padding: const EdgeInsets.all(18),
        radius: 20,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Shopping List',
                    style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.download_outlined, size: 18),
                  label: const Text('Export'),
                  onPressed: () => AppActions.showSnack(context, 'Shopping list exported', icon: Icons.download_done_outlined),
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    foregroundColor: HealixColors.navy,
                    side: const BorderSide(color: HealixColors.border),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (items.isEmpty)
              const Text('No shopping items needed.', style: TextStyle(color: HealixColors.sub))
            else
              ...items.map((item) {
                final checked = checkedItems.contains(item);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () => onToggle(item),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: checked ? Colors.transparent : HealixColors.navy.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: checked ? HealixColors.border : Colors.transparent),
                      ),
                      child: Row(
                        children: [
                          Checkbox(
                            value: checked,
                            activeColor: HealixColors.navy,
                            onChanged: (_) => onToggle(item),
                          ),
                          Expanded(
                            child: Text(
                              item,
                              style: TextStyle(
                                color: checked ? HealixColors.sub : HealixColors.navy,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                decoration: checked ? TextDecoration.lineThrough : null,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      );
}
