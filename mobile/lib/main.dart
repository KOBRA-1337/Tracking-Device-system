import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login_screen.dart';
import 'screens/tracking_screen.dart';
import 'services/bg_service.dart';
import 'services/persistent_tracking_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize background service
  await BackgroundService.initialize();
  
  // Initialize WorkManager for persistent tracking
  await PersistentTrackingService.initialize();
  
  // Resume tracking if it was active before app was killed
  await PersistentTrackingService.resumeIfActive();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tracking System',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF10B981),
        scaffoldBackgroundColor: const Color(0xFF0F1117),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF10B981),
          secondary: const Color(0xFF10B981),
          surface: const Color(0xFF1A1D24),
        ),
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    checkAuth();
  }

  Future<void> checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final requireLogin = prefs.getBool('require_login_on_open') ?? false;
    
    // Clear the require_login flag after reading it
    if (requireLogin) {
      await prefs.setBool('require_login_on_open', false);
    }
    
    setState(() {
      // Show login if no token OR if require_login flag was set
      _isAuthenticated = token != null && token.isNotEmpty && !requireLogin;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return _isAuthenticated
        ? const TrackingScreen()
        : const LoginScreen();
  }
}
