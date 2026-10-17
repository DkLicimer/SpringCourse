#!/bin/sh
set -e

echo "Ожидание готовности PostgreSQL..."
python - << 'EOF'
import socket
import time
import os

host = os.environ.get('POSTGRES_HOST', 'db')
port = int(os.environ.get('POSTGRES_PORT', 5432))

for attempt in range(30):
    try:
        with socket.create_connection((host, port), timeout=2):
            print("PostgreSQL успешно подключен!")
            break
    except Exception as err:
        time.sleep(1)
EOF

exec "$@"