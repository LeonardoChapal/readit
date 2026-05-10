from dotenv import load_dotenv
load_dotenv()

from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE review ADD COLUMN rating INTEGER"))
        conn.commit()
        print("Columna 'rating' añadida correctamente.")
    except Exception as e:
        print(f"No se pudo añadir (puede que ya exista): {e}")
