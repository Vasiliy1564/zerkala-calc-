package com.zerkalopro.put;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Оболочка для https://zerkalo-pro-spb.ru/put-peterburg/ : сайт сам сохраняет себя и базу для работы без интернета. */
public class MainActivity extends Activity {
    private static final String HOST = "zerkalo-pro-spb.ru";
    private static final String PATH = "/put-peterburg/";
    private static final String START = "https://" + HOST + PATH;
    private static final int LOCATION_REQUEST = 7;

    private WebView web;
    private String pendingOrigin;
    private GeolocationPermissions.Callback pendingCallback;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setGeolocationEnabled(true);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isApp(uri)) return false;
                openOutside(uri);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                String page = "<!doctype html><html lang='ru'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
                        + "<body style='font:17px sans-serif;background:#fff8ee;color:#19243d;padding:40px 24px'>"
                        + "<h2>Нет связи</h2><p>Для первого запуска нужен интернет: приложение скачает базу адресов и маршрутов (около 16 МБ). После этого оно работает без сети.</p>"
                        + "<p><a href='" + START + "' style='display:inline-block;background:#2459e0;color:#fff;padding:14px 22px;border-radius:14px;text-decoration:none'>Повторить</a></p></body></html>";
                view.loadDataWithBaseURL(null, page, "text/html", "utf-8", null);
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (!("https://" + HOST).equals(origin)) { callback.invoke(origin, false, false); return; }
                if (hasLocation()) { callback.invoke(origin, true, false); return; }
                pendingOrigin = origin;
                pendingCallback = callback;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_REQUEST);
            }

            @Override
            public void onGeolocationPermissionsHidePrompt() {
                pendingCallback = null;
                pendingOrigin = null;
            }
        });

        if (state == null || web.restoreState(state) == null) web.loadUrl(START);
    }

    private boolean isApp(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getPath() != null && uri.getPath().startsWith(PATH);
    }

    private void openOutside(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (Exception ignored) {
        }
    }

    private boolean hasLocation() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code != LOCATION_REQUEST || pendingCallback == null) return;
        pendingCallback.invoke(pendingOrigin, hasLocation(), false);
        pendingCallback = null;
        pendingOrigin = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
