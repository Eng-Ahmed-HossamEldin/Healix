import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';

class SystemGradientHeader extends StatelessWidget {
  const SystemGradientHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.colors,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.fromLTRB(20, 24, 20, 24)),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: colors.first.withOpacity(0.12),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () => Navigator.maybePop(context),
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.arrow_back, color: Colors.white, size: 24),
            ),
          ),
          const SizedBox(width: 12),
          Icon(icon, color: Colors.white, size: AppResponsive.isTiny(context) ? 24 : 28),
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
                    color: Colors.white,
                    fontSize: AppResponsive.font(context, 20),
                    fontWeight: FontWeight.bold,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: AppResponsive.font(context, 13),
                    fontWeight: FontWeight.w500,
                    height: 1.25,
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

class SystemGradientInfoCard extends StatelessWidget {
  const SystemGradientInfoCard({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    required this.colors,
  });

  final IconData icon;
  final String title;
  final String message;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(16)),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: colors.last.withOpacity(0.12), blurRadius: 18, offset: const Offset(0, 8)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: AppResponsive.isTiny(context) ? 40 : 44,
            height: AppResponsive.isTiny(context) ? 40 : 44,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.18), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: Colors.white, size: AppResponsive.isTiny(context) ? 20 : 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.white, fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  maxLines: 5,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.white70, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.w500, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SystemPanel extends StatelessWidget {
  const SystemPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color = Colors.white,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: padding,
      color: color,
      radius: 20,
      child: child,
    );
  }
}

class SystemSectionTitle extends StatelessWidget {
  const SystemSectionTitle(this.title, {super.key, this.icon, this.iconColor});

  final String title;
  final IconData? icon;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, color: iconColor ?? HealixColors.navy, size: 20),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: HealixColors.navy,
              fontSize: AppResponsive.font(context, 16),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}

class SystemStatusPill extends StatelessWidget {
  const SystemStatusPill({super.key, required this.label, required this.color, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 12),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: color, fontSize: AppResponsive.font(context, 11), fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

class SystemInfoTile extends StatelessWidget {
  const SystemInfoTile({
    super.key,
    required this.title,
    required this.subtitle,
    this.leadingIcon,
    this.iconColor = HealixColors.navy,
    this.trailing,
    this.onTap,
    this.background = Colors.white,
  });

  final String title;
  final String subtitle;
  final IconData? leadingIcon;
  final Color iconColor;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color background;

  @override
  Widget build(BuildContext context) {
    final isWhiteBg = background == Colors.white;
    final tile = Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 14, vertical: 14)),
      decoration: BoxDecoration(
        color: isWhiteBg ? HealixColors.navy.withOpacity(0.04) : background, 
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isWhiteBg ? HealixColors.border : Colors.transparent),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (leadingIcon != null) ...[
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: iconColor.withOpacity(0.10), borderRadius: BorderRadius.circular(12)),
              child: Icon(leadingIcon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.w500, height: 1.3),
                ),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 10),
            ConstrainedBox(
              constraints: BoxConstraints(maxWidth: AppResponsive.isPhone(context) ? 128 : 170),
              child: Align(alignment: Alignment.centerRight, child: trailing!),
            ),
          ],
        ],
      ),
    );

    if (onTap == null) return tile;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: tile,
      ),
    );
  }
}

class SystemProgressBar extends StatelessWidget {
  const SystemProgressBar({super.key, required this.value, required this.color, this.height = 8});

  final double value;
  final Color color;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: LinearProgressIndicator(
        minHeight: height,
        value: value.clamp(0, 1).toDouble(),
        backgroundColor: HealixColors.border,
        valueColor: AlwaysStoppedAnimation<Color>(color),
      ),
    );
  }
}

class SystemTag extends StatelessWidget {
  const SystemTag(this.label, {super.key, this.color = Colors.white, this.textColor = HealixColors.navy});

  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color == Colors.white ? HealixColors.navy.withOpacity(0.06) : color, 
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color == Colors.white ? HealixColors.border : Colors.transparent),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(color: textColor, fontSize: AppResponsive.font(context, 11), fontWeight: FontWeight.bold),
      ),
    );
  }
}

class SystemActionButton extends StatelessWidget {
  const SystemActionButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onTap,
    this.filled = true,
    this.color = HealixColors.navy,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool filled;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final textColor = filled ? Colors.white : color;
    return SizedBox(
      height: 40,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 16, color: textColor),
        label: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          backgroundColor: filled ? color : Colors.white,
          foregroundColor: textColor,
          side: BorderSide(color: filled ? color : HealixColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: TextStyle(fontSize: AppResponsive.font(context, 13)),
        ),
      ),
    );
  }
}

class SystemRingProgress extends StatelessWidget {
  const SystemRingProgress({super.key, required this.value, required this.color, required this.center});

  final double value;
  final Color color;
  final Widget center;

  @override
  Widget build(BuildContext context) {
    final size = AppResponsive.isPhone(context) ? 180.0 : 230.0;
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size.square(size),
            painter: _RingPainter(value: value, color: color),
          ),
          Padding(padding: const EdgeInsets.all(24), child: Center(child: center)),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({required this.value, required this.color});

  final double value;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.075;
    final radius = (math.min(size.width, size.height) - stroke) / 2;
    final center = Offset(size.width / 2, size.height / 2);
    final background = Paint()
      ..color = HealixColors.border
      ..strokeWidth = stroke
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final foreground = Paint()
      ..color = color
      ..strokeWidth = stroke
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, background);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -math.pi / 2, 2 * math.pi * value.clamp(0, 1).toDouble(), false, foreground);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) => oldDelegate.value != value || oldDelegate.color != color;
}

class SystemLineChart extends StatelessWidget {
  const SystemLineChart({
    super.key,
    required this.values,
    required this.labels,
    this.color = HealixColors.navy,
    this.minY,
    this.maxY,
    this.height,
  });

  final List<double> values;
  final List<String> labels;
  final Color color;
  final double? minY;
  final double? maxY;
  final double? height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height ?? AppResponsive.chartHeight(context, min: 185, max: 260, factor: 0.52),
      width: double.infinity,
      child: CustomPaint(
        painter: _LineChartPainter(values: values, labels: labels, color: color, minY: minY, maxY: maxY),
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  const _LineChartPainter({required this.values, required this.labels, required this.color, this.minY, this.maxY});

  final List<double> values;
  final List<String> labels;
  final Color color;
  final double? minY;
  final double? maxY;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;
    final axisPaint = Paint()
      ..color = HealixColors.border
      ..strokeWidth = 1.2;
    final gridPaint = Paint()
      ..color = HealixColors.border.withOpacity(0.5)
      ..strokeWidth = 1;
    final linePaint = Paint()
      ..color = color
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final markerPaint = Paint()..color = Colors.white;
    final left = 44.0;
    final right = 12.0;
    final top = 16.0;
    final bottom = 34.0;
    final chartWidth = math.max(1.0, size.width - left - right);
    final chartHeight = math.max(1.0, size.height - top - bottom);
    final minValue = minY ?? values.reduce((a, b) => a < b ? a : b);
    final maxValue = maxY ?? values.reduce((a, b) => a > b ? a : b);
    final range = (maxValue - minValue).abs() < 0.001 ? 1.0 : maxValue - minValue;

    for (var i = 0; i <= 4; i++) {
      final y = top + chartHeight * i / 4;
      canvas.drawLine(Offset(left, y), Offset(size.width - right, y), gridPaint);
      final label = (maxValue - range * i / 4).round().toString();
      _drawText(canvas, label, Offset(4, y - 8), 12, HealixColors.sub, align: TextAlign.left);
    }
    canvas.drawLine(Offset(left, top), Offset(left, top + chartHeight), axisPaint);
    canvas.drawLine(Offset(left, top + chartHeight), Offset(size.width - right, top + chartHeight), axisPaint);

    final path = Path();
    for (var i = 0; i < values.length; i++) {
      final x = left + chartWidth * (values.length == 1 ? 0 : i / (values.length - 1));
      final y = top + chartHeight * (1 - ((values[i] - minValue) / range));
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(path, linePaint);
    for (var i = 0; i < values.length; i++) {
      final x = left + chartWidth * (values.length == 1 ? 0 : i / (values.length - 1));
      final y = top + chartHeight * (1 - ((values[i] - minValue) / range));
      canvas.drawCircle(Offset(x, y), 5, markerPaint);
      canvas.drawCircle(Offset(x, y), 4, Paint()..color = color);
      canvas.drawCircle(Offset(x, y), 2, Paint()..color = HealixColors.green);
      if (i < labels.length) {
        _drawText(canvas, labels[i], Offset(x - 24, top + chartHeight + 10), 12, HealixColors.sub, width: 48, align: TextAlign.center);
      }
    }
  }

  void _drawText(Canvas canvas, String text, Offset offset, double fontSize, Color color, {double width = 40, TextAlign align = TextAlign.center}) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: TextStyle(color: color, fontSize: fontSize, fontWeight: FontWeight.bold)),
      textDirection: TextDirection.ltr,
      maxLines: 1,
      textAlign: align,
    )..layout(maxWidth: width);
    painter.paint(canvas, offset);
  }

  @override
  bool shouldRepaint(covariant _LineChartPainter oldDelegate) => oldDelegate.values != values || oldDelegate.labels != labels || oldDelegate.color != color;
}

class SystemBarChart extends StatelessWidget {
  const SystemBarChart({
    super.key,
    required this.values,
    required this.labels,
    this.color = HealixColors.navyLight,
    this.maxY,
    this.height,
  });

  final List<double> values;
  final List<String> labels;
  final Color color;
  final double? maxY;
  final double? height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height ?? AppResponsive.chartHeight(context, min: 185, max: 260, factor: 0.52),
      width: double.infinity,
      child: CustomPaint(painter: _BarChartPainter(values: values, labels: labels, color: color, maxY: maxY)),
    );
  }
}

class _BarChartPainter extends CustomPainter {
  const _BarChartPainter({required this.values, required this.labels, required this.color, this.maxY});

  final List<double> values;
  final List<String> labels;
  final Color color;
  final double? maxY;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;
    final left = 40.0;
    final right = 10.0;
    final top = 14.0;
    final bottom = 32.0;
    final chartWidth = math.max(1.0, size.width - left - right);
    final chartHeight = math.max(1.0, size.height - top - bottom);
    final axisPaint = Paint()
      ..color = HealixColors.border
      ..strokeWidth = 1.2;
    final gridPaint = Paint()
      ..color = HealixColors.border.withOpacity(0.5)
      ..strokeWidth = 1;
    final limit = maxY ?? math.max(1.0, values.reduce((a, b) => a > b ? a : b));
    for (var i = 0; i <= 4; i++) {
      final y = top + chartHeight * i / 4;
      canvas.drawLine(Offset(left, y), Offset(size.width - right, y), gridPaint);
      final label = (limit - limit * i / 4).round().toString();
      _drawText(canvas, label, Offset(4, y - 8), 12, HealixColors.sub, width: 34);
    }
    canvas.drawLine(Offset(left, top), Offset(left, top + chartHeight), axisPaint);
    canvas.drawLine(Offset(left, top + chartHeight), Offset(size.width - right, top + chartHeight), axisPaint);

    final slot = chartWidth / values.length;
    final barWidth = math.min(54.0, slot * 0.68);
    final barPaint = Paint()..color = color;
    for (var i = 0; i < values.length; i++) {
      final height = chartHeight * (values[i] / limit).clamp(0, 1).toDouble();
      final x = left + slot * i + (slot - barWidth) / 2;
      final y = top + chartHeight - height;
      final rect = RRect.fromRectAndRadius(Rect.fromLTWH(x, y, barWidth, height), const Radius.circular(7));
      canvas.drawRRect(rect, barPaint);
      if (i < labels.length) {
        _drawText(canvas, labels[i], Offset(left + slot * i, top + chartHeight + 10), 12, HealixColors.sub, width: slot);
      }
    }
  }

  void _drawText(Canvas canvas, String text, Offset offset, double fontSize, Color color, {double width = 40}) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: TextStyle(color: color, fontSize: fontSize, fontWeight: FontWeight.bold)),
      textDirection: TextDirection.ltr,
      maxLines: 1,
      textAlign: TextAlign.center,
    )..layout(maxWidth: width);
    painter.paint(canvas, offset);
  }

  @override
  bool shouldRepaint(covariant _BarChartPainter oldDelegate) => oldDelegate.values != values || oldDelegate.labels != labels || oldDelegate.color != color;
}
