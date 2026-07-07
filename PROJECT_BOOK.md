# 📖 ספר הפרויקט — WakeTune

מדריך מלא לאפליקציה: מה יש בה, איך הכל עובד, ומה מחובר למה.
מיועד לקריאה מההתחלה לסוף, אבל אפשר גם לקפוץ לפרק לפי הצורך.

---

## תוכן עניינים

1. [מה האפליקציה עושה](#1-מה-האפליקציה-עושה)
2. [מפת העל — איך הכל מחובר](#2-מפת-העל--איך-הכל-מחובר)
3. [מדריך קבצים — קובץ־קובץ](#3-מדריך-קבצים--קובץקובץ)
4. [מחזור החיים של שעון מעורר](#4-מחזור-החיים-של-שעון-מעורר)
5. [שכבת Spotify](#5-שכבת-spotify)
6. [שכבת המשימות (Challenges)](#6-שכבת-המשימות-challenges)
7. [המסכים](#7-המסכים)
8. [הבדלי פלטפורמה iOS מול Android](#8-הבדלי-פלטפורמה-ios-מול-android)
9. [טבלת הכשלים — מה קורה כשמשהו נשבר](#9-טבלת-הכשלים--מה-קורה-כשמשהו-נשבר)
10. [אחסון, אבטחה ופרטיות](#10-אחסון-אבטחה-ופרטיות)
11. [הקוד הנייטיבי](#11-הקוד-הנייטיבי)
12. [ספריות צד־שלישי ולמה כל אחת](#12-ספריות-צדשלישי-ולמה-כל-אחת)
13. [איך מוסיפים דברים (מתכונים)](#13-איך-מוסיפים-דברים-מתכונים)

---

## 1. מה האפליקציה עושה

WakeTune הוא שעון מעורר חכם:

1. המשתמש מתחבר לחשבון ה־Spotify שלו (פעם אחת).
2. יוצר שעון מעורר: שעה, ימים, מקור מוזיקה, סוג משימה, רמת קושי.
3. בשעת ההשכמה — האפליקציה בוחרת שיר מהספרייה שלו ומנגנת אותו דרך Spotify.
4. ההתראה **לא נכבית** עד שהמשתמש משלים משימת התעוררות: הקלדת טקסט, שירה, או תנועה/ריקוד.
5. אם Spotify לא זמין מכל סיבה — מושמע צליל התראה מובנה. **השעון תמיד מצלצל.**

עקרונות: אין שרת (הכל מקומי), אין עקיפת מגבלות של Spotify/Apple/Google, תמיד יש דרך חירום לכבות (בטיחות), ופרטיות מלאה (שום אודיו לא מוקלט).

---

## 2. מפת העל — איך הכל מחובר

```
┌─────────────────────────────────────────────────────────────┐
│  UI — מסכים וקומפוננטות (src/screens, src/components)        │
│  Onboarding · SpotifyLogin · AlarmList · CreateAlarm ·       │
│  ActiveAlarm · WakeSuccess · Settings                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ hooks (useAuth, useAlarms)
┌──────────────────────────▼──────────────────────────────────┐
│  State — src/state                                           │
│  AuthContext (חיבור Spotify)  ·  AlarmsContext (רשימת שעונים)│
└──────────────────────────┬──────────────────────────────────┘
                           │ קריאות פונקציה
┌──────────────────────────▼──────────────────────────────────┐
│  Services — src/services                                     │
│                                                              │
│  spotify/     ─ התחברות, API, נגינה, בחירת שיר               │
│  alarms/      ─ תזמון, אירועי notification, אורקסטרציית צלצול│
│  challenges/  ─ מנוע המשימות (הקלדה/שירה/ריקוד)              │
│  lyrics/      ─ ממשק ספק מילים (demo בלבד כרגע)              │
│  audio/       ─ צליל גיבוי מקומי                             │
│  storage/     ─ שמירה מקומית (רגיל + מאובטח)                 │
│  permissions/ ─ הרשאות                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  עולם חיצוני                                                 │
│  Spotify Web API  ·  notifee (התראות מערכת)  ·               │
│  Keychain/Keystore  ·  חיישנים ומיקרופון                     │
└─────────────────────────────────────────────────────────────┘
```

**כלל הזהב של הארכיטקטורה:** מסכים לא מדברים ישירות עם Spotify או עם מערכת ההתראות — הם עוברים דרך ה־services. ככה אפשר להחליף מימוש (למשל ספק מילים אחר) בלי לגעת ב־UI.

### נקודת הכניסה

```
index.js
  ├─ רושם את notifee.onBackgroundEvent  ← קריטי! מטפל בהתראות כשהאפליקציה ברקע
  └─ רושם את src/app/App.tsx כרכיב הראשי
        App.tsx
          ├─ מחליט לאיזה מסך להיכנס (Onboarding? שעון מצלצל? רשימה?)
          ├─ עוטף הכל ב־AuthProvider + AlarmsProvider
          └─ NavigationContainer + RootNavigator (כל המסכים)
```

---

## 3. מדריך קבצים — קובץ־קובץ

### שורש הפרויקט

| קובץ | תפקיד |
|---|---|
| `index.js` | נקודת הכניסה. רושם את האפליקציה + מאזין להתראות ברקע |
| `src/config.ts` | **הקובץ היחיד שחובה לערוך** — ה־Client ID של Spotify |
| `package.json` | תלויות וסקריפטים (`npm run android/ios/typecheck/test`) |
| `tsconfig.json` / `babel.config.js` | TypeScript קפדני + כינוי `@/` שמצביע על `src/` |
| `app.json` | שם האפליקציה ל־React Native |
| `scripts/generateSounds.js` | מסנתז את צלילי הגיבוי (WAV מקוריים, חופשיים מזכויות) |

### `src/types/index.ts` — מודל הנתונים

כל האפליקציה מדברת בשלושה מבנים מרכזיים:

```ts
Alarm {                        // שעון מעורר אחד
  id, time {hour, minute},
  daysOfWeek: number[]         // 0=ראשון..6=שבת; ריק = חד־פעמי
  enabled, label?,
  musicSourceType              // liked_songs | top_tracks | playlist | artist | random_library
  spotifyPlaylistId?, spotifyArtistId?,
  trackPickStrategy            // most_loved | random | energetic | newest
  challengeMode                // lyrics | singing | dance | random
  difficulty                   // easy | medium | hard
  gradualVolumeEnabled, fallbackSound,
  createdAt, updatedAt
}

Track { id, uri, title, artist, albumName, albumArtUrl, durationMs }

ChallengeResult { success, score?, reason? }
```

בנוסף `ActiveAlarmSession` — "מה קורה עכשיו כשהשעון מצלצל": איזה שיר נבחר, האם אנחנו על צליל גיבוי, ואיזו משימה הוגרלה.

### `src/services/spotify/` — הכל מול Spotify

| קובץ | תפקיד | מי משתמש בו |
|---|---|---|
| `spotifyAuth.ts` | התחברות OAuth (PKCE), שמירת טוקנים ב־Keychain, רענון אוטומטי | `AuthContext`, וכל קריאת API דרך `getValidAccessToken()` |
| `spotifyApi.ts` | עטיפה מוקלדת ל־Web API הרשמי: פרופיל, Liked Songs, Top Tracks, פלייליסטים, אמנים, devices, play/pause/volume | `trackSelector`, `spotifyPlayback`, `AuthContext` |
| `spotifyPlayback.ts` | לוגיקת "תנגן את השיר הזה עכשיו": מציאת device, ניסיון להעיר את אפליקציית Spotify, ווליום הדרגתי | `alarmRinger` |
| `trackSelector.ts` | "איזה שיר להשמיע?" — שולף מועמדים לפי מקור השעון ובוחר לפי אסטרטגיה | `alarmRinger` |
| `spotifyTypes.ts` | טיפוסי התשובות של Spotify | כל הקבצים למעלה |

### `src/services/alarms/` — לב השעון

| קובץ | תפקיד |
|---|---|
| `alarmTypes.ts` | חוזה ה־`AlarmScheduler` + מזהי ערוץ/נתונים |
| `schedulerShared.ts` | הלוגיקה המשותפת: בניית ההתראות (notification) עם הטריגרים — חד־פעמי או שבועי לכל יום |
| `alarmScheduler.android.ts` | מימוש אנדרואיד: AlarmManager מסוג `SET_ALARM_CLOCK` (מדויק, חסין Doze) + מסך מלא מעל הנעילה |
| `alarmScheduler.ios.ts` | מימוש iOS: local notifications בלבד (זו המגבלה של iOS — מוסבר בפרק 8) |
| `alarmScheduler.ts` | fallback לטסטים; **Metro בוחר אוטומטית** את קובץ הפלטפורמה הנכון |
| `alarmEvents.ts` | מה קורה כשהתראה "נורית": שמירת "שעון ממתין", כיבוי שעונים חד־פעמיים |
| `alarmRinger.ts` | **המנצח על הצלצול**: Spotify מחובר? → Premium? → בחר שיר → נגן → ובכל כשל: צליל גיבוי. וגם `stopRinging()` שמכבה הכל |

### `src/services/challenges/` — משימות ההתעוררות

| קובץ | תפקיד |
|---|---|
| `challengeTypes.ts` | מבני ה־spec של כל משימה (מה מציגים, מה הסף לעבור) |
| `challengeEngine.ts` | בוחר איזו משימה לבנות; **מוריד בחן** למשימת הקלדה אם אין מיקרופון/חיישן — לעולם אין מסך בלתי־פתיר |
| `lyricsChallenge.ts` | משימת הקלדה: שורת מילים (אם יש ספק מורשה) → שם שיר/אמן → משפט. השוואה עם סף דמיון לפי קושי |
| `singingChallenge.ts` | משימת שירה: מודד עוצמת קול (RMS) מה־PCM החי של המיקרופון וצובר "שניות של שירה" |
| `danceChallenge.ts` | משימת תנועה: סופר "פיקים" של תאוצה מהאקסלרומטר, עם הגנה מרמאות |

### שאר ה־services

| קובץ | תפקיד |
|---|---|
| `lyrics/lyricsProvider.ts` | ממשק `LyricsProvider` — הארכיטקטורה למילות שיר **מורשות בלבד** |
| `lyrics/demoLyricsProvider.ts` | ספק דמו לפיתוח (שורות מקוריות, לא מילים אמיתיות) |
| `audio/fallbackSound.ts` | נגן צליל הגיבוי: לולאה אינסופית, ווליום מוגבל ל־85%, רמפה הדרגתית |
| `storage/secureStorage.ts` | Keychain (iOS) / Keystore (Android) — **רק** לטוקנים של Spotify |
| `storage/alarmStorage.ts` | שמירת השעונים ב־AsyncStorage (CRUD) |
| `storage/settingsStorage.ts` | הגדרות: הושלם onboarding? צליל ברירת מחדל? הסכמת מיקרופון? |
| `permissions/permissions.ts` | בקשה ובדיקה של: התראות, Exact Alarms (אנדרואיד), מיקרופון |

### `src/state/` — ניהול מצב

| קובץ | מה הוא מחזיק | מי צורך אותו |
|---|---|---|
| `AuthContext.tsx` | מחובר לספוטיפיי? פרופיל? Premium? + פעולות connect/disconnect | Onboarding, SpotifyLogin, CreateAlarm, Settings |
| `AlarmsContext.tsx` | רשימת השעונים + save/remove/toggle. **כל שינוי גם נשמר לדיסק וגם מסנכרן את התזמון** — אין מצב שהאחסון והתזמון סותרים | AlarmList, CreateAlarm, Settings |

### `src/navigation/`

| קובץ | תפקיד |
|---|---|
| `RootNavigator.tsx` | הגדרת כל המסכים והכותרות. ל־ActiveAlarm אין חזרה־אחורה (בכוונה) |
| `navigationRef.ts` | ref גלובלי — מאפשר לקוד שאינו מסך (מאזין ההתראות) לנווט למסך הצלצול |
| `types.ts` | הפרמטרים של כל מסך |

---

## 4. מחזור החיים של שעון מעורר

הזרימה החשובה ביותר באפליקציה, מקצה לקצה:

### שלב א: יצירה ותזמון

```
המשתמש לוחץ "Save alarm" ב־CreateAlarmScreen
   ↓
AlarmsContext.saveAlarm(alarm)
   ├─ alarmStorage.upsertAlarm()        → נשמר ל־AsyncStorage
   └─ alarmScheduler.scheduleAlarm()    → notifee.createTriggerNotification
        Android: טריגר AlarmManager מסוג SET_ALARM_CLOCK
                 (שבועי? נוצר טריגר נפרד לכל יום שנבחר: "alarmId::3" ליום רביעי)
        iOS:     local notification עם timestamp trigger
```

### שלב ב: השעה הגיעה

```
מערכת ההפעלה יורה את ההתראה
   ↓
┌─ האפליקציה חיה (foreground/background) ──────────────────────┐
│  App.tsx → notifee.onForegroundEvent                          │
│    → alarmEvents.handleAlarmNotificationEvent()               │
│        (שומר "pending alarm", מכבה שעון חד־פעמי)              │
│    → navigateToActiveAlarm() — ניווט מיידי למסך הצלצול        │
└───────────────────────────────────────────────────────────────┘
┌─ האפליקציה מתה ───────────────────────────────────────────────┐
│  Android: full-screen intent מקפיץ את האפליקציה מעל הנעילה +  │
│           צליל הערוץ (alarm_fallback.wav) מתנגן בלולאה         │
│  iOS:     ההתראה מוצגת עם צליל; המשתמש מקיש עליה               │
│    ↓                                                          │
│  App.tsx בעלייה בודק: notifee.getInitialNotification()        │
│  או getPendingAlarm() → ניווט ל־ActiveAlarm                   │
└───────────────────────────────────────────────────────────────┘
```

### שלב ג: הצלצול (ActiveAlarmScreen נטען)

```
ActiveAlarmScreen.useEffect
   ↓
alarmRinger.startRinging(alarm)
   1. isSpotifyConnected()?        לא → צליל גיבוי ("Spotify is not connected")
   2. isPremiumUser()?             לא → צליל גיבוי ("requires Premium")
   3. trackSelector.selectTrackForAlarm()
        שולף לפי המקור (Liked/Top/Playlist/Artist/Random)
        מסנן שירים לא־נגינים, בוחר לפי האסטרטגיה
                                   אין שירים → צליל גיבוי
   4. spotifyPlayback.startAlarmPlayback(track)
        מחפש device פעיל → אין? מנסה לפתוח את אפליקציית Spotify
        (deep link spotify:) → ממתין עד 10 שניות → מנסה שוב
                                   נכשל → צליל גיבוי
   5. הצלחה → אם ווליום הדרגתי: rampVolume() ‏20%→85% על פני 45 שניות
   ↓
challengeEngine.buildChallengeForSession()
   challengeMode === 'random'? מוגרל עכשיו
   singing בלי הרשאת מיקרופון/הסכמה? יורד להקלדה
   ↓
המסך מציג: שם שיר + אמן + עטיפה + המשימה
```

### שלב ד: המשימה והסיום

```
המשתמש מבצע את המשימה
   ├─ הקלדה  → evaluateLyricsChallenge() → דמיון ≥ סף? ✓
   ├─ שירה   → startSingingSession() → מספיק שניות של קול? ✓
   └─ ריקוד  → startDanceSession() → מספיק תנועות חזקות? ✓
   ↓ הצלחה
alarmRinger.stopRinging()
   ├─ עצירת Spotify (pause) או צליל הגיבוי
   ├─ ביטול ההתראה מהמסך
   └─ ניקוי ה"שעון הממתין"
   ↓
WakeSuccessScreen — "התעוררת בהצלחה" 🌞
```

**דרך החירום:** לחיצה ארוכה של 10 שניות על הפינה הימנית־תחתונה של מסך הצלצול מכבה הכל. קיימת כדי שלעולם לא תהיה תקיעות (בטיחות), אבל מוסתרת כדי שלא תהיה קיצור דרך מפתה.

**כשל חיישן:** אם האקסלרומטר לא זמין (נדיר) — ההתראה נכבית בכבוד במקום לכלוא את המשתמש.

---

## 5. שכבת Spotify

### התחברות (spotifyAuth.ts)

- **תקן:** OAuth 2.0 Authorization Code + **PKCE** — הזרימה הרשמית לאפליקציות מובייל. אין client secret באפליקציה (לא נדרש ולא בטוח).
- הדפדפן של המערכת נפתח → המשתמש מאשר אצל Spotify → Spotify מחזירה אותנו ל־`waketune://oauth-callback` → מקבלים access token (שעה) + refresh token.
- **אחסון:** רק ב־Keychain/Keystore. אף פעם לא ב־AsyncStorage.
- **רענון:** `getValidAccessToken()` נקראת לפני כל בקשת API; אם הטוקן פג בתוך דקה — מתרעננת שקוף. אם הרענון נכשל — נזרקת `SpotifyAuthError` והמשתמש יתבקש להתחבר מחדש.

### ה־scopes (הרשאות שהאפליקציה מבקשת מ־Spotify)

| Scope | בשביל מה |
|---|---|
| `user-read-private` | לדעת אם החשבון Premium |
| `user-read-email` | זיהוי החשבון במסך ההגדרות |
| `user-top-read` | Top Tracks / Top Artists |
| `user-library-read` | Liked Songs |
| `playlist-read-private` | בחירת פלייליסט |
| `user-read-playback-state` | אילו devices זמינים |
| `user-modify-playback-state` | play / pause / volume |

### נגינה (spotifyPlayback.ts) — איך זה באמת עובד

Spotify לא מאפשרת לנגן שירים "בתוך" אפליקציה זרה. הנגינה עובדת דרך **Spotify Connect**: אנחנו שולחים פקודת "נגן" ל־API, והיא מופנית ל־device שמריץ את Spotify (הטלפון עצמו, רמקול, מחשב).

לכן הסדר הוא:
1. `GET /me/player/devices` — יש device? מעדיפים את הפעיל, אחרת סמארטפון.
2. אין? פותחים את אפליקציית Spotify עם deep link ומחכים שתירשם כ־device (עד 5 ניסיונות בהפרש 2 שניות).
3. `PUT /me/player/play` עם ה־URI של השיר.
4. תשובת 403 = החשבון לא Premium; ‏404 = אין device — שניהם מתורגמים לצליל גיבוי עם הודעה מתאימה.

---

## 6. שכבת המשימות (Challenges)

### עקרון: spec → session → result

כל משימה נבנית כ־**spec** (מה להציג, מה הספים), רצה כ־**session** (מקבלת קלט חי), ומסתיימת ב־**ChallengeResult**.

### הקלדה (lyricsChallenge)

- סדר עדיפות לטקסט: שורת מילים מורשית → שם שיר/אמן → משפט השכמה מובנה.
- ההשוואה: נרמול (אותיות קטנות, בלי פיסוק — כולל תמיכה בעברית) → מרחק לוינשטיין → ציון דמיון 0–1.
- קושי: קל = סף 0.75 והתשובה מוצגת; בינוני = 0.85; קשה = 0.95 והשורה נעלמת אחרי 5 שניות (הקלדה מהזיכרון).
- **מדיניות מילים:** אין scraping ואין API לא־רשמי. `LyricsProvider` הוא interface — כשיהיה ספק מורשה (למשל Musixmatch בהסכם), מחליפים שורה אחת ב־`demoLyricsProvider.ts`.

### שירה (singingChallenge)

- פותח סטרים PCM מהמיקרופון (16kHz מונו), מחשב RMS לכל פריים **בזיכרון בלבד** — שום דבר לא נכתב לדיסק.
- פריים מעל סף העוצמה = "שירה"; צריך לצבור X שניות בתוך חלון זמן: קל 5/30, בינוני 10/40, קשה 18/50.
- נגמר הזמן? המד מתאפס ואפשר לנסות שוב (ההתראה ממשיכה).
- הגנה מרמאות בסיסית: פריימים שקטים לא נספרים, ההתקדמות רק מצטברת.

### ריקוד/תנועה (danceChallenge)

- אקסלרומטר ב־20Hz; מחושב גודל התאוצה מינוס כוח הכבידה.
- "תנועה" = פיק מעל הסף **וגם** לפחות רבע שנייה מהפיק הקודם (כדי שטפיחה אחת חזקה לא תספור כ־10).
- קל: 10 תנועות בסף 5m/s²; בינוני: 15 בסף 6.5; קשה: 25 בסף 8.
- המשימות בטוחות בכוונה (ניעור/הנפה של הטלפון), והמסך מציג אזהרת בטיחות קבועה.

### ההגרלה וההורדה־בחן (challengeEngine)

```
challengeMode = 'random'?  → מוגרל אחד משלושת הסוגים ברגע הצלצול
singing אבל אין הרשאת מיקרופון או אין הסכמה?  → הקלדה
dance אבל אין חיישן?  → session מסתיים, המסך מכבה בכבוד
```

---

## 7. המסכים

| מסך | מה רואים | מאיפה מגיעים | לאן ממשיכים |
|---|---|---|---|
| **Onboarding** | הסבר, חיבור Spotify, בקשת הרשאות, הסכמת מיקרופון, אזהרת iOS ובטיחות | פתיחה ראשונה | AlarmList |
| **SpotifyLogin** | סטטוס חיבור, רשימת ההרשאות, כפתור התחברות/ניתוק, אזהרת Free | Onboarding / Settings | חזרה |
| **AlarmList** | כל השעונים ככרטיסים: שעה ענקית, ימים, מקור+משימה, "מצלצל בעוד 7h 32m", מתג הפעלה | ברירת המחדל | CreateAlarm / Settings |
| **CreateAlarm** | בורר שעה, צ'יפים לימים/מקור/משימה/קושי, בורר פלייליסט (נטען מהחשבון), מתג ווליום הדרגתי | + New alarm או הקשה על כרטיס | חזרה לרשימה |
| **ActiveAlarm** | "WAKE UP!" פועם, כרטיס השיר, המשימה, הודעת סטטוס אם עברנו לצליל גיבוי. אין כפתור כיבוי; אין חזרה־אחורה | ההתראה | WakeSuccess |
| **WakeSuccess** | 🌞 "You're awake!", איזה שיר העיר אותך | ActiveAlarm | AlarmList |
| **Settings** | חיבור Spotify, בדיקת הרשאות (✅/❌ לחיץ), בחירת צליל גיבוי, **בדיקת התראה תוך 10 שניות**, פרטיות, ניתוק | האייקון ⚙️ | — |

### קומפוננטות משותפות (src/components)

- `AlarmCard` — כרטיס שעון ברשימה (הקשה=עריכה, לחיצה ארוכה=מחיקה, מתג=הפעלה).
- `SpotifyTrackCard` — שיר עם עטיפה, בשימוש במסך הצלצול.
- `ChallengeCard` — מסגרת משימה עם כותרת, הנחיה ומד התקדמות.
- `PrimaryButton` — כפתור גדול בשלושה סגנונות (ירוק/משני/אדום).

### עיצוב (src/theme/theme.ts)

רקע כהה `#0D0F12`, ירוק ספוטיפיי `#1DB954`, כרטיסים כהים עם מסגרת עדינה, טיפוגרפיה גדולה. כל המסכים שואבים מאותו קובץ — שינוי צבע אחד משנה את כל האפליקציה.

---

## 8. הבדלי פלטפורמה iOS מול Android

זה הפרק הכי חשוב להבנת "למה זה בנוי ככה".

| | Android | iOS |
|---|---|---|
| דיוק ההתראה | מדויק — `SET_ALARM_CLOCK` | מדויק (notification) |
| האפליקציה מתה בשעת הצלצול | **נפתחת לבד** מעל מסך הנעילה (full-screen intent) | **אי אפשר** להריץ קוד; ההתראה מוצגת והמשתמש מקיש |
| Spotify מתנגן אוטומטית כשהאפליקציה מתה | כן (האפליקציה קמה ואז מנגנת) | לא — רק אחרי שהמשתמש פותח את ההתראה |
| משך צליל ההתראה | בלולאה עד לפתרון | עד ~30 שניות לכל notification |
| מצב שקט / נא־לא־להפריע | הערוץ מוגדר `bypassDnd` | מכבד שקט/Focus אלא אם יש Critical Alerts entitlement (דורש אישור מיוחד מ־Apple — מסומן TODO) |
| אחרי ריבוט | notifee משחזר את הטריגרים (`RECEIVE_BOOT_COMPLETED`) | ההתראות המתוזמנות נשמרות ע"י המערכת |
| הרשאה מיוחדת | Exact Alarms (נבדק ומקושר להגדרות), Battery Optimization | Time-Sensitive notifications |

**איך הקוד מטפל בזה:** שני קבצים — `alarmScheduler.android.ts` ו־`alarmScheduler.ios.ts` — מממשים את אותו interface, ו־Metro (ה־bundler) בוחר אוטומטית את הנכון לפי הפלטפורמה. שאר האפליקציה בכלל לא יודעת על ההבדל. בנוסף, ה־Onboarding מציג למשתמשי iPhone הסבר כן: לא לסגור את האפליקציה בכוח בלילה, לאשר התראות Time-Sensitive.

---

## 9. טבלת הכשלים — מה קורה כשמשהו נשבר

| תרחיש | מה המשתמש חווה |
|---|---|
| אין חיבור לאינטרנט בזמן הצלצול | צליל גיבוי + הודעה |
| Spotify לא מחובר | צליל גיבוי + "Spotify is not connected" |
| חשבון Free (לא Premium) | צליל גיבוי + הסבר ש־Premium נדרש לנגינה |
| אין device של Spotify | ניסיון לפתוח את Spotify אוטומטית → אם נכשל: צליל גיבוי + טיפ |
| הטוקן פג | רענון שקוף; אם גם הוא נכשל — כמו "לא מחובר" |
| Rate limit של Spotify (429) | המתנה לפי ההנחיה של Spotify וניסיון חוזר אחד |
| אין מילים לשיר | המשימה הופכת ל"הקלד את שם השיר/האמן" |
| אין הרשאת מיקרופון למשימת שירה | המשימה הופכת להקלדה |
| אין אקסלרומטר למשימת ריקוד | ההתראה נכבית בכבוד (לא כולאים) |
| שעון חד־פעמי צלצל | מכבה את עצמו אוטומטית ברשימה |
| התראה צלצלה לפני יותר משעתיים ולא טופלה | לא קופצת פתאום בצהריים — מסומנת כנטושה |
| המשתמש נתקע במשימה | לחיצה ארוכה 10 שניות בפינה = כיבוי חירום |

---

## 10. אחסון, אבטחה ופרטיות

### מה נשמר ואיפה

| נתון | איפה | למה שם |
|---|---|---|
| טוקנים של Spotify | Keychain (iOS) / Keystore (Android) | מוצפן ברמת מערכת ההפעלה |
| שעונים | AsyncStorage (`waketune.alarms.v1`) | לא רגיש; מהיר ופשוט |
| הגדרות + הסכמת מיקרופון | AsyncStorage (`waketune.settings.v1`) | כנ"ל |
| "שעון ממתין" (צלצל ולא טופל) | AsyncStorage | מאפשר לחדש את מסך הצלצול אחרי הרג |
| הקלטות קול | **בשום מקום** — מעובד בזיכרון ונזרק | פרטיות |

### מה בכוונה איננו

- אין שרת ואין חשבון WakeTune — אין מה לפרוץ ואין מה לדלוף.
- אין אנליטיקס, אין פרסומות, אין SDK של מעקב.
- הסיסמה של Spotify לעולם לא עוברת דרך האפליקציה (OAuth בדפדפן).
- אין הורדת שירים, אין עקיפת DRM, אין API לא־רשמי.

---

## 11. הקוד הנייטיבי

### Android (`android/`)

| קובץ | מה מיוחד בו |
|---|---|
| `app/src/main/AndroidManifest.xml` | כל ההרשאות עם הסבר בהערות: exact alarms, full-screen intent, boot, מיקרופון, foreground service. וגם `<queries>` ל־`spotify:` והגדרת ה־Activity עם `showWhenLocked` + `turnScreenOn` |
| `app/build.gradle` | placeholder של `appAuthRedirectScheme=waketune` (ה־OAuth redirect), חתימת release מ־`keystore.properties` |
| `MainActivity.kt` / `MainApplication.kt` | סטנדרט RN + הערות על התנהגות מעל מסך נעילה |
| `res/raw/*.wav` | צלילי הגיבוי (מוטמעים ב־APK כדי לעבוד גם בלי רשת) |

### iOS (`ios/`)

| קובץ | מה מיוחד בו |
|---|---|
| `WakeTune/Info.plist` | סכמת `waketune://`, ‏`LSApplicationQueriesSchemes: spotify`, הסברי מיקרופון/תנועה, portrait בלבד |
| `Podfile` | `setup_permissions(['Microphone'])` — מקמפל רק את ה־handler הנחוץ |
| `WakeTune/Sounds/*.wav` | הצלילים, רשומים כ־resources בפרויקט |
| `WakeTune.xcodeproj` | פרויקט מלא מבוסס התבנית הרשמית של RN 0.75.4 |

---

## 12. ספריות צד־שלישי ולמה כל אחת

| ספרייה | תפקיד | איפה בקוד |
|---|---|---|
| `@notifee/react-native` | התראות + טריגרים מדויקים (AlarmManager) + full-screen + שחזור אחרי ריבוט | `services/alarms/*` |
| `react-native-app-auth` | OAuth PKCE בדפדפן המערכת | `spotifyAuth.ts` |
| `react-native-keychain` | Keychain/Keystore | `secureStorage.ts` |
| `@react-native-async-storage/async-storage` | אחסון מקומי | `storage/*`, `alarmEvents.ts` |
| `@react-navigation/*` | ניווט בין מסכים | `navigation/*` |
| `react-native-permissions` | בקשת הרשאות | `permissions.ts` |
| `react-native-sensors` | אקסלרומטר | `danceChallenge.ts` |
| `react-native-audio-record` | סטרים PCM מהמיקרופון | `singingChallenge.ts` |
| `react-native-sound` | נגינת צליל הגיבוי בלולאה | `fallbackSound.ts` |
| `@react-native-community/datetimepicker` | בורר שעה | `CreateAlarmScreen.tsx` |

---

## 13. איך מוסיפים דברים (מתכונים)

**להוסיף צליל גיבוי חדש:** הוסף פונקציה ב־`scripts/generateSounds.js` (או קובץ WAV משלך) → הרץ את הסקריפט → הוסף שורה ל־`FALLBACK_SOUNDS` ב־`fallbackSound.ts`. ב־iOS ודא שהקובץ רשום כ־resource.

**לחבר ספק מילים אמיתי (מורשה!):** צור `musixmatchProvider.ts` שמממש את `LyricsProvider` → החלף את `activeLyricsProvider` ב־`demoLyricsProvider.ts`. זה הכל — `lyricsChallenge` כבר יודע להשתמש בו.

**להוסיף סוג משימה רביעי:** הוסף טיפוס ל־`ChallengeMode` (types) → צור `myChallenge.ts` עם build+session → הוסף case ב־`challengeEngine` → הוסף רינדור ב־`ActiveAlarmScreen` → הוסף צ'יפ ב־`CreateAlarmScreen`.

**לשנות את ספי הקושי:** הכל טבלאות `SPECS`/`THRESHOLDS` בראש קבצי המשימות.

**להוסיף מסך:** הוסף ל־`RootStackParamList` (navigation/types) → צור את המסך → רשום ב־`RootNavigator`.

---

## מסמכים נוספים בריפו

| מסמך | תוכן |
|---|---|
| `ARCHITECTURE.md` | תוכנית הארכיטקטורה המקורית וניתוח המגבלות |
| `docs/SPOTIFY_SETUP.md` | יצירת ה־Client ID צעד־צעד |
| `docs/IOS_SETUP.md` | בנייה על מק |
| `docs/RELEASE.md` | פרסום ל־Google Play ול־App Store |
| `docs/STORE_LISTING.md` | טקסטים מוכנים לדפי החנות (עברית+אנגלית) |
| `PRIVACY_POLICY.md` | מדיניות הפרטיות (נדרש לחנויות) |
