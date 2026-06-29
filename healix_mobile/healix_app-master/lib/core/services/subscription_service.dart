import 'dart:convert';

import 'api_service.dart';

class SubscriptionService {
  SubscriptionService._();

  static Future<Map<String, dynamic>?> getMyRequest() async {
    final res = await ApiService.get('/subscriptions/my-request');
    if (res.statusCode != 200) return null;
    final decoded = jsonDecode(res.body) as Map<String, dynamic>;
    final data = decoded['data'];
    return data is Map ? Map<String, dynamic>.from(data) : null;
  }

  static Future<bool> requestUpgrade(String tier, {String? doctorUsername}) async {
    final body = <String, dynamic>{
      'requested_tier': tier,
      'doctor_username': doctorUsername,
    };
    final res = await ApiService.post('/subscriptions/request', body: body);
    return res.statusCode == 200 || res.statusCode == 201;
  }
}
