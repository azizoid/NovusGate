# NovusMesh Server - Developer Guide (Azərbaycan)

## İcmal (Overview)
**NovusMesh Server**, WireGuard mesh şəbəkəsinin əsasını təşkil edən komponentdir. O, "peer"-lərin koordinasiyasını, konfiqurasiya paylanmasını, açarların idarə edilməsini və idarə paneli üçün API çıxışını təmin edir. **Go** dilində yazılmışdır və yüksək performanslı, bulud-yönümlü (cloud-native) olması üçün nəzərdə tutulmuşdur.

## Memarlıq (Architecture)

### Texnologiyalar
- **Dil:** Go 1.21+
- **Verilənlər Bazası:** SQLite (CGO vasitəsilə daxili) və ya PostgreSQL
- **VPN Protokolu:** WireGuard (`wg-quick` və kernel modulları vasitəsilə)
- **API:** HTTP üzərindən REST/JSON
- **Təhlükəsizlik:** API sorğuları üçün JWT (JSON Web Tokens)

### Fayl Strukturu
```
server/
├── cmd/
│   └── novusmesh-server/  # Əsas giriş nöqtəsi (main.go)
├── internal/
│   ├── controlplane/      # Biznes məntiqi & Bazası təbəqəsi
│   │   ├── api/           # REST API handler-ləri
│   │   ├── db/            # Baza saxlama implementasiyaları
│   │   └── config/        # Ətraf mühit dəyişənlərinin oxunması
│   ├── wireguard/         # WireGuard interfeysinin idarə edilməsi
│   └── shared/            # Ümumi köməkçi funksiyalar
├── deployments/           # Docker və systemd konfiqurasiyaları
└── Makefile               # Quraşdırma skriptləri
```

## Əsas Modullar

### 1. Control Plane (İdarəetmə Müstəvisi)
`internal/controlplane` daxilində yerləşir və sistemin "beyni" rolunu oynayır.
- **Peers:** Mesh qovşaqlarının həyat dövrünü idarə edir (Yaratmaq, Silmək, IP yeniləmək).
- **IPAM:** WireGuard interfeysi üçün IP ünvanlarının paylanmasını həll edir (məsələn, `10.10.0.x`).
- **Config Distribution:** Müştərilər üçün etibarlı WireGuard konfiqurasiyalarını yaradır və servis edir.

### 2. WireGuard Manager
`internal/wireguard` daxilində yerləşir.
- **İnterfeys İdarəçiliyi:** `wg0` interfeysini yaradır və konfiqurasiya edir.
- **Key Generation:** Serverin özü üçün Şəxsi/İctimai (Private/Public) açarları yaradır.
- **Peer Sync:** Verilənlər bazasındakı vəziyyəti real kernel WireGuard interfeysi ilə sinxronlaşdırır.

### 3. API Layer
Veb İdarə Paneli və Installer üçün giriş nöqtələrini (endpoints) təmin edir.
- `GET /api/v1/nodes`: Aktiv peer-ləri siyahıya almaq.
- `POST /api/v1/nodes`: Yeni peer daxil etmək (enroll).
- `GET /api/v1/config`: Serverin öz ictimai konfiqurasiyasını əldə etmək.

## İnkişaf Mühitinin Qurulması (Development Setup)

### Tələblər
- Go 1.21+ quraşdırılmalıdır.
- GCC (SQLite CGO üçün lazımdır).
- Host sistemdə WireGuard alətləri (`wg`, `wg-quick`).

### Yerli İşə Salın
1. **Daxil olun:**
   ```bash
   cd server
   ```

2. **Mühiti qurun:**
   `.env` faylı yaradın və ya dəyişənləri ixrac edin:
   ```bash
   export DB_PASSWORD="change_me"
   export JWT_SECRET="dev_secret_123"
   export API_KEY="dev_api_key"
   ```

3. **İşə salın:**
   ```bash
   go run ./cmd/novusmesh-server serve
   ```

### Build (Quraşdırma)
Makefile istifadə edərək asanlıqla build edə bilərsiniz:
```bash
make build       # bin/novusmesh-server faylını yaradır
make docker      # Docker imicini yaradır
```
