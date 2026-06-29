import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:healix_app/core/services/api_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/features/settings/screens/subscription_screen.dart';
import 'package:healix_app/features/health_tracking/screens/meal_plan.dart';
import 'package:healix_app/features/health_tracking/screens/exercise_plan.dart';
import 'package:healix_app/features/ai_and_coaching/screens/human_coach.dart';

class AiChatbot extends StatefulWidget {
  const AiChatbot({super.key});

  @override
  State<AiChatbot> createState() => _AiChatbotState();
}

class _AiChatbotState extends State<AiChatbot> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  int _tokens = 0;
  bool _tokensLoaded = false;

  final List<_ChatMessage> _chatItems = <_ChatMessage>[
    const _ChatMessage(
        text: "Hello! I'm your Healix AI health advisor. How can I help you today?",
        isMe: false),
  ];

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _loadTokens();
  }

  Future<void> _loadTokens() async {
    try {
      final res = await ApiService.get('/agent/tokens');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final remaining = (data['tokens_left'] ?? data['data']?['tokens_left'] ?? 0) as int? ?? 0;
        if (mounted) setState(() { _tokens = remaining; _tokensLoaded = true; });
      }
    } catch (_) {
      if (mounted) setState(() { _tokensLoaded = true; });
    }
  }

  Future<void> _loadHistory() async {
    try {
      final res = await ApiService.get('/agent/history');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'] as List;
        if (data.isNotEmpty) {
          setState(() {
            _chatItems.clear();
            _chatItems.add(const _ChatMessage(
                text: "Hello! I'm your Healix AI health advisor. How can I help you today?",
                isMe: false));
            for (var item in data) {
              _chatItems.add(_ChatMessage(
                text: item['message'] ?? '',
                isMe: item['role'] == 'user',
              ));
            }
          });
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollController.hasClients) {
              _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
            }
          });
        }
      }
    } catch (_) {}
  }

  void _openScreen(Widget screen) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void dispose() {
    _searchController.dispose();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage([String? text]) async {
    final msg = text ?? _controller.text.trim();
    if (msg.isEmpty) return;
    setState(() {
      _chatItems.add(_ChatMessage(isMe: true, text: msg));
      if (_tokens > 0) _tokens--;
    });
    _controller.clear();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });

    try {
      final res = await ApiService.post('/agent/chat', body: {'message': msg});
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final newTokens = (data['tokens_left'] ?? data['data']?['tokens_left']) as int?;
        final type = data['type'] as String?;
        final actionData = data['data'] as Map<String, dynamic>?;
        setState(() {
          _chatItems.add(_ChatMessage(
            text: data['message'] ?? '...',
            isMe: false,
            actionType: type != 'text' ? type : null,
            actionData: actionData,
          ));
          if (newTokens != null) _tokens = newTokens;
        });
      } else {
        setState(() {
          _chatItems.add(const _ChatMessage(text: 'Error connecting to AI.', isMe: false));
        });
      }
    } catch (_) {
      setState(() {
        _chatItems.add(const _ChatMessage(text: 'Network error.', isMe: false));
      });
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _handleQuickAction(String action) async {
    if (appState.subscriptionTier == 'default') {
      setState(() {
        _chatItems.add(_ChatMessage(text: action, isMe: true));
        _chatItems.add(const _ChatMessage(
            text: '⚠️ AI plan generation requires an AI Pro or Doctor subscription. Please upgrade your plan to unlock this feature!',
            isMe: false));
      });
      return;
    }

    if (action == 'Generate meal plan') {
      setState(() {
        _chatItems.add(const _ChatMessage(text: 'Please create a personalized meal plan for me based on my goals.', isMe: true));
        _chatItems.add(const _ChatMessage(text: '...', isMe: false));
      });
      try {
        final res = await ApiService.post('/agent/generate-meal-plan');
        if (mounted) setState(() { _chatItems.removeLast(); });
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final newTokens = (data['tokens_left'] ?? data['data']?['tokens_left']) as int?;
          if (data['success'] == true) {
            final planId = data['plan_id'];
            if (mounted) setState(() {
              _chatItems.add(_ChatMessage(
                text: '✅ I\'ve generated a 7-day personalized meal plan for you based on your calorie and macro targets!\n\nClick below to view it in your Meal Plans section.',
                isMe: false,
                actionType: 'meal_plan_created',
                actionData: {'plan_id': planId},
              ));
              if (newTokens != null) _tokens = newTokens;
            });
          } else {
            if (mounted) setState(() {
              _chatItems.add(_ChatMessage(text: data['error'] ?? 'Failed to generate meal plan. Make sure your Goals are set first in the Goals page.', isMe: false));
              if (newTokens != null) _tokens = newTokens;
            });
          }
        } else {
          if (mounted) setState(() {
            _chatItems.add(const _ChatMessage(text: 'Failed to generate meal plan.', isMe: false));
          });
        }
      } catch (_) {
        if (mounted) setState(() {
          if (_chatItems.last.text == '...') _chatItems.removeLast();
          _chatItems.add(const _ChatMessage(text: 'Network error generating plan.', isMe: false));
        });
      }
      return;
    }

    if (action == 'Generate workout plan') {
      setState(() {
        _chatItems.add(const _ChatMessage(text: 'Please create a personalized workout plan for me based on my fitness goals.', isMe: true));
        _chatItems.add(const _ChatMessage(text: '...', isMe: false));
      });
      try {
        final res = await ApiService.post('/agent/generate-exercise-plan');
        if (mounted) setState(() { _chatItems.removeLast(); });
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final newTokens = (data['tokens_left'] ?? data['data']?['tokens_left']) as int?;
          if (data['success'] == true) {
            final planId = data['exercise_plan_id'];
            if (mounted) setState(() {
              _chatItems.add(_ChatMessage(
                text: '✅ I\'ve generated a 5-day personalized workout plan for you!\n\nClick below to view it in your Exercise Plans section.',
                isMe: false,
                actionType: 'exercise_plan_created',
                actionData: {'exercise_plan_id': planId},
              ));
              if (newTokens != null) _tokens = newTokens;
            });
          } else {
            if (mounted) setState(() {
              _chatItems.add(_ChatMessage(text: data['error'] ?? 'Failed to generate workout plan. Make sure your Goals are set first in the Goals page.', isMe: false));
              if (newTokens != null) _tokens = newTokens;
            });
          }
        } else {
          if (mounted) setState(() {
            _chatItems.add(const _ChatMessage(text: 'Failed to generate workout plan.', isMe: false));
          });
        }
      } catch (_) {
        if (mounted) setState(() {
          if (_chatItems.last.text == '...') _chatItems.removeLast();
          _chatItems.add(const _ChatMessage(text: 'Network error generating plan.', isMe: false));
        });
      }
      return;
    }

    _sendMessage(action);
  }

  Future<void> _clearChat() async {
    try {
      await ApiService.delete('/agent/history');
    } catch (_) {}
    setState(() {
      _chatItems.clear();
      _chatItems.add(const _ChatMessage(
          text: "Hello! I'm your Healix AI health advisor. How can I help you today?",
          isMe: false));
    });
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'AI Assistant',
      selectedItem: 'AI Assistant',
      searchController: _searchController,
      openScreen: _openScreen,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final panelHeight =
              (MediaQuery.of(context).size.height - 170).clamp(540.0, 920.0).toDouble();
          return SizedBox(
            height: panelHeight,
            width: double.infinity,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                color: Colors.white.withOpacity(0.92),
                border: Border.all(color: HealixColors.border, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: HealixColors.navy.withOpacity(0.08),
                    blurRadius: 28,
                    offset: const Offset(0, 14),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: _buildBody(),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBody() {
    if (appState.subscriptionTier == 'default') {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.smart_toy_outlined, size: 64, color: HealixColors.navy),
            const SizedBox(height: 16),
            const Text('AI Pro Required',
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: HealixColors.navy)),
            const SizedBox(height: 8),
            const Text('Upgrade to unlock personalized AI features.',
                style: TextStyle(color: HealixColors.sub)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => _openScreen(const SubscriptionScreen()),
              style: ElevatedButton.styleFrom(backgroundColor: HealixColors.navy),
              child: const Text('View Plans', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        _AiHeader(tokens: _tokens, tokensLoaded: _tokensLoaded, onClearChat: _clearChat),
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            itemCount: _chatItems.length,
            itemBuilder: (context, index) => _ChatBubble(message: _chatItems[index]),
          ),
        ),
        _QuickActions(onTap: _handleQuickAction),
        _MessageComposer(controller: _controller, onSend: () => _sendMessage()),
      ],
    );
  }
}

// ─── Header ──────────────────────────────────────────────────────────────────

class _AiHeader extends StatelessWidget {
  const _AiHeader({required this.tokens, required this.tokensLoaded, required this.onClearChat});
  final int tokens;
  final bool tokensLoaded;
  final VoidCallback onClearChat;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [HealixColors.navy, HealixColors.navyLight],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: HealixColors.green.withOpacity(0.22),
            child: const Icon(Icons.smart_toy_outlined, color: HealixColors.green),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Health Advisor',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: AppResponsive.font(context, 17),
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.generating_tokens,
                        color: HealixColors.orange, size: 13),
                    const SizedBox(width: 4),
                    Text(
                      tokensLoaded ? '$tokens/50 tokens' : 'Loading...',
                      style: TextStyle(
                          color: Colors.white70,
                          fontSize: AppResponsive.font(context, 12))),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.white70),
            onPressed: onClearChat,
            tooltip: 'Clear Chat',
          ),
        ],
      ),
    );
  }
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.onTap});
  final void Function(String value) onTap;

  @override
  Widget build(BuildContext context) {
    const actions = [
      'Generate meal plan',
      'Generate workout plan',
      'Check my calories',
      'Find a doctor',
      'Analyze progress'
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions',
              style: TextStyle(
                  color: HealixColors.navy,
                  fontSize: AppResponsive.font(context, 13),
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 7,
            runSpacing: 6,
            children: actions
                .map((label) =>
                    _QuickActionChip(label: label, onTap: () => onTap(label)))
                .toList(),
          ),
        ],
      ),
    );
  }
}

// ─── Message Composer ─────────────────────────────────────────────────────────

class _MessageComposer extends StatelessWidget {
  const _MessageComposer({required this.controller, required this.onSend});
  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.95),
          border: Border(top: BorderSide(color: HealixColors.border)),
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                style: const TextStyle(fontSize: 14, color: HealixColors.text),
                decoration: InputDecoration(
                  hintText: 'Ask me anything about your health...',
                  hintStyle: const TextStyle(color: HealixColors.sub, fontSize: 13),
                  filled: true,
                  fillColor: HealixColors.card2,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: HealixColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: HealixColors.navyLight, width: 1.5),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                  color: HealixColors.navyLight,
                  borderRadius: BorderRadius.circular(12)),
              child: IconButton(
                  onPressed: onSend,
                  icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});
  final _ChatMessage message;

  Widget _buildActionCard(BuildContext context, String actionType, Map<String, dynamic>? actionData) {
    IconData icon;
    Color color;
    String title;
    String sub;
    String buttonText;
    VoidCallback onPressed;

    if (actionType == 'meal_plan_created' || actionType == 'meal_plan_modified') {
      icon = Icons.restaurant_outlined;
      color = HealixColors.green;
      title = actionType == 'meal_plan_created' ? 'Meal Plan Created!' : 'Meal Plan Updated!';
      sub = 'Your personalized diet plan is ready';
      buttonText = 'View Plan';
      onPressed = () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MealPlan()));
    } else if (actionType == 'exercise_plan_created' || actionType == 'exercise_plan_modified') {
      icon = Icons.fitness_center_outlined;
      color = HealixColors.orange;
      title = actionType == 'exercise_plan_created' ? 'Workout Plan Created!' : 'Workout Plan Updated!';
      sub = 'Your personalized workout plan is ready';
      buttonText = 'View Plan';
      onPressed = () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ExercisePlan()));
    } else if (actionType == 'doctor_linked') {
      icon = Icons.medical_services_outlined;
      color = Colors.purple;
      title = 'Doctor Connected!';
      sub = 'You can now chat with your assigned doctor';
      buttonText = 'Open Chat';
      onPressed = () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HumanCoach()));
    } else {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: HealixColors.navy)),
                const SizedBox(height: 2),
                Text(sub, style: const TextStyle(fontSize: 10, color: HealixColors.sub), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: 10),
          ElevatedButton(
            onPressed: onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: Text(buttonText, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMe = message.isMe;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 15,
              backgroundColor: HealixColors.green.withOpacity(0.2),
              child: const Icon(Icons.smart_toy_outlined, color: HealixColors.green, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4, left: 2),
                    child: Text('Healix AI',
                        style: const TextStyle(
                            color: HealixColors.green,
                            fontSize: 10,
                            fontWeight: FontWeight.w700)),
                  ),
                Container(
                  constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * (isMe ? 0.62 : 0.72)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: isMe
                        ? const LinearGradient(
                            colors: [HealixColors.navyLight, HealixColors.navy],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    color: isMe ? null : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isMe ? 16 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 16),
                    ),
                    border:
                        isMe ? null : Border.all(color: HealixColors.border, width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(
                      color: isMe ? Colors.white : HealixColors.text,
                      fontSize: AppResponsive.font(context, 14),
                      height: 1.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                if (message.actionType != null) ...[
                  const SizedBox(height: 8),
                  _buildActionCard(context, message.actionType!, message.actionData),
                ],
              ],
            ),
          ),
          if (isMe) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 15,
              backgroundColor: HealixColors.navy.withOpacity(0.15),
              child: const Icon(Icons.person_outline, color: HealixColors.navy, size: 16),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Quick Action Chip ────────────────────────────────────────────────────────

class _QuickActionChip extends StatelessWidget {
  const _QuickActionChip({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: HealixColors.card2,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: HealixColors.border),
          ),
          child: Text(label,
              style: TextStyle(
                  color: HealixColors.navy,
                  fontSize: AppResponsive.font(context, 12),
                  fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}

// ─── Model ────────────────────────────────────────────────────────────────────

class _ChatMessage {
  const _ChatMessage({required this.text, required this.isMe, this.actionType, this.actionData});
  final String text;
  final bool isMe;
  final String? actionType;
  final Map<String, dynamic>? actionData;
}
