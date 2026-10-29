package com.mystarquest.app;

import android.content.pm.ActivityInfo;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StoryReader")
public class StoryReaderPlugin extends Plugin {
    private Integer previousOrientation;
    private boolean statusBarVisible = true;
    private boolean navigationBarVisible = true;

    @PluginMethod
    public void enter(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (previousOrientation == null) {
                previousOrientation = getActivity().getRequestedOrientation();
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(getActivity().getWindow().getDecorView());
                if (insets != null) {
                    statusBarVisible = insets.isVisible(WindowInsetsCompat.Type.statusBars());
                    navigationBarVisible = insets.isVisible(WindowInsetsCompat.Type.navigationBars());
                }
            }
            getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
                getActivity().getWindow(), getActivity().getWindow().getDecorView());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            controller.hide(WindowInsetsCompat.Type.systemBars());
            call.resolve();
        });
    }

    @PluginMethod
    public void exit(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (previousOrientation != null) {
                getActivity().setRequestedOrientation(previousOrientation);
                previousOrientation = null;
                WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
                    getActivity().getWindow(), getActivity().getWindow().getDecorView());
                if (statusBarVisible) controller.show(WindowInsetsCompat.Type.statusBars());
                if (navigationBarVisible) controller.show(WindowInsetsCompat.Type.navigationBars());
            }
            call.resolve();
        });
    }
}
