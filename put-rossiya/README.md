# Путь • Россия (демо)

Одно приложение с выбором города, села и населённого пункта. Данные: 2ГИС (поиск, карта, маршруты).
Петербургское приложение `../put-peterburg/` не изменено.

## Ключ 2ГИС
Хранится только на сервере, в переменной окружения `DGIS_KEY`. В коде и в APK ключа нет.

## Запуск демо на Vercel
1. Vercel → Add New Project → этот репозиторий, ветка `put-rossiya-demo`.
2. **Root Directory: `put-rossiya`**. Framework: Other.
3. Settings → Environment Variables: `DGIS_KEY` = ваш ключ 2ГИС. Redeploy.
4. (по желанию) `ALLOWED_ORIGINS` = адреса через запятую; по умолчанию `*`.

## APK
GitHub → Actions → «Put-Rossiya APK» → Run workflow. В поле `api_url` укажите адрес проекта Vercel.
Готовый `put-rossiya.apk` появится одним файлом в разделе Releases репозитория.
