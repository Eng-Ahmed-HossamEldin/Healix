import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../core/constants/app_assets.dart';
import '../../../../core/routes/page_routes_name.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/state/app_state.dart';

class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView> {
  Timer? _navigationTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _navigationTimer = Timer(const Duration(milliseconds: 900), () {
        if (!mounted) return;
        final nextRoute = AuthService.rememberMe.value && appState.hasSession ? PageRoutesName.dashboard : PageRoutesName.login;
        Navigator.of(context).pushReplacementNamed(nextRoute);
      });
    });
  }

  @override
  void dispose() {
    _navigationTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Image.asset(
          AppAssets.logo,
          width: 110,
          height: 110,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return const Icon(
              Icons.health_and_safety,
              size: 82,
              color: Color(0xFF0B5670),
            );
          },
        ),
      ),
    );
  }
}
