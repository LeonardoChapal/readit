from dotenv import load_dotenv
load_dotenv()

import sys
from database import SessionLocal
from models.user import User


def make_admin(email: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"No se encontró ningún usuario con email '{email}'")
            return
        user.role = "admin"
        db.commit()
        print(f"Listo: '{user.username}' ahora es administrador")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python make_admin.py <email>")
        sys.exit(1)
    make_admin(sys.argv[1])
