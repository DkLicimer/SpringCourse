import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../widgets/bento_card.dart';

class ObjectParamsScreen extends StatefulWidget {
  const ObjectParamsScreen({super.key});

  @override
  State<ObjectParamsScreen> createState() => _ObjectParamsScreenState();
}

class _ObjectParamsScreenState extends State<ObjectParamsScreen> {
  final TextEditingController _areaController = TextEditingController(text: "64.5");
  bool _showWarning = false;

  void _onAreaChanged(String value) {
    if (value != "64.5") {
      setState(() => _showWarning = true);
    } else {
      setState(() => _showWarning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Параметры объекта")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            BentoCard(
              child: Column(
                children: [
                  const Text("Площадь по полу (м2)", style: TextStyle(color: RemoColors.textSecondary)),
                  TextField(
                    controller: _areaController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                    onChanged: _onAreaChanged,
                    decoration: const InputDecoration(border: InputBorder.none),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (_showWarning)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: RemoColors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: RemoColors.red),
                ),
                child: Column(
                  children: [
                    const Text(
                      "Внимание! Изменение площади требует подписания дополнительного соглашения к договору №1.",
                      style: TextStyle(color: RemoColors.red, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: RemoColors.red),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Доп. соглашение сформировано и отправлено в Чат")),
                        );
                      },
                      child: const Text("Сформировать документ"),
                    )
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}