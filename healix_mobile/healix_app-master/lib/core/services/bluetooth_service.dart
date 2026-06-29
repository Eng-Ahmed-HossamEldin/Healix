class BluetoothService {
  static Future<bool> openBluetoothSettings() async {
    // Bluetooth settings cannot be opened directly from web apps
    return false;
  }
}
