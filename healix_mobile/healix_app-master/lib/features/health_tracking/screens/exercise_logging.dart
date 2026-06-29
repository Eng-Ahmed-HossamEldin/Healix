import 'package:flutter/material.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/services/food_catalog_service.dart';

class ExerciseLogging extends StatefulWidget {
  const ExerciseLogging({super.key});

  @override
  State<ExerciseLogging> createState() => _ExerciseLoggingState();
}

class _ExerciseLoggingState extends State<ExerciseLogging> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _exerciseController = TextEditingController();
  final TextEditingController _durationController = TextEditingController();

  String _selectedIntensity = 'Low';
  String _selectedType = 'Cardio';

  int get _caloriesBurned => appState.caloriesBurned;

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  void dispose() {
    _searchController.dispose();
    _exerciseController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _searchExercise() async {
    final searchController = TextEditingController();
    List<Map<String, dynamic>> allExercises = [];
    List<Map<String, dynamic>> filteredExercises = [];
    bool isLoading = true;
    String? errorText;

    void loadExercises(void Function(void Function()) setSheetState) async {
      setSheetState(() {
        isLoading = true;
        errorText = null;
      });
      try {
        final data = await FoodCatalogService.searchExercises();
        setSheetState(() {
          allExercises = data;
          filteredExercises = data;
          isLoading = false;
        });
      } catch (e) {
        setSheetState(() {
          errorText = 'Could not load exercise catalog: $e';
          isLoading = false;
        });
      }
    }

    void filterExercises(String query, void Function(void Function()) setSheetState) {
      setSheetState(() {
        if (query.isEmpty) {
          filteredExercises = allExercises;
        } else {
          filteredExercises = allExercises.where((ex) {
            final name = (ex['name'] ?? ex['exercise_name'] ?? '').toString().toLowerCase();
            final cat = (ex['category'] ?? ex['type'] ?? '').toString().toLowerCase();
            final q = query.toLowerCase();
            return name.contains(q) || cat.contains(q);
          }).toList();
        }
      });
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (sheetContext) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          if (isLoading && errorText == null && allExercises.isEmpty) {
            loadExercises(setSheetState);
          }

          return SafeArea(
            child: Padding(
              padding: EdgeInsets.only(
                left: 18,
                right: 18,
                top: 18,
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 18,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Search Exercise Catalog',
                        style: TextStyle(
                          color: HealixColors.navy,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: HealixColors.sub),
                        onPressed: () => Navigator.pop(sheetContext),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: searchController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'e.g. Running, Push-ups, Squats...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                searchController.clear();
                                filterExercises('', setSheetState);
                              },
                            )
                          : null,
                    ),
                    onChanged: (val) => filterExercises(val.trim(), setSheetState),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 250,
                    child: Builder(
                      builder: (_) {
                        if (isLoading) {
                          return const Center(
                            child: CircularProgressIndicator(color: HealixColors.navy),
                          );
                        }
                        if (errorText != null) {
                          return Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  errorText!,
                                  style: TextStyle(color: Colors.red.shade700, fontSize: 13, fontWeight: FontWeight.bold),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 8),
                                ElevatedButton(
                                  onPressed: () => loadExercises(setSheetState),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: HealixColors.navy,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          );
                        }
                        if (filteredExercises.isEmpty) {
                          return const Center(
                            child: Text(
                              'No exercises found matching search.',
                              style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          );
                        }
                        return ListView.separated(
                          itemCount: filteredExercises.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final ex = filteredExercises[index];
                            final name = FoodCatalogService.nameOf(ex);
                            final cat = FoodCatalogService.categoryOf(ex);
                            final instructions = (ex['instructions'] ?? '').toString();
                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                              title: Text(
                                name,
                                style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              subtitle: Text(
                                '$cat${instructions.isNotEmpty ? " • $instructions" : ""}',
                                style: const TextStyle(color: HealixColors.sub, fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: const Icon(Icons.add_circle_outline, color: HealixColors.green, size: 22),
                              onTap: () {
                                _exerciseController.text = name;
                                final normalizedCat = cat.toLowerCase();
                                String targetType = 'Cardio';
                                if (normalizedCat.contains('strength')) {
                                  targetType = 'Strength';
                                } else if (normalizedCat.contains('flexibility') || normalizedCat.contains('stretch') || normalizedCat.contains('yoga')) {
                                  targetType = 'Flexibility';
                                } else if (normalizedCat.contains('hiit') || normalizedCat.contains('interval')) {
                                  targetType = 'HIIT';
                                } else if (normalizedCat.contains('cardio') || normalizedCat.contains('run') || normalizedCat.contains('cycling')) {
                                  targetType = 'Cardio';
                                }
                                setState(() {
                                  _selectedType = targetType;
                                });
                                Navigator.pop(sheetContext);
                              },
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _logWorkout() {
    final duration = int.tryParse(_durationController.text.trim()) ?? 0;
    if (duration <= 0 || duration > 600) {
      AppActions.showSnack(context, 'Enter a valid workout duration.', icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }

    final name = _exerciseController.text.trim().isEmpty
        ? _defaultExerciseName(_selectedType)
        : _exerciseController.text.trim();

    final calories = _estimateCalories(duration, _selectedIntensity);
    appState.addWorkout(name, _selectedType, duration, calories, intensity: _selectedIntensity);
    setState(() {
      _exerciseController.clear();
      _durationController.clear();
      _selectedIntensity = 'Low';
      _selectedType = 'Cardio';
    });
    AppActions.showSnack(context, 'Workout logged and dashboard updated.', icon: Icons.fitness_center_outlined, color: HealixColors.green);
  }

  Future<void> _editWorkout(int index) async {
    final workout = appState.workouts[index];
    final nameController = TextEditingController(text: workout.title);
    final durationController = TextEditingController(text: workout.minutes.toString());
    String intensity = workout.intensity;
    String type = workout.type;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text('Edit workout', style: TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController, 
                  decoration: const InputDecoration(labelText: 'Workout name'),
                  style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: durationController, 
                  keyboardType: TextInputType.number, 
                  decoration: const InputDecoration(labelText: 'Duration (minutes)'),
                  style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: intensity,
                  items: const ['Low', 'Moderate', 'High'].map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
                  onChanged: (value) => setDialogState(() => intensity = value ?? intensity),
                  decoration: const InputDecoration(labelText: 'Intensity'),
                  style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: type,
                  items: const ['Cardio', 'Strength', 'Flexibility', 'HIIT'].map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
                  onChanged: (value) => setDialogState(() => type = value ?? type),
                  decoration: const InputDecoration(labelText: 'Type'),
                  style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext), 
              child: const Text('Cancel', style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold)),
            ),
            TextButton(
              onPressed: () {
                appState.removeWorkout(index);
                Navigator.pop(dialogContext);
                AppActions.showSnack(context, 'Workout removed', icon: Icons.delete_outline);
              },
              child: const Text('Delete', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () {
                final duration = int.tryParse(durationController.text.trim()) ?? workout.minutes;
                final calories = _estimateCalories(duration, intensity);
                appState.updateWorkout(index, nameController.text.trim().isEmpty ? workout.title : nameController.text.trim(), type, duration, calories, intensity: intensity);
                Navigator.pop(dialogContext);
                AppActions.showSnack(context, 'Workout updated', icon: Icons.edit_outlined);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: HealixColors.navy, 
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
    nameController.dispose();
    durationController.dispose();
  }

  String _defaultExerciseName(String type) {
    switch (type) {
      case 'Strength':
        return 'Strength Session';
      case 'Flexibility':
        return 'Stretch Routine';
      case 'HIIT':
        return 'HIIT Workout';
      default:
        return 'Cardio Workout';
    }
  }

  int _estimateCalories(int duration, String intensity) {
    final multiplier = switch (intensity) {
      'High' => 10,
      'Moderate' => 8,
      _ => 6,
    };
    return duration * multiplier;
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Exercise Logging',
      selectedItem: 'Exercise Logging',
      searchController: _searchController,
      openScreen: _openScreen,
      child: AnimatedBuilder(
        animation: appState,
        builder: (context, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _ExerciseHero(),
            const SizedBox(height: 16),
            _CaloriesBurnedCard(calories: _caloriesBurned),
            const SizedBox(height: 18),
            _AddWorkoutCard(
              exerciseController: _exerciseController,
              durationController: _durationController,
              selectedIntensity: _selectedIntensity,
              selectedType: _selectedType,
              onIntensityChanged: (value) {
                if (value == null) return;
                setState(() => _selectedIntensity = value);
              },
              onTypeChanged: (value) {
                if (value == null) return;
                setState(() => _selectedType = value);
              },
              onLogWorkout: _logWorkout,
              onSearchTap: _searchExercise,
            ),
            const SizedBox(height: 24),
            const Text(
              "Today's Workouts",
              style: TextStyle(
                color: HealixColors.navy,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            if (appState.workouts.isEmpty)
              const FeatureSectionCard(
                padding: EdgeInsets.all(20),
                radius: 16,
                child: Center(
                  child: Text(
                    'No workouts logged yet. Add your first workout above.', 
                    style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              )
            else
              ...appState.workouts.asMap().entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _WorkoutTile(workout: entry.value, onEdit: () => _editWorkout(entry.key)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ExerciseHero extends StatelessWidget {
  const _ExerciseHero();

  @override
  Widget build(BuildContext context) {
    return Container(
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
          Icon(Icons.fitness_center_rounded, color: Colors.white, size: 28),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Exercise Logging',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 4),
                Text(
                  'Track your workouts and daily activity',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CaloriesBurnedCard extends StatelessWidget {
  const _CaloriesBurnedCard({required this.calories});

  final int calories;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      radius: 20,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Calories Burned Today',
                  style: TextStyle(
                    color: HealixColors.sub,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$calories kcal',
                  style: const TextStyle(
                    color: HealixColors.navy,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: HealixColors.orange.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.local_fire_department_rounded,
              color: HealixColors.orange,
              size: 26,
            ),
          ),
        ],
      ),
    );
  }
}

class _AddWorkoutCard extends StatelessWidget {
  const _AddWorkoutCard({
    required this.exerciseController,
    required this.durationController,
    required this.selectedIntensity,
    required this.selectedType,
    required this.onIntensityChanged,
    required this.onTypeChanged,
    required this.onLogWorkout,
    required this.onSearchTap,
  });

  final TextEditingController exerciseController;
  final TextEditingController durationController;
  final String selectedIntensity;
  final String selectedType;
  final ValueChanged<String?> onIntensityChanged;
  final ValueChanged<String?> onTypeChanged;
  final VoidCallback onLogWorkout;
  final VoidCallback onSearchTap;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(20),
      radius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Log Workout',
            style: TextStyle(
              color: HealixColors.navy,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _ExerciseTextField(
            controller: exerciseController,
            hintText: 'Exercise name (e.g., Running)',
            suffixIcon: IconButton(
              icon: const Icon(Icons.search, color: HealixColors.navy),
              onPressed: onSearchTap,
            ),
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final isNarrow = constraints.maxWidth < 560;
              final durationField = _ExerciseTextField(
                controller: durationController,
                hintText: 'Duration (min)',
                keyboardType: TextInputType.number,
              );
              final intensityField = _ExerciseDropdown(
                value: selectedIntensity,
                values: const ['Low', 'Moderate', 'High'],
                onChanged: onIntensityChanged,
              );

              if (isNarrow) {
                return Column(
                  children: [
                    durationField,
                    const SizedBox(height: 12),
                    intensityField,
                  ],
                );
              }

              return Row(
                children: [
                  Expanded(child: durationField),
                  const SizedBox(width: 12),
                  Expanded(child: intensityField),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          _ExerciseDropdown(
            value: selectedType,
            values: const ['Cardio', 'Strength', 'Flexibility', 'HIIT'],
            onChanged: onTypeChanged,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onLogWorkout,
              icon: const Icon(Icons.add, color: Colors.white, size: 20),
              label: const Text('Log Workout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: HealixColors.navy,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ExerciseTextField extends StatelessWidget {
  const _ExerciseTextField({
    required this.controller,
    required this.hintText,
    this.keyboardType,
    this.suffixIcon,
  });

  final TextEditingController controller;
  final String hintText;
  final TextInputType? keyboardType;
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(
          color: HealixColors.sub,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
        filled: true,
        fillColor: HealixColors.navy.withOpacity(0.04),
        border: OutlineInputBorder(
          borderSide: BorderSide.none,
          borderRadius: BorderRadius.circular(12),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 12,
        ),
        suffixIcon: suffixIcon,
      ),
      style: const TextStyle(
        color: HealixColors.navy,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _ExerciseDropdown extends StatelessWidget {
  const _ExerciseDropdown({
    required this.value,
    required this.values,
    required this.onChanged,
  });

  final String value;
  final List<String> values;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      items: values
          .map(
            (item) => DropdownMenuItem<String>(value: item, child: Text(item)),
          )
          .toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        filled: true,
        fillColor: HealixColors.navy.withOpacity(0.04),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      style: const TextStyle(
        color: HealixColors.navy,
        fontSize: 14,
        fontWeight: FontWeight.bold,
      ),
      icon: const Icon(
        Icons.keyboard_arrow_down,
        color: HealixColors.navy,
      ),
    );
  }
}

class _WorkoutTile extends StatelessWidget {
  const _WorkoutTile({required this.workout, required this.onEdit});

  final WorkoutLog workout;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      radius: 16,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: HealixColors.navy.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_typeIcon(workout.type), color: HealixColors.navy, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  workout.title,
                  style: const TextStyle(
                    color: HealixColors.navy,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  workout.date,
                  style: const TextStyle(
                    color: HealixColors.sub,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    _WorkoutMeta(
                      icon: Icons.schedule,
                      label: '${workout.minutes} min',
                    ),
                    _WorkoutMeta(
                      icon: Icons.local_fire_department_rounded,
                      iconColor: HealixColors.orange,
                      label: '${workout.calories} kcal',
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: HealixColors.navyLight.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        workout.intensity,
                        style: const TextStyle(
                          color: HealixColors.navyLight,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: onEdit,
            style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
            child: const Text(
              'Edit',
              style: TextStyle(
                color: HealixColors.navyLight,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'Strength':
        return Icons.fitness_center;
      case 'Flexibility':
        return Icons.self_improvement;
      case 'HIIT':
        return Icons.flash_on;
      default:
        return Icons.directions_run;
    }
  }
}

class _WorkoutMeta extends StatelessWidget {
  const _WorkoutMeta({
    required this.icon,
    required this.label,
    this.iconColor = HealixColors.sub,
  });

  final IconData icon;
  final String label;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: iconColor, size: 16),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            color: HealixColors.sub,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
