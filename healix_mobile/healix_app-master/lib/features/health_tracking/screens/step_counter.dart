import 'dart:async';
import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:pedometer/pedometer.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StepCounter extends StatefulWidget {
  const StepCounter({super.key});

  @override
  State<StepCounter> createState() => _StepCounterState();
}

class _StepCounterState extends State<StepCounter> {
  static const String _baselineKey = 'healix_step_sensor_baseline_v1';

  final TextEditingController _searchController = TextEditingController();
  StreamSubscription<StepCount>? _stepSub;
  int? _sensorBaseline;
  int? _rawSensorSteps;
  String _sensorStatus = 'Starting step sensor...';
  bool _sensorActive = false;

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void initState() {
    super.initState();
    _startStepSensor();
  }

  Future<void> _startStepSensor() async {
    try {
      final status = await Permission.activityRecognition.request();
      if (!status.isGranted && !status.isLimited) {
        if (!mounted) return;
        setState(() {
          _sensorActive = false;
          _sensorStatus = 'Activity permission denied. Quick Add still works.';
        });
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      _sensorBaseline = prefs.getInt(_baselineKey);

      _stepSub = Pedometer.stepCountStream.listen(
        (event) async {
          final raw = event.steps;
          var baseline = _sensorBaseline;
          if (baseline == null || baseline > raw) {
            baseline = math.max(0, raw - appState.steps);
            _sensorBaseline = baseline;
            await prefs.setInt(_baselineKey, baseline);
          }
          final todaySteps = math.max(0, raw - baseline);
          appState.setSteps(todaySteps);
          if (!mounted) return;
          setState(() {
            _rawSensorSteps = raw;
            _sensorActive = true;
            _sensorStatus = 'Live sensor connected';
          });
        },
        onError: (error) {
          if (!mounted) return;
          setState(() {
            _sensorActive = false;
            _sensorStatus = 'Step sensor unavailable on this device. Use Quick Add.';
          });
        },
        cancelOnError: false,
      );
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _sensorActive = false;
        _sensorStatus = 'Step sensor unavailable on this device. Use Quick Add.';
      });
    }
  }

  Future<void> _resetTodaySteps() async {
    final prefs = await SharedPreferences.getInstance();
    if (_rawSensorSteps != null) {
      _sensorBaseline = _rawSensorSteps;
      await prefs.setInt(_baselineKey, _rawSensorSteps!);
    }
    appState.setSteps(0);
    if (!mounted) return;
    AppActions.showSnack(context, 'Today\'s steps reset', icon: Icons.restart_alt_rounded);
  }

  @override
  void dispose() {
    _stepSub?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Step Counter',
      selectedItem: 'Step Counter',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _StepHero(),
          const SizedBox(height: 16),
          _SensorStatusCard(active: _sensorActive, status: _sensorStatus, onReset: _resetTodaySteps),
          const SizedBox(height: 16),
          const _StepProgressCard(),
          const SizedBox(height: 16),
          const _StepStatsRow(),
          const SizedBox(height: 16),
          const _StepActionsCard(),
          const SizedBox(height: 16),
          const _WeeklyActivityCard(),
          const SizedBox(height: 16),
          const _KeepItUpCard(),
        ],
      ),
    );
  }
}

class _SensorStatusCard extends StatelessWidget {
  const _SensorStatusCard({required this.active, required this.status, required this.onReset});

  final bool active;
  final String status;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(16),
      radius: 18,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 520;
          final content = Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: (active ? HealixColors.green : HealixColors.orange).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  active ? Icons.sensors_rounded : Icons.info_outline_rounded, 
                  color: active ? HealixColors.green : HealixColors.orange,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      active ? 'Auto Step Tracking' : 'Sensor Status', 
                      style: const TextStyle(color: HealixColors.navy, fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      status, 
                      style: const TextStyle(color: HealixColors.sub, fontSize: 13, height: 1.35, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          );
          final button = OutlinedButton.icon(
            onPressed: onReset,
            icon: const Icon(Icons.restart_alt_rounded, size: 16),
            label: const Text('Reset Today'),
            style: OutlinedButton.styleFrom(
              foregroundColor: HealixColors.navy,
              side: const BorderSide(color: HealixColors.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
          if (compact) {
            return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [content, const SizedBox(height: 12), button]);
          }
          return Row(children: [Expanded(child: content), const SizedBox(width: 12), button]);
        },
      ),
    );
  }
}

class _StepHero extends StatelessWidget {
  const _StepHero();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [HealixColors.navy, HealixColors.green],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.12),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: const Row(
        children: [
          Icon(Icons.directions_walk_outlined, color: Colors.white, size: 30),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Step Counter', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Move with your device and Healix will count steps automatically.', style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StepProgressCard extends StatelessWidget {
  const _StepProgressCard();

  String _fmt(int value) => value.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) => FeatureSectionCard(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 30),
        radius: 20,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final size = math.min(220.0, constraints.maxWidth * 0.78);
            final percent = (appState.stepsProgress * 100).clamp(0, 100).toStringAsFixed(1);
            return Center(
              child: SizedBox(
                width: size,
                height: size,
                child: CustomPaint(
                  painter: _StepRingPainter(progress: appState.stepsProgress),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.directions_walk_outlined, color: HealixColors.navy, size: 40),
                        const SizedBox(height: 10),
                        Text(_fmt(appState.steps), style: const TextStyle(color: HealixColors.navy, fontSize: 24, fontWeight: FontWeight.w900)),
                        const SizedBox(height: 2),
                        Text('of ${_fmt(appState.stepsGoal)} steps', style: const TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text('$percent%', style: const TextStyle(color: HealixColors.green, fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _StepRingPainter extends CustomPainter {
  const _StepRingPainter({required this.progress});
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = size.width * 0.07;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);
    final background = Paint()
      ..color = HealixColors.border
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    final primary = Paint()
      ..color = HealixColors.navy
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    final lime = Paint()
      ..color = HealixColors.green
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, background);
    const start = -math.pi / 2;
    final totalSweep = 2 * math.pi * progress.clamp(0.0, 1.0);
    final primarySweep = totalSweep * 0.62;
    final limeSweep = totalSweep - primarySweep;
    canvas.drawArc(rect, start, primarySweep, false, primary);
    canvas.drawArc(rect, start + primarySweep, limeSweep, false, lime);
  }

  @override
  bool shouldRepaint(covariant _StepRingPainter oldDelegate) => oldDelegate.progress != progress;
}

class _StepStatsRow extends StatelessWidget {
  const _StepStatsRow();

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) => LayoutBuilder(
        builder: (context, constraints) {
          final isNarrow = constraints.maxWidth < 520;
          final distance = (appState.steps * 0.0008).toStringAsFixed(1);
          final active = (appState.steps / 165).round();
          final cards = [
            _StepStatCard(icon: Icons.local_fire_department_outlined, iconColor: HealixColors.orange, value: '${(appState.steps * 0.04).round()} kcal', label: 'Calories'),
            _StepStatCard(icon: Icons.my_location, iconColor: HealixColors.navy, value: '$distance km', label: 'Distance'),
            _StepStatCard(icon: Icons.trending_up, iconColor: HealixColors.green, value: '$active min', label: 'Active'),
          ];
          if (isNarrow) return Column(children: [cards[0], const SizedBox(height: 12), cards[1], const SizedBox(height: 12), cards[2]]);
          return Row(children: [Expanded(child: cards[0]), const SizedBox(width: 12), Expanded(child: cards[1]), const SizedBox(width: 12), Expanded(child: cards[2])]);
        },
      ),
    );
  }
}

class _StepStatCard extends StatelessWidget {
  const _StepStatCard({required this.icon, required this.iconColor, required this.value, required this.label});
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      radius: 16,
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 10),
          Text(value, textAlign: TextAlign.center, style: const TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, textAlign: TextAlign.center, style: const TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _StepActionsCard extends StatelessWidget {
  const _StepActionsCard();

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(16),
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Quick Add Steps', style: TextStyle(color: HealixColors.navy, fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Use this to log steps manually.', style: TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [250, 500, 1000].map((amount) => OutlinedButton.icon(
              onPressed: () {
                appState.addSteps(amount);
                AppActions.showSnack(context, '+$amount steps added', icon: Icons.directions_walk_outlined);
              },
              icon: const Icon(Icons.add, size: 16),
              label: Text('+$amount'),
              style: OutlinedButton.styleFrom(
                foregroundColor: HealixColors.navy, 
                side: const BorderSide(color: HealixColors.border),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _WeeklyActivityCard extends StatelessWidget {
  const _WeeklyActivityCard();

  /// Builds 7 FlSpot values (Mon–Sun) from the backend steps history.
  /// If history is available the last 7 days are mapped to weekday index 0–6.
  /// Today is always inserted at the correct weekday slot with the live sensor value.
  List<FlSpot> _buildSpots() {
    // Initialise all 7 days with 0
    final stepsPerDay = List<double>.filled(7, 0);
    final history = appState.stepsHistory;
    for (final log in history) {
      final dt = DateTime.tryParse(log.date);
      if (dt == null) continue;
      // weekday: Monday=1 … Sunday=7  → index 0–6
      final idx = dt.weekday - 1;
      stepsPerDay[idx] = math.max(stepsPerDay[idx], log.steps.toDouble());
    }
    // Override today's slot with the live sensor count (most accurate)
    final todayIdx = DateTime.now().weekday - 1;
    stepsPerDay[todayIdx] = math.max(stepsPerDay[todayIdx], appState.steps.toDouble());
    return List.generate(7, (i) => FlSpot(i.toDouble(), stepsPerDay[i]));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        final spots = _buildSpots();
        final totalSteps = spots.fold<double>(0, (sum, s) => sum + s.y);
        final daysWithData = spots.where((s) => s.y > 0).length;
        final weeklyAverage = daysWithData > 0 ? (totalSteps / daysWithData).round() : 0;
        final maxY = math.max(12000.0, spots.map((s) => s.y).reduce(math.max) + 1500);
        return FeatureSectionCard(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Weekly Activity', style: TextStyle(color: HealixColors.navy, fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 18),
              SizedBox(
                height: 200,
                child: LineChart(
                  LineChartData(
                    minX: 0,
                    maxX: 6,
                    minY: 0,
                    maxY: maxY,
                    gridData: FlGridData(
                      show: true, 
                      drawVerticalLine: false,
                      getDrawingHorizontalLine: (_) => const FlLine(color: HealixColors.border, strokeWidth: 1),
                    ),
                    borderData: FlBorderData(show: false),
                    titlesData: FlTitlesData(
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true, 
                          reservedSize: 36, 
                          getTitlesWidget: (value, _) => Text(value.toInt().toString(), style: const TextStyle(color: HealixColors.sub, fontSize: 10)),
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true, 
                          reservedSize: 24, 
                          getTitlesWidget: (value, _) {
                            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                            final index = value.toInt();
                            if (index < 0 || index >= days.length) return const SizedBox.shrink();
                            return Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(days[index], style: const TextStyle(color: HealixColors.sub, fontSize: 10, fontWeight: FontWeight.bold)),
                            );
                          },
                        ),
                      ),
                    ),
                    lineTouchData: const LineTouchData(enabled: false),
                    lineBarsData: [
                      LineChartBarData(
                        spots: spots, 
                        color: HealixColors.navy, 
                        isCurved: true, 
                        barWidth: 3, 
                        dotData: FlDotData(
                          show: true, 
                          getDotPainter: (_, __, ___, ____) => FlDotCirclePainter(
                            radius: 4, 
                            color: HealixColors.green, 
                            strokeWidth: 2, 
                            strokeColor: HealixColors.navy,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Center(
                child: Column(
                  children: [
                    const Text('Weekly Average', style: TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('$weeklyAverage steps/day', style: const TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _KeepItUpCard extends StatelessWidget {
  const _KeepItUpCard();

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        final remaining = (appState.stepsGoal - appState.steps).clamp(0, appState.stepsGoal);
        final message = appState.steps == 0
            ? 'Start your first walk today and your progress will update here.'
            : remaining == 0
                ? 'Goal reached! Great work today.'
                : 'Keep going! $remaining more steps to reach your goal. Try a quick 15-minute walk.';
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [HealixColors.navy, HealixColors.navyLight],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: HealixColors.navy.withOpacity(0.1),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _GoalIcon(),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Keep It Up!', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text(message, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.45)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _GoalIcon extends StatelessWidget {
  const _GoalIcon();
  @override
  Widget build(BuildContext context) => Container(
        width: 40, 
        height: 40, 
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15), 
          borderRadius: BorderRadius.circular(10),
        ), 
        child: const Icon(Icons.my_location, color: Colors.white, size: 22),
      );
}
