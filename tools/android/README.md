# Offline APK build, 17.11.2026

`build-offline-apk.py` packages the previously compiled WebView activity from
`app-android/apk/Kalkulyator-zerkal-27.apk` with the current assets under
`app-android/kalkulyator/assets`. Native Java/DEX is unchanged. SDK tools used:
Google Android Build Tools 34.0.0 (`build-tools_r34-linux.zip`).

```sh
python3 tools/android/build-offline-apk.py \
  --template app-android/apk/Kalkulyator-zerkal-27.apk \
  --assets app-android/kalkulyator/assets \
  --shared-assets assets --output unsigned.apk
zipalign -f -p 4 unsigned.apk aligned.apk
apksigner sign --key "$SPB_SIGNING_PK8" --cert "$SPB_SIGNING_CERT" \
  --v1-signing-enabled true --v2-signing-enabled true \
  --v3-signing-enabled true --v4-signing-enabled false \
  --out Zerkalo-Pro-SPb-4.43.apk aligned.apk
apksigner verify --verbose --print-certs Zerkalo-Pro-SPb-4.43.apk
zipalign -c -p 4 Zerkalo-Pro-SPb-4.43.apk
```

Keys are external to the repository. The output uses the preserved original
SPb signing identity (certificate SHA-256
`9e10d5625c9fe82308fb521de33aa1fb3c836ca351a514f7ba200ca8037cbee6`),
package `ru.zerkalopro.spbcalculator`, versionName `4.43`, versionCode `1001`.
It is compatible with that original SPb identity. The newer wrapper has package
`com.zerkalopro.calc` and a different debug certificate, so this build installs
alongside it; no uninstall is necessary. Existing data from that wrapper is not
migrated to the SPb package. It is not a same-package replacement for wrapper 27.

The new APK contains mandatory rear reinforcement and mounts, frame sale by
actual running metres, the 500-ruble profile trip and delivery at 1600 + 40/km.
Address search and routing still need Internet. The local calculator works from
bundled assets when the live app page cannot load.

Validation: Android v1/v2/v3 signatures and zip alignment verified, manifest
identity and activity checked with aapt2, all local HTML script/style/media
references resolved, every bundled source asset compared byte for byte, native
DEX compared to the existing wrapper, eight pricing/consent tests passed.
No physical Android device or Android emulator run was performed.
