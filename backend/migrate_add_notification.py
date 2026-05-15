from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS notification (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES "user"(id),
            actor_id INTEGER NOT NULL REFERENCES "user"(id),
            type VARCHAR NOT NULL,
            review_id INTEGER REFERENCES review(id),
            read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT now()
        )
    """))
    conn.commit()
    print("Tabla notification creada.")
