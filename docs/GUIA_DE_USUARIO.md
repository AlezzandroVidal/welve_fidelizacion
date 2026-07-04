# 📖 Guía de Uso — Welve

**Plataforma SaaS B2B de Fidelización para negocios físicos en Perú**

---

## 🔗 URLs del sistema

| Ambiente | URL |
|---|---|
| 🌐 **Frontend (app)** | https://welve-frontend-production.up.railway.app |
| ⚙️ **Backend API** | https://welve-backend-production.up.railway.app |
| 📚 **Swagger / Docs** | https://welve-backend-production.up.railway.app/docs |
| ❤️ **Health check** | https://welve-backend-production.up.railway.app/health |

---

## 👥 Cuentas de acceso

### 🔑 Superadmin (Welve)

| Email | Password | Acceso |
|---|---|---|
| `admin@welve.pe` | `WelveAdmin2024!` | `/superadmin` |

---

### 🏢 Empresas — Panel Admin

Login en: `/login` → tab **"Empresa"**
O directo via API: `POST /api/v1/empresas/login`

| Empresa | Email | Password | Rubro |
|---|---|---|---|
| ☕ Café Ritual | `admin@caferitual.pe` | `Ritual2024!` | Cafetería |
| ✂️ Salón Lumina | `admin@salonlumina.pe` | `Lumina2024!` | Belleza |
| 🛍️ Tienda Maki | `admin@tiendamaki.pe` | `Maki2024!` | Retail |
| 🍕 Pizzería Bella Napoli | `admin@bellanapoli.pe` | `Napoli2024!` | Restaurante |
| 📚 Librería Página 1 | `admin@pagina1.pe` | `Pagina2024!` | Retail |

**¿Qué puede hacer el admin de empresa?**
- Crear y gestionar cupones, retos y membresías
- Ver dashboard con métricas y gráficos
- Gestionar productos e inventario
- Operar la caja (registrar ventas y canjes)
- Escanear QR de clientes o ingresar su código
- Ver historial de canjes y visitas
- Configurar recompensas automáticas por visitas
- Gestionar su suscripción a Welve

---

### 📱 Clientes — Wallet

Login en: `/login` → tab **"Cliente"**
Password de todos: `password123`

> En modo desarrollo: el endpoint de magic link devuelve el `devToken`
> directamente en la respuesta, sin necesidad de email real.

| Nombre | Código WLV | Email | WhatsApp |
|---|---|---|---|
| Ana García | `WLV-7OGM` | ana.garcia@gmail.com | +51987654321 |
| Carlos Quispe | `WLV-N9XX` | carlos.quispe@gmail.com | +51976543210 |
| María López | `WLV-MFK2` | maria.lopez@gmail.com | +51965432109 |
| Pedro Mamani | `WLV-CBDA` | pedro.mamani@gmail.com | +51954321098 |
| Lucía Ramos | `WLV-C1BG` | lucia.ramos@gmail.com | +51943210987 |
| Jorge Huanca | `WLV-H4R5` | jorge.huanca@gmail.com | +51932109876 |
| Rosa Vargas | `WLV-P0E1` | rosa.vargas@gmail.com | +51921098765 |
| Miguel Torres | `WLV-V23Y` | miguel.torres@gmail.com | +51910987654 |
| Elena Flores | `WLV-5YI2` | elena.flores@gmail.com | +51999876543 |
| Diego Chávez | `WLV-8RPY` | diego.chavez@gmail.com | +51988765432 |
| Sofía Ramírez | `WLV-UC4Y` | sofia.ramirez@gmail.com | +51977123456 |
| Andrés Castro | `WLV-MGL6` | andres.castro@gmail.com | +51966234567 |
| Valentina Ruiz | `WLV-AOX2` | valentina.ruiz@gmail.com | +51955345678 |
| Bruno Salazar | `WLV-5M5Q` | bruno.salazar@gmail.com | +51944456789 |
| Camila Vega | `WLV-UX3T` | camila.vega@gmail.com | +51933567890 |
| Renzo Delgado | `WLV-O575` | renzo.delgado@gmail.com | +51922678901 |

> El código `WLV-XXXX` sirve para que el staff identifique al cliente
> en la caja sin necesidad de que el cliente tenga el celular a mano.

**¿Qué puede hacer el cliente?**
- Ver empresas y sus cupones disponibles
- Ver su progreso en retos y misiones
- Ver sus sellos de visitas por empresa
- Mostrar su QR personal para canjear beneficios
- Ver historial de canjes
- Recibir notificaciones cuando desbloquea un cupón

---

## 🚀 Flujos principales para probar

### Flujo 1 — Admin crea un cupón y cliente lo canjea

```
1. Login como admin → admin@caferitual.pe / Ritual2024!
2. Ir a Cupones → "Nuevo cupón"
3. Crear: "15% OFF en toda la compra" → tipo Porcentual → 15%
4. Guardar

5. Login como cliente → ana.garcia@gmail.com / password123
6. Ir a Wallet → buscar "Café Ritual"
7. Ver el cupón creado → "Ver código QR"

8. Volver al admin → Módulo "Registrar" (Staff)
9. Ingresar código: WLV-7OGM → buscar cliente
10. Seleccionar el cupón → Confirmar canje

11. Volver al dashboard → verificar que aparece en métricas
```

---

### Flujo 2 — Caja registra una venta con cupón

```
1. Login como admin → admin@caferitual.pe / Ritual2024!
2. Ir a Caja
3. Agregar productos: Café americano + Croissant
4. Identificar cliente: WLV-7OGM
5. Sistema muestra cupones disponibles del cliente
6. Seleccionar cupón → ver descuento aplicado
7. Elegir método de pago: Yape
8. Cobrar → ver comprobante
```

---

### Flujo 3 — Cliente completa un reto y desbloquea cupón

```
1. Login como admin → admin@salonlumina.pe / Lumina2024!
2. Ir a Retos → ver reto "Visita 3 veces"
3. Ir a Registrar → ingresar WLV-MFK2 → registrar visita (3 veces)
4. En la 3ra visita: alerta "Cliente ganó: Manicure gratis 🎁"

5. Login como cliente → maria.lopez@gmail.com / password123
6. Ver notificación "¡Desbloqueaste un nuevo cupón!"
7. Ir a Mis Cupones → ver el cupón desbloqueado
8. Mostrar QR al staff para canjearlo
```

---

### Flujo 4 — Registro de nuevo cliente por QR

```
1. Login como admin → admin@tiendamaki.pe / Maki2024!
2. Ir a QR Codes → copiar el "QR de afiliación"
3. Abrir esa URL en otra pestaña (simula escaneo)
4. Completar registro: nombre + email
5. Ver pantalla de bienvenida con código WLV asignado
6. Verificar en el admin → Clientes → nuevo cliente aparece
```

---

### Flujo 5 — Probar magic link (modo desarrollo)

```
POST https://welve-backend-production.up.railway.app/api/v1/auth/cliente/magic-link
Body: { "email": "ana.garcia@gmail.com", "empresa_id": "<id>" }

Respuesta incluye: { "devToken": "xxxx..." }
Usar ese token en: GET /api/v1/auth/cliente/verify?token=xxxx
```

---

## 🗂️ Módulos del sistema

### Panel Admin (`/admin/*`)

| Módulo | Ruta | Descripción |
|---|---|---|
| Dashboard | `/admin/dashboard` | Métricas, gráficos, actividad reciente |
| Cupones | `/admin/cupones` | Crear y gestionar descuentos |
| Retos | `/admin/retos` | Configurar misiones para clientes |
| Clientes | `/admin/clientes` | Ver base de clientes y su historial |
| Canjes | `/admin/canjes` | Historial de redenciones |
| Caja | `/admin/caja` | POS — registrar ventas con cupones |
| Ventas | `/admin/ventas` | Historial de ventas |
| Productos | `/admin/productos` | Catálogo e inventario |
| Inventario | `/admin/inventario` | Alertas de stock |
| Registrar | `/admin/staff` | Registrar visitas por QR o código |
| QR Codes | `/admin/qr` | QR de afiliación y visita |
| Suscripción | `/admin/suscripcion` | Plan y pagos a Welve |
| Configuración | `/admin/configuracion` | Perfil de la empresa |

### Wallet Cliente (`/wallet/*`)

| Módulo | Ruta | Descripción |
|---|---|---|
| Inicio | `/wallet` | Explorar empresas y cupones destacados |
| Empresa | `/wallet/empresa/:id` | Detalle, cupones, retos, sellos |
| Cupón | `/wallet/cupon/:id` | Detalle del cupón y QR de canje |
| Mis Cupones | `/wallet/mis-cupones` | Disponibles, desbloqueados, en progreso |
| Mis Retos | `/wallet/mis-retos` | Progreso en todas las empresas |
| Historial | `/wallet/historial` | Timeline de canjes |
| Perfil | `/wallet/perfil` | Datos personales y resumen |

### Páginas públicas

| Ruta | Descripción |
|---|---|
| `/` | Landing page de Welve |
| `/login` | Login empresa / cliente / admin |
| `/register` | Registro empresa o cliente |
| `/qr/empresa/:id` | Página de afiliación por QR |
| `/qr/visita/:id` | Registro de visita por QR |
| `/qr/cupon/:id` | Validación de cupón por staff |

---

## 🔧 API — Endpoints principales

Base URL: `https://welve-backend-production.up.railway.app`

### Auth
```
POST /api/v1/empresas/login          → Login admin empresa
POST /api/v1/empresas/register       → Registro nueva empresa
POST /api/v1/auth/cliente/magic-link → Solicitar magic link cliente
GET  /api/v1/auth/cliente/verify     → Verificar token magic link
```

### Panel Admin (requieren Bearer JWT de empresa)
```
GET  /api/v1/metricas/resumen        → KPIs del dashboard
GET  /api/v1/cupones/                → Listar cupones
POST /api/v1/cupones/                → Crear cupón
GET  /api/v1/clientes/               → Listar clientes
POST /api/v1/staff/visita/por-codigo → Registrar visita
POST /api/v1/staff/canje/por-codigo  → Canjear cupón
GET  /api/v1/staff/cliente/:codigo   → Buscar cliente por WLV-XXXX
POST /api/v1/ventas/                 → Procesar venta en caja
GET  /api/v1/productos/              → Listar productos
```

### Wallet Cliente (requieren Bearer JWT de cliente)
```
GET  /api/v1/wallet/empresas                      → Explorar empresas
GET  /api/v1/wallet/empresa/:id                   → Detalle empresa
GET  /api/v1/wallet/cupones/destacados            → Cupones destacados
GET  /api/v1/wallet/mis-cupones                   → Mis cupones
GET  /api/v1/wallet/mis-retos                     → Mis retos con progreso
GET  /api/v1/wallet/empresa/:id/mis-visitas       → Sellos de visitas
GET  /api/v1/wallet/notificaciones                → Notificaciones
GET  /api/v1/wallet/historial                     → Historial de canjes
```

---

## 💡 Tips para la demo

- **Para probar rápido en Swagger**: ir a `/docs` → Authorize → pegar el JWT
- **Obtener JWT rápido**:
  ```bash
  curl -X POST https://welve-backend-production.up.railway.app/api/v1/empresas/login \
    -H "Content-Type: application/json" \
    -d '{"admin_email":"admin@caferitual.pe","admin_password":"Ritual2024!"}'
  ```
- **El código WLV** del cliente sirve en la caja sin que el cliente abra su app
- **Los cupones por reto** se desbloquean automáticamente al completar visitas
- **Dashboard**: los widgets son reordenables (botón "Personalizar")
- **Modo desarrollo**: magic link devuelve el token directamente en la respuesta

---

*Welve — Fidelización inteligente para negocios físicos · Lima, Perú · 2026*