import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';

class SettingsHeader extends StatelessWidget {
  const SettingsHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.colors = const [HealixColors.navy, HealixColors.navyDark],
    this.trailing,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> colors;
  final Widget? trailing;

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
                  maxLines: 3,
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
          if (trailing != null) ...[
            const SizedBox(width: 12),
            Flexible(child: Align(alignment: Alignment.topRight, child: trailing!)),
          ],
        ],
      ),
    );
  }
}

class SettingsSurface extends StatelessWidget {
  const SettingsSurface({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.transparent,
      ),
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _withSpacing(children, 16),
      ),
    );
  }
}

class SettingsPanel extends StatelessWidget {
  const SettingsPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color = Colors.white,
    this.radius = 20,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color color;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: padding,
      color: color,
      radius: radius,
      child: child,
    );
  }
}

class SettingsSectionTitle extends StatelessWidget {
  const SettingsSectionTitle(this.title, {super.key, this.icon, this.iconColor});

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

class SettingsInfoTile extends StatelessWidget {
  const SettingsInfoTile({
    super.key,
    required this.title,
    this.subtitle,
    this.leadingIcon,
    this.iconColor = HealixColors.navy,
    this.trailing,
    this.background = Colors.white,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final IconData? leadingIcon;
  final Color iconColor;
  final Widget? trailing;
  final Color background;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isWhiteBg = background == Colors.white;
    return Material(
      color: isWhiteBg ? HealixColors.navy.withOpacity(0.04) : background,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 14, vertical: 14)),
          decoration: BoxDecoration(
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
                  decoration: BoxDecoration(color: iconColor.withOpacity(0.11), borderRadius: BorderRadius.circular(12)),
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
                      style: TextStyle(
                        color: HealixColors.navy,
                        fontSize: AppResponsive.font(context, 14),
                        fontWeight: FontWeight.bold,
                        height: 1.2,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: HealixColors.sub,
                          fontSize: AppResponsive.font(context, 13),
                          fontWeight: FontWeight.bold,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 10),
                ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: AppResponsive.isPhone(context) ? 132 : 190),
                  child: Align(alignment: Alignment.centerRight, child: trailing!),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class SettingsTextField extends StatelessWidget {
  const SettingsTextField({
    super.key,
    required this.label,
    this.initialValue = '',
    this.hintText,
    this.keyboardType,
    this.maxLines = 1,
    this.suffixText,
    this.controller,
    this.onChanged,
  });

  final String label;
  final String initialValue;
  final String? hintText;
  final TextInputType? keyboardType;
  final int maxLines;
  final String? suffixText;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: HealixColors.navy,
            fontSize: AppResponsive.font(context, 13),
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          initialValue: controller == null ? initialValue : null,
          onChanged: onChanged,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            hintText: hintText,
            suffixText: suffixText,
            filled: true,
            fillColor: HealixColors.navy.withOpacity(0.04),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: HealixColors.navyLight, width: 1.4)),
          ),
        ),
      ],
    );
  }
}

class SettingsDropdownField extends StatefulWidget {
  const SettingsDropdownField({super.key, required this.label, required this.value, required this.items, this.onChanged});

  final String label;
  final String value;
  final List<String> items;
  final ValueChanged<String>? onChanged;

  @override
  State<SettingsDropdownField> createState() => _SettingsDropdownFieldState();
}

class _SettingsDropdownFieldState extends State<SettingsDropdownField> {
  late String _value;

  @override
  void initState() {
    super.initState();
    _value = widget.items.contains(widget.value) ? widget.value : widget.items.first;
  }

  @override
  void didUpdateWidget(covariant SettingsDropdownField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value || oldWidget.items != widget.items) {
      _value = widget.items.contains(widget.value) ? widget.value : widget.items.first;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _value,
          isExpanded: true,
          items: widget.items.map((item) => DropdownMenuItem(value: item, child: Text(item, overflow: TextOverflow.ellipsis))).toList(),
          onChanged: (value) {
            if (value == null) return;
            setState(() => _value = value);
            widget.onChanged?.call(value);
          },
          style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            filled: true,
            fillColor: HealixColors.navy.withOpacity(0.04),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: HealixColors.navyLight, width: 1.4)),
          ),
        ),
      ],
    );
  }
}

class SettingsPrimaryButton extends StatelessWidget {
  const SettingsPrimaryButton({super.key, required this.label, required this.onTap, this.icon, this.color = HealixColors.navy, this.filled = true});

  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final Color color;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final textColor = filled ? Colors.white : color;
    return SizedBox(
      width: double.infinity,
      height: 44,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: icon == null ? const SizedBox.shrink() : Icon(icon, size: 18, color: textColor),
        label: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          backgroundColor: filled ? color : Colors.white,
          foregroundColor: textColor,
          side: BorderSide(color: filled ? color : HealixColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: TextStyle(fontSize: AppResponsive.font(context, 14)),
        ),
      ),
    );
  }
}

class SettingsChoiceCard extends StatelessWidget {
  const SettingsChoiceCard({
    super.key,
    required this.title,
    required this.icon,
    this.selected = false,
    this.onTap,
    this.iconColor = HealixColors.navy,
  });

  final String title;
  final IconData icon;
  final bool selected;
  final VoidCallback? onTap;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? HealixColors.navy.withOpacity(0.04) : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 14, vertical: 18)),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: selected ? HealixColors.navy : HealixColors.border, width: selected ? 1.8 : 1.2),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: iconColor.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(height: 10),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SettingsToggleRow extends StatelessWidget {
  const SettingsToggleRow({super.key, required this.label, required this.value, required this.onChanged});

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
      decoration: BoxDecoration(
        color: HealixColors.navy.withOpacity(0.04), 
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: HealixColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeColor: HealixColors.green,
          ),
        ],
      ),
    );
  }
}

class SettingsSelectablePill extends StatelessWidget {
  const SettingsSelectablePill({super.key, required this.label, required this.selected, this.onTap});

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? HealixColors.navy.withOpacity(0.04) : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: selected ? HealixColors.navy : HealixColors.border, width: selected ? 1.6 : 1.2),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ),
              if (selected) const Icon(Icons.check, color: HealixColors.green, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class SettingsStatusPill extends StatelessWidget {
  const SettingsStatusPill({super.key, required this.label, required this.color, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 12),
            const SizedBox(width: 4),
          ],
          Flexible(
            child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: color, fontSize: AppResponsive.font(context, 12), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

class SettingsRingProgress extends StatelessWidget {
  const SettingsRingProgress({super.key, required this.value, required this.color, required this.center, this.size});

  final double value;
  final Color color;
  final Widget center;
  final double? size;

  @override
  Widget build(BuildContext context) {
    final double resolvedSize = size ?? (AppResponsive.isPhone(context) ? 86 : 120);
    return SizedBox(
      width: resolvedSize,
      height: resolvedSize,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(size: Size.square(resolvedSize), painter: _SettingsRingPainter(value: value, color: color)),
          Padding(padding: const EdgeInsets.all(12), child: Center(child: center)),
        ],
      ),
    );
  }
}

class _SettingsRingPainter extends CustomPainter {
  const _SettingsRingPainter({required this.value, required this.color});

  final double value;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.085;
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
  bool shouldRepaint(covariant _SettingsRingPainter oldDelegate) => oldDelegate.value != value || oldDelegate.color != color;
}

List<Widget> _withSpacing(List<Widget> widgets, double spacing) {
  final result = <Widget>[];
  for (var i = 0; i < widgets.length; i++) {
    result.add(widgets[i]);
    if (i != widgets.length - 1) result.add(SizedBox(height: spacing));
  }
  return result;
}
