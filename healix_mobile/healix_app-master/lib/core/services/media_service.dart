import 'package:image_picker/image_picker.dart';

class MediaPickResult {
  const MediaPickResult({required this.success, required this.message, this.path});

  final bool success;
  final String message;
  final String? path;
}

class MediaService {
  MediaService._();

  static final ImagePicker _picker = ImagePicker();

  static Future<MediaPickResult> pickFromCamera({String actionName = 'photo'}) async {
    try {
      final XFile? file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (file == null) {
        return MediaPickResult(success: false, message: 'Camera cancelled.');
      }
      return MediaPickResult(success: true, message: 'Camera $actionName captured successfully.', path: file.path);
    } catch (error) {
      return MediaPickResult(success: false, message: 'Camera is not available: $error');
    }
  }

  static Future<MediaPickResult> pickFromGallery({String actionName = 'photo'}) async {
    try {
      final XFile? file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (file == null) {
        return MediaPickResult(success: false, message: 'Gallery selection cancelled.');
      }
      return MediaPickResult(success: true, message: 'Gallery $actionName selected successfully.', path: file.path);
    } catch (error) {
      return MediaPickResult(success: false, message: 'Gallery is not available: $error');
    }
  }
}
