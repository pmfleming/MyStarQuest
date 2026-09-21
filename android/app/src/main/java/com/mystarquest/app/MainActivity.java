package com.mystarquest.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SchoolCalendarPlugin.class);
        super.onCreate(savedInstanceState);
        SchoolCalendarWorker.schedule(this);
    }
}
