package com.zerkalopro.calc;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Держит калькулятор внутри приложения, чужие ссылки открывает снаружи, без сети показывает подсказку. */
class CalcClient extends WebViewClient {
    private final Activity activity;

    CalcClient(Activity activity) {
        this.activity = activity;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if ("https".equals(uri.getScheme()) && MainActivity.HOST.equals(uri.getHost()) && uri.getPath() != null && uri.getPath().startsWith(MainActivity.PATH)) return false;
        try {
            activity.startActivity(new Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (Exception ignored) {
        }
        return true;
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (!request.isForMainFrame()) return;
        String page = "<!doctype html><html lang='ru'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<body style='font:17px sans-serif;background:#1f1a16;color:#ece4d6;padding:40px 24px'>"
                + "<h2>Нет связи</h2><p>Для первого запуска нужен интернет: приложение скачает калькулятор с сайта. После этого оно работает без сети и обновляется само.</p>"
                + "<p style='color:#b9ae9d;font-size:14px'>Причина: " + android.text.TextUtils.htmlEncode(String.valueOf(error.getDescription())) + " (код " + error.getErrorCode() + ")</p>"
                + "<p><a href='" + MainActivity.START + "' style='display:inline-block;background:#c9a876;color:#211b16;padding:14px 22px;border-radius:14px;text-decoration:none'>Повторить</a></p></body></html>";
        view.loadDataWithBaseURL(null, page, "text/html", "utf-8", null);
    }
}
