# ML Predict Service

Сервис распознавания математических формул на изображениях с выводом LaTeX-кода.

## Стек

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **ML Worker**: RabbitMQ
- **Frontend**: Next.js
- **Инфраструктура**: Docker Compose

## Запуск проекта

### Требования

- Docker
- Docker Compose

### Шаги

1. Клонировать репозиторий:
```bash
git clone <ссылка на репозиторий>
cd HW2
```

2. Создать файл `app/.env` на основе примера:
```bash
cp app/.env.example app/.env
```

3. Заполнить `app/.env` своими значениями (SECRET_KEY — любая случайная строка).

4. Запустить проект:
```bash
docker-compose up --build --scale ml_worker=2
```

5. Открыть в браузере:
   - Веб-интерфейс: http://localhost
   - Swagger API: http://localhost/api/docs

## Запуск тестов

```bash
docker-compose exec app pytest tests/ -v
```

## Функциональность

- Регистрация и авторизация через JWT
- Пополнение баланса кредитов
- Загрузка изображений формул на распознавание
- Получение результата в формате LaTeX
- История задач и транзакций
- REST API с документацией Swagger