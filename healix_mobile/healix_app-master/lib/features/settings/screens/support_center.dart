import 'package:flutter/material.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/features/ai_and_coaching/screens/ai_chatbot.dart';
import 'package:healix_app/features/ai_and_coaching/screens/human_coach.dart';
import 'settings_widgets.dart';

class SupportCenter extends StatefulWidget {
  const SupportCenter({super.key});

  @override
  State<SupportCenter> createState() => _SupportCenterState();
}

class _SupportCenterState extends State<SupportCenter> {
  final TextEditingController _searchController = TextEditingController();

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Support Center',
      selectedItem: 'Support Center',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsHeader(
            title: 'Support Center',
            subtitle: 'We are here to help',
            icon: Icons.help_outline,
            colors: [Color(0xFF2F80FF), Color(0xFFBB3DFF)],
          ),
          Container(
            width: double.infinity,
            padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
            color: HealixColors.bg,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SupportSearchField(),
                const SizedBox(height: 18),
                ResponsiveWrapGrid(
                  minTileWidth: 230,
                  maxColumns: 2,
                  spacing: 16,
                  runSpacing: 16,
                  children: [
                    _SupportActionCard(icon: Icons.auto_awesome_outlined, title: 'Chat with AI', subtitle: 'Get instant answers', colors: const [Color(0xFF7C58FF), Color(0xFF4B79FF)], onTap: () => _openScreen(const AiChatbot())),
                    _SupportActionCard(icon: Icons.chat_bubble_outline, title: 'Contact Human Coach', subtitle: 'Personal support', colors: const [Color(0xFF10B6B1), Color(0xFF00A6D6)], onTap: () => _openScreen(const HumanCoach())),
                  ],
                ),
                const SizedBox(height: 18),
                const _FAQPanel(),
                const SizedBox(height: 18),
                const _QuickLinksPanel(),
                const SizedBox(height: 18),
                const _EmailSupportPanel(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SupportSearchField extends StatelessWidget {
  const _SupportSearchField();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: TextField(
        textInputAction: TextInputAction.search,
        onSubmitted: (value) {
          final query = value.trim();
          if (query.isEmpty) return;
          AppActions.showInfo(context, title: 'Support search', message: 'Showing help results for "$query".', icon: Icons.search);
        },
        decoration: InputDecoration(
          hintText: 'Search for help...',
          hintStyle: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w600),
          prefixIcon: const Icon(Icons.search, color: HealixColors.sub),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        ),
      ),
    );
  }
}

class _SupportActionCard extends StatelessWidget {
  const _SupportActionCard({required this.icon, required this.title, required this.subtitle, required this.colors, required this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final List<Color> colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(gradient: LinearGradient(colors: colors), borderRadius: BorderRadius.circular(14)),
              child: Icon(icon, color: Colors.white, size: 27),
            ),
            const SizedBox(height: 28),
            Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: const Color(0xFF202534), fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}

class _FAQPanel extends StatelessWidget {
  const _FAQPanel();

  @override
  Widget build(BuildContext context) {
    const items = [
      ('How do I track my meals?', 'Food Logging'),
      ('Can I sync with my smartwatch?', 'Devices'),
      ('How is my BMI calculated?', 'Health Metrics'),
      ('What are the subscription plans?', 'Billing'),
    ];
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Frequently Asked Questions'),
          const SizedBox(height: 18),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: SettingsInfoTile(
                  title: item.$1,
                  subtitle: item.$2,
                  trailing: const Icon(Icons.chevron_right, color: HealixColors.sub),
                  onTap: () => AppActions.showInfo(context, title: item.$1, message: _answerFor(item.$1), icon: Icons.help_outline),
                ),
              )),
        ],
      ),
    );
  }
}

String _answerFor(String question) {
  switch (question) {
    case 'How do I track my meals?':
      return 'Open Food Logging, add your meal details, then save the entry. Your calories and macros update automatically.';
    case 'Can I sync with my smartwatch?':
      return 'Go to Device Integration, choose your device provider, and tap Connect. Synced steps, heart rate, sleep, and calories will appear in the dashboard.';
    case 'How is my BMI calculated?':
      return 'BMI is calculated using weight divided by height squared. The BMI Tracking screen also shows your category and monthly trend.';
    default:
      return 'Plans and billing details are available in the account area. You can review plan benefits, invoices, and subscription status from there.';
  }
}

class _QuickLinksPanel extends StatelessWidget {
  const _QuickLinksPanel();

  @override
  Widget build(BuildContext context) {
    const links = ['Getting Started Guide', 'Privacy Policy', 'Terms of Service', 'Community Guidelines'];
    return SettingsPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsSectionTitle('Quick Links'),
          const SizedBox(height: 18),
          ...links.map((link) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: SettingsInfoTile(title: link, trailing: const Icon(Icons.chevron_right, color: HealixColors.sub), onTap: () => AppActions.showInfo(context, title: link, message: '$link opened in the Help Center.', icon: Icons.article_outlined)),
              )),
        ],
      ),
    );
  }
}

class _EmailSupportPanel extends StatelessWidget {
  const _EmailSupportPanel();

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => AppActions.showSnack(context, 'Support email copied', icon: Icons.email_outlined),
        child: Container(
          width: double.infinity,
          padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [const Color(0xFFEFF6FF), const Color(0xFFFFF2FB).withOpacity(0.9)]),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 14, offset: const Offset(0, 6))],
          ),
          child: Row(
            children: [
              const Icon(Icons.email_outlined, color: Color(0xFF2F80FF), size: 26),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Email Support', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: const Color(0xFF202534), fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w900)),
                    const SizedBox(height: 5),
                    Text('support@healix.com', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
