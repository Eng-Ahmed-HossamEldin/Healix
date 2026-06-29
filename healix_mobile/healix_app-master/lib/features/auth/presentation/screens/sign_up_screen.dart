import 'package:flutter/material.dart';

import '../../../../core/routes/page_routes_name.dart';
import '../../../../core/services/auth_service.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController ageController = TextEditingController();
  final TextEditingController heightController = TextEditingController();
  final TextEditingController weightController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  String selectedGender = 'Male';
  String selectedGoal = 'Lose Weight';
  bool obscurePassword = true;
  bool _loading = false;

  void _showMessage(String message, {Color? color}) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message), backgroundColor: color, behavior: SnackBarBehavior.floating));
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    ageController.dispose();
    heightController.dispose();
    weightController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> _createAccount() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(milliseconds: 180));
    final result = await AuthService.signUp(
      name: nameController.text,
      email: emailController.text,
      password: passwordController.text,
      age: ageController.text,
      gender: selectedGender,
      heightCm: heightController.text,
      weightKg: weightController.text,
      goal: selectedGoal,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (!result.success) {
      _showMessage(result.message, color: Colors.red.shade700);
      return;
    }
    _showMessage(result.message, color: const Color(0xFF0E5678));
    Navigator.pushReplacementNamed(context, PageRoutesName.dashboard);
  }

  void _backToLogin() => Navigator.pop(context);

  Widget _label(String text) => Text(text, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0E5678)));

  @override
  Widget build(BuildContext context) {
    final rules = AuthService.passwordRules(passwordController.text);
    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Create your account', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF0E5678))),
                  const SizedBox(height: 8),
                  const Text('Fill in your health details to personalize Healix.', style: TextStyle(color: Color(0xFF6D8A96), fontSize: 15)),
                  const SizedBox(height: 24),
                  _label('Full Name'),
                  const SizedBox(height: 10),
                  TextField(controller: nameController, textInputAction: TextInputAction.next, decoration: const InputDecoration(hintText: 'Enter your name', prefixIcon: Icon(Icons.person_outline))),
                  const SizedBox(height: 20),
                  _label('Email'),
                  const SizedBox(height: 10),
                  TextField(controller: emailController, keyboardType: TextInputType.emailAddress, textInputAction: TextInputAction.next, decoration: const InputDecoration(hintText: 'example@email.com', prefixIcon: Icon(Icons.email_outlined))),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _label('Age'),
                            const SizedBox(height: 10),
                            TextField(controller: ageController, keyboardType: TextInputType.number, textInputAction: TextInputAction.next, decoration: const InputDecoration(hintText: '28', prefixIcon: Icon(Icons.cake_outlined))),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _label('Height'),
                            const SizedBox(height: 10),
                            TextField(controller: heightController, keyboardType: const TextInputType.numberWithOptions(decimal: true), textInputAction: TextInputAction.next, decoration: const InputDecoration(hintText: '175 cm', prefixIcon: Icon(Icons.height))),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _label('Gender'),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _GenderChoice(
                          label: 'Male',
                          icon: Icons.male_rounded,
                          selected: selectedGender == 'Male',
                          onTap: () => setState(() => selectedGender = 'Male'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _GenderChoice(
                          label: 'Female',
                          icon: Icons.female_rounded,
                          selected: selectedGender == 'Female',
                          onTap: () => setState(() => selectedGender = 'Female'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _label('Weight'),
                  const SizedBox(height: 10),
                  TextField(controller: weightController, keyboardType: const TextInputType.numberWithOptions(decimal: true), textInputAction: TextInputAction.next, decoration: const InputDecoration(hintText: '72 kg', prefixIcon: Icon(Icons.monitor_weight_outlined))),
                  const SizedBox(height: 20),
                  _label('Goal'),
                  const SizedBox(height: 10),
                  _GoalSelector(
                    selectedGoal: selectedGoal,
                    onChanged: (goal) => setState(() => selectedGoal = goal),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Healix will calculate your daily calories and macros based on this goal.',
                    style: TextStyle(color: Color(0xFF6D8A96), fontSize: 12.5, height: 1.35),
                  ),
                  const SizedBox(height: 20),
                  _label('Password'),
                  const SizedBox(height: 10),
                  TextField(
                    controller: passwordController,
                    obscureText: obscurePassword,
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) => _createAccount(),
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
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _loading ? null : _createAccount,
                    child: _loading
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(height: 18),
                  Center(
                    child: Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text('Already have an account? ', style: TextStyle(color: Color(0xFF6D8A96), fontWeight: FontWeight.w500)),
                        TextButton(
                          onPressed: _backToLogin,
                          style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                          child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ],
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



class _GoalSelector extends StatelessWidget {
  const _GoalSelector({required this.selectedGoal, required this.onChanged});

  final String selectedGoal;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    const goals = <({String title, String subtitle, IconData icon})>[
      (title: 'Lose Weight', subtitle: 'Calorie deficit', icon: Icons.trending_down_rounded),
      (title: 'Maintain Weight', subtitle: 'Balanced calories', icon: Icons.balance_rounded),
      (title: 'Gain Weight', subtitle: 'Healthy surplus', icon: Icons.trending_up_rounded),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 420;
        final tiles = goals.map((goal) {
          final selected = selectedGoal == goal.title;
          return _GoalChoice(
            title: goal.title,
            subtitle: goal.subtitle,
            icon: goal.icon,
            selected: selected,
            onTap: () => onChanged(goal.title),
          );
        }).toList();

        if (compact) {
          return Column(
            children: [
              for (var i = 0; i < tiles.length; i++) ...[
                tiles[i],
                if (i != tiles.length - 1) const SizedBox(height: 10),
              ],
            ],
          );
        }

        return Row(
          children: [
            for (var i = 0; i < tiles.length; i++) ...[
              Expanded(child: tiles[i]),
              if (i != tiles.length - 1) const SizedBox(width: 10),
            ],
          ],
        );
      },
    );
  }
}

class _GoalChoice extends StatelessWidget {
  const _GoalChoice({required this.title, required this.subtitle, required this.icon, required this.selected, required this.onTap});

  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFEAF4FA) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? const Color(0xFF0E5678) : const Color(0xFFD7E3E8), width: selected ? 1.5 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: selected ? const Color(0xFF0E5678) : const Color(0xFF6D8A96), size: 20),
                const Spacer(),
                if (selected) const Icon(Icons.check_circle, size: 18, color: Color(0xFF0E5678)),
              ],
            ),
            const SizedBox(height: 10),
            Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w900, color: selected ? const Color(0xFF0E5678) : const Color(0xFF2D3C43), fontSize: 13)),
            const SizedBox(height: 4),
            Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF6D8A96), fontSize: 11.5)),
          ],
        ),
      ),
    );
  }
}

class _GenderChoice extends StatelessWidget {
  const _GenderChoice({required this.label, required this.icon, required this.selected, required this.onTap});

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFEAF4FA) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? const Color(0xFF0E5678) : const Color(0xFFD7E3E8), width: selected ? 1.5 : 1),
        ),
        child: Row(
          children: [
            Icon(icon, color: selected ? const Color(0xFF0E5678) : const Color(0xFF6D8A96)),
            const SizedBox(width: 8),
            Expanded(child: Text(label, style: TextStyle(fontWeight: FontWeight.w800, color: selected ? const Color(0xFF0E5678) : const Color(0xFF6D8A96)))),
            if (selected) const Icon(Icons.check_circle, size: 18, color: Color(0xFF0E5678)),
          ],
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
      children: rules.map((rule) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: rule.isValid ? const Color(0xFFE9F8EF) : const Color(0xFFFFF3F1),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(rule.isValid ? Icons.check_circle : Icons.radio_button_unchecked, size: 14, color: rule.isValid ? const Color(0xFF20B95B) : Colors.red.shade400),
            const SizedBox(width: 5),
            Text(rule.label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: rule.isValid ? const Color(0xFF178A45) : Colors.red.shade600)),
          ],
        ),
      )).toList(),
    );
  }
}
