import base64
import io
import pika
import json
import logging
import requests
from pix2tex.cli import LatexOCR
from PIL import Image
model = LatexOCR()

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
# Настройка логирования

connection_params = pika.ConnectionParameters(
    host='rabbitmq',  # Замените на адрес вашего RabbitMQ сервера
    port=5672,          # Порт по умолчанию для RabbitMQ
    virtual_host='/',   # Виртуальный хост (обычно '/')
    credentials=pika.PlainCredentials(
        username='rmuser',  # Имя пользователя по умолчанию
        password='rmpassword'   # Пароль по умолчанию
    ),
    heartbeat=30,
    blocked_connection_timeout=2
)

connection = pika.BlockingConnection(connection_params)
channel = connection.channel()
queue_name = 'ml_task_queue'
channel.queue_declare(queue=queue_name, durable=True)  # Создание очереди (если не существует)


# Функция, которая будет вызвана при получении сообщения
def callback(ch, method, properties, body):
    try:
        message = json.loads(body.decode())
        task_id = message["task_id"]
        logger.info(f"Received: '{task_id}'")
        image_b64 = message["image_b64"]
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes))
        latex = model(image)
        response=requests.post(
            url=f"http://app:8080/predict/{task_id}/result",
            json={"latex": latex}
        )
        response.raise_for_status()
        ch.basic_ack(delivery_tag=method.delivery_tag)  # Ручное подтверждение обработки сообщения
    except Exception as e:
        logger.exception("Worker failed: %s", e)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

channel.basic_qos(prefetch_count=1)
# Подписка на очередь и установка обработчика сообщений
channel.basic_consume(
    queue=queue_name,
    on_message_callback=callback,
    auto_ack=False  # Автоматическое подтверждение обработки сообщений
)

logger.info('Waiting for messages. To exit, press Ctrl+C')
channel.start_consuming()