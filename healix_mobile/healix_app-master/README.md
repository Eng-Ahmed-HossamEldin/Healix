# Healix App

A complete Flutter health and wellness tracking app package.

## How to run

1. Open this folder in Android Studio.
2. Run:

```bash
flutter pub get
flutter clean
flutter run
```

## Test account

Email: john.doe@example.com
Password: Healix@123

You can also create a new account from Sign Up. Sign Up collects name, email, age, height, weight and password.

## Notes

- Login no longer auto-creates accounts.
- Accounts and core app data are stored locally using `shared_preferences`.
- Android Gradle plugin is set to 8.7.3.
- Kotlin plugin is set to 2.1.0.


## Android build fix included
This package uses Android Gradle Plugin 8.9.1 and Kotlin 2.1.0 to match recent AndroidX dependencies such as androidx.activity 1.12.x and androidx.core 1.18.x.

Recommended commands after extracting:

```bash
flutter clean
rm -rf android/.gradle .dart_tool build
flutter pub get
flutter run
```
