import 'package:flutter/material.dart';
import 'package:healix_app/core/services/user_service.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'settings_widgets.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _currentPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _updatePassword() async {
    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (currentPassword.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty) {
      AppActions.showSnack(
        context,
        'Please fill in all password fields.',
        icon: Icons.error_outline,
        color: Colors.red.shade700,
      );
      return;
    }

    if (newPassword != confirmPassword) {
      AppActions.showSnack(
        context,
        'New password and confirmation do not match.',
        icon: Icons.error_outline,
        color: Colors.red.shade700,
      );
      return;
    }

    if (newPassword.length < 6) {
      AppActions.showSnack(
        context,
        'New password must be at least 6 characters long.',
        icon: Icons.error_outline,
        color: Colors.red.shade700,
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await UserService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        AppActions.showSnack(
          context,
          result['message'] ?? 'Password changed successfully',
          icon: Icons.lock_outline,
        );
        Navigator.pop(context);
      } else {
        AppActions.showSnack(
          context,
          result['message'] ?? 'Failed to update password',
          icon: Icons.error_outline,
          color: Colors.red.shade700,
        );
      }
    } catch (e) {
      if (!mounted) return;
      AppActions.showSnack(
        context,
        'An error occurred: $e',
        icon: Icons.error_outline,
        color: Colors.red.shade700,
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Change Password',
      selectedItem: 'Edit Info',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsHeader(
            title: 'Change Password',
            subtitle: 'Ensure your account remains secure by updating your password periodically.',
            icon: Icons.lock_outline,
            colors: [Color(0xFF0E5678), Color(0xFF0E5678)],
          ),
          SettingsSurface(
            children: [
              SettingsPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SettingsSectionTitle('Update Password'),
                    const SizedBox(height: 18),
                    _PasswordTextField(
                      label: 'Current Password',
                      controller: _currentPasswordController,
                    ),
                    const SizedBox(height: 14),
                    _PasswordTextField(
                      label: 'New Password',
                      controller: _newPasswordController,
                    ),
                    const SizedBox(height: 14),
                    _PasswordTextField(
                      label: 'Confirm New Password',
                      controller: _confirmPasswordController,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else
                SettingsPrimaryButton(
                  label: 'Update Password',
                  icon: Icons.save_outlined,
                  onTap: _updatePassword,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PasswordTextField extends StatefulWidget {
  const _PasswordTextField({
    required this.label,
    required this.controller,
  });

  final String label;
  final TextEditingController controller;

  @override
  State<_PasswordTextField> createState() => _PasswordTextFieldState();
}

class _PasswordTextFieldState extends State<_PasswordTextField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: HealixColors.navy,
            fontSize: AppResponsive.font(context, 13),
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: widget.controller,
          obscureText: _obscureText,
          style: TextStyle(
            color: HealixColors.navy,
            fontSize: AppResponsive.font(context, 14),
            fontWeight: FontWeight.bold,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: HealixColors.navy.withOpacity(0.04),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: HealixColors.navyLight, width: 1.4),
            ),
            suffixIcon: IconButton(
              icon: Icon(
                _obscureText ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: HealixColors.sub,
                size: 20,
              ),
              onPressed: () => setState(() => _obscureText = !_obscureText),
            ),
          ),
        ),
      ],
    );
  }
}
