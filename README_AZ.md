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

- **Hub-and-Spoke Arxitekturası**
  Qovşaqlar arasında trafikin mərkəzi server vasitəsilə təhlükəsiz yönləndirilməsi.

- **Müasir Veb Dashboard**
  Qovşaqları idarə etmək, trafiki izləmək və şəbəkəyə nəzarət etmək üçün React əsaslı gözəl interfeys.

- **Bir Kliklə Quraşdırıcı**
  Xüsusi Docker əsaslı quraşdırıcı (installer) ilə NovusMesh-i asanlıqla yerləşdirin və yeniləyin.

- **Təhlükəsiz və Ağıllı Yeniləmələr**
  Konfiqurasiyanı və ya şəbəkə vəziyyətini itirmədən sisteminizi yeniləyin.

- **Defolt Olaraq Təhlükəsiz**
  WireGuard kriptoqrafiyası, JWT autentifikasiyası və daxili kommunikasiya üçün API açarları.


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
2. Cihazlar qeydiyyatdan keçir və təhlükəsiz şəkildə autentifikasiya olunur.
3. WireGuard tunelləri avtomatik olaraq qurulur.
4. Trafik mərkəzi server üzərindən təhlükəsiz şəkildə yönləndirilir.

Gizli sehir yoxdur.
Vendor asılılığı (lock-in) yoxdur.
Sadəcə təmiz şəbəkəçilik.

---

## 📂 Sistem Memarlığı

NovusMesh maksimum çeviklik və dayanıqlılıq üçün idarəetmə, interfeys və yerləşdirməni ayıran **modul sistem** kimi dizayn edilib.

### 1. Server (Backend)
📁 `./server`

**Go** dilində yazılmış əsas məntiq.
WireGuard interfeysini, verilənlər bazasını (SQLite) idarə edir və REST API təqdim edir.

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
4. Quraşdırma bitdikdən sonra Web Dashboard-u işə salın:

```bash
cd ../web
docker-compose up -d --build
```

5. Paneli `http://localhost:3007` ünvanında açın.

**Giriş:** `admin`
**Şifrə:** Quraşdırma zamanı göstərilir.

---

### Əl ilə Quraşdırma (Manual)

Təcrübəli istifadəçilər üçün:
👉 **[Server İstifadçi Təlimatı](./server/USER_GUIDE_AZ.md)**

---

## 🛡️ Təhlükəsizlik Qeydləri

* Quraşdırıcı **unikal giriş məlumatları** yaradır — onları dərhal yadda saxlayın.
* UDP port **51820**-nin açıq olduğundan əmin olun.
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
