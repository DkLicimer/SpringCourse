class ConstructionObject {
  final String id;
  final String title;
  final String address;
  final String status;
  final double totalBudget;
  final double invested;
  final double spent;

  ConstructionObject({
    required this.id, required this.title, required this.address,
    required this.status, required this.totalBudget,
    required this.invested, required this.spent,
  });
}