import 'dart:math' as math;

import 'package:flutter/material.dart';

class AppResponsive {
  const AppResponsive._();

  static double width(BuildContext context) => MediaQuery.sizeOf(context).width;

  static bool isTiny(BuildContext context) => width(context) < 360;
  static bool isPhone(BuildContext context) => width(context) < 600;
  static bool isTablet(BuildContext context) => width(context) >= 600 && width(context) < 1024;

  static EdgeInsets pagePadding(BuildContext context) {
    final w = width(context);
    if (w < 340) return const EdgeInsets.fromLTRB(10, 10, 10, 18);
    if (w < 390) return const EdgeInsets.fromLTRB(12, 12, 12, 22);
    if (w < 600) return const EdgeInsets.fromLTRB(16, 14, 16, 24);
    return const EdgeInsets.fromLTRB(20, 18, 20, 28);
  }

  static EdgeInsets scalePadding(BuildContext context, EdgeInsets padding) {
    final w = width(context);
    if (w < 340) return padding * 0.70;
    if (w < 390) return padding * 0.82;
    if (w < 430) return padding * 0.90;
    return padding;
  }

  static double font(BuildContext context, double size) {
    final w = width(context);
    if (w < 340) return math.max(10, size - 2.5).toDouble();
    if (w < 390) return math.max(10, size - 1.5).toDouble();
    if (w < 430) return math.max(10, size - 0.75).toDouble();
    return size;
  }

  static double chartHeight(BuildContext context, {double min = 185, double max = 280, double factor = 0.58}) {
    final calculated = width(context) * factor;
    return calculated.clamp(min, max).toDouble();
  }

  static int columns(double maxWidth, {double minTileWidth = 210, int maxColumns = 4}) {
    if (maxWidth <= 0) return 1;
    final raw = (maxWidth / minTileWidth).floor();
    return raw.clamp(1, maxColumns).toInt();
  }
}

class ResponsiveWrapGrid extends StatelessWidget {
  const ResponsiveWrapGrid({
    super.key,
    required this.children,
    this.minTileWidth = 220,
    this.maxColumns = 4,
    this.spacing = 14,
    this.runSpacing = 14,
  });

  final List<Widget> children;
  final double minTileWidth;
  final int maxColumns;
  final double spacing;
  final double runSpacing;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = AppResponsive.columns(
          constraints.maxWidth,
          minTileWidth: minTileWidth,
          maxColumns: maxColumns,
        );
        final itemWidth = cols == 1
            ? constraints.maxWidth
            : (constraints.maxWidth - (spacing * (cols - 1))) / cols;

        return Wrap(
          spacing: spacing,
          runSpacing: runSpacing,
          children: [
            for (final child in children)
              SizedBox(width: itemWidth, child: child),
          ],
        );
      },
    );
  }
}
