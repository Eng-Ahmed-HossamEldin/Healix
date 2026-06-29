import 'package:flutter/material.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/responsive.dart';

class AppFeatureScaffold extends StatelessWidget {
  static const Color background = HealixColors.bg;
  static const Color primary = HealixColors.navy;
  static const Color secondaryText = HealixColors.sub;

  final String title;
  final String subtitle;
  final IconData icon;
  final List<Widget> children;
  final List<Widget>? appBarActions;
  final FloatingActionButton? floatingActionButton;

  const AppFeatureScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.children,
    this.appBarActions,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: background,
      appBar: AppBar(
        backgroundColor: Colors.white.withOpacity(0.88),
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: primary, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: primary),
        actions: appBarActions,
      ),
      floatingActionButton: floatingActionButton,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF8FBEF),
              Color(0xFFEEF5DC),
            ],
          ),
        ),
        child: SafeArea(
          child: ListView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: AppResponsive.pagePadding(context),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 680),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _HeaderCard(title: title, subtitle: subtitle, icon: icon),
                      const SizedBox(height: 16),
                      ..._withSpacing(children),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _withSpacing(List<Widget> items) {
    final List<Widget> widgets = [];
    for (var i = 0; i < items.length; i++) {
      widgets.add(items[i]);
      if (i != items.length - 1) widgets.add(const SizedBox(height: 16));
    }
    return widgets;
  }
}

class _HeaderCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const _HeaderCard({required this.title, required this.subtitle, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: HealixColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.08),
            blurRadius: 32,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: AppResponsive.isTiny(context) ? 44 : 52,
            height: AppResponsive.isTiny(context) ? 44 : 52,
            decoration: BoxDecoration(
              color: AppFeatureScaffold.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: AppFeatureScaffold.primary, size: AppResponsive.isTiny(context) ? 24 : 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppFeatureScaffold.primary,
                    fontSize: AppResponsive.font(context, 20),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppFeatureScaffold.secondaryText,
                    fontSize: AppResponsive.font(context, 13),
                    height: 1.4,
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

class FeatureCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget child;
  final String? actionLabel;
  final VoidCallback? onAction;

  const FeatureCard({super.key, required this.title, required this.child, this.subtitle, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(16)),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.88),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppFeatureScaffold.primary,
                        fontSize: AppResponsive.font(context, 16),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: AppFeatureScaffold.secondaryText,
                          fontSize: AppResponsive.font(context, 12),
                          height: 1.35,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (actionLabel != null && onAction != null)
                Flexible(
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(onPressed: onAction, child: Text(actionLabel!, maxLines: 1, overflow: TextOverflow.ellipsis)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class FeatureMetricRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  const FeatureMetricRow({super.key, required this.label, required this.value, required this.icon, this.color});

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppFeatureScaffold.primary;
    return Container(
      padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 12, vertical: 12)),
      decoration: BoxDecoration(color: AppFeatureScaffold.background, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: accent.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: accent, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: AppFeatureScaffold.primary, fontWeight: FontWeight.w600, fontSize: AppResponsive.font(context, 14)),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: TextStyle(color: AppFeatureScaffold.secondaryText, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class FeatureActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? trailingText;
  final VoidCallback? onTap;
  final bool unread;

  const FeatureActionTile({super.key, required this.icon, required this.title, required this.subtitle, this.trailingText, this.onTap, this.unread = false});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppFeatureScaffold.background,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 12, vertical: 12)),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: AppFeatureScaffold.primary, size: 20),
              ),
              const SizedBox(width: 12),
              if (unread) ...[
                Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFA6CE39), shape: BoxShape.circle)),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: AppFeatureScaffold.primary, fontSize: AppResponsive.font(context, 14), fontWeight: unread ? FontWeight.w900 : FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: AppFeatureScaffold.secondaryText, fontSize: AppResponsive.font(context, 12), height: 1.35),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  trailingText ?? 'Open',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: AppFeatureScaffold.primary, fontSize: AppResponsive.font(context, 12), fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: AppFeatureScaffold.primary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
