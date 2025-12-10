package com.example.smart_people_tracking

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log

/**
 * Helper class for automatic permission handling
 */
object PermissionHelper {
    private const val TAG = "PermissionHelper"
    
    /**
     * Check if battery optimization is disabled
     */
    fun isBatteryOptimizationDisabled(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            return powerManager.isIgnoringBatteryOptimizations(context.packageName)
        }
        return true
    }
    
    /**
     * Request battery optimization exemption
     * This will open a system dialog for user to approve
     */
    fun requestBatteryOptimizationExemption(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!isBatteryOptimizationDisabled(context)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                    intent.data = Uri.parse("package:${context.packageName}")
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    context.startActivity(intent)
                    Log.d(TAG, "Battery optimization exemption dialog opened")
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to request battery optimization exemption: ${e.message}")
                    // Fallback: Open battery settings page
                    return openBatterySettings(context)
                }
            }
        }
        return false
    }
    
    /**
     * Open battery optimization settings page
     */
    fun openBatterySettings(context: Context): Boolean {
        try {
            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            Log.d(TAG, "Battery settings opened")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open battery settings: ${e.message}")
            return false
        }
    }
    
    /**
     * Open app-specific settings page
     */
    fun openAppSettings(context: Context): Boolean {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = Uri.parse("package:${context.packageName}")
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            Log.d(TAG, "App settings opened")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open app settings: ${e.message}")
            return false
        }
    }
    
    /**
     * Launch manufacturer-specific autostart settings
     */
    fun openManufacturerSettings(context: Context, manufacturer: String): Boolean {
        val intent = when (manufacturer.lowercase()) {
            "xiaomi", "redmi", "poco" -> getXiaomiIntent()
            "huawei", "honor" -> getHuaweiIntent()
            "oppo" -> getOppoIntent()
            "vivo" -> getVivoIntent()
            "oneplus" -> getOnePlusIntent()
            "samsung" -> getSamsungIntent(context)
            else -> null
        }
        
        return if (intent != null) {
            try {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                Log.d(TAG, "Manufacturer settings opened for: $manufacturer")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to open manufacturer settings: ${e.message}")
                // Fallback to app settings
                openAppSettings(context)
            }
        } else {
            false
        }
    }
    
    private fun getXiaomiIntent(): Intent {
        // Try autostart settings first
        return try {
            Intent().apply {
                component = android.content.ComponentName(
                    "com.miui.securitycenter",
                    "com.miui.permcenter.autostart.AutoStartManagementActivity"
                )
            }
        } catch (e: Exception) {
            // Fallback to power settings
            Intent("miui.intent.action.POWER_HIDE_MODE_APP_LIST")
        }
    }
    
    private fun getHuaweiIntent(): Intent {
        return Intent().apply {
            component = android.content.ComponentName(
                "com.huawei.systemmanager",
                "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"
            )
        }
    }
    
    private fun getOppoIntent(): Intent {
        return Intent().apply {
            component = android.content.ComponentName(
                "com.coloros.safecenter",
                "com.coloros.safecenter.permission.startup.StartupAppListActivity"
            )
        }
    }
    
    private fun getVivoIntent(): Intent {
        return Intent().apply {
            component = android.content.ComponentName(
                "com.vivo.permissionmanager",
                "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"
            )
        }
    }
    
    private fun getOnePlusIntent(): Intent {
        return Intent().apply {
            component = android.content.ComponentName(
                "com.oneplus.security",
                "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity"
            )
        }
    }
    
    private fun getSamsungIntent(context: Context): Intent {
        return Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${context.packageName}")
        }
    }
}
