import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import time
import os
import sys

# Подключаем пути вашего проекта
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from src.multi_agent_system.agent_platform import MASPlatform
from src.multi_agent_system.agents.base_agent import BaseAgent

# --- Настройка страницы ---
st.set_page_config(page_title="MAS Fault Diagnosis", layout="wide", page_icon="🏭")
st.title("🏭 Интеллектуальная система диагностики отказов (MAS)")
st.markdown("Визуализация работы мультиагентной системы извлечения правил отказов временных рядов.")

# --- Загрузка данных ---
DATA_PATH = "data/processed/processed_sensor_data.csv"
RESULTS_PATH = "data/processed/anomaly_detection_results.csv"
RULES_PATH = "data/rules/extracted_fault_rules.csv"

@st.cache_data
def load_data():
    if not os.path.exists(DATA_PATH):
        return None, None, None
    df_data = pd.read_csv(DATA_PATH)
    df_results = pd.read_csv(RESULTS_PATH)
    df_rules = pd.read_csv(RULES_PATH)
    return df_data, df_results, df_rules

df_data, df_results, df_rules = load_data()

if df_data is None:
    st.error("⚠️ Данные не найдены! Сначала запустите `python main.py`, чтобы сгенерировать файлы.")
    st.stop()

# --- Вкладки UI ---
tab1, tab2, tab3, tab4 = st.tabs(["📈 Сырые данные", "🔍 Детектор (LSTM)", "🧠 База знаний", "🤖 Мультиагентная симуляция"])

# Вкладка 1: Данные
with tab1:
    st.header("Временные ряды (Показания датчиков)")
    sensor = st.selectbox("Выберите датчик", df_data.columns[1:], index=2) # Индекс 2 это вибрация
    fig = px.line(df_data, x='timestamp', y=sensor, title=f'Показания: {sensor}')
    st.plotly_chart(fig, use_container_width=True)

# Вкладка 2: LSTM
with tab2:
    st.header("Результаты детектирования аномалий")
    sensor_res = st.selectbox("Выберите датчик для анализа ошибки", ['temperature_sensor_1', 'vibration_sensor_1', 'motor_current_sensor_1'])
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df_results['timestamp'], y=df_results[f'{sensor_res}_error'], name='MSE Ошибка', line=dict(color='blue')))
    
    # Отмечаем аномалии красными точками
    anomalies = df_results[df_results[f'{sensor_res}_is_anomaly'] == 1]
    fig.add_trace(go.Scatter(x=anomalies['timestamp'], y=anomalies[f'{sensor_res}_error'], 
                             mode='markers', marker=dict(color='red', size=6), name='Аномалия'))
    
    st.plotly_chart(fig, use_container_width=True)

# Вкладка 3: Data Mining
with tab3:
    st.header("Извлеченные ассоциативные правила (Алгоритм Apriori)")
    st.markdown("База знаний, которую использует Главный Агент для постановки диагноза.")
    
    # Форматируем таблицу для красоты
    formatted_rules = df_rules.copy()
    formatted_rules['confidence'] = (formatted_rules['confidence'] * 100).round(2).astype(str) + '%'
    formatted_rules['support'] = (formatted_rules['support'] * 100).round(2).astype(str) + '%'
    st.dataframe(formatted_rules, use_container_width=True)

# Вкладка 4: РЕАЛЬНЫЕ АГЕНТЫ
with tab4:
    st.header("Симуляция Мультиагентной Системы в реальном времени")
    
    col1, col2 = st.columns([1, 3])
    
    with col1:
        speed = st.slider("Скорость симуляции (сек/шаг)", 0.0, 0.5, 0.05, step=0.01)
        start_btn = st.button("🚀 Запустить агентов", type="primary", use_container_width=True)
        st.markdown("---")
        st.markdown("**Статус системы:**")
        status_text = st.empty()
        status_text.success("Ожидание запуска...")
    
    with col2:
        progress_bar = st.progress(0)
        
        # Контейнер для вывода важного диагноза (CEO)
        diagnosis_container = st.empty()
        
        # Контейнер для терминала агентов
        st.markdown("### Внутренняя шина сообщений (EventBus)")
        terminal_container = st.empty()

    if start_btn:
        status_text.warning("Симуляция выполняется...")
        
        # Инициализируем хранилище логов
        log_history = []
        
        # Функция-колбэк: вызывается КАЖДЫЙ РАЗ, когда ЛЮБОЙ агент вызывает self.log()
        def ui_logger(msg):
            log_history.append(msg)
            
            # Оставляем только последние 20 сообщений, чтобы UI не тормозил
            display_text = "\n".join(log_history[-20:])
            terminal_container.text_area("Логи Агентов", value=display_text, height=300, disabled=True)
            
            # Если пишет CEO (Decision_Maker) - выводим это красиво и крупно!
            if "ДИАГНОЗ ИЗ БАЗЫ ЗНАНИЙ" in msg or "ОБНАРУЖЕНА КОРРЕЛЯЦИЯ" in msg:
                diagnosis_container.error(f"🚨 **КРИТИЧЕСКИЙ АЛЕРТ ОТ МАС:**\n\n{msg}")
            elif "РЕКОМЕНДАЦИЯ" in msg:
                diagnosis_container.warning(f"🛠️ **СОВЕТ ЭКСПЕРТНОЙ СИСТЕМЫ:**\n\n{msg}")

        # Привязываем нашу UI функцию к базовому агенту
        BaseAgent.ui_log_callback = ui_logger
        
        # Колбэк для прогресс-бара
        def update_progress(current, total):
            progress_bar.progress(current / total)

        # ЗАПУСК РЕАЛЬНОГО БЕКЕНДА МАС
        platform = MASPlatform()
        platform.setup_agents()
        
        # Ограничим симуляцию до 3000 строк (момент, где происходит поломка), чтобы не ждать долго
        # В наших данных поломка на 70% от 24 часов (по 1 секунде) - это около 60000 строк.
        # Чтобы сразу показать экшен, мы можем отрезать начало:
        # Для простоты прогоним весь датасет, но сделаем sleep_time только в нужный момент, или просто прогоним быстро.
        platform.run_simulation(sleep_time=speed, progress_callback=update_progress)

        status_text.success("Симуляция завершена!")
        BaseAgent.ui_log_callback = None # Отключаем колбэк