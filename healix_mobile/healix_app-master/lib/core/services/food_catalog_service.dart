import 'dart:convert';

import 'api_service.dart';

class FoodCatalogService {
  FoodCatalogService._();

  /// Search foods from the backend catalog.
  /// Returns an empty list (never throws) so callers can check [searchFoodsOrError].
  static Future<List<Map<String, dynamic>>> searchFoods(String query) async {
    final res = await ApiService.get('/foods?search=${Uri.encodeComponent(query)}');
    if (res.statusCode != 200) {
      throw Exception('Food search failed (HTTP ${res.statusCode})');
    }
    return _decodeList(res.body);
  }

  /// Search exercises from the backend content catalog.
  static Future<List<Map<String, dynamic>>> searchExercises() async {
    final res = await ApiService.get('/content/exercises');
    if (res.statusCode != 200) {
      throw Exception('Exercise catalog failed (HTTP ${res.statusCode})');
    }
    return _decodeList(res.body);
  }

  /// Fetch all recipes from the backend content catalog.
  static Future<List<Map<String, dynamic>>> searchRecipes() async {
    final res = await ApiService.get('/content/recipes');
    if (res.statusCode != 200) {
      throw Exception('Recipe catalog failed (HTTP ${res.statusCode})');
    }
    return _decodeList(res.body);
  }

  static Future<int?> createFood({
    required String foodName,
    required String category,
    required String servingSize,
  }) async {
    final res = await ApiService.post('/foods', body: {
      'food_name': foodName,
      'category': category,
      'serving_size': servingSize,
    });
    if (res.statusCode != 200 && res.statusCode != 201) return null;
    final decoded = jsonDecode(res.body) as Map<String, dynamic>;
    return int.tryParse(decoded['data']?['food_id']?.toString() ?? '');
  }

  static Future<bool> saveNutrition(
    int foodId, {
    required int calories,
    required int protein,
    required int carbs,
    required int fat,
  }) async {
    final res = await ApiService.post('/foods/$foodId/nutrition', body: {
      'calories': calories,
      'protein_g': protein,
      'total_carbs_g': carbs,
      'total_fat_g': fat,
    });
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // ── Field accessors (null-safe) ──────────────────────────────────────────────

  static String nameOf(Map<String, dynamic> food) =>
      (food['food_name'] ?? food['name'] ?? food['exercise_name'] ?? food['title'] ?? 'Item').toString();

  static int caloriesOf(Map<String, dynamic> food) => _intOf(food['calories']);
  static int proteinOf(Map<String, dynamic> food) => _intOf(food['protein_g']);
  static int carbsOf(Map<String, dynamic> food) =>
      _intOf(food['total_carbs_g'] ?? food['carbs_g']);
  static int fatOf(Map<String, dynamic> food) =>
      _intOf(food['total_fat_g'] ?? food['fat_g']);

  /// For exercise items from content catalog
  static String categoryOf(Map<String, dynamic> item) =>
      (item['category'] ?? item['type'] ?? '').toString();
  static int durationOf(Map<String, dynamic> item) =>
      _intOf(item['duration_min'] ?? item['duration']);

  // ── Internal helpers ─────────────────────────────────────────────────────────

  static List<Map<String, dynamic>> _decodeList(String body) {
    final decoded = jsonDecode(body) as Map<String, dynamic>;
    final data = decoded['data'];
    if (data is! List) return <Map<String, dynamic>>[];
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  static int _intOf(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.round();
    final d = double.tryParse(value.toString());
    if (d != null) return d.round();
    return int.tryParse(value.toString()) ?? 0;
  }
}
