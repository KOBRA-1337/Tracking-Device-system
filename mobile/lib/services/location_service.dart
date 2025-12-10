import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';

class LocationService {
  // Use centralized configuration
  static final String baseUrl = AppConfig.getApiUrl();

  StreamSubscription<Position>? _positionStreamSubscription;
  bool _isTracking = false;
  Timer? _locationTimer;

  bool get isTracking => _isTracking;

  Future<bool> requestPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    // Request background location permission for Android
    if (await Permission.locationAlways.isDenied) {
      await Permission.locationAlways.request();
    }

    return true;
  }

  Future<void> startTracking({
    Duration interval = const Duration(seconds: 20),
    required Function(Position) onLocationUpdate,
  }) async {
    if (_isTracking) {
      print('Location tracking already active');
      return;
    }

    // Request permissions first
    final hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw Exception('Location permissions not granted');
    }

    _isTracking = true;

    // Save tracking state to SharedPreferences for background service
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_tracking', true);

    // Get initial location
    Position? currentPosition;
    try {
      currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      await sendLocation(currentPosition);
      onLocationUpdate(currentPosition);
    } catch (e) {
      print('Error getting initial position: $e');
    }

    // Note: Background tracking relies on the position stream
    // The stream will continue as long as the app has location permissions
    // For true background tracking when app is closed, additional setup is required

    // Set up periodic location updates (foreground)
    _locationTimer = Timer.periodic(interval, (timer) async {
      try {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        await sendLocation(position);
        onLocationUpdate(position);
      } catch (e) {
        print('Error getting position: $e');
      }
    });

    // Listen to position stream for real-time updates (every 10 meters)
    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen(
      (Position position) async {
        await sendLocation(position);
        onLocationUpdate(position);
      },
      onError: (error) {
        print('Location stream error: $error');
      },
      cancelOnError: false,
    );
  }

  Future<void> stopTracking() async {
    _isTracking = false;
    
    // Save tracking state
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_tracking', false);
    
    await _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
    _locationTimer?.cancel();
    _locationTimer = null;
  }

  Future<void> pauseTracking() async {
    await stopTracking();
  }

  Future<void> resumeTracking({
    Duration? interval,
    Function(Position)? onLocationUpdate,
  }) async {
    // Require non-null parameters for resuming tracking
    if (interval == null || onLocationUpdate == null) {
      throw Exception('interval and onLocationUpdate must not be null when resuming tracking');
    }
    await startTracking(interval: interval, onLocationUpdate: onLocationUpdate);
  }

  Future<void> sendLocation(Position position) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        print('No authentication token found');
        return;
      }

      // Only send if position is valid
      // Check for NaN values and valid coordinate ranges
      if (position.latitude.isNaN || position.longitude.isNaN) {
        print('Invalid position: NaN values detected');
        return;
      }
      
      if (position.latitude.abs() > 90 || position.longitude.abs() > 180) {
        print('Invalid position: coordinates out of range');
        return;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/locations'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'speed': position.speed,
          'heading': position.heading,
          'altitude': position.altitude,
        }),
      );

      if (response.statusCode == 201) {
        print('Location sent successfully: ${position.latitude}, ${position.longitude}');
      } else {
        print('Failed to send location: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('Error sending location: $e');
      // Don't throw - allow tracking to continue even if one send fails
    }
  }

  Future<Position?> getCurrentLocation() async {
    try {
      final hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      print('Error getting current location: $e');
      return null;
    }
  }

  void dispose() {
    stopTracking();
  }
}

