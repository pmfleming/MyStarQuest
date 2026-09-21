package com.mystarquest.app;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.work.WorkInfo;
import androidx.work.WorkManager;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.List;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class SchoolCalendarOfflineTest {
    private final Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();

    @Test
    public void packagedCalendarSurvivesMissingAndCorruptSavedData() throws Exception {
        String before = SchoolCalendarRepository.preferences(context).getString("snapshot", null);
        try {
            SchoolCalendarRepository.preferences(context).edit().remove("snapshot").commit();
            JSONObject bundled = SchoolCalendarRepository.read(context);
            assertTrue(bundled.getJSONObject("data").length() > 100);
            SchoolCalendarRepository.preferences(context).edit().putString("snapshot", "bad json").commit();
            assertEquals(bundled.toString(), SchoolCalendarRepository.read(context).toString());
            JSONObject saved = new JSONObject().put("checkedAt", System.currentTimeMillis() + 1000)
                    .put("data", new JSONObject("{\"2027-02-01\":{\"isNonSchoolDay\":true}}"));
            SchoolCalendarRepository.preferences(context).edit().putString("snapshot", saved.toString()).commit();
            assertEquals(saved.toString(), SchoolCalendarRepository.read(context).toString());
        } finally {
            SchoolCalendarRepository.preferences(context).edit().putString("snapshot", before).commit();
        }
    }

    @Test
    public void backgroundScheduleIsUniqueAcrossAppStarts() throws Exception {
        SchoolCalendarWorker.schedule(context);
        SchoolCalendarWorker.schedule(context);
        List<WorkInfo> work = WorkManager.getInstance(context)
                .getWorkInfosForUniqueWork("school-calendar-refresh").get(10, TimeUnit.SECONDS);
        assertEquals(1, work.size());
        assertFalse(work.get(0).getState().isFinished());
    }
}
