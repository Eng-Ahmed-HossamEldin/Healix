import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'settings_widgets.dart';

class Preferences extends StatefulWidget {
  const Preferences({super.key});

  @override
  State<Preferences> createState() => _PreferencesState();
}

class _PreferencesState extends State<Preferences> {
  final TextEditingController _searchController = TextEditingController();
  late Map<String, bool> _dietaryPrefs;
  late String _selectedAllergy;
  late String _selectedProtocol;
  late String _mealFrequency;

  @override
  void initState() {
    super.initState();
    _dietaryPrefs = Map<String, bool>.from(appState.dietaryPreferences);
    _selectedAllergy = appState.selectedAllergy;
    _selectedProtocol = appState.fastingProtocol;
    _mealFrequency = appState.mealFrequency;
  }

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _save() {
    appState.updatePreferences(dietary: _dietaryPrefs, allergy: _selectedAllergy, protocol: _selectedProtocol, mealsPerDay: _mealFrequency);
    AppActions.showSnack(context, 'Preferences saved and meal recommendations updated', icon: Icons.tune_outlined);
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Preferences & Restrictions',
      selectedItem: 'Preferences',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsHeader(
            title: 'Preferences & Restrictions',
            subtitle: 'Customize your nutrition plan',
            icon: Icons.settings_outlined,
            colors: [Color(0xFF0E5678), Color(0xFF0E5678)],
          ),
          SettingsSurface(
            children: [
              _DietaryPreferencesPanel(
                values: _dietaryPrefs,
                onChanged: (key, value) => setState(() => _dietaryPrefs[key] = value),
              ),
              _FoodAllergiesPanel(
                selected: _selectedAllergy,
                onChanged: (value) => setState(() => _selectedAllergy = value),
              ),
              _FastingProtocolPanel(
                selected: _selectedProtocol,
                onChanged: (value) => setState(() => _selectedProtocol = value),
              ),
              _MealFrequencyPanel(
                selected: _mealFrequency,
                onChanged: (value) => setState(() => _mealFrequency = value),
              ),
              SettingsPrimaryButton(label: 'Save Preferences', onTap: _save),
            ],
          ),
        ],
      ),
    );
  }
}

class _DietaryPreferencesPanel extends StatelessWidget {
  const _DietaryPreferencesPanel({required this.values, required this.onChanged});

  final Map<String, bool> values;
  final void Function(String key, bool value) onChanged;

  @override
  Widget build(BuildContext context) {
    final entries = values.entries.toList();
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Dietary Preferences'),
          const SizedBox(height: 18),
          ...List.generate(entries.length, (index) {
            final entry = entries[index];
            return Padding(
              padding: EdgeInsets.only(bottom: index == entries.length - 1 ? 0 : 10),
              child: SettingsToggleRow(label: entry.key, value: entry.value, onChanged: (value) => onChanged(entry.key, value)),
            );
          }),
        ],
      ),
    );
  }
}

class _FoodAllergiesPanel extends StatelessWidget {
  const _FoodAllergiesPanel({required this.selected, required this.onChanged});

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    const allergies = ['Peanuts', 'Shellfish', 'Eggs', 'Soy', 'Tree Nuts', 'Fish'];
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Food Allergies'),
          const SizedBox(height: 18),
          ResponsiveWrapGrid(
            minTileWidth: 210,
            maxColumns: 2,
            spacing: 12,
            runSpacing: 12,
            children: allergies.map((item) => SettingsSelectablePill(label: item, selected: selected == item, onTap: () => onChanged(item))).toList(),
          ),
        ],
      ),
    );
  }
}

class _FastingProtocolPanel extends StatelessWidget {
  const _FastingProtocolPanel({required this.selected, required this.onChanged});

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    const protocols = ['16:8 Intermittent Fasting', '18:6 Intermittent Fasting', '5:2 Diet', 'OMAD (One Meal A Day)'];
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Fasting Protocol'),
          const SizedBox(height: 18),
          ...protocols.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: SettingsSelectablePill(label: item, selected: selected == item, onTap: () => onChanged(item)),
              )),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: AppResponsive.scalePadding(context, const EdgeInsets.all(14)),
            decoration: BoxDecoration(color: const Color(0xFFEAF5F2), borderRadius: BorderRadius.circular(14)),
            child: Text('Current: $selected', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}

class _MealFrequencyPanel extends StatelessWidget {
  const _MealFrequencyPanel({required this.selected, required this.onChanged});

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    const options = ['3 meals', '4 meals', '5-6 meals'];
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Meal Frequency'),
          const SizedBox(height: 18),
          ResponsiveWrapGrid(
            minTileWidth: 150,
            maxColumns: 3,
            spacing: 12,
            runSpacing: 12,
            children: options.map((item) => SettingsChoiceButton(label: item, selected: selected == item, onTap: () => onChanged(item))).toList(),
          ),
        ],
      ),
    );
  }
}

class SettingsChoiceButton extends StatelessWidget {
  const SettingsChoiceButton({super.key, required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 54,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          backgroundColor: selected ? const Color(0xFFEFF8F7) : Colors.white,
          side: BorderSide(color: selected ? HealixColors.teal : const Color(0xFFE1E7EA), width: selected ? 1.8 : 1.2),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
          foregroundColor: HealixColors.navy,
          textStyle: TextStyle(fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w900),
        ),
        child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
      ),
    );
  }
}
