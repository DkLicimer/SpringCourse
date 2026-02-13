import 'package:flutter/material.dart';

class RemoColors {
  static const Color red = Color(0xFFE31E24);
  static const Color background = Color(0xFF121212); // Темный фон как на макете
  static const Color cardBackground = Color(0xFF2C2C2E);
  static const Color textMain = Colors.white;
  static const Color textSecondary = Color(0xFF8E8E93);
  static const Color accentBlue = Color(0xFF0A84FF);
}

class RemoTheme {
  static ThemeData darkTheme = ThemeData.dark().copyWith(
    scaffoldBackgroundColor: RemoColors.background,
    primaryColor: RemoColors.red,
    cardColor: RemoColors.cardBackground,
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: RemoColors.textMain),
      bodyMedium: TextStyle(fontSize: 14, color: RemoColors.textSecondary),
    ),
  );
}