# NovusMesh Installer - İstifadəçi Təlimatı

## Giriş
NovusMesh idarəetmə interfeysinə xoş gəlmisiniz. Bu alət sizə sadə veb paneldən NovusMesh VPN serverlərinizi asanlıqla quraşdırmağa, idarə etməyə və izləməyə imkan verir.

## Başlamaq (Getting Started)

### Tələblər
- Uzaq Linux serveri (Ubuntu/Debian tövsiyə olunur).
- Həmin serverə Root çıxışı (IP ünvanı, istifadəçi adı və parol).
- Yerli kompüterinizdə işləyən NovusMesh Installer.

### İdarə Panelinə Giriş
1. Installer konteynerinin işlədiyindən əmin olun.
2. Veb brauzerinizi açın və daxil olun: `http://localhost:3000`

## İdarə Olunan Serverlər

### Server Əlavə Etmək
1. Sol menyuda (sidebar) **+ New Server** düyməsinə klikləyin.
2. **Name** (Ad) daxil edin (məsələn, "Production VPN").
3. Linux serverinizin **Host (IP)** ünvanını daxil edin.
4. **Username** (adətən `root`) və **Password** (Parol) daxil edin.
   - *Qeyd: Əgər serverinizdə SSH açarları qurulubsa, onlar da dəstəklənir, lakin parol standart üsuldur.*
5. **Add** düyməsinə klikləyin.

### Statusa Baxış
Serverin panelini görmək üçün sol menyuda istənilən serverin üzərinə klikləyin. Siz bunları görəcəksiniz:
- **Quraşdırma Statusu:** Avtomatik yoxlanılır.
- **Resurslar:** Boş Disk və RAM.
- **Docker Konteynerləri:** Həmin serverdə işləyən xidmətlərin siyahısı.

## Əməliyyatlar

### 📦 Install NovusMesh Server (NovusMesh Quraşdırılması)
Təmiz server qurmaq üçün bundan istifadə edin.
1. **Install NovusMesh Server** düyməsinə klikləyin.
2. Əgər soruşulsa, "Local" seçin (installer-in daxili paketindən istifadə edir).
3. Quraşdırma prosesini göstərən terminal pəncərəsi açılacaq.
4. **VACİB:** Sonda açılan pəncərədə göstərilən **Təhlükəsizlik Açarlarını** (Admin Parolu, API Key və s.) yadda saxlayın. Bunlar yalnız bir dəfə yaradılır!

### 🚀 Update (Smart) (Ağıllı Yeniləmə)
Mövcud serveri ən son versiyaya yeniləmək üçün istifadə edin.
- **Təhlükəsiz:** Verilənlər bazanızı, istifadəçilərinizi və konfiqurasiyanı (`.env`) qoruyur.
- **Avtomatik:** Konteynerlərin yenidən yaradılmasını və verilənlər bazası miqrasiyalarını həll edir.

### 🔄 Reinstall (Yenidən Quraşdırma)
**XƏBƏRDARLIQ:** Bu, sistem faylları üçün dağıdıcı əməliyyatdır, lakin məlumatları qorumağa çalışır.
- Yalnız server xarab olduqda istifadə edin.
- Konteynerləri dayandırır, sistem faylları təmizləyir və yenidən yerləşdirir.

### 🗑️ Uninstall (Silmək)
**TƏHLÜKƏLİ:** NovusMesh-i tamamilə silir, o cümlədən uzaq serverdən bütün məlumatları, istifadəçiləri və konfiqurasiyaları ləğv edir.

## Problemlərin Həlli (Troubleshooting)

### "Server not found" (Server tapılmadı)
- IP ünvanının düzgün olduğunu yoxlayın.
- Serverin işlək vəziyyətdə olduğunu və SSH vasitəsilə əlçatan olduğunu yoxlayın.

### "Authentication failed" (Autentifikasiya xətası)
- Root parolunu yoxlayın.
- Serverdə SSH root girişinin aktiv olduğunu yoxlayın (`/etc/ssh/sshd_config` faylında `PermitRootLogin yes` olmalıdır).

### Quraşdırma ilişib qalıb
- İnternet bağlantınızı yoxlayın.
- Xüsusi xəta mesajları üçün (məsələn, "apt-get failed") **Output Log** bölməsinə baxın.

## Dəstək
[Ali Zeynalli](https://github.com/Ali7Zeynalli) tərəfindən hazırlanıb.
Problemlər üçün zəhmət olmasa GitHub repozitoriyasına müraciət edin.
