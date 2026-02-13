import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../domain/models/estimate_item.dart';

class EstimateScreen extends StatelessWidget {
  const EstimateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final sections = {
      "Черновые работы": [
        EstimateItem(title: "Демонтаж перегородок", unit: "м2", count: 45, price: 350),
        EstimateItem(title: "Штукатурка стен", unit: "м2", count: 120, price: 650),
      ],
      "Электрика": [
        EstimateItem(title: "Штробление бетона", unit: "пог.м", count: 50, price: 450),
        EstimateItem(title: "Установка подрозетника", unit: "шт", count: 25, price: 250),
      ],
    };

    return Scaffold(
      appBar: AppBar(title: const Text("Детальная смета")),
      body: ListView(
        children: [
          ...sections.entries.map((entry) => ExpansionTile(
            title: Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold)),
            children: entry.value.map((item) => ListTile(
              title: Text(item.title, style: const TextStyle(fontSize: 14)),
              subtitle: Text("${item.count} ${item.unit} x ${item.price} р."),
              trailing: Text("${item.total.toInt()} р.", style: const TextStyle(fontWeight: FontWeight.bold)),
            )).toList(),
          )),
          const Padding(
            padding: EdgeInsets.all(20),
            child: Divider(color: Colors.white24),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("ИТОГО ПО СМЕТЕ:", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text("245 000 р.", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: RemoColors.red)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}