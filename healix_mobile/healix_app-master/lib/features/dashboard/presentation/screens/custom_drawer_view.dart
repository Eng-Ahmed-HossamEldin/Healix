import 'package:flutter/material.dart';
import 'package:healix_app/core/constants/app_assets.dart';
import 'package:healix_app/core/routes/page_routes_name.dart';
import 'package:healix_app/core/services/auth_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/features/settings/screens/subscription_screen.dart';
import 'package:healix_app/features/ai_and_coaching/screens/ai_chatbot.dart';
import 'package:healix_app/features/ai_and_coaching/screens/human_coach.dart';
import 'package:healix_app/features/analytics/screens/progress_comparison.dart';
import 'package:healix_app/features/health_tracking/screens/exercise_plan.dart';
import 'package:healix_app/features/health_tracking/screens/food_logging.dart';
import 'package:healix_app/features/health_tracking/screens/meal_plan.dart';
import 'package:healix_app/features/health_tracking/screens/recipe_builder.dart';
import 'package:healix_app/features/health_tracking/screens/sleep_tracking.dart';
import 'package:healix_app/features/health_tracking/screens/step_counter.dart';
import 'package:healix_app/features/health_tracking/screens/water_intake.dart';
import 'package:healix_app/features/health_tracking/screens/weight_tracking.dart';
import 'package:healix_app/features/health_tracking/screens/workout_library.dart';
import 'package:healix_app/features/settings/screens/goal_setup.dart';
import 'package:healix_app/features/system/screens/medical_records.dart';

import '../../../../model/drawer_item_model.dart';
import '../widgets/drawer_menu_item_widget.dart';
import 'dashboard_screen.dart';

class CustomDrawerView extends StatelessWidget {
  final Function(String) onMenuItemClicked;
  final String selectedItem;

  const CustomDrawerView({
    super.key,
    required this.onMenuItemClicked,
    this.selectedItem = 'Dashboard',
  });

  Future<void> _logout(BuildContext context) async {
    await AuthService.signOut();
    if (!context.mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil(PageRoutesName.login, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFE2BB6D),
              Color(0xFF8A4122),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const DrawerHeaderWidget(),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                children: [
                  DrawerSectionWidget(
                    title: 'Main',
                    selectedItem: selectedItem,
                    onItemTap: onMenuItemClicked,
                    items: [
                      DrawerItemModel(icon: Icons.home_outlined, label: 'Dashboard', screen: DashboardScreen()),
                      DrawerItemModel(icon: Icons.track_changes_outlined, label: 'Goal Setting', screen: GoalSetup()),
                      DrawerItemModel(icon: Icons.trending_up, label: 'Progress', screen: ProgressComparison()),
                    ],
                  ),
                  DrawerSectionWidget(
                    title: 'Nutrition',
                    selectedItem: selectedItem,
                    onItemTap: onMenuItemClicked,
                    items: [
                      DrawerItemModel(icon: Icons.apple_outlined, label: 'Food Logging', screen: FoodLogging()),
                      DrawerItemModel(icon: Icons.restaurant_menu_outlined, label: 'Meal Plans', screen: MealPlan()),
                      DrawerItemModel(icon: Icons.fitness_center_outlined, label: 'Exercise Plan', screen: ExercisePlan()),
                      DrawerItemModel(icon: Icons.menu_book_outlined, label: 'Recipes', screen: RecipeBuilderPage()),
                      DrawerItemModel(icon: Icons.water_drop_outlined, label: 'Water Intake', screen: WaterIntake()),
                    ],
                  ),
                  DrawerSectionWidget(
                    title: 'Body',
                    selectedItem: selectedItem,
                    onItemTap: onMenuItemClicked,
                    items: [
                      DrawerItemModel(icon: Icons.monitor_weight_outlined, label: 'Weight & BMI Tracking', screen: WeightTracking()),
                    ],
                  ),
                  DrawerSectionWidget(
                    title: 'Activity & Wellness',
                    selectedItem: selectedItem,
                    onItemTap: onMenuItemClicked,
                    items: [
                      DrawerItemModel(icon: Icons.list_alt_outlined, label: 'Exercise Library', screen: WorkoutLibrary()),
                      DrawerItemModel(icon: Icons.bedtime_outlined, label: 'Sleep Tracking', screen: SleepTracking()),
                      DrawerItemModel(icon: Icons.directions_walk_outlined, label: 'Step Counter', screen: StepCounter()),
                    ],
                  ),
                  DrawerSectionWidget(
                    title: 'Support & System',
                    selectedItem: selectedItem,
                    onItemTap: onMenuItemClicked,
                    items: [
                      DrawerItemModel(icon: Icons.workspace_premium_outlined, label: 'Subscriptions', screen: SubscriptionScreen()),
                      DrawerItemModel(icon: Icons.smart_toy_outlined, label: 'AI Assistant', screen: AiChatbot()),
                      DrawerItemModel(icon: Icons.person_outline, label: 'Doctor Chat', screen: HumanCoach()),
                      DrawerItemModel(icon: Icons.medical_services_outlined, label: 'Medical Records', screen: MedicalRecords()),
                    ],
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: Colors.white.withOpacity(0.08)),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              child: Material(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
                child: ListTile(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  leading: const Icon(Icons.logout_rounded, color: Colors.white70),
                  title: const Text('Log out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('Save progress and return to login', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11)),
                  onTap: () => _logout(context),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DrawerHeaderWidget extends StatelessWidget {
  const DrawerHeaderWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 180,
      width: double.infinity,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Image.asset(AppAssets.logo, width: 72, height: 72),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [HealixColors.navy, HealixColors.green],
                    ).createShader(bounds),
                    child: const Text(
                      'Healix',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'AI Health Advisor',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  AnimatedBuilder(
                    animation: appState,
                    builder: (context, _) {
                      final tier = appState.subscriptionTier;
                      String text = 'Free';
                      Color color = HealixColors.orange;
                      if (tier == 'pro') { text = 'AI Pro'; color = const Color(0xFF1A7AD4); }
                      else if (tier == 'doctor') { text = 'Doctor'; color = Colors.purple; }

                      return InkWell(
                        onTap: () {
                          final nav = Navigator.of(context, rootNavigator: true);
                          nav.pop();
                          nav.push(MaterialPageRoute(builder: (_) => const SubscriptionScreen()));
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.2),
                            border: Border.all(color: color.withOpacity(0.5)),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(text, style: TextStyle(color: color.withOpacity(0.9), fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      );
                    },
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

class DrawerSectionWidget extends StatelessWidget {
  final String title;
  final List<DrawerItemModel> items;
  final String selectedItem;
  final Function(String) onItemTap;

  const DrawerSectionWidget({
    super.key,
    required this.title,
    required this.items,
    required this.selectedItem,
    required this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 14, bottom: 4, left: 18),
          child: Text(
            title.toUpperCase(),
            style: TextStyle(
              color: Colors.white.withOpacity(0.55),
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
          ),
        ),
        ...items.map(
          (item) => DrawerMenuItemWidget(
            item: item,
            isSelected: selectedItem == item.label,
            onTap: () => onItemTap(item.label),
          ),
        ),
      ],
    );
  }
}
