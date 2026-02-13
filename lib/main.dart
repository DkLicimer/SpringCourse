import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'presentation/screens/main_screen.dart';

void main() {
  runApp(const RemoApp());
}

class RemoApp extends StatelessWidget {
  const RemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Remo.ru',
      theme: RemoTheme.darkTheme,
      home: const MainScreen(),
    );
  }
}