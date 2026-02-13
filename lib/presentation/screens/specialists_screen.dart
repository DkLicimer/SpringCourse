import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../widgets/bento_card.dart';

class SpecialistsScreen extends StatelessWidget {
  const SpecialistsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Исполнители", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Горизонтальный выбор категорий (как на макете)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: ["Отделочники", "Электрики", "Сантехники", "Маляры"]
                  .map((cat) => Container(
                margin: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(cat),
                  selected: cat == "Отделочники",
                  selectedColor: RemoColors.red,
                  onSelected: (val) {},
                ),
              ))
                  .toList(),
            ),
          ),

          // Список специалистов
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 3,
              itemBuilder: (context, index) {
                final names = ["Алексей", "Азис", "Сергей"];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: BentoCard(
                    child: Row(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey[800],
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: const Icon(Icons.person, size: 40, color: Colors.white24),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(names[index], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const Text("Плиточники, Сантехники", style: TextStyle(color: RemoColors.textSecondary, fontSize: 12)),
                              const SizedBox(height: 8),
                              const Text("Бригада: 2-3 чел.", style: TextStyle(fontSize: 11)),
                              const Text("Забайкальский к-й, Чита", style: TextStyle(fontSize: 11, color: Colors.white54)),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text("3 000 р/м2", style: TextStyle(color: RemoColors.red, fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 10),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: RemoColors.red,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                              ),
                              onPressed: () {},
                              child: const Text("Написать", style: TextStyle(fontSize: 12)),
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
          )
        ],
      ),
    );
  }
}