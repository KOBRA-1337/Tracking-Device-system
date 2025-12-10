import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Helper class to detect device manufacturer and automatically
/// open manufacturer-specific battery optimization settings
class ManufacturerHelper {
  static String? _manufacturer;
  static const MethodChannel _permissionChannel = MethodChannel('com.example.smart_people_tracking/permissions');
  
  /// Get device manufacturer
  static Future<String> getManufacturer() async {
    if (_manufacturer != null) return _manufacturer!;
    
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      _manufacturer = androidInfo.manufacturer.toLowerCase();
      return _manufacturer!;
    }
    return 'unknown';
  }
  
  /// Check if device is from aggressive battery-saving manufacturer
  static Future<bool> isAggressiveManufacturer() async {
    final manufacturer = await getManufacturer();
    return ['xiaomi', 'redmi', 'poco', 'huawei', 'honor', 'oppo', 'vivo', 'oneplus', 'samsung']
        .contains(manufacturer);
  }
  
  /// Get manufacturer-specific instructions
  static Future<String> getManufacturerInstructions() async {
    final manufacturer = await getManufacturer();
    
    switch (manufacturer) {
      case 'xiaomi':
      case 'redmi':
      case 'poco':
        return '''
**Xiaomi/Redmi/POCO Settings:**

1. Battery & Performance → Manage apps' battery usage
   → Find "People Tracking" → No restrictions

2. Apps → Manage apps → People Tracking
   → Autostart → Enable
   → Battery saver → No restrictions

3. Security → Permissions → Autostart
   → Enable for People Tracking
''';
      
      case 'huawei':
      case 'honor':
        return '''
**Huawei/Honor Settings:**

1. Settings → Battery → App launch
   → Find "People Tracking" → Manage manually
   → Enable: Auto-launch, Secondary launch, Run in background

2. Settings → Apps → People Tracking
   → Battery → Power-intensive prompt → Disable
''';
      
      case 'oppo':
        return '''
**OPPO Settings:**

1. Settings → Battery → Power saving mode → OFF

2. Settings → Battery → App battery management
   → Find "People Tracking" → Don't optimize

3. Settings → Privacy → Permission manager → Autostart
   → Enable for People Tracking
''';
      
      case 'vivo':
        return '''
**Vivo Settings:**

1. Settings → Battery → Background power consumption management
   → Find "People Tracking" → Allow

2. Settings → More settings → Applications → Autostart
   → Enable for People Tracking
''';
      
      case 'oneplus':
        return '''
**OnePlus Settings:**

1. Settings → Battery → Battery optimization
   → Find "People Tracking" → Don't optimize

2. Settings → Apps → People Tracking
   → Battery → Battery optimization → Don't optimize
''';
      
      case 'samsung':
        return '''
**Samsung Settings:**

1. Settings → Apps → People Tracking → Battery
   → Allow background activity
   → Put app to sleep → Never

2. Settings → Device care → Battery
   → App power management → Apps that won't be put to sleep
   → Add "People Tracking"
''';
      
      default:
        return '''
**General Settings:**

1. Settings → Apps → People Tracking → Battery
   → Unrestricted or Don't optimize

2. Disable any battery saver or power saving modes
   while using location tracking
''';
    }
  }
  
  /// Automatically open manufacturer-specific settings
  static Future<void> openManufacturerSettings() async {
    final manufacturer = await getManufacturer();
    
    try {
      final result = await _permissionChannel.invokeMethod('openManufacturerSettings', {
        'manufacturer': manufacturer,
      });
      
      if (result == true) {
        print('Manufacturer settings opened for: $manufacturer');
      } else {
        print('Failed to open manufacturer settings, opening app settings');
        await _permissionChannel.invokeMethod('openAppSettings');
      }
    } catch (e) {
      print('Error opening manufacturer settings: $e');
    }
  }
  
  /// Automatically request battery optimization exemption
  static Future<bool> requestBatteryExemption() async {
    try {
      final result = await _permissionChannel.invokeMethod('requestBatteryExemption');
      return result == true;
    } catch (e) {
      print('Error requesting battery exemption: $e');
      return false;
    }
  }
  
  /// Check if battery optimization is disabled
  static Future<bool> isBatteryOptimizationDisabled() async {
    try {
      final result = await _permissionChannel.invokeMethod('isBatteryOptimizationDisabled');
      return result == true;
    } catch (e) {
      print('Error checking battery optimization: $e');
      return false;
    }
  }
  
  /// Automatically handle all permissions with minimal user interaction
  static Future<void> handleAllPermissions(BuildContext context) async {
    // Step 1: Check if already exempted
    final isExempted = await isBatteryOptimizationDisabled();
    
    if (!isExempted) {
      // Request battery exemption (opens system dialog automatically)
      await requestBatteryExemption();
      
      // Wait for user to interact with dialog
      await Future.delayed(const Duration(seconds: 2));
    }
    
    // Step 2: Check if we need manufacturer-specific settings
    final isAggressive = await isAggressiveManufacturer();
    
    if (isAggressive && context.mounted) {
      // Wait a bit then auto-open manufacturer settings
      await Future.delayed(const Duration(seconds: 1));
      await openManufacturerSettings();
      
      // Show minimal guidance
      if (context.mounted) {
        final manufacturer = await getManufacturer();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Please enable autostart for ${manufacturer.toUpperCase()}'),
            duration: const Duration(seconds: 5),
            backgroundColor: Colors.orange,
            action: SnackBarAction(
              label: 'OK',
              textColor: Colors.white,
              onPressed: () {},
            ),
          ),
        );
      }
    }
  }
  
  static Future<void> showManufacturerDialog(BuildContext context) async {
    final isAggressive = await isAggressiveManufacturer();
    
    if (!isAggressive) return; // No need to show for standard manufacturers
    
    final instructions = await getManufacturerInstructions();
    final manufacturer = await getManufacturer();
    
    if (!context.mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${manufacturer.toUpperCase()} Device Detected'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Your device manufacturer has aggressive battery optimization. '
                'Please follow these steps for reliable 24/7 tracking:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Text(instructions),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Try to open app settings
              _openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }
  
  /// Open app settings
  static Future<void> _openAppSettings() async {
    // This will be handled by the app settings package or intent
    // For now, just a placeholder
    try {
      // You can add app_settings package for this functionality
      print('Opening app settings...');
    } catch (e) {
      print('Failed to open settings: $e');
    }
  }
}
