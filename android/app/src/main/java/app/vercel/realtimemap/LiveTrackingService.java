package app.vercel.realtimemap;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class LiveTrackingService extends Service {
    private static final String CHANNEL_ID = "live_tracking_channel";
    private static final int NOTIFICATION_ID = 8882;
    private NotificationCompat.Builder notificationBuilder;
    private NotificationManager notificationManager;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String text = intent.getStringExtra("text");
        String shortText = intent.getStringExtra("shortText");
        int progress = intent.getIntExtra("progress", 0);

        if (shortText == null || shortText.isEmpty()) {
            shortText = text != null && text.length() > 7 ? text.substring(0, 7) : text;
        }

        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationBuilder == null) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Активные процессы",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setSound(null, null);
            channel.enableVibration(false);
            notificationManager.createNotificationChannel(channel);
        }

        if (notificationBuilder == null) {
            Intent launchIntent = new Intent(this, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

            notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
              .setSmallIcon(android.R.drawable.ic_menu_compass)
              .setContentTitle("Карта")
              .setContentText(text)
              .setOngoing(true)
              .setContentIntent(pendingIntent)
              .setCategory(NotificationCompat.CATEGORY_NAVIGATION)
              .setPriority(NotificationCompat.PRIORITY_LOW)
              .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);

            notificationBuilder.setShowWhen(true);
            notificationBuilder.setWhen(System.currentTimeMillis() + 600000);
            updateLiveExtras(text, shortText);

            notificationBuilder.setStyle(new NotificationCompat.BigTextStyle().bigText(text));

            startForeground(NOTIFICATION_ID, notificationBuilder.build());
        } else {
            notificationBuilder.setContentText(text)
                               .setTicker(text)
                               .setProgress(100, progress, false)
                               .setStyle(new NotificationCompat.BigTextStyle().bigText(text));

            updateLiveExtras(text, shortText);

            notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build());
        }
        return START_NOT_STICKY;
    }

    private void updateLiveExtras(String text, String shortText) {
      if (notificationBuilder == null) return;
        notificationBuilder.getExtras().putBoolean("android.requestPromotedOngoing", true);
        notificationBuilder.getExtras().putString("android.shortCriticalText", shortText);
    }


    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
