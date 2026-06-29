import 'dart:convert';
import 'package:healix_app/core/services/api_service.dart';

class AgentService {
  static Future<Map<String, dynamic>?> getTokens() async {
    try {
      final res = await ApiService.get('/agent/tokens');
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return null;
  }

  static Future<List<dynamic>> getHistory() async {
    try {
      final res = await ApiService.get('/agent/history');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          return data['data'] ?? [];
        }
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> clearHistory() async {
    try {
      final res = await ApiService.delete('/agent/history');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['success'] == true;
      }
    } catch (_) {}
    return false;
  }

  static Future<Map<String, dynamic>?> chat(String message) async {
    try {
      final res = await ApiService.post('/agent/chat', body: {'message': message});
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return null;
  }

  static Future<Map<String, dynamic>?> generateMealPlan() async {
    try {
      final res = await ApiService.post('/agent/generate-meal-plan');
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return null;
  }

  static Future<Map<String, dynamic>?> generateExercisePlan() async {
    try {
      final res = await ApiService.post('/agent/generate-exercise-plan');
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return null;
  }
}
