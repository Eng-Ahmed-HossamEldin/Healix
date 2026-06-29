import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/services/tracking_service.dart';
import '../../../core/state/app_state.dart';
import '../../../core/theme_manage/app_theme.dart';
import '../../../core/widgets/app_actions.dart';
import '../../../core/widgets/feature_page_frame.dart';

class SleepTracking extends StatefulWidget {
  const SleepTracking({super.key});

  @override
  State<SleepTracking> createState() => _SleepTrackingState();
}

class _SleepTrackingState extends State<SleepTracking> {
  final TextEditingController _searchController = TextEditingController();
  late final TextEditingController _sleepController = TextEditingController(
    text: appState.sleepHours <= 0 ? '' : appState.sleepHours.toStringAsFixed(1),
  );
  late final TextEditingController _goalController = TextEditingController(
    text: appState.sleepGoalHours.toStringAsFixed(1),
  );

  /// Real sleep history fetched from backend: index 0 = Monday, 6 = Sunday.
  final List<double> _weeklyHistory = List<double>.filled(7, 0);

  @override
  void initState() {
    super.initState();
    _loadSleepHistory();
  }

  Future<void> _loadSleepHistory() async {
    try {
      final import_service = await TrackingService.getSleep(limit: 7);
      // Reset
      for (int i = 0; i < 7; i++) _weeklyHistory[i] = 0;
      for (final entry in import_service) {
        final rawDate = entry['log_date']?.toString() ?? entry['logged_at']?.toString() ?? '';
        final dt = DateTime.tryParse(rawDate);
        if (dt == null) continue;
        final idx = dt.weekday - 1; // Monday=0, Sunday=6
        final hours = (entry['hours'] as num?)?.toDouble() ?? 0.0;
        if (hours > _weeklyHistory[idx]) _weeklyHistory[idx] = hours;
      }
      // Always reflect today's live value
      final todayIdx = DateTime.now().weekday - 1;
      if (appState.sleepHours > 0 && appState.sleepHours > _weeklyHistory[todayIdx]) {
        _weeklyHistory[todayIdx] = appState.sleepHours;
      }
      if (mounted) setState(() {});
    } catch (_) {
      // Fall back to today-only data
      final todayIdx = DateTime.now().weekday - 1;
      if (appState.sleepHours > 0) _weeklyHistory[todayIdx] = appState.sleepHours;
      if (mounted) setState(() {});
    }
  }

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  void dispose() {
    _searchController.dispose();
    _sleepController.dispose();
    _goalController.dispose();
    super.dispose();
  }

  void _saveSleep() {
    final hours = double.tryParse(_sleepController.text.trim());
    final goal = double.tryParse(_goalController.text.trim());

    if (hours == null || hours < 0 || hours > 24) {
      AppActions.showSnack(
        context,
        'Enter valid sleep hours between 0 and 24.',
        icon: Icons.error_outline,
        color: Colors.red.shade700,
      );
      return;
    }
    if (goal == null || goal < 4 || goal > 12) {
      AppActions.showSnack(
        context,
        'A realistic sleep goal should be between 4 and 12 hours.',
        icon: Icons.error_outline,
        color: Colors.red.shade700,
      );
      return;
    }

    appState.updateSleep(hours, goal);
    final status = _sleepStatus(hours, goal);
    AppActions.showSnack(
      context,
      status.isWarning
          ? '${status.label}: ${status.message}'
          : 'Sleep updated: ${hours.toStringAsFixed(1)}h / ${goal.toStringAsFixed(1)}h goal',
      icon: status.icon,
      color: status.isWarning ? status.color : HealixColors.navy,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Sleep Tracking',
      selectedItem: 'Sleep Tracking',
      searchController: _searchController,
      openScreen: _openScreen,
      child: AnimatedBuilder(
        animation: appState,
        builder: (context, _) {
          return LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth >= 760;
              final metricCards = <Widget>[
                _MetricCard(
                  title: 'Last Sleep',
                  value: '${appState.sleepHours.toStringAsFixed(1)}h',
                  subtitle: _sleepStatus(appState.sleepHours, appState.sleepGoalHours).label,
                  icon: Icons.bedtime_outlined,
                  color: _sleepStatus(appState.sleepHours, appState.sleepGoalHours).color,
                ),
                _MetricCard(
                  title: 'Goal',
                  value: '${appState.sleepGoalHours.toStringAsFixed(1)}h',
                  subtitle: _remainingLabel(),
                  icon: Icons.flag_outlined,
                  color: const Color(0xFF2D7DFF),
                ),
                _MetricCard(
                  title: 'Sleep Balance',
                  value: _sleepBalanceValue(),
                  subtitle: _sleepStatus(appState.sleepHours, appState.sleepGoalHours).message,
                  icon: _sleepStatus(appState.sleepHours, appState.sleepGoalHours).icon,
                  color: _sleepStatus(appState.sleepHours, appState.sleepGoalHours).color,
                ),
              ];

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _SleepHeader(),
                  const SizedBox(height: 16),
                  _ResponsiveGroup(isWide: isWide, children: metricCards),
                  const SizedBox(height: 16),
                  _LogSleepCard(
                    sleepController: _sleepController,
                    goalController: _goalController,
                    onSave: _saveSleep,
                  ),
                  const SizedBox(height: 16),
                  _SleepAdviceCard(status: _sleepStatus(appState.sleepHours, appState.sleepGoalHours)),
                  const SizedBox(height: 16),
                  isWide
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 7, child: _SleepTrendCard(values: _weeklyValues())),
                            const SizedBox(width: 16),
                            Expanded(flex: 5, child: _SleepPhasesCard(phases: _phases())),
                          ],
                        )
                      : Column(
                          children: [
                            _SleepTrendCard(values: _weeklyValues()),
                            const SizedBox(height: 16),
                            _SleepPhasesCard(phases: _phases()),
                          ],
                        ),
                ],
              );
            },
          );
        },
      ),
    );
  }

  String _remainingLabel() {
    final hours = appState.sleepHours;
    final goal = appState.sleepGoalHours;
    final status = _sleepStatus(hours, goal);
    if (hours <= 0) return 'No sleep logged yet';
    if (hours > 12) return 'Too much sleep logged';
    final remaining = goal - hours;
    if (remaining <= 0) return status.isWarning ? status.label : 'Goal reached';
    return '${remaining.toStringAsFixed(1)}h remaining';
  }

  String _sleepBalanceValue() {
    final hours = appState.sleepHours;
    final goal = appState.sleepGoalHours;
    if (hours <= 0) return '0%';
    if (hours > 12) return 'Check';
    return '${(appState.sleepProgress * 100).clamp(0, 100).round()}%';
  }

  _SleepStatus _sleepStatus(double hours, double goal) {
    if (hours <= 0) {
      return const _SleepStatus(
        label: 'No sleep logged yet',
        message: 'Add your sleep hours to get a realistic health check.',
        color: Color(0xFF708792),
        icon: Icons.info_outline,
        isWarning: false,
      );
    }
    if (hours < 3) {
      return const _SleepStatus(
        label: 'Critically low sleep',
        message: 'This is far below a healthy amount. Try to rest as soon as possible.',
        color: Color(0xFFD93025),
        icon: Icons.warning_amber_rounded,
        isWarning: true,
      );
    }
    if (hours < 5) {
      return const _SleepStatus(
        label: 'Very low sleep',
        message: 'You are likely under-rested today.',
        color: Color(0xFFFF8A00),
        icon: Icons.warning_amber_rounded,
        isWarning: true,
      );
    }
    if (hours < 6.5) {
      return const _SleepStatus(
        label: 'Short sleep',
        message: 'A bit less than recommended for most adults.',
        color: Color(0xFFF4A000),
        icon: Icons.bedtime_off_outlined,
        isWarning: true,
      );
    }
    if (hours <= 9) {
      return _SleepStatus(
        label: hours >= goal ? 'Healthy sleep' : 'Good, slightly under goal',
        message: hours >= goal ? 'This is within a normal healthy range.' : 'Close to a healthy range; try to reach your goal.',
        color: const Color(0xFF08B85A),
        icon: Icons.check_circle_outline,
        isWarning: false,
      );
    }
    if (hours <= 10.5) {
      return const _SleepStatus(
        label: 'Slightly high sleep',
        message: 'Could be recovery, but keep an eye on repeated long sleep.',
        color: Color(0xFF2D7DFF),
        icon: Icons.monitor_heart_outlined,
        isWarning: false,
      );
    }
    if (hours <= 12) {
      return const _SleepStatus(
        label: 'High sleep',
        message: 'More than usual. If this repeats, review fatigue, stress, or illness.',
        color: Color(0xFFFF8A00),
        icon: Icons.warning_amber_rounded,
        isWarning: true,
      );
    }
    return const _SleepStatus(
      label: 'Abnormally high sleep',
      message: '20h/very long sleep is not normal sleep quality. Check if the entry is correct.',
      color: Color(0xFFD93025),
      icon: Icons.error_outline,
      isWarning: true,
    );
  }

  List<double> _weeklyValues() => _weeklyHistory.map((v) => v.clamp(0.0, 12.0).toDouble()).toList();

  Map<String, double> _phases() {
    final total = appState.sleepHours.clamp(0.0, 12.0).toDouble();
    return <String, double>{
      'Deep Sleep': total * .24,
      'Light Sleep': total * .50,
      'REM Sleep': total * .18,
      'Awake': total * .08,
    };
  }
}


class _SleepStatus {
  const _SleepStatus({
    required this.label,
    required this.message,
    required this.color,
    required this.icon,
    required this.isWarning,
  });

  final String label;
  final String message;
  final Color color;
  final IconData icon;
  final bool isWarning;
}

class _SleepAdviceCard extends StatelessWidget {
  const _SleepAdviceCard({required this.status});

  final _SleepStatus status;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: status.color.withOpacity(.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(status.icon, color: status.color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  status.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: status.color, fontSize: 16, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                Text(
                  status.message,
                  style: const TextStyle(color: HealixColors.sub, fontSize: 13, height: 1.35, fontWeight: FontWeight.w600),
                ),
                if (status.isWarning) ...[
                  const SizedBox(height: 8),
                  const Text(
                    'Tip: Healthy adult sleep is usually around 7–9 hours. Very low or very high entries should be reviewed.',
                    style: TextStyle(color: Color(0xFF202534), fontSize: 12, height: 1.35, fontWeight: FontWeight.w600),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SleepHeader extends StatelessWidget {
  const _SleepHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFA63CFF), Color(0xFF4F63FF)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.dark_mode_outlined, color: Colors.white, size: 34),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sleep Tracking',
                  style: TextStyle(color: Colors.white, fontSize: 24, height: 1.15, fontWeight: FontWeight.w900),
                ),
                SizedBox(height: 10),
                Text(
                  'Log sleep hours, update your goal, and review sleep quality without overflow on phones or tablets.',
                  style: TextStyle(color: Colors.white70, fontSize: 15, height: 1.35, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ResponsiveGroup extends StatelessWidget {
  const _ResponsiveGroup({required this.isWide, required this.children});

  final bool isWide;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    if (!isWide) {
      return Column(
        children: [
          for (int i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1) const SizedBox(height: 12),
          ],
        ],
      );
    }
    return Row(
      children: [
        for (int i = 0; i < children.length; i++) ...[
          Expanded(child: children[i]),
          if (i != children.length - 1) const SizedBox(width: 12),
        ],
      ],
    );
  }
}

class _LogSleepCard extends StatelessWidget {
  const _LogSleepCard({
    required this.sleepController,
    required this.goalController,
    required this.onSave,
  });

  final TextEditingController sleepController;
  final TextEditingController goalController;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 560;
          final sleepField = TextField(
            controller: sleepController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: 'Hours slept',
              hintText: '7.5',
              suffixText: 'hrs',
              prefixIcon: const Icon(Icons.bedtime_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          );
          final goalField = TextField(
            controller: goalController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: 'Sleep goal',
              hintText: '8',
              suffixText: 'hrs',
              prefixIcon: const Icon(Icons.flag_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          );
          final button = SizedBox(
            height: 54,
            child: ElevatedButton.icon(
              onPressed: onSave,
              icon: const Icon(Icons.save_outlined),
              label: const Text('Save Sleep'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8057F1),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          );

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Log Sleep',
                style: TextStyle(color: Color(0xFF202534), fontSize: 18, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 14),
              if (isWide)
                Row(
                  children: [
                    Expanded(child: sleepField),
                    const SizedBox(width: 12),
                    Expanded(child: goalField),
                    const SizedBox(width: 12),
                    button,
                  ],
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    sleepField,
                    const SizedBox(height: 12),
                    goalField,
                    const SizedBox(height: 12),
                    button,
                  ],
                ),
            ],
          );
        },
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: color.withOpacity(.12), borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: HealixColors.sub, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: HealixColors.text, fontSize: 22, fontWeight: FontWeight.w900)),
                const SizedBox(height: 2),
                Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: HealixColors.sub, fontSize: 12, height: 1.3)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SleepTrendCard extends StatelessWidget {
  const _SleepTrendCard({required this.values});

  final List<double> values;

  @override
  Widget build(BuildContext context) {
    final maxValue = values.isEmpty ? 8.0 : values.reduce((a, b) => a > b ? a : b);
    final maxY = (maxValue + 2).clamp(8.0, 14.0).toDouble();

    return _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Sleep Trend (7 Days)', style: TextStyle(color: HealixColors.navy, fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 18),
          SizedBox(
            height: 230,
            child: BarChart(
              BarChartData(
                maxY: maxY,
                minY: 0,
                gridData: FlGridData(show: true, drawVerticalLine: false),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 34,
                      interval: 2,
                      getTitlesWidget: (value, meta) => Text(value.toInt().toString(), style: const TextStyle(fontSize: 10, color: HealixColors.sub)),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        const days = <String>['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                        final index = value.toInt();
                        if (index < 0 || index >= days.length) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(days[index], style: const TextStyle(fontSize: 11, color: HealixColors.sub, fontWeight: FontWeight.w700)),
                        );
                      },
                    ),
                  ),
                ),
                barGroups: List.generate(values.length, (index) {
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: values[index],
                        width: 18,
                        color: const Color(0xFF8057F1),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SleepPhasesCard extends StatelessWidget {
  const _SleepPhasesCard({required this.phases});

  final Map<String, double> phases;

  @override
  Widget build(BuildContext context) {
    final total = appState.sleepHours <= 0 ? 1.0 : appState.sleepHours;
    return _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Sleep Phases', style: TextStyle(color: HealixColors.navy, fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 18),
          for (final entry in phases.entries) ...[
            _PhaseRow(label: entry.key, value: entry.value, progress: (entry.value / total).clamp(0.0, 1.0).toDouble()),
            const SizedBox(height: 14),
          ],
        ],
      ),
    );
  }
}

class _PhaseRow extends StatelessWidget {
  const _PhaseRow({required this.label, required this.value, required this.progress});

  final String label;
  final double value;
  final double progress;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: HealixColors.sub, fontSize: 14, fontWeight: FontWeight.w700))),
            const SizedBox(width: 8),
            Text('${value.toStringAsFixed(1)}h', style: const TextStyle(color: HealixColors.text, fontWeight: FontWeight.w800)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: const Color(0xFFE5E8EC),
            color: const Color(0xFF8057F1),
          ),
        ),
      ],
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.border),
        boxShadow: [
          BoxShadow(color: HealixColors.navy.withOpacity(.04), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: child,
    );
  }
}
