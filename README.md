# 🏍️ Taller de Motos

Aplicación web **responsive** para gestionar un taller de motos:

- **Clientes** con **varios contactos** (celular, WhatsApp, email…) y sus **motos**
  (marca, modelo, patente, cilindrada, N° de chasis/motor, foto).
- **Catálogo de servicios** (mano de obra) y **grupos de servicios** para cargar
  varios juntos (ej: _Service completo_ = aceite + filtros + bujías…).
- **Repuestos** con **control de stock** (alerta de stock bajo; se descuenta al
  usarlos en una orden).
- **Órdenes de trabajo**: servicios + repuestos por moto, **en qué fecha**,
  **mecánico** asignado, **cobro** (estado de pago, medio, descuento) y total.
  Queda un **historial** por cliente.
- **Turnos / agenda**: cuándo entra cada moto.
- **Recordatorio de próximo service** (por km o fecha), con avisos en el inicio.
- **Empleados** (roles admin/empleado): el admin gestiona el personal y **asigna
  órdenes**; el empleado ve **solo sus tareas**, marca **Empezar**, tilda cada
  tarea y **Finaliza** → se calcula **cuánto tardó**. Al empleado no se le muestran
  los precios.
- **Dashboard** con métricas del mes, próximos services, próximos turnos y stock bajo.
- **Login** para el personal del taller.

## 🧰 Tecnologías (todas open source)

| Área          | Tecnología                          |
| ------------- | ----------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| Lenguaje      | TypeScript                          |
| Estilos       | Tailwind CSS v4                     |
| Base de datos | PostgreSQL ([Neon](https://neon.tech)) |
| ORM           | [Prisma](https://www.prisma.io)     |
| Autenticación | [Auth.js](https://authjs.dev) (NextAuth v5) |
| Íconos        | lucide-react                        |

---

## 🚀 Puesta en marcha (local)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

La app usa **PostgreSQL**. La forma más rápida es una base gratis en **Neon**:

1. Entrá a <https://neon.tech> y creá un proyecto (gratis).
2. Copiá el **Connection string** (el "Pooled connection").
3. Pegalo en el archivo `.env`, en `DATABASE_URL`:

```env
DATABASE_URL="postgresql://usuario:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="tu-secreto"   # generá uno nuevo con: npx auth secret
```

> 💡 ¿Preferís no usar la nube? Podés levantar Postgres local con Docker:
> `docker run --name taller-db -e POSTGRES_PASSWORD=taller -e POSTGRES_DB=taller -p 5432:5432 -d postgres`
> y usar `DATABASE_URL="postgresql://postgres:taller@localhost:5432/taller"`.

### 3. Crear las tablas y cargar datos de ejemplo

```bash
npm run db:push    # crea las tablas en la base
npm run db:seed    # carga catálogo, clientes y usuario admin de ejemplo
```

### 4. Iniciar la app

```bash
npm run dev
```

Abrí <http://localhost:3000> e ingresá con un usuario de ejemplo:

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@taller.com` | `admin1234` |
| Empleado | `ana@taller.com` | `empleado123` |
| Empleado | `pedro@taller.com` | `empleado123` |

El **admin** ve todo el panel; los **empleados** solo ven "Mis tareas" (las órdenes
que el admin les asignó).

> ⚠️ Cambiá estas contraseñas antes de usar la app en producción.

---

## 📜 Comandos útiles

| Comando             | Descripción                                    |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Entorno de desarrollo (hot reload).            |
| `npm run build`     | Build de producción.                           |
| `npm start`         | Corre el build de producción.                  |
| `npm run db:push`   | Sincroniza el esquema de Prisma con la base.   |
| `npm run db:seed`   | Carga datos de ejemplo + usuario admin.        |
| `npm run db:studio` | Abre Prisma Studio para ver/editar la base.    |

---

## ☁️ Deploy en Vercel

1. Subí el proyecto a GitHub.
2. Importalo en <https://vercel.com>.
3. Cargá las variables de entorno en Vercel:
   - `DATABASE_URL` → el connection string de Neon.
   - `AUTH_SECRET` → un secreto (generá con `npx auth secret`).
   - `AUTH_TRUST_HOST` → `true`.
4. Deploy. Después, una sola vez, corré el push del esquema y el seed contra la
   base de producción (por ejemplo desde tu máquina, con el `DATABASE_URL` de
   producción en tu `.env`):
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## 📁 Estructura del proyecto

```
prisma/
  schema.prisma        Modelo de datos (Cliente, Moto, Servicio, Grupo, Orden…)
  seed.ts              Datos de ejemplo + usuario admin
src/
  auth.ts              Config de Auth.js (login con credenciales + Prisma)
  auth.config.ts       Config base (protección de rutas, corre en edge)
  proxy.ts             Middleware de auth (protege todas las rutas)
  lib/                 prisma client, formato, validaciones, constantes
  components/          UI reutilizable (botones, inputs, cards, shell…)
  app/
    login/             Pantalla de login
    (app)/             App autenticada (con menú lateral)
      page.tsx         Dashboard
      clientes/        ABM de clientes y motos
      servicios/       ABM de servicios
      grupos/          ABM de grupos de servicios
      ordenes/         Órdenes de trabajo (historial de servicios)
```

---

## 💡 Ideas para más adelante

- Recordatorio de próximo service (por km o por fecha).
- Impresión / PDF de la orden de trabajo.
- Roles y permisos (admin vs. empleado).
- Reportes de ingresos por período.
- Carga de fotos de la moto.
