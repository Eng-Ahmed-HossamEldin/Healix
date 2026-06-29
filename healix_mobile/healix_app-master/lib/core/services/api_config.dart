import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:5000/api';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    } else {
      // iOS Simulator or Windows Desktop
      return 'http://127.0.0.1:5000/api';
    }
  }

  static String get socketUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:5000';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000';
    } else {
      // iOS Simulator or Windows Desktop
      return 'http://127.0.0.1:5000';
    }
  }
}
