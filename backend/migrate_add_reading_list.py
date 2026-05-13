from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS reading_list (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES "user"(id),
            book_id INTEGER NOT NULL REFERENCES book(id),
            status VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            CONSTRAINT uq_reading_list_user_book UNIQUE (user_id, book_id)
        )
    """))
    conn.commit()
    print("Tabla reading_list creada.")
