package app.vercel.realtimemap;

import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LiveCapsule")
public class LiveCapsulePlugin extends Plugin {

    @PluginMethod
    public void showStatus(PluginCall call) {
        String text = call.getString("text", "");
        Integer progress = call.getInt("progress", 0);

        Intent intent = new Intent(getContext(), LiveTrackingService.class);
        intent.putExtra("text", text);
        String shortText = call.getString("shortText", "");
        intent.putExtra("progress", progress);
        intent.putExtra("shortText", shortText);

        intent.addFlags(Intent.FLAG_RECEIVER_FOREGROUND);

        try {
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Не удалось запустить сервис слежения: " + e.getMessage());
        }
    }

    @PluginMethod
    public void hideStatus(PluginCall call) {
        Intent intent = new Intent(getContext(), LiveTrackingService.class);
        getContext().stopService(intent);
        call.resolve();
    }
}
