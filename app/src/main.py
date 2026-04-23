from init_db import init_db

def main() -> None:
    init_db()
    print("База данных успешно инициализирована")

if __name__ == "__main__":
    main()