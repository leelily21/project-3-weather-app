'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface WeatherData {
  city_name: string;
  temperature: number;
  description: string;
  icon: string;
}

interface ForecastItem {
  date: string;
  temperature: number;
  description: string;
  icon: string;
}

const API_URL = 'http://localhost:8000/api/weather';

export default function Home() {
  const [city, setCity] = useState('Almaty'); // Город по умолчанию
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true); // true, чтобы загрузка началась сразу
  const [error, setError] = useState('');

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError('');
    setWeather(null);
    try {
      const response = await axios.get(`${API_URL}/${cityName}`);
      setWeather(response.data);
      fetchForecast(cityName);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные о погоде.');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (cityName: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/forecast/${cityName}`);
      setForecast(response.data.forecast);
    } catch (err) {
      console.error('Ошибка загрузки прогноза');
    }
  };

  const fetchByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    setWeather(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/weather/coords`, {
        params: { lat, lon },
      });
      setWeather(response.data);
      fetchForecast(response.data.city_name);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка определения местоположения.');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем погоду при первом рендере
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          fetchByCoords(latitude, longitude);
        },
        () => {
          fetchWeather('Almaty');
        }
      );
    } else {
      fetchWeather('Almaty');
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city.trim());
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 p-4">
      <div className="w-full max-w-sm bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Погода</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Введите город"
            className="flex-grow p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-2 rounded-lg disabled:bg-blue-300"
          >
            {loading ? '...' : '➔'}
          </button>
        </form>

        {loading && <p className="text-center text-gray-700">Загрузка...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {weather && (
          <div className="flex flex-col items-center text-center text-gray-900">
            <h2 className="text-3xl font-semibold">{weather.city_name}</h2>
            <div className="flex items-center">
              <p className="text-6xl font-light">{Math.round(weather.temperature)}°C</p>
              <Image
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                width={100}
                height={100}
              />
            </div>
            <p className="text-lg capitalize">{weather.description}</p>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Прогноз на 5 дней</h3>
            <div className="grid grid-cols-2 gap-4">
              {forecast.map((day) => (
                <div
                  key={day.date}
                  className="bg-white/70 p-3 rounded-lg flex flex-col items-center text-center text-gray-800 shadow"
                >
                  <p className="font-semibold">{day.date}</p>
                  <Image
                    src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                    alt={day.description}
                    width={50}
                    height={50}
                  />
                  <p>{Math.round(day.temperature)}°C</p>
                  <p className="text-xs capitalize">{day.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
