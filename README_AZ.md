# NovusMesh

**NovusMesh**, WireGuard® protokolu üzərində qurulmuş, müasir, təhlükəsiz və özünü idarə edən (self-hosted) bir VPN həllidir. 

**Sistem Adminləri, Proqramçılar, DevOps mühəndisləri və sadə istifadəçilər** üçün nəzərdə tutulub. Layihənin əsas məqsədi, özəl mesh şəbəkənizi quraraq **cihazlarınızı istənilən yerdə və istənilən vaxt rahatlıqla idarə etməyə** imkan yaratmaqdır. İstər serverlərinizi, istərsə də şəxsi cihazlarınızı birləşdirin — NovusMesh bunu sadələşdirir.

![NovusMesh İdarə Paneli](web/public/novusmesh_banner.png) 


## 🚀 Əsas Xüsusiyyətlər

- **Hub-and-Spoke Mesh:** Mərkəzləşdirilmiş idarəetmə ilə birbaşa peer-to-peer (cihazdan-cihaza) imkanları.
- **Müasir Web Dashboard:** Qovşaqları (nodes) idarə etmək və şəbəkə trafikini vizuallaşdırmaq üçün React əsaslı gözəl istifadəçi interfeysi.
- **Bir Kliklə Quraşdırıcı:** Xüsusi quraşdırıcı aləti (Installer) vasitəsilə asan yerləşdirmə və yeniləmə.
- **Ağıllı Yeniləmələr:** Məlumatları və ya konfiqurasiyaları itirmədən sisteminizi yeniləyin.
- **Defolt Olaraq Təhlükəsiz:** Daxili kommunikasiya üçün JWT və API açarları ilə yanaşı, WireGuard-ın ən müasir kriptoqrafiyasından istifadə edir.
- **Lokalizasiya:** İngilis dili (standart) və Azərbaycan dili dəstəyi.

## 📂 Sistem Memarlığı

Layihə üç əsas komponentə bölünür:

### 1. [Server (Backend)](./server)
**Go** dilində yazılmış əsas məntiq. WireGuard interfeysini, verilənlər bazasını (SQLite) idarə edir və REST API təqdim edir.
- **Sənədlər:** [Developer Guide (AZ)](./server/DEVELOPER_GUIDE_AZ.md) | [User Guide (AZ)](./server/USER_GUIDE_AZ.md)

### 2. [Web (Frontend)](./web)
**React**, **TypeScript** və **Tailwind CSS** ilə yazılmış inzibatçı interfeysi.
- **Sənədlər:** [Developer Guide (AZ)](./web/DEVELOPER_GUIDE_AZ.md) | [User Guide (AZ)](./web/USER_GUIDE_AZ.md)

### 3. [Installer (Quraşdırıcı)](./installer)
Linux serverlərində SSH vasitəsilə yerləşdirməni sadələşdirmək üçün müstəqil Node.js aləti.
- **Sənədlər:** [Developer Guide (AZ)](./installer/DEVELOPER_GUIDE_AZ.md) | [User Guide (AZ)](./installer/USER_GUIDE_AZ.md)

> 🇺🇸 **English Documentation:**
> Refer to [README.md](./README.md) for the English version.

## ⚡ Tez Başlanğıc

### Tələblər
- Linux server (Ubuntu 20.04/22.04 tövsiyə olunur).
- Yerli kompüterinizdə Docker və Docker Compose quraşdırılmalıdır (quraşdırıcı üçün).

### Installer Vasitəsilə Quraşdırma
1. Installer qovluğuna keçin:
   ```bash
   cd installer
   ```
2. Quraşdırıcı interfeysini işə salın:
   ```bash
   docker-compose up -d --build
   ```
3. Brauzerinizdə `http://localhost:3000` ünvanını açın.
4. Uzaq server məlumatlarınızı daxil edin və **Install NovusMesh Server** düyməsini sıxın.

### Əl ilə Quraşdırma (Manual)
Əl ilə Docker yerləşdirmə təlimatları üçün [Server İstifadəçi Təlimatına](./server/USER_GUIDE_AZ.md) baxın.

## 🛡️ Təhlükəsizlik

- **Giriş Məlumatları:** Quraşdırıcı, quraşdırma zamanı unikal şifrələr və açarlar yaradır. **Onları dərhal yadda saxlayın.**
- **Portlar:** Serverinizin firewall-unda UDP `51820` portunun açıq olduğundan əmin olun.
- **HTTPS:** İstehsalat (production) mühitində istifadə üçün Web Dashboard-u SSL ilə tərs proksi (Nginx/Caddy) arxasında işlətməyinizi şiddətlə tövsiyə edirik.

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

## 🤝 Töhfə Vermək (Contributing)
Töhfələrinizi gözləyirik! Memarlıq detalları və kod standartları üçün [Developer Təlimatlarına](./server/DEVELOPER_GUIDE_AZ.md) baxın.

---

**[Ali Zeynalli](https://github.com/Ali7Zeynalli) tərəfindən hazırlanıb**
*Project NovusMesh*
