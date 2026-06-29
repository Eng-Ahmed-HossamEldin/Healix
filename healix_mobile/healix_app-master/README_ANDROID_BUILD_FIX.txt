Android build fix included

This package fixes the AAR metadata error where AndroidX activity/core artifacts require Android Gradle Plugin 8.9.1+ while the project was using AGP 8.7.0.

Changes made:
- android/settings.gradle: AGP updated from 8.7.0 to 8.7.3.
- android/settings.gradle: Kotlin plugin updated from 2.0.20 to 2.1.0.
- android/build.gradle: AndroidX activity/core transitive dependencies are pinned to versions compatible with AGP 8.7.x.
- android/build.gradle: navigationevent-android is excluded because it is pulled by newer AndroidX activity releases and requires AGP 8.9.1+.

Recommended run steps on Windows:
1. Put the project in a path without spaces, for example C:\lasthealix\healix_buttons_wired_complete
2. Run:
   flutter clean
   flutter pub get
   flutter run --android-skip-build-dependency-validation

Or double click RUN_WINDOWS_BUILD_FIX.bat.
