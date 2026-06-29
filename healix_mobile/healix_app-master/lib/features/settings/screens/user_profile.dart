import 'package:flutter/material.dart';
import 'package:healix_app/core/session/user_session.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'edit_info.dart';
import 'goal_setup.dart';
import 'settings_widgets.dart';

class UserProfile extends StatefulWidget {
  const UserProfile({super.key});

  @override
  State<UserProfile> createState() => _UserProfileState();
}

class _UserProfileState extends State<UserProfile> {
  final TextEditingController _searchController = TextEditingController();

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        final displayName = UserSession.displayName.value;
        return FeaturePageFrame(
          title: 'My Profile',
          selectedItem: 'User Profile',
          searchController: _searchController,
          openScreen: _openScreen,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              SettingsHeader(
                title: 'My Profile',
                subtitle: 'Track your health journey',
                icon: Icons.person_outline,
                colors: const [Color(0xFF0E5678), Color(0xFF0E5678)],
                trailing: SizedBox(
                  width: 96,
                  child: SettingsPrimaryButton(
                    label: 'Edit',
                    icon: Icons.edit_outlined,
                    color: Colors.white.withOpacity(0.14),
                    onTap: () => _openScreen(const EditInfo()),
                  ),
                ),
              ),
              SettingsSurface(
                children: [
                  _ProfileSummaryCard(displayName: displayName, onEdit: () => _openScreen(const EditInfo())),
                  ResponsiveWrapGrid(
                    minTileWidth: 230,
                    maxColumns: 2,
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      _ProfileStatCard(icon: Icons.track_changes_outlined, title: 'Goal', value: appState.selectedGoal, subtitle: 'Target: ${appState.targetWeightKg.toStringAsFixed(0)} kg', iconColor: HealixColors.green, onTap: () => _openScreen(const GoalSetup())),
                      _ProfileStatCard(icon: Icons.monitor_heart_outlined, title: 'BMI', value: appState.bmi.toStringAsFixed(1), subtitle: appState.bmiCategory, iconColor: HealixColors.teal),
                    ],
                  ),
                  _DailyProgressPanel(),
                  const _ProfileInsightCard(),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProfileSummaryCard extends StatelessWidget {
  const _ProfileSummaryCard({required this.displayName, required this.onEdit});

  final String displayName;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 430;
          final avatar = Container(
            width: compact ? 72 : 88,
            height: compact ? 72 : 88,
            decoration: BoxDecoration(color: HealixColors.navy, borderRadius: BorderRadius.circular(999)),
            child: Icon(Icons.person_outline, color: Colors.white, size: compact ? 40 : 48),
          );
          final info = Column(
            crossAxisAlignment: compact ? CrossAxisAlignment.center : CrossAxisAlignment.start,
            children: [
              Text(
                displayName.isEmpty ? appState.fullName : displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: compact ? TextAlign.center : TextAlign.start,
                style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 20), fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 6),
              Text(
                appState.email,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: compact ? TextAlign.center : TextAlign.start,
                style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),
              ResponsiveWrapGrid(
                minTileWidth: compact ? 70 : 78,
                maxColumns: 3,
                spacing: 12,
                runSpacing: 10,
                children: [
                  _TinyProfileData(label: 'Age', value: appState.age.toString()),
                  _TinyProfileData(label: 'Height', value: '${appState.heightCm.toStringAsFixed(0)} cm'),
                  _TinyProfileData(label: 'Weight', value: '${appState.weightKg.toStringAsFixed(1)} kg'),
                ],
              ),
            ],
          );
          if (compact) {
            return Column(
              children: [
                avatar,
                const SizedBox(height: 16),
                info,
                const SizedBox(height: 16),
                SettingsPrimaryButton(label: 'Edit Profile', icon: Icons.edit_outlined, onTap: onEdit),
              ],
            );
          }
          return Row(
            children: [
              avatar,
              const SizedBox(width: 18),
              Expanded(child: info),
            ],
          );
        },
      ),
    );
  }
}

class _TinyProfileData extends StatelessWidget {
  const _TinyProfileData({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.w800)),
        const SizedBox(height: 3),
        Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w900)),
      ],
    );
  }
}

class _ProfileStatCard extends StatelessWidget {
  const _ProfileStatCard({required this.icon, required this.title, required this.value, required this.subtitle, required this.iconColor, this.onTap});

  final IconData icon;
  final String title;
  final String value;
  final String subtitle;
  final Color iconColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, color: iconColor, size: 22),
                  const SizedBox(width: 8),
                  Expanded(child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w800))),
                ],
              ),
              const SizedBox(height: 26),
              Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 17), fontWeight: FontWeight.w900)),
              const SizedBox(height: 18),
              Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w800)),
            ],
          ),
        ),
      ),
    );
  }
}

class _DailyProgressPanel extends StatelessWidget {
  const _DailyProgressPanel();

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Daily Progress'),
          const SizedBox(height: 18),
          ResponsiveWrapGrid(
            minTileWidth: 140,
            maxColumns: 3,
            spacing: 18,
            runSpacing: 18,
            children: [
              _ProgressRing(label: 'Calories', top: appState.caloriesConsumed.toString(), bottom: appState.calorieGoal.toString(), value: appState.caloriesProgress, color: const Color(0xFFF4BE2A)),
              _ProgressRing(label: 'Steps', top: appState.steps.toString(), bottom: appState.stepsGoal.toString(), value: appState.stepsProgress, color: HealixColors.navy),
              _ProgressRing(label: 'Water', top: appState.waterCups.toString(), bottom: appState.waterGoalCups.toString(), value: appState.waterProgress, color: HealixColors.teal),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProgressRing extends StatelessWidget {
  const _ProgressRing({required this.label, required this.top, required this.bottom, required this.value, required this.color});

  final String label;
  final String top;
  final String bottom;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SettingsRingProgress(
          value: value,
          color: color,
          center: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(top, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w900)),
              Text(bottom, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 12), fontWeight: FontWeight.w800)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.w900)),
      ],
    );
  }
}

class _ProfileInsightCard extends StatelessWidget {
  const _ProfileInsightCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
      decoration: BoxDecoration(color: HealixColors.navy, borderRadius: BorderRadius.circular(18)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: HealixColors.green, borderRadius: BorderRadius.circular(14)),
            child: const Icon(Icons.auto_awesome_outlined, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Profile Insight', style: TextStyle(color: Colors.white, fontSize: AppResponsive.font(context, 17), fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                Text('You are on track with your weight goal. Keep logging meals and water intake consistently.', style: TextStyle(color: Colors.white.withOpacity(0.88), fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w700, height: 1.45)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
