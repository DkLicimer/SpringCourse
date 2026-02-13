import '../../domain/models/construction_object.dart';

final mockObject = ConstructionObject(
    id: '1',
    name: 'Объект №1',
    address: 'г. Чита, ул. Ленина, д.1, кв1.',
    status: 'Черновой этап',
    square: 64.5,
    progress: 0.35, // 35%
    budget: {
      'total': 1000000,
      'invested': 550000,
      'spent': 230000,
    }, title: '', totalBudget: null, invested: null, spent: null
);