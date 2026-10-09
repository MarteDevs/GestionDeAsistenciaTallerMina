# Sistema de Control de Asistencia y Descansos - Taller Mina

Sistema especializado en el control de turnos y regímenes mineros atípicos (ej. 20x10), diseñado con arquitectura de **Capas Superpuestas**:
1. **Capa Inmutable:** `DescansosProgramados` fijos (fechas de inicio y fin fijas, inalterables).
2. **Capa Dinámica:** `Excepciones` diarias superpuestas (`VENTA_DESCANSO`, `PERMISO`).
3. **Capa Base:** Días laborables por defecto (`1`).

---

## 🛠 Stack Tecnológico

- **Backend:** Node.js, Express, TypeScript.
- **ORM:** Prisma 5 (conectado a MySQL Server / MySQL Workbench).
- **Base de Datos:** MySQL Server 9.1 (`127.0.0.1:3306`, BD: `taller_mina`).
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS.
- **Despliegue:** VPS Linux tradicional con PM2 y Nginx.

---

## 🚀 Puesta en Marcha Local

### 1. Base de Datos (MySQL / MySQL Workbench)
El backend está conectado a tu instancia local de MySQL Server 9.1 en el puerto **3306** (accesible desde MySQL Workbench).
La base de datos `taller_mina` ya está creada con sus tablas (`trabajadores`, `descansos_programados`, `excepciones`).

Cadena de conexión en `backend/.env`:
```env
DATABASE_URL="mysql://root:marte@127.0.0.1:3306/taller_mina"
PORT=4000
```

### 2. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed   # Pobla trabajadores, descansos y excepciones de prueba
npm run dev           # Servidor en http://localhost:4000
```

### 3. Frontend
```bash
cd ../frontend
npm install
npm run dev           # Vite dev server en http://localhost:3000
```

El proxy de desarrollo redirige automáticamente las peticiones `/api/*` al backend en el puerto `4000`.

---

## 🌐 Despliegue en Producción (VPS Linux)

### 1. Compilación
```bash
# Compilar Backend
cd /var/www/tallerMina/backend
npm install --production=false
npx prisma generate
npm run build

# Compilar Frontend
cd /var/www/tallerMina/frontend
npm install
npm run build
```

### 2. Levantar Procesos con PM2
```bash
cd /var/www/tallerMina
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Configurar Nginx
Copia `nginx.conf` a `/etc/nginx/sites-available/tallerMina` y habilítalo:
```bash
sudo ln -s /etc/nginx/sites-available/tallerMina /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Pruebas de API Realizadas
- `GET /api/programacion?anio=2026&mes=10` -> Devuelve la matriz mensual calculada con totales (`totalTrabajados`, `totalDescansos`, `totalVentas`, `totalPermisos`).
- `POST /api/excepciones` -> Registra excepciones y valida reglas de negocio (impide venta en días laborales o permiso en días de descanso).
