# NovusMesh Web Dashboard - İstifadəçi Təlimatı

## Giriş
Web Dashboard, NovusMesh VPN şəbəkəniz üçün vizual idarəetmə mərkəzidir. O, istənilən brauzerdən cihazlar əlavə etməyə, əlaqələri izləməyə və şəbəkənizi idarə etməyə imkan verir.

## Başlamaq

### Giriş
Defolt olaraq panel bu ünvanda əlçatandır:
- **URL:** `http://SERVER_IP_UNVANI` (və ya domen)
- **Giriş:** Quraşdırma zamanı yaradılan məlumatlardan (Login/Parol) istifadə edin.

## Xüsusiyyətlər

### 📊 Dashboard (İdarə Paneli)
- **İcmal:** Aktiv, gözləmədə olan (pending) və oflayn qovşaqları (nodes) göstərir.
- **Statistika:** Ümumi qoşulmuş cihazların nisbətini göstərir.
- **Son Aktivlik:** Ən son qoşulan və ya əlavə edilən cihazların siyahısı.

### 🖥️ Nodes (Qovşaqlar) İdarəçiliyi
Bura VPN-ə qoşulmuş cihazlarınızı idarə etdiyiniz yerdir.

#### Cihaz (Peer) Əlavə Etmək
1. **Nodes** bölməsinə keçin.
2. **+ Create Peer** düyməsinə klikləyin.
3. **Peer Name:** Cihazınıza başa düşülən bir ad verin (məsələn, "Əlinin Notebooku").
4. **Expiration (Bitmə vaxtı):** Cihazın giriş müddətini seçin:
   - **Forever (Daimi):** Vaxt limiti yoxdur.
   - **1h / 1d / 1w:** Müvəqqəti giriş (qonaqlar üçün idealdır).
   - **Custom:** Girişin dayanacağı dəqiq tarixi seçin.
5. **Create & Download Config** düyməsinə basın.
6. **QR Kod / Konfiqurasiya:** Açılan pəncərədə:
   - **Mobil:** QR kodu WireGuard tətbiqi ilə oxudun.
   - **Kompüter:** `.conf` faylını yükləyin və WireGuard proqramına daxil edin.

#### Cihazı Redaktə Etmək
- İstənilən qovşağın yanındakı **Redaktə** (qələm) ikonuna klikləyin.
- **Name:** Cihazın adını dəyişin.
- **Status:** Cihazı əl ilə **Söndürə (Disabled)** və ya **Aktivləşdirə (Active)** bilərsiniz (girişi dərhal dayandırır).
- **Expiration:** Vaxtı uzadın və ya limiti ləğv edin.
- **Device Info:** Daha yaxşı izləmə üçün ƏS (OS), Arxitektura və Hostname məlumatlarını yeniləyin.

#### Cihazı Silmək
- Cihazı tamamilə silmək və girişini ləğv etmək üçün **Zibil qutusu** (Delete) ikonuna klikləyin.

### ⚙️ Settings (İstifadəçi Tənzimləmələri)
Bu bölmə idarə panelinə giriş hüquqlarını idarə etmək üçündür.

#### Şifrəni Dəyişmək (Change Password)
- **Current Password:** Hazırkı şifrənizi daxil edin.
- **New Password:** Yeni təhlükəsiz şifrə təyin edin.

#### İstifadəçi İdarəçiliyi (User Management)
- **Add User:** Komandanız üçün yeni admin hesabları yaradın.
- **Delete User:** İstənməyən istifadəçiləri silin (Qeyd: Əsas `admin` istifadəçisi silinə bilməz).

## Təhlükəsizlik
- **Çıxış:** İşiniz bitdikdən sonra həmişə sol menyunun aşağısındakı **Log Out** düyməsindən istifadə edərək çıxış edin.
- **HTTPS:** İstehsalat (production) mühitində bu paneli Nginx kimi bir tərs proksi (reverse proxy) arxasında və SSL sertifikatı ilə işlətməyiniz şiddətlə tövsiyə olunur.

## Dəstək
[Ali Zeynalli](https://github.com/Ali7Zeynalli) tərəfindən hazırlanıb.
