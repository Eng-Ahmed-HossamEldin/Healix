import 'dart:convert';
import 'package:healix_app/core/services/api_service.dart';

class UserService {
  static Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final res = await ApiService.put(
        '/users/me/password',
        body: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return {'success': true, 'message': data['message'] ?? 'Password changed successfully'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Failed to change password'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
