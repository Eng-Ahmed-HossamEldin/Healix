import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';

class WeightTracking extends StatefulWidget {
  const WeightTracking({super.key});

  @override
  State<WeightTracking> createState() => _WeightTrackingState();
}

class _WeightTrackingState extends State<WeightTracking> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _weightController = TextEditingController();
  DateTime? _selectedDate;

  static const Color _primary = HealixColors.navy;
  static const Color _secondaryText = HealixColors.sub;
  static const Color _green = HealixColors.green;

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void dispose() {
    _searchController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  String _dateLabel(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}';
  }

  void _addEntry() {
    final value = double.tryParse(_weightController.text.trim());
    if (value == null || value < 20 || value > 350) {
      AppActions.showSnack(context, 'Enter a valid weight between 20 and 350 kg.', icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    final label = _selectedDate == null ? 'Today' : _dateLabel(_selectedDate!);
    appState.addWeightEntry(value, label);
    _weightController.clear();
    setState(() => _selectedDate = null);
    AppActions.showSnack(context, 'Weight updated. BMI, progress, and dashboard are recalculated.', icon: Icons.monitor_weight_outlined);
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Weight Tracking',
      selectedItem: 'Weight Tracking',
      searchController: _searchController,
      openScreen: _openScreen,
      child: AnimatedBuilder(
        animation: appState,
        builder: (context, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _WeightHeader(),
            const SizedBox(height: 18),
            const _WeightStats(),
            const SizedBox(height: 18),
            const _WeightProgressCard(),
            const SizedBox(height: 18),
            const _WeightChart(),
            const SizedBox(height: 18),
            _AddWeightCard(
              controller: _weightController,
              dateLabel: _selectedDate == null ? 'Today' : _dateLabel(_selectedDate!),
              onPickDate: () async {
                final picked = await showDatePicker(context: context, initialDate: _selectedDate ?? DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime.now());
                if (picked != null) setState(() => _selectedDate = picked);
              },
              onAdd: _addEntry,
            ),
            const SizedBox(height: 18),
            const _RecentWeightEntries(),
          ],
        ),
      ),
    );
  }
}

class _WeightHeader extends StatelessWidget {
  const _WeightHeader();

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [HealixColors.navy, HealixColors.navyLight],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.vertical(top: Radius.circular(18), bottom: Radius.circular(10)),
        ),
        child: const Row(
          children: [
            Icon(Icons.monitor_weight_outlined, color: Colors.white, size: 34),
            SizedBox(width: 18),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Weight Tracking', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)), SizedBox(height: 8), Text('Monitor weight, BMI, and target progress without layout overflow.', style: TextStyle(color: Colors.white70, fontSize: 15, fontWeight: FontWeight.w600))])),
          ],
        ),
      );
}

class _WeightStats extends StatelessWidget {
  const _WeightStats();

  @override
  Widget build(BuildContext context) {
    final lost = appState.startWeightKg - appState.weightKg;
    final remaining = (appState.weightKg - appState.targetWeightKg).abs();
    final cards = [
      _StatCard(label: 'Current', value: '${appState.weightKg.toStringAsFixed(1)} kg'),
      _StatCard(label: 'Target', value: '${appState.targetWeightKg.toStringAsFixed(1)} kg'),
      _StatCard(label: lost >= 0 ? 'Lost' : 'Gained', value: '${lost >= 0 ? '-' : '+'}${lost.abs().toStringAsFixed(1)} kg', valueColor: lost >= 0 ? _WeightTrackingState._green : Colors.orange),
      _StatCard(label: 'BMI', value: appState.bmi.toStringAsFixed(1), subtitle: appState.bmiCategory),
      _StatCard(label: 'Remaining', value: '${remaining.toStringAsFixed(1)} kg'),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final isTiny = constraints.maxWidth < 360;
        final itemWidth = isTiny ? constraints.maxWidth : constraints.maxWidth >= 900 ? (constraints.maxWidth - 48) / 5 : constraints.maxWidth >= 620 ? (constraints.maxWidth - 24) / 3 : (constraints.maxWidth - 12) / 2;
        return Wrap(spacing: 12, runSpacing: 12, children: cards.map((card) => SizedBox(width: itemWidth, child: card)).toList());
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, this.subtitle, this.valueColor});
  final String label;
  final String value;
  final String? subtitle;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) => _WeightPanel(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 88,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 13, color: _WeightTrackingState._secondaryText, fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis),
              const Spacer(),
              FittedBox(alignment: Alignment.centerLeft, fit: BoxFit.scaleDown, child: Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: valueColor ?? _WeightTrackingState._primary))),
              if (subtitle != null) Text(subtitle!, style: const TextStyle(fontSize: 12, color: _WeightTrackingState._secondaryText, fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      );
}

class _WeightProgressCard extends StatelessWidget {
  const _WeightProgressCard();

  @override
  Widget build(BuildContext context) {
    final total = (appState.startWeightKg - appState.targetWeightKg).abs();
    final moved = (appState.startWeightKg - appState.weightKg).abs();
    final progress = total <= 0 ? 0.0 : (moved / total).clamp(0.0, 1.0).toDouble();
    return _WeightPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Goal Progress', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: _WeightTrackingState._primary)),
          const SizedBox(height: 12),
          ClipRRect(borderRadius: BorderRadius.circular(999), child: LinearProgressIndicator(value: progress, minHeight: 10, backgroundColor: const Color(0xFFE5EEF2), valueColor: const AlwaysStoppedAnimation<Color>(_WeightTrackingState._green))),
          const SizedBox(height: 10),
          Text('${(progress * 100).round()}% toward your target weight', style: const TextStyle(color: _WeightTrackingState._secondaryText, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _WeightChart extends StatelessWidget {
  const _WeightChart();

  @override
  Widget build(BuildContext context) {
    final rawEntries = appState.weightEntries.isEmpty ? <WeightEntry>[WeightEntry(appState.weightKg, 'Today')] : appState.weightEntries.take(8).toList();
    final chartEntries = rawEntries.reversed.toList();
    final values = chartEntries.map((e) => e.weight).toList();
    final minY = math.max(0.0, values.reduce(math.min) - 2.0);
    final maxY = values.reduce(math.max) + 2.0;
    final spots = chartEntries.length == 1 ? [FlSpot(0, chartEntries.first.weight), FlSpot(1, chartEntries.first.weight)] : chartEntries.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.weight)).toList();
    return _WeightPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Weight Over Time', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: _WeightTrackingState._primary)),
          const SizedBox(height: 18),
          SizedBox(
            height: 260,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: math.max(1, chartEntries.length - 1).toDouble(),
                minY: minY,
                maxY: maxY <= minY ? minY + 4 : maxY,
                gridData: FlGridData(show: true, getDrawingHorizontalLine: (_) => FlLine(color: Colors.grey.shade200, strokeWidth: 1), getDrawingVerticalLine: (_) => FlLine(color: Colors.grey.shade200, strokeWidth: 1)),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (value, _) => Text(value.toStringAsFixed(0), style: const TextStyle(color: _WeightTrackingState._secondaryText, fontSize: 11)))),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 38, interval: 1, getTitlesWidget: (value, _) {
                    final index = value.toInt();
                    if (index < 0 || index >= chartEntries.length) return const SizedBox.shrink();
                    return Padding(padding: const EdgeInsets.only(top: 8), child: Text(chartEntries[index].date, style: const TextStyle(color: _WeightTrackingState._secondaryText, fontSize: 10, fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis));
                  })),
                ),
                lineBarsData: [LineChartBarData(spots: spots, isCurved: true, barWidth: 3, color: _WeightTrackingState._primary, dotData: const FlDotData(show: true), belowBarData: BarAreaData(show: true, color: _WeightTrackingState._primary.withOpacity(.08)))],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddWeightCard extends StatelessWidget {
  const _AddWeightCard({required this.controller, required this.dateLabel, required this.onPickDate, required this.onAdd});
  final TextEditingController controller;
  final String dateLabel;
  final VoidCallback onPickDate;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) => _WeightPanel(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 600;
            final weightField = TextField(controller: controller, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: 'Weight', suffixText: 'kg', prefixIcon: const Icon(Icons.monitor_weight_outlined), border: OutlineInputBorder(borderRadius: BorderRadius.circular(14))));
            final dateButton = OutlinedButton.icon(onPressed: onPickDate, icon: const Icon(Icons.calendar_today_outlined), label: Text(dateLabel, overflow: TextOverflow.ellipsis));
            final addButton = ElevatedButton.icon(onPressed: onAdd, icon: const Icon(Icons.add), label: const Text('Add Entry'), style: ElevatedButton.styleFrom(backgroundColor: _WeightTrackingState._primary, foregroundColor: Colors.white));
            if (compact) return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [const Text('Add Weight Entry', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: _WeightTrackingState._primary)), const SizedBox(height: 14), weightField, const SizedBox(height: 12), dateButton, const SizedBox(height: 12), addButton]);
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Add Weight Entry', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: _WeightTrackingState._primary)), const SizedBox(height: 14), Row(children: [Expanded(flex: 2, child: weightField), const SizedBox(width: 12), Expanded(child: SizedBox(height: 54, child: dateButton)), const SizedBox(width: 12), Expanded(child: SizedBox(height: 54, child: addButton))])]);
          },
        ),
      );
}

class _RecentWeightEntries extends StatelessWidget {
  const _RecentWeightEntries();

  @override
  Widget build(BuildContext context) => _WeightPanel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Recent Entries', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: _WeightTrackingState._primary)),
            const SizedBox(height: 12),
            if (appState.weightEntries.isEmpty)
              const Text('No weight entries yet.', style: TextStyle(color: _WeightTrackingState._secondaryText, fontWeight: FontWeight.w700))
            else
              ...appState.weightEntries.asMap().entries.map((entry) => _EntryTile(index: entry.key, entry: entry.value)),
          ],
        ),
      );
}

class _EntryTile extends StatelessWidget {
  const _EntryTile({required this.index, required this.entry});
  final int index;
  final WeightEntry entry;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(color: HealixColors.card2, borderRadius: BorderRadius.circular(12), border: Border.all(color: HealixColors.border)),
        child: Row(children: [Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('${entry.weight.toStringAsFixed(1)} kg', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _WeightTrackingState._primary)), const SizedBox(height: 3), Text(entry.date, style: const TextStyle(fontSize: 12, color: _WeightTrackingState._secondaryText, fontWeight: FontWeight.w700))])), IconButton(onPressed: () => appState.removeWeightEntry(index), icon: const Icon(Icons.delete_outline, color: _WeightTrackingState._secondaryText))]),
      );
}

class _WeightPanel extends StatelessWidget {
  const _WeightPanel({required this.child, this.padding = const EdgeInsets.all(18)});
  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: HealixColors.border),
      boxShadow: [BoxShadow(color: HealixColors.navy.withOpacity(.04), blurRadius: 16, offset: const Offset(0, 6))],
    ),
    child: child,
  );
}
