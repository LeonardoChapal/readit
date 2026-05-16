"""Poblar la base de datos con datos de ejemplo.
Ejecutar desde backend/: .\\venv\\Scripts\\python.exe seed_db.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
from database import SessionLocal
from models.user import User
from models.genre import Genre
from models.book import Book
from models.tag import Tag, BookTag
from models.review import Review
from models.reading_list import ReadingList


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def main():
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == "ana_lectora").first():
            print("La base de datos ya tiene datos de ejemplo.")
            return

        # ── GÉNEROS ──────────────────────────────────────────────────────────
        print("Creando géneros...")
        genre_names = [
            "Ficción", "Ciencia ficción", "Fantasía", "Terror",
            "Thriller", "Romance", "Historia", "No ficción", "Ensayo", "Poesía",
        ]
        genres: dict[str, Genre] = {}
        for name in genre_names:
            g = db.query(Genre).filter(Genre.name == name).first()
            if not g:
                g = Genre(name=name)
                db.add(g)
                db.flush()
            genres[name] = g

        # ── ETIQUETAS ────────────────────────────────────────────────────────
        print("Creando etiquetas...")
        tag_names = [
            "realismo mágico", "distopía", "aventura", "misterio",
            "clásico", "bestseller", "adaptado al cine",
            "ciencia ficción dura", "novela negra", "suspenso",
        ]
        tags: dict[str, Tag] = {}
        for name in tag_names:
            t = db.query(Tag).filter(Tag.name == name).first()
            if not t:
                t = Tag(name=name)
                db.add(t)
                db.flush()
            tags[name] = t

        # ── LIBROS ───────────────────────────────────────────────────────────
        print("Creando libros...")
        books_data = [
            ("Cien años de soledad",            "Gabriel García Márquez", 1967, "Ficción",        ["realismo mágico", "clásico", "bestseller"]),
            ("El amor en los tiempos del cólera","Gabriel García Márquez", 1985, "Ficción",        ["realismo mágico", "clásico"]),
            ("La casa de los espíritus",         "Isabel Allende",         1982, "Ficción",        ["realismo mágico"]),
            ("Pedro Páramo",                     "Juan Rulfo",             1955, "Ficción",        ["realismo mágico", "clásico"]),
            ("Rayuela",                          "Julio Cortázar",         1963, "Ficción",        ["clásico"]),
            ("1984",                             "George Orwell",          1949, "Ciencia ficción", ["distopía", "clásico", "adaptado al cine"]),
            ("Un mundo feliz",                   "Aldous Huxley",          1932, "Ciencia ficción", ["distopía", "clásico"]),
            ("Dune",                             "Frank Herbert",          1965, "Ciencia ficción", ["ciencia ficción dura", "bestseller", "aventura"]),
            ("Fundación",                        "Isaac Asimov",           1951, "Ciencia ficción", ["ciencia ficción dura", "clásico"]),
            ("El marciano",                      "Andy Weir",              2011, "Ciencia ficción", ["aventura", "bestseller", "adaptado al cine"]),
            ("El señor de los anillos",          "J.R.R. Tolkien",        1954, "Fantasía",        ["clásico", "aventura", "adaptado al cine"]),
            ("Harry Potter y la piedra filosofal","J.K. Rowling",          1997, "Fantasía",        ["aventura", "bestseller", "adaptado al cine"]),
            ("El nombre del viento",             "Patrick Rothfuss",       2007, "Fantasía",        ["aventura", "bestseller"]),
            ("El código Da Vinci",               "Dan Brown",              2003, "Thriller",        ["misterio", "bestseller", "adaptado al cine"]),
            ("La chica del tren",                "Paula Hawkins",          2015, "Thriller",        ["misterio", "suspenso", "bestseller"]),
            ("Gone Girl",                        "Gillian Flynn",          2012, "Thriller",        ["suspenso", "novela negra", "adaptado al cine"]),
            ("It",                               "Stephen King",           1986, "Terror",          ["clásico", "adaptado al cine"]),
            ("El resplandor",                    "Stephen King",           1977, "Terror",          ["clásico", "adaptado al cine"]),
            ("Drácula",                          "Bram Stoker",            1897, "Terror",          ["clásico"]),
            ("Orgullo y prejuicio",              "Jane Austen",            1813, "Romance",         ["clásico", "adaptado al cine"]),
            ("Sapiens",                          "Yuval Noah Harari",      2011, "No ficción",      ["bestseller"]),
            ("El mundo de Sofía",                "Jostein Gaarder",        1991, "No ficción",      ["bestseller"]),
        ]

        book_objs: dict[str, Book] = {}
        for title, author, year, genre_name, book_tag_names in books_data:
            b = db.query(Book).filter(Book.title == title).first()
            if not b:
                b = Book(title=title, author=author, year=year, genre_id=genres[genre_name].id)
                db.add(b)
                db.flush()
                for tag_name in book_tag_names:
                    if tag_name in tags:
                        db.add(BookTag(book_id=b.id, tag_id=tags[tag_name].id))
                db.flush()
            book_objs[title] = b

        db.commit()

        # ── USUARIOS ─────────────────────────────────────────────────────────
        print("Creando usuarios...")
        users_data = [
            ("ana_lectora",  "ana@readit.com",    "lectura123"),
            ("carlos_books", "carlos@readit.com", "lectura123"),
            ("sofia_lee",    "sofia@readit.com",  "lectura123"),
        ]
        user_objs: dict[str, User] = {}
        for username, email, password in users_data:
            u = User(username=username, email=email, password_hash=hash_pw(password), onboarding_completed=True)
            db.add(u)
            db.flush()
            user_objs[username] = u
        db.commit()

        # ── RESEÑAS ──────────────────────────────────────────────────────────
        print("Creando reseñas...")
        reviews_data = [
            (
                "ana_lectora", "Cien años de soledad",
                "Un viaje mágico por Colombia",
                "Una de las obras más impresionantes de la literatura universal. García Márquez tejió una saga familiar tan rica y compleja que uno se pierde en Macondo sin querer volver. El realismo mágico alcanza aquí su expresión más pura: lo extraordinario ocurre con la misma naturalidad que lo cotidiano, y esa es precisamente su magia.",
                5,
            ),
            (
                "carlos_books", "Cien años de soledad",
                "El realismo mágico en su máxima expresión",
                "Pocas novelas logran construir un universo tan completo y coherente. La genealogía de los Buendía es fascinante y a veces confusa, pero eso es exactamente lo que la hace tan humana. Una obra que no se olvida jamás.",
                5,
            ),
            (
                "sofia_lee", "1984",
                "Una advertencia que sigue más vigente que nunca",
                "Orwell escribió una pesadilla política que hoy parece más relevante que nunca. La sociedad de vigilancia total retratada en esta novela da escalofríos no porque sea ficción, sino porque cada día se parece más a la realidad. Lectura absolutamente obligatoria.",
                5,
            ),
            (
                "ana_lectora", "El señor de los anillos",
                "La obra cumbre de la fantasía moderna",
                "Tolkien construyó un mundo tan detallado y coherente que da la impresión de ser real. Los idiomas, la historia, la geografía, todo encaja perfectamente. Una aventura épica sin igual en la literatura fantástica.",
                5,
            ),
            (
                "carlos_books", "Harry Potter y la piedra filosofal",
                "La magia que marcó a toda una generación",
                "Aunque ya es un clásico moderno, la primera entrega sigue siendo encantadora. Rowling logró algo extraordinario: crear un universo que los lectores de todas las edades quieren habitar. La introducción a Hogwarts todavía eriza la piel.",
                4,
            ),
            (
                "sofia_lee", "Sapiens",
                "Una perspectiva que cambia cómo te ves a ti mismo",
                "Harari logra explicar la historia de nuestra especie de forma accesible y profundamente provocadora. Cada capítulo cambia la manera en que te ves a ti mismo y a la sociedad. Después de leer este libro, el mundo parece diferente.",
                4,
            ),
            (
                "carlos_books", "Dune",
                "La ciencia ficción más ambiciosa jamás escrita",
                "Herbert construyó un universo político, ecológico y filosófico de una profundidad asombrosa. La historia de Paul Atreides es épica en todos los sentidos. No es lectura fácil, pero la recompensa es enorme.",
                5,
            ),
            (
                "ana_lectora", "Drácula",
                "El clásico del terror que nunca envejece",
                "Leída en formato epistolar, la historia de Drácula mantiene la tensión de principio a fin. Stoker fue un maestro del suspenso y la atmósfera. Lo que más sorprende es cuánto influyó en el género del terror posterior.",
                4,
            ),
            (
                "sofia_lee", "Orgullo y prejuicio",
                "El romance más inteligente de la literatura",
                "Austen escribe con una ironía y agudeza que pocas plumas han igualado. Elizabeth Bennet es uno de los personajes más brillantes de la historia literaria. No es solo una historia de amor, es una crítica social demoledora.",
                5,
            ),
            (
                "carlos_books", "La casa de los espíritus",
                "Allende en estado puro",
                "Allende demuestra que el realismo mágico no es exclusividad de García Márquez. La historia de los Trueba es poderosa, emotiva y política a partes iguales. Una novela que te atrapa desde la primera página.",
                4,
            ),
            (
                "ana_lectora", "El código Da Vinci",
                "Un thriller imposible de soltar",
                "Dan Brown sabe perfectamente cómo mantener la tensión capítulo a capítulo. La historia de Robert Langdon persiguiendo pistas por toda Europa es adictiva y muy bien documentada. Perfecto para una tarde de lectura intensa.",
                4,
            ),
            (
                "sofia_lee", "It",
                "El terror que te sigue en los sueños",
                "Stephen King es el maestro del horror, y It es su obra más ambiciosa. No es solo un libro de miedo, es una historia profunda sobre la infancia, la amistad y los miedos que nos persiguen toda la vida.",
                4,
            ),
            (
                "ana_lectora", "Fundación",
                "Un clásico que define la ciencia ficción",
                "Asimov construyó una historia sobre el colapso y la reconstrucción de una civilización galáctica con una visión que pocas obras han igualado. Fundación es el pilar sobre el que se apoya toda la ciencia ficción moderna.",
                5,
            ),
            (
                "carlos_books", "Pedro Páramo",
                "Un sueño entre los muertos",
                "Rulfo escribió una de las novelas más originales y perturbadoras del siglo XX. Comala es un lugar que existe entre la vida y la muerte, y la prosa fragmentada de Rulfo captura esa ambigüedad de forma magistral.",
                5,
            ),
        ]

        for username, book_title, title, content, rating in reviews_data:
            user = user_objs.get(username)
            book = book_objs.get(book_title)
            if not user or not book:
                continue
            db.add(Review(
                user_id=user.id,
                book_id=book.id,
                title=title,
                content=content,
                rating=rating,
                score=0,
            ))
        db.commit()

        # ── LISTAS DE LECTURA ────────────────────────────────────────────────
        print("Creando listas de lectura...")
        rl_data = [
            ("ana_lectora",  "Cien años de soledad",             "read"),
            ("ana_lectora",  "El señor de los anillos",          "read"),
            ("ana_lectora",  "Drácula",                          "read"),
            ("ana_lectora",  "El código Da Vinci",               "read"),
            ("ana_lectora",  "Fundación",                        "read"),
            ("ana_lectora",  "Dune",                             "want_to_read"),
            ("ana_lectora",  "Sapiens",                          "want_to_read"),
            ("ana_lectora",  "Rayuela",                          "reading"),
            ("carlos_books", "Cien años de soledad",             "read"),
            ("carlos_books", "Harry Potter y la piedra filosofal","read"),
            ("carlos_books", "Dune",                             "read"),
            ("carlos_books", "La casa de los espíritus",         "read"),
            ("carlos_books", "Pedro Páramo",                     "read"),
            ("carlos_books", "1984",                             "reading"),
            ("carlos_books", "El nombre del viento",             "want_to_read"),
            ("carlos_books", "Gone Girl",                        "want_to_read"),
            ("sofia_lee",    "1984",                             "read"),
            ("sofia_lee",    "Sapiens",                          "read"),
            ("sofia_lee",    "Orgullo y prejuicio",              "read"),
            ("sofia_lee",    "It",                               "read"),
            ("sofia_lee",    "El mundo de Sofía",                "read"),
            ("sofia_lee",    "Un mundo feliz",                   "reading"),
            ("sofia_lee",    "Pedro Páramo",                     "want_to_read"),
            ("sofia_lee",    "La chica del tren",                "want_to_read"),
        ]

        for username, book_title, status in rl_data:
            user = user_objs.get(username)
            book = book_objs.get(book_title)
            if not user or not book:
                continue
            existing = db.query(ReadingList).filter(
                ReadingList.user_id == user.id,
                ReadingList.book_id == book.id,
            ).first()
            if not existing:
                db.add(ReadingList(user_id=user.id, book_id=book.id, status=status))
        db.commit()

        print("Seed completado exitosamente!")
        print("  Usuarios: ana_lectora, carlos_books, sofia_lee  (contraseña: lectura123)")
        print(f"  Libros: {len(books_data)}")
        print(f"  Reseñas: {len(reviews_data)}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
