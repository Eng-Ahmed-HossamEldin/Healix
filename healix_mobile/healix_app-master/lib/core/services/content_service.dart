import 'dart:convert';

import 'api_service.dart';

class ContentService {
  ContentService._();

  static Future<List<Map<String, dynamic>>> getRecipes() async {
    final res = await ApiService.get('/content/recipes');
    if (res.statusCode != 200) {
      throw Exception('Recipes failed to load');
    }
    return _decodeList(res.body);
  }

  static Future<List<Map<String, dynamic>>> getExercises() async {
    final res = await ApiService.get('/content/exercises');
    if (res.statusCode != 200) {
      throw Exception('Exercises failed to load');
    }
    return _decodeList(res.body);
  }

  static List<Map<String, dynamic>> _decodeList(String body) {
    final decoded = jsonDecode(body) as Map<String, dynamic>;
    final data = decoded['data'];
    if (data is! List) return <Map<String, dynamic>>[];
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }
}
