package com.example.smart_people_tracking

import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import java.util.concurrent.TimeUnit

/**
 * JobScheduler service for periodic location tracking
 * This provides Layer 4 redundancy - survives device idle and doze mode
 */
@RequiresApi(Build.VERSION_CODES.LOLLIPOP)
class LocationJobService : JobService() {
    
    companion object {
        private const val JOB_ID = 1001
        private const val TAG = "LocationJobService"
        
        /**
         * Schedule the periodic job
         * Note: JobScheduler minimum is 15 min, but using one-shot with reschedule for 20s
         */
        fun scheduleJob(context: Context) {
            val jobScheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
            
            // Cancel any existing job
            jobScheduler.cancel(JOB_ID)
            
            val componentName = ComponentName(context, LocationJobService::class.java)
            // Use one-shot job with minimum latency for ~20 second intervals
            val jobInfo = JobInfo.Builder(JOB_ID, componentName)
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setMinimumLatency(20 * 1000L) // 20 seconds minimum latency
                .setOverrideDeadline(30 * 1000L) // Must run within 30 seconds
                .setPersisted(true) // Persist across reboots
                .build()
            
            val result = jobScheduler.schedule(jobInfo)
            if (result == JobScheduler.RESULT_SUCCESS) {
                Log.d(TAG, "Job scheduled successfully (20s interval)")
            } else {
                Log.e(TAG, "Job scheduling failed")
            }
        }
        
        /**
         * Cancel the job
         */
        fun cancelJob(context: Context) {
            val jobScheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
            jobScheduler.cancel(JOB_ID)
            Log.d(TAG, "Job cancelled")
        }
    }
    
    override fun onStartJob(params: JobParameters?): Boolean {
        Log.d(TAG, "Job started")
        
        // Check if tracking is active
        val prefs = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val isTracking = prefs.getBoolean("flutter.is_tracking", false)
        
        if (!isTracking) {
            Log.d(TAG, "Tracking is disabled, skipping job")
            jobFinished(params, false)
            return false
        }
        
        // Ensure the foreground service is running
        val serviceIntent = Intent(this, id.flutter.flutter_background_service.BackgroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        
        Log.d(TAG, "Ensured foreground service is running")
        
        // Reschedule job for next 20 seconds
        scheduleJob(this)
        
        // Job completed
        jobFinished(params, false)
        return false
    }
    
    override fun onStopJob(params: JobParameters?): Boolean {
        Log.d(TAG, "Job stopped")
        // Return true to reschedule
        return true
    }
}
