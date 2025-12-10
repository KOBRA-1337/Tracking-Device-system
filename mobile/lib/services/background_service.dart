import 'dart:async';
import 'dart:convert';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:workmanager/workmanager.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

// Initialize notification plugin
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// Background callback - runs in isolate
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      print('Background task started: $task');
      
      // Get location
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      print('Got position: ${position.latitude}, ${position.longitude}');
      
      // Get token from SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      if (token == null) {
        print('No token found, skipping location send');
        return Future.value(true);
      }
      
      // Send location to server
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
      
      print('Location sent: ${response.statusCode}');
      
      // Update notification with current location
      await _updateNotification(position);
      
      return Future.value(true);
    } catch (e) {
      print('Background task error: $e');
      return Future.value(false);
    }
  });
}

Future<void> _updateNotification(Position position) async {
  const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
    'location_tracking',
    'Location Tracking',
    channelDescription: 'Continuous location tracking',
    importance: Importance.low,
    priority: Priority.low,
    ongoing: true,
    autoCancel: false,
    showWhen: false,
  );
  
  const NotificationDetails notificationDetails = NotificationDetails(
    android: androidDetails,
  );
  
  await flutterLocalNotificationsPlugin.show(
    888,
    'Location Tracking Active',
    'Lat: ${position.latitude.toStringAsFixed(6)}, Lon: ${position.longitude.toStringAsFixed(6)}',
    notificationDetails,
  );
}

class BackgroundLocationService {
  static const String taskName = 'location_tracking_task';
  
  // Initialize background service
  static Future<void> initialize() async {
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: false,
    );
    
    // Initialize notifications
    const AndroidInitializationSettings androidSettings = 
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
    );
    
    await flutterLocalNotificationsPlugin.initialize(initSettings);
  }
  
  // Start background tracking
  static Future<void> startTracking() async {
    // Cancel any existing task
    await Workmanager().cancelAll();
    
    // Create notification channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'location_tracking',
      'Location Tracking',
      description: 'Continuous location tracking',
      importance: Importance.low,
    );
    
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
    
    // Show initial notification
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'location_tracking',
      'Location Tracking',
      channelDescription: 'Continuous location tracking',
      importance: Importance.low,
      priority: Priority.low,
      ongoing: true,
      autoCancel: false,
      showWhen: false,
    );
    
    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
    );
    
    await flutterLocalNotificationsPlugin.show(
      888,
      'Location Tracking Active',
      'Initializing location tracking...',
      notificationDetails,
    );
    
    // Register periodic task (runs every 15 minutes minimum)
    await Workmanager().registerPeriodicTask(
      taskName,
      taskName,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
      existingWorkPolicy: ExistingPeriodicWorkPolicy.replace,
    );
    
    print('Background tracking started');
  }
  
  // Stop background tracking
  static Future<void> stopTracking() async {
    await Workmanager().cancelAll();
    await flutterLocalNotificationsPlugin.cancel(888);
    print('Background tracking stopped');
  }
}
