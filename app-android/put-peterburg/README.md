# Путь Петербург (Android, com.zerkalopro.put)

Оболочка WebView для https://zerkalo-pro-spb.ru/put-peterburg/ . Сайт сам сохраняет программу и базу
для работы без интернета, поэтому обновления приходят с сайта и новый APK для них не нужен.

Сборка без Gradle: `aapt2 compile/link` → `javac --release 8` → `d8` → `zipalign` → `apksigner`
(build-tools 36, platform android-35, minSdk 24, targetSdk 34). Ключ подписи в репозитории не хранится.
