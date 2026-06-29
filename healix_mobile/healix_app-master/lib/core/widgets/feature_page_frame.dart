import 'package:flutter/material.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/core/widgets/shared_app_bar.dart';

import '../../features/dashboard/presentation/screens/custom_drawer_view.dart';

class FeaturePageFrame extends StatefulWidget {
  const FeaturePageFrame({
    super.key,
    required this.title,
    required this.child,
    required this.searchController,
    required this.openScreen,
    this.selectedItem = 'Dashboard',
    this.actions,
    this.onRefresh,
  });

  final String title;
  final Widget child;
  final List<Widget>? actions;
  final String selectedItem;
  final Future<void> Function()? onRefresh;

  final TextEditingController searchController;
  final void Function(Widget screen) openScreen;

  @override
  State<FeaturePageFrame> createState() => _FeaturePageFrameState();
}

class _FeaturePageFrameState extends State<FeaturePageFrame> {
  late String _selectedItem;

  @override
  void initState() {
    super.initState();
    _selectedItem = widget.selectedItem;
  }

  @override
  void didUpdateWidget(covariant FeaturePageFrame oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedItem != widget.selectedItem) {
      _selectedItem = widget.selectedItem;
    }
  }

  void _openNavigationMenu() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => Scaffold(
          backgroundColor: HealixColors.bg,
          body: SafeArea(
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: CustomDrawerView(
                selectedItem: _selectedItem,
                onMenuItemClicked: (label) {
                  if (!mounted) return;
                  setState(() => _selectedItem = label);
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildListView(double maxContentWidth, EdgeInsets pagePadding) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: pagePadding,
      children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxContentWidth),
            child: widget.child,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final pagePadding = AppResponsive.pagePadding(context);
    final screenWidth = MediaQuery.sizeOf(context).width;
    final maxContentWidth = screenWidth >= 1200 ? 1100.0 : 980.0;

    return Scaffold(
      backgroundColor: HealixColors.bg,
      appBar: SharedAppBar(
        searchController: widget.searchController,
        openScreen: widget.openScreen,
        onMenuPressed: _openNavigationMenu,
      ),
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
          child: widget.onRefresh != null
              ? RefreshIndicator(
                  color: HealixColors.navy,
                  onRefresh: widget.onRefresh!,
                  child: _buildListView(maxContentWidth, pagePadding),
                )
              : _buildListView(maxContentWidth, pagePadding),
        ),
      ),
    );
  }
}

class FeatureSectionCard extends StatelessWidget {
  const FeatureSectionCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color = Colors.white,
    this.radius = 24,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color color;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, padding),
      decoration: BoxDecoration(
        color: color == Colors.white ? Colors.white.withOpacity(0.88) : color,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: HealixColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
  }
}

class FeatureMiniStatCard extends StatelessWidget {
  const FeatureMiniStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.change,
    required this.icon,
  });

  final String title;
  final String value;
  final String change;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(18),
      radius: 22,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: HealixColors.navy, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: HealixColors.sub,
                    fontSize: AppResponsive.font(context, 15),
                    fontWeight: FontWeight.w500,
                    height: 1.25,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: HealixColors.navy,
              fontSize: AppResponsive.font(context, 20),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            change,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: HealixColors.green,
              fontSize: AppResponsive.font(context, 13),
              fontWeight: FontWeight.w700,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}
