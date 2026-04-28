import json
from datetime import datetime

import pika

# Параметры подключения
connection_params = pika.ConnectionParameters(
    host='rabbitmq',  # Замените на адрес вашего RabbitMQ сервера
    port=5672,  # Порт по умолчанию для RabbitMQ
    virtual_host='/',  # Виртуальный хост (обычно '/')
    credentials=pika.PlainCredentials(
        username='rmuser',  # Имя пользователя по умолчанию
        password='rmpassword'  # Пароль по умолчанию
    ),
    heartbeat=30,
    blocked_connection_timeout=2
)
queue_name = 'ml_task_queue'

def send_task(task_id: int, user_id: int, image_b64: str):
    connection = pika.BlockingConnection(connection_params)
    channel = connection.channel()

    # Отправка сообщения
    channel.queue_declare(queue=queue_name, durable=True)  # Создание очереди (если не существует)

    channel.basic_publish(
        exchange='',
        routing_key=queue_name,
        body=json.dumps({
            "task_id":task_id,
            "user_id":user_id,
            "image_b64": image_b64,
            "time": datetime.now().isoformat()
        }),
        properties=pika.BasicProperties(delivery_mode=2)
    )

    # Закрытие соединения
    connection.close()