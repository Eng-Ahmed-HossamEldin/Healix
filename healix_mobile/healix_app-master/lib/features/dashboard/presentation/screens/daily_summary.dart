import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';

class DailySummary extends StatefulWidget {
  const DailySummary({super.key});

  static const Color _primary = HealixColors.navy;
  static const Color _secondaryText = HealixColors.sub;
  static const Color _greenPanel = HealixColors.bg;
  static const Color _lime = HealixColors.green;
  static const Color _teal = HealixColors.teal;

  @override
  State<DailySummary> createState() => _DailySummaryState();
}

class _DailySummaryState extends State<DailySummary> {
  final TextEditingController _searchController = TextEditingController();

  void _openScreen(Widget screen) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: "DailySummary",
      searchController: _searchController,
      openScreen: _openScreen,
      child: _buildHeroCard(),
    );
  }

  Widget _buildHeroCard() {
    return Container(
      decoration: BoxDecoration(
        color: DailySummary._greenPanel,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: DailySummary._primary,
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            ),
            child: const Row(
              children: [
                Icon(Icons.calendar_month_outlined, color: Colors.white, size: 34),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Daily Summary',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Monday, November 16, 2025',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const FeatureSectionCard(
                  child: _MacroDistributionCard(),
                ),
                const SizedBox(height: 16),
                const FeatureSectionCard(
                  child: _CaloriesExerciseChartCard(),
                ),
                const SizedBox(height: 16),
                FeatureSectionCard(
                  color: DailySummary._lime,
                  child: const _RecommendationCard(),
                ),
                const SizedBox(height: 16),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final singleColumn = constraints.maxWidth < 560;
                    if (singleColumn) {
                      return const Column(
                        children: [
                          FeatureMiniStatCard(
                            title: 'Avg Calories',
                            value: '2,007 kcal',
                            change: '+3% vs last week',
                            icon: Icons.trending_up,
                          ),
                          SizedBox(height: 14),
                          FeatureMiniStatCard(
                            title: 'Avg Exercise',
                            value: '386 kcal',
                            change: '+12% vs last week',
                            icon: Icons.show_chart,
                          ),
                        ],
                      );
                    }
                    return const Row(
                      children: [
                        Expanded(
                          child: FeatureMiniStatCard(
                            title: 'Avg Calories',
                            value: '2,007 kcal',
                            change: '+3% vs last week',
                            icon: Icons.trending_up,
                          ),
                        ),
                        SizedBox(width: 14),
                        Expanded(
                          child: FeatureMiniStatCard(
                            title: 'Avg Exercise',
                            value: '386 kcal',
                            change: '+12% vs last week',
                            icon: Icons.show_chart,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MacroDistributionCard extends StatelessWidget {
  const _MacroDistributionCard();

  static const Color _primary = HealixColors.navy;
  static const Color _secondaryText = HealixColors.sub;
  static const Color _lime = HealixColors.green;
  static const Color _teal = HealixColors.teal;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Macro Distribution',
          style: TextStyle(
            color: _primary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 20),
        LayoutBuilder(
          builder: (context, constraints) {
            final isNarrow = constraints.maxWidth < 520;
            final chart = SizedBox(
              height: 220,
              child: PieChart(
                PieChartData(
                  centerSpaceRadius: 52,
                  sectionsSpace: 5,
                  sections: [
                    PieChartSectionData(
                      value: 30,
                      color: _primary,
                      radius: 22,
                      showTitle: false,
                    ),
                    PieChartSectionData(
                      value: 45,
                      color: _teal,
                      radius: 22,
                      showTitle: false,
                    ),
                    PieChartSectionData(
                      value: 25,
                      color: _lime,
                      radius: 22,
                      showTitle: false,
                    ),
                  ],
                ),
              ),
            );

            final legend = const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _LegendRow(color: _primary, label: 'Protein', value: '30%'),
                SizedBox(height: 12),
                _LegendRow(color: _teal, label: 'Carbs', value: '45%'),
                SizedBox(height: 12),
                _LegendRow(color: _lime, label: 'Fats', value: '25%'),
              ],
            );

            if (isNarrow) {
              return Column(
                children: [
                  chart,
                  const SizedBox(height: 16),
                  legend,
                ],
              );
            }

            return Row(
              children: [
                Expanded(flex: 3, child: chart),
                const SizedBox(width: 20),
                Expanded(flex: 2, child: legend),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _CaloriesExerciseChartCard extends StatelessWidget {
  const _CaloriesExerciseChartCard();

  static const Color _primary = HealixColors.navy;
  static const Color _secondaryText = HealixColors.sub;
  static const Color _lime = HealixColors.green;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Calories & Exercise (Week)',
          style: TextStyle(
            color: _primary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          height: 260,
          child: BarChart(
            BarChartData(
              minY: 0,
              maxY: 2200,
              alignment: BarChartAlignment.spaceAround,
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (value) => FlLine(
                  color: const Color(0xFFE8EEF1),
                  strokeWidth: 1,
                ),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 30,
                    getTitlesWidget: (value, meta) {
                      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      if (value.toInt() >= 0 && value.toInt() < days.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            days[value.toInt()],
                            style: const TextStyle(
                              color: _secondaryText,
                              fontSize: 12,
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 34,
                    getTitlesWidget: (value, meta) {
                      if (value == 0) {
                        return const Text(
                          '0',
                          style: TextStyle(color: _secondaryText, fontSize: 11),
                        );
                      }
                      return Text(
                        value.toInt().toString(),
                        style: const TextStyle(color: _secondaryText, fontSize: 11),
                      );
                    },
                  ),
                ),
              ),
              barGroups: const [
                _DailyBarGroup(x: 0, y: 1800),
                _DailyBarGroup(x: 1, y: 2050),
                _DailyBarGroup(x: 2, y: 1900),
                _DailyBarGroup(x: 3, y: 2000),
                _DailyBarGroup(x: 4, y: 1860),
                _DailyBarGroup(x: 5, y: 2200),
                _DailyBarGroup(x: 6, y: 1960),
              ].map((group) => group.data).toList(),
            ),
          ),
        ),
      ],
    );
  }
}

class _DailyBarGroup {
  const _DailyBarGroup({required this.x, required this.y});

  final int x;
  final double y;

  BarChartGroupData get data => BarChartGroupData(
        x: x,
        barRods: [
          BarChartRodData(
            toY: y,
            width: 22,
            color: _CaloriesExerciseChartCard._lime,
            borderRadius: BorderRadius.circular(8),
          ),
        ],
      );
}

class _RecommendationCard extends StatelessWidget {
  const _RecommendationCard();

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.18),
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(Icons.gps_fixed, color: Colors.white, size: 28),
        ),
        const SizedBox(width: 16),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AI Recommendation of the Day',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  height: 1.35,
                ),
              ),
              SizedBox(height: 12),
              Text(
                'You\'re 150 calories under your goal. Consider adding a healthy snack like nuts or a protein smoothie.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  height: 1.55,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LegendRow extends StatelessWidget {
  const _LegendRow({
    required this.color,
    required this.label,
    required this.value,
  });

  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: HealixColors.sub,
              fontSize: 14,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          value,
          style: const TextStyle(
            color: HealixColors.navy,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}
