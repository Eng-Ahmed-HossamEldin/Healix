import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';

class BmiTracking extends StatefulWidget {
  const BmiTracking({super.key});

  @override
  State<BmiTracking> createState() => _BmiTrackingState();
}

class _BmiTrackingState extends State<BmiTracking> {
  final TextEditingController _searchController = TextEditingController();
  late final TextEditingController _heightController;
  late final TextEditingController _weightController;

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void initState() {
    super.initState();
    _heightController = TextEditingController(text: appState.heightCm.toStringAsFixed(0));
    _weightController = TextEditingController(text: appState.weightKg.toStringAsFixed(1));
  }

  @override
  void dispose() {
    _searchController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  void _calculate() {
    final height = double.tryParse(_heightController.text.trim());
    final weight = double.tryParse(_weightController.text.trim());
    if (height == null || height < 80 || height > 250) {
      AppActions.showSnack(context, 'Enter a valid height in cm.', icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    if (weight == null || weight < 25 || weight > 300) {
      AppActions.showSnack(context, 'Enter a valid weight in kg.', icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    appState.updateProfile(newHeight: height, newWeight: weight);
    AppActions.showSnack(context, 'BMI recalculated: ${appState.bmi.toStringAsFixed(1)} (${appState.bmiCategory})', icon: Icons.monitor_heart_outlined);
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'BMI Tracking',
      selectedItem: 'BMI Tracking',
      searchController: _searchController,
      openScreen: _openScreen,
      child: AnimatedBuilder(
        animation: appState,
        builder: (context, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _BmiHero(),
            const SizedBox(height: 16),
            _CurrentBmiCard(bmi: appState.bmi, category: appState.bmiCategory),
            const SizedBox(height: 16),
            _BmiCalculatorCard(heightController: _heightController, weightController: _weightController, onCalculate: _calculate),
            const SizedBox(height: 16),
            const _BmiCategoriesCard(),
            const SizedBox(height: 16),
            const _BmiTrendCard(),
            const SizedBox(height: 16),
            _HealthInsightsCard(category: appState.bmiCategory),
          ],
        ),
      ),
    );
  }
}

class _BmiHero extends StatelessWidget {
  const _BmiHero();
  @override
  Widget build(BuildContext context) => Container(
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
            Icon(Icons.monitor_heart_outlined, color: Colors.white, size: 30),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('BMI Tracking', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Body Mass Index monitoring', style: TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
      );
}

class _CurrentBmiCard extends StatelessWidget {
  const _CurrentBmiCard({required this.bmi, required this.category});
  final double bmi;
  final String category;

  @override
  Widget build(BuildContext context) {
    final isNormal = category.contains('Normal');
    return FeatureSectionCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      radius: 20,
      child: Column(
        children: [
          const Text('Current BMI', style: TextStyle(color: HealixColors.sub, fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Text(
            bmi.toStringAsFixed(1), 
            style: const TextStyle(color: HealixColors.navy, fontSize: 32, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            decoration: BoxDecoration(
              color: (isNormal ? HealixColors.green : HealixColors.orange).withOpacity(0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              category, 
              style: TextStyle(
                color: isNormal ? HealixColors.green : HealixColors.orange, 
                fontSize: 14, 
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BmiCalculatorCard extends StatelessWidget {
  const _BmiCalculatorCard({required this.heightController, required this.weightController, required this.onCalculate});
  final TextEditingController heightController;
  final TextEditingController weightController;
  final VoidCallback onCalculate;

  InputDecoration _decoration(String label, IconData icon) => InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: HealixColors.sub),
        filled: true,
        fillColor: HealixColors.navy.withOpacity(0.04),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      );

  @override
  Widget build(BuildContext context) => FeatureSectionCard(
        padding: const EdgeInsets.all(20),
        radius: 20,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Recalculate BMI', style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 520;
                final fields = [
                  TextField(
                    controller: heightController, 
                    keyboardType: const TextInputType.numberWithOptions(decimal: true), 
                    decoration: _decoration('Height (cm)', Icons.height),
                    style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
                  ),
                  TextField(
                    controller: weightController, 
                    keyboardType: const TextInputType.numberWithOptions(decimal: true), 
                    decoration: _decoration('Weight (kg)', Icons.monitor_weight_outlined),
                    style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
                  ),
                ];
                if (compact) return Column(children: [fields[0], const SizedBox(height: 12), fields[1]]);
                return Row(children: [Expanded(child: fields[0]), const SizedBox(width: 12), Expanded(child: fields[1])]);
              },
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity, 
              child: ElevatedButton.icon(
                onPressed: onCalculate, 
                icon: const Icon(Icons.calculate_outlined, color: Colors.white), 
                label: const Text('Calculate BMI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HealixColors.navy,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      );
}

class _BmiCategoriesCard extends StatelessWidget {
  const _BmiCategoriesCard();
  @override
  Widget build(BuildContext context) => const FeatureSectionCard(
        padding: EdgeInsets.all(20),
        radius: 20,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('BMI Categories', style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            _CategoryRow(label: 'Underweight', range: '< 18.5', color: Color(0xFFEF4444)),
            SizedBox(height: 10),
            _CategoryRow(label: 'Normal', range: '18.5 - 24.9', color: Color(0xFF65CD45)),
            SizedBox(height: 10),
            _CategoryRow(label: 'Overweight', range: '25.0 - 29.9', color: Color(0xFFFFD53A)),
            SizedBox(height: 10),
            _CategoryRow(label: 'Obese', range: '30.0+', color: Color(0xFFEF4444)),
          ],
        ),
      );
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow({required this.label, required this.range, required this.color});
  final String label; 
  final String range; 
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity, 
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12), 
        decoration: BoxDecoration(
          color: color.withOpacity(0.08), 
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ), 
        child: Row(
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Expanded(child: Text(label, style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold))), 
            Text(range, style: const TextStyle(color: HealixColors.navy, fontSize: 14, fontWeight: FontWeight.bold)),
          ],
        ),
      );
}

class _BmiTrendCard extends StatelessWidget {
  const _BmiTrendCard();

  double _bmiFor(double weight) {
    final heightM = appState.heightCm / 100;
    if (heightM <= 0) return 0;
    return weight / (heightM * heightM);
  }

  @override
  Widget build(BuildContext context) {
    final entries = appState.weightEntries.isEmpty ? <WeightEntry>[WeightEntry(appState.weightKg, 'Today')] : appState.weightEntries.take(6).toList();
    final chartEntries = entries.reversed.toList();
    final values = chartEntries.map((e) => _bmiFor(e.weight)).toList();
    final minY = values.reduce((a, b) => a < b ? a : b) - 2;
    final maxY = values.reduce((a, b) => a > b ? a : b) + 2;
    return FeatureSectionCard(
      padding: const EdgeInsets.all(20),
      radius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('BMI Trend', style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 18),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: (chartEntries.length <= 1 ? 0 : chartEntries.length - 1).toDouble(),
                minY: minY < 0 ? 0 : minY,
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
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true, 
                      reservedSize: 28, 
                      interval: 1, 
                      getTitlesWidget: (value, meta) {
                        final i = value.toInt();
                        return i >= 0 && i < chartEntries.length 
                            ? Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(chartEntries[i].date, style: const TextStyle(color: HealixColors.sub, fontSize: 10)),
                              )
                            : const SizedBox.shrink();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 32,
                      getTitlesWidget: (value, meta) {
                        return Text(value.toStringAsFixed(1), style: const TextStyle(color: HealixColors.sub, fontSize: 10));
                      },
                    ),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: chartEntries.asMap().entries.map((e) => FlSpot(e.key.toDouble(), _bmiFor(e.value.weight))).toList(), 
                    isCurved: true, 
                    barWidth: 3, 
                    color: HealixColors.green, 
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          HealixColors.green.withOpacity(0.2),
                          HealixColors.green.withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HealthInsightsCard extends StatelessWidget {
  const _HealthInsightsCard({required this.category});
  final String category;
  @override
  Widget build(BuildContext context) {
    final isNormal = category.contains('Normal');
    return FeatureSectionCard(
      padding: const EdgeInsets.all(20),
      radius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Health Insights', style: TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            width: double.infinity, 
            padding: const EdgeInsets.all(16), 
            decoration: BoxDecoration(
              color: (isNormal ? HealixColors.green : HealixColors.orange).withOpacity(0.08), 
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: (isNormal ? HealixColors.green : HealixColors.orange).withOpacity(0.2)),
            ), 
            child: Row(
              children: [
                Icon(Icons.monitor_heart_outlined, color: isNormal ? HealixColors.green : HealixColors.orange), 
                const SizedBox(width: 12), 
                Expanded(
                  child: Text(
                    isNormal 
                        ? 'You are in the healthy range. Maintain your current lifestyle and habits.' 
                        : 'Your BMI is outside the normal range. Review your goal setup and meal plan for safe progress.', 
                    style: const TextStyle(color: HealixColors.navy, fontSize: 14, height: 1.4, fontWeight: FontWeight.bold),
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
