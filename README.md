# Readit

Plataforma web colaborativa de reseñas literarias, estilo Reddit.

- **Backend:** FastAPI + PostgreSQL (Neon)
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS

---

## Requisitos previos

- Python 3.10+
- Node.js 18+
- npm 9+

---

## Instalación

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Copia `.env.example` a `.env` y completa las variables:

```powershell
Copy-Item .env.example .env
```

### Frontend

```powershell
cd frontend
npm install
```

---

## Ejecución

Abre **dos terminales de PowerShell** desde la raíz del proyecto.

### Terminal 1 — Backend

```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

El backend queda disponible en `http://localhost:8000`.  
Documentación interactiva en `http://localhost:8000/docs`.

### Terminal 2 — Frontend

```powershell
cd frontend
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

---

## Estructura del proyecto

```
readit/
├── backend/
│   ├── main.py          # Entry point FastAPI
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   ├── schemas/
│   └── routers/
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        ├── hooks/
        ├── lib/
        └── types/
```

---

## Autor

Leonardo Chapal Díaz — ParqueSoftTI, Cohorte 37
