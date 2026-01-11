# NovusMesh

🚀 **Öz şəxsi VPN şəbəkənizi qurun — SaaS asılılığı və ya ağrılı konfiqurasiyalar olmadan.**

**NovusMesh** — **WireGuard®** protokolu üzərində qurulmuş, müasir, tamamilə özünü idarə edən (self-hosted) **VPN idarəetmə panelidir**.
Bu sistem, tək bir veb paneldən idarə olunan təmiz **Hub-and-Spoke (Mərkəz və Budaq) arxitekturası** vasitəsilə serverləri, bulud instansiyalarını və şəxsi cihazları təhlükəsiz şəkildə birləşdirməyə imkan verir.

İstər istehsalat (production) infrastrukturunu idarə edin, istərsə də sadəcə şəxsi şəbəkənizə tam sahib olmaq istəyin — **NovusMesh sizə aydınlıq, təhlükəsizlik və nəzarət bəxş edir**.

![NovusMesh Dashboard](web/public/novusmesh_banner.png)

---

## ✨ Niyə NovusMesh?

Bu gün mövcud olan VPN həllərinin əksəriyyəti ya:
- ❌ "Qara qutu" kimi işləyən SaaS həlləridir
- ❌ Böyük miqyasda idarə edilməsi çətindir
- ❌ Kiçik komandalar üçün həddindən artıq mürəkkəbdir
- ❌ Ya da öz serverində qurmaq (self-host) çox ağrılıdır

**NovusMesh fərqli olmaq üçün yaradılıb.**

O, diqqəti bunlara yönəldir:
- **Rahatlıqdan öncə Sahiblik**
- **Mürəkkəblikdən öncə Sadəlik**
- **Mücərrədlikdən öncə Şəffaflıq**

Onu siz işlədirsiniz.
Siz idarə edirsiniz.
Sizin şəbəkəniz — sizin qaydalarınız.

---

## 🚀 Əsas Xüsusiyyətlər

- **Çoxlu Şəbəkə Arxitekturası**
  Hər birinin öz WireGuard interfeysi, subnet-i və portu olan çoxlu izolyasiya edilmiş VPN şəbəkələri yaradın.

- **Hub-and-Spoke Arxitekturası**
  Qovşaqlar arasında trafikin mərkəzi server vasitəsilə təhlükəsiz yönləndirilməsi.

- **Müasir Veb Dashboard**
  Şəbəkələri, qovşaqları idarə etmək, trafiki izləmək və VPN-ə nəzarət etmək üçün React əsaslı gözəl interfeys.

- **Bir Kliklə Quraşdırıcı**
  Xüsusi Docker əsaslı quraşdırıcı (installer) ilə NovusMesh-i asanlıqla yerləşdirin və yeniləyin.

- **Təhlükəsiz və Ağıllı Yeniləmələr**
  Konfiqurasiyanı və ya şəbəkə vəziyyətini itirmədən sisteminizi yeniləyin.

- **Defolt Olaraq Təhlükəsiz**
  WireGuard kriptoqrafiyası, JWT autentifikasiyası və daxili kommunikasiya üçün API açarları.

- **Çox Platformalı Client Dəstəyi**
  Mobil üçün QR kodlar, desktop üçün konfiq yükləmələri, Linux üçün bir sətirlik quraşdırma skriptləri.

---

## 👥 NovusMesh Kimlər Üçündür?

- **Sistem Adminləri** — serverlər və məlumat mərkəzləri arasında təhlükəsiz giriş təmin edənlər
- **DevOps Mühəndisləri** — infrastrukturu müxtəlif mühitlər (environments) arasında birləşdirənlər
- **Proqramçılar** — daxili və ya self-hosted platformalar quranlar
- **Məxfilik sevənlər** — öz VPN quruluşuna tam nəzarət etmək istəyənlər

Əgər **self-hosting, təhlükəsizlik və sadəliyə** dəyər verirsinizsə, NovusMesh sizin üçündür.

---

## 🧠 Necə İşləyir? (Qısa İzah)

1. **Mərkəzi server** idarəetmə paneli (control plane) rolunu oynayır.
2. Unikal subnet-lərlə (10.x.x.0/24) **izolyasiya edilmiş şəbəkələr** yaradın.
3. Cihazlar qeydiyyatdan keçir və təhlükəsiz şəkildə autentifikasiya olunur.
4. WireGuard tunelləri avtomatik olaraq qurulur.
5. Trafik mərkəzi server üzərindən təhlükəsiz şəkildə yönləndirilir.

Gizli sehir yoxdur.
Vendor asılılığı (lock-in) yoxdur.
Sadəcə təmiz şəbəkəçilik.

---

## 📂 Sistem Memarlığı

NovusMesh maksimum çeviklik və dayanıqlılıq üçün idarəetmə, interfeys və yerləşdirməni ayıran **modul sistem** kimi dizayn edilib.

```
+-------------------------------------------------------------+
|                     NovusMesh Server                        |
|  +-------------+  +-------------+  +-------------+          |
|  |  Şəbəkə 1   |  |  Şəbəkə 2   |  |  Şəbəkə N   |          |
|  |  wg0:51820  |  |  wg1:51821  |  |  wgN:518XX  |          |
|  | 10.10.0.0/24|  | 10.20.0.0/24|  | 10.XX.0.0/24|          |
|  +------+------+  +------+------+  +------+------+          |
|         |                |                |                 |
|  +------+----------------+----------------+------+          |
|  |              REST API (Go Backend)            |          |
|  |                   SQLite DB                   |          |
|  +-----------------------------------------------+          |
+-------------------------------------------------------------+
                            |
              +-------------+-------------+
              |             |             |
         +----+----+  +----+----+  +----+----+
         | Client  |  | Client  |  | Client  |
         | (Telefon)|  |(Notebook)|  | (Server)|
         +---------+  +---------+  +---------+
```

### 1. Server (Backend)
📁 `./server`

**Go** dilində yazılmış əsas məntiq.
WireGuard interfeyslərini, SQLite verilənlər bazasını idarə edir və REST API təqdim edir.

- **Developer Guide:** `./server/DEVELOPER_GUIDE_AZ.md`
- **User Guide:** `./server/USER_GUIDE_AZ.md`

---

### 2. Web Dashboard (Frontend)
📁 `./web`

**React**, **TypeScript** və **Tailwind CSS** ilə qurulmuş inzibatçı interfeysi.

- **Developer Guide:** `./web/DEVELOPER_GUIDE_AZ.md`
- **User Guide:** `./web/USER_GUIDE_AZ.md`

---

### 3. Installer (Quraşdırıcı)
📁 `./installer`

Linux serverlərində SSH vasitəsilə yerləşdirməni sadələşdirmək üçün müstəqil **Node.js** aləti.

- **Developer Guide:** `./installer/DEVELOPER_GUIDE_AZ.md`
- **User Guide:** `./installer/USER_GUIDE_AZ.md`

---

> 🇺🇸 **English Documentation**
> Refer to [README.md](./README.md) for the English version.

---

## ⚡ Tez Başlanğıc

### Tələblər

- Linux server (Ubuntu 20.04 / 22.04 tövsiyə olunur)
- Yerli kompüterdə Docker və Docker Compose (quraşdırıcı üçün)

---

### Installer Vasitəsilə Quraşdırma (Tövsiyə Olunan)

```bash
cd installer
docker-compose up -d --build
```

1. Brauzerdə `http://localhost:3017` ünvanını açın.
2. Uzaq server məlumatlarınızı daxil edin.
3. **Install NovusMesh Server** düyməsini sıxın.
4. Quraşdırma bitdikdən sonra Admin VPN-ə qoşulun və Web Dashboard-a daxil olun.

**Dashboard URL:** `https://10.99.0.1:3007` (VPN vasitəsilə)  
**Giriş:** `admin`  
**Şifrə:** Quraşdırma zamanı göstərilir.

---

### Əl ilə Quraşdırma (Manual)

Təcrübəli istifadəçilər üçün:
👉 **[Server İstifadəçi Təlimatı](./server/USER_GUIDE_AZ.md)**

---

## 🌐 Şəbəkə İdarəçiliyi

NovusMesh **çoxlu izolyasiya edilmiş şəbəkələri** dəstəkləyir:

| Xüsusiyyət | Təsvir |
|------------|--------|
| **İzolyasiya Edilmiş Subnet-lər** | Hər şəbəkənin öz CIDR-i var (məs., 10.10.0.0/24, 10.20.0.0/24) |
| **Xüsusi İnterfeyslər** | Avtomatik WireGuard interfeys təyinatı (wg0, wg1, wg2...) |
| **Unikal Portlar** | Hər şəbəkə fərqli UDP portunda dinləyir (51820, 51821...) |
| **Müstəqil Node-lar** | Node-lar müəyyən şəbəkələrə aiddir və digərlərindən izolyasiya edilib |

### Şəbəkə Yaratmaq

1. Dashboard-da **Networks** səhifəsinə keçin
2. **Create Network** düyməsinə klikləyin
3. Ad və CIDR aralığı daxil edin (məs., `10.50.0.0/24`)
4. Sistem avtomatik olaraq interfeys və port təyin edir

---

## 🛡️ Təhlükəsizlik Qeydləri

* Quraşdırıcı **unikal giriş məlumatları** yaradır — onları dərhal yadda saxlayın.
* UDP portlarının **51820+** açıq olduğundan əmin olun (hər şəbəkə üçün bir port).
* Admin dashboard defolt olaraq **VPN arxasında gizlidir**.
* İstehsalat (production) mühitində Web Dashboard-u **Nginx və ya Caddy (SSL ilə)** arxasında işlədin.

Təhlükəsizlik seçim deyil — bu, standartdır.

---

## 📸 Ekran Görüntüləri (Screenshots)

### Web Dashboard (İdarə Paneli)
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="web/public/photo/web/0.png" alt="Web 0" width="45%">
  <img src="web/public/photo/web/1.png" alt="Web 1" width="45%">
  <img src="web/public/photo/web/2.png" alt="Web 2" width="45%">
  <img src="web/public/photo/web/3.png" alt="Web 3" width="45%">
  <img src="web/public/photo/web/4.png" alt="Web 4" width="45%">
  <img src="web/public/photo/web/5.png" alt="Web 5" width="45%">
  <img src="web/public/photo/web/6.png" alt="Web 6" width="45%">
</div>

### Installer (Quraşdırıcı)
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="web/public/photo/installer/0.png" alt="Installer 0" width="45%">
  <img src="web/public/photo/installer/1.png" alt="Installer 1" width="45%">
</div>

---

## 🤝 Töhfə Vermək (Contributing)

Töhfələrinizi gözləyirik ❤️
Xəta hesabatları (Bug reports), yeni funksiya təklifləri və Pull Request-lər yüksək qiymətləndirilir.

Töhfə verməzdən əvvəl zəhmət olmasa **Developer Təlimatlarını** oxuyun.

---

## ⭐ Layihəyə Dəstək

Əgər **NovusMesh** sizin üçün faydalıdırsa:

* ⭐ Repozitoriyaya ulduz (Star) verin
* 🐛 Xətalar barədə məlumat verin (Issues)
* 💡 Yeni ideyalar təklif edin
* 📣 Başqaları ilə paylaşın

Açıq-qaynaq (Open-source) icma ilə yaşayır.

---

**[Ali Zeynalli](https://github.com/Ali7Zeynalli) tərəfindən hazırlanıb**
*Project NovusMesh*
