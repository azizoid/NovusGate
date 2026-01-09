# NovusMesh Server - İstifadəçi Təlimatı

## Giriş
**NovusMesh Server**, sizin VPN şəbəkənizin onurğa sütunudur. O, arxa planda səssizcə işləyərək cihazlarınız arasındakı təhlükəsiz şifrələnmiş tunelləri saxlayır.

## Quraşdırma
*Qeyd: Avtomatik yerləşdirmə üçün **NovusMesh Installer** istifadə etməyiniz tövsiyə olunur.*

### Docker Yerləşdirməsi (Manual)
Əgər manual olaraq Docker ilə işlətmək istəyirsinizsə:

1. **`docker-compose.yml` yaradın:**
   ```yaml
   version: "3"
   services:
     control-plane:
       image: novusmesh/server:latest
       cap_add: [NET_ADMIN]
       network_mode: host
       volumes:
         - ./data:/app/data
       env_file: .env
   ```

2. **`.env` Konfiqurasiyası yaradın:**
   ```bash
   # Təhlükəsizlik
   JWT_SECRET=super_guclu_tesadufi_kod
   API_KEY=daxili_elaqe_ucun_kod
   DB_PASSWORD=baza_shifreleme_acari
   
   # Şəbəkə
   WG_SERVER_ENDPOINT=SIZIN_PUBLIC_IP
   ```

3. **İşə salın:**
   ```bash
   docker-compose up -d
   ```

## Konfiqurasiya

### Mühit Dəyişənləri (Environment Variables)
| Dəyişən | Təsvir | Defolt |
|---------|--------|--------|
| `JWT_SECRET` | API tokenlərini imzalamaq üçün gizli açar. **Çox vacibdir.** | Məcburidir |
| `API_KEY` | Xidmətlərarası əlaqə üçün açar. | Məcburidir |
| `DB_PASSWORD` | SQLite verilənlər bazasının şifrələnməsi üçün açar. | Məcburidir |
| `WG_SERVER_ENDPOINT` | Müştərilərin qoşulacağı İctimai IP və ya Domen. | Avtomatik |
| `PORT` | API dinləmə portu. | 8080 |

### Məlumatların Saxlanması (Storage)
- Bütün server vəziyyəti `data/novusmesh.db` faylında saxlanılır.
- **Backup:** `data/` qovluğunu mütəmadi olaraq təhlükəsiz yerə nüsxələyin.
- **İtki:** Bu faylı itirsəniz, bütün peer konfiqurasiyalarını və açarları itirəcəksiniz.

## Problemlərin Həlli (Troubleshooting)

### "Clients cannot connect" (Müştərilər qoşula bilmir)
- Firewall və ya Router-də **51820 UDP** portunun açıq olduğunu yoxlayın.
- `.env` faylında `WG_SERVER_ENDPOINT` dəyərinin sizin real İctimai IP-nizlə eyni olduğunu yoxlayın.

### "Server restarts loop" (Server dayanmadan restart verir)
- Loglara baxın: `docker logs novusmesh-server`.
- Ən çox rast gəlinən səbəb: `database is locked` və ya `data/` qovluğunda icazə (permission) xətası.

### "API 500 Error"
- `JWT_SECRET` dəyərinin təyin olunduğunu və Veb Paneldəki ilə uyğun gəldiyini yoxlayın (əgər manual qurmusunuzsa).

## Dəstək
[Ali Zeynalli](https://github.com/Ali7Zeynalli) tərəfindən hazırlanıb.
