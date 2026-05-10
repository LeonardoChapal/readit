from database import Base, engine, SessionLocal
from models.genre import Genre
from models.user import User
from models.book import Book
from models.review import Review
from models.comment import Comment
from models.vote import Vote

GENRES = [
    "Ficción", "No ficción", "Fantasía", "Ciencia ficción",
    "Romance", "Ensayo", "Terror", "Thriller", "Historia", "Poesía",
]


def init():
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas.")

    db = SessionLocal()
    try:
        existing = db.query(Genre).count()
        if existing == 0:
            db.add_all([Genre(name=g) for g in GENRES])
            db.commit()
            print(f"{len(GENRES)} géneros insertados.")
        else:
            print("Géneros ya existentes, se omite la carga.")
    finally:
        db.close()


if __name__ == "__main__":
    init()
