import 'dart:math' as math;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/features/ai_and_coaching/screens/ai_chatbot.dart';
import 'package:healix_app/features/ai_and_coaching/screens/human_coach.dart';
import 'package:healix_app/features/dashboard/presentation/screens/daily_summary.dart';
import 'package:healix_app/features/dashboard/presentation/screens/notifications_screen.dart';
import 'package:healix_app/features/health_tracking/screens/exercise_logging.dart';
import 'package:healix_app/features/health_tracking/screens/food_logging.dart';
import 'package:healix_app/features/health_tracking/screens/meal_plan.dart';
import 'package:healix_app/features/health_tracking/screens/sleep_tracking.dart';
import 'package:healix_app/features/health_tracking/screens/step_counter.dart';
import 'package:healix_app/features/health_tracking/screens/water_intake.dart';
import 'package:healix_app/features/health_tracking/screens/weight_tracking.dart';
import 'package:healix_app/features/settings/screens/user_profile.dart';
import 'package:healix_app/core/session/user_session.dart';
import 'package:healix_app/core/state/app_state.dart';
import '../../../../core/widgets/shared_app_bar.dart';
import '../../../health_tracking/screens/recipe_builder.dart';
import '../widgets/_macrolegend.dart';
import '../widgets/quick_action_button.dart';
import '../widgets/scheduleitem.dart';
import '../widgets/stat_card.dart';
import 'custom_drawer_view.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final TextEditingController _searchController = TextEditingController();

  String get _todayText {
    final now = DateTime.now();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${weekdays[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}, ${now.year}';
  }

  static const Color _primary = HealixColors.navy;
  static const Color _secondaryText = HealixColors.sub;
  static const Color _background = HealixColors.bg;
  static const Color _green = HealixColors.green;
  static const Color _teal = HealixColors.teal;
  static const Color _yellow = HealixColors.orange;

  String _selectedItem = 'Dashboard';

  void _openScreen(Widget screen) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  void _openNavigationMenu() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        final width = MediaQuery.of(sheetContext).size.width;
        final drawerWidth = width < 420 ? width * 0.90 : 380.0;
        return Align(
          alignment: AlignmentDirectional.centerStart,
          child: Material(
            color: Colors.white,
            borderRadius: const BorderRadiusDirectional.only(
              topEnd: Radius.circular(24),
              bottomEnd: Radius.circular(24),
            ),
            clipBehavior: Clip.antiAlias,
            child: SizedBox(
              width: drawerWidth,
              height: MediaQuery.of(sheetContext).size.height,
              child: CustomDrawerView(
                selectedItem: _selectedItem,
                onMenuItemClicked: (label) {
                  if (mounted) {
                    setState(() => _selectedItem = label);
                  }
                },
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: SharedAppBar(
        searchController: _searchController,
        openScreen: _openScreen,
        onMenuPressed: _openNavigationMenu,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF8FBEF),
              Color(0xFFEEF5DC),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildWelcomeSection(),
                const SizedBox(height: 16),
                _buildStatsSection(),
                const SizedBox(height: 16),
                _buildMacrosCard(),
                const SizedBox(height: 16),
                _buildQuickActionsCard(),
                const SizedBox(height: 16),
                _buildWeeklyStepsCard(),
                const SizedBox(height: 16),
                _buildCaloriesChartCard(),
                const SizedBox(height: 16),
                _buildSleepChartCard(),
                const SizedBox(height: 16),
                _buildScheduleCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ValueListenableBuilder<String>(
          valueListenable: UserSession.displayName,
          builder: (context, displayName, _) {
            return Text(
              'Good Morning, $displayName! 👋',
              style: const TextStyle(
                color: HealixColors.navy,
                fontSize: 24,
                fontWeight: FontWeight.w900,
              ),
            );
          },
        ),
        const SizedBox(height: 4),
        Text(
          "Here's a summary of your health today • $_todayText",
          style: const TextStyle(
            color: HealixColors.sub,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsSection() {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) => SizedBox(
        height: 146,
        child: Row(
          children: [
            Expanded(
              child: StatCard(
                title: 'Calories Eaten',
                value: '${appState.caloriesConsumed}',
                icon: Icons.local_fire_department_rounded,
                color: HealixColors.orange,
                progress: appState.calorieGoal > 0
                    ? (appState.caloriesConsumed / appState.calorieGoal)
                    : 0.0,
                onTap: () => _openScreen(const FoodLogging()),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatCard(
                title: 'Water Intake',
                value: '${appState.waterCups} / 8 c.',
                icon: Icons.water_drop_rounded,
                color: HealixColors.teal,
                progress: appState.waterCups / 8.0,
                onTap: () => _openScreen(const WaterIntake()),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatCard(
                title: 'Sleep Last Night',
                value: '${appState.sleepHours.toStringAsFixed(1)}h',
                icon: Icons.nightlight_round,
                color: Colors.purple,
                progress: appState.sleepGoalHours > 0
                    ? (appState.sleepHours / appState.sleepGoalHours)
                    : 0.0,
                onTap: () => _openScreen(const SleepTracking()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMacrosCard() {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        final protein = appState.protein.toDouble();
        final carbs = appState.carbs.toDouble();
        final fat = appState.fat.toDouble();
        final total = protein + carbs + fat;
        final pVal = total > 0 ? protein : 1.0;
        final cVal = total > 0 ? carbs : 1.0;
        final fVal = total > 0 ? fat : 1.0;

        final tPro = appState.calorieGoal > 0 ? (appState.calorieGoal * 0.3 / 4).round() : 150;
        final tCar = appState.calorieGoal > 0 ? (appState.calorieGoal * 0.4 / 4).round() : 200;
        final tFat = appState.calorieGoal > 0 ? (appState.calorieGoal * 0.3 / 9).round() : 65;

        return Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.92),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: HealixColors.border, width: 1),
            boxShadow: [
              BoxShadow(
                color: HealixColors.navy.withOpacity(0.06),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Macronutrients',
                        style: TextStyle(
                          color: HealixColors.navy,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Nutrient breakdown',
                        style: TextStyle(color: HealixColors.sub, fontSize: 12),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => _openScreen(const MealPlan()),
                    child: const Text('Details', style: TextStyle(color: HealixColors.navyLight, fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: SizedBox(
                      height: 120,
                      child: PieChart(
                        PieChartData(
                          sectionsSpace: total > 0 ? 4 : 0,
                          centerSpaceRadius: 36,
                          sections: [
                            PieChartSectionData(
                              value: pVal * 4,
                              color: total > 0 ? const Color(0xFFEF4444) : const Color(0xFFE0EAEE),
                              radius: 14,
                              showTitle: false,
                            ),
                            PieChartSectionData(
                              value: cVal * 4,
                              color: total > 0 ? const Color(0xFF1A7AD4) : const Color(0xFFD6E8C8),
                              radius: 14,
                              showTitle: false,
                            ),
                            PieChartSectionData(
                              value: fVal * 9,
                              color: total > 0 ? const Color(0xFFF59E0B) : const Color(0xFFF5DFA0),
                              radius: 14,
                              showTitle: false,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    flex: 4,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildMacroRow('Protein', '${appState.protein}g', const Color(0xFFEF4444), total > 0 ? (protein / tPro) : 0.0),
                        const SizedBox(height: 12),
                        _buildMacroRow('Carbs', '${appState.carbs}g', const Color(0xFF1A7AD4), total > 0 ? (carbs / tCar) : 0.0),
                        const SizedBox(height: 12),
                        _buildMacroRow('Fat', '${appState.fat}g', const Color(0xFFF59E0B), total > 0 ? (fat / tFat) : 0.0),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMacroRow(String label, String value, Color color, double progress) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
            Text(value, style: const TextStyle(color: HealixColors.text, fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: progress.clamp(0.0, 1.0),
            backgroundColor: HealixColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionsCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick Actions',
            style: TextStyle(
              color: HealixColors.navy,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          QuickActionButton(
            icon: Icons.add_circle_outline_rounded,
            label: 'Log Food',
            onPressed: () => _openScreen(const FoodLogging()),
          ),
          const SizedBox(height: 8),
          QuickActionButton(
            icon: Icons.add_circle_outline_rounded,
            label: 'Log Water',
            onPressed: () => _openScreen(const WaterIntake()),
          ),
          const SizedBox(height: 8),
          QuickActionButton(
            icon: Icons.add_circle_outline_rounded,
            label: 'Log Weight',
            onPressed: () => _openScreen(const WeightTracking()),
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyStepsCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Weekly Steps',
                      style: TextStyle(
                        color: _primary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Average: 8,249 steps/day',
                      style: TextStyle(color: _secondaryText, fontSize: 12),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => _openScreen(const StepCounter()),
                child: const Text(
                  'View Details',
                  style: TextStyle(color: HealixColors.navyLight, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: 12000,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) =>
                      FlLine(color: const Color(0xFFEAF2F5), strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (value, meta) {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        if (value.toInt() >= 0 && value.toInt() < days.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(
                              days[value.toInt()],
                              style: const TextStyle(
                                color: _secondaryText,
                                fontSize: 11,
                              ),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 36,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: const TextStyle(
                            color: _secondaryText,
                            fontSize: 10,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 8800),
                      FlSpot(1, 9200),
                      FlSpot(2, 8000),
                      FlSpot(3, 11000),
                      FlSpot(4, 9000),
                      FlSpot(5, 6000),
                      FlSpot(6, 7000),
                    ],
                    isCurved: true,
                    barWidth: 3,
                    color: _primary,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          _primary.withOpacity(0.2),
                          _primary.withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCaloriesChartCard() {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        final consumed = appState.caloriesConsumed.toDouble();
        final burned = appState.caloriesBurned.toDouble();
        final maxVal = math.max(2000.0, math.max(consumed, burned) * 1.2);
        
        return GestureDetector(
          onTap: () => _openScreen(const FoodLogging()),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.92),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: HealixColors.border, width: 1),
              boxShadow: [
                BoxShadow(
                  color: HealixColors.navy.withOpacity(0.06),
                  blurRadius: 24,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Calories Today',
                  style: TextStyle(
                    color: _primary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Consumed vs Burned',
                  style: TextStyle(color: _secondaryText, fontSize: 12),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 220,
                  child: LineChart(
                    LineChartData(
                      minY: 0,
                      maxY: maxVal,
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        getDrawingHorizontalLine: (value) =>
                            FlLine(color: const Color(0xFFEAF2F5), strokeWidth: 1),
                      ),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 28,
                            getTitlesWidget: (value, meta) {
                              const times = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];
                              if (value.toInt() >= 0 && value.toInt() < times.length) {
                                return Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    times[value.toInt()],
                                    style: const TextStyle(
                                      color: _secondaryText,
                                      fontSize: 10,
                                    ),
                                  ),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 36,
                            getTitlesWidget: (value, meta) {
                              return Text(
                                value.toInt().toString(),
                                style: const TextStyle(
                                  color: _secondaryText,
                                  fontSize: 10,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      lineBarsData: [
                        LineChartBarData(
                          spots: [
                            const FlSpot(0, 0),
                            FlSpot(1, consumed * 0.3),
                            FlSpot(2, consumed * 0.55),
                            FlSpot(3, consumed * 0.7),
                            FlSpot(4, consumed * 0.95),
                            FlSpot(5, consumed),
                          ],
                          isCurved: false,
                          barWidth: 2,
                          color: _yellow,
                          dotData: FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, bar, index) {
                              return FlDotCirclePainter(
                                radius: 4,
                                color: _yellow,
                                strokeWidth: 0,
                              );
                            },
                          ),
                        ),
                        LineChartBarData(
                          spots: [
                            const FlSpot(0, 0),
                            FlSpot(1, burned * 0.15),
                            FlSpot(2, burned * 0.35),
                            FlSpot(3, burned * 0.6),
                            FlSpot(4, burned * 0.85),
                            FlSpot(5, burned),
                          ],
                          isCurved: false,
                          barWidth: 2,
                          color: _primary,
                          dotData: FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, bar, index) {
                              return FlDotCirclePainter(
                                radius: 4,
                                color: _primary,
                                strokeWidth: 0,
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSleepChartCard() {
    return GestureDetector(
      onTap: () => _openScreen(const SleepTracking()),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.92),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: HealixColors.border, width: 1),
          boxShadow: [
            BoxShadow(
              color: HealixColors.navy.withOpacity(0.06),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sleep This Week',
              style: TextStyle(
                color: _primary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Quality improving',
              style: TextStyle(color: _secondaryText, fontSize: 12),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 220,
              child: BarChart(
                BarChartData(
                  minY: 0,
                  maxY: 12,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (value) =>
                        FlLine(color: const Color(0xFFEAF2F5), strokeWidth: 1),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        getTitlesWidget: (value, meta) {
                          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          if (value.toInt() >= 0 && value.toInt() < days.length) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                days[value.toInt()],
                                style: const TextStyle(
                                  color: _secondaryText,
                                  fontSize: 10,
                                ),
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            value.toInt().toString(),
                            style: const TextStyle(
                              color: _secondaryText,
                              fontSize: 10,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  barGroups: [
                    _barGroup(0, 7),
                    _barGroup(1, 7),
                    _barGroup(2, 6.5),
                    _barGroup(3, 7),
                    _barGroup(4, 6.5),
                    _barGroup(5, 8.5),
                    _barGroup(6, 7),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  "Today's Schedule",
                  style: TextStyle(
                    color: _primary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => _openScreen(const DailySummary()),
                icon: const Icon(Icons.add, color: _primary),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ScheduleItem(
            icon: Icons.fitness_center,
            title: 'Morning Yoga',
            time: '10:00 AM',
            onTap: () => _openScreen(const ExerciseLogging()),
          ),
          const SizedBox(height: 8),
          ScheduleItem(
            icon: Icons.apple,
            title: 'Lunch - Chicken Salad',
            time: '12:30 PM',
            onTap: () => _openScreen(const FoodLogging()),
          ),
          const SizedBox(height: 8),
          ScheduleItem(
            icon: Icons.chat_bubble_outline,
            title: 'Coach Check-in',
            time: '3:00 PM',
            onTap: () => _openScreen(const HumanCoach()),
          ),
          const SizedBox(height: 8),
          ScheduleItem(
            icon: Icons.monitor_heart_outlined,
            title: 'Evening Run',
            time: '6:00 PM',
            onTap: () => _openScreen(const ExerciseLogging()),
          ),
        ],
      ),
    );
  }


  BarChartGroupData _barGroup(int x, double y) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: _green,
          width: 18,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String title;
  final String value;
  final VoidCallback? onTap;

  const _SummaryChip({
    required this.title,
    required this.value,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        constraints: const BoxConstraints(minWidth: 84, maxWidth: 108),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F8F6),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFF7B9BA4), fontSize: 9.5),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF0E5678),
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
