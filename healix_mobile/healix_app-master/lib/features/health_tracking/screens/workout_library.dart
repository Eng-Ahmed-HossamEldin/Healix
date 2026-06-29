import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';

class WorkoutLibrary extends StatefulWidget {
  const WorkoutLibrary({super.key});

  @override
  State<WorkoutLibrary> createState() => _WorkoutLibraryState();
}

class _WorkoutLibraryState extends State<WorkoutLibrary> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'All';
  String _selectedLevel = 'All Levels';

  final List<_WorkoutItem> _workouts = const [
    _WorkoutItem('HIIT Cardio Blast', 20, 250, 'None', 'Hard', 'Cardio'),
    _WorkoutItem('Full Body Strength', 45, 350, 'Dumbbells', 'Medium', 'Strength'),
    _WorkoutItem('Yoga Flow For Beginners', 30, 120, 'Mat', 'Easy', 'Flexibility'),
    _WorkoutItem('Core Crusher Abs Workout', 15, 100, 'None', 'Medium', 'Core'),
    _WorkoutItem('Upper Body Power Workout', 40, 320, 'Dumbbells', 'Hard', 'Strength'),
    _WorkoutItem('Lower Body Legs And Glutes', 35, 280, 'Dumbbells', 'Medium', 'Strength'),
    _WorkoutItem('Beginner Full Body Workout', 25, 180, 'None', 'Easy', 'Strength'),
    _WorkoutItem('Fat Burning Cardio Workout', 30, 300, 'None', 'Medium', 'Cardio'),
    _WorkoutItem('Jump Rope Cardio Workout', 18, 220, 'Jump rope', 'Medium', 'Cardio'),
    _WorkoutItem('Mobility And Stretch Routine', 20, 80, 'Mat', 'Easy', 'Flexibility'),
    _WorkoutItem('Pilates Full Body Workout', 28, 160, 'Mat', 'Easy', 'Core'),
    _WorkoutItem('Tabata Workout No Equipment', 16, 240, 'None', 'Hard', 'Cardio'),
    _WorkoutItem('Push Pull Strength Workout', 45, 360, 'Dumbbells', 'Hard', 'Strength'),
    _WorkoutItem('Back And Biceps Workout', 35, 260, 'Dumbbells', 'Medium', 'Strength'),
    _WorkoutItem('Chest And Triceps Workout', 35, 270, 'Dumbbells', 'Medium', 'Strength'),
    _WorkoutItem('10 Minute Morning Cardio', 10, 90, 'None', 'Easy', 'Cardio'),
    _WorkoutItem('Low Impact Cardio Workout', 25, 190, 'None', 'Easy', 'Cardio'),
    _WorkoutItem('Advanced Burpee Workout', 20, 300, 'None', 'Hard', 'Cardio'),
    _WorkoutItem('Yoga For Flexibility', 35, 130, 'Mat', 'Easy', 'Flexibility'),
    _WorkoutItem('Shoulder Strength Workout', 25, 210, 'Dumbbells', 'Medium', 'Strength'),
    _WorkoutItem('Bodyweight Squat Workout', 20, 170, 'None', 'Easy', 'Strength'),
    _WorkoutItem('Plank Challenge Workout', 12, 85, 'None', 'Medium', 'Core'),
    _WorkoutItem('Kettlebell Full Body Workout', 30, 330, 'Kettlebell', 'Hard', 'Strength'),
    _WorkoutItem('Walking Workout At Home', 30, 180, 'None', 'Easy', 'Cardio'),
  ];

  List<_WorkoutItem> get _filteredWorkouts => _workouts.where((item) {
    final filterOk = _selectedFilter == 'All' || item.type == _selectedFilter;
    final levelOk = _selectedLevel == 'All Levels' || item.level == _selectedLevel;
    final query = _searchController.text.toLowerCase().trim();
    final searchOk = query.isEmpty || item.title.toLowerCase().contains(query) || item.type.toLowerCase().contains(query) || item.equipment.toLowerCase().contains(query);
    return filterOk && levelOk && searchOk;
  }).toList();

  Future<void> _playWorkout(_WorkoutItem item) async {
    appState.addWorkout(item.title, item.type, item.minutes, item.calories, intensity: item.level);
    final uri = item.youtubeUri;
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!mounted) return;
    AppActions.showSnack(
      context,
      launched ? '${item.title} logged and YouTube opened' : '${item.title} logged. Could not open YouTube.',
      icon: Icons.play_arrow_rounded,
      color: HealixColors.navy,
    );
  }

  void _logOnly(_WorkoutItem item) {
    appState.addWorkout(item.title, item.type, item.minutes, item.calories, intensity: item.level);
    AppActions.showSnack(context, '${item.title} logged', icon: Icons.fitness_center_rounded, color: HealixColors.green);
  }

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Workout Library',
      selectedItem: 'Workout Library',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _GradientHeader(
            title: 'Workout Library',
            subtitle: 'More workouts, calories, and YouTube video search for every exercise.',
            colors: [HealixColors.navy, HealixColors.green],
          ),
          const SizedBox(height: 18),
          _SearchBox(controller: _searchController, onChanged: (_) => setState(() {})),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: ['All', 'Strength', 'Cardio', 'Core', 'Flexibility'].map((filter) {
              final selected = _selectedFilter == filter;
              return ChoiceChip(
                label: Text(filter),
                selected: selected,
                onSelected: (_) => setState(() => _selectedFilter = filter),
                selectedColor: HealixColors.navy,
                labelStyle: TextStyle(
                  color: selected ? Colors.white : HealixColors.navy, 
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                backgroundColor: Colors.white.withOpacity(0.88),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: selected ? Colors.transparent : HealixColors.border),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 420;
              const title = _SectionTitle('Featured Workouts');
              final dropdown = Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white, 
                  borderRadius: BorderRadius.circular(12), 
                  border: Border.all(color: HealixColors.border),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedLevel,
                    isDense: true,
                    style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold, fontSize: 13),
                    items: ['All Levels', 'Easy', 'Medium', 'Hard'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                    onChanged: (value) => setState(() => _selectedLevel = value ?? 'All Levels'),
                  ),
                ),
              );
              if (compact) return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [title, const SizedBox(height: 10), dropdown]);
              return Row(children: [const Expanded(child: title), dropdown]);
            },
          ),
          const SizedBox(height: 16),
          if (_filteredWorkouts.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text('No workouts match your filters.', style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold)),
            )
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final twoColumns = constraints.maxWidth >= 900;
                if (!twoColumns) {
                  return Column(
                    children: _filteredWorkouts.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 14), 
                      child: _WorkoutCard(item: item, onPlay: () => _playWorkout(item), onLog: () => _logOnly(item)),
                    )).toList(),
                  );
                }
                return Wrap(
                  spacing: 14,
                  runSpacing: 14,
                  children: _filteredWorkouts.map((item) => SizedBox(
                    width: (constraints.maxWidth - 14) / 2, 
                    child: _WorkoutCard(item: item, onPlay: () => _playWorkout(item), onLog: () => _logOnly(item)),
                  )).toList(),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _WorkoutItem {
  final String title;
  final int minutes;
  final int calories;
  final String equipment;
  final String level;
  final String type;
  const _WorkoutItem(this.title, this.minutes, this.calories, this.equipment, this.level, this.type);

  Uri get youtubeUri => Uri.https('www.youtube.com', '/results', {'search_query': '$title workout proper form'});
  String get duration => '$minutes min';
  String get caloriesText => '$calories kcal';
  String get youtubeLabel => 'YouTube: $title';
}

class _WorkoutCard extends StatelessWidget {
  final _WorkoutItem item;
  final VoidCallback onPlay;
  final VoidCallback onLog;
  const _WorkoutCard({required this.item, required this.onPlay, required this.onLog});

  Color get levelColor {
    switch (item.level) {
      case 'Hard': return const Color(0xFFEF4444);
      case 'Medium': return const Color(0xFFF59E0B);
      default: return const Color(0xFF65CD45);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: const EdgeInsets.all(18),
      radius: 20,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 520;
          final playIcon = Container(
            width: compact ? 56 : 64,
            height: compact ? 56 : 64,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Colors.purple, Colors.pinkAccent], 
                begin: Alignment.topLeft, 
                end: Alignment.bottomRight,
              ), 
              borderRadius: BorderRadius.circular(16),
            ),
            child: IconButton(
              onPressed: onPlay, 
              icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 32), 
              tooltip: 'Open YouTube video',
            ),
          );
          final info = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      item.title, 
                      style: const TextStyle(fontSize: 16, height: 1.25, fontWeight: FontWeight.bold, color: HealixColors.navy),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), 
                    decoration: BoxDecoration(
                      color: levelColor.withOpacity(0.12), 
                      borderRadius: BorderRadius.circular(8),
                    ), 
                    child: Text(
                      item.level, 
                      style: TextStyle(color: levelColor, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 12, 
                runSpacing: 8, 
                children: [
                  _SmallInfo(icon: Icons.access_time, text: item.duration), 
                  _SmallInfo(icon: Icons.local_fire_department_rounded, text: item.caloriesText, iconColor: HealixColors.orange), 
                  _SmallInfo(icon: Icons.category_outlined, text: item.type),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Equipment: ${item.equipment}', 
                style: const TextStyle(color: HealixColors.sub, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                item.youtubeLabel, 
                maxLines: 1, 
                overflow: TextOverflow.ellipsis, 
                style: const TextStyle(color: HealixColors.navyLight, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  ElevatedButton.icon(
                    onPressed: onPlay, 
                    icon: const Icon(Icons.ondemand_video_rounded, size: 16, color: Colors.white), 
                    label: const Text('Open on YouTube', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), 
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HealixColors.navy, 
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: onLog, 
                    icon: const Icon(Icons.check_circle_outline_rounded, size: 16), 
                    label: const Text('Log only'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: HealixColors.navy,
                      side: const BorderSide(color: HealixColors.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ],
          );
          if (compact) return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [playIcon, const SizedBox(height: 14), info]);
          return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [playIcon, const SizedBox(width: 16), Expanded(child: info)]);
        },
      ),
    );
  }
}

class _SmallInfo extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? iconColor;
  const _SmallInfo({required this.icon, required this.text, this.iconColor});
  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min, 
        children: [
          Icon(icon, size: 16, color: iconColor ?? HealixColors.sub), 
          const SizedBox(width: 4), 
          Text(text, style: const TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      );
}

class _SearchBox extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  const _SearchBox({required this.controller, this.onChanged});
  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.88),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: HealixColors.border),
        ),
        child: TextField(
          controller: controller, 
          onChanged: onChanged, 
          style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
          decoration: const InputDecoration(
            hintText: 'Search workouts...', 
            prefixIcon: Icon(Icons.search, color: HealixColors.sub), 
            border: InputBorder.none, 
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      );
}

class _GradientHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Color> colors;
  const _GradientHeader({required this.title, required this.subtitle, required this.colors});
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity, 
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24), 
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight), 
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: HealixColors.navy.withOpacity(0.12),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ), 
        child: Row(
          children: [
            const Icon(Icons.fitness_center_rounded, color: Colors.white, size: 28), 
            const SizedBox(width: 14), 
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, 
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)), 
                  const SizedBox(height: 4), 
                  Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.35)),
                ],
              ),
            ),
          ],
        ),
      );
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Text(text, style: const TextStyle(color: HealixColors.navy, fontSize: 16, fontWeight: FontWeight.bold));
}
