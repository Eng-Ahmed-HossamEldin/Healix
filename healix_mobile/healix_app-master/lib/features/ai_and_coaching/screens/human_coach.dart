import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:healix_app/core/services/api_service.dart';
import 'package:healix_app/core/services/socket_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/features/ai_and_coaching/screens/doctor_selection_screen.dart';
import 'package:healix_app/features/settings/screens/subscription_screen.dart';

class HumanCoach extends StatefulWidget {
  const HumanCoach({super.key});

  @override
  State<HumanCoach> createState() => _HumanCoachState();
}

class _HumanCoachState extends State<HumanCoach> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<_CoachMessage> _messages = [];
  bool _isLoading = false;

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _setupSocket();
  }

  void _setupSocket() {
    if (appState.assignedDoctorUsername != null) {
      SocketService.instance.joinChat(appState.username, appState.assignedDoctorUsername!);
      SocketService.instance.onMessage((data) {
        if (!mounted) return;
        final sender = data['sender_username']?.toString();
        final receiver = data['receiver_username']?.toString();
        if ((sender == appState.username && receiver == appState.assignedDoctorUsername) ||
            (sender == appState.assignedDoctorUsername && receiver == appState.username)) {
          setState(() {
            _messages.add(_CoachMessage(
              text: data['message'] ?? '',
              time: data['created_at'] != null 
                  ? TimeOfDay.fromDateTime(DateTime.parse(data['created_at']).toLocal()).format(context) 
                  : _currentTime(),
              isMe: sender == appState.username,
            ));
          });
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollController.hasClients) {
              _scrollController.animateTo(
                _scrollController.position.maxScrollExtent,
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeOut,
              );
            }
          });
        }
      });
    }
  }

  /// Refresh user data from the server so the UI reflects the latest
  /// subscription tier, assigned doctor and request status.
  Future<void> _refreshUserState() async {
    try {
      final res = await ApiService.get('/users/me');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        appState.assignedDoctorUsername = data['assigned_doctor_username'];
        appState.doctorRequestStatus = data['doctor_request_status'];
        appState.subscriptionTier =
            data['subscription_tier'] ?? appState.subscriptionTier;
        appState.notifyListeners();
      }
    } catch (_) {}
  }

  /// Cancel the pending doctor consultation request.
  Future<void> _cancelRequest() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Cancel Request'),
        content: const Text(
            'Are you sure you want to cancel your consultation request?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('No')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              minimumSize: Size.zero,
              padding: const EdgeInsets.symmetric(
                  horizontal: 20, vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      final res =
          await ApiService.post('/users/cancel-doctor-request', body: {});
      if (!mounted) return;
      if (res.statusCode == 200 || res.statusCode == 201) {
        AppActions.showSnack(context, 'Request cancelled successfully',
            icon: Icons.check_circle_outline);
        await _refreshUserState();
        if (mounted) setState(() {});
      } else {
        final msg =
            jsonDecode(res.body)['message']?.toString() ?? 'Failed to cancel';
        AppActions.showSnack(context, msg,
            color: Colors.red.shade700, icon: Icons.error_outline);
      }
    } catch (_) {
      if (mounted) {
        AppActions.showSnack(context, 'Network error',
            color: Colors.red.shade700, icon: Icons.error_outline);
      }
    }
  }

  Future<void> _loadMessages() async {
    if (appState.assignedDoctorUsername == null) return;
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.get(
          '/messaging/history/${appState.assignedDoctorUsername}');
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body)['data'] as List<dynamic>;
        setState(() {
          _messages.clear();
          for (var m in list) {
            _messages.add(_CoachMessage(
              text: m['message'] ?? '',
              time: m['created_at'] != null ? TimeOfDay.fromDateTime(DateTime.parse(m['created_at']).toLocal()).format(context) : 'Now',
              isMe: m['sender_username'] == appState.username,
            ));
          }
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
          }
        });
      }
    } catch (_) {} finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    SocketService.instance.offMessage();
    _searchController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String _currentTime() {
    final now = TimeOfDay.now();
    final hour = now.hourOfPeriod == 0 ? 12 : now.hourOfPeriod;
    final minute = now.minute.toString().padLeft(2, '0');
    final period = now.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || appState.assignedDoctorUsername == null) return;

    _messageController.clear();

    try {
      SocketService.instance.sendMessage(
        senderUsername: appState.username,
        receiverUsername: appState.assignedDoctorUsername!,
        message: text,
      );
    } catch (_) {}
  }

  Future<void> _handleRefresh() async {
    await _refreshUserState();
    await _loadMessages();
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Doctor Chat',
      selectedItem: 'Human Coach',
      searchController: _searchController,
      openScreen: _openScreen,
      onRefresh: _handleRefresh,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isCompact = constraints.maxWidth < 700;
          final contentMaxWidth = isCompact ? double.infinity : 860.0;
          final panelHeight = (MediaQuery.of(context).size.height - 180).clamp(500.0, 900.0).toDouble();

          return Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: contentMaxWidth),
              child: SizedBox(
                height: panelHeight,
                width: double.infinity,
                child: FeatureSectionCard(
                  padding: EdgeInsets.zero,
                  radius: 24,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: _buildBody(isCompact),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBody(bool isCompact) {
    if (appState.subscriptionTier != 'doctor') {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.medical_services_outlined, size: 64, color: HealixColors.navy),
              const SizedBox(height: 16),
              const Text('Doctor Subscription Required', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: HealixColors.navy)),
              const SizedBox(height: 8),
              const Text('Upgrade to connect with a personal clinician.', style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.w500)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => _openScreen(const SubscriptionScreen()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HealixColors.navy,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
                child: const Text('View Plans', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      );
    }
    if (appState.doctorRequestStatus == 'pending') {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: HealixColors.orange.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.hourglass_bottom_rounded,
                    size: 40, color: HealixColors.orange),
              ),
              const SizedBox(height: 20),
              const Text('Request Pending Approval',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: HealixColors.navy)),
              const SizedBox(height: 10),
              const Text(
                'Your consultation request is under review.\nYou will be able to chat once the doctor approves it.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: HealixColors.sub,
                    fontWeight: FontWeight.w500,
                    height: 1.5),
              ),
              const SizedBox(height: 28),
              OutlinedButton.icon(
                onPressed: _cancelRequest,
                icon: const Icon(Icons.close, size: 16),
                label: const Text('Cancel & Pick Another Doctor'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: HealixColors.red,
                  side: const BorderSide(color: HealixColors.red),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24)),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      );
    }
    if (appState.assignedDoctorUsername == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: HealixColors.navy.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person_search,
                    size: 40, color: HealixColors.navy),
              ),
              const SizedBox(height: 20),
              const Text('Choose Your Doctor',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: HealixColors.navy)),
              const SizedBox(height: 10),
              const Text(
                'Your Doctor plan is active!\nSelect a doctor to send a consultation request.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: HealixColors.sub,
                    fontWeight: FontWeight.w500,
                    height: 1.5),
              ),
              const SizedBox(height: 28),
              ElevatedButton.icon(
                icon: const Icon(Icons.search, size: 18),
                label: const Text('Browse Doctors',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15)),
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            const DoctorSelectionScreen()),
                  );
                  // Refresh state so the chat opens if a request was sent
                  await _refreshUserState();
                  if (mounted) setState(() {});
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7B2FBE),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(200, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        _CoachHeader(doctorUsername: appState.assignedDoctorUsername!),
        Expanded(
          child: Container(
            color: HealixColors.navy.withOpacity(0.02),
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator(color: HealixColors.navy))
              : ListView.builder(
              controller: _scrollController,
              padding: EdgeInsets.fromLTRB(isCompact ? 16 : 24, 22, isCompact ? 16 : 24, 12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return _CoachBubble(message: _messages[index], doctorUsername: appState.assignedDoctorUsername!);
              },
            ),
          ),
        ),
        _MessageComposer(
          controller: _messageController,
          onSend: _sendMessage,
        ),
      ],
    );
  }
}

class _CoachHeader extends StatelessWidget {
  final String doctorUsername;
  const _CoachHeader({required this.doctorUsername});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [HealixColors.navy, HealixColors.navyDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              InkWell(
                onTap: () => Navigator.maybePop(context),
                borderRadius: BorderRadius.circular(20),
                child: const Padding(
                  padding: EdgeInsets.all(6),
                  child: Icon(Icons.arrow_back, color: Colors.white, size: 24),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Doctor Chat',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.12)),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                  child: const Icon(Icons.medical_services_outlined, color: HealixColors.navy, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctorUsername,
                        style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Assigned Clinician',
                        style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.circle, color: HealixColors.green, size: 8),
                      SizedBox(width: 6),
                      Text('Online', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CoachBubble extends StatelessWidget {
  const _CoachBubble({required this.message, required this.doctorUsername});

  final _CoachMessage message;
  final String doctorUsername;

  @override
  Widget build(BuildContext context) {
    final isMe = message.isMe;
    final screenWidth = MediaQuery.of(context).size.width;
    final maxBubbleWidth = screenWidth < 620 ? screenWidth * 0.72 : 430.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isMe) ...[
            const CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white,
              child: Icon(Icons.medical_services_outlined, color: HealixColors.navy, size: 18),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 4),
                    child: Text(
                      doctorUsername,
                      style: const TextStyle(color: HealixColors.navy, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                Container(
                  constraints: BoxConstraints(maxWidth: maxBubbleWidth),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: isMe 
                        ? const LinearGradient(
                            colors: [HealixColors.green, HealixColors.navyLight],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    color: isMe ? null : Colors.white.withOpacity(0.92),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isMe ? 16 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 16),
                    ),
                    border: isMe ? null : Border.all(color: HealixColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: HealixColors.navy.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(
                      color: isMe ? Colors.white : HealixColors.navy,
                      fontSize: 14,
                      height: 1.4,
                      fontWeight: isMe ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text(
                    message.time,
                    style: const TextStyle(
                      color: HealixColors.sub,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageComposer extends StatelessWidget {
  const _MessageComposer({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: HealixColors.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: HealixColors.navy.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TextField(
                  controller: controller,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => onSend(),
                  style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'Type a message...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    hintStyle: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: HealixColors.navy,
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                onPressed: onSend,
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoachMessage {
  const _CoachMessage({required this.text, required this.time, required this.isMe});

  final String text;
  final String time;
  final bool isMe;
}
