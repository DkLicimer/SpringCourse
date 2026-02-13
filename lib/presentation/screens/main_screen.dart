import 'package:flutter/material.dart';
import '../widgets/bento_card.dart';
import '../../core/theme.dart';

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
              // Шапка
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Иван", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                  const CircleAvatar(backgroundColor: RemoColors.red, child: Icon(Icons.person, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 20),

              // Поиск
              TextField(
                decoration: InputDecoration(
                  hintText: "Поиск",
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: RemoColors.cardBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 20),

              // Bento Grid (Финансы и Создание ТЗ)
              Row(
                children: [
                  Expanded(
                    flex: 1,
                    child: BentoCard(
                      child: Column(
                        children: [
                          const Text("Финансы", style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 10),
                          // Здесь будет кольцевая диаграмма
                          SizedBox(
                            height: 80,
                            width: 80,
                            child: CircularProgressIndicator(value: 0.55, strokeWidth: 8, color: Colors.green, backgroundColor: RemoColors.red.withOpacity(0.2)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 1,
                    child: BentoCard(
                      color: RemoColors.red,
                      child: const Column(
                        children: [
                          Text("Составить заявку", style: TextStyle(fontWeight: FontWeight.bold)),
                          Spacer(),
                          Icon(Icons.add_circle_outline, size: 40),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Карточка Объекта (Широкая)
              BentoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Наименование Объекта №1", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Text("г. Чита, ул. Ленина, д.1, кв.1"),
                    const Divider(height: 30),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildObjectStat("Тех.параметры", "Площади"),
                        _buildObjectStat("Документы", "Договор"),
                        _buildObjectStat("График", "Оштукатуривание"),
                      ],
                    )
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildObjectStat(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 12, color: RemoColors.textSecondary)),
        Text(subtitle, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildBottomNav() {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      backgroundColor: RemoColors.background,
      selectedItemColor: RemoColors.red,
      unselectedItemColor: RemoColors.textSecondary,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: ""),
        BottomNavigationBarItem(icon: Icon(Icons.engineering), label: ""),
        BottomNavigationBarItem(icon: Icon(Icons.layers), label: ""),
        BottomNavigationBarItem(icon: Icon(Icons.handyman), label: ""),
        BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: "GO!"),
      ],
    );
  }
}