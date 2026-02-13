import 'package:flutter/material.dart';
import '../../core/theme.dart';

class BentoCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? color;

  const BentoCard({super.key, required this.child, this.padding, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color ?? RemoColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
      ),
      child: child,
    );
  }
}