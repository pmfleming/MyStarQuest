package com.mystarquest.app;

import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "SchoolCalendar")
public class SchoolCalendarPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private SharedPreferences.OnSharedPreferenceChangeListener listener;

    @Override
    public void load() {
        listener = (preferences, key) -> {
            if (SchoolCalendarRepository.SNAPSHOT_KEY.equals(key)) publish();
        };
        SchoolCalendarRepository.preferences(getContext()).registerOnSharedPreferenceChangeListener(listener);
    }

    @PluginMethod
    public void read(PluginCall call) {
        executor.execute(() -> {
            try {
                call.resolve(new JSObject(SchoolCalendarRepository.read(getContext()).toString()));
            } catch (Exception error) {
                call.reject("Could not read saved calendar", error);
            }
        });
    }

    @PluginMethod
    public void refresh(PluginCall call) {
        executor.execute(() -> {
            try {
                call.resolve(new JSObject(SchoolCalendarRepository.refresh(getContext()).toString()));
            } catch (Exception error) {
                call.reject("Could not refresh calendar", error);
            }
        });
    }

    private void publish() {
        // Read on the executor: asset I/O must not block the activity lifecycle.
        executor.execute(() -> {
            try {
                notifyListeners("calendarUpdated", new JSObject(SchoolCalendarRepository.read(getContext()).toString()));
            } catch (Exception ignored) { /* The web UI retains its own last valid copy. */ }
        });
    }

    @Override
    protected void handleOnResume() { publish(); }

    @Override
    protected void handleOnDestroy() {
        SchoolCalendarRepository.preferences(getContext()).unregisterOnSharedPreferenceChangeListener(listener);
        executor.shutdown();
    }
}
