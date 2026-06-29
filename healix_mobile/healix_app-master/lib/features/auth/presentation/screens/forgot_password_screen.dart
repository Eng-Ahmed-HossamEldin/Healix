import 'package:flutter/material.dart';
import 'package:healix_app/core/services/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final TextEditingController emailController = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  void _sendResetLink() {
    final email = emailController.text.trim();
    if (!AuthService.canResetPassword(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: const Text('Enter a valid email address.'), backgroundColor: Colors.red.shade700),
      );
      return;
    }
    setState(() => _sent = true);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Reset password link sent to $email')));
    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) Navigator.pop(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Forgot Password')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Reset your password', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF0E5678))),
                const SizedBox(height: 12),
                const Text('Enter your email address and we will send you a reset link.', style: TextStyle(color: Color(0xFF6D8A96), fontSize: 15)),
                const SizedBox(height: 24),
                const Text('Email', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0E5678))),
                const SizedBox(height: 10),
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _sendResetLink(),
                  decoration: const InputDecoration(hintText: 'your.email@example.com', prefixIcon: Icon(Icons.email_outlined)),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _sent ? null : _sendResetLink,
                  child: Text(_sent ? 'Link sent' : 'Send reset link', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
