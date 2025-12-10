/// App Configuration
/// 
/// Centralized configuration for the mobile app.
/// Update the API base URL based on your setup:
/// - Android Emulator: http://10.0.2.2:3000/api
/// - iOS Simulator: http://localhost:3000/api
/// - Physical Device: http://YOUR_COMPUTER_IP:3000/api
/// - Production: https://your-backend-url.com/api

class AppConfig {
  // ========================================
  // API Configuration
  // ========================================
  
  /// Base URL for the backend API
  /// 
  /// Change this based on how you're running the app:
  /// 
  /// **Android Emulator:**
  /// ```dart
  /// static const String apiBaseUrl = 'http://10.0.2.2:3000/api';
  /// ```
  /// 
  /// **iOS Simulator:**
  /// ```dart
  /// static const String apiBaseUrl = 'http://localhost:3000/api';
  /// ```
  /// 
  /// **Physical Device (Same Network):**
  /// ```dart
  /// static const String apiBaseUrl = 'http://192.168.1.XXX:3000/api';
  /// ```
  /// Replace XXX with your computer's IP address
  /// 
  /// **Hamachi VPN:**
  /// ```dart
  /// static const String apiBaseUrl = 'http://25.10.65.46:3000/api';
  /// ```
  /// Use your Hamachi IPv4 address
  /// 
  /// **Production:**
  /// ```dart
  /// static const String apiBaseUrl = 'https://your-backend-url.com/api';
  /// ```
  /// static const String apiBaseUrl = 'http://25.10.65.46:3000/api/v1';
  static const String apiBaseUrl = 'http://192.168.100.82:3000/api/v1';
  
  // ========================================
  // Environment-specific URLs
  // ========================================
  
  /// Development API URL (your LAN IP)
  static const String devApiUrl = 'http://192.168.100.82:3000/api/v1';
  
  /// Android Emulator API URL
  static const String androidEmulatorApiUrl = 'http://10.0.2.2:3000/api/v1';
  
  /// Production API URL
  static const String prodApiUrl = 'https://your-backend-url.com/api/v1';
  
  // ========================================
  // App Settings
  // ========================================
  
  /// Location update interval (in seconds)
  static const int locationUpdateInterval = 30;
  
  /// Minimum distance for location update (in meters)
  static const double minDistanceForUpdate = 10.0;
  
  /// Location accuracy
  static const String locationAccuracy = 'high';
  
  // ========================================
  // Helper Methods
  // ========================================
  
  /// Get API URL based on current platform
  /// 
  /// Automatically selects the appropriate URL based on the platform:
  /// - Android: Uses emulator URL if running on emulator
  /// - iOS: Uses localhost if running on simulator
  /// - Otherwise: Uses the configured apiBaseUrl
  static String getApiUrl() {
    // You can add platform detection here if needed
    // For now, just return the configured base URL
    return apiBaseUrl;
  }
  
  /// Check if running in production mode
  static bool get isProduction {
    return const bool.fromEnvironment('dart.vm.product', defaultValue: false);
  }
  
  /// Check if running in debug mode
  static bool get isDebug {
    return !isProduction;
  }
}

