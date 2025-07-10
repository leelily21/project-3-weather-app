import os
import httpx # Библиотека для асинхронных HTTP запросов
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv # Для загрузки переменных из .env файла

# Загружаем переменные окружения из .env файла
load_dotenv()

app = FastAPI()

# --- Настройка CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Получение API ключа и базового URL ---
API_KEY = os.getenv("OPENWEATHER_API_KEY")
WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

# --- Эндпоинт API ---
@app.get("/api/weather/{city}")
async def get_weather(city: str):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key is not configured")

    # Параметры для запроса к OpenWeatherMap
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric",  # для получения температуры в Цельсиях
        "lang": "ru"        # для получения описания на русском
    }

    # Асинхронно запрашиваем данные с погодного сервиса
    async with httpx.AsyncClient() as client:
        response = await client.get(WEATHER_BASE_URL, params=params)

    # Обработка ошибок
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="City not found")
    if response.status_code != 200:
        # Возвращаем текст ошибки от самого API OpenWeather
        error_detail = response.json().get("message", "Error fetching weather data")
        raise HTTPException(status_code=response.status_code, detail=error_detail)

    data = response.json()

    # Возвращаем только нужную нам часть данных
    relevant_data = {
        "city_name": data["name"],
        "temperature": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"]
    }

    return relevant_data

@app.get("api/weather/coords")
async def get_weather_by_coords(lat: float, lon: float):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key is not configured")
    
    params ={
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
        "lang": "ru"        
        }
    async with httpx.AsyncClient() as client:
        response = await client.get(WEATHER_BASE_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Ошибка определении координат")
    data = response.json()

    return {
        "city_name": data["name"],
        "temperature": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"]
    }

@app.get("/api/forecast/{city}")
async def get_forecast(city: str):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key is not configured")
    
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric",
        "lang": "ru"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(FORECAST_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Ошибка получения координат")
    
    data = response.json()

    forecast_list = []

    for entry in data["list"]:
        if entry["dt_txt"].endswith("12:00:00"):
            forecast_list.append({
                "date": entry["dt_txt"].split(" ")[0],
                "temperature": entry["main"]["temp"],
                "description": entry["weather"][0]["description"],
                "icon": entry["weather"][0]["icon"]
            })
    return {
        "city": data["city"]["name"],
        "forecast": forecast_list
    }