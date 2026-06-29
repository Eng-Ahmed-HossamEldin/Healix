import 'package:flutter/material.dart';

import '../../../../core/constants/app_assets.dart';
import '../../../../core/routes/page_routes_name.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/services/biometric_service.dart';
import '../../../../core/session/user_session.dart';
import '../../../../core/state/app_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool obscurePassword = true;
  bool rememberMe = AuthService.rememberMe.value;
  bool _loading = false;

  void _showMessage(String message, {Color? color}) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: color,
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> _goToDashboard() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(milliseconds: 180));
    await AuthService.setRememberMe(rememberMe);
    final result = await AuthService.signIn(emailController.text, passwordController.text);
    if (!mounted) return;
    setState(() => _loading = false);
    if (!result.success) {
      _showMessage(result.message, color: Colors.red.shade700);
      return;
    }
    _showMessage(result.message, color: const Color(0xFF0E5678));
    Navigator.pushReplacementNamed(context, PageRoutesName.dashboard);
  }

  Future<void> _loginWithBiometric(String method) async {
    setState(() => _loading = true);
    final result = await BiometricService.authenticate(method);
    if (!mounted) return;
    setState(() => _loading = false);
    if (!result.success) {
      _showMessage(result.message, color: Colors.red.shade700);
      return;
    }
    UserSession.setDisplayName(appState.fullName);
    _showMessage(result.message, color: const Color(0xFF0E5678));
    Navigator.pushReplacementNamed(context, PageRoutesName.dashboard);
  }

  void _openForgotPassword() => Navigator.pushNamed(context, PageRoutesName.forgotPassword);
  void _openSignUp() => Navigator.pushNamed(context, PageRoutesName.signUp);

  @override
  Widget build(BuildContext context) {
    final password = passwordController.text;
    final rules = AuthService.passwordRules(password);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: Image.asset(AppAssets.logo, height: 120, fit: BoxFit.contain)),
                  const Center(
                    child: Text(
                      'Welcome Back',
                      style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Color(0xFF0E5678)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text(
                      'Sign in with your email and a strong password.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF6D8A96), fontSize: 15),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Email', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0E5678))),
                  const SizedBox(height: 10),
                  TextField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(hintText: 'example@email.com', prefixIcon: Icon(Icons.email_outlined)),
                  ),
                  const SizedBox(height: 20),
                  const Text('Password', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0E5678))),
                  const SizedBox(height: 10),
                  TextField(
                    controller: passwordController,
                    obscureText: obscurePassword,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _goToDashboard(),
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Enter strong password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => obscurePassword = !obscurePassword),
                        icon: Icon(obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  _PasswordRules(rules: rules),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Checkbox(
                        value: rememberMe,
                        onChanged: (value) => setState(() => rememberMe = value ?? false),
                        activeColor: const Color(0xFF0E5678),
                      ),
                      const Text('Remember me', style: TextStyle(color: Color(0xFF6D8A96))),
                      const Spacer(),
                      TextButton(onPressed: _openForgotPassword, child: const Text('Forgot password?')),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _loading ? null : _goToDashboard,
                    child: _loading
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Sign in', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(height: 24),
                  const Row(
                    children: [
                      Expanded(child: Divider()),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text('Or continue with', style: TextStyle(color: Color(0xFF9AAFB8))),
                      ),
                      Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _loading ? null : () => _loginWithBiometric('Touch ID'),
                          icon: const Icon(Icons.fingerprint),
                          label: const Text('Touch ID'),
                          style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _loading ? null : () => _loginWithBiometric('Face ID'),
                          icon: const Icon(Icons.face_outlined),
                          label: const Text('Face ID'),
                          style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  Center(
                    child: Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text('Don\'t have an account? ', style: TextStyle(color: Color(0xFF6D8A96), fontWeight: FontWeight.w500)),
                        TextButton(
                          onPressed: _openSignUp,
                          style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                          child: const Text('Sign Up', style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text(
                      'Create an account first, then sign in with your saved email and password.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF9AAFB8), fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PasswordRules extends StatelessWidget {
  const _PasswordRules({required this.rules});
  final List<PasswordRuleResult> rules;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 6,
      children: rules
          .map(
            (rule) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                color: rule.isValid ? const Color(0xFFE9F8EF) : const Color(0xFFFFF3F1),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: rule.isValid ? const Color(0xFF20B95B).withOpacity(.25) : Colors.red.withOpacity(.18)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(rule.isValid ? Icons.check_circle : Icons.radio_button_unchecked, size: 14, color: rule.isValid ? const Color(0xFF20B95B) : Colors.red.shade400),
                  const SizedBox(width: 5),
                  Text(rule.label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: rule.isValid ? const Color(0xFF178A45) : Colors.red.shade600)),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
