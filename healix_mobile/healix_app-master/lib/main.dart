import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'core/routes/app_routes.dart';
import 'core/routes/page_routes_name.dart';
import 'core/services/api_service.dart';
import 'core/services/auth_service.dart';
import 'core/state/app_state.dart';
import 'core/theme_manage/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.initialize();
  await AuthService.initialize();
  await appState.initialize();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Healix',
          theme: AppTheme.lightTheme,
          initialRoute: PageRoutesName.splash,
          onGenerateRoute: AppRoutes.onGenerateRoutes,
          builder: (context, child) {
            final mediaQuery = MediaQuery.of(context);
            final textScale = mediaQuery.textScaler.scale(1.0).clamp(0.85, 1.08).toDouble();
            return MediaQuery(
              data: mediaQuery.copyWith(textScaler: TextScaler.linear(textScale)),
              child: child ?? const SizedBox.shrink(),
            );
          },
        );
      },
    );
  }
}
