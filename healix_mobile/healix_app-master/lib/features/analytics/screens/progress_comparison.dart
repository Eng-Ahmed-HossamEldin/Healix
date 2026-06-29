import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';

class ProgressComparison extends StatefulWidget {
  const ProgressComparison({super.key});

  @override
  State<ProgressComparison> createState() => _ProgressComparisonState();
}

class _ProgressComparisonState extends State<ProgressComparison> {
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
      title: 'Progress Comparison',
      selectedItem: 'Progress Comparison',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PageTitle(),
          SizedBox(height: 22),
          _Header(),
          SizedBox(height: 22),
          _CompareChart(),
          SizedBox(height: 22),
          Text(
            'Detailed Metrics',
            style: TextStyle(color: Color(0xFF202534), fontSize: 17, fontWeight: FontWeight.w900),
          ),
          SizedBox(height: 14),
          _MetricRow(title: 'Average Calories', thisWeek: '${appState.caloriesConsumed}', lastWeek: '2,035', change: '${((appState.caloriesConsumed - 2035) / 2035 * 100).toStringAsFixed(1)}%', positive: appState.caloriesConsumed <= appState.calorieGoal),
          _MetricRow(title: 'Daily Steps', thisWeek: '${appState.steps}', lastWeek: '7,420', change: '${((appState.steps - 7420) / 7420 * 100).toStringAsFixed(1)}%', positive: appState.steps >= 7420),
          _MetricRow(title: 'Water Intake', thisWeek: '${appState.waterCups} cups', lastWeek: '5.5 cups', change: '${((appState.waterCups - 5.5) / 5.5 * 100).toStringAsFixed(1)}%', positive: appState.waterCups >= 5.5),
          _MetricRow(title: 'Sleep Hours', thisWeek: '${appState.sleepHours.toStringAsFixed(1)}h', lastWeek: '7.2h', change: '${((appState.sleepHours - 7.2) / 7.2 * 100).toStringAsFixed(1)}%', positive: appState.sleepHours >= 7.2),
          _MetricRow(title: 'Workouts', thisWeek: '${appState.workouts.length}', lastWeek: '3', change: '${((appState.workouts.length - 3) / 3 * 100).toStringAsFixed(1)}%', positive: appState.workouts.length >= 3),
          SizedBox(height: 12),
          _Highlights(),
        ],
      ),
    );
  }
}

class _PageTitle extends StatelessWidget {
  const _PageTitle();

  @override
  Widget build(BuildContext context) {
    return Text(
      'Progress Comparison',
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(
        color: HealixColors.navy,
        fontSize: AppResponsive.font(context, 26),
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.fromLTRB(22, 28, 22, 32)),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [Color(0xFFB33DFF), Color(0xFFFF2C88)]),
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      child: Row(
        children: [
          const Icon(Icons.arrow_back, color: Colors.white),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Progress Comparison',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.white, fontSize: AppResponsive.font(context, 25), fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 10),
                Text(
                  'This week vs Last week',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.white70, fontSize: AppResponsive.font(context, 17), fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompareChart extends StatelessWidget {
  const _CompareChart();

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Week Over Week Comparison',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: const Color(0xFF202534), fontSize: AppResponsive.font(context, 18), fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 24),
          const _Bars(),
          const SizedBox(height: 12),
          const _Legend(),
        ],
      ),
    );
  }
}

class _ComparisonData {
  const _ComparisonData(this.label, this.thisWeek, this.lastWeek);
  final String label;
  final double thisWeek;
  final double lastWeek;
}

class _Bars extends StatelessWidget {
  const _Bars();

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        final items = [
          _ComparisonData('Calories', appState.caloriesProgress, .90),
          _ComparisonData('Steps', appState.stepsProgress, .74),
          _ComparisonData('Water', appState.waterProgress, .55),
          _ComparisonData('Sleep', appState.sleepProgress, .72),
          _ComparisonData('Workouts', (appState.workouts.length / 7).clamp(0.0, 1.0).toDouble(), .30),
        ];
        return LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 360;
            return Column(children: [for (final item in items) _BarRow(item: item, compact: compact)]);
          },
        );
      },
    );
  }
}

class _BarRow extends StatelessWidget {
  const _BarRow({required this.item, required this.compact});

  final _ComparisonData item;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final labelWidth = compact ? 58.0 : 86.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: labelWidth,
            child: Text(
              item.label,
              textAlign: TextAlign.right,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, compact ? 12 : 14), fontWeight: FontWeight.w800),
            ),
          ),
          SizedBox(width: compact ? 8 : 12),
          Expanded(
            child: Column(
              children: [
                _RatioBar(value: item.thisWeek, color: const Color(0xFF2F7DFF)),
                const SizedBox(height: 7),
                _RatioBar(value: item.lastWeek, color: const Color(0xFFE7EAEE)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RatioBar extends StatelessWidget {
  const _RatioBar({required this.value, required this.color});

  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 14,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(decoration: BoxDecoration(color: const Color(0xFFF3F5F7), borderRadius: BorderRadius.circular(4))),
          FractionallySizedBox(
            widthFactor: value,
            alignment: Alignment.centerLeft,
            child: Container(decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend();

  @override
  Widget build(BuildContext context) {
    return const Wrap(
      alignment: WrapAlignment.center,
      spacing: 18,
      runSpacing: 8,
      children: [
        _LegendPill(color: Color(0xFF2F7DFF), label: 'This Week'),
        _LegendPill(color: Color(0xFFE7EAEE), label: 'Last Week', muted: true),
      ],
    );
  }
}

class _LegendPill extends StatelessWidget {
  const _LegendPill({required this.color, required this.label, this.muted = false});

  final Color color;
  final String label;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 14, height: 14, color: color),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: muted ? const Color(0xFFCCD2D8) : const Color(0xFF2F7DFF), fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({required this.title, required this.thisWeek, required this.lastWeek, required this.change, required this.positive});

  final String title;
  final String thisWeek;
  final String lastWeek;
  final String change;
  final bool positive;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: FeatureSectionCard(
        padding: const EdgeInsets.all(18),
        radius: 16,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 300;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 10,
                  runSpacing: 6,
                  alignment: WrapAlignment.spaceBetween,
                  children: [
                    SizedBox(
                      width: compact ? constraints.maxWidth : constraints.maxWidth * 0.62,
                      child: Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: const Color(0xFF202534), fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w900),
                      ),
                    ),
                    Text(
                      change,
                      style: TextStyle(color: positive ? const Color(0xFF20B95B) : const Color(0xFFFF3845), fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                ResponsiveWrapGrid(
                  minTileWidth: 120,
                  maxColumns: 2,
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _Value(label: 'This Week', value: thisWeek),
                    _Value(label: 'Last Week', value: lastWeek, muted: true),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Value extends StatelessWidget {
  const _Value({required this.label, required this.value, this.muted = false});

  final String label;
  final String value;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.w700)),
        const SizedBox(height: 5),
        Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: muted ? HealixColors.sub : const Color(0xFF2F63FF), fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w900)),
      ],
    );
  }
}

class _Highlights extends StatelessWidget {
  const _Highlights();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(20)),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFEFFEF0), Color(0xFFEAF4FF)]),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 14, offset: const Offset(0, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Highlights', style: TextStyle(color: const Color(0xFF202534), fontSize: AppResponsive.font(context, 17), fontWeight: FontWeight.w900)),
          const SizedBox(height: 18),
          Text('Improved in 4 out of 5 metrics', style: TextStyle(color: const Color(0xFF20B95B), fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          Text('Best improvement: Workouts (+66.7%)', style: TextStyle(color: const Color(0xFF2F63FF), fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          Text('Focus area: Sleep quality', style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 16), fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
