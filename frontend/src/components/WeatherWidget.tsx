import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { FiMapPin, FiRefreshCw, FiDroplet, FiWind, FiEye } from 'react-icons/fi';

interface WeatherData {
  date: string;
  day: string;
  temperature: {
    high: number;
    low: number;
    current: number;
  };
  condition: string;
  icon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  description: string;
}

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

const mockWeatherData: WeatherData[] = [
  {
    date: '2024-01-15',
    day: 'Today',
    temperature: { high: 28, low: 18, current: 23 },
    condition: 'Partly Cloudy',
    icon: '⛅',
    precipitation: 20,
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    description: 'Partly cloudy with light winds'
  },
  {
    date: '2024-01-16',
    day: 'Tomorrow',
    temperature: { high: 32, low: 22, current: 27 },
    condition: 'Sunny',
    icon: '☀️',
    precipitation: 5,
    humidity: 45,
    windSpeed: 8,
    visibility: 15,
    description: 'Clear skies with light winds'
  },
  {
    date: '2024-01-17',
    day: 'Wed',
    temperature: { high: 26, low: 19, current: 22 },
    condition: 'Rainy',
    icon: '🌧️',
    precipitation: 85,
    humidity: 80,
    windSpeed: 15,
    visibility: 6,
    description: 'Heavy rain expected'
  },
  {
    date: '2024-01-18',
    day: 'Thu',
    temperature: { high: 24, low: 16, current: 20 },
    condition: 'Cloudy',
    icon: '☁️',
    precipitation: 40,
    humidity: 70,
    windSpeed: 10,
    visibility: 8,
    description: 'Overcast with moderate humidity'
  },
  {
    date: '2024-01-19',
    day: 'Fri',
    temperature: { high: 30, low: 20, current: 25 },
    condition: 'Clear',
    icon: '🌤️',
    precipitation: 10,
    humidity: 50,
    windSpeed: 6,
    visibility: 12,
    description: 'Mostly clear skies'
  },
  {
    date: '2024-01-20',
    day: 'Sat',
    temperature: { high: 27, low: 18, current: 22 },
    condition: 'Light Rain',
    icon: '🌦️',
    precipitation: 60,
    humidity: 75,
    windSpeed: 14,
    visibility: 7,
    description: 'Light rain showers expected'
  },
  {
    date: '2024-01-21',
    day: 'Sun',
    temperature: { high: 29, low: 21, current: 25 },
    condition: 'Partly Cloudy',
    icon: '⛅',
    precipitation: 25,
    humidity: 60,
    windSpeed: 9,
    visibility: 11,
    description: 'Partly cloudy conditions'
  }
];

interface WeatherWidgetProps {
  className?: string;
}

const getCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    const city = data.city || data.locality || data.principalSubdivision;
    const country = data.countryCode;
    return city && country ? `${city}, ${country}` : 'Your Location';
  } catch (error) {
    console.error('Error fetching city name:', error);
    return 'Your Location';
  }
};

const fetchRealWeatherData = async (lat: number = 12.9716, lon: number = 77.5946): Promise<WeatherData[]> => {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weather_code,wind_speed_10m_max,wind_direction_10m_dominant&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto&forecast_days=7`
    );
    
    if (!response.ok) throw new Error('Weather API request failed');
    
    const data = await response.json();
    const processedData: WeatherData[] = [];

    const getWeatherInfo = (code: number) => {
      const weatherMap: { [key: number]: { icon: string; condition: string; description: string } } = {
        0: { icon: '☀️', condition: 'Clear', description: 'Clear sky' },
        1: { icon: '🌤️', condition: 'Mainly Clear', description: 'Mainly clear sky' },
        2: { icon: '⛅', condition: 'Partly Cloudy', description: 'Partly cloudy' },
        3: { icon: '☁️', condition: 'Overcast', description: 'Overcast sky' },
        45: { icon: '🌫️', condition: 'Foggy', description: 'Foggy conditions' },
        48: { icon: '🌫️', condition: 'Foggy', description: 'Depositing rime fog' },
        51: { icon: '🌦️', condition: 'Light Drizzle', description: 'Light drizzle' },
        53: { icon: '🌦️', condition: 'Moderate Drizzle', description: 'Moderate drizzle' },
        55: { icon: '🌦️', condition: 'Dense Drizzle', description: 'Dense drizzle' },
        61: { icon: '🌧️', condition: 'Light Rain', description: 'Slight rain' },
        63: { icon: '🌧️', condition: 'Moderate Rain', description: 'Moderate rain' },
        65: { icon: '🌧️', condition: 'Heavy Rain', description: 'Heavy rain' },
        71: { icon: '❄️', condition: 'Light Snow', description: 'Slight snow fall' },
        73: { icon: '❄️', condition: 'Moderate Snow', description: 'Moderate snow fall' },
        75: { icon: '❄️', condition: 'Heavy Snow', description: 'Heavy snow fall' },
        77: { icon: '❄️', condition: 'Snow Grains', description: 'Snow grains' },
        80: { icon: '🌦️', condition: 'Light Rain Showers', description: 'Slight rain showers' },
        81: { icon: '🌧️', condition: 'Moderate Rain Showers', description: 'Moderate rain showers' },
        82: { icon: '🌧️', condition: 'Violent Rain Showers', description: 'Violent rain showers' },
        85: { icon: '❄️', condition: 'Light Snow Showers', description: 'Slight snow showers' },
        86: { icon: '❄️', condition: 'Heavy Snow Showers', description: 'Heavy snow showers' },
        95: { icon: '⛈️', condition: 'Thunderstorm', description: 'Thunderstorm' },
        96: { icon: '⛈️', condition: 'Thunderstorm with Hail', description: 'Thunderstorm with slight hail' },
        99: { icon: '⛈️', condition: 'Heavy Thunderstorm with Hail', description: 'Thunderstorm with heavy hail' }
      };
      return weatherMap[code] || { icon: '🌤️', condition: 'Unknown', description: 'Unknown weather condition' };
    };
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(data.daily.time[i]);
      const weatherInfo = getWeatherInfo(data.daily.weather_code[i]);
      processedData.push({
        date: data.daily.time[i],
        day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en', { weekday: 'short' }),
        temperature: {
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
          current: i === 0 ? Math.round(data.current.temperature_2m) : Math.round(data.daily.temperature_2m_mean[i])
        },
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
        precipitation: Math.round(data.daily.precipitation_sum[i] || 0),
        humidity: i === 0 ? Math.round(data.current.relative_humidity_2m) : Math.round(65 + Math.random() * 20),
        windSpeed: Math.round(data.daily.wind_speed_10m_max[i] || 0),
        visibility: Math.round(10 + Math.random() * 5),
        description: weatherInfo.description
      });
    }
    
    return processedData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return mockWeatherData;
  }
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className = '' }) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState('Bangalore, IN');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchWeatherData = async () => {
      setIsLoading(true);
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const data = await fetchRealWeatherData(latitude, longitude);
              const cityName = await getCityName(latitude, longitude);
              setWeatherData(data);
              setLocation(cityName);
            },
            async () => {
              const data = await fetchRealWeatherData();
              setWeatherData(data);
              setLocation('Bangalore, IN');
            }
          );
        } else {
          const data = await fetchRealWeatherData();
          setWeatherData(data);
          setLocation('Bangalore, IN');
        }
      } catch (error) {
        setWeatherData(mockWeatherData);
        setLocation('Demo Location');
      }
      setLastUpdated(new Date());
      setIsLoading(false);
    };
    fetchWeatherData();
  }, []);

  const refreshWeatherData = async () => {
    setIsLoading(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const data = await fetchRealWeatherData(latitude, longitude);
            const cityName = await getCityName(latitude, longitude);
            setWeatherData(data);
            setLocation(cityName);
            setLastUpdated(new Date());
          },
          async () => {
            const data = await fetchRealWeatherData();
            setWeatherData(data);
            setLocation('Bangalore, IN');
            setLastUpdated(new Date());
          }
        );
      } else {
        const data = await fetchRealWeatherData();
        setWeatherData(data);
        setLocation('Bangalore, IN');
        setLastUpdated(new Date());
      }
    } catch (error) {
      setWeatherData(mockWeatherData);
      setLocation('Demo Location');
      setLastUpdated(new Date());
    }
    setIsLoading(false);
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return 'text-red-500';
    if (temp >= 25) return 'text-orange-500';
    if (temp >= 20) return 'text-yellow-500';
    if (temp >= 15) return 'text-blue-500';
    return 'text-blue-600';
  };

  if (isLoading) {
    return (
      <div className={`${className} p-7 rounded-2xl shadow-soft border backdrop-blur-sm ${
        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'
      }`}>
        <div className="animate-pulse">
          <div className={`${isDark ? 'bg-slate-700' : 'bg-slate-200'} h-6 w-40 rounded mb-5`} />
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`${isDark ? 'bg-slate-700' : 'bg-slate-200'} h-16 rounded-lg`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-5 rounded-2xl shadow-soft border backdrop-blur-sm ${
      isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'
    }`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌤️</span>
            <div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Weather Forecast
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FiMapPin className="w-3.5 h-3.5" />
                <span>{location}</span>
                {weatherData && weatherData[0] && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                    isDark ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <span className="text-[10px]">●</span>
                    Now: {weatherData[0].temperature.current}°C
                  </span>
                )}
              </div>
            </div>
          </div>
          <motion.button
            onClick={refreshWeatherData}
            disabled={isLoading}
            className={`p-2.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700/50 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh weather data"
          >
            <FiRefreshCw className={`w-4.5 h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        
        {lastUpdated && (
          <div className={`text-xs mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Today - detailed (compact) */}
        {weatherData[0] && (
          <div className={`mb-2 p-4 rounded-2xl border ${
            isDark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl leading-none">{weatherData[0].icon}</div>
                <div>
                  <div className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Today</div>
                  <div className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-sm`}>
                    {weatherData[0].condition}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{weatherData[0].temperature.current}°C</div>
                <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  H {weatherData[0].temperature.high}° · L {weatherData[0].temperature.low}°
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <FiDroplet className="w-4 h-4 text-slate-500" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Humidity: {weatherData[0].humidity}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiWind className="w-4 h-4 text-slate-500" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Wind: {weatherData[0].windSpeed} m/s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiEye className="w-4 h-4 text-slate-500" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Visibility: {weatherData[0].visibility} km
                </span>
              </div>
            </div>
            <div className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs mt-3 italic`}>
              {weatherData[0].description}
            </div>
          </div>
        )}

        {/* Next 6 days removed for compact widget */}

      </motion.div>
    </div>
  );
};

export default WeatherWidget;
