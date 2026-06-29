import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_config.dart';

class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  IO.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void connect(String username) {
    if (_socket != null && _socket!.connected) return;

    final url = ApiConfig.socketUrl;
    print('Connecting to Socket.io server: $url for user $username');

    _socket = IO.io(
      url,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      print('Socket.io connected successfully');
      _isConnected = true;
      joinNotifications(username);
    });

    _socket!.onDisconnect((_) {
      print('Socket.io disconnected');
      _isConnected = false;
    });

    _socket!.onConnectError((err) {
      print('Socket.io connect error: $err');
    });

    _socket!.connect();
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.close();
      _socket = null;
      _isConnected = false;
    }
  }

  void joinNotifications(String username) {
    if (_socket == null || !_socket!.connected) return;
    print('Joining notifications room for $username');
    _socket!.emit('join_notifications', username);
  }

  void joinChat(String myUsername, String partnerUsername) {
    if (_socket == null || !_socket!.connected) return;
    print('Joining chat room between $myUsername and $partnerUsername');
    _socket!.emit('join_chat', {
      'myUsername': myUsername,
      'partnerUsername': partnerUsername,
    });
  }

  void sendMessage({
    required String senderUsername,
    required String receiverUsername,
    required String message,
  }) {
    if (_socket == null || !_socket!.connected) return;
    print('Sending message to $receiverUsername');
    _socket!.emit('send_message', {
      'sender_username': senderUsername,
      'receiver_username': receiverUsername,
      'message': message,
    });
  }

  void onMessage(Function(Map<String, dynamic>) callback) {
    if (_socket == null) return;
    _socket!.off('receive_message');
    _socket!.on('receive_message', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      } else {
        // sometimes data is passed as standard Map or castable object
        callback(Map<String, dynamic>.from(data));
      }
    });
  }

  void offMessage() {
    if (_socket != null) {
      _socket!.off('receive_message');
    }
  }

  void onNotification(Function(Map<String, dynamic>) callback) {
    if (_socket == null) return;
    _socket!.off('receive_notification');
    _socket!.on('receive_notification', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      } else {
        callback(Map<String, dynamic>.from(data));
      }
    });
  }

  void offNotification() {
    if (_socket != null) {
      _socket!.off('receive_notification');
    }
  }
}
