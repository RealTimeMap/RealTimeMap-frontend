package app.vercel.realtimemap;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LiveCapsulePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
