import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../widgets/bento_card.dart';

class MarketplaceScreen extends StatelessWidget {
  const MarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Материалы"),
        actions: [
          IconButton(icon: const Icon(Icons.shopping_cart_outlined), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          // Фильтры-теги (Обои, Краска, Плитка...)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: ["Обои", "Краска", "3D панели", "Плинтус", "Ламинат"]
                  .map((tag) => Container(
                margin: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(tag),
                  backgroundColor: RemoColors.cardBackground,
                  onPressed: () {},
                ),
              ))
                  .toList(),
            ),
          ),

          // Сетка товаров
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.68,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: 4,
              itemBuilder: (context, index) {
                return BentoCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Изображение товара
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[800],
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                          ),
                          child: const Center(child: Icon(Icons.wallpaper, size: 50, color: Colors.white10)),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Обои виниловые", style: TextStyle(fontSize: 14)),
                            const SizedBox(height: 4),
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("550 р/м2", style: TextStyle(fontWeight: FontWeight.bold)),
                                Text("много", style: TextStyle(fontSize: 10, color: Colors.green)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: RemoColors.red,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                onPressed: () {},
                                child: const Text("В корзину", style: TextStyle(fontSize: 12)),
                              ),
                            )
                          ],
                        ),
                      )
                    ],
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