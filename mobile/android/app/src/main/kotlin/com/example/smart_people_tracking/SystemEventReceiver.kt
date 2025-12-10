package com.example.smart_people_tracking

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * System event receiver that restarts the service on various system events
 * This provides maximum coverage - service restarts on ANY system event
 */
class SystemEventReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "SystemEventReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "System event received: $action")
        
        // Check if tracking is active
        val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val isTracking = prefs.getBoolean("flutter.is_tracking", false)
        
        if (!isTracking) {
            Log.d(TAG, "Tracking is disabled, ignoring event")
            return
        }
        
        Log.d(TAG, "Tracking is active, ensuring service is running")
        
        // Restart the foreground service
        val serviceIntent = Intent(context, id.flutter.flutter_background_service.BackgroundService::class.java)
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            Log.d(TAG, "Service restart initiated from event: $action")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start service: ${e.message}")
        }
    }
}
