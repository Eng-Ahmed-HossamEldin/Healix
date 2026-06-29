import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';

class WaterIntake extends StatefulWidget {
  const WaterIntake({super.key});

  @override
  State<WaterIntake> createState() => _WaterIntakeState();
}

class _WaterIntakeState extends State<WaterIntake> {
  final TextEditingController _searchController = TextEditingController();

  void _openScreen(Widget screen) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  void _addWater(int amount) {
    appState.addWater(amount);
    AppActions.showSnack(
      context,
      '+${amount}ml added. Total: ${appState.waterCups}/${appState.waterGoalCups} cups',
      icon: Icons.water_drop_outlined,
      color: HealixColors.navyLight,
    );
  }

  Future<void> _resetWater() async {
    final ok = await AppActions.confirm(context,
        title: 'Reset water log?',
        message: "This will clear today's water entries.",
        confirmText: 'Reset');
    if (ok) {
      appState.resetWater();
      if (mounted) AppActions.showSnack(context, 'Water log reset', icon: Icons.refresh);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Water Intake',
      selectedItem: 'Water Intake',
      searchController: _searchController,
      openScreen: _openScreen,
      child: AnimatedBuilder(
        animation: appState,
        builder: (context, _) {
          final remaining =
              (appState.waterGoalMl - appState.waterMl).clamp(0, appState.waterGoalMl);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header card ──────────────────────────────────────────
              _HeaderCard(
                cups: appState.waterCups,
                goalCups: appState.waterGoalCups,
                progress: appState.waterProgress,
                remainingMl: remaining as int,
              ),
              const SizedBox(height: 16),
              // ── Add buttons ──────────────────────────────────────────
              _AddButtonsCard(onAdd: _addWater, onReset: _resetWater),
              const SizedBox(height: 16),
              // ── Weekly average ───────────────────────────────────────
              _AverageCard(cups: appState.waterCups),
              const SizedBox(height: 16),
              // ── Today's log ──────────────────────────────────────────
              _TodayLogCard(logs: appState.waterLogs),
              const SizedBox(height: 16),
              // ── Tip ──────────────────────────────────────────────────
              _TipCard(progress: appState.waterProgress),
            ],
          );
        },
      ),
    );
  }
}

// ─── Header card ─────────────────────────────────────────────────────────────

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.cups,
    required this.goalCups,
    required this.progress,
    required this.remainingMl,
  });

  final int cups;
  final int goalCups;
  final double progress;
  final int remainingMl;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [HealixColors.navy, HealixColors.navyLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.water_drop_outlined, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Water Intake',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800)),
                  Text('Stay hydrated throughout the day',
                      style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(children: [
                        TextSpan(
                          text: '$cups',
                          style: const TextStyle(
                              color: HealixColors.green,
                              fontSize: 38,
                              fontWeight: FontWeight.w900),
                        ),
                        TextSpan(
                          text: ' / $goalCups cups',
                          style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 16,
                              fontWeight: FontWeight.w600),
                        ),
                      ]),
                    ),
                    const SizedBox(height: 4),
                    Text('${remainingMl}ml remaining',
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.7), fontSize: 13)),
                  ],
                ),
              ),
              SizedBox(
                width: 80,
                height: 80,
                child: CustomPaint(painter: _RingPainter(progress)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor: const AlwaysStoppedAnimation<Color>(HealixColors.green),
            ),
          ),
          const SizedBox(height: 8),
          Text('${(progress * 100).round()}% of daily goal',
              style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  const _RingPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final trackPaint = Paint()
      ..color = Colors.white.withOpacity(0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()
      ..color = HealixColors.green
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromLTWH(8, 8, size.width - 16, size.height - 16);
    canvas.drawArc(rect, -1.5708, 6.2832, false, trackPaint);
    canvas.drawArc(rect, -1.5708, 6.2832 * progress.clamp(0.0, 1.0), false, fillPaint);

    // percentage text
    final tp = TextPainter(
      text: TextSpan(
        text: '${(progress * 100).round()}%',
        style: const TextStyle(
            color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas,
        Offset(size.width / 2 - tp.width / 2, size.height / 2 - tp.height / 2));
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.progress != progress;
}

// ─── Add buttons ─────────────────────────────────────────────────────────────

class _AddButtonsCard extends StatelessWidget {
  const _AddButtonsCard({required this.onAdd, required this.onReset});
  final void Function(int) onAdd;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Add Water',
              style: TextStyle(
                  color: HealixColors.navy, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _WaterBtn(
                    label: '250ml',
                    icon: Icons.water_drop_outlined,
                    color: HealixColors.navyLight.withOpacity(0.1),
                    textColor: HealixColors.navyLight,
                    onTap: () => onAdd(250)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _WaterBtn(
                    label: '500ml',
                    icon: Icons.water_drop,
                    color: HealixColors.navyLight.withOpacity(0.18),
                    textColor: HealixColors.navyLight,
                    onTap: () => onAdd(500)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _WaterBtn(
                    label: '1 Litre',
                    icon: Icons.local_drink_outlined,
                    color: HealixColors.green.withOpacity(0.12),
                    textColor: HealixColors.green,
                    onTap: () => onAdd(1000)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 40,
            child: OutlinedButton.icon(
              onPressed: onReset,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.redAccent,
                side: const BorderSide(color: Colors.redAccent, width: 1),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Reset Today', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

class _WaterBtn extends StatelessWidget {
  const _WaterBtn(
      {required this.label,
      required this.icon,
      required this.color,
      required this.textColor,
      required this.onTap});
  final String label;
  final IconData icon;
  final Color color;
  final Color textColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(
            children: [
              Icon(icon, color: textColor, size: 22),
              const SizedBox(height: 6),
              Text(label,
                  style: TextStyle(
                      color: textColor, fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Weekly average card ─────────────────────────────────────────────────────

class _AverageCard extends StatelessWidget {
  const _AverageCard({required this.cups});
  final int cups;

  @override
  Widget build(BuildContext context) {
    final label = cups == 0 ? 'No data yet' : '$cups cups today';
    final goalCups = appState.waterGoalCups;
    final percent = goalCups > 0 ? ((cups / goalCups) * 100).round() : 0;
    final onTrack = cups >= goalCups;
    return _Panel(
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: HealixColors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.trending_up, color: HealixColors.green),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Today\'s Intake',
                    style: TextStyle(
                        color: HealixColors.sub,
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(label,
                    style: const TextStyle(
                        color: HealixColors.navy,
                        fontSize: 17,
                        fontWeight: FontWeight.w900)),
              ],
            ),
          ),
          if (cups > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: (onTrack ? HealixColors.green : HealixColors.orange).withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text('$percent%',
                  style: TextStyle(
                      color: onTrack ? HealixColors.green : HealixColors.orange,
                      fontSize: 12,
                      fontWeight: FontWeight.w800)),
            ),
        ],
      ),
    );
  }
}

// ─── Today's log ─────────────────────────────────────────────────────────────

class _TodayLogCard extends StatelessWidget {
  const _TodayLogCard({required this.logs});
  final List<WaterLog> logs;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Today's Log",
                  style: TextStyle(
                      color: HealixColors.navy,
                      fontSize: 15,
                      fontWeight: FontWeight.w700)),
              Text('${logs.length} entries',
                  style: const TextStyle(
                      color: HealixColors.sub, fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 14),
          if (logs.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(
                  children: [
                    Icon(Icons.water_drop_outlined,
                        color: HealixColors.sub.withOpacity(0.4), size: 36),
                    const SizedBox(height: 8),
                    const Text('No water logged yet.',
                        style: TextStyle(color: HealixColors.sub)),
                  ],
                ),
              ),
            )
          else
            ...logs.map((log) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: HealixColors.card2,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: HealixColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.water_drop_outlined,
                          color: HealixColors.navyLight, size: 18),
                      const SizedBox(width: 12),
                      Text('${log.amountMl}ml',
                          style: const TextStyle(
                              color: HealixColors.navy,
                              fontSize: 14,
                              fontWeight: FontWeight.w700)),
                      const Spacer(),
                      Text(log.time,
                          style: const TextStyle(
                              color: HealixColors.sub,
                              fontSize: 13,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                )),
        ],
      ),
    );
  }
}

// ─── Tip card ─────────────────────────────────────────────────────────────────

class _TipCard extends StatelessWidget {
  const _TipCard({required this.progress});
  final double progress;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: HealixColors.green.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.green.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: HealixColors.green.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.lightbulb_outline, color: HealixColors.green, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Hydration Tip',
                    style: TextStyle(
                        color: HealixColors.green,
                        fontSize: 14,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(
                  progress >= 1
                      ? 'Goal reached! Keep sipping slowly through the rest of the day.'
                      : 'You are ${(progress * 100).round()}% to your goal. Drink water before meals to aid digestion.',
                  style: const TextStyle(
                      color: HealixColors.text, fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared Panel ─────────────────────────────────────────────────────────────

class _Panel extends StatelessWidget {
  const _Panel({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: HealixColors.border),
          boxShadow: [
            BoxShadow(
              color: HealixColors.navy.withOpacity(0.04),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: child,
      );
}
