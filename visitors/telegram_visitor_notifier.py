import os
import json
import time
import requests
from datetime import datetime, timedelta

# --- Загрузка конфигурации ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

try:
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        config = json.load(f)
except FileNotFoundError:
    print(f"Ошибка: Файл конфигурации {CONFIG_FILE} не найден. Убедитесь, что он существует и доступен.")
    exit(1)
except json.JSONDecodeError:
    print(f"Ошибка: Файл конфигурации {CONFIG_FILE} содержит некорректный JSON.")
    exit(1)

TELEGRAM_BOT_TOKEN = config.get("telegram_bot_token")
TELEGRAM_CHAT_ID = config.get("telegram_chat_id")
LOG_DIR = config.get("log_dir")
CHECK_INTERVAL_SECONDS = config.get("check_interval_seconds", 300) # По умолчанию 300 секунд

# Проверка, что критические параметры загружены
if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID or not LOG_DIR:
    print("Ошибка: В файле конфигурации отсутствуют TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID или LOG_DIR.")
    exit(1)

# --- Файл для хранения состояния обработанных сессий ---
PROCESSED_SESSIONS_FILE = os.path.join(LOG_DIR, "processed_sessions.json")

# --- Функция отправки сообщения в Telegram API ---
def send_telegram_message(message):
    """Отправляет отформатированное сообщение в указанный Telegram чат."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        # print(f"Telegram-сообщение отправлено: {message[:50]}...") # Закомментировано для чистоты лога, можно раскомментировать для отладки
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при отправке Telegram-сообщения: {e}")

# --- Управление состоянием (какие сессии уже были обработаны) ---
def load_processed_sessions():
    """Загружает данные об обработанных сессиях из JSON-файла."""
    if os.path.exists(PROCESSED_SESSIONS_FILE):
        with open(PROCESSED_SESSIONS_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                print(f"Предупреждение: файл {PROCESSED_SESSIONS_FILE} поврежден или пуст. Начинаем с чистого листа.")
                return {}
    return {}

def save_processed_sessions(processed_data):
    """Сохраняет данные об обработанных сессиях в JSON-файл."""
    with open(PROCESSED_SESSIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, indent=4)

# --- Основная логика бота ---
def run_bot():
    """Запускает бота для мониторинга логов и отправки уведомлений."""
    processed_sessions = load_processed_sessions()
    print("Бот запущен. Мониторинг client-info логов...")

    # Устанавливаем текущий день, чтобы пересоздавать processed_sessions для нового дня
    last_checked_day = datetime.now().strftime("%Y-%m-%d")

    while True:
        current_day_str = datetime.now().strftime("%Y-%m-%d")

        # Если день сменился, очищаем/инициализируем processed_sessions для нового дня
        if current_day_str != last_checked_day:
            processed_sessions[current_day_str] = []
            # Очищаем старые записи (старше 7 дней) при смене дня
            seven_days_ago = datetime.now() - timedelta(days=7)
            keys_to_delete = [
                date_str for date_str in processed_sessions
                if datetime.strptime(date_str, "%Y-%m-%d") < seven_days_ago
            ]
            for key in keys_to_delete:
                del processed_sessions[key]
            save_processed_sessions(processed_sessions)
            last_checked_day = current_day_str
            print(f"День сменился на {current_day_str}. Сброс обработанных сессий для нового дня.")


        log_file_name = f"client-info-{current_day_str}.json"
        log_file_path = os.path.join(LOG_DIR, log_file_name)

        if current_day_str not in processed_sessions:
            processed_sessions[current_day_str] = []

        current_day_processed_sessions_set = set(processed_sessions[current_day_str])
        new_visitors_this_iteration = []

        if not os.path.exists(log_file_path):
            print(f"Файл логов {log_file_name} еще не найден. Ожидаем...")
            time.sleep(CHECK_INTERVAL_SECONDS)
            continue

        try:
            # Читаем файл
            with open(log_file_path, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Ошибка декодирования JSON из {log_file_path}. Возможно, файл не полностью записан или поврежден. Пропускаем эту итерацию.")
            time.sleep(CHECK_INTERVAL_SECONDS)
            continue
        except FileNotFoundError:
            print(f"Файл логов {log_file_name} исчез. Ожидаем...")
            time.sleep(CHECK_INTERVAL_SECONDS)
            continue
        except Exception as e:
            print(f"Непредвиденная ошибка при чтении {log_file_path}: {e}. Пропускаем эту итерацию.")
            time.sleep(CHECK_INTERVAL_SECONDS)
            continue

        for entry in log_data:
            session_id = entry.get("sessionId")
            ip_info = entry.get("ipInfo")

            # Отправляем уведомление, если session_id новый и есть полная информация об IP и устройстве
            # Также проверяем, чтоDeviceInfo присутствует и не пустой (часто первые записи могут быть без него)
            if session_id and session_id not in current_day_processed_sessions_set and ip_info and entry.get("deviceInfo"):
                # Проверяем, что ip_info и deviceInfo не null и содержат полезные данные
                if ip_info.get("ip") and ip_info.get("country") and \
                   entry["deviceInfo"].get("browser") and entry["deviceInfo"].get("os"):
                    new_visitors_this_iteration.append(entry)
                    current_day_processed_sessions_set.add(session_id)
                    processed_sessions[current_day_str].append(session_id) # Добавляем для сохранения

        if new_visitors_this_iteration:
            print(f"Найдено {len(new_visitors_this_iteration)} новый(х) посетитель(ей) за эту итерацию. Отправляем уведомления...")
            for visitor in new_visitors_this_iteration:
                message = format_visitor_message(visitor)
                send_telegram_message(message)
                time.sleep(1) # Небольшая задержка, чтобы избежать превышения лимитов Telegram API

            save_processed_sessions(processed_sessions)
        else:
            print("Новых посетителей в этой итерации не найдено.")

        time.sleep(CHECK_INTERVAL_SECONDS)

def format_visitor_message(visitor_data):
    """Форматирует данные о посетителе в читаемое сообщение для Telegram."""
    timestamp_iso = visitor_data.get("timestamp", "N/A")
    try:
        dt_utc = datetime.fromisoformat(timestamp_iso.replace('Z', '+00:00'))
        display_time = dt_utc.strftime("%Y-%m-%d %H:%M:%S UTC")
    except ValueError:
        display_time = timestamp_iso

    ip_info = visitor_data.get("ipInfo", {})
    device_info = visitor_data.get("deviceInfo", {})

    message = f"<b>🔔 Новый посетитель на Cloud-Hosts.org!</b>\n"
    message += f"🕒 <b>Время:</b> {display_time}\n"

    ip = ip_info.get("ip", "N/A")
    country = ip_info.get("country", "N/A")
    city = ip_info.get("city", "N/A")
    region = ip_info.get("region", "N/A") # Добавлено
    isp = ip_info.get("isp", "N/A")
    proxy = "✅ Да" if ip_info.get("proxy") else "❌ Нет"

    message += f"\n<b>📍 Информация об IP:</b>\n"
    message += f"   IP: <code>{ip}</code>\n"
    message += f"   Страна: {country}\n"
    if city and city != "N/A":
        message += f"   Город: {city}\n"
    if region and region != "N/A" and region != city: # Добавлено, чтобы не дублировать город, если они совпадают
        message += f"   Регион: {region}\n"
    message += f"   Провайдер: {isp}\n"
    message += f"   Proxy/VPN: {proxy}\n"

    browser = device_info.get("browser", "N/A")
    os_name = device_info.get("os", "N/A")
    device_type = device_info.get("deviceType", "N/A")
    resolution = device_info.get("resolution", "N/A")
    language = device_info.get("language", "N/A")
    # Дополнительные проверки WebGL, WebRTC, CookiesEnabled, JavaEnabled (если есть)
    webgl = "✅ Да" if device_info.get("webGL") else "❌ Нет"
    webrtc = "✅ Да" if device_info.get("webRTC") else "❌ Нет"
    cookies = "✅ Да" if device_info.get("cookiesEnabled") else "❌ Нет"

    message += f"\n<b>📱 Информация об устройстве:</b>\n"
    message += f"   Браузер: {browser}\n"
    message += f"   ОС: {os_name}\n"
    message += f"   Тип устройства: {device_type}\n"
    if resolution and resolution != "N/A":
        message += f"   Разрешение: {resolution}\n"
    message += f"   Язык: {language}\n"
    message += f"   WebGL: {webgl}\n"
    message += f"   WebRTC: {webrtc}\n"
    message += f"   Cookies: {cookies}\n"


    local_ip_error = visitor_data.get("localIpError")
    if local_ip_error:
        message += f"   <i>Локальный IP: {local_ip_error}</i>\n"

    return message

# --- Точка входа в скрипт ---
if __name__ == "__main__":
    # Установите права доступа для файла processed_sessions.json
    # Этот файл будет создан в LOG_DIR, убедитесь, что у пользователя 'mister' есть права на запись в LOG_DIR
    processed_sessions_file_path = os.path.join(LOG_DIR, "processed_sessions.json")
    if not os.path.exists(processed_sessions_file_path):
        try:
            # Создаем пустой файл, если его нет
            with open(processed_sessions_file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)
            # Устанавливаем права
            os.chmod(processed_sessions_file_path, 0o640) # rw-r-----
        except Exception as e:
            print(f"Ошибка при инициализации processed_sessions.json: {e}")

    run_bot()

