import 'package:flutter/material.dart';
import 'chat_list_screen.dart';
import 'main_screen.dart';
import 'specialists_screen.dart';
import 'marketplace_screen.dart';
import '../../core/theme.dart';

class NavigationHub extends StatefulWidget {
  const NavigationHub({super.key});

  @override
  State<NavigationHub> createState() => _NavigationHubState();
}

class _NavigationHubState extends State<NavigationHub> {
  int _currentIndex = 0;

  // Список всех главных экранов
  final List<Widget> _screens = [
    const MainScreen(),
    const SpecialistsScreen(),
    const MarketplaceScreen(),
    const Center(child: Text("Аренда (в разработке)")),
    const ChatListScreen(), // ТЕПЕРЬ ТУТ ЧАТ
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // IndexedStack сохраняет состояние экранов (скролл не сбрасывается)
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: RemoColors.background,
        selectedItemColor: RemoColors.red,
        unselectedItemColor: RemoColors.textSecondary,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: "Главная"),
          BottomNavigationBarItem(icon: Icon(Icons.engineering), label: "Мастера"),
          BottomNavigationBarItem(icon: Icon(Icons.layers), label: "Маркет"),
          BottomNavigationBarItem(icon: Icon(Icons.handyman), label: "Аренда"),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: "GO!"),
        ],
      ),
    );
  }
}