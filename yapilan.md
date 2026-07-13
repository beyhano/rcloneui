# Yapılanlar

## 1. librclone Entegrasyonu (Go Backend)

- `github.com/rclone/rclone` eklendi, `librclone` ile rclone embed edildi
- `app.go`'da:
  - `startup()` → `librclone.Initialize()`
  - `shutdown()` → `librclone.Finalize()`
  - `RpcCall(method, request)` — herhangi bir RC metodunu JSON ile çağırır
  - `ListRemotes()` — yapılandırılmış remote'ları döndürür
- `backend/all` yerine ~50 backend elle import edildi (sharefile Go 1.25'te hata veriyor)
- `main.go`'ya `OnShutdown` eklendi

## 2. Frontend Sıfırlama

- Wails template (Greet + logo) kaldırıldı
- `App.tsx` remote listesini gösteren basit bir ekran oldu
- `style.css` sadeleştirildi

## 3. Tailwind CSS v4 + shadcn/ui

- `tailwindcss`, `@tailwindcss/vite`, `@types/node` eklendi
- `vite.config.ts` → `@tailwindcss/vite` plugin + `@/` path alias
- `tsconfig.json` → `baseUrl` + `paths` alias
- `style.css` → `@import "tailwindcss"`, shadcn tema değişkenleri, dark mode
- shadcn init (`new-york` stil, `neutral` tema)
- `Button` componenti `@/components/ui/button` olarak hazır
- shadcn `Button` kullanıldı

## 4. Sistem Tepsisi (Cross-Platform)

### Linux
- **Dosyalar:** `tray_linux.go` + `tray_linux.c`
- Direkt CGo ile `libayatana-appindicator3-0.1` kullanıldı
- Wails'in GTK main thread'inde çalışır (çakışma yok)
- İkon: `build/trayicon.png` (24x24, 238 bytes) temp'e yazılıp `app_indicator_set_icon_full()` ile gösterilir
- Menü: "Pencereyi Aç" → `runtime.WindowShow` + `WindowUnminimise`, "Çıkış" → `os.Exit(0)`
- `//export goTrayClick` ile C → Go callback

### Windows / macOS
- **Dosya:** `tray_other.go` (build tag: `!linux`)
- `github.com/getlantern/systray` kullanır
- Aynı menü yapısı

### Ortak
- `tray.go` → `trayIcon` embed (`build/trayicon.png`), `openWindow()`, `quitApp()`, `startTray()`
- Deprecation warning'ler `-Wno-deprecated-declarations` ile susturuldu

## 5. Tema (Dark/Light Mode)

- `src/lib/use-theme.ts` — localStorage'a kaydeder, `.dark` class'ını toggle eder
- `App.tsx` — sağ üstte `Sun`/`Moon` butonu (lucide-react)
- Varsayılan: dark mode
- shadcn CSS değişkenleri zaten hazırdı (`.dark` class + `@custom-variant dark`)

## 6. Build & Yardımcılar

- `dev.sh` — `wails dev -tags webkit2_41` wrapper'ı
- `pnpm install` hatası → `pnpm clean --lockfile && pnpm install`

## Kullanılan Bağımlılıklar

**Go:**
- `github.com/wailsapp/wails/v2 v2.13.0`
- `github.com/rclone/rclone v1.74.4`
- `github.com/getlantern/systray v1.2.2` (Windows/macOS)

**Frontend:**
- `react`, `react-dom` (v19)
- `typescript`, `vite` (v7)
- `tailwindcss` (v4), `@tailwindcss/vite`
- `shadcn/ui` (new-york, neutral)
- `lucide-react`
- `@vitejs/plugin-react`

## 7. SweetAlert2

- `pnpm add sweetalert2` ile eklendi
- `src/lib/swal.ts` — kullanımı kolay wrapper:
  - `confirm(title, text?)` — Evet/İptal dialog'u, `true`/`false` döndürür
  - `toastSuccess(message)` — 3sn üst köşe bildirimi
  - `toastError(message)` — 5sn üst köşe hata bildirimi
  - `alertError(title, text?)` — Hata dialog'u
  - `prompt(title, inputLabel, inputPlaceholder?)` — Metin giriş dialog'u
- Dark/light mode'u otomatik algılar (`.dark` class'ına göre arka plan/rengi ayarlar)

## 8. SQLite Veritabanı

- `modernc.org/sqlite` (pure Go, CGo yok) ile eklendi
- `db.go` — `initDB()`, `closeDB()`, `~/.cache/rcloneui/rcloneui.db` konumunda
- Tablo: `scheduled_tasks` (id, name, enabled, source, dest, mode, cron_expr)
- Wails binding'leri:
  - `ListScheduledTasks()` → `ScheduledTask[]`
  - `SaveScheduledTask(task)` → `id`
  - `DeleteScheduledTask(id)`
- `app.go` — startup'ta `initDB()`, shutdown'da `closeDB()`

## 9. Sağlayıcı Wizard'ı (Frontend)

- `src/pages/Wizard.tsx` — 3 adımlı wizard dialog
  - **Adım 1:** Sağlayıcı seç (arama + kart listesi, `config/providers` API'si)
  - **Adım 2:** Parametreleri doldur (string/bool/CommaSepList/password türlerine göre dinamik form, required/advanced ayrımı)
  - **Adım 3:** Remote adı girip `config/create` ile kaydet
- shadcn component'leri: Dialog, Card, Input, Select, Label, ScrollArea

## 10. Sistem Tepsisi Düzeltmeleri

- **Çıkış çalışıyor**, "Pencereyi Aç" düzeltildi: `gtk_window_present` ile pencere öne getiriliyor
- X basınca kapanma sorunu çözüldü: `OnBeforeClose` → `runtime.WindowHide` + `return true`
- `libayatana-appindicator` runtime warning'i `g_log_set_handler` ile susturuldu

## Notlar

- **Sharefile backend** Go 1.25'te `tzdata` hatası verir, `backend/all` import edilemez
- **libayatana runtime warning** (`deprecated`) önemsiz, `libayatana-appindicator-glib` sistemde yok
- **Tek binary** (~86MB) — rclone backends + Wails runtime + frontend hepsi içinde
