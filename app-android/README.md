# Калькулятор зеркал (Android, com.zerkalopro.calc)

С версии 18 приложение — оболочка WebView для https://zerkalo-pro-spb.ru/app-kalk/ .
Страница сама сохраняет себя для работы без интернета и при каждом запуске берёт свежую версию с сайта,
поэтому для правки цен новый APK не нужен: достаточно изменить `app-kalk/index.html` на сайте.

- `../app-kalk/index.html` — код калькулятора (единственный источник), `../app-kalk/sw.js` — сохранение и обновление.
- `kalkulyator/` — исходники оболочки (манифест, `MainActivity`, иконки).
- `apk/Kalkulyator-zerkal-18.apk` — оболочка с самообновлением.
- `apk/Kalkulyator-zerkal-6…17.apk` — старые версии со страницей внутри APK (без обновления).

Сборка оболочки без Gradle: `aapt2 compile/link` → `javac -source 8 -target 8` → `d8` → `zipalign` → `apksigner`
(build-tools 34, platform android-34, minSdk 21, targetSdk 34). Ключ подписи в репозитории не хранится;
версии 16–18 подписаны одним ключом.
