import 'dart:async';
import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

// Top-level function for background execution
@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  try {
    // Ensure Dart is ready
    DartPluginRegistrant.ensureInitialized();

    // Initialize notifications
    final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
        FlutterLocalNotificationsPlugin();

    // Bring to foreground
    await flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(
      const AndroidNotificationChannel(
        'location_tracking',
        'Location Tracking',
        description: 'Continuous location tracking service',
        importance: Importance.low,
      ),
    );

    
    // Listen for stop command
    service.on('stopService').listen((event) {
      service.stopSelf();
    });

    // Get token
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    if (token == null) {
      print('No token in background service');
      // We might want to stop, but let's keep running to wait for login
    }

    // Start location stream
    final locationSettings = const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    Geolocator.getPositionStream(locationSettings: locationSettings).listen((Position position) async {
      // Update notification
      if (service is AndroidServiceInstance) {
        if (await service.isForegroundService()) {
          flutterLocalNotificationsPlugin.show(
            888,
            'Location Tracking Active',
            'Lat: ${position.latitude.toStringAsFixed(5)}, Lon: ${position.longitude.toStringAsFixed(5)}',
            const NotificationDetails(
              android: AndroidNotificationDetails(
                'location_tracking',
                'Location Tracking',
                icon: 'ic_launcher',
                ongoing: true,
              ),
            ),
          );
        }
      }

      // Send to backend
      await _sendLocation(position, token);
    });
    
    // Also set up a periodic timer as a backup (every 20 seconds)
    Timer.periodic(const Duration(seconds: 20), (timer) async {
      try {
        final position = await Geolocator.getCurrentPosition();
        await _sendLocation(position, token);
      } catch (e) {
        print('Background timer error: $e');
      }
    });
  } catch (e) {
    print('Background service error: $e');
  }
}

@pragma('vm:entry-point')
Future<bool> onBgIos(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

Future<void> _sendLocation(Position position, String? token) async {
  if (token == null) return;
  
  try {
    final baseUrl = AppConfig.getApiUrl();
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
    print('Background location sent: ${response.statusCode}');
  } catch (e) {
    print('Error sending background location: $e');
  }
}

class BackgroundService {
  static Future<void> initialize() async {
    final service = FlutterBackgroundService();

    // Create the notification channel in the main isolate
    // This ensures it exists before the background service tries to use it
    final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
        FlutterLocalNotificationsPlugin();

    await flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(
      const AndroidNotificationChannel(
        'location_tracking',
        'Location Tracking',
        description: 'Continuous location tracking service',
        importance: Importance.low,
      ),
    );
    
    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false, // Don't auto-start, wait for user
        isForegroundMode: true,
        notificationChannelId: 'location_tracking',
        initialNotificationTitle: 'Location Tracking Active',
        initialNotificationContent: 'Ready to track',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: onBgIos,
      ),
    );
  }
  
  static Future<void> start() async {
    final service = FlutterBackgroundService();
    if (!await service.isRunning()) {
      service.startService();
    }
  }
  
  static Future<void> stop() async {
    final service = FlutterBackgroundService();
    service.invoke('stopService');
  }
}
