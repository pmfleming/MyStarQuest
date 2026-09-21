package com.mystarquest.app;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.util.Iterator;
import java.util.Locale;
import java.util.TimeZone;

/** Validate before replacing the last usable offline copy. Mirrors the web schema. */
final class SchoolCalendarJson {
    private SchoolCalendarJson() {}

    static JSONObject validate(JSONObject data) throws JSONException {
        Iterator<String> dates = data.keys();
        while (dates.hasNext()) {
            String date = dates.next();
            require(validDate(date), "Invalid calendar date");
            JSONObject day = data.getJSONObject(date);
            require(day.get("isNonSchoolDay") instanceof Boolean, "Invalid day flag");
            if (day.has("hasAllDayEvent"))
                require(day.get("hasAllDayEvent") instanceof Boolean, "Invalid all-day flag");
            if (day.has("summaries")) {
                JSONArray summaries = day.getJSONArray("summaries");
                for (int i = 0; i < summaries.length(); i++)
                    require(summaries.get(i) instanceof String, "Invalid summary");
            }
            if (day.has("events")) {
                JSONArray events = day.getJSONArray("events");
                for (int i = 0; i < events.length(); i++) {
                    JSONObject event = events.getJSONObject(i);
                    require(event.get("id") instanceof String, "Invalid event ID");
                    require(event.get("summary") instanceof String, "Invalid event summary");
                    require(event.get("allDay") instanceof Boolean, "Invalid event flag");
                    require(validInstant(event.get("start")), "Invalid start");
                    require(validInstant(event.get("end")), "Invalid end");
                }
            }
        }
        return data;
    }

    static JSONObject snapshot(String raw) throws JSONException {
        JSONObject snapshot = new JSONObject(raw);
        Object checkedAt = snapshot.get("checkedAt");
        require(checkedAt instanceof Number && ((Number) checkedAt).doubleValue() >= 0
                && !Double.isInfinite(((Number) checkedAt).doubleValue()), "Invalid check time");
        validate(snapshot.getJSONObject("data"));
        return snapshot;
    }

    private static boolean validDate(String value) {
        if (!value.matches("\\d{4}-\\d{2}-\\d{2}")) return false;
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT);
        format.setLenient(false);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        ParsePosition position = new ParsePosition(0);
        return format.parse(value, position) != null && position.getIndex() == value.length();
    }

    private static boolean validInstant(Object value) {
        if (!(value instanceof String)) return false;
        String time = (String) value;
        return time.matches("\\d{4}-\\d{2}-\\d{2}T(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?Z")
                && validDate(time.substring(0, 10));
    }

    private static void require(boolean condition, String message) throws JSONException {
        if (!condition) throw new JSONException(message);
    }
}
