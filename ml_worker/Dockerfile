FROM lukasblecher/pix2tex

WORKDIR /app

COPY main.py /app/main.py

RUN pip install --no-cache-dir pika requests

ENTRYPOINT ["python", "/app/main.py"]