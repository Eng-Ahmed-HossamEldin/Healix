import 'package:flutter/material.dart';
import 'package:healix_app/core/services/subscription_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = false;
  Map<String, dynamic>? _myRequest;

  @override
  void initState() {
    super.initState();
    _fetchMyRequest();
  }

  Future<void> _fetchMyRequest() async {
    setState(() => _isLoading = true);
    try {
      final request = await SubscriptionService.getMyRequest();
      if (!mounted) return;
      setState(() => _myRequest = request);
    } catch (_) {
      if (!mounted) return;
      AppActions.showSnack(context, 'Could not load subscription request status',
          color: Colors.red.shade700, icon: Icons.error_outline);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openScreen(Widget screen) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  Future<void> _requestUpgrade(String tier, {String? doctorUsername}) async {
    final label = _tierLabel(tier);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text('Request $label?'),
        content: Text(
            'Submit a request to upgrade to the $label plan? Admin will review and activate it shortly.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Submit Request')),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final ok = await SubscriptionService.requestUpgrade(tier,
          doctorUsername: doctorUsername);
      if (ok) {
        if (!mounted) return;
        AppActions.showSnack(context, '$label plan request submitted',
            icon: Icons.check_circle_outline);
        await _fetchMyRequest();
      } else {
        if (!mounted) return;
        AppActions.showSnack(context, 'Failed to submit request',
            color: Colors.red.shade700, icon: Icons.error_outline);
      }
    } catch (_) {
      if (!mounted) return;
      AppActions.showSnack(context, 'Network error',
          color: Colors.red.shade700, icon: Icons.error_outline);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _tierLabel(String tier) =>
      tier == 'pro' ? 'AI Pro' : tier == 'doctor' ? 'Doctor' : 'Free';

  @override
  Widget build(BuildContext context) {
    final hasPending =
        _myRequest != null && _myRequest!['status'] == 'pending';
    final tier = appState.subscriptionTier;

    return FeaturePageFrame(
      title: 'Healix Plans',
      selectedItem: 'Plans',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
              // ── Header ─────────────────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [HealixColors.navy, HealixColors.navyDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: HealixColors.navy.withOpacity(0.15),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.workspace_premium_outlined,
                            color: Colors.white, size: 28),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Healix Plans',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Choose the plan that fits your health journey. Upgrade requests are reviewed by our admin team within 24 hours.',
                      style: TextStyle(
                          color: Colors.white70, fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline,
                              color: Colors.white70, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Current Plan: ${_tierLabel(tier)}',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ── Pending request banner ──────────────────────────
              if (hasPending)
                Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    border: Border.all(color: Colors.orange.shade200),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.hourglass_empty, color: Colors.orange),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Upgrade Request Pending',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.orange)),
                            Text(
                              'You requested the ${_tierLabel(_myRequest!['requested_tier'])} plan. Admin will review shortly.',
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.black54),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // ── Rejected request banner ─────────────────────────
              if (_myRequest != null && _myRequest!['status'] == 'rejected')
                Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    border: Border.all(color: Colors.red.shade200),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.cancel_outlined, color: Colors.red),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Request Rejected',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red)),
                            const SizedBox(height: 4),
                            Text(
                              _myRequest!['admin_note']
                                          ?.toString()
                                          .isNotEmpty ==
                                      true
                                  ? 'Reason: ${_myRequest!['admin_note']}'
                                  : 'Your upgrade request was not approved. You may submit a new request.',
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.black54,
                                  height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // ── Free Plan ───────────────────────────────────────
              _PlanCard(
                title: 'Free',
                price: '\$0 / month',
                tagline: 'Start your health journey',
                color: Colors.orange,
                isActive: tier == 'default',
                buttonText:
                    tier == 'default' ? 'Active Plan' : 'Current: Free',
                onTap: null,
                features: const [
                  'Food & calorie logging',
                  'Water & sleep tracking',
                  'Step counter',
                  'Standard meal plans',
                  'Standard exercise plans',
                  'Community & challenges',
                  'Recipe builder',
                ],
              ),
              const SizedBox(height: 16),

              // ── AI Pro Plan ─────────────────────────────────────
              _PlanCard(
                title: 'AI Pro',
                price: '\$9.99 / month',
                tagline: 'Powered by artificial intelligence',
                color: const Color(0xFF1A7AD4),
                isActive: tier == 'pro',
                isMostPopular: true,
                buttonText: tier == 'pro'
                    ? 'Active Plan'
                    : (hasPending &&
                            _myRequest!['requested_tier'] == 'pro'
                        ? 'Request Pending'
                        : 'Request AI Upgrade'),
                onTap: tier == 'pro' || hasPending
                    ? null
                    : () => _requestUpgrade('pro'),
                features: const [
                  'Everything in Free',
                  'AI-generated personalised meal plans',
                  'AI-generated personalised exercise plans',
                  'AI chatbot health assistant',
                  'Smart nutrition recommendations',
                  'Advanced analytics & insights',
                ],
              ),
              const SizedBox(height: 16),

              // ── Doctor Plan ─────────────────────────────────────
              _PlanCard(
                title: 'Doctor',
                price: '\$29.99 / month',
                tagline: 'Real human medical supervision',
                color: Colors.purple,
                isActive: tier == 'doctor',
                buttonText: tier == 'doctor'
                    ? 'Active Plan'
                    : (hasPending &&
                            _myRequest!['requested_tier'] == 'doctor'
                        ? 'Request Pending'
                        : 'Request Doctor Upgrade'),
                onTap: tier == 'doctor' || hasPending
                    ? null
                    : () => _requestUpgrade('doctor'),
                features: const [
                  'Everything in AI Pro',
                  'Assigned human doctor',
                  'Real-time doctor chat',
                  'Personalised medical meal plan',
                  'Personalised medical exercise plan',
                  'Medical record management',
                  'Doctor-adjusted health targets',
                ],
              ),

              const SizedBox(height: 24),
              // Footer note
              const Center(
                child: Text(
                  'Upgrade requests are reviewed within 24 hours.\nNo automatic charges — admin activates your plan.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: HealixColors.sub, fontSize: 12, height: 1.5),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
          ),
          if (_isLoading)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}

// ── Plan Card ──────────────────────────────────────────────────────────────────

class _PlanCard extends StatelessWidget {
  final String title;
  final String price;
  final String tagline;
  final Color color;
  final bool isActive;
  final bool isMostPopular;
  final String buttonText;
  final VoidCallback? onTap;
  final List<String> features;

  const _PlanCard({
    required this.title,
    required this.price,
    required this.tagline,
    required this.color,
    required this.isActive,
    this.isMostPopular = false,
    required this.buttonText,
    required this.onTap,
    required this.features,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isActive ? color.withOpacity(0.05) : Colors.white,
        border: Border.all(
            color: isActive ? color : Colors.grey.shade300,
            width: isActive ? 2 : 1),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          if (!isActive)
            BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(title,
                            style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: color)),
                        if (isMostPopular) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: color,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('Most Popular',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(tagline,
                        style: const TextStyle(
                            color: HealixColors.sub,
                            fontSize: 13,
                            fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(price,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: color)),
            ],
          ),

          if (isActive) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, color: color, size: 14),
                  const SizedBox(width: 5),
                  Text('Your current plan',
                      style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),
          const Divider(height: 1, color: HealixColors.border),
          const SizedBox(height: 14),

          // Features
          ...features.map((feature) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      feature.startsWith('Everything')
                          ? Icons.star_rounded
                          : Icons.check_rounded,
                      color: feature.startsWith('Everything')
                          ? Colors.amber
                          : color,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        feature,
                        style: const TextStyle(
                            color: HealixColors.navy,
                            fontSize: 13,
                            height: 1.35,
                            fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              )),

          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    onTap == null ? Colors.grey.shade200 : color,
                foregroundColor:
                    onTap == null ? Colors.black45 : Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(buttonText,
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
