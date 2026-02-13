import 'package:flutter/material.dart';
import '../../core/theme.dart';
import 'chat_detail_screen.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final chats = [
      {'name': 'Евгений', 'role': 'Прораб', 'msg': 'В пятницу сможем встретиться?', 'time': '28.01'},
      {'name': 'Арам', 'role': 'Студия мебели', 'msg': 'Шкаф готов, завтра отправим.', 'time': '28.01'},
      {'name': 'Юлия', 'role': 'Менеджер Remo.ru', 'msg': 'Всегда рада помочь!', 'time': '28.01'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text("Сообщения", style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView.separated(
        itemCount: chats.length,
        separatorBuilder: (context, index) => const Divider(color: Colors.white10, height: 1),
        itemBuilder: (context, index) {
          final chat = chats[index];
          return ListTile(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => ChatDetailScreen(chat: chat))),
            leading: CircleAvatar(
              backgroundColor: Colors.grey[800],
              child: const Icon(Icons.person, color: Colors.white54),
            ),
            title: Row(
              children: [
                Text(chat['name']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                Text(chat['role']!, style: const TextStyle(fontSize: 12, color: RemoColors.textSecondary)),
              ],
            ),
            subtitle: Text(chat['msg']!, maxLines: 1, overflow: TextOverflow.ellipsis),
            trailing: Text(chat['time']!, style: const TextStyle(fontSize: 12, color: RemoColors.textSecondary)),
          );
        },
      ),
    );
  }
}