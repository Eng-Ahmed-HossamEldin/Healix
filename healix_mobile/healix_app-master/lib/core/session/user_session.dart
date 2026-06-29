import 'package:flutter/foundation.dart';

class UserSession {
  UserSession._();

  static final ValueNotifier<String> displayName =
      ValueNotifier<String>('User');

  static void setDisplayName(String? value) {
    final cleaned = value?.trim() ?? '';
    if (cleaned.isEmpty) return;
    displayName.value = cleaned;
  }

  static String initialsOf(String? value) {
    final cleaned = (value ?? '').trim();
    if (cleaned.isEmpty) return 'U';
    final parts = cleaned
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'U';
    if (parts.length == 1) {
      return parts.first.substring(0, parts.first.length >= 2 ? 2 : 1).toUpperCase();
    }
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  static String nameFromEmail(String email) {
    final base = email.split('@').first.replaceAll(RegExp(r'[._-]+'), ' ').trim();
    if (base.isEmpty) return 'User';
    final parts = base
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'User';
    final firstName = parts.first;
    return firstName[0].toUpperCase() + firstName.substring(1);
  }
}
