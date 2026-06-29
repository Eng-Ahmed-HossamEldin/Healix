import 'package:flutter/material.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_feature_scaffold.dart';

import 'package:healix_app/features/health_tracking/screens/step_counter.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  void _open(BuildContext context, Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  IconData _iconFor(String icon) {
    switch (icon) {
      case 'tips':
        return Icons.auto_awesome_outlined;
      case 'steps':
        return Icons.directions_walk_outlined;
      case 'challenge':
        return Icons.group_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Widget _screenFor(String id) {
    switch (id) {
      case 'steps-progress':
        return const StepCounter();
      default:
        return const StepCounter();
    }
  }

  void _tapNotification(AppNotification notification) {
    appState.markNotificationRead(notification.id);
    _open(context, _screenFor(notification.id));
  }

  @override
  Widget build(BuildContext context) {
    return AppFeatureScaffold(
      title: 'Notifications',
      subtitle: 'Recent updates from your coach, community, and health goals.',
      icon: Icons.notifications_active_outlined,
      appBarActions: [
        TextButton(
          onPressed: () { appState.markAllNotificationsRead(); setState(() {}); },
          child: const Text('Mark all read', style: TextStyle(fontWeight: FontWeight.w900)),
        ),
      ],
      children: [
        AnimatedBuilder(
          animation: appState,
          builder: (context, _) => FeatureCard(
            title: appState.unreadNotificationCount == 0 ? 'All Caught Up' : '${appState.unreadNotificationCount} New Alert${appState.unreadNotificationCount == 1 ? '' : 's'}',
            child: Column(
              children: [
                if (appState.notifications.isEmpty)
                  const FeatureMetricRow(label: 'No notifications yet', value: 'Clear', icon: Icons.notifications_none_outlined)
                else
                  ...appState.notifications.map((notification) {
                    final isRead = appState.isNotificationRead(notification.id);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: FeatureActionTile(
                        icon: _iconFor(notification.icon),
                        title: notification.title,
                        subtitle: notification.subtitle,
                        trailingText: isRead ? 'Read' : notification.time,
                        unread: !isRead,
                        onTap: () => _tapNotification(notification),
                      ),
                    );
                  }),
              ],
            ),
          ),
        ),
        const FeatureCard(
          title: 'Reminder Preferences',
          subtitle: 'Current reminder schedule',
          child: Column(
            children: [
              FeatureMetricRow(label: 'Meal logging reminder', value: '8:00 AM', icon: Icons.restaurant_menu_outlined),
              SizedBox(height: 10),
              FeatureMetricRow(label: 'Workout reminder', value: '6:00 PM', icon: Icons.fitness_center_outlined),
              SizedBox(height: 10),
              FeatureMetricRow(label: 'Water reminder', value: 'Every 2h', icon: Icons.water_drop_outlined),
            ],
          ),
        ),
      ],
    );
  }
}
