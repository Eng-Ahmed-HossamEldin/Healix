@echo off
cd /d %~dp0
echo Stopping Gradle daemons...
cd android
if exist gradlew.bat (
  call gradlew.bat --stop
) else (
  gradle --stop 2>nul
)
cd ..
echo Cleaning Flutter project...
flutter clean
if exist build rmdir /s /q build
if exist .dart_tool rmdir /s /q .dart_tool
if exist android\.gradle rmdir /s /q android\.gradle
if exist android\app\build rmdir /s /q android\app\build
flutter pub get
echo Running app...
flutter run --android-skip-build-dependency-validation
pause
