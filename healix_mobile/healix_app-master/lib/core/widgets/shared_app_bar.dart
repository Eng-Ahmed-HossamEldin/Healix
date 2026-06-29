import 'package:flutter/material.dart';
import 'package:healix_app/core/session/user_session.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/features/ai_and_coaching/screens/ai_chatbot.dart';
import 'package:healix_app/features/ai_and_coaching/screens/human_coach.dart';
import 'package:healix_app/features/analytics/screens/progress_comparison.dart';
import 'package:healix_app/features/dashboard/presentation/screens/daily_summary.dart';
import 'package:healix_app/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:healix_app/features/dashboard/presentation/screens/notifications_screen.dart';
import 'package:healix_app/features/health_tracking/screens/bmi_tracking.dart';
import 'package:healix_app/features/health_tracking/screens/exercise_logging.dart';
import 'package:healix_app/features/health_tracking/screens/food_logging.dart';
import 'package:healix_app/features/health_tracking/screens/meal_plan.dart';
import 'package:healix_app/features/health_tracking/screens/recipe_builder.dart';
import 'package:healix_app/features/health_tracking/screens/sleep_tracking.dart';
import 'package:healix_app/features/health_tracking/screens/step_counter.dart';

import 'package:healix_app/features/health_tracking/screens/water_intake.dart';
import 'package:healix_app/features/health_tracking/screens/weight_tracking.dart';
import 'package:healix_app/features/health_tracking/screens/workout_library.dart';
import 'package:healix_app/features/settings/screens/edit_info.dart';
import 'package:healix_app/features/settings/screens/goal_setup.dart';
import 'package:healix_app/features/settings/screens/preferences.dart';
import 'package:healix_app/features/settings/screens/report_issue.dart';
import 'package:healix_app/features/settings/screens/subscription_screen.dart';
import 'package:healix_app/features/settings/screens/support_center.dart';
import 'package:healix_app/features/settings/screens/user_profile.dart';
import 'package:healix_app/features/system/screens/medical_records.dart';

import 'package:healix_app/core/theme_manage/app_theme.dart';

const Color _primary = HealixColors.navy;
const Color _secondaryText = HealixColors.sub;
const Color _background = HealixColors.bg;
const Color _green = HealixColors.green;

class SharedAppBar extends StatelessWidget implements PreferredSizeWidget {
  final TextEditingController searchController;
  final void Function(Widget screen) openScreen;
  final VoidCallback? onMenuPressed;

  @override
  Size get preferredSize => const Size.fromHeight(68 + 56);

  const SharedAppBar({
    super.key,
    required this.searchController,
    required this.openScreen,
    this.onMenuPressed,
  });

  Widget? _screenForQuery(String query) {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) return null;
    bool has(List<String> words) => words.any(q.contains);
    if (has(['dashboard', 'home'])) return const DashboardScreen();
    if (has(['summary', 'today'])) return const DailySummary();
    if (has(['food', 'meal log', 'calorie', 'calories', 'nutrition'])) return const FoodLogging();
    if (has(['meal plan', 'diet'])) return const MealPlan();
    if (has(['recipe'])) return const RecipeBuilderPage();
    if (has(['weight'])) return const WeightTracking();
    if (has(['bmi', 'body mass'])) return const BmiTracking();
    if (has(['step', 'walk'])) return const StepCounter();
    if (has(['exercise', 'workout log'])) return const ExerciseLogging();
    if (has(['workout library', 'library', 'hiit', 'yoga'])) return const WorkoutLibrary();
    if (has(['water', 'hydration'])) return const WaterIntake();
    if (has(['sleep'])) return const SleepTracking();
    if (has(['ai', 'chatbot', 'chat'])) return const AiChatbot();
    if (has(['human', 'coach', 'sarah'])) return const HumanCoach();
    if (has(['progress', 'comparison'])) return const ProgressComparison();
    if (has(['medical', 'record', 'scan'])) return const MedicalRecords();
    if (has(['profile', 'account'])) return const UserProfile();
    if (has(['subscription', 'billing', 'upgrade', 'ai pro', 'doctor plan', 'plans'])) return const SubscriptionScreen();
    if (has(['edit info', 'personal info'])) return const EditInfo();
    if (has(['goal'])) return const GoalSetup();
    if (has(['preference', 'restriction', 'allergy'])) return const Preferences();
    if (has(['support', 'help'])) return const SupportCenter();
    if (has(['issue', 'bug', 'report'])) return const ReportIssue();
    return null;
  }

  void _submitSearch(BuildContext context, String value) {
    final query = value.trim();
    if (query.isEmpty) {
      AppActions.showSnack(context, 'Type something to search for.', icon: Icons.search, color: Colors.orange.shade700);
      return;
    }
    final screen = _screenForQuery(query);
    if (screen != null) {
      AppActions.showSnack(context, 'Opening result for "$query"', icon: Icons.search);
      openScreen(screen);
      searchController.clear();
      return;
    }
    AppActions.showInfo(
      context,
      title: 'No exact match',
      message: 'I could not find a screen for "$query". Try searching for food, BMI, water, sleep, analytics, medical records, goals, or support.',
      icon: Icons.search_off_outlined,
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppBar(
      automaticallyImplyLeading: false,
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      toolbarHeight: 68,
      titleSpacing: 0,
      shape: const Border(
        bottom: BorderSide(color: HealixColors.border, width: 1),
      ),
      title: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Row(
          children: [
            IconButton(
              visualDensity: VisualDensity.compact,
              onPressed: onMenuPressed ??
                  () {
                    final scaffold = Scaffold.maybeOf(context);
                    if (scaffold != null && scaffold.hasDrawer) {
                      scaffold.openDrawer();
                    }
                  },
              icon: const Icon(Icons.menu, color: _primary, size: 22),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: SizedBox(
                height: 42,
                child: TextField(
                  controller: searchController,
                  textAlignVertical: TextAlignVertical.center,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (value) => _submitSearch(context, value),
                  decoration: InputDecoration(
                    hintText: 'Search health data, workouts, meals...',
                    hintStyle: const TextStyle(color: _secondaryText, fontSize: 12.5),
                    prefixIcon: const Icon(Icons.search, color: _secondaryText, size: 20),
                    suffixIcon: IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: () => _submitSearch(context, searchController.text),
                      icon: const Icon(Icons.arrow_forward_rounded, color: _primary, size: 18),
                    ),
                    filled: true,
                    fillColor: _background,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 4),
            IconButton(
              visualDensity: VisualDensity.compact,
              onPressed: () => openScreen(const NotificationsScreen()),
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.notifications_outlined, color: _primary, size: 22),
                  Positioned(
                    top: -1,
                    right: -1,
                    child: AnimatedBuilder(
                      animation: appState,
                      builder: (_, __) => appState.unreadNotificationCount == 0
                          ? const SizedBox.shrink()
                          : Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(color: _green, shape: BoxShape.circle),
                            ),
                    ),
                  ),
                ],
              ),
            ),
            ValueListenableBuilder<String>(
              valueListenable: UserSession.displayName,
              builder: (context, displayName, _) => GestureDetector(
                onTap: () => openScreen(const UserProfile()),
                child: CircleAvatar(
                  backgroundColor: _primary,
                  radius: 17,
                  child: Text(UserSession.initialsOf(displayName), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: SizedBox(
          height: 56,
          child: AnimatedBuilder(
            animation: appState,
            builder: (context, _) => ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              children: [
                _SummaryChip(
                  title: 'Today',
                  value: '${appState.steps.toString().replaceAllMapped(RegExp(r"(\d)(?=(\d{3})+(?!\d))"), (m) => "${m[1]},")} steps',
                  icon: Icons.directions_walk_rounded,
                  iconColor: HealixColors.green,
                  valueColor: HealixColors.green,
                  onTap: () => openScreen(const DailySummary()),
                ),
                const SizedBox(width: 8),
                _SummaryChip(
                  title: 'Calories',
                  value: '${appState.caloriesConsumed} / ${appState.calorieGoal}',
                  icon: Icons.local_fire_department_rounded,
                  iconColor: HealixColors.orange,
                  valueColor: const Color(0xFFC08F00),
                  onTap: () => openScreen(const FoodLogging()),
                ),
                const SizedBox(width: 8),
                _SummaryChip(
                  title: 'Water',
                  value: '${appState.waterCups} / ${appState.waterGoalCups} gl.',
                  icon: Icons.water_drop_rounded,
                  iconColor: HealixColors.navyLight,
                  valueColor: HealixColors.navyLight,
                  onTap: () => openScreen(const WaterIntake()),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color iconColor;
  final Color valueColor;
  final VoidCallback? onTap;

  const _SummaryChip({
    required this.title,
    required this.value,
    required this.icon,
    required this.iconColor,
    required this.valueColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        constraints: const BoxConstraints(minWidth: 100, maxWidth: 140),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: HealixColors.border, width: 1),
          boxShadow: [
            BoxShadow(
              color: HealixColors.navy.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 14),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: HealixColors.sub, fontSize: 9, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: valueColor, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
