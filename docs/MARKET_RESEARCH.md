# 📊 מחקר שוק — WakeTune 2.0

_עודכן: יולי 2026. כל הנתונים מקושרים למקורות חיצוניים._

המוצר הנבחן: אפליקציית השכמה שמנגנת פלייליסט מ־Spotify/Apple Music בפול ווליום,
לא נכבית עד הוכחת התעוררות מאומתת ב־**ראייה ממוחשבת מקומית** (שכיבות סמיכה /
ריקוד / הקלדה), ואחרי ההתעוררות: צילום ארוחת בוקר → לוג תזונתי, וסקירת
היום מהמייל והיומן.

---

## 1. תקציר מנהלים

- **השוק גדול וצומח מהר**: שוק אפליקציות השינה/ניטור שינה מוערך ב־**$2.9–4.7 מיליארד ב־2025** עם צמיחה שנתית של **14–18%** ([Business Research Insights](https://www.businessresearchinsights.com/market-reports/sleep-apps-and-sleep-tracking-apps-market-125301), [Global Growth Insights](https://www.globalgrowthinsights.com/market-reports/sleep-monitoring-apps-market-101086)).
- **הוכחת ביקוש חד־משמעית**: Alarmy — אפליקציית "השכמה עם משימות" — מגלגלת **~$500K בחודש** עם **75 מיליון משתמשים** ([Indie Hackers](https://www.indiehackers.com/post/alarmy-the-11-million-alarm-clock-app-c74024c017), [App Store](https://apps.apple.com/us/app/alarmy-loud-alarm-clock/id1163786766)).
- **הרעיון של אימות תרגילים במצלמה כבר קיים — אבל צעיר מאוד**: גל של אפליקציות נישה חדשות (Pushy, IronWake, PushClock, Upzy) הושק ב־2024–2025. אף אחת מהן לא שילבה מוזיקת סטרימינג, תזונה או אגנדה. **החלון פתוח.**
- **צילום אוכל → קלוריות הוא קטגוריה מוכחת ולוהטת**: Cal AI הגיעה ל־**15M הורדות ו־$30M ARR תוך פחות משנתיים** ונרכשה על ידי MyFitnessPal במרץ 2026 ([TechCrunch](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/), [CNBC](https://www.cnbc.com/2025/09/06/cal-ai-how-a-teenage-ceo-built-a-fast-growing-calorie-tracking-app.html)).
- **"תדריך בוקר" מהמייל והיומן הוא טרנד AI מרכזי 2025–2026**: Google השיקה את Gemini Daily Brief ב־Workspace ([MindStudio](https://www.mindstudio.ai/blog/google-gemini-daily-brief-ai-morning-digest)); אף שחקן לא חיבר אותו לרגע ההתעוררות הפיזי.
- **המסקנה**: אין היום אף מוצר שמחבר את ארבעת החלקים — השכמה מוזיקלית אישית + אימות גופני ב־CV + תזונת בוקר + אגנדה. WakeTune 2.0 יכולה להיות "מערכת ההפעלה של הבוקר".

---

## 2. גודל שוק וצמיחה

| סגמנט | גודל 2025 | תחזית | CAGR | מקור |
|---|---|---|---|---|
| אפליקציות ניטור שינה | $4.66B | $24.4B עד 2035 | 18.05% | [Global Growth Insights](https://www.globalgrowthinsights.com/market-reports/sleep-monitoring-apps-market-101086) |
| אפליקציות שינה ומעקב | $2.91B | $9.6B עד 2034 | 14.19% | [Business Research Insights](https://www.businessresearchinsights.com/market-reports/sleep-apps-and-sleep-tracking-apps-market-125301) |
| אפליקציות מעקב שינה (הערכה שמרנית) | $1.5B | $4.2B עד 2034 | 15.5% | [Verified Market Reports](https://www.verifiedmarketreports.com/product/sleep-tracking-apps-market/) |

נקודות רלוונטיות מהדוחות: "שעונים חכמים" (smart alarms) הם **~20% מהשוק**;
~42% מהאפליקציות הוסיפו יכולות AI מותאמות אישית בשנתיים האחרונות
([Coherent Market Insights](https://www.coherentmarketinsights.com/industry-reports/global-sleep-app-market)).

---

## 3. מתחרים ישירים — השכמה עם משימות

### 3.1 Alarmy — מנהיג הקטגוריה 👑

- **75M משתמשים, מדורגת #1 ב־90+ מדינות, 1.7M ביקורות** ([App Store](https://apps.apple.com/us/app/alarmy-loud-alarm-clock/id1163786766))
- הכנסות: **~$500K/חודש** כיום ([YouTube breakdown](https://www.youtube.com/shorts/T_eeO7RbCpc)); כבר ב־2021 גלגלה $11.2M בשנה ([Indie Hackers](https://www.indiehackers.com/post/alarmy-the-11-million-alarm-clock-app-c74024c017))
- משימות: חשבון, ניעור, **צילום מקום מסוים בבית** (קום ולך לשירותים לצלם את הכיור), סקוואטים (ספירה בחיישנים, לא CV), הליכה
- מודל: freemium, פרימיום מ־$4.99/חודש ([Adapty paywall teardown](https://adapty.io/paywall-library/alarmy/))
- **חולשות מול WakeTune 2.0**: אין נגינת Spotify/Apple Music מהחשבון האישי, אימות התרגילים מבוסס חיישנים ולא מצלמה (קל לרמות), אין שום שכבת "בוקר" (תזונה/אגנדה)

### 3.2 גל ה־CV החדש (2024–2025) — קטן אבל מאמת את הכיוון

| אפליקציה | מה היא עושה | קישור |
|---|---|---|
| **Pushy** | שכיבות סמיכה מול המצלמה, ספירה on-device, בלי שמירת וידאו | [pushupsalarm.com](https://pushupsalarm.com/), [App Store](https://apps.apple.com/us/app/pushy-push-ups-alarm/id6755542324), [Google Play](https://play.google.com/store/apps/details?id=com.iuri.pushups_alarm) |
| **IronWake** | סקוואטים/קפיצות/שכיבות/פלאנק עם pose detection | [App Store](https://apps.apple.com/us/app/fitness-alarm-clock-ironwake/id6756242951) |
| **PushClock** | שכיבות+סקוואטים במצלמה, "צא לגעת בדשא", חידות | [App Store](https://apps.apple.com/us/app/pushclock-loud-alarm-clock/id6760209491) |
| **Upzy** | 12 משימות כולל "AI camera", צעדים, QR | [App Store](https://apps.apple.com/us/app/upzy-wake-up-smarter/id6761421752) |

**התובנה**: כולן הושקו לאחרונה, כולן iOS-first, כולן חד־ממדיות (רק התראה+תרגיל).
אף אחת לא מחוברת למוזיקה אישית או לשגרת בוקר. הטכנולוגיה מוכחת — הבידול פתוח.

### 3.3 השכמה עם מוזיקת סטרימינג

- **Google Clock + Spotify** — אינטגרציה רשמית באנדרואיד מאז 2018 ([Spotify Newsroom](https://newsroom.spotify.com/2018-07-31/wake-up-to-the-perfect-soundtrack-with-spotify-and-clock-app-from-google/)) — אבל בלי משימות בכלל, וסנוז אינסופי
- **iOS אין פתרון מובנה** — נישה של אפליקציות צד־שלישי: Kello (Spotify/Deezer/Tidal), Mornify, SpotOn ([סקירת השוק](https://www.audkit.com/spotify-music/top-spotify-alarm-clock.html))
- **Sleep as Android** — תומכת ב־Spotify + משימות בסיסיות; חזקה באנדרואיד בלבד, UI מיושן

### 3.4 שינה חכמה / הרגלים (השלב הבא שלך — "הרגלי שינה טובים")

- **Sleep Cycle** — חברה ציבורית (נאסד"ק שטוקהולם), **~878K מנויים משלמים**, ARPU ‏271 SEK/שנה ([דוח Q2 2025](https://www.investing.com/news/company-news/sleep-cycle-q2-2025-slides-revenue-dips-while-margins-hold-strong-93CH-4206123), [IR](https://investors.sleepcycle.com/)) — השכמה בשלב שינה קל; בלי משימות ובלי מוזיקה אישית
- **Rise** — מודל מקצב צירקדי ותחזית אנרגיה יומית ([Sleep Foundation](https://www.sleepfoundation.org/best-sleep-apps))
- מתחרים משיקים: Calm Sleep, Headspace, Pillow, AutoSleep

---

## 4. הפיצ'רים המשלימים — בנצ'מרקים

### 4.1 צילום ארוחה → תזונה (הוכחת שוק: Cal AI)

- **15M+ הורדות, $30M+ הכנסה שנתית תוך <שנתיים; נרכשה ע"י MyFitnessPal (מרץ 2026)** ([TechCrunch — רכישה](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/), [TechCrunch — צמיחה](https://techcrunch.com/2025/03/16/photo-calorie-app-cal-ai-downloaded-over-a-million-times-was-built-by-two-teenagers/))
- בחודש בודד: ~700K הורדות ו־**$2M הכנסה** ([SensorTower](https://app.sensortower.com/overview/6480417616?country=US))
- **אזהרת דיוק**: הטענה ל"90% דיוק" שנויה במחלוקת — בארוחות מעורבות סטייה של 25–50% ([ניתוח תמחור ודיוק](https://www.eesel.ai/blog/cal-ai-pricing)). המסקנה למוצר: להציג טווחים ולא מספר "מדויק", ולאפשר תיקון ידני.

### 4.2 תדריך בוקר מהמייל והיומן

- **Google Gemini Daily Brief** — סיכום בוקר אוטומטי מ־Gmail+Calendar+Tasks, זמין רק בתוכניות Workspace עסקיות ([MindStudio](https://www.mindstudio.ai/blog/google-gemini-daily-brief-ai-morning-digest)) — כלומר לצרכן הפרטי **אין** פתרון מובנה
- אפליקציות planner כמו [Routine](https://routine.co/) מחברות יומן+משימות אבל לא את רגע ההתעוררות
- הטרנד: אנשים בונים לעצמם "daily briefing" עם עוזרי AI ([דוגמה](https://tygartmedia.com/claude-cowork-daily-briefing/)) — סימן ביקוש שטרם מוצר לצרכן

---

## 5. ניתוח פערים — איפה WakeTune 2.0 מנצחת

| יכולת | Alarmy | Pushy/IronWake | Sleep Cycle | Google Clock | Cal AI | **WakeTune 2.0** |
|---|---|---|---|---|---|---|
| מוזיקה מהחשבון האישי (Spotify/Apple Music) | ❌ | ❌ | ❌ | ✅ (אנדרואיד בלבד) | — | ✅ |
| משימות "אין ברירה אלא לקום" | ✅ | ✅ | ❌ | ❌ | — | ✅ |
| אימות תרגילים ב־**מצלמה** (לא ניתן לרמות) | ❌ (חיישנים) | ✅ | ❌ | ❌ | — | ✅ |
| ריקוד מאומת CV | ❌ | ❌ | ❌ | ❌ | — | ✅ (ייחודי!) |
| לוג תזונה מצילום | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| אגנדת בוקר (יומן+מייל) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| פרטיות: CV מקומי בלבד | — | ✅ (Pushy) | — | — | ❌ (ענן) | ✅ |

**הפוזיציה**: לא "עוד שעון מעורר" אלא **The Morning OS** — 15 הדקות הראשונות של
היום במוצר אחד: קימה מאומתת → דלק (ארוחה) → מיקוד (אגנדה).

**קהל יעד ראשוני**: גברים ונשים 18–35, מתאמנים או שואפים להתאמן, משתמשי
Spotify/Apple Music כבדים, "אנשי בוקר בכוח" (מי שחייב לקום לעבודה/לימודים
ונלחם בסנוז). החפיפה עם קהל Cal AI ו־Alarmy כמעט מושלמת.

---

## 6. תמחור מומלץ (בנצ'מרק)

| מוצר | מחיר |
|---|---|
| Alarmy Premium | מ־$4.99/חודש ([Adapty](https://adapty.io/paywall-library/alarmy/)) |
| Cal AI | ~$2.99–9.99/חודש לפי תוכנית ([NutriScan השוואה](https://nutriscan.app/blog/posts/cal-ai-pricing-2026-monthly-yearly-premium-abc6e7b26f)) |
| Sleep Cycle | ~$39.99/שנה |

**המלצה ל־WakeTune**: חינם — שעון + משימה אחת + צליל מובנה; **Premium ‏$5.99/חודש
או $39.99/שנה** — מוזיקת סטרימינג, כל המשימות עם CV, לוג תזונה, אגנדת בוקר.
לוג התזונה הוא ה־upsell החזק (הוכח ב־Cal AI שאנשים משלמים על זה בנפרד).

---

## 7. סיכונים ומגבלות (בעיניים פקוחות)

1. **"פול ווליום ללא הפסקה" מלא אפשרי רק באנדרואיד.** ב־iOS, אם האפליקציה נהרגה — הצלצול הוא notification עד ~30 שניות בכל פעם, והמוזיקה מתחילה רק כשפותחים. כל המתחרים חיים עם אותה מגבלה (לכן Pushy ו־IronWake הן iOS אבל מבקשות "אל תסגור את האפליקציה"). פתרון חלקי: Critical Alerts entitlement מ־Apple.
2. **Spotify Quota Extension** — שער כניסה לקהל רחב (ראה `docs/GOING_PUBLIC.md`). Apple Music/MusicKit לעומת זאת — בלי מגבלת משתמשים, וזה טיעון חזק לתמוך בשניהם.
3. **גישה ל־Gmail** דורשת אימות אבטחה של Google לאפליקציות עם restricted scopes (תהליך + עלות שנתית פוטנציאלית). יומן בלבד (Calendar readonly + EventKit ב־iOS) הרבה יותר קל — **מומלץ להתחיל מיומן, מייל בשלב 2**.
4. **דיוק זיהוי אוכל** — לא להבטיח "90%"; להציג טווחים ולאפשר עריכה (הלקח מהביקורת על Cal AI).
5. **פרטיות CV** — חובה עיבוד מקומי בלבד ואפס שמירת וידאו; זה גם בידול שיווקי (Pushy כבר מפרסמת כך).

---

## 8. המלצת מיקוד (בהתאם לבקשה: קודם רק להעיר בבוקר)

**Phase 1 — "השעון שאי אפשר לרמות"** (המינימום שהוגדר):
פלייליסט מ־Spotify/Apple Music בפול ווליום → משימות: 10 שכיבות סמיכה (CV מקומי),
ריקוד (CV מקומי), הקלדת משפט מאנגלית ממאגר.

**Phase 2 — "הבוקר המלא"**: צילום ארוחת בוקר → לוג נוטריינטים; חיבור יומן →
אגנדת היום אחרי סיום המשימה.

**Phase 3 — "הרגלי שינה"**: שעת שינה מומלצת, תזכורת ערב, סטטיסטיקות קימה,
streaks — הבסיס שכבר קיים באפליקציה תומך בזה.

---

## מקורות מלאים

- [Indie Hackers — Alarmy: The $11M Alarm Clock App](https://www.indiehackers.com/post/alarmy-the-11-million-alarm-clock-app-c74024c017)
- [Alarmy on App Store](https://apps.apple.com/us/app/alarmy-loud-alarm-clock/id1163786766) · [SensorTower profile](https://app.sensortower.com/overview/1163786766?country=US) · [Similarweb](https://www.similarweb.com/app/google-play/droom.sleepIfUCan/statistics/) · [Adapty paywall](https://adapty.io/paywall-library/alarmy/)
- [Pushy](https://pushupsalarm.com/) · [IronWake](https://apps.apple.com/us/app/fitness-alarm-clock-ironwake/id6756242951) · [PushClock](https://apps.apple.com/us/app/pushclock-loud-alarm-clock/id6760209491) · [Upzy](https://apps.apple.com/us/app/upzy-wake-up-smarter/id6761421752)
- [Global Growth Insights — Sleep Monitoring Apps Market](https://www.globalgrowthinsights.com/market-reports/sleep-monitoring-apps-market-101086) · [Business Research Insights](https://www.businessresearchinsights.com/market-reports/sleep-apps-and-sleep-tracking-apps-market-125301) · [Verified Market Reports](https://www.verifiedmarketreports.com/product/sleep-tracking-apps-market/) · [Coherent Market Insights](https://www.coherentmarketinsights.com/industry-reports/global-sleep-app-market)
- [Sleep Cycle Q2 2025 (Investing.com)](https://www.investing.com/news/company-news/sleep-cycle-q2-2025-slides-revenue-dips-while-margins-hold-strong-93CH-4206123) · [Sleep Cycle IR](https://investors.sleepcycle.com/)
- [TechCrunch — Cal AI 1M+ downloads](https://techcrunch.com/2025/03/16/photo-calorie-app-cal-ai-downloaded-over-a-million-times-was-built-by-two-teenagers/) · [TechCrunch — MyFitnessPal acquires Cal AI](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/) · [CNBC](https://www.cnbc.com/2025/09/06/cal-ai-how-a-teenage-ceo-built-a-fast-growing-calorie-tracking-app.html) · [eesel — דיוק ותמחור](https://www.eesel.ai/blog/cal-ai-pricing)
- [Spotify Newsroom — Google Clock](https://newsroom.spotify.com/2018-07-31/wake-up-to-the-perfect-soundtrack-with-spotify-and-clock-app-from-google/) · [סקירת אפליקציות Spotify alarm](https://www.audkit.com/spotify-music/top-spotify-alarm-clock.html)
- [Gemini Daily Brief](https://www.mindstudio.ai/blog/google-gemini-daily-brief-ai-morning-digest) · [Routine.co](https://routine.co/) · [Sleep Foundation — Best Sleep Apps](https://www.sleepfoundation.org/best-sleep-apps)
- טכנולוגיית CV: [VisionCamera Pose Detection (Marc Rousavy)](https://mrousavy.com/blog/VisionCamera-Pose-Detection-TFLite) · [react-native-mediapipe](https://cdiddy77.github.io/react-native-mediapipe/docs/api_pages/pose-landmark-detection/) · [Offline Rep-Counter with On-Device AI](https://techifysolutions.com/blog/offline-rep-counter-on-device-ai/) · [MediaPipe fitness app tutorial](https://dev.to/yoshan0921/fitness-app-development-with-real-time-posture-detection-using-mediapipe-38do)
