# NovusMesh Web Dashboard - Developer Guide (Azərbaycan)

## İcmal (Overview)
**NovusMesh Web Dashboard**, WireGuard mesh şəbəkənizi idarə etmək üçün müasir, responsiv istifadəçi interfeysidir. O, şəbəkə topologiyasını vizuallaşdırmaq, peer-ləri (qovşaqları) idarə etmək və şəbəkə parametrlərini konfiqurasiya etmək üçün NovusMesh Serveri ilə REST API vasitəsilə əlaqə saxlayır.

## Memarlıq (Architecture)

### Texnologiyalar
- **Framework:** React 18
- **Dil:** TypeScript
- **Quraşdırma Aləti:** Vite
- **Stil:** Tailwind CSS (Qaranlıq rejim dəstəyi ilə)
- **İkonlar:** Lucide React
- **Vəziyyət İdarəçiliyi:** TanStack Query (React Query)
- **Marşrutlaşdırma:** React Router v6

### Fayl Strukturu
```
web/
├── src/
│   ├── api/           # API müştərisi və tiplər
│   ├── components/    # Təkrar istifadə edilə bilən UI komponentləri (Modallar, Formalar)
│   ├── pages/         # Səhifə görüntüləri (Dashboard, Nodes, Settings)
│   ├── store/         # Qlobal müştəri vəziyyəti (Zustand və ya Context)
│   ├── App.tsx        # Əsas tətbiq girişi və Marşrutlaşdırma
│   └── main.tsx       # React DOM renderi
├── public/            # Statik aktivlər
└── index.html         # HTML giriş nöqtəsi
```

## Əsas Xüsusiyyətlər

### 1. Dashboard (`src/pages/Dashboard.tsx`)
`StatCard` komponentləri vasitəsilə yüksək səviyyəli icmal təqdim edir.
- Onlayn/Ümumi qovşaq sayını göstərir.
- Son aktiv qovşaqların siyahısını göstərir.

### 2. Qovşaq İdarəçiliyi (`src/pages/Nodes.tsx`)
- **Siyahı:** Status, IP-lər, Transfer sürətləri və Bitmə vaxtını göstərir.
- **Yaradılma:** `CreateNodeModal` yeni peer yaradılmasını idarə edir.
  - Girişlər: Ad (Name) və Bitmə vaxtı (Expiration).
  - Rol (Role): API sorğusunda 'client' olaraq sərt kodlanıb (UI-da gizlidir).
- **Redaktə:** `EditNodeModal` aşağıdakıları dəyişməyə imkan verir:
  - Ad
  - Status (Aktiv/Söndürülüb)
  - Bitmə vaxtının uzadılması
  - Metadata (ƏS, Arxitektura, Hostname)

### 3. Tənzimləmələr (`src/pages/Settings.tsx`)
Tamamilə hesab və istifadəçi idarəçiliyinə fokuslanıb.
- **Change Password:** Daxil olmuş istifadəçinin şifrəsini dəyişir.
- **User Management:** Adminlər üçün yeni istifadəçi yaratmaq (`UserPlus`) və ya silmək (`Trash2`) imkanı.
- **Qeyd:** Server səviyyəsindəki konfiqurasiyalar (portlar, açarlar) bura daxil deyil, onlar birbaşa Backend API və ya `.env` faylları ilə idarə olunur.

## İnkişaf Mühitinin Qurulması (Development Setup)

### Tələblər
- Node.js 18+ quraşdırılmalıdır.

### Yerli İşə Salın
1. **Asılılıqları Quraşdırın:**
   ```bash
   cd web
   npm install
   ```

2. **Məlumat Girişini Konfiqurasiya Edin:**
   Yerli API serverinizi göstərmək üçün `.env` faylı yaradın:
   ```bash
   VITE_API_URL=http://localhost:8080
   ```

3. **Dev Serveri Başladın:**
   ```bash
   npm run dev
   ```
   Giriş: `http://localhost:5173`.

### İstehsalat üçün Quraşdırma (Production Build)
Build əmri `dist/` qovluğunda statik fayllar yaradır, hansı ki, sonra Nginx və ya birbaşa Go binary tərəfindən servis edilir.
```bash
npm run build
```

## Stil Qaydaları
- Bütün stillər üçün **Tailwind CSS** klasslarından istifadə edin.
- **Qaranlıq Rejim** (Dark Mode) uyğunluğunu qoruyun (`dark:` prefiksi ilə).
- Responsivliyi təmin edin (`sm:`, `md:`, `lg:` ölçüləri).
- Əsas hərəkətlər üçün **NovusMesh Mavisi** (`bg-blue-600`) istifadə edin.

## Töhfə vermək
- **Komponentlər:** Komponentləri kiçik və məqsədyönlü saxlayın.
- **Tiplər:** Bütün `prop`-lar və API cavabları üçün ciddi TypeScript interfeysləri istifadə edin.
- **Brendinq:** "NovusMesh" adının və "Ali Zeynalli tərəfindən hazırlanıb" imzasının görünən yerdə olmasına əmin olun.
