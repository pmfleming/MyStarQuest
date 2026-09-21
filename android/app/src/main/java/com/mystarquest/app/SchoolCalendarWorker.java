package com.mystarquest.app;

import android.content.Context;
import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.util.concurrent.TimeUnit;

// WorkManager persists this class name across app updates.
@Keep
public class SchoolCalendarWorker extends Worker {
    public SchoolCalendarWorker(@NonNull Context context, @NonNull WorkerParameters parameters) {
        super(context, parameters);
    }

    static void schedule(Context context) {
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
                SchoolCalendarWorker.class, 6, TimeUnit.HOURS)
                .setConstraints(new Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "school-calendar-refresh", ExistingPeriodicWorkPolicy.KEEP, request);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            SchoolCalendarRepository.refresh(getApplicationContext());
            return Result.success();
        } catch (Exception ignored) {
            // Leave the last valid copy intact and let WorkManager back off/retry.
            return Result.retry();
        }
    }
}
