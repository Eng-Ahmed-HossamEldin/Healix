import 'dart:convert';
import 'package:healix_app/core/services/api_service.dart';

class PlansService {
  // Meal Plans
  static Future<List<dynamic>> getMyPlans() async {
    final res = await ApiService.get('/plans/my-plans');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  static Future<Map<String, dynamic>?> getPlan(String id) async {
    final res = await ApiService.get('/plans/$id');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return null;
  }

  static Future<List<dynamic>> getMealItems(String mealId) async {
    final res = await ApiService.get('/plans/meals/$mealId/items');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  // Exercise Plans
  static Future<List<dynamic>> getMyExercisePlans() async {
    final res = await ApiService.get('/plans/my-exercise-plans');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  static Future<Map<String, dynamic>?> getExercisePlanById(String id) async {
    final res = await ApiService.get('/plans/exercise-plans/$id');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return null;
  }
}
