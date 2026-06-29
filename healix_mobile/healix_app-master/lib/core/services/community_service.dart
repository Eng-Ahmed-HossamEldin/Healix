import 'dart:convert';
import 'package:healix_app/core/services/api_service.dart';

class CommunityService {
  // Habits
  static Future<List<dynamic>> getHabits() async {
    final res = await ApiService.get('/community/habits');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  static Future<bool> createHabit(Map<String, dynamic> data) async {
    final res = await ApiService.post('/community/habits', body: data);
    return res.statusCode == 200 || res.statusCode == 201;
  }

  static Future<bool> deleteHabit(String id) async {
    final res = await ApiService.delete('/community/habits/$id');
    return res.statusCode == 200;
  }

  static Future<bool> completeHabit(String id) async {
    final res = await ApiService.post('/community/habits/$id/complete');
    return res.statusCode == 200;
  }

  static Future<bool> uncompleteHabit(String id) async {
    final res = await ApiService.delete('/community/habits/$id/complete');
    return res.statusCode == 200;
  }

  // Fasting
  static Future<Map<String, dynamic>?> getActiveFast() async {
    final res = await ApiService.get('/community/fasting/active');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'];
    return null;
  }

  static Future<List<dynamic>> getFastHistory() async {
    final res = await ApiService.get('/community/fasting/history');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  static Future<bool> startFast(Map<String, dynamic> data) async {
    final res = await ApiService.post('/community/fasting/start', body: data);
    return res.statusCode == 200 || res.statusCode == 201;
  }

  static Future<bool> endFast() async {
    final res = await ApiService.post('/community/fasting/end');
    return res.statusCode == 200;
  }

  // Social
  static Future<List<dynamic>> getPosts() async {
    final res = await ApiService.get('/community/posts');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  static Future<bool> createPost(Map<String, dynamic> data) async {
    final res = await ApiService.post('/community/posts', body: data);
    return res.statusCode == 200 || res.statusCode == 201;
  }

  static Future<bool> likePost(String id) async {
    final res = await ApiService.post('/community/posts/$id/like');
    return res.statusCode == 200;
  }

  // Challenges
  static Future<List<dynamic>> getChallenges() async {
    final res = await ApiService.get('/community/challenges');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }

  static Future<bool> joinChallenge(String id) async {
    final res = await ApiService.post('/community/challenges/$id/join');
    return res.statusCode == 200;
  }

  static Future<List<dynamic>> getMyChallenges() async {
    final res = await ApiService.get('/community/challenges/my');
    if (res.statusCode == 200) return jsonDecode(res.body)['data'] ?? [];
    return [];
  }
}
