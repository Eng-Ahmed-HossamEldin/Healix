import 'package:flutter/material.dart';

class DrawerItemModel {
  final IconData icon;
  final String label;
  final Widget screen;

  const DrawerItemModel({
    required this.icon,
    required this.label,
    required this.screen,
  });
}