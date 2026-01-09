# NovusMesh Installer - Developer Guide (Azərbaycan)

## İcmal (Overview)
**NovusMesh Installer**, uzaq Linux maşınlarında NovusMesh Serverinin yerləşdirilməsini, yenilənməsini və saxlanılmasını sadələşdirmək üçün hazırlanmış yüngül və avtonom idarəetmə alətidir. Bu alət yerli olaraq (adətən Docker vasitəsilə) işləyir və əməliyyatları yerinə yetirmək üçün serverlərinizə qoşulan bir "idarəetmə mərkəzi" rolunu oynayır.

## Memarlıq (Architecture)

### Texnologiyalar
- **Backend:** Node.js (Express.js)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Əlaqə:** SSH (`ssh2` kitabxanası vasitəsilə)
- **Yerləşdirmə:** Docker & Docker Compose

### Fayl Strukturu
```
installer/
├── server.js              # Əsas backend məntiqi və API
├── public/
│   └── index.html         # Tək səhifəli frontend tətbiqi
├── Dockerfile             # Konteyner tərifi
├── docker-compose.yml     # Orkestrasiya konfiqurasiyası
└── data/                  # Yadda saxlanılan məlumatlar (server siyahısı)
```

## Əsas Komponentlər

### 1. Backend (`server.js`)
Backend, serverləri idarə etmək və əməliyyatları yerinə yetirmək üçün REST API təqdim edir.
- **`GET /api/servers`**: Bütün yadda saxlanılan serverləri sadalayır.
- **`POST /api/servers`**: Yeni server məlumatlarını əlavə edir.
- **`GET /api/servers/:id/status`**: Serverin sağlamlığını, Docker statusunu və sistem resurslarını yoxlayır.
- **`POST /api/servers/:id/install`**: SSH vasitəsilə quraşdırma/yeniləmə skriptlərini icra edir.
- **`GET /api/servers/:id/docker`**: Docker konteynerlərinin siyahısını əldə edir.

**Əsas Xüsusiyyətlər:**
- **Daxil edilmiş Shell Skriptləri:** Bütün quraşdırma məntiqi (Quraşdırma, Yeniləmə, Yenidən Quraşdırma, Silmə) `server.js` daxilində sabit mətnlər (`INSTALL_SCRIPT_LOCAL`, `UPDATE_SCRIPT` və s.) kimi saxlanılır ki, etibarlı icra təmin edilsin.
- **SSH Yayımı (Streaming):** Installer, uzaq serverdən gələn `stdout`/`stderr` çıxışlarını real vaxt rejimində frontend-ə ötürür, beləliklə istifadəçi prosesi canlı izləyə bilir.
- **Məlumatların Oxunması:** Şifrəli çıxışlardan (məsələn, yaradılmış parollar) həssas məlumatları avtomatik oxuyur və istifadəçi interfeysində təqdim edir.

### 2. Frontend (`public/index.html`)
Backend ilə əlaqə quran tək fayllı tətbiq.
- **Build Addımı Yoxdur:** Standart veb texnologiyalarından istifadə edir (bu alət üçün React/Vue build prosesinə ehtiyac yoxdur).
- **Canlı Loglar:** Backend-dən gələn canlı logları göstərmək üçün Fetch API və `ReadableStream` istifadə edir.
- **Responsiv Dizayn:** Daha yaxşı istifadə üçün "sticky" (sabit) sidebar və responsiv tərtibat daxildir.

## İş Prosesləri (Workflows)

### Quraşdırma Prosesi
1. **Qoşulma:** Backend təqdim olunan məlumatlar əsasında SSH bağlantısı qurur.
2. **Transfer:** `novusmesh.tar.gz` faylını (əgər yerlidə varsa) yükləyir və ya skriptləri çəkir.
3. **İcra:** Uzaq maşında `INSTALL_SCRIPT_LOCAL` skriptini işə salır.
   - Docker və Docker Compose quraşdırır.
   - Təhlükəsizlik açarlarını (API Key, JWT Secret) yaradır.
   - NovusMesh xidmətlərini başladır.
4. **Hesabat:** Logları interfeysə ötürür və açarları çıxarır.

### Ağıllı Yeniləmə Prosesi (Smart Update)
1. **Qoruma:** Skript `.env` faylını və `data/` qovluğunu silinməkdən xüsusi olaraq qoruyur.
2. **Yeniləmə:** Binaries və konteyner şəkillərini yeniləyir.
3. **Miqrasiya:** Məlumat itkisi olmadan verilənlər bazası miqrasiyalarını avtomatik icra edir.

## İnkişaf Mühitinin Qurulması (Development Setup)

1. **Asılılıqları Quraşdırın:**
   ```bash
   cd installer
   npm install
   ```

2. **Yerli İşə Salın:**
   ```bash
   node server.js
   ```
   Giriş: `http://localhost:3000`

3. **Docker ilə İşə Salın:**
   ```bash
   docker-compose up -d --build
   ```

## Töhfə vermək
- **Tərcümə:** Bütün yeni mətnlərin İngilis dilində olduğundan əmin olun (kod bazası üçün).
- **Brendinq:** "NovusMesh" brendinqini və footer-dəki müəllif imzasını qoruyun.
- **Təhlükəsizlik:** Parolları və ya şəxsi açarları heç vaxt daimi konsola yazmayın.
