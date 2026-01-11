# NovusMesh Web Dashboard - İstifadəçi Təlimatı

## Giriş

NovusMesh Web Dashboard, WireGuard VPN şəbəkəsini idarə etmək üçün vizual idarəetmə mərkəzinizdir. İstənilən brauzerdən cihazlar əlavə etməyə, əlaqələri izləməyə, konfiqurasiyaları yükləməyə və istifadəçi girişini idarə etməyə imkan verir.

## Başlamaq

### Dashboard-a Giriş

Quraşdırmadan sonra dashboard bu ünvanda əlçatandır:
- **URL:** `https://SERVER_IP_UNVANI:3007` (və ya konfiqurasiya edilmiş domeniniz)
- **Defolt Port:** 3007 (HTTPS)

### İlk Giriş

1. Brauzerdə dashboard URL-ni açın
2. Öz-imzalı sertifikat xəbərdarlığını qəbul edin (əgər varsa)
3. Məlumatlarınızı daxil edin:
   - **İstifadəçi adı:** `admin` (və ya konfiqurasiya edilmiş istifadəçi adı)
   - **Şifrə:** Quraşdırma zamanı yaradılıb (quraşdırma loglarını yoxlayın)
4. **Login** düyməsinə klikləyin

## Dashboard İcmalı

```
+-------------------------------------------------------------+
|  NovusMesh                            [Qaranliq Rejim] [👤] |
+-------------+-----------------------------------------------+
|             |                                               |
|  Dashboard  |   NovusMesh-e Xos Gelmisiniz                  |
|  Nodes      |                                               |
|  Networks   |   +---------+ +---------+ +---------+         |
|  Settings   |   | Umumi   | | Online  | | Offline |         |
|             |   |   12    | |    8    | |    4    |         |
|             |   +---------+ +---------+ +---------+         |
|             |                                               |
|             |   Son Aktivlik                                |
|             |   - Elinin Telefonu   Online   2 deq evvel    |
|             |   - Ofis Notebooku    Online   5 deq evvel    |
|             |   - Ev Serveri        Offline  1 saat evvel   |
|             |                                               |
|  [Cixis]    |                                               |
+-------------+-----------------------------------------------+
```

## Xüsusiyyətlər

### Dashboard (İdarə Paneli)

Əsas icmal səhifəsi göstərir:
- **Ümumi Node-lar:** Bütün qeydiyyatdan keçmiş cihazlar
- **Online Node-lar:** Hazırda qoşulmuş cihazlar
- **Offline Node-lar:** Ayrılmış cihazlar
- **Son Aktivlik:** Ən son əlaqə hadisələri

### Nodes (Peer İdarəçiliyi)

Bura VPN-ə qoşulmuş bütün cihazları idarə etdiyiniz yerdir.

#### Node-ları Görmək

Node cədvəli göstərir:

| Sütun | Təsvir |
|-------|--------|
| Ad | Cihazın dost adı |
| Status | Online, Offline, Gözləmədə, Vaxtı Bitmiş |
| IP Ünvanı | Təyin edilmiş VPN IP |
| Son Handshake | Son uğurlu əlaqə vaxtı |
| Transfer | Göndərilən/alınan data |
| Bitmə Vaxtı | Girişin bitmə tarixi |
| Əməliyyatlar | Redaktə, Konfiq, Silmə düymələri |

#### Yeni Cihaz (Peer) Əlavə Etmək

1. **+ Create Peer** düyməsinə klikləyin
2. Formu doldurun:
   - **Peer Adı:** Dost ad (məsələn, "Əlinin iPhone-u", "Ofis PC")
   - **Bitmə Vaxtı:** Giriş müddətini seçin:
     - **Daimi (Forever):** Vaxt limiti yoxdur
     - **1 Saat:** Müvəqqəti giriş
     - **1 Gün:** Gündəlik giriş
     - **1 Həftə:** Həftəlik giriş
     - **Xüsusi:** Dəqiq tarix/vaxt təyin edin
3. **Create & Download Config** düyməsinə klikləyin
4. Əlaqə seçimləri ilə modal açılır

#### Cihazı Qoşmaq

Peer yaratdıqdan sonra bir neçə tab-lı **Server Config Modal** görəcəksiniz:

**Config & QR Tab:**
- WireGuard konfiqurasiya mətnini görün
- Konfiqurasiyanı buferə kopyalayın
- `.conf` faylını yükləyin
- Mobil tətbiq ilə QR kodu oxudun

**Windows Tab:**
1. WireGuard quraşdırıcısını yükləyin
2. Tətbiqi quraşdırın
3. "Import tunnel(s) from file" klikləyin
4. Yüklənmiş `.conf` faylını seçin
5. "Activate" klikləyin

**macOS Tab:**
1. Mac App Store-dan WireGuard yükləyin
2. Tətbiqi açın
3. Konfiqurasiya faylını import edin
4. Tuneli aktivləşdirin

**Linux Tab:**
- **Asan Quraşdırma:** Bir sətirlik quraşdırma skriptini kopyalayıb işə salın
- **Manual Quraşdırma:**
  ```bash
  sudo apt install wireguard
  sudo nano /etc/wireguard/wg0.conf
  # Konfiqurasiyanı yapışdırın
  sudo wg-quick up wg0
  ```

**Docker Tab:**
```bash
docker run -d \
  --name=wireguard-client \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_MODULE \
  -v /path/to/wg0.conf:/config/wg0.conf \
  linuxserver/wireguard
```

#### Cihazı Redaktə Etmək

1. İstənilən node-da **Redaktə** düyməsinə klikləyin
2. Parametrləri dəyişdirin:
   - **Ad:** Cihaz adını dəyişin
   - **Status:** Aktiv və ya Söndürülmüş
   - **Bitmə Vaxtı:** Vaxt limitini uzadın və ya dəyişdirin
   - **Cihaz Məlumatı:** ƏS, Arxitektura, Hostname yeniləyin
3. **Save Changes** klikləyin

#### Cihazı Silmək

1. **Sil** düyməsinə klikləyin
2. Silməni təsdiqləyin
3. Cihaz həmişəlik silinir və giriş ləğv edilir

### Networks (Şəbəkələr)

VPN şəbəkə konfiqurasiyalarını idarə edin:
- Mövcud şəbəkələri görün
- Xüsusi subnet-lərlə yeni şəbəkələr yaradın
- Şəbəkə parametrlərini redaktə edin
- İstifadə olunmayan şəbəkələri silin

### Settings (Tənzimləmələr)

#### Şifrəni Dəyişmək

1. **Settings** səhifəsinə keçin
2. **Hazırkı Şifrə** daxil edin
3. **Yeni Şifrə** daxil edin
4. Yeni şifrəni təsdiqləyin
5. **Update Password** klikləyin

#### İstifadəçi İdarəçiliyi (Yalnız Admin)

**İstifadəçi Əlavə Etmək:**
1. **+ Add User** klikləyin
2. İstifadəçi adı və şifrə daxil edin
3. Rol seçin (Admin/User)
4. **Create** klikləyin

**İstifadəçi Silmək:**
1. Siyahıda istifadəçini tapın
2. **Sil** klikləyin
3. Silməni təsdiqləyin

**Qeyd:** Əsas `admin` istifadəçisi silinə bilməz.

## Status Göstəriciləri

| Status | Mənası |
|--------|--------|
| Online | Cihaz qoşulub və aktivdir |
| Offline | Cihaz hazırda qoşulu deyil |
| Gözləmədə | Cihaz yaradılıb amma heç vaxt qoşulmayıb |
| Vaxtı Bitmiş | Giriş vaxtı bitib |

## Qaranlıq Rejim

Üst naviqasiya panelindəki tema düyməsindən istifadə edərək qaranlıq rejimi aktivləşdirin. Seçiminiz avtomatik saxlanılır.

## Təhlükəsizlik Tövsiyələri

1. **Defolt Şifrəni Dəyişin:** İlk girişdən dərhal sonra admin şifrəsini yeniləyin
2. **Güclü Şifrələr İstifadə Edin:** Minimum 12 simvol, böyük/kiçik hərf, rəqəm və simvollar
3. **Bitmə Tarixləri Təyin Edin:** Müvəqqəti istifadəçilər üçün vaxt limitli giriş istifadə edin
4. **Müntəzəm Yoxlama:** İstifadə olunmayan node-ları mütəmadi olaraq nəzərdən keçirin və silin
5. **Konfiq Fayllarını Qoruyun:** Yüklənmiş `.conf` fayllarını təhlükəsiz saxlayın
6. **Yalnız HTTPS:** Dashboard-a həmişə HTTPS vasitəsilə daxil olun
7. **Çıxış Edin:** İşiniz bitdikdə həmişə çıxış edin

## Problemlərin Həlli

### Dashboard-a Daxil Ola Bilmirəm

| Problem | Həll |
|---------|------|
| Əlaqə rədd edildi | Serverin işlədiyini yoxlayın, port 3007-nin açıq olduğunu təsdiqləyin |
| Sertifikat xətası | Öz-imzalı sertifikatı qəbul edin və ya düzgün SSL quraşdırın |
| Giriş uğursuz oldu | Məlumatları yoxlayın, caps lock-u yoxlayın |

### Cihaz Qoşulmur

| Problem | Həll |
|---------|------|
| Handshake timeout | Firewall-un UDP 51820-yə icazə verdiyini yoxlayın |
| Qoşulduqdan sonra internet yoxdur | Konfiqda AllowedIPs-i yoxlayın |
| Konfiq işləmir | Konfiqurasiyanı yenidən yükləyin, səhvləri yoxlayın |

### Node Offline Görünür

| Problem | Həll |
|---------|------|
| Yenicə yaradılıb | İlk əlaqəni gözləyin |
| Əvvəl online idi | Cihazın WireGuard tətbiq statusunu yoxlayın |
| Expired statusu | Node-u redaktə edin və bitmə vaxtını uzadın |

## Mobil Giriş

Dashboard tam responsivdir və mobil cihazlarda işləyir:
- Naviqasiyaya daxil olmaq üçün hamburger menyusundan istifadə edin
- QR kodlar mobil oxuma üçün optimallaşdırılıb
- Toxunma dostu düymələr və idarəetmə elementləri

## Dəstək

- **Developer:** [Ali Zeynalli](https://github.com/Ali7Zeynalli)
- **Sənədləşdirmə:** Texniki detallar üçün DEVELOPER_GUIDE.md-ə baxın
- **Problemlər:** GitHub repository-də bug-ları bildirin
