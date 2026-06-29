import 'package:flutter/material.dart';

class HealixColors {
  static const Color navy = Color(0xFF243996);
  static const Color navyDark = Color(0xFF19275F);
  static const Color navyLight = Color(0xFF3D5AC4);
  static const Color green = Color(0xFF65CD45);
  static const Color greenLight = Color(0xFF91DF66);
  static const Color mint = Color(0xFFE6F6C8);
  static const Color teal = Color(0xFF4DC3E8);
  static const Color orange = Color(0xFFFFD53A);
  static const Color blue = Color(0xFF2C4BB2);
  static const Color purple = Color(0xFF5870D4);
  static const Color red = Color(0xFFE14B4B);
  static const Color bg = Color(0xFFF8FBEF);
  static const Color card = Color(0xE0FFFFFF); // rgba(255,255,255,0.88)
  static const Color card2 = Color(0xFFEEF4DF);
  static const Color text = Color(0xFF1B2D68);
  static const Color sub = Color(0xFF6A79A0);
  static const Color border = Color(0x1F19275F); // rgba(25,39,95,0.12)
}

class AppTheme {
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: HealixColors.bg,
    colorScheme: ColorScheme.fromSeed(
      seedColor: HealixColors.navy,
      primary: HealixColors.navy,
      secondary: HealixColors.green,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: HealixColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: HealixColors.navyLight, width: 1.4),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: HealixColors.navy,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 54),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),
  );
}

