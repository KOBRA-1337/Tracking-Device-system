package com.example.smart_people_tracking

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Device boot completed, checking tracking state")
            
            // Check if tracking was active before shutdown
            val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val wasTracking = prefs.getBoolean("flutter.is_tracking", false)
            
            if (wasTracking) {
                Log.d("BootReceiver", "Tracking was active, restarting service")
                
                // Start the background service
                val serviceIntent = Intent(context, id.flutter.flutter_background_service.BackgroundService::class.java)
                context.startForegroundService(serviceIntent)
                
                Log.d("BootReceiver", "Background service started after boot")
            } else {
                Log.d("BootReceiver", "Tracking was not active, skipping service start")
            }
        }
    }
}
