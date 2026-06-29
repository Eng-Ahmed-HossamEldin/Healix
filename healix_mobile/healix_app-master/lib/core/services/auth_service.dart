import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:healix_app/core/services/api_service.dart';
import 'package:healix_app/core/session/user_session.dart';
import 'package:healix_app/core/state/app_state.dart';

class PasswordRuleResult {
  const PasswordRuleResult({required this.label, required this.isValid});
  final String label;
  final bool isValid;
}

class AuthResult {
  const AuthResult({required this.success, required this.message});
  final bool success;
  final String message;
}

class AuthService {
  AuthService._();

  static const String _rememberPrefsKey = 'healix_remember_me_v1';
  static const String _lastEmailPrefsKey = 'healix_last_email_v1';

  static final ValueNotifier<bool> rememberMe = ValueNotifier<bool>(false);

  static Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    rememberMe.value = prefs.getBool(_rememberPrefsKey) ?? false;
  }

  static Future<void> setRememberMe(bool value) async {
    rememberMe.value = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_rememberPrefsKey, value);
  }

  static Future<void> _saveLastEmail(String email) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastEmailPrefsKey, email.trim().toLowerCase());
  }

  static Future<String?> getLastEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_lastEmailPrefsKey);
  }

  static bool isValidEmail(String value) {
    final email = value.trim().toLowerCase();
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }

  static List<PasswordRuleResult> passwordRules(String password) {
    return <PasswordRuleResult>[
      PasswordRuleResult(label: 'At least 6 characters', isValid: password.length >= 6),
      PasswordRuleResult(label: 'One uppercase letter', isValid: RegExp(r'[A-Z]').hasMatch(password)),
      PasswordRuleResult(label: 'One lowercase letter', isValid: RegExp(r'[a-z]').hasMatch(password)),
      PasswordRuleResult(label: 'One number', isValid: RegExp(r'[0-9]').hasMatch(password)),
    ];
  }

  static bool isStrongPassword(String password) => passwordRules(password).every((rule) => rule.isValid);

  static String? passwordError(String password) {
    final missing = passwordRules(password).where((rule) => !rule.isValid).map((rule) => rule.label).toList();
    if (missing.isEmpty) return null;
    return 'Password must include: ${missing.join(', ')}';
  }

  static String? ageError(String value) {
    final age = int.tryParse(value.trim());
    if (age == null) return 'Enter your age.';
    if (age < 10 || age > 120) return 'Age must be between 10 and 120.';
    return null;
  }

  static String? heightError(String value) {
    final height = double.tryParse(value.trim());
    if (height == null) return 'Enter your height in cm.';
    if (height < 80 || height > 250) return 'Height must be between 80 and 250 cm.';
    return null;
  }

  static String? weightError(String value) {
    final weight = double.tryParse(value.trim());
    if (weight == null) return 'Enter your weight in kg.';
    if (weight < 20 || weight > 350) return 'Weight must be between 20 and 350 kg.';
    return null;
  }

  static String? genderError(String value) {
    final gender = value.trim();
    if (gender != 'Male' && gender != 'Female') return 'Please select Male or Female.';
    return null;
  }

  static Future<AuthResult> signIn(String email, String password) async {
    final normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return const AuthResult(success: false, message: 'Enter a valid email address.');
    }
    if (password.isEmpty) {
      return const AuthResult(success: false, message: 'Enter your password.');
    }

    try {
      final response = await ApiService.post('/auth/login', body: {
        'loginId': normalizedEmail,
        'password': password,
        'role': 'user'
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['data']['token'];
        final username = data['data']['username'];
        
        await ApiService.setToken(token);
        UserSession.setDisplayName(username);
        
        // Let AppState initialize data from backend
        await appState.login(username, normalizedEmail);
        await _saveLastEmail(normalizedEmail);
        return const AuthResult(success: true, message: 'Signed in successfully.');
      } else {
        final data = jsonDecode(response.body);
        return AuthResult(success: false, message: data['message'] ?? 'Login failed.');
      }
    } catch (e) {
      return AuthResult(success: false, message: 'Network error: Could not connect to server.');
    }
  }

  static Future<AuthResult> signUp({
    required String name,
    required String email,
    required String password,
    required String age,
    required String gender,
    required String heightCm,
    required String weightKg,
    required String goal,
  }) async {
    final cleanedName = name.trim();
    final normalizedEmail = email.trim().toLowerCase();
    final cleanedGender = gender.trim();
    final parsedAge = int.tryParse(age.trim());
    final parsedHeight = double.tryParse(heightCm.trim());
    final parsedWeight = double.tryParse(weightKg.trim());

    if (cleanedName.length < 2) return const AuthResult(success: false, message: 'Enter your full name.');
    if (!isValidEmail(normalizedEmail)) return const AuthResult(success: false, message: 'Enter a valid email address.');

    final ageValidation = ageError(age);
    if (ageValidation != null) return AuthResult(success: false, message: ageValidation);
    final genderValidation = genderError(cleanedGender);
    if (genderValidation != null) return AuthResult(success: false, message: genderValidation);

    final heightValidation = heightError(heightCm);
    if (heightValidation != null) return AuthResult(success: false, message: heightValidation);
    final weightValidation = weightError(weightKg);
    if (weightValidation != null) return AuthResult(success: false, message: weightValidation);
    if (!isStrongPassword(password)) return AuthResult(success: false, message: passwordError(password) ?? 'Weak password.');

    final parts = cleanedName.split(' ');
    final firstName = parts.first;
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';
    final username = normalizedEmail.split('@').first + DateTime.now().millisecondsSinceEpoch.toString().substring(8);

    try {
      final response = await ApiService.post('/auth/register/user', body: {
        'user_username': username,
        'email': normalizedEmail,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'gender': cleanedGender,
        // DOB calculation mock
        'dob': DateTime.now().subtract(Duration(days: parsedAge! * 365)).toIso8601String().split('T').first,
      });

      if (response.statusCode == 201) {
        // Automatically sign in after sign up
        final signInResult = await signIn(normalizedEmail, password);
        if (signInResult.success) {
          // Now push health requirements (height, weight, goal) to the backend
          try {
            await ApiService.post('/requirements/me', body: {
              'height_cm': parsedHeight,
              'weight_kg': parsedWeight,
              'target_weight_kg': parsedWeight, // default to current weight; user can update in goals
              'goal': goal,
              'activity_rate': 1.2, // sedentary default
              'medical_condition': 'None',
            });
          } catch (_) {}
        }
        return signInResult;
      } else {
        final data = jsonDecode(response.body);
        return AuthResult(success: false, message: data['message'] ?? 'Registration failed.');
      }
    } catch (e) {
      return AuthResult(success: false, message: 'Network error: Could not connect to server.');
    }
  }

  static Future<void> signOut() async {
    await setRememberMe(false);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_lastEmailPrefsKey);
    await ApiService.clearToken();
    await appState.signOut();
    UserSession.setDisplayName('User');
  }

  static bool canResetPassword(String email) => isValidEmail(email.trim());
}

