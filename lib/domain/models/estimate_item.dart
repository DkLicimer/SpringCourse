class EstimateItem {
  final String title;
  final String unit; // м2, пог.м, шт
  final double count;
  final double price;

  EstimateItem({required this.title, required this.unit, required this.count, required this.price});

  double get total => count * price;
}