import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/location_service.dart';
import '../services/auth_service.dart';
import '../services/persistent_tracking_service.dart';
import '../utils/manufacturer_helper.dart';
import 'login_screen.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> with WidgetsBindingObserver {
  final LocationService _locationService = LocationService();
  final AuthService _authService = AuthService();
  Position? _currentPosition;
  String _statusMessage = 'Not tracking';
  String _currentUsername = '';
  bool _isTracking = false;

  // Dark theme colors matching the dashboard
  static const Color _bgColor = Color(0xFF0F1117);
  static const Color _cardColor = Color(0xFF1A1D24);
  static const Color _borderColor = Color(0xFF2A2D35);
  static const Color _textPrimary = Colors.white;
  static const Color _textSecondary = Color(0xFF71717A);
  static const Color _emerald = Color(0xFF10B981);
  static const Color _red = Color(0xFFEF4444);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeLocation();
    _checkTrackingState();
    _loadUsername();
    _checkFirstTimeSetup();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _locationService.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // When app is paused/detached, set flag to show login on next open
    // but DON'T clear tokens - tracking needs them
    if (state == AppLifecycleState.paused || state == AppLifecycleState.detached) {
      _setRequireLoginOnNextOpen();
    }
  }

  Future<void> _setRequireLoginOnNextOpen() async {
    // Set flag to require login on next app open
    // but keep all credentials for background tracking
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('require_login_on_open', true);
    // Token and user_id stay intact for tracking to continue
  }

  Future<void> _loadUsername() async {
    final prefs = await SharedPreferences.getInstance();
    final username = prefs.getString('username') ?? 'User';
    if (mounted) {
      setState(() {
        _currentUsername = username;
      });
    }
  }

  Future<void> _checkFirstTimeSetup() async {
    final prefs = await SharedPreferences.getInstance();
    final hasCompletedSetup = prefs.getBool('has_completed_autostart_setup') ?? false;

    if (!hasCompletedSetup && mounted) {
      // First time - show battery optimization and autostart
      await ManufacturerHelper.handleAllPermissions(context);
      await prefs.setBool('has_completed_autostart_setup', true);
    }
  }

  Future<void> _checkTrackingState() async {
    final prefs = await SharedPreferences.getInstance();
    final wasTracking = prefs.getBool('is_tracking') ?? false;

    if (wasTracking && mounted) {
      setState(() {
        _isTracking = true;
        _statusMessage = 'Tracking active';
      });
      await _startTracking();
    }
  }

  Future<void> _initializeLocation() async {
    final position = await _locationService.getCurrentLocation();
    if (position != null && mounted) {
      setState(() {
        _currentPosition = position;
      });
    }
  }

  Future<void> _startTracking() async {
    try {
      await _locationService.startTracking(
        interval: const Duration(seconds: 20),
        onLocationUpdate: (position) {
          if (mounted) {
            setState(() {
              _currentPosition = position;
              _statusMessage = 'Tracking active';
            });
          }
        },
      );

      await PersistentTrackingService.startTracking();

      if (mounted) {
        setState(() {
          _isTracking = true;
          _statusMessage = 'Tracking active';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('24/7 location tracking started'),
            backgroundColor: _emerald,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _statusMessage = 'Error: ${e.toString()}';
        });
      }
    }
  }

  Future<void> _stopTracking() async {
    await _locationService.stopTracking();
    await PersistentTrackingService.stopTracking();
    if (mounted) {
      setState(() {
        _isTracking = false;
        _statusMessage = 'Tracking stopped';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Location tracking stopped'),
          backgroundColor: _red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  Future<void> _logout() async {
    await _locationService.stopTracking();
    await PersistentTrackingService.stopTracking();
    await _authService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isTracking = _isTracking;

    return Scaffold(
      backgroundColor: _bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: _bgColor,
                border: Border(bottom: BorderSide(color: _borderColor.withOpacity(0.5))),
              ),
              child: Row(
                children: [
                  // Brand
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.2,
                      ),
                      children: [
                        TextSpan(text: 'TRACKING ', style: TextStyle(color: _textPrimary)),
                        TextSpan(text: 'SYSTEM', style: TextStyle(color: _emerald)),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // User info
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _cardColor,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _borderColor),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.indigo, Colors.purple],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              _currentUsername.isNotEmpty ? _currentUsername[0].toUpperCase() : 'U',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _currentUsername,
                          style: TextStyle(color: _textPrimary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Main content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Status Card
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: _cardColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: _borderColor),
                      ),
                      child: Column(
                        children: [
                          // Status icon and text
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: isTracking ? _emerald.withOpacity(0.15) : _borderColor.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(40),
                            ),
                            child: Icon(
                              isTracking ? Icons.location_on : Icons.location_off,
                              color: isTracking ? _emerald : _textSecondary,
                              size: 40,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _statusMessage,
                            style: TextStyle(
                              color: _textPrimary,
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: isTracking ? _emerald.withOpacity(0.15) : _borderColor.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isTracking ? '24/7 Active' : 'Inactive',
                              style: TextStyle(
                                color: isTracking ? _emerald : _textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Location Info Card
                    if (_currentPosition != null)
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: _cardColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: _borderColor),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.my_location, color: _emerald, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'Current Location',
                                  style: TextStyle(
                                    color: _textSecondary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow('Latitude', _currentPosition!.latitude.toStringAsFixed(6)),
                            _buildInfoRow('Longitude', _currentPosition!.longitude.toStringAsFixed(6)),
                            if (_currentPosition!.accuracy > 0)
                              _buildInfoRow('Accuracy', '±${_currentPosition!.accuracy.toStringAsFixed(0)}m'),
                            if (_currentPosition!.speed > 0)
                              _buildInfoRow('Speed', '${(_currentPosition!.speed * 3.6).toStringAsFixed(1)} km/h'),
                          ],
                        ),
                      ),

                    const Spacer(),

                    // Action Buttons
                    if (!isTracking)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _startTracking,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _emerald,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.play_arrow, size: 24),
                              const SizedBox(width: 8),
                              const Text(
                                'Start Tracking',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),

                    if (isTracking)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _stopTracking,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.stop, size: 24),
                              const SizedBox(width: 8),
                              const Text(
                                'Stop Tracking',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),

                    const SizedBox(height: 12),

                    // Info banner
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _emerald.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _emerald.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: _emerald, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              isTracking
                                  ? 'Tracking continues in background, even when app is closed.'
                                  : 'Your location will be shared with authorized administrators.',
                              style: TextStyle(color: _emerald, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Logout button
                    TextButton(
                      onPressed: _logout,
                      child: Text(
                        'Sign Out',
                        style: TextStyle(color: _textSecondary, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: _textSecondary, fontSize: 14)),
          Text(value, style: TextStyle(color: _textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
