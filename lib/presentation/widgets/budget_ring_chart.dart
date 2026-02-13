import 'dart:math';
import 'package:flutter/material.dart';
import '../../core/theme.dart';

class BudgetRingChart extends StatelessWidget {
  final double total;
  final double invested;
  final double spent;

  const BudgetRingChart({
    super.key,
    required this.total,
    required this.invested,
    required this.spent,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      width: 100,
      child: CustomPaint(
        painter: RingPainter(
          investedPercent: invested / total,
          spentPercent: spent / total,
        ),
      ),
    );
  }
}

class RingPainter extends CustomPainter {
  final double investedPercent;
  final double spentPercent;

  RingPainter({required this.investedPercent, required this.spentPercent});

  @override
  void paint(Canvas canvas, Size size) {
    double strokeWidth = 10;
    Rect rect = Offset.zero & size;
    Paint basePaint = Paint()
      ..color = Colors.white10
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    Paint investedPaint = Paint()
      ..color = Colors.green
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = strokeWidth;

    Paint spentPaint = Paint()
      ..color = RemoColors.red
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = strokeWidth;

    // Рисуем базу (серый круг)
    canvas.drawArc(rect, 0, 2 * pi, false, basePaint);

    // Рисуем внесенные деньги (зеленый)
    canvas.drawArc(rect, -pi / 2, 2 * pi * investedPercent, false, investedPaint);

    // Рисуем потраченные деньги (красный) поверх
    canvas.drawArc(rect, -pi / 2, 2 * pi * spentPercent, false, spentPaint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}