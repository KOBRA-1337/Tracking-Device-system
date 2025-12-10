package com.example.smart_people_tracking

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * Custom MainActivity that handles service lifecycle and platform channels
 */
class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.example.smart_people_tracking/alarm"
    private val PERMISSION_CHANNEL = "com.example.smart_people_tracking/permissions"
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Automatically request battery optimization exemption on app start
        PermissionHelper.requestBatteryOptimizationExemption(this)
    }
    
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        // Setup platform channel for AlarmManager and JobScheduler
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "scheduleAlarm" -> {
                    ServiceRestartReceiver.scheduleServiceCheck(this)
                    result.success(true)
                }
                "cancelAlarm" -> {
                    ServiceRestartReceiver.cancelServiceCheck(this)
                    result.success(true)
                }
                "scheduleJob" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        LocationJobService.scheduleJob(this)
                        result.success(true)
                    } else {
                        result.error("UNSUPPORTED", "JobScheduler requires Android 5.0+", null)
                    }
                }
                "cancelJob" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        LocationJobService.cancelJob(this)
                        result.success(true)
                    } else {
                        result.success(true) // No-op on older versions
                    }
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
        
        // Setup platform channel for permissions
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, PERMISSION_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "requestBatteryExemption" -> {
                    val success = PermissionHelper.requestBatteryOptimizationExemption(this)
                    result.success(success)
                }
                "isBatteryOptimizationDisabled" -> {
                    val isDisabled = PermissionHelper.isBatteryOptimizationDisabled(this)
                    result.success(isDisabled)
                }
                "openBatterySettings" -> {
                    val success = PermissionHelper.openBatterySettings(this)
                    result.success(success)
                }
                "openAppSettings" -> {
                    val success = PermissionHelper.openAppSettings(this)
                    result.success(success)
                }
                "openManufacturerSettings" -> {
                    val manufacturer = call.argument<String>("manufacturer") ?: ""
                    val success = PermissionHelper.openManufacturerSettings(this, manufacturer)
                    result.success(success)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }
}
