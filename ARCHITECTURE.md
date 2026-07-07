# WakeTune — Architecture Plan

שעון מעורר חכם שמעיר אותך עם שיר אהוב מ־Spotify, ולא נכבה עד שמשלימים משימת התעוררות.

## 1. עקרונות על

- **MVP בלי backend** — הכל מקומי: שעונים ב־AsyncStorage, טוקנים ב־Keychain/Keystore, קריאות ישירות ל־Spotify Web API עם OAuth PKCE (אין client secret באפליקציה).
- **כבוד למגבלות פלטפורמה** — לא ממציאים יכולות. כל מגבלה מקבלת fallback מפורש + `TODO` בקוד.
- **ההתראה תמיד נשמעת** — Spotify הוא ה"תוכן", אבל צליל מקומי הוא רשת הביטחון. כל כשל ב־Spotify (אין Premium / אין device / אין רשת) מפעיל fallback sound.
- **בטיחות** — תמיד יש מנגנון חירום (לחיצה ארוכה 10 שניות בפינה), ווליום מוגבל ל־85%, משימות תנועה פשוטות, אזהרת "מקום בטוח" על מסך ההתראה.
- **פרטיות** — עיבוד מיקרופון/חיישנים מקומי בלבד, אין הקלטות, אין שרת, הסכמה מפורשת למיקרופון ב־Onboarding.

## 2. מה אפשרי ומה מוגבל (ניתוח כנה)

### אפשרי במלואו
| יכולת | איך |
|---|---|
| OAuth מול Spotify | Authorization Code + PKCE דרך `react-native-app-auth` |
| שליפת Liked Songs / Top Tracks / Playlists / Artists | Spotify Web API רשמי |
| שליטה בנגינה (play/pause/volume) | Web API — **Premium בלבד** |
| שעון מעורר מדויק ב־Android | `AlarmManager` בסוג `setAlarmClock` (דרך notifee) — פטור מ־Doze |
| מסך התראה מעל מסך נעילה (Android) | Full-screen intent + `showWhenLocked`/`turnScreenOn` |
| שחזור שעונים אחרי ריבוט (Android) | notifee boot receiver + `RECEIVE_BOOT_COMPLETED` |
| משימות: הקלדה / שירה (עוצמת קול) / תנועה | TextInput / RMS על PCM מהמיקרופון / accelerometer |

### מוגבל — עם פתרון חלופי מובנה
| מגבלה | הפתרון בקוד |
|---|---|
| **iOS: אין קוד ברקע בזמן ההתראה** אם האפליקציה נהרגה | Local notification (time-sensitive) מצלצלת; Spotify + המשימה מתחילים כשפותחים אותה. הסבר למשתמש ב־Onboarding. `alarmScheduler.ios.ts` |
| **iOS: צליל התראה עד ~30 שניות**, מכבד מצב שקט/Focus | TODO ל־Critical Alerts entitlement (דורש אישור Apple) + follow-up notifications |
| **Spotify Free — אין שליטה בנגינה** | זיהוי 403/`product!=premium` → הודעה ברורה + fallback sound |
| **אין Spotify Connect device פעיל** | ניסיון להעיר את אפליקציית Spotify ב־deep link (רק כשאנחנו בפורגראונד) + polling; אחרת fallback |
| **אין Lyrics API חוקי חינמי** | ממשק `LyricsProvider` + provider דמו; ללא מילים — הקלדת שם שיר/אמן/משפט. אין scraping |
| **Audio Features (אנרגיה) הוצא משימוש לאפליקציות חדשות** | אסטרטגיית "אנרגטי" יורדת ל־random עם TODO |
| **OEM battery killers באנדרואיד** | קישור להגדרות Battery Optimization ממסך ההגדרות |

## 3. שכבות

```
UI (screens/components)
   ↓ hooks
State (AuthContext, AlarmsContext)
   ↓
Services
   ├─ spotify/    auth (PKCE+Keychain) · api (Web API) · playback (Connect) · trackSelector
   ├─ alarms/     scheduler (per-platform) · events (notifee) · ringer (אורקסטרציה)
   ├─ challenges/ engine · lyrics · singing · dance
   ├─ lyrics/     LyricsProvider interface · demo provider
   ├─ audio/      fallback sound (loop, volume-capped)
   ├─ storage/    secure (tokens) · alarms · settings
   └─ permissions/
```

### זרימת התראה (Android, המסלול המלא)
1. `AlarmsContext.saveAlarm` → `alarmScheduler.android` יוצר notifee trigger עם `AlarmManager(SET_ALARM_CLOCK)` — טריגר שבועי לכל יום נבחר.
2. בשעת היעד: notification עם full-screen intent פותח את האפליקציה מעל מסך הנעילה; `alarmEvents` שומר "pending alarm" ומכבה one-shot.
3. `ActiveAlarmScreen` נטען → `alarmRinger.startRinging`: בדיקת חיבור → בדיקת Premium → בחירת שיר לפי המקור → `startAlarmPlayback` (device selection + wake) → בכל כשל: `playFallbackSound`.
4. `challengeEngine` בונה את המשימה (random נפתר כאן; שירה בלי הרשאת מיקרופון יורדת להקלדה — לעולם לא מסך בלתי־פתיר).
5. הצלחה → `stopRinging` (עצירת Spotify/fallback, ביטול notification) → מסך "התעוררת בהצלחה".

### זרימת התראה (iOS)
זהה מרגע שהמשתמש פתח את ההתראה. ההבדל: אם האפליקציה מתה — הצלצול הראשוני הוא notification בלבד, בלי Spotify, עד לפתיחה.

## 4. MVP ריאלי (מה שממומש עכשיו)

1. התחברות Spotify (PKCE) + שמירת טוקנים מאובטחת + refresh אוטומטי.
2. Top Tracks / Liked Songs / Playlist / Artist / Random library.
3. יצירה, עריכה, מחיקה, הפעלה/כיבוי של שעונים + תצוגת "מצלצל בעוד…".
4. תזמון מדויק (Android) / notification (iOS) + שחזור אחרי ריבוט.
5. מסך התראה פעילה עם שיר, עטיפה, ומשימה — בלי כפתור כיבוי רגיל; חירום בלחיצה ארוכה 10 ש'.
6. שלוש משימות: הקלדה (עם דמיון Levenshtein לפי קושי), שירה (RMS מצטבר), ריקוד (ספירת peaks עם anti-cheat).
7. Fallback sound בכל תרחיש כשל + ווליום הדרגתי.
8. מסך הגדרות: חיבור, הרשאות, צליל fallback, בדיקת התראה (10 ש'), פרטיות, logout.

### שלבים הבאים (לא ב־MVP)
Lyrics provider מורשה · pitch detection לשירה · זיהוי תנועה במצלמה · Critical Alerts ב־iOS · Foreground service לצלצול עמיד ב־Android · אנליטיקס מקומי · UI polish · E2E tests.

## 5. סטאק

React Native 0.75 (Bare) + TypeScript strict · notifee (alarms/notifications) · react-native-app-auth · react-native-keychain · AsyncStorage · react-navigation · react-native-sensors · react-native-audio-record · react-native-sound · react-native-permissions.

**למה Bare ולא Expo:** exact alarms + full-screen intent + boot restore דורשים הגדרות native (manifest, activity flags) שקל וישיר יותר לנהל ב־Bare. ה־JS עצמו לא תלוי ב־Expo.
