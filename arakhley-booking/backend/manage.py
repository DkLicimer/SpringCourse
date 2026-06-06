import os
import sys


def main():
    """Запуск административных задач."""
    # Указываем Django, что настройки нашего проекта лежат в config/settings.py
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Не удалось импортировать Django. Убедитесь, что оно установлено, "
            "доступно в вашей переменной окружения PYTHONPATH и вы не забыли "
            "активировать виртуальное окружение."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()