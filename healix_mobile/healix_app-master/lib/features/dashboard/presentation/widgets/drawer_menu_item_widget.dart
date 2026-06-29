import 'package:flutter/material.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import '../../../../model/drawer_item_model.dart';

class DrawerMenuItemWidget extends StatelessWidget {
  final DrawerItemModel item;
  final bool isSelected;
  final VoidCallback onTap;

  const DrawerMenuItemWidget({
    super.key,
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () {
        final navigator = Navigator.of(context, rootNavigator: true);
        onTap();
        if (navigator.canPop()) navigator.pop();
        navigator.push(
          MaterialPageRoute(builder: (_) => item.screen),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white.withOpacity(0.14) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: isSelected
              ? Border.all(color: Colors.white.withOpacity(0.08))
              : null,
        ),
        child: Row(
          children: [
            Icon(
              item.icon,
              color: isSelected ? HealixColors.orange : Colors.white.withOpacity(0.6),
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                item.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: isSelected ? HealixColors.orange : Colors.white.withOpacity(0.6),
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
