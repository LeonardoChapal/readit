# CLAUDE.md — Contexto del Proyecto Readit

> Este archivo proporciona contexto persistente a Claude Code para todas las sesiones en este repositorio. Léelo siempre antes de hacer cambios.

---

## Sobre el Proyecto

**Readit** es una plataforma web colaborativa especializada en reseñas de libros, con formato comunitario tipo Reddit. Permite a los usuarios publicar críticas literarias, comentar publicaciones y votar contenido.

- **Autor:** Leonardo Chapal Díaz
- **Institución:** ParqueSoftTI
- **Cohorte:** 37
- **Repositorio:** https://github.com/LeonardoChapal/readit
- **Idioma de comunicación:** Español. Comentarios de código y mensajes de commit en español; nombres de variables, funciones y archivos en inglés (convención estándar).

---

## Stack Tecnológico

### Backend (carpeta `backend/`)
- **Lenguaje:** Python 3.10+
- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Validación:** Pydantic
- **Base de datos:** PostgreSQL en Neon (cloud, serverless)
- **Autenticación:** JWT (python-jose)
- **Hash de contraseñas:** bcrypt (passlib)
- **Servidor:** Uvicorn

### Frontend (carpeta `frontend/`)
- **Lenguaje:** TypeScript
- **Librería:** React 18
- **Bundler:** Vite
- **Estilos:** TailwindCSS (NO usar CSS plano ni CSS-in-JS)
- **Routing:** React Router (v6+)
- **Peticiones HTTP:** fetch nativo (axios solo si se requiere algo específico)

---

## Estructura de Carpetas

```
readit/
├── CLAUDE.md              # Este archivo
├── README.md              # Documentación pública del proyecto
├── .gitignore
├── backend/
│   ├── venv/              # No se sube a Git
│   ├── main.py            # Entry point de FastAPI
│   ├── database.py        # Configuración SQLAlchemy
│   ├── auth.py            # Lógica de JWT y hash de contraseñas
│   ├── models/            # Modelos SQLAlchemy (uno por entidad)
│   ├── schemas/           # Esquemas Pydantic (uno por entidad)
│   ├── routers/           # Endpoints organizados por entidad
│   ├── requirements.txt
│   ├── .env               # Variables de entorno, NO se sube a Git
│   └── .env.example       # Plantilla de .env, sí se sube
└── frontend/
    ├── src/
    │   ├── components/    # Componentes reutilizables (Button, Card, etc.)
    │   ├── pages/         # Páginas completas (HomePage, ReviewPage, etc.)
    │   ├── hooks/         # Hooks personalizados (useAuth, useReviews)
    │   ├── lib/           # Cliente API, utilidades
    │   ├── types/         # Definiciones de tipos TypeScript
    │   ├── App.tsx
    │   └── main.tsx
    ├── public/
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## Modelo de Datos (6 entidades)

| Entidad | Descripción | Campos clave |
|---------|-------------|--------------|
| **User** | Usuarios registrados | id, username, email, password_hash, avatar (BYTEA), role, created_at |
| **Book** | Libros reseñados | id, title, author, year, cover (BYTEA), genre_id |
| **Review** | Reseñas publicadas | id, user_id, book_id, title, content, created_at, score, status |
| **Comment** | Comentarios anidables | id, user_id, review_id, parent_comment_id, content, created_at, status |
| **Genre** | Géneros literarios | id, name (ficción, no ficción, fantasía, ciencia ficción, romance, ensayo, etc.) |
| **Vote** | Votos sobre reseñas | id, user_id, review_id, value (+1 o -1), created_at |

### Reglas del modelo
- `Review.score` se calcula como la suma de los `Vote.value` asociados (se actualiza al votar).
- Un usuario solo puede votar una reseña una vez: `UNIQUE(user_id, review_id)` en `Vote`.
- Los comentarios soportan anidación vía `parent_comment_id` (autorreferencia, NULL = comentario raíz).
- **Borrado lógico:** el campo `status` puede ser `"active"`, `"hidden"` o `"deleted"`. Nunca se hace DELETE de reseñas o comentarios moderados.
- Las imágenes (`User.avatar`, `Book.cover`) se guardan como `BYTEA` directamente en PostgreSQL.

---

## Roles de Usuario

| Rol | Capacidades |
|-----|-------------|
| **Visitante** (no autenticado) | Ver feed, leer reseñas y comentarios, explorar por género |
| **Registrado** | Todo lo anterior + publicar reseñas, comentar, votar, editar perfil |
| **Administrador** | Todo lo anterior + acceder al panel admin, moderar contenido, gestionar usuarios |

El campo `User.role` puede ser `"user"` o `"admin"`. La verificación de permisos se hace en cada endpoint protegido vía dependencias de FastAPI.

---

## Páginas del Sitio Público

1. **Inicio** (`/`) — Feed de reseñas más votadas, hero con video de fondo.
2. **Explorar** (`/explorar` y `/explorar/:genero`) — Listado filtrable por género.
3. **Detalle de reseña** (`/resena/:id`) — Contenido completo + comentarios anidados + sistema de votos.
4. **Perfil de usuario** (`/usuario/:username`) — Reseñas y comentarios públicos del usuario.
5. **Registro / Login** (`/registro`, `/login`).
6. **Acerca de** (`/acerca`).

## Panel de Administración (`/admin/...`)

5 módulos CRUD: usuarios, libros, reseñas, comentarios, géneros. Los votos se gestionan automáticamente sin intervención manual.

---

## Convenciones de Código

### Backend (Python)
- Nombres de funciones y variables en `snake_case`.
- Nombres de clases en `PascalCase`.
- Nombres de tablas en singular y minúscula (`user`, `book`, `review`).
- Cada entidad: un archivo en `models/`, otro en `schemas/`, otro en `routers/`.
- Usar `Depends()` de FastAPI para inyección de dependencias (sesión de DB, usuario autenticado).
- Variables de entorno en `.env`, leídas vía `python-dotenv`.
- Type hints obligatorios en todas las funciones.

### Frontend (TypeScript / React)
- Componentes en `PascalCase` (`ReviewCard.tsx`, `CommentThread.tsx`).
- Funciones y variables en `camelCase`.
- Hooks personalizados con prefijo `use` (`useAuth`, `useReviews`).
- **Solo functional components con hooks**, NUNCA class components.
- Preferir `const` y arrow functions.
- Tipos e interfaces explícitos para props y respuestas de API.
- Estilos **exclusivamente con TailwindCSS**. No CSS plano ni CSS-in-JS.

### Convenciones de API REST
- Prefijo: `/api/v1`
- Métodos: GET (leer), POST (crear), PUT (actualizar completo), PATCH (actualizar parcial), DELETE.
- Respuestas siempre en JSON.
- Códigos de estado: 200 (ok), 201 (creado), 400 (validación), 401 (no autenticado), 403 (no autorizado), 404 (no encontrado), 500 (error servidor).

---

## Identidad Visual

- **Color primario:** naranja `#f97316` (Tailwind: `orange-500`). Inspirado en Reddit.
- **Color secundario:** blanco `#ffffff` y gris claro `#f3f4f6`.
- **Texto principal:** gris oscuro `#1f2937` (Tailwind: `gray-800`).
- **Tipografía:** sans-serif moderna (Inter o la default de Tailwind).
- **Estilo general:** limpio, minimalista, con tarjetas apilables y espaciado generoso. Mejor jerarquía tipográfica que Reddit pero con la misma sensación comunitaria.

---

## Reglas Estrictas — NO Hacer

- ❌ No usar Flask, Django, ni ningún otro framework Python distinto a FastAPI.
- ❌ No usar plantillas Jinja2 ni renderizado del lado del servidor.
- ❌ No usar Material UI, Bootstrap, Chakra UI ni otros frameworks de componentes. Solo TailwindCSS.
- ❌ No usar HTML, CSS o JS vanilla del lado del cliente.
- ❌ No usar class components en React.
- ❌ No guardar contraseñas en texto plano. Siempre hashear con bcrypt antes de guardar.
- ❌ No exponer `password_hash` en respuestas JSON. El esquema Pydantic de salida (`UserOut`) debe excluirlo.
- ❌ No subir `.env`, `venv/`, `node_modules/`, ni `dist/` a Git.
- ❌ No hacer borrado físico (`DELETE`) de reseñas o comentarios moderados — usar borrado lógico via `status`.
- ❌ No commitear código sin probar que al menos compila/levanta.

---

## Roadmap del Proyecto (Orden de Desarrollo)

Las features se implementan en este orden, una por commit. Cada paso debe quedar funcional antes de pasar al siguiente.

1. ✅ Estructura inicial de carpetas (`backend/` y `frontend/`).
2. ⬜ Conexión a Neon y modelos SQLAlchemy de las 6 entidades.
3. ⬜ Migraciones iniciales y carga de géneros base.
4. ⬜ Endpoints de registro y login con JWT (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`).
5. ⬜ Página de registro y login en el frontend con validación.
6. ⬜ CRUD de reseñas — primero crear y listar, luego editar y borrar lógicamente.
7. ⬜ Página de feed (`/`) que muestra las reseñas más recientes con sus portadas.
8. ⬜ Página de detalle de reseña con sistema de comentarios.
9. ⬜ Sistema de votación con actualización dinámica.
10. ⬜ Filtros por género en el catálogo.
11. ⬜ Panel de administración con los 5 módulos CRUD.
12. ⬜ Mejoras visuales (heros con video, animaciones, responsive fino).
13. ⬜ Documentación final y despliegue (Render para backend, Vercel para frontend).

Marca cada paso con ✅ cuando se complete y commitea el cambio.

---

## Variables de Entorno Requeridas (`backend/.env`)

```
DATABASE_URL=postgresql://usuario:contraseña@host.neon.tech/dbname
JWT_SECRET_KEY=una-cadena-larga-y-aleatoria-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

`backend/.env.example` debe tener estas mismas variables pero con valores de placeholder, y SÍ se sube a Git como referencia.

---

## Comandos Frecuentes

### Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload          # Iniciar servidor de desarrollo
pip install -r requirements.txt    # Instalar dependencias
pip freeze > requirements.txt      # Actualizar dependencias
```

### Frontend
```powershell
cd frontend
npm install                        # Instalar dependencias
npm run dev                        # Iniciar servidor de desarrollo
npm run build                      # Compilar para producción
```

### Git
```powershell
git add .
git commit -m "feat: descripción breve del cambio"
git push origin main
```

Convenciones de mensajes de commit (en español):
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `style:` cambios visuales o de formato
- `refactor:` reestructuración sin cambiar funcionalidad
- `docs:` cambios en documentación
- `chore:` mantenimiento, configuración

---

## Notas Finales para Claude Code

- Antes de crear un nuevo archivo, verifica si ya existe uno similar.
- Antes de instalar una dependencia, asegúrate de que no esté ya en `requirements.txt` o `package.json`.
- Si algo del modelo de datos cambia, actualiza este archivo CLAUDE.md.
- Si propones desviarte del stack o las convenciones (por ejemplo, sugerir una librería que no está aquí), explícalo y pide confirmación antes de implementarlo.
- Cuando termines una feature, recuerda marcar el roadmap arriba.
- Procura no hacer tantos comentarios, solo los necesarios.
