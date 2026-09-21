package com.mystarquest.app;

import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class SchoolCalendarJsonTest {
    @Test
    public void supportsBothServiceFormats() throws Exception {
        String legacy = "{\"2026-09-29\":{\"isNonSchoolDay\":true,\"summaries\":[\"Studiedag (leerlingen vrij)\"]}}";
        assertNotNull(SchoolCalendarJson.validate(new JSONObject(legacy)));
        String detailed = "{\"2026-09-23\":{\"isNonSchoolDay\":false,\"events\":[{\"id\":\"photo\",\"summary\":\"Schoolfotograaf\",\"allDay\":true,\"start\":\"2026-09-23T00:00:00.000Z\",\"end\":\"2026-09-24T00:00:00Z\"}]}}";
        assertNotNull(SchoolCalendarJson.validate(new JSONObject(detailed)));
    }

    @Test
    public void rejectsInvalidServerDataBeforeItCanBeSaved() {
        String[] invalid = {
            "{\"error\":\"upstream unavailable\"}",
            "{\"2026-02-30\":{\"isNonSchoolDay\":true}}",
            "{\"2026-09-29\":{\"isNonSchoolDay\":\"true\"}}",
            "{\"2026-09-29\":{\"isNonSchoolDay\":true,\"summaries\":[4]}}",
            "{\"2026-09-29\":{\"isNonSchoolDay\":true,\"events\":[{\"id\":\"bad\"}]}}",
            "{\"2026-09-29\":{\"isNonSchoolDay\":true,\"events\":[{\"id\":\"bad\",\"summary\":\"bad\",\"allDay\":false,\"start\":\"2026-09-29T28:00:00Z\",\"end\":\"2026-09-29T29:00:00Z\"}]}}"
        };
        for (String raw : invalid) {
            assertThrows(Exception.class, () -> SchoolCalendarJson.validate(new JSONObject(raw)));
        }
    }

    @Test
    public void validatesTheCompleteSavedSnapshot() throws Exception {
        assertNotNull(SchoolCalendarJson.snapshot("{\"checkedAt\":123,\"data\":{}}"));
        assertThrows(Exception.class, () -> SchoolCalendarJson.snapshot("{\"checkedAt\":-1,\"data\":{}}"));
        assertThrows(Exception.class, () -> SchoolCalendarJson.snapshot("{\"checkedAt\":\"123\",\"data\":{}}"));
        assertThrows(Exception.class, () -> SchoolCalendarJson.snapshot("{\"checkedAt\":123,\"data\":null}"));
    }
}
