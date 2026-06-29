import 'package:flutter/material.dart';
import 'package:healix_app/core/services/plans_service.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';

/// Safely converts any numeric value (int, double, String) to int.
int _toInt(dynamic v, [int fallback = 0]) {
  if (v == null) return fallback;
  if (v is int) return v;
  if (v is double) return v.round();
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? fallback;
}

class ExercisePlan extends StatefulWidget {
  const ExercisePlan({super.key});

  @override
  State<ExercisePlan> createState() => _ExercisePlanState();
}

class _ExercisePlanState extends State<ExercisePlan> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _plans = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchPlans();
  }

  Future<void> _fetchPlans() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final plans = await PlansService.getMyExercisePlans();
      final List<Map<String, dynamic>> detailedPlans = [];
      for (var plan in plans) {
        final planId = plan['plan_id'].toString();
        final detailed = await PlansService.getExercisePlanById(planId);
        final planMap = Map<String, dynamic>.from(plan);
        if (detailed != null) {
          planMap['exercises'] = detailed['exercises'] ?? [];
        } else {
          planMap['exercises'] = [];
        }
        detailedPlans.add(planMap);
      }
      if (mounted) {
        setState(() {
          _plans = detailedPlans;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to load exercise plans.';
        });
      }
    }
  }

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Exercise Plan',
      selectedItem: 'Exercise Plan',
      searchController: _searchController,
      openScreen: _openScreen,
      onRefresh: _fetchPlans,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: _isLoading
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(40.0),
                  child: CircularProgressIndicator(color: HealixColors.navy),
                ),
              )
            : _error != null
                ? _buildErrorState()
                : _plans.isEmpty
                    ? _buildEmptyState()
                    : _buildPlansList(),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: HealixColors.border),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center,
                style: const TextStyle(color: HealixColors.sub, fontSize: 14)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _fetchPlans,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(backgroundColor: HealixColors.navy),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.fitness_center_outlined, size: 80, color: HealixColors.border),
            const SizedBox(height: 24),
            const Text(
              'No Exercise Plan Found',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HealixColors.navy),
            ),
            const SizedBox(height: 12),
            const Text(
              'You don\'t have an active exercise plan yet. You can request one from your doctor or have the AI generate a personalized routine based on your goals.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: HealixColors.sub, height: 1.5),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildPlansList() {
    return Column(
      children: _plans.map<Widget>((plan) => _buildPlanCard(plan)).toList(),
    );
  }

  Widget _buildPlanCard(Map<String, dynamic> plan) {
    final exercises = plan['exercises'] as List? ?? [];
    final doctorUsername = plan['doctor_username']?.toString();
    final isFromDoctor = doctorUsername != null && doctorUsername.isNotEmpty;
    final goalType = plan['goal_type']?.toString() ?? 'General Fitness';

    // Group exercises by day
    final Map<int, List<dynamic>> byDay = {};
    for (var ex in exercises) {
      final day = _toInt(ex['day_number'], 1);
      byDay.putIfAbsent(day, () => []).add(ex);
    }
    final sortedDays = byDay.keys.toList()..sort();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: FeatureSectionCard(
        padding: const EdgeInsets.all(20),
        radius: 22,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (isFromDoctor ? Colors.purple : HealixColors.navy).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    isFromDoctor ? Icons.medical_services_outlined : Icons.sports_gymnastics,
                    color: isFromDoctor ? Colors.purple : HealixColors.navy,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Goal: $goalType',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HealixColors.navy),
                      ),
                      const SizedBox(height: 4),
                      if (isFromDoctor)
                        Container(
                          margin: const EdgeInsets.only(top: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.purple.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.purple.withOpacity(0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_user_outlined, size: 11, color: Colors.purple),
                              const SizedBox(width: 4),
                              Text(
                                'Assigned by Dr. $doctorUsername',
                                style: const TextStyle(fontSize: 11, color: Colors.purple, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        )
                      else
                        const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome, size: 11, color: HealixColors.navyLight),
                            SizedBox(width: 4),
                            Text('AI Generated Plan',
                                style: TextStyle(fontSize: 11, color: HealixColors.navyLight, fontWeight: FontWeight.w600)),
                          ],
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(color: HealixColors.border),
            const SizedBox(height: 12),

            // ── Exercises or empty state ──
            if (exercises.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 20),
                alignment: Alignment.center,
                child: Column(
                  children: [
                    Icon(Icons.hourglass_empty_rounded, size: 40,
                        color: HealixColors.border),
                    const SizedBox(height: 8),
                    const Text('No exercises have been added to this plan yet.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: HealixColors.sub, fontSize: 13)),
                  ],
                ),
              )
            else
              // Group by day
              ...sortedDays.map((day) {
                final dayExercises = byDay[day]!;
                const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                final dayLabel = weekdays[(day - 1).clamp(0, 6)];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: HealixColors.navy.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 13, color: HealixColors.navy),
                            const SizedBox(width: 6),
                            Text(
                              'Day $day — $dayLabel',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, color: HealixColors.navy, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...dayExercises.map((ex) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: HealixColors.card2,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: HealixColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: HealixColors.navy.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.fitness_center_rounded, size: 18, color: HealixColors.navy),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      ex['name']?.toString() ?? 'Exercise',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold, color: HealixColors.navy, fontSize: 14),
                                    ),
                                    if (ex['category'] != null)
                                      Text(ex['category'].toString(),
                                          style: const TextStyle(color: HealixColors.sub, fontSize: 11)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${ex['sets'] ?? 3} sets',
                                    style: const TextStyle(
                                        color: HealixColors.navy, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Text(
                                    '× ${ex['reps'] ?? '10-12'} reps',
                                    style: const TextStyle(color: HealixColors.sub, fontSize: 12),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      )),
                    ],
                  ),
                );
              }),

            // ── Plan info footer ──
            if (plan['created_at'] != null) ...[
              const Divider(color: HealixColors.border),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.info_outline, size: 13, color: HealixColors.sub),
                  const SizedBox(width: 6),
                  Text(
                    '${exercises.length} exercise${exercises.length != 1 ? 's' : ''} · ${sortedDays.length} day${sortedDays.length != 1 ? 's' : ''}',
                    style: const TextStyle(color: HealixColors.sub, fontSize: 12),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
