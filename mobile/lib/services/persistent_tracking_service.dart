import 'dart:async';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';
import '../config/app_config.dart';
import 'bg_service.dart';

/// Unified service that manages persistent tracking across:
/// - Foreground service (active tracking)
/// - WorkManager (background periodic updates)
/// - AlarmManager (watchdog for service restart)
/// - Boot receiver (auto-restart after reboot)
class PersistentTrackingService {
  static const String _workManagerTaskName = 'locationUpdateTask';
  static const String _trackingStateKey = 'is_tracking';
  static const MethodChannel _channel = MethodChannel('com.example.smart_people_tracking/alarm');
  
  /// Initialize WorkManager for background periodic updates
  static Future<void> initialize() async {
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: false,
    );
  }
  
  /// Start persistent tracking
  static Future<void> startTracking() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_trackingStateKey, true);
    
    // Start foreground service for active tracking
    await BackgroundService.start();
    
    // Register WorkManager as backup for periodic updates (every 15 minutes)
    await Workmanager().registerPeriodicTask(
      _workManagerTaskName,
      _workManagerTaskName,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
    );
    
    // Schedule AlarmManager watchdog (3 redundant alarms)
    await _scheduleAlarmWatchdog();
    
    // Schedule JobScheduler (4th layer)
    await _scheduleJobScheduler();
    
    print('Persistent tracking started with 5-layer redundancy');
  }
  
  /// Stop persistent tracking
  static Future<void> stopTracking() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_trackingStateKey, false);
    
    // Stop foreground service
    await BackgroundService.stop();
    
    // Cancel WorkManager tasks
    await Workmanager().cancelByUniqueName(_workManagerTaskName);
    
    // Cancel AlarmManager watchdog
    await _cancelAlarmWatchdog();
    
    // Cancel JobScheduler
    await _cancelJobScheduler();
    
    print('All tracking layers stopped');
  }
  
  /// Schedule AlarmManager as watchdog
  static Future<void> _scheduleAlarmWatchdog() async {
    try {
      await _channel.invokeMethod('scheduleAlarm');
      print('AlarmManager watchdog scheduled');
    } catch (e) {
      print('Failed to schedule alarm: $e');
    }
  }
  
  /// Cancel AlarmManager watchdog
  static Future<void> _cancelAlarmWatchdog() async {
    try {
      await _channel.invokeMethod('cancelAlarm');
      print('AlarmManager watchdog cancelled');
    } catch (e) {
      print('Failed to cancel alarm: $e');
    }
  }
  
  /// Schedule JobScheduler as 4th layer
  static Future<void> _scheduleJobScheduler() async {
    try {
      await _channel.invokeMethod('scheduleJob');
      print('JobScheduler scheduled');
    } catch (e) {
      print('Failed to schedule job: $e');
    }
  }
  
  /// Cancel JobScheduler
  static Future<void> _cancelJobScheduler() async {
    try {
      await _channel.invokeMethod('cancelJob');
      print('JobScheduler cancelled');
    } catch (e) {
      print('Failed to cancel job: $e');
    }
  }
  
  /// Check if tracking is active
  static Future<bool> isTracking() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_trackingStateKey) ?? false;
  }
  
  /// Resume tracking if it was active (call on app start)
  static Future<void> resumeIfActive() async {
    if (await isTracking()) {
      print('Resuming tracking from previous session');
      await startTracking();
    }
  }
}

/// WorkManager callback dispatcher (must be top-level function)
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      print('WorkManager task started: $task');
      
      // Get tracking state
      final prefs = await SharedPreferences.getInstance();
      final isTracking = prefs.getBool('is_tracking') ?? false;
      
      if (!isTracking) {
        print('Tracking is disabled, skipping update');
        return Future.value(true);
      }
      
      // Get current location
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      // Send to backend
      final token = prefs.getString('token');
      if (token != null) {
        await _sendLocationToBackend(position, token);
        print('WorkManager location sent successfully');
      }
      
      return Future.value(true);
    } catch (e) {
      print('WorkManager task error: $e');
      return Future.value(false);
    }
  });
}

/// Helper function to send location to backend
Future<void> _sendLocationToBackend(Position position, String token) async {
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
    
    if (response.statusCode != 201) {
      print('Failed to send location: ${response.statusCode}');
    }
  } catch (e) {
    print('Error sending location: $e');
  }
}
