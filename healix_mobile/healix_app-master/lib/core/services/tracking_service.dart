import 'dart:convert';
import 'package:healix_app/core/services/api_service.dart';

class TrackingService {
  static String _today() => DateTime.now().toIso8601String().split('T').first;

  static Future<Map<String, dynamic>?> getSummary({String? date}) async {
    final res = await ApiService.get('/tracking/summary?date=${date ?? _today()}');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return null;
  }

  // Food
  static Future<List<dynamic>> getFoodLog({String? date}) async {
    final res = await ApiService.get('/tracking/food-log?date=${date ?? _today()}');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return [];
  }

  static Future<bool> addFoodLog(Map<String, dynamic> data) async {
    final res = await ApiService.post('/tracking/food-log', body: data);
    return res.statusCode == 200 || res.statusCode == 201;
  }

  static Future<bool> deleteFoodLog(String id) async {
    final res = await ApiService.delete('/tracking/food-log/$id');
    return res.statusCode == 200;
  }

  // Weight
  static Future<List<dynamic>> getWeight({int limit = 30}) async {
    final res = await ApiService.get('/tracking/weight?limit=$limit');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return [];
  }

  static Future<bool> addWeight(double weightKg) async {
    final res = await ApiService.post('/tracking/weight', body: {'weight_kg': weightKg});
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // Water
  static Future<Map<String, dynamic>?> getWater() async {
    final res = await ApiService.get('/tracking/water');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return null;
  }

  static Future<bool> logWater(int cups) async {
    final res = await ApiService.post('/tracking/water', body: {'cups': cups});
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // Sleep
  static Future<List<dynamic>> getSleep({int limit = 7}) async {
    final res = await ApiService.get('/tracking/sleep?limit=$limit');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return [];
  }

  static Future<bool> addSleep(double hours) async {
    final res = await ApiService.post('/tracking/sleep', body: {'hours': hours});
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // Steps
  static Future<List<dynamic>> getSteps() async {
    final res = await ApiService.get('/tracking/steps');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  static Future<bool> logSteps(int steps) async {
    final res = await ApiService.post('/tracking/steps', body: {'steps': steps});
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // Exercise
  static Future<List<dynamic>> getExercise({String? date}) async {
    final res = await ApiService.get('/tracking/exercise?date=${date ?? _today()}');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return [];
  }

  static Future<bool> addExercise(Map<String, dynamic> data) async {
    final res = await ApiService.post('/tracking/exercise', body: data);
    return res.statusCode == 200 || res.statusCode == 201;
  }

  static Future<bool> deleteExercise(String id) async {
    final res = await ApiService.delete('/tracking/exercise/$id');
    return res.statusCode == 200;
  }
}
