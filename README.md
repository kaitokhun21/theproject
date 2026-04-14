# OSPAN — Çalışma Belleği Testi

## Kurulum Adımları

### 1. Supabase Kurulumu (ücretsiz, 5 dakika)

1. **supabase.com** → "Start your project" → ücretsiz hesap aç
2. "New project" → isim ver (örn: ospan-game) → şifre belirle → "Create new project"
3. Sol menüden **"Table Editor"** → "New table"
4. Tablo adı: `scores`
5. Şu kolonları ekle:
   - `id` → int8, primary key (otomatik gelir)
   - `username` → text
   - `score` → int8
   - `level` → text
   - `created_at` → timestamptz (otomatik gelir)
6. "Save" tıkla
7. Sol menüden **"Project Settings"** → **"API"**
8. **Project URL** ve **anon public key**'i kopyala

### 2. Kodu Güncelle

`src/App.jsx` dosyasını aç, en üstteki şu iki satırı bul:

```
const SUPABASE_URL = "https://PROJE_ID.supabase.co";
const SUPABASE_KEY = "ANON_KEY_BURAYA";
```

Kendi bilgilerinle değiştir.

### 3. Row Level Security (RLS) Ayarı

Supabase'de **"Authentication"** → **"Policies"** → `scores` tablosu için:
- "Enable RLS" → açık olsun
- "New Policy" → "Allow anonymous inserts" → INSERT için `true` politikası ekle
- "New Policy" → "Allow anonymous reads" → SELECT için `true` politikası ekle

### 4. GitHub'a Yükle

1. github.com → "New repository" → `ospan-game` → "Create"
2. "uploading an existing file" → bu klasörün içindeki TÜM dosyaları sürükle bırak
3. "Commit changes"

### 5. Netlify'a Deploy Et

1. netlify.com → "Sign up with GitHub"
2. "Add new site" → "Import from Git" → `ospan-game` repo'sunu seç
3. Build command: `npm run build`
4. Publish directory: `dist`
5. "Deploy site"

5 dakika sonra siteniz yayında!
