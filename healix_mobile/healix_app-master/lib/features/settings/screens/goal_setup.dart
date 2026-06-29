import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'settings_widgets.dart';

class GoalSetup extends StatefulWidget {
  const GoalSetup({super.key});

  @override
  State<GoalSetup> createState() => _GoalSetupState();
}

class _GoalSetupState extends State<GoalSetup> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedGoal = appState.selectedGoal;
  double _durationWeeks = appState.goalDurationWeeks.toDouble();
  late final TextEditingController _targetController;

  @override
  void initState() {
    super.initState();
    _targetController = TextEditingController(text: appState.targetWeightKg.toStringAsFixed(0));
  }

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  void _saveGoal() {
    final target = double.tryParse(_targetController.text.trim());
    if (target == null || target <= 0) {
      AppActions.showSnack(context, 'Enter a valid target weight.', icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    appState.updateGoal(_selectedGoal, target, _durationWeeks.round());
    AppActions.showSnack(context, 'Goal saved: $_selectedGoal to ${target.toStringAsFixed(1)} kg', icon: Icons.track_changes_outlined);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _targetController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final goalDelta = _selectedGoal == 'Lose Weight'
        ? 'Lose 4 kg'
        : _selectedGoal == 'Gain Weight'
            ? 'Gain 4 kg'
            : 'Maintain current weight';
    return FeaturePageFrame(
      title: 'Goal Setup',
      selectedItem: 'Goal Setup',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsHeader(
            title: 'Goal Setup',
            subtitle: 'Define your health objectives',
            icon: Icons.track_changes_outlined,
            colors: [HealixColors.navy, HealixColors.navyDark],
          ),
          SettingsSurface(
            children: [
              _GoalSelectionPanel(selectedGoal: _selectedGoal, onChanged: (value) => setState(() => _selectedGoal = value)),
              const _CurrentStatsPanel(),
              _TargetWeightPanel(goalDelta: goalDelta, controller: _targetController),
              _TimelinePanel(durationWeeks: _durationWeeks, onChanged: (value) => setState(() => _durationWeeks = value)),
              const _GoalRecommendationCard(),
              SettingsPrimaryButton(label: 'Save Goal', onTap: _saveGoal, color: HealixColors.green),
            ],
          ),
        ],
      ),
    );
  }
}

class _GoalSelectionPanel extends StatelessWidget {
  const _GoalSelectionPanel({required this.selectedGoal, required this.onChanged});

  final String selectedGoal;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Select Your Goal'),
          const SizedBox(height: 18),
          ResponsiveWrapGrid(
            minTileWidth: 160,
            maxColumns: 3,
            spacing: 14,
            runSpacing: 14,
            children: [
              SettingsChoiceCard(title: 'Lose Weight', icon: Icons.trending_down, iconColor: HealixColors.orange, selected: selectedGoal == 'Lose Weight', onTap: () => onChanged('Lose Weight')),
              SettingsChoiceCard(title: 'Gain Weight', icon: Icons.trending_up, iconColor: HealixColors.green, selected: selectedGoal == 'Gain Weight', onTap: () => onChanged('Gain Weight')),
              SettingsChoiceCard(title: 'Maintain', icon: Icons.remove, iconColor: HealixColors.teal, selected: selectedGoal == 'Maintain', onTap: () => onChanged('Maintain')),
            ],
          ),
        ],
      ),
    );
  }
}

class _CurrentStatsPanel extends StatelessWidget {
  const _CurrentStatsPanel();

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Current Stats'),
          const SizedBox(height: 16),
          ResponsiveWrapGrid(
            minTileWidth: 220,
            maxColumns: 2,
            spacing: 14,
            runSpacing: 14,
            children: [
              SettingsInfoTile(
                title: 'Current Weight', 
                subtitle: '${appState.weightKg.toStringAsFixed(1)} kg', 
                background: HealixColors.navy.withOpacity(0.04),
              ),
              SettingsInfoTile(
                title: 'Current BMI', 
                subtitle: appState.bmi.toStringAsFixed(1), 
                background: HealixColors.navy.withOpacity(0.04),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TargetWeightPanel extends StatelessWidget {
  const _TargetWeightPanel({required this.goalDelta, required this.controller});

  final String goalDelta;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Target Weight'),
          const SizedBox(height: 18),
          SettingsTextField(label: 'Target Weight', controller: controller, keyboardType: TextInputType.number, suffixText: 'kg'),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: AppResponsive.scalePadding(context, const EdgeInsets.all(14)),
            decoration: BoxDecoration(
              color: HealixColors.navy.withOpacity(0.04), 
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: HealixColors.border),
            ),
            child: Text(
              'Goal: $goalDelta', 
              style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelinePanel extends StatelessWidget {
  const _TimelinePanel({required this.durationWeeks, required this.onChanged});

  final double durationWeeks;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Timeline'),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Duration', 
                  style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.bold),
                ),
              ),
              Text(
                '${durationWeeks.round()} weeks', 
                style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.bold),
              ),
            ],
          ),
          Slider(
            value: durationWeeks,
            min: 4,
            max: 24,
            divisions: 20,
            onChanged: onChanged,
            activeColor: HealixColors.navy,
            inactiveColor: HealixColors.border,
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: AppResponsive.scalePadding(context, const EdgeInsets.all(14)),
            decoration: BoxDecoration(
              color: HealixColors.navy.withOpacity(0.04), 
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: HealixColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Estimated Weekly Change', style: TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  '${appState.weeklyTargetChange.toStringAsFixed(2)} kg/week', 
                  style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GoalRecommendationCard extends StatelessWidget {
  const _GoalRecommendationCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [HealixColors.navy, HealixColors.navyDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.1),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.track_changes_outlined, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI Recommendation', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  'Your goal is achievable. We recommend a balanced approach with a 500 calorie deficit per day and 3-4 workouts per week.', 
                  style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13, height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
