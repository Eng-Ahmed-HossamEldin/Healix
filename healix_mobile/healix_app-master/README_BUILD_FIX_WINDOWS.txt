This package includes a Gradle daemon stability fix for Windows machines.

If you see:
  Gradle build daemon disappeared unexpectedly
or:
  JVM crash log found: hs_err_pidXXXXX.log

Run:
  flutter clean
  flutter pub get
  flutter run

If it still happens, run RUN_WINDOWS_BUILD_FIX.bat from this folder.

What changed:
- android/gradle.properties now disables the persistent Gradle daemon.
- Gradle memory was reduced from -Xmx4G / MaxMetaspaceSize 2G to safer values.
- Parallel Gradle execution is disabled to avoid daemon crashes on weaker machines.

If the crash still happens after this, open this file and send it:
  android/hs_err_pidXXXXX.log
