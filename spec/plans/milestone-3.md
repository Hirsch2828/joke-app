# תוכנית Milestone 3: התקנה בטלפון

## המטרה
מתקינים את האפליקציה במסך הבית, והיא נפתחת במסך מלא, בלי שורת כתובת.

## מצב התחלתי
- Milestone 1 ו-2 ✅. המשתמש אישר בטלפון שהבדיחות עובדות באתר החי.
- בדיקה 4 של Milestone 2 (שם מודל שגוי) לא בוצעה, בהחלטת המשתמש. הקוד מכיל את ההודעה, ונבדק מקומית.
- קיימים ב-`assets/`: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`. עוד לא קיימים: `manifest.webmanifest`, `sw.js`.

## קבצים
| קובץ | שינוי |
|---|---|
| `manifest.webmanifest` | חדש |
| `sw.js` | חדש, בשורש (כדי שיכסה את כל האתר) |
| `index.html` | הוספת קישור ל-manifest, `theme-color`, אייקון, ורישום ה-service worker |

## 1. manifest.webmanifest
- `name`: "בדיחה בלחיצה", `short_name`: קצר (למשל "בדיחה"), `start_url`: `/`, `scope`: `/`.
- `display: standalone`, `lang: he`, `dir: rtl`.
- `theme_color` ו-`background_color`: `#FFE15A`.
- `icons`: `assets/icon-192.png` (192x192), `assets/icon-512.png` (512x512), `assets/icon-512-maskable.png` (512x512, `purpose: maskable`).
- Vercel מגיש `.webmanifest` עם סוג תוכן מתאים. נבדק אחרי הפריסה.

## 2. sw.js (network-first, לפי ARCHITECTURE.md סעיף 7)
- `install`: שומר במטמון את `/`, ה-manifest, כל ה-SVG מתוך `assets/` (הלוגו, ארבע הדמויות, שני הרקעים), ושני האייקונים. שם מטמון עם גרסה. `skipWaiting()`.
- `activate`: מוחק מטמונים ישנים, `clients.claim()`.
- `fetch`:
  - בקשה שאינה GET, בקשה לכתובת אחרת (למשל Google Fonts), או בקשה ל-`/api`: לא נוגעים בה, והדפדפן מטפל בה רגיל. `/api` לעולם לא נכנס למטמון.
  - GET מאותה כתובת: קודם רשת, ושומר עותק במטמון. אין רשת: מחזיר מהמטמון.
- התשובה נשמרת רק אם היא תקינה (`response.ok`).

## 3. index.html
- ב-`<head>`: `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#FFE15A">`, `<link rel="icon" ...>` ו-`<link rel="apple-touch-icon" href="/assets/icon-192.png">` (ל-iPhone, שלא קורא תמיד את ה-manifest).
- בסוף הסקריפט: רישום `navigator.serviceWorker.register('/sw.js')` רק אם הדפדפן תומך, בלי לשבור את הדף אם נכשל.
- אין שינוי במראה או בהתנהגות.

## בדיקות עצמיות של Claude
- בדפדפן המובנה על שרת בדיקה זמני: ה-manifest נטען, בלי שגיאות, ושני האייקונים (ועוד ה-maskable) נטענים.
- ה-service worker נרשם. אחרי כמה טעינות: בדיקה ב-Cache Storage שיש קבצים ואין אף כתובת `/api`.
- לחיצה על הכפתור אחרי שה-service worker פעיל עדיין שולחת בקשה רגילה ל-`/api/joke` (בדיחה חדשה בכל פעם, לא מהמטמון).
- חיפוש בקוד: אין מפתח, אין `sk-`, ואין `/api` ברשימת הקבצים השמורים.
- הערה: ה-service worker דורש HTTPS או `localhost`, וזה מתקיים בשניהם.

## מה המשתמש עושה בידיים
1. אחרי ה-push (Vercel מתעדכן לבד, בלי Redeploy): במחשב, בכלי המפתחים (Chrome: F12) → Application → Manifest: אין שגיאות, ושני האייקונים מופיעים.
2. בטלפון: Android/Chrome: תפריט ← "התקנת אפליקציה". iPhone/Safari: כפתור השיתוף ← "הוסף למסך הבית".
3. פותחים מהאייקון: האפליקציה בלי שורת כתובת, והכפתור מביא בדיחה חדשה בכל לחיצה.
4. בכלי המפתחים → Application → Cache Storage: אין אף כתובת `/api`.
5. שינוי קטן בטקסט, push, ורענון: השינוי מופיע. Claude מנחה צעד אחר צעד כשמגיעים לשם.

## Definition of Done וכיצד נבדק
| # | תנאי | מי בודק |
|---|---|---|
| 1 | Manifest בלי שגיאות, שני האייקונים מופיעים | Claude מקומית, ומשתמש בכתובת החיה |
| 2 | בטלפון: אפשר להתקין, ונפתח בלי שורת כתובת | משתמש |
| 3 | באפליקציה המותקנת: בדיחה חדשה בכל לחיצה | משתמש |
| 4 | ב-Cache Storage אין אף כתובת `/api` | Claude ומשתמש |
| 5 | שינוי קטן בטקסט, push, ורענון: השינוי מופיע | משתמש (Claude מכין שינוי קטן ובטוח לבדיקה, רק כשהמשתמש מבקש) |

## סיכונים
- **מטמון ישן:** כל גרסה עתידית של `sw.js` צריכה לשנות את שם המטמון. עם network-first זה פחות קריטי, אבל מוסיפים גרסה בשם.
- **iPhone:** התקנה מ-Safari בלבד, ובלי הצעה אוטומטית. זה תקין, ולכן יש `apple-touch-icon`.
- **גופנים מ-Google:** לא נשמרים (כתובת אחרת), ולכן בלי רשת הדף ייפתח בגופן הגיבוי. לפי ההחלטה ב-ARCHITECTURE.md.
- commit ו-push רק כשהמשתמש מבקש.
