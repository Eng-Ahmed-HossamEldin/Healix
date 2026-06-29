import 'package:local_auth/local_auth.dart';

class BiometricLoginResult {
  const BiometricLoginResult({required this.success, required this.message});
  final bool success;
  final String message;
}

class BiometricService {
  BiometricService._();

  static final LocalAuthentication _auth = LocalAuthentication();

  static Future<BiometricLoginResult> authenticate(String method) async {
    try {
      final supported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;
      if (!supported || !canCheck) {
        return const BiometricLoginResult(
          success: false,
          message: 'Biometric login is not available on this device. Add fingerprint/face unlock first.',
        );
      }
      final ok = await _auth.authenticate(
        localizedReason: 'Use $method to sign in to Healix',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
          useErrorDialogs: true,
        ),
      );
      return BiometricLoginResult(success: ok, message: ok ? '$method verified successfully.' : '$method was cancelled.');
    } catch (error) {
      return BiometricLoginResult(success: false, message: 'Biometric login failed: $error');
    }
  }
}
