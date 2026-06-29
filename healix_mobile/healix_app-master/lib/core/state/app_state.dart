import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:healix_app/core/services/api_service.dart';
import 'package:healix_app/core/services/tracking_service.dart';
import 'package:healix_app/core/services/socket_service.dart';

final HealixAppState appState = HealixAppState.instance;

class HealixAppState extends ChangeNotifier {
  HealixAppState._() {
    _setupSocketNotificationListener();
  }
  static final HealixAppState instance = HealixAppState._();

  // Initialization state
  bool initLoaded = false;
  String? initError;

  String fullName = 'User';
  String email = '';
  String username = '';
  String subscriptionTier = 'default';
  String? assignedDoctorUsername;
  String? doctorRequestStatus;
  int age = 28;
  String gender = 'Male';
  double heightCm = 178;
  double weightKg = 75;
  String medicalCondition = 'None';
  double startWeightKg = 74.5;
  double targetWeightKg = 70;
  String activityLevel = 'Sedentary';
  String selectedGoal = 'Lose Weight';
  int goalDurationWeeks = 12;
  String phoneNo = '';
  String address = '';
  String job = '';
  String dob = '';

  int calorieGoal = 2000;
  int caloriesConsumed = 0;
  int caloriesBurned = 0;
  int proteinGoal = 150;
  int carbsGoal = 250;
  int fatGoal = 65;
  int protein = 0;
  int carbs = 0;
  int fat = 0;

  int stepsGoal = 10000;
  int steps = 0;
  int waterGoalMl = 2000;
  int waterMl = 0;
  double sleepGoalHours = 8.0;
  double sleepHours = 0.0;
  int stressLevel = 0;
  String stressMood = 'No entry yet';

  bool profilePhotoChanged = false;
  bool autoSyncEnabled = true;
  String analyticsRange = 'Last 6 Months';
  String analyticsFilter = 'All Metrics';
  DateTime? lastAnalyticsExportAt;
  DateTime? lastCarePlanExportAt;
  DateTime? lastCarePlanShareAt;
  bool fastingActive = true;
  int fastingWindowHours = 16;
  int eatingWindowHours = 8;
  DateTime fastingStartedAt = DateTime.now();
  DateTime? fastingPausedAt;
  final List<double> fastingHistory = <double>[];
  bool medicalInfoReviewed = false;
  int unreadSupportMessages = 0;

  final Map<String, bool> dietaryPreferences = <String, bool>{
    'Vegan': true,
    'Vegetarian': true,
    'Keto': false,
    'Paleo': false,
    'Gluten-Free': false,
    'Dairy-Free': true,
  };
  String selectedAllergy = 'Peanuts';
  String fastingProtocol = 'Not following a fasting protocol';
  String mealFrequency = '3 meals';

  final Set<String> connectedDevices = <String>{};
  final Set<String> joinedChallenges = <String>{};
  final Set<String> readNotifications = <String>{};

  final List<MealLog> meals = <MealLog>[];

  final List<WaterLog> waterLogs = <WaterLog>[];

  final List<WeightEntry> weightEntries = <WeightEntry>[];

  final List<StepLog> stepsHistory = <StepLog>[];

  final List<WorkoutLog> workouts = <WorkoutLog>[];

  final List<StressEntry> stressEntries = <StressEntry>[];

  final List<CommunityPost> communityPosts = <CommunityPost>[];

  final List<MedicalRecord> medicalRecords = <MedicalRecord>[];

  final List<IssueReport> issueReports = <IssueReport>[];

  final List<AppNotification> notifications = <AppNotification>[
    AppNotification(
      id: 'daily-tip',
      title: 'Daily tip is ready',
      subtitle: 'See today\'s personalized health insight and next step.',
      time: 'Now',
      icon: 'tips',
    ),
    AppNotification(
      id: 'steps-progress',
      title: 'Step goal reminder',
      subtitle: 'Start walking to build progress toward your daily goal.',
      time: '15m',
      icon: 'steps',
    ),
    AppNotification(
      id: 'challenge-update',
      title: 'Community challenge available',
      subtitle: 'Join a challenge to start earning points.',
      time: '1h',
      icon: 'challenge',
    ),
  ];

  void _setupSocketNotificationListener() {
    SocketService.instance.onNotification((notif) {
      final id = notif['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString();
      final isRead = notif['is_read'] == true;
      notifications.insert(0, AppNotification(
        id: id,
        title: 'Notification',
        subtitle: notif['message']?.toString() ?? '',
        time: 'Now',
        icon: 'notifications',
      ));
      if (isRead) {
        readNotifications.add(id);
      }
      notifyListeners();
    });
  }

  Future<void> fetchNotifications() async {
    try {
      final res = await ApiService.get('/messaging/notifications');
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body)['data'] as List<dynamic>;
        notifications.clear();
        for (var n in list) {
          final id = n['id'].toString();
          final isRead = n['is_read'] == true;
          notifications.add(AppNotification(
            id: id,
            title: 'Notification',
            subtitle: n['message']?.toString() ?? '',
            time: 'Recent',
            icon: 'notifications',
          ));
          if (isRead) {
            readNotifications.add(id);
          }
        }
        notifyListeners();
      }
    } catch (_) {}
  }


  bool get hasSession => email.trim().isNotEmpty;

  Future<void> initialize() async {
    if (ApiService.hasToken) {
      try {
        initError = null;
        final userRes = await ApiService.get('/users/me');
        if (userRes.statusCode == 200) {
          final data = jsonDecode(userRes.body)['data'];
          username = data['user_username'] ?? '';
          fullName = data['first_name'] != null ? '${data['first_name']} ${data['last_name']}' : 'User';
          email = data['email'] ?? '';
          gender = data['gender'] ?? gender;
          subscriptionTier = data['subscription_tier'] ?? subscriptionTier;
          assignedDoctorUsername = data['assigned_doctor_username'];
          doctorRequestStatus = data['doctor_request_status'];
          if (data['target_weight'] != null) targetWeightKg = _parseDouble(data['target_weight']);
          if (data['height'] != null) heightCm = _parseDouble(data['height']);
          if (data['activity_level'] != null) activityLevel = data['activity_level'];
          if (data['goal'] != null) selectedGoal = data['goal'];
          phoneNo = data['phone_no'] ?? '';
          address = data['address'] ?? '';
          job = data['job'] ?? '';
          dob = data['dob'] ?? '';
          if (dob.isNotEmpty) {
            try {
              final birthDate = DateTime.parse(dob);
              final now = DateTime.now();
              int calculatedAge = now.year - birthDate.year;
              if (now.month < birthDate.month || (now.month == birthDate.month && now.day < birthDate.day)) {
                calculatedAge--;
              }
              age = calculatedAge;
            } catch (_) {}
          }

          // Connect Socket.io
          SocketService.instance.connect(username);

          final trackRes = await ApiService.get('/tracking/summary');
          if (trackRes.statusCode == 200) {
            final summary = jsonDecode(trackRes.body)['data'];
            if (summary['water'] != null) waterMl = _parseInt(summary['water']['cups']) * 250;
            if (summary['steps'] != null) steps = _parseInt(summary['steps']['steps']);
            if (summary['calories'] != null) {
              caloriesConsumed = _parseInt(summary['calories']['total_calories']);
              protein = _parseInt(summary['calories']['total_protein']);
              carbs = _parseInt(summary['calories']['total_carbs']);
              fat = _parseInt(summary['calories']['total_fat']);
            }
            if (summary['exercise'] != null) caloriesBurned = _parseInt(summary['exercise']['calories_burned']);
            if (summary['sleep'] != null) sleepHours = _parseDouble(summary['sleep']['hours']);
          }
          await fetchNotifications();
          await fetchTrackingLogs();
        } else {
          await ApiService.clearToken();
        }
      } catch (e) {
        initError = 'Could not connect to server. Please check your connection.';
        notifyListeners();
      } finally {
        initLoaded = true;
        notifyListeners();
      }
    } else {
      initLoaded = true;
      notifyListeners();
    }
  }

  void _restoreFromJson(Map<String, dynamic> json) {
    fullName = (json['fullName'] ?? fullName).toString();
    email = (json['email'] ?? email).toString();
    subscriptionTier = (json['subscriptionTier'] ?? subscriptionTier).toString();
    assignedDoctorUsername = json['assignedDoctorUsername']?.toString();
    doctorRequestStatus = json['doctorRequestStatus']?.toString();
    age = (json['age'] as num?)?.toInt() ?? age;
    gender = (json['gender'] ?? gender).toString();
    heightCm = (json['heightCm'] as num?)?.toDouble() ?? heightCm;
    weightKg = (json['weightKg'] as num?)?.toDouble() ?? weightKg;
    startWeightKg = (json['startWeightKg'] as num?)?.toDouble() ?? startWeightKg;
    targetWeightKg = (json['targetWeightKg'] as num?)?.toDouble() ?? targetWeightKg;
    activityLevel = (json['activityLevel'] ?? activityLevel).toString();
    selectedGoal = (json['selectedGoal'] ?? selectedGoal).toString();
    goalDurationWeeks = (json['goalDurationWeeks'] as num?)?.toInt() ?? goalDurationWeeks;
    calorieGoal = (json['calorieGoal'] as num?)?.toInt() ?? calorieGoal;
    caloriesConsumed = (json['caloriesConsumed'] as num?)?.toInt() ?? caloriesConsumed;
    caloriesBurned = (json['caloriesBurned'] as num?)?.toInt() ?? caloriesBurned;
    proteinGoal = (json['proteinGoal'] as num?)?.toInt() ?? proteinGoal;
    carbsGoal = (json['carbsGoal'] as num?)?.toInt() ?? carbsGoal;
    fatGoal = (json['fatGoal'] as num?)?.toInt() ?? fatGoal;
    protein = (json['protein'] as num?)?.toInt() ?? protein;
    carbs = (json['carbs'] as num?)?.toInt() ?? carbs;
    fat = (json['fat'] as num?)?.toInt() ?? fat;
    stepsGoal = (json['stepsGoal'] as num?)?.toInt() ?? stepsGoal;
    steps = (json['steps'] as num?)?.toInt() ?? steps;
    waterGoalMl = (json['waterGoalMl'] as num?)?.toInt() ?? waterGoalMl;
    waterMl = (json['waterMl'] as num?)?.toInt() ?? waterMl;
    sleepGoalHours = (json['sleepGoalHours'] as num?)?.toDouble() ?? sleepGoalHours;
    sleepHours = (json['sleepHours'] as num?)?.toDouble() ?? sleepHours;
    stressLevel = (json['stressLevel'] as num?)?.toInt() ?? stressLevel;
    stressMood = (json['stressMood'] ?? stressMood).toString();
    fastingActive = json['fastingActive'] as bool? ?? fastingActive;
    fastingWindowHours = (json['fastingWindowHours'] as num?)?.toInt() ?? fastingWindowHours;
    eatingWindowHours = (json['eatingWindowHours'] as num?)?.toInt() ?? eatingWindowHours;
    final fastingDate = DateTime.tryParse((json['fastingStartedAt'] ?? '').toString());
    if (fastingDate != null) fastingStartedAt = fastingDate;
    fastingPausedAt = DateTime.tryParse((json['fastingPausedAt'] ?? '').toString());
    joinedChallenges
      ..clear()
      ..addAll((json['joinedChallenges'] as List<dynamic>? ?? const <dynamic>[]).map((e) => e.toString()));
    connectedDevices
      ..clear()
      ..addAll((json['connectedDevices'] as List<dynamic>? ?? const <dynamic>[]).map((e) => e.toString()));
    readNotifications
      ..clear()
      ..addAll((json['readNotifications'] as List<dynamic>? ?? const <dynamic>[]).map((e) => e.toString()));
    meals
      ..clear()
      ..addAll((json['meals'] as List<dynamic>? ?? const <dynamic>[]).whereType<Map<String, dynamic>>().map(MealLog.fromJson));
    waterLogs
      ..clear()
      ..addAll((json['waterLogs'] as List<dynamic>? ?? const <dynamic>[]).whereType<Map<String, dynamic>>().map(WaterLog.fromJson));
    weightEntries
      ..clear()
      ..addAll((json['weightEntries'] as List<dynamic>? ?? const <dynamic>[]).whereType<Map<String, dynamic>>().map(WeightEntry.fromJson));
    workouts
      ..clear()
      ..addAll((json['workouts'] as List<dynamic>? ?? const <dynamic>[]).whereType<Map<String, dynamic>>().map(WorkoutLog.fromJson));
    stressEntries
      ..clear()
      ..addAll((json['stressEntries'] as List<dynamic>? ?? const <dynamic>[]).whereType<Map<String, dynamic>>().map(StressEntry.fromJson));
  }

  Map<String, dynamic> _toJson() => <String, dynamic>{
        'fullName': fullName,
        'email': email,
        'subscriptionTier': subscriptionTier,
        'assignedDoctorUsername': assignedDoctorUsername,
        'doctorRequestStatus': doctorRequestStatus,
        'age': age,
        'gender': gender,
        'heightCm': heightCm,
        'weightKg': weightKg,
        'startWeightKg': startWeightKg,
        'targetWeightKg': targetWeightKg,
        'activityLevel': activityLevel,
        'selectedGoal': selectedGoal,
        'goalDurationWeeks': goalDurationWeeks,
        'calorieGoal': calorieGoal,
        'caloriesConsumed': caloriesConsumed,
        'caloriesBurned': caloriesBurned,
        'proteinGoal': proteinGoal,
        'carbsGoal': carbsGoal,
        'fatGoal': fatGoal,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'stepsGoal': stepsGoal,
        'steps': steps,
        'waterGoalMl': waterGoalMl,
        'waterMl': waterMl,
        'sleepGoalHours': sleepGoalHours,
        'sleepHours': sleepHours,
        'stressLevel': stressLevel,
        'stressMood': stressMood,
        'fastingActive': fastingActive,
        'fastingWindowHours': fastingWindowHours,
        'eatingWindowHours': eatingWindowHours,
        'fastingStartedAt': fastingStartedAt.toIso8601String(),
        'fastingPausedAt': fastingPausedAt?.toIso8601String(),
        'joinedChallenges': joinedChallenges.toList(),
        'connectedDevices': connectedDevices.toList(),
        'readNotifications': readNotifications.toList(),
        'meals': meals.map((e) => e.toJson()).toList(),
        'waterLogs': waterLogs.map((e) => e.toJson()).toList(),
        'weightEntries': weightEntries.map((e) => e.toJson()).toList(),
        'workouts': workouts.map((e) => e.toJson()).toList(),
        'stressEntries': stressEntries.map((e) => e.toJson()).toList(),
      };

  Future<void> _save() async {
    // No longer persisting full state locally to avoid out-of-sync bugs.
  }

  Future<void> signOut() async {
    fullName = 'User';
    email = '';
    username = '';
    subscriptionTier = 'default';
    resetTrackingData(notify: false);
    SocketService.instance.disconnect();
    notifyListeners();
  }

  Future<bool> _restoreAccountIfExists(String emailAddress) async {
    // Accounts are always fetched fresh from backend.
    return false;
  }

  @override
  void notifyListeners() {
    _save();
    super.notifyListeners();
  }


  double get heightM => heightCm / 100;
  double get bmi => heightM <= 0 ? 0 : weightKg / (heightM * heightM);
  String get bmiCategory {
    final value = bmi;
    if (value < 18.5) return 'Underweight';
    if (value < 25) return 'Normal Weight';
    if (value < 30) return 'Overweight';
    return 'Obese';
  }

  int get waterCups => (waterMl / 250).round();
  int get waterGoalCups => (waterGoalMl / 250).round();
  double get waterProgress => waterGoalMl == 0 ? 0 : (waterMl / waterGoalMl).clamp(0.0, 1.0).toDouble();
  double get caloriesProgress => calorieGoal == 0 ? 0 : (caloriesConsumed / calorieGoal).clamp(0.0, 1.0).toDouble();
  double get stepsProgress => stepsGoal == 0 ? 0 : (steps / stepsGoal).clamp(0.0, 1.0).toDouble();
  double get sleepProgress => sleepGoalHours == 0 ? 0 : (sleepHours / sleepGoalHours).clamp(0.0, 1.0).toDouble();
  double get weightLost => startWeightKg - weightKg;
  double get weeklyTargetChange => goalDurationWeeks <= 0 ? 0 : (weightKg - targetWeightKg).abs() / goalDurationWeeks;
  int get healthScore {
    final score = (caloriesProgress * 22) + (stepsProgress * 24) + (waterProgress * 20) + (sleepProgress * 20) + ((100 - stressLevel) / 100 * 14);
    return score.round().clamp(0, 100).toInt();
  }

  Duration get fastingElapsed {
    final end = fastingActive ? DateTime.now() : (fastingPausedAt ?? DateTime.now());
    final elapsed = end.difference(fastingStartedAt);
    return elapsed.isNegative ? Duration.zero : elapsed;
  }
  Duration get fastingRemaining {
    final total = Duration(hours: fastingWindowHours);
    final remaining = total - fastingElapsed;
    return remaining.isNegative ? Duration.zero : remaining;
  }

  double get fastingProgress {
    final totalSeconds = fastingWindowHours * 60 * 60;
    if (totalSeconds <= 0) return 0;
    return (fastingElapsed.inSeconds / totalSeconds).clamp(0.0, 1.0).toDouble();
  }

  int get activeChallengeCount => joinedChallenges.length;
  int get challengePoints => joinedChallenges.length * 270;
  int get unreadNotificationCount => notifications.where((notification) => !readNotifications.contains(notification.id)).length;
  bool isNotificationRead(String id) => readNotifications.contains(id);

  void resetTrackingData({bool notify = true}) {
    caloriesConsumed = 0;
    caloriesBurned = 0;
    protein = 0;
    carbs = 0;
    fat = 0;
    steps = 0;
    waterMl = 0;
    sleepHours = 0.0;
    stressLevel = 0;
    stressMood = 'No entry yet';
    meals.clear();
    waterLogs.clear();
    weightEntries.clear();
    workouts.clear();
    stressEntries.clear();
    communityPosts.clear();
    issueReports.clear();
    joinedChallenges.clear();
    connectedDevices.clear();
    readNotifications.clear();
    lastAnalyticsExportAt = null;
    lastCarePlanExportAt = null;
    lastCarePlanShareAt = null;
    profilePhotoChanged = false;
    medicalInfoReviewed = false;
    fastingStartedAt = DateTime.now();
    fastingPausedAt = null;
    fastingActive = true;
    fastingHistory.clear();
    if (notify) notifyListeners();
  }

  Future<void> login(String name, String emailAddress, {int? newAge, String? newGender, double? newHeight, double? newWeight, String? newGoal}) async {
    final normalizedEmail = emailAddress.trim().toLowerCase();

    username = name;
    fullName = name.trim().isEmpty ? 'User' : name.trim();
    email = normalizedEmail;

    // Connect Socket.io
    SocketService.instance.connect(username);

    try {
      final userRes = await ApiService.get('/users/me');
      if (userRes.statusCode == 200) {
        final data = jsonDecode(userRes.body)['data'];
        fullName = data['first_name'] != null ? '${data['first_name']} ${data['last_name']}' : fullName;
        gender = data['gender'] ?? gender;
        subscriptionTier = data['subscription_tier'] ?? subscriptionTier;
        assignedDoctorUsername = data['assigned_doctor_username'];
        doctorRequestStatus = data['doctor_request_status'];
        if (data['target_weight'] != null) targetWeightKg = _parseDouble(data['target_weight']);
        if (data['height'] != null) heightCm = _parseDouble(data['height']);
        if (data['activity_level'] != null) activityLevel = data['activity_level'];
        if (data['goal'] != null) selectedGoal = data['goal'];
        phoneNo = data['phone_no'] ?? '';
        address = data['address'] ?? '';
        job = data['job'] ?? '';
        dob = data['dob'] ?? '';
        if (dob.isNotEmpty) {
          try {
            final birthDate = DateTime.parse(dob);
            final now = DateTime.now();
            int calculatedAge = now.year - birthDate.year;
            if (now.month < birthDate.month || (now.month == birthDate.month && now.day < birthDate.day)) {
              calculatedAge--;
            }
            age = calculatedAge;
          } catch (_) {}
        }
      }

      final trackRes = await ApiService.get('/tracking/summary');
      if (trackRes.statusCode == 200) {
        final summary = jsonDecode(trackRes.body)['data'];
        if (summary['water'] != null) waterMl = _parseInt(summary['water']['cups']) * 250;
        if (summary['steps'] != null) steps = _parseInt(summary['steps']['steps']);
        if (summary['calories'] != null) {
          caloriesConsumed = _parseInt(summary['calories']['total_calories']);
          protein = _parseInt(summary['calories']['total_protein']);
          carbs = _parseInt(summary['calories']['total_carbs']);
          fat = _parseInt(summary['calories']['total_fat']);
        }
        if (summary['exercise'] != null) caloriesBurned = _parseInt(summary['exercise']['calories_burned']);
        if (summary['sleep'] != null) sleepHours = _parseDouble(summary['sleep']['hours']);
      }
      
      await fetchNotifications();
      await fetchTrackingLogs();
    } catch (_) {}

    _recalculateNutritionTargets();
    notifyListeners();
  }

  void updateProfile({
    String? name,
    String? emailAddress,
    int? newAge,
    String? newGender,
    double? newHeight,
    double? newWeight,
    String? newActivityLevel,
    String? newGoal,
    double? newTargetWeight,
    String? newMedicalCondition,
    String? newPhone,
    String? newAddress,
    String? newJob,
    String? newDob,
  }) {
    if (name != null && name.trim().isNotEmpty) fullName = name.trim();
    if (emailAddress != null && emailAddress.trim().isNotEmpty) email = emailAddress.trim();
    if (newAge != null && newAge > 0) age = newAge;
    if (newGender != null && newGender.trim().isNotEmpty) gender = newGender.trim();
    if (newHeight != null && newHeight > 0) heightCm = newHeight;
    if (newWeight != null && newWeight > 0) {
      weightKg = newWeight;
      addWeightEntry(newWeight, 'Today', notify: false);
    }
    if (newActivityLevel != null && newActivityLevel.trim().isNotEmpty) activityLevel = newActivityLevel.trim();
    if (newGoal != null && newGoal.trim().isNotEmpty) selectedGoal = newGoal.trim();
    if (newTargetWeight != null && newTargetWeight > 0) targetWeightKg = newTargetWeight;
    if (newMedicalCondition != null && newMedicalCondition.trim().isNotEmpty) medicalCondition = newMedicalCondition.trim();
    if (newPhone != null) phoneNo = newPhone.trim();
    if (newAddress != null) address = newAddress.trim();
    if (newJob != null) job = newJob.trim();
    if (newDob != null && newDob.trim().isNotEmpty) {
      dob = newDob.trim();
      try {
        final birthDate = DateTime.parse(dob);
        final now = DateTime.now();
        int calculatedAge = now.year - birthDate.year;
        if (now.month < birthDate.month || (now.month == birthDate.month && now.day < birthDate.day)) {
          calculatedAge--;
        }
        age = calculatedAge;
      } catch (_) {}
    }
    notifyListeners();

    try {
      final parts = fullName.split(' ');
      final firstName = parts.first;
      final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';
      ApiService.put('/users/me', body: {
        'first_name': firstName,
        'last_name': lastName,
        'phone_no': phoneNo,
        'address': address,
        'dob': dob.isNotEmpty ? dob : DateTime.now().subtract(Duration(days: age * 365)).toIso8601String().split('T').first,
        'gender': gender,
        'job': job,
        'medical_condition': medicalCondition,
      });
      // Also update requirements for goal/target weight
      ApiService.put('/requirements/me', body: {
        'height_cm': heightCm,
        'weight_kg': weightKg,
        'target_weight_kg': targetWeightKg,
        'goal': selectedGoal,
        'activity_rate': double.tryParse(activityLevel) ?? 1.2,
        'medical_condition': medicalCondition,
      });
    } catch (_) {}
  }

  void changeProfilePhoto() {
    profilePhotoChanged = true;
    notifyListeners();
  }

  void updateGoal(String goal, double targetWeight, int durationWeeks) {
    selectedGoal = goal;
    targetWeightKg = targetWeight;
    goalDurationWeeks = durationWeeks;
    _recalculateNutritionTargets();
    notifyListeners();
  }

  void _recalculateNutritionTargets() {
    final isMale = gender.toLowerCase().startsWith('m');
    final bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + (isMale ? 5 : -161);
    var targetCalories = (bmr * 1.35).round();
    if (selectedGoal == 'Lose Weight') {
      targetCalories -= 500;
      targetWeightKg = math.max(35.0, weightKg - 5).toDouble();
    } else if (selectedGoal == 'Gain Weight') {
      targetCalories += 350;
      targetWeightKg = math.min(250.0, weightKg + 5).toDouble();
    } else {
      targetWeightKg = weightKg;
    }
    calorieGoal = targetCalories.clamp(isMale ? 1500 : 1200, 4200).toInt();
    proteinGoal = (weightKg * (selectedGoal == 'Gain Weight' ? 1.8 : 1.6)).round().clamp(45, 260).toInt();
    fatGoal = ((calorieGoal * 0.25) / 9).round().clamp(30, 140).toInt();
    carbsGoal = math.max(60, ((calorieGoal - (proteinGoal * 4) - (fatGoal * 9)) / 4).round()).toInt();
  }

  void updatePreferences({Map<String, bool>? dietary, String? allergy, String? protocol, String? mealsPerDay}) {
    if (dietary != null) dietaryPreferences
      ..clear()
      ..addAll(dietary);
    if (allergy != null) selectedAllergy = allergy;
    if (protocol != null) {
      fastingProtocol = protocol;
      if (protocol.startsWith('18:6')) {
        fastingWindowHours = 18;
        eatingWindowHours = 6;
      } else if (protocol.startsWith('5:2') || protocol.startsWith('20:4')) {
        fastingWindowHours = 20;
        eatingWindowHours = 4;
      } else if (protocol.startsWith('OMAD')) {
        fastingWindowHours = 23;
        eatingWindowHours = 1;
      } else if (protocol.startsWith('16:8')) {
        fastingWindowHours = 16;
        eatingWindowHours = 8;
      }
    }
    if (mealsPerDay != null) mealFrequency = mealsPerDay;
    notifyListeners();
  }

  void addWater(int amountMl) {
    waterMl = math.min(waterGoalMl, waterMl + amountMl);
    waterLogs.insert(0, WaterLog(amountMl, 'Now'));
    notifyListeners();
    try {
      ApiService.post('/tracking/water', body: {'cups': (waterMl / 250).round()});
    } catch (_) {}
  }

  void resetWater() {
    waterMl = 0;
    waterLogs.clear();
    notifyListeners();
  }

  Future<void> fetchTrackingLogs({String? date}) async {
    try {
      final dateText = date ?? DateTime.now().toIso8601String().split('T').first;

      // Fetch macros/calories summary for the specific date so the UI reflects
      // the correct day regardless of server-side timezone defaults.
      final summary = await TrackingService.getSummary(date: dateText);
      if (summary != null && summary['calories'] != null) {
        caloriesConsumed = _parseInt(summary['calories']['total_calories']);
        protein = _parseInt(summary['calories']['total_protein']);
        carbs = _parseInt(summary['calories']['total_carbs']);
        fat = _parseInt(summary['calories']['total_fat']);
      }

      final foodList = await TrackingService.getFoodLog(date: dateText);
      meals.clear();
      for (var f in foodList) {
        meals.add(MealLog(
          f['food_name']?.toString() ?? 'Meal',
          f['meal_type']?.toString() ?? 'Logged meal',
          _parseInt(f['calories']),
          f['logged_at']?.toString() ?? 'Now',
          protein: _parseInt(f['protein_g']),
          carbs: _parseInt(f['carbs_g']),
          fat: _parseInt(f['fat_g']),
          id: f['log_id']?.toString(),
        ));
      }

      final weightList = await TrackingService.getWeight();
      weightEntries.clear();
      for (var w in weightList) {
        weightEntries.add(WeightEntry(
          _parseDouble(w['weight_kg']),
          w['logged_at']?.toString() ?? 'Now',
          id: w['log_id']?.toString(),
        ));
      }

      final exerciseList = await TrackingService.getExercise(date: dateText);
      workouts.clear();
      for (var ex in exerciseList) {
        workouts.add(WorkoutLog(
          ex['exercise_name']?.toString() ?? 'Workout',
          ex['category']?.toString() ?? 'General',
          _parseInt(ex['duration_min']),
          _parseInt(ex['calories_burned']),
          ex['logged_at']?.toString() ?? 'Now',
          intensity: ex['intensity']?.toString() ?? 'Moderate',
          id: ex['log_id']?.toString(),
        ));
      }

      // Fetch steps history for weekly chart
      final stepsList = await TrackingService.getSteps();
      stepsHistory.clear();
      for (var s in stepsList) {
        stepsHistory.add(StepLog(
          _parseInt(s['steps']),
          s['log_date']?.toString() ?? s['date']?.toString() ?? '',
        ));
      }

      notifyListeners();
    } catch (_) {}
  }

  Future<void> addMeal(String title, String description, int calories, {int proteinValue = 0, int carbsValue = 0, int fatValue = 0, DateTime? date, String mealType = 'Snack', int? foodId}) async {
    // Allow logging when food_id is provided even if local calories appear as 0
    // (backend will resolve real macros from nutrition_facts)
    if (title.trim().isEmpty || (calories <= 0 && foodId == null)) return;
    final safeProtein = math.max(0, proteinValue);
    final safeCarbs = math.max(0, carbsValue);
    final safeFat = math.max(0, fatValue);
    final logDate = date ?? DateTime.now();
    final dateText = '${logDate.year.toString().padLeft(4, '0')}-${logDate.month.toString().padLeft(2, '0')}-${logDate.day.toString().padLeft(2, '0')}';

    try {
      final body = <String, dynamic>{
        'food_name': title.trim(),
        'meal_type': mealType,
        'calories': calories,
        'protein_g': safeProtein,
        'carbs_g': safeCarbs,
        'fat_g': safeFat,
        'date': dateText,
      };
      if (foodId != null) body['food_id'] = foodId;
      final success = await TrackingService.addFoodLog(body);
      // Refresh logs and macros for the exact date of the logged meal so the
      // UI reflects the correct day regardless of server-side timezone defaults.
      if (success) await fetchTrackingLogs(date: dateText);
    } catch (_) {}
  }

  Future<void> removeMeal(int index) async {
    if (index < 0 || index >= meals.length) return;
    final meal = meals[index];
    // Extract the date from the meal's logged_at timestamp if possible,
    // otherwise fall back to today so the summary refresh uses the right date.
    String mealDate = DateTime.now().toIso8601String().split('T').first;
    if (meal.time.length >= 10) {
      final parsed = DateTime.tryParse(meal.time);
      if (parsed != null) {
        mealDate = '${parsed.year.toString().padLeft(4, '0')}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}';
      }
    }
    meals.removeAt(index);
    notifyListeners();
    if (meal.id != null) {
      try {
        await TrackingService.deleteFoodLog(meal.id!);
        // Refresh logs and macros for the meal's date after deletion.
        await fetchTrackingLogs(date: mealDate);
      } catch (_) {}
    }
  }

  void addSteps(int amount) {
    steps = math.max(0, steps + amount);
    notifyListeners();
    try {
      ApiService.post('/tracking/steps', body: {'steps': steps});
    } catch (_) {}
  }

  void setSteps(int amount) {
    steps = math.max(0, amount);
    notifyListeners();
  }

  Future<void> addWorkout(String title, String type, int minutes, int calories, {String intensity = 'Moderate'}) async {
    if (title.trim().isEmpty || minutes <= 0 || calories < 0) return;
    try {
      final success = await TrackingService.addExercise({
        'exercise_name': title.trim(),
        'category': type,
        'duration_min': minutes,
        'intensity': intensity,
        'calories_burned': calories,
      });
      if (success) {
        final trackRes = await ApiService.get('/tracking/summary');
        if (trackRes.statusCode == 200) {
          final summary = jsonDecode(trackRes.body)['data'];
          if (summary['exercise'] != null) caloriesBurned = _parseInt(summary['exercise']['calories_burned']);
        }
        await fetchTrackingLogs();
      }
    } catch (_) {}
  }

  void updateWorkout(int index, String title, String type, int minutes, int calories, {String intensity = 'Moderate'}) {
    // Placeholder, needs ID for proper update
  }

  Future<void> removeWorkout(int index) async {
    if (index < 0 || index >= workouts.length) return;
    final workout = workouts[index];
    workouts.removeAt(index);
    notifyListeners();
    if (workout.id != null) {
      try {
        await TrackingService.deleteExercise(workout.id!);
        final trackRes = await ApiService.get('/tracking/summary');
        if (trackRes.statusCode == 200) {
          final summary = jsonDecode(trackRes.body)['data'];
          if (summary['exercise'] != null) {
            caloriesBurned = _parseInt(summary['exercise']['calories_burned']);
          }
        }
      } catch (_) {}
    }
  }

  Future<void> addWeightEntry(double value, String date, {bool notify = true}) async {
    if (value <= 0 || value > 350) return;
    try {
      final success = await TrackingService.addWeight(value);
      if (success) {
        weightKg = value;
        await fetchTrackingLogs();
        if (notify) notifyListeners();
      }
    } catch (_) {}
  }

  void removeWeightEntry(int index) {
    if (index < 0 || index >= weightEntries.length) return;
    weightEntries.removeAt(index);
    if (weightEntries.isNotEmpty) {
      weightKg = weightEntries.first.weight;
    }
    notifyListeners();
  }

  void saveStressEntry(String mood, String emoji, int level, String cause, String note) {
    stressMood = mood;
    stressLevel = level;
    stressEntries.insert(0, StressEntry(mood, emoji, level, 'Now', cause, note: note));
    notifyListeners();
  }

  void joinChallenge(String title) {
    joinedChallenges.add(title);
    notifyListeners();
  }

  void updateAnalyticsRange(String range) {
    analyticsRange = range;
    notifyListeners();
  }

  void updateAnalyticsFilter(String filter) {
    analyticsFilter = filter;
    notifyListeners();
  }

  void exportAnalyticsReport() {
    lastAnalyticsExportAt = DateTime.now();
    notifyListeners();
  }

  void updateSleep(double hours, [double? goalHours]) {
    if (hours < 0 || hours > 24) return;
    if (goalHours != null && goalHours > 0 && goalHours <= 24) {
      sleepGoalHours = goalHours;
    }
    sleepHours = hours;
    notifyListeners();
    try {
      ApiService.post('/tracking/sleep', body: {'hours': hours});
    } catch (_) {}
  }

  void toggleFasting() {
    if (fastingActive) {
      fastingPausedAt = DateTime.now();
      fastingActive = false;
    } else {
      if (fastingPausedAt != null) {
        fastingStartedAt = fastingStartedAt.add(DateTime.now().difference(fastingPausedAt!));
      }
      fastingPausedAt = null;
      fastingActive = true;
    }
    notifyListeners();
  }

  void resetFasting() {
    fastingStartedAt = DateTime.now();
    fastingPausedAt = null;
    fastingActive = true;
    notifyListeners();
  }

  void completeFasting() {
    final hours = fastingElapsed.inMinutes / 60.0;
    if (hours > 0) {
      fastingHistory.add(double.parse(hours.toStringAsFixed(1)));
      if (fastingHistory.length > 7) {
        fastingHistory.removeAt(0);
      }
    }
    fastingStartedAt = DateTime.now();
    fastingPausedAt = null;
    fastingActive = true;
    notifyListeners();
  }

  void updateFastingProtocol(String protocol) {
    fastingProtocol = protocol;
    if (protocol.startsWith('18:6')) {
      fastingWindowHours = 18;
      eatingWindowHours = 6;
    } else if (protocol.startsWith('5:2') || protocol.startsWith('20:4')) {
      fastingWindowHours = 20;
      eatingWindowHours = 4;
    } else if (protocol.startsWith('OMAD')) {
      fastingWindowHours = 23;
      eatingWindowHours = 1;
    } else if (protocol.startsWith('16:8')) {
      fastingWindowHours = 16;
      eatingWindowHours = 8;
    }
    notifyListeners();
  }

  void reviewMedicalInfo() {
    medicalInfoReviewed = true;
    notifyListeners();
  }

  Future<void> fetchMedicalRecords() async {
    try {
      final res = await ApiService.get('/medical/records');
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body)['data'] as List<dynamic>;
        medicalRecords.clear();
        for (var m in list) {
          medicalRecords.add(MedicalRecord(
            id: m['record_id'].toString(),
            conditionName: m['condition_name']?.toString() ?? 'Record',
            conditionType: m['condition_type']?.toString() ?? 'other',
            extraInfo: m['extra_info']?.toString(),
            fileName: m['file_name']?.toString(),
            filePath: m['file_path']?.toString(),
            fileType: m['file_type']?.toString(),
            createdAt: m['created_at']?.toString() ?? '',
          ));
        }
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> deleteMedicalRecord(String id) async {
    try {
      final res = await ApiService.delete('/medical/records/$id');
      if (res.statusCode == 200) {
        medicalRecords.removeWhere((r) => r.id == id);
        notifyListeners();
      }
    } catch (_) {}
  }

  void exportCarePlan() {
    lastCarePlanExportAt = DateTime.now();
    notifyListeners();
  }

  void shareCarePlan() {
    lastCarePlanShareAt = DateTime.now();
    notifyListeners();
  }

  void toggleDevice(String name) {
    if (connectedDevices.contains(name)) {
      connectedDevices.remove(name);
    } else {
      connectedDevices.add(name);
    }
    notifyListeners();
  }

  void toggleLike(CommunityPost post) {
    post.likedByMe = !post.likedByMe;
    post.likes += post.likedByMe ? 1 : -1;
    notifyListeners();
  }

  void addComment(CommunityPost post, String comment) {
    if (comment.trim().isEmpty) return;
    post.comments += 1;
    post.commentList.insert(0, comment.trim());
    notifyListeners();
  }

  void addCommunityPost(String text, {bool hasImage = false}) {
    if (text.trim().isEmpty && !hasImage) return;
    communityPosts.insert(0, CommunityPost(author: fullName, time: 'Now', text: text.trim().isEmpty ? 'Shared a new progress update.' : text.trim(), likes: 0, comments: 0, hasImage: hasImage));
    notifyListeners();
  }

  void addMedicalScan(String title, {String status = 'Processed'}) {}

  void addIssueReport(String type, String subject, String description, {bool attachedScreenshot = false}) {
    issueReports.insert(0, IssueReport(type, subject, description, DateTime.now(), attachedScreenshot));
    notifyListeners();
  }

  void markNotificationRead(String id) {
    readNotifications.add(id);
    notifyListeners();
  }

  void markAllNotificationsRead() {
    for (final notification in notifications) {
      readNotifications.add(notification.id);
    }
    notifyListeners();
  }
}

class MealLog {
  MealLog(this.title, this.description, this.calories, this.time, {required this.protein, required this.carbs, required this.fat, this.id});
  final String? id;
  final String title;
  final String description;
  final int calories;
  final String time;
  final int protein;
  final int carbs;
  final int fat;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'description': description,
        'calories': calories,
        'time': time,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
      };

  factory MealLog.fromJson(Map<String, dynamic> json) => MealLog(
        (json['title'] ?? '').toString(),
        (json['description'] ?? '').toString(),
        _parseInt(json['calories']),
        (json['time'] ?? '').toString(),
        protein: _parseInt(json['protein']),
        carbs: _parseInt(json['carbs']),
        fat: _parseInt(json['fat']),
        id: json['id']?.toString(),
      );
}

class WaterLog {
  WaterLog(this.amountMl, this.time);
  final int amountMl;
  final String time;

  Map<String, dynamic> toJson() => <String, dynamic>{'amountMl': amountMl, 'time': time};
  factory WaterLog.fromJson(Map<String, dynamic> json) => WaterLog((json['amountMl'] as num?)?.toInt() ?? 0, (json['time'] ?? '').toString());
}

class StepLog {
  StepLog(this.steps, this.date);
  final int steps;
  final String date;

  Map<String, dynamic> toJson() => <String, dynamic>{'steps': steps, 'date': date};
  factory StepLog.fromJson(Map<String, dynamic> json) => StepLog(
        (json['steps'] as num?)?.toInt() ?? 0,
        (json['log_date'] ?? json['date'] ?? '').toString(),
      );
}

class WeightEntry {
  WeightEntry(this.weight, this.date, {this.id});
  final String? id;
  final double weight;
  final String date;

  Map<String, dynamic> toJson() => <String, dynamic>{'id': id, 'weight': weight, 'date': date};
  factory WeightEntry.fromJson(Map<String, dynamic> json) => WeightEntry(
        (json['weight'] as num?)?.toDouble() ?? 0,
        (json['date'] ?? '').toString(),
        id: json['id']?.toString(),
      );
}

class WorkoutLog {
  WorkoutLog(this.title, this.type, this.minutes, this.calories, this.date, {this.intensity = 'Moderate', this.id});
  final String? id;
  final String title;
  final String type;
  final int minutes;
  final int calories;
  final String date;
  final String intensity;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'type': type,
        'minutes': minutes,
        'calories': calories,
        'date': date,
        'intensity': intensity,
      };
  factory WorkoutLog.fromJson(Map<String, dynamic> json) => WorkoutLog(
        (json['title'] ?? '').toString(),
        (json['type'] ?? '').toString(),
        (json['minutes'] as num?)?.toInt() ?? 0,
        (json['calories'] as num?)?.toInt() ?? 0,
        (json['date'] ?? '').toString(),
        intensity: (json['intensity'] ?? 'Moderate').toString(),
        id: json['id']?.toString(),
      );
}

class StressEntry {
  StressEntry(this.title, this.emoji, this.level, this.time, this.cause, {this.note = ''});
  final String title;
  final String emoji;
  final int level;
  final String time;
  final String cause;
  final String note;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'title': title,
        'emoji': emoji,
        'level': level,
        'time': time,
        'cause': cause,
        'note': note,
      };
  factory StressEntry.fromJson(Map<String, dynamic> json) => StressEntry(
        (json['title'] ?? '').toString(),
        (json['emoji'] ?? '').toString(),
        (json['level'] as num?)?.toInt() ?? 0,
        (json['time'] ?? '').toString(),
        (json['cause'] ?? '').toString(),
        note: (json['note'] ?? '').toString(),
      );
}

class CommunityPost {
  CommunityPost({required this.author, required this.time, required this.text, required this.likes, required this.comments, required this.hasImage});
  final String author;
  final String time;
  final String text;
  int likes;
  int comments;
  bool hasImage;
  bool likedByMe = false;
  final List<String> commentList = <String>[];
}

class MedicalRecord {
  MedicalRecord({
    required this.id,
    required this.conditionName,
    required this.conditionType,
    this.extraInfo,
    this.fileName,
    this.filePath,
    this.fileType,
    required this.createdAt,
  });

  final String id;
  final String conditionName;
  final String conditionType;
  final String? extraInfo;
  final String? fileName;
  final String? filePath;
  final String? fileType;
  final String createdAt;
}

class AppNotification {
  AppNotification({required this.id, required this.title, required this.subtitle, required this.time, required this.icon});
  final String id;
  final String title;
  final String subtitle;
  final String time;
  final String icon;
}

class IssueReport {
  IssueReport(this.type, this.subject, this.description, this.createdAt, this.attachedScreenshot);
  final String type;
  final String subject;
  final String description;
  final DateTime createdAt;
  final bool attachedScreenshot;
}

int _parseInt(dynamic val) {
  if (val == null) return 0;
  if (val is int) return val;
  if (val is double) return val.round();
  if (val is num) return val.toInt();
  if (val is String) {
    final d = double.tryParse(val);
    if (d != null) return d.round();
  }
  return 0;
}

double _parseDouble(dynamic val) {
  if (val == null) return 0.0;
  if (val is double) return val;
  if (val is int) return val.toDouble();
  if (val is num) return val.toDouble();
  if (val is String) {
    return double.tryParse(val) ?? 0.0;
  }
  return 0.0;
}

