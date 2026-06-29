import 'package:flutter/material.dart';
import 'package:healix_app/core/services/media_service.dart';
import 'package:healix_app/core/session/user_session.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'settings_widgets.dart';
import 'change_password.dart';

class EditInfo extends StatefulWidget {
  const EditInfo({super.key});

  @override
  State<EditInfo> createState() => _EditInfoState();
}

class _EditInfoState extends State<EditInfo> {
  final TextEditingController _searchController = TextEditingController();
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _ageController;
  late final TextEditingController _heightController;
  late final TextEditingController _weightController;
  late final TextEditingController _targetWeightController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  late final TextEditingController _jobController;
  late final TextEditingController _dobController;
  String _gender = appState.gender;
  String _activity = appState.activityLevel;
  String _goal = appState.selectedGoal;
  String _medicalCondition = appState.medicalCondition;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: appState.fullName);
    _emailController = TextEditingController(text: appState.email);
    _ageController = TextEditingController(text: appState.age.toString());
    _heightController = TextEditingController(text: appState.heightCm.toStringAsFixed(0));
    _weightController = TextEditingController(text: appState.weightKg.toStringAsFixed(0));
    _targetWeightController = TextEditingController(text: appState.targetWeightKg.toStringAsFixed(0));
    _phoneController = TextEditingController(text: appState.phoneNo);
    _addressController = TextEditingController(text: appState.address);
    _jobController = TextEditingController(text: appState.job);
    _dobController = TextEditingController(text: appState.dob);
  }

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  void _showSaved() {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final age = int.tryParse(_ageController.text.trim());
    final height = double.tryParse(_heightController.text.trim());
    final weight = double.tryParse(_weightController.text.trim());
    final targetWeight = double.tryParse(_targetWeightController.text.trim());
    final phone = _phoneController.text.trim();
    final address = _addressController.text.trim();
    final job = _jobController.text.trim();
    final dob = _dobController.text.trim();

    if (name.isEmpty || email.isEmpty || age == null || height == null || weight == null || targetWeight == null) {
      AppActions.showSnack(context, 'Please complete all profile fields correctly.', icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    appState.updateProfile(
      name: name,
      emailAddress: email,
      newAge: age,
      newGender: _gender,
      newHeight: height,
      newWeight: weight,
      newActivityLevel: _activity,
      newGoal: _goal,
      newTargetWeight: targetWeight,
      newMedicalCondition: _medicalCondition,
      newPhone: phone,
      newAddress: address,
      newJob: job,
      newDob: dob,
    );
    UserSession.setDisplayName(name);
    AppActions.showSnack(context, 'Profile information saved and health metrics recalculated', icon: Icons.save_outlined);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    _targetWeightController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _jobController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Edit Personal Info',
      selectedItem: 'Edit Info',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SettingsHeader(title: 'Edit Personal Info', subtitle: 'Update your profile information', icon: Icons.settings_outlined, colors: [Color(0xFF0E5678), Color(0xFF0E5678)]),
        SettingsSurface(children: [
          _ProfilePicturePanel(onPhotoChanged: () => setState(() {})),
          _BasicInformationPanel(
            nameController: _nameController, 
            emailController: _emailController, 
            ageController: _ageController, 
            gender: _gender, 
            onGenderChanged: (value) => setState(() => _gender = value),
            dobController: _dobController,
          ),
          _ContactProfessionalPanel(
            phoneController: _phoneController,
            addressController: _addressController,
            jobController: _jobController,
          ),
          _BodyMeasurementsPanel(
            heightController: _heightController, 
            weightController: _weightController, 
            targetWeightController: _targetWeightController, 
            activity: _activity, 
            onActivityChanged: (value) => setState(() => _activity = value), 
            goal: _goal, 
            onGoalChanged: (value) => setState(() => _goal = value),
            medicalCondition: _medicalCondition,
            onConditionChanged: (value) => setState(() => _medicalCondition = value),
            onAutoSuggest: _autoSuggestTargetWeight,
          ),
          const SizedBox(height: 14),
          if (_medicalCondition != 'None')
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/medical_records'),
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Upload Medical Record'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ),
          _DailyTargetsPanel(goal: _goal, activity: _activity, condition: _medicalCondition, weight: double.tryParse(_weightController.text) ?? 70),
          const SizedBox(height: 14),
          SettingsPrimaryButton(label: 'Save Goals and Records', icon: Icons.save_outlined, onTap: _showSaved),
          const SizedBox(height: 12),
          SettingsPrimaryButton(
            label: 'Change Password',
            icon: Icons.lock_outline,
            color: HealixColors.navyLight,
            filled: false,
            onTap: () => _openScreen(const ChangePasswordScreen()),
          ),
        ]),
      ]),
    );
  }

  void _autoSuggestTargetWeight() {
    final height = double.tryParse(_heightController.text) ?? 170;
    // Simple BMI-based suggestion (target BMI = 22)
    final idealWeight = 22 * ((height / 100) * (height / 100));
    setState(() {
      _targetWeightController.text = idealWeight.toStringAsFixed(1);
    });
    AppActions.showSnack(context, 'Suggested target weight applied');
  }
}

class _ProfilePicturePanel extends StatelessWidget {
  const _ProfilePicturePanel({required this.onPhotoChanged});
  final VoidCallback onPhotoChanged;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: LayoutBuilder(builder: (context, constraints) {
        final compact = constraints.maxWidth < 420;
        final avatar = CircleAvatar(radius: compact ? 40 : 46, backgroundColor: HealixColors.navy, child: Icon(appState.profilePhotoChanged ? Icons.check : Icons.person_outline, color: Colors.white, size: 42));
        final details = Column(crossAxisAlignment: compact ? CrossAxisAlignment.center : CrossAxisAlignment.start, children: [
          Text('Profile Picture', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          SizedBox(
            width: compact ? double.infinity : 160,
            child: SettingsPrimaryButton(
              label: appState.profilePhotoChanged ? 'Photo Updated' : 'Change Photo',
              icon: Icons.camera_alt_outlined,
              color: HealixColors.navy,
              filled: false,
              onTap: () => AppActions.showOptionsSheet(context, title: 'Update profile photo', options: [
                AppActionOption(
                  icon: Icons.camera_alt_outlined,
                  title: 'Take new photo',
                  subtitle: 'Open camera and capture profile image',
                  onTap: () async {
                    final result = await MediaService.pickFromCamera(actionName: 'profile photo');
                    if (!context.mounted) return;
                    if (!result.success) {
                      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: Colors.red.shade700);
                      return;
                    }
                    appState.changeProfilePhoto();
                    onPhotoChanged();
                    AppActions.showSnack(context, 'Profile photo captured', icon: Icons.camera_alt_outlined);
                  },
                ),
                AppActionOption(
                  icon: Icons.photo_library_outlined,
                  title: 'Choose from gallery',
                  subtitle: 'Select an existing image from your device',
                  onTap: () async {
                    final result = await MediaService.pickFromGallery(actionName: 'profile photo');
                    if (!context.mounted) return;
                    if (!result.success) {
                      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: Colors.red.shade700);
                      return;
                    }
                    appState.changeProfilePhoto();
                    onPhotoChanged();
                    AppActions.showSnack(context, 'Profile photo selected', icon: Icons.photo_library_outlined);
                  },
                ),
              ]),
            ),
          ),
        ]);
        if (compact) return Column(children: [avatar, const SizedBox(height: 14), details]);
        return Row(children: [avatar, const SizedBox(width: 18), Expanded(child: details)]);
      }),
    );
  }
}

class _BasicInformationPanel extends StatelessWidget {
  const _BasicInformationPanel({
    required this.nameController,
    required this.emailController,
    required this.ageController,
    required this.gender,
    required this.onGenderChanged,
    required this.dobController,
  });
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController ageController;
  final String gender;
  final ValueChanged<String> onGenderChanged;
  final TextEditingController dobController;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SettingsSectionTitle('Basic Information'),
      const SizedBox(height: 18),
      SettingsTextField(label: 'Full Name', controller: nameController),
      const SizedBox(height: 14),
      SettingsTextField(label: 'Email', controller: emailController, keyboardType: TextInputType.emailAddress),
      const SizedBox(height: 14),
      ResponsiveWrapGrid(minTileWidth: 220, maxColumns: 2, spacing: 14, runSpacing: 14, children: [
        _DobField(dobController: dobController, ageController: ageController),
        SettingsTextField(label: 'Age', controller: ageController, keyboardType: TextInputType.number),
      ]),
      const SizedBox(height: 14),
      SettingsDropdownField(label: 'Gender', value: gender, items: const ['Male', 'Female', 'Prefer not to say'], onChanged: onGenderChanged),
    ]));
  }
}

class _DobField extends StatelessWidget {
  const _DobField({required this.dobController, required this.ageController});
  final TextEditingController dobController;
  final TextEditingController ageController;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Date of Birth',
          style: TextStyle(
            color: HealixColors.navy,
            fontSize: AppResponsive.font(context, 13),
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: () async {
            final initialDate = DateTime.tryParse(dobController.text) ?? DateTime(1995, 1, 1);
            final picked = await showDatePicker(
              context: context,
              initialDate: initialDate,
              firstDate: DateTime(1900),
              lastDate: DateTime.now(),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: const ColorScheme.light(
                      primary: HealixColors.navy,
                      onPrimary: Colors.white,
                      onSurface: HealixColors.navy,
                    ),
                    textButtonTheme: TextButtonThemeData(
                      style: TextButton.styleFrom(
                        foregroundColor: HealixColors.navy,
                      ),
                    ),
                  ),
                  child: child!,
                );
              },
            );
            if (picked != null) {
              dobController.text = picked.toIso8601String().split('T').first;
              final calculatedAge = DateTime.now().year - picked.year;
              ageController.text = calculatedAge.toString();
            }
          },
          child: IgnorePointer(
            child: TextFormField(
              controller: dobController,
              style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                hintText: 'Select date of birth',
                prefixIcon: const Icon(Icons.calendar_month, color: HealixColors.navy),
                filled: true,
                fillColor: HealixColors.navy.withOpacity(0.04),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ContactProfessionalPanel extends StatelessWidget {
  const _ContactProfessionalPanel({
    required this.phoneController,
    required this.addressController,
    required this.jobController,
  });
  final TextEditingController phoneController;
  final TextEditingController addressController;
  final TextEditingController jobController;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Contact & Professional Info'),
          const SizedBox(height: 18),
          SettingsTextField(label: 'Phone Number', controller: phoneController, keyboardType: TextInputType.phone),
          const SizedBox(height: 14),
          SettingsTextField(label: 'Address', controller: addressController),
          const SizedBox(height: 14),
          SettingsTextField(label: 'Occupation / Job', controller: jobController),
        ],
      ),
    );
  }
}

class _BodyMeasurementsPanel extends StatelessWidget {
  const _BodyMeasurementsPanel({required this.heightController, required this.weightController, required this.targetWeightController, required this.activity, required this.onActivityChanged, required this.goal, required this.onGoalChanged, required this.medicalCondition, required this.onConditionChanged, required this.onAutoSuggest});
  final TextEditingController heightController;
  final TextEditingController weightController;
  final TextEditingController targetWeightController;
  final String activity;
  final ValueChanged<String> onActivityChanged;
  final String goal;
  final ValueChanged<String> onGoalChanged;
  final String medicalCondition;
  final ValueChanged<String> onConditionChanged;
  final VoidCallback onAutoSuggest;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SettingsSectionTitle('Body Measurements & Goals'),
      const SizedBox(height: 18),
      ResponsiveWrapGrid(minTileWidth: 220, maxColumns: 2, spacing: 14, runSpacing: 14, children: [
        SettingsTextField(label: 'Height (cm)', controller: heightController, keyboardType: TextInputType.number),
        SettingsTextField(label: 'Weight (kg)', controller: weightController, keyboardType: TextInputType.number),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(child: SettingsTextField(label: 'Target Weight (kg)', controller: targetWeightController, keyboardType: TextInputType.number)),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.auto_awesome, color: HealixColors.navy),
              onPressed: onAutoSuggest,
              tooltip: 'Auto-suggest target weight',
              style: IconButton.styleFrom(
                backgroundColor: HealixColors.navy.withOpacity(0.1),
                padding: const EdgeInsets.all(12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
              ),
            ),
          ],
        ),
        SettingsDropdownField(label: 'Primary Goal', value: goal, items: const ['Weight Loss', 'Maintenance', 'Muscle Gain'], onChanged: (v) { if (v != null) onGoalChanged(v); }),
      ]),
      const SizedBox(height: 14),
      SettingsDropdownField(label: 'Activity Level', value: activity, items: const ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'], onChanged: (v) { if (v != null) onActivityChanged(v); }),
      const SizedBox(height: 14),
      SettingsDropdownField(label: 'Medical Condition', value: medicalCondition, items: const ['None', 'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'Celiac disease', 'PCOS', 'other'], onChanged: (v) { if (v != null) onConditionChanged(v); }),
    ]));
  }
}

class _DailyTargetsPanel extends StatelessWidget {
  const _DailyTargetsPanel({required this.goal, required this.activity, required this.condition, required this.weight});
  final String goal;
  final String activity;
  final String condition;
  final double weight;

  @override
  Widget build(BuildContext context) {
    int calories = 2000;
    if (goal == 'Weight Loss') calories -= 300;
    if (goal == 'Muscle Gain') calories += 300;
    
    int protein = (weight * 1.6).round();
    int carbs = (calories * 0.45 / 4).round();
    int fats = (calories * 0.25 / 9).round();

    return SettingsPanel(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SettingsSectionTitle('Daily Targets'),
      const SizedBox(height: 18),
      ResponsiveWrapGrid(minTileWidth: 150, maxColumns: 3, spacing: 14, runSpacing: 14, children: [
        _TargetTile(label: 'Calories', value: '$calories kcal', icon: Icons.local_fire_department, color: Colors.orange),
        _TargetTile(label: 'Protein', value: '${protein}g', icon: Icons.fitness_center, color: Colors.blue),
        _TargetTile(label: 'Carbs', value: '${carbs}g', icon: Icons.restaurant, color: Colors.green),
        _TargetTile(label: 'Fats', value: '${fats}g', icon: Icons.opacity, color: Colors.amber),
        _TargetTile(label: 'Sleep', value: '8 hrs', icon: Icons.bedtime, color: Colors.indigo),
        _TargetTile(label: 'Water', value: '2.5 L', icon: Icons.water_drop, color: Colors.lightBlue),
      ]),
    ]));
  }
}

class _TargetTile extends StatelessWidget {
  const _TargetTile({required this.label, required this.value, required this.icon, required this.color});
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.2))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [Icon(icon, color: color, size: 16), const SizedBox(width: 6), Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12))]),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        ],
      ),
    );
  }
}
