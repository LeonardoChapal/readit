# Readit

Plataforma web colaborativa de reseñas literarias, estilo Reddit. Los usuarios descubren libros, publican reseñas, votan, comentan y reciben recomendaciones personalizadas según sus intereses.

- **Backend:** Python 3.10+, FastAPI, SQLAlchemy 2.0, PostgreSQL (Neon)
- **Frontend:** React 19, TypeScript, Vite 8, TailwindCSS v4
- **Despliegue:** Render (backend) · Vercel (frontend)

---

## Funcionalidades

- Registro e inicio de sesión con JWT
- Onboarding: selección de géneros y etiquetas favoritas al registrarse
- Feed global con ordenamiento (más votadas, más recientes, mayor calificación)
- Feed personalizado de usuarios seguidos
- Recomendaciones personalizadas basadas en intereses del usuario
- Publicar, editar y compartir reseñas con calificación de estrellas (1–5)
- Comentarios en reseñas
- Votos (+1 / -1) en reseñas con sistema de puntos
- Lista de lectura por estado (Quiero leer / Leyendo / Ya leí)
- Seguir y dejar de seguir a otros usuarios
- Etiquetas temáticas en libros (ej. "realismo mágico", "narrador no confiable")
- Búsqueda de libros, reseñas y usuarios
- Sección *Trending* semanal en el home
- Perfil de usuario con estadísticas, libros similares y lista de lectura
- Notificaciones (comentarios, votos, nuevos seguidores)
- Modo oscuro
- Panel de administración (libros, reseñas, comentarios, géneros, etiquetas, usuarios)
- Importación de libros desde Open Library

---

## Requisitos previos

- Python 3.10+
- Node.js 18+
- npm 9+

---

## Instalación local

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Crea el archivo `.env` en `backend/` con las siguientes variables:

```env
DATABASE_URL=postgresql://usuario:contraseña@host.neon.tech/dbname
JWT_SECRET_KEY=una-clave-larga-y-segura
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

### Frontend

```powershell
cd frontend
npm install
```

Crea el archivo `.env` en `frontend/` con:

```env
VITE_API_URL=http://localhost:8000
```

---

## Ejecución

Abre **dos terminales** desde la raíz del proyecto.

### Terminal 1 — Backend

```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

Disponible en `http://localhost:8000`.  
Documentación interactiva en `http://localhost:8000/docs`.

### Terminal 2 — Frontend

```powershell
cd frontend
npm run dev
```

Disponible en `http://localhost:5173`.

---

## Migraciones

Las migraciones son scripts manuales en `backend/`. Para ejecutar una:

```powershell
cd backend
.\venv\Scripts\activate
python migrate_<nombre>.py
```

Scripts disponibles:
- `migrate_add_reading_list.py`
- `migrate_add_follow.py`
- `migrate_add_notification.py`
- `migrate_recommendation_system.py` — tablas de recomendaciones, etiquetas e historial de actividad

---

## Estructura del proyecto

```
readit/
├── backend/
│   ├── main.py                  # Entry point FastAPI
│   ├── database.py
│   ├── auth.py
│   ├── requirements.txt
│   ├── models/
│   │   ├── user.py
│   │   ├── book.py
│   │   ├── review.py
│   │   ├── comment.py
│   │   ├── vote.py
│   │   ├── genre.py
│   │   ├── reading_list.py
│   │   ├── follow.py
│   │   ├── notification.py
│   │   ├── tag.py              # Tag + BookTag
│   │   ├── user_interest.py
│   │   ├── user_activity.py
│   │   ├── user_group.py       # UserGroup + Membership + Affinity
│   │   └── recommendation_cache.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── book.py
│   │   ├── review.py
│   │   ├── comment.py
│   │   ├── genre.py
│   │   ├── reading_list.py
│   │   ├── tag.py
│   │   └── recommendation.py
│   └── routers/
│       ├── auth.py
│       ├── books.py
│       ├── reviews.py
│       ├── comments.py
│       ├── genres.py
│       ├── users.py
│       ├── admin.py
│       ├── search.py
│       ├── reading_list.py
│       ├── feed.py
│       ├── notifications.py
│       ├── tags.py
│       ├── onboarding.py
│       ├── activity.py
│       └── recommendations.py
└── frontend/
    └── src/
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── BookPage.tsx
        │   ├── ReviewDetailPage.tsx
        │   ├── CreateReviewPage.tsx
        │   ├── ExplorePage.tsx
        │   ├── ProfilePage.tsx
        │   ├── SearchPage.tsx
        │   ├── OnboardingPage.tsx
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── NotFoundPage.tsx
        │   └── admin/
        │       ├── DashboardPage.tsx
        │       ├── BooksPage.tsx
        │       ├── UsersPage.tsx
        │       ├── ReviewsPage.tsx
        │       ├── CommentsPage.tsx
        │       ├── GenresPage.tsx
        │       └── TagsPage.tsx
        ├── components/
        │   ├── Navbar.tsx
        │   ├── ReviewCard.tsx
        │   ├── BookCover.tsx
        │   ├── SearchBar.tsx
        │   ├── StarRating.tsx
        │   ├── UserAvatar.tsx
        │   ├── Highlight.tsx
        │   ├── AdminLayout.tsx
        │   └── AdminRoute.tsx
        ├── hooks/
        │   ├── useAuth.tsx
        │   ├── useActivity.ts
        │   └── useTheme.ts
        ├── lib/
        │   └── api.ts
        └── types/
            ├── auth.ts
            ├── book.ts
            ├── review.ts
            ├── reading_list.ts
            ├── recommendation.ts
            └── user.ts
```

---

## Despliegue

### Backend — Render

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Variables de entorno: `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRATION_MINUTES`, `CORS_ORIGINS`

### Frontend — Vercel

- Root directory: `frontend`
- Variable de entorno: `VITE_API_URL=https://tu-backend.onrender.com`

---

## Autor

Leonardo Chapal Díaz — ParqueSoftTI, Cohorte 37
