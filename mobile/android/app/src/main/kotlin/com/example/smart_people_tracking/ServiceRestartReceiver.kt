package com.example.smart_people_tracking

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.util.Log

/**
 * Receiver that restarts the tracking service when it gets killed
 * This provides an additional layer of resilience beyond WorkManager
 */
class ServiceRestartReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("ServiceRestart", "Service restart receiver triggered")
        
        // Check if tracking was active
        val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val isTracking = prefs.getBoolean("flutter.is_tracking", false)
        
        if (isTracking) {
            Log.d("ServiceRestart", "Restarting background service")
            
            // Restart the foreground service
            val serviceIntent = Intent(context, id.flutter.flutter_background_service.BackgroundService::class.java)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
    
    companion object {
        private const val ALARM_ID_1 = 1000
        private const val ALARM_ID_2 = 1001
        private const val ALARM_ID_3 = 1002
        
        /**
         * Schedule THREE redundant alarms at different intervals
         * This ensures maximum reliability - if one fails, others continue
         */
        fun scheduleServiceCheck(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Alarm 1: Every 20 seconds (aggressive)
            scheduleAlarm(context, alarmManager, ALARM_ID_1, 20 * 1000L)
            
            // Alarm 2: Every 20 seconds (redundant)
            scheduleAlarm(context, alarmManager, ALARM_ID_2, 20 * 1000L)
            
            // Alarm 3: Every 20 seconds (backup)
            scheduleAlarm(context, alarmManager, ALARM_ID_3, 20 * 1000L)
            
            Log.d("ServiceRestart", "Scheduled 3 redundant watchdog alarms (20s each)")
        }
        
        private fun scheduleAlarm(context: Context, alarmManager: AlarmManager, alarmId: Int, intervalMs: Long) {
            val intent = Intent(context, ServiceRestartReceiver::class.java)
            intent.putExtra("alarm_id", alarmId)
            
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Use setRepeating for better reliability
            alarmManager.setRepeating(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + intervalMs,
                intervalMs,
                pendingIntent
            )
        }
        
        fun cancelServiceCheck(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Cancel all three alarms
            for (alarmId in listOf(ALARM_ID_1, ALARM_ID_2, ALARM_ID_3)) {
                val intent = Intent(context, ServiceRestartReceiver::class.java)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    alarmId,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                alarmManager.cancel(pendingIntent)
            }
            
            Log.d("ServiceRestart", "Cancelled all watchdog alarms")
        }
    }
}
