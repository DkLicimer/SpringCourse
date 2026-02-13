import 'package:flutter/material.dart';
import '../widgets/bento_card.dart';
import '../widgets/budget_ring_chart.dart';
import '../../core/theme.dart';
import '../../data/mocks/mock_data.dart';
import 'estimate_screen.dart';
import 'object_params_screen.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Приветствие
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Иван", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                  const Text("REMO.RU", style: TextStyle(color: RemoColors.red, fontWeight: FontWeight.w900)),
                ],
              ),
              const SizedBox(height: 16),

              // 2. Горизонтальные сторис (Полезная информация)
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: 5,
                  itemBuilder: (context, index) => Container(
                    width: 80,
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(
                      border: Border.all(color: RemoColors.red, width: 2),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: const Center(child: Text("полезная\nинфо", textAlign: TextAlign.center, style: TextStyle(fontSize: 10))),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 3. Поиск
              TextField(
                decoration: InputDecoration(
                  hintText: "Поиск",
                  prefixIcon: const Icon(Icons.search, color: Colors.white54),
                  filled: true,
                  fillColor: RemoColors.cardBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 20),

              // 4. Блок Финансы и Кнопка Заявки
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: BentoCard(
                      child: Column(
                        children: [
                          const Text("Финансы", style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          BudgetRingChart(
                            total: mockObject.totalBudget,
                            invested: mockObject.invested,
                            spent: mockObject.spent,
                          ),
                          const SizedBox(height: 12),
                          _buildMiniStat("Общая:", "${mockObject.totalBudget.toInt()} р."),
                          _buildMiniStat("Внесено:", "${mockObject.invested.toInt()} р.", Colors.green),
                          _buildMiniStat("Потрачено:", "${mockObject.spent.toInt()} р.", RemoColors.red),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      children: [
                        BentoCard(
                          color: RemoColors.red,
                          child: const Column(
                            children: [
                              Text("Составить заявку", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                              SizedBox(height: 20),
                              Icon(Icons.edit_document, size: 30, color: Colors.white),
                              SizedBox(height: 10),
                              Text("Конструктор ТЗ", style: TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const BentoCard(
                          child: Text("Вызов специалиста", textAlign: TextAlign.center, style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 5. Рекламный баннер
              BentoCard(
                color: Colors.blueAccent.withOpacity(0.5),
                child: const SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: Center(child: Text("Реклама товаров и специалистов", style: TextStyle(fontWeight: FontWeight.bold))),
                ),
              ),
              const SizedBox(height: 12),

              // 6. Карточка Объекта
              BentoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(mockObject.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text(mockObject.address, style: const TextStyle(color: RemoColors.textSecondary)),
                    const Divider(height: 30, color: Colors.white10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildObjectStat(context, "Тех.параметры", "${mockObject.square} м2", const ObjectParamsScreen()),
                        _buildObjectStat(context, "Документы", "Договор", const EstimateScreen()), // Пока ведет в смету
                        _buildObjectStat(context, "График", "Черновой этап", const EstimateScreen()),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Center(child: Icon(Icons.add_circle_outline, color: RemoColors.textSecondary)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, [Color? color]) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 9, color: RemoColors.textSecondary)),
          Text(value, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color ?? Colors.white)),
        ],
      ),
    );
  }

  Widget _buildObjectStat(BuildContext context, String title, String subtitle, Widget targetScreen) {
    return InkWell(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => targetScreen)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 10, color: RemoColors.textSecondary)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}