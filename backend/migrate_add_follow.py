from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS follow (
            id SERIAL PRIMARY KEY,
            follower_id INTEGER NOT NULL REFERENCES "user"(id),
            following_id INTEGER NOT NULL REFERENCES "user"(id),
            created_at TIMESTAMP DEFAULT now(),
            CONSTRAINT uq_follow UNIQUE (follower_id, following_id)
        )
    """))
    conn.commit()
    print("Tabla follow creada.")
