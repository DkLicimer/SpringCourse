import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../widgets/bento_card.dart';

class ChatDetailScreen extends StatelessWidget {
  final Map<String, String> chat;
  const ChatDetailScreen({super.key, required this.chat});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(chat['name']!)),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildMessage("Добрый день! Сформировал счет на черновые материалы.", false),
                const SizedBox(height: 16),

                // ИНТЕРАКТИВНОЕ СООБЩЕНИЕ (Счет на оплату)
                BentoCard(
                  color: RemoColors.cardBackground,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.description, color: RemoColors.red),
                          SizedBox(width: 8),
                          Text("Счет №142 — Материалы", style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text("Сумма к оплате: 45 600 ₽", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const Text("Черновой этап: шпаклевка, грунтовка", style: TextStyle(color: RemoColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: RemoColors.red),
                          onPressed: () => _showPaymentSuccess(context),
                          child: const Text("Оплатить счет"),
                        ),
                      )
                    ],
                  ),
                ),

                _buildMessage("Оплатил, проверьте поступление.", true),
              ],
            ),
          ),

          // Поле ввода
          Container(
            padding: const EdgeInsets.all(12),
            color: RemoColors.cardBackground,
            child: Row(
              children: [
                const Icon(Icons.add, color: RemoColors.red),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: "Сообщение...",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: RemoColors.background,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                const Icon(Icons.send, color: RemoColors.red),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessage(String text, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isMe ? RemoColors.red : Colors.grey[800],
          borderRadius: BorderRadius.circular(15),
        ),
        child: Text(text),
      ),
    );
  }

  void _showPaymentSuccess(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Оплата прошла успешно! Деньги в Escrow.")),
    );
  }
}