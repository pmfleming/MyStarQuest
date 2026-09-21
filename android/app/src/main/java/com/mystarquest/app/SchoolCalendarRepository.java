package com.mystarquest.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

final class SchoolCalendarRepository {
    static final String SNAPSHOT_KEY = "snapshot";
    private static final String ENDPOINT = "https://getschoolcalendar-6ujocyt4pq-uc.a.run.app";
    private static final long COALESCE_MS = 60_000;

    private SchoolCalendarRepository() {}

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences("school-calendar-v1", Context.MODE_PRIVATE);
    }

    static JSONObject read(Context context) throws Exception {
        JSONObject bundled;
        try (InputStream stream = context.getAssets().open("school-calendar.json")) {
            bundled = SchoolCalendarJson.snapshot(readText(stream));
        }
        String raw = preferences(context).getString(SNAPSHOT_KEY, null);
        if (raw != null) {
            try {
                JSONObject saved = SchoolCalendarJson.snapshot(raw);
                if (saved.getLong("checkedAt") >= bundled.getLong("checkedAt")) return saved;
            } catch (Exception ignored) { /* Recover from corrupt storage using the packaged copy. */ }
        }
        return bundled;
    }

    // Worker and foreground bridge share this lock, avoiding out-of-order writes.
    static synchronized JSONObject refresh(Context context) throws Exception {
        String raw = preferences(context).getString(SNAPSHOT_KEY, null);
        if (raw != null) {
            try {
                JSONObject saved = SchoolCalendarJson.snapshot(raw);
                long age = System.currentTimeMillis() - saved.getLong("checkedAt");
                if (age >= 0 && age < COALESCE_MS) return saved;
            } catch (Exception ignored) { /* Fetch a replacement. */ }
        }
        HttpURLConnection connection = (HttpURLConnection) new URL(ENDPOINT).openConnection();
        long deadline = SystemClock.elapsedRealtime() + 30_000;
        connection.setConnectTimeout(15_000);
        connection.setReadTimeout(15_000);
        connection.setUseCaches(false);
        connection.setRequestProperty("Accept", "application/json");
        try {
            if (connection.getResponseCode() != 200) throw new IOException("Calendar unavailable");
            JSONObject data;
            try (InputStream stream = connection.getInputStream()) {
                data = SchoolCalendarJson.validate(new JSONObject(readText(stream, connection, deadline)));
            }
            JSONObject snapshot = new JSONObject()
                    .put("data", data)
                    .put("checkedAt", System.currentTimeMillis());
            if (!preferences(context).edit().putString(SNAPSHOT_KEY, snapshot.toString()).commit())
                throw new IOException("Could not save calendar");
            return snapshot;
        } finally {
            connection.disconnect();
        }
    }

    private static String readText(InputStream stream) throws IOException {
        return readText(stream, null, Long.MAX_VALUE);
    }

    private static String readText(InputStream stream, HttpURLConnection connection, long deadline) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while (true) {
            if (connection != null) {
                long remaining = deadline - SystemClock.elapsedRealtime();
                if (remaining <= 0) throw new IOException("Calendar request timed out");
                connection.setReadTimeout((int) Math.min(15_000, remaining));
            }
            count = stream.read(buffer);
            if (count == -1) break;
            if (output.size() + count > 2_000_000) throw new IOException("Calendar too large");
            output.write(buffer, 0, count);
        }
        return output.toString(StandardCharsets.UTF_8.name());
    }
}
