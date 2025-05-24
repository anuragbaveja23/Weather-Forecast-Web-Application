import type { City } from "./cities" // Assuming City interface is defined in another file

export interface WeatherData {
  coord: {
    lon: number
    lat: number
  }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  base: string
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  visibility: number
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  clouds: {
    all: number
  }
  rain?: {
    "1h"?: number
    "3h"?: number
  }
  snow?: {
    "1h"?: number
    "3h"?: number
  }
  dt: number
  sys: {
    type: number
    id: number
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

export interface ForecastData {
  dt: number
  sunrise: number
  sunset: number
  temp: {
    day: number
    min: number
    max: number
    night: number
    eve: number
    morn: number
  }
  feels_like: {
    day: number
    night: number
    eve: number
    morn: number
  }
  pressure: number
  humidity: number
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  speed: number
  deg: number
  gust: number
  clouds: number
  pop: number
  rain?: number
  snow?: number
}

interface FetchWeatherParams {
  lat: number
  lon: number
  units?: "metric" | "imperial"
}

interface WeatherResponse {
  current: WeatherData
  forecast: ForecastData[]
}

// This function fetches weather data from the OpenWeatherMap API
export async function fetchWeather(params: FetchWeatherParams): Promise<WeatherResponse> {
  const { lat, lon, units = "metric" } = params

  // Replace with your actual OpenWeatherMap API key
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "YOUR_OPENWEATHER_API_KEY"

  try {
    // Check if we have a valid API key
    if (!apiKey || apiKey === "YOUR_OPENWEATHER_API_KEY") {
      console.warn("No OpenWeatherMap API key provided. Using mock data.")
      return getMockWeatherData(units)
    }

    // Fetch current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`,
    )

    if (!currentResponse.ok) {
      throw new Error(`Failed to fetch current weather: ${currentResponse.status}`)
    }

    const currentData: WeatherData = await currentResponse.json()

    // Fetch 5-day forecast
    // Note: The daily forecast endpoint requires a paid subscription, so we'll use the free 5-day/3-hour forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`,
    )

    if (!forecastResponse.ok) {
      throw new Error(`Failed to fetch forecast: ${forecastResponse.status}`)
    }

    const forecastData = await forecastResponse.json()

    // Process the 5-day/3-hour forecast into daily forecasts
    const dailyForecasts = processForecastData(forecastData.list, units)

    return {
      current: currentData,
      forecast: dailyForecasts,
    }
  } catch (error) {
    console.error("Error fetching weather data:", error)

    // For demo purposes, return mock data if API call fails
    return getMockWeatherData(units)
  }
}

// Helper function to process the 5-day/3-hour forecast into daily forecasts
function processForecastData(forecastList: any[], units: string): ForecastData[] {
  // Group forecasts by day
  const dailyData: Record<string, any[]> = {}

  forecastList.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toISOString().split("T")[0]
    if (!dailyData[date]) {
      dailyData[date] = []
    }
    dailyData[date].push(item)
  })

  // Process each day's data
  return Object.entries(dailyData).map(([date, items]) => {
    // Find min and max temperatures for the day
    const temps = items.map((item) => item.main.temp)
    const minTemp = Math.min(...temps)
    const maxTemp = Math.max(...temps)

    // Use noon forecast or the middle item for the day's "main" forecast
    const midIndex = Math.floor(items.length / 2)
    const dayForecast = items[midIndex]

    // Calculate precipitation probability (average of all values for the day)
    const pop = items.reduce((sum, item) => sum + (item.pop || 0), 0) / items.length

    return {
      dt: new Date(date).getTime() / 1000,
      sunrise: dayForecast.sys?.sunrise || dayForecast.dt,
      sunset: dayForecast.sys?.sunset || dayForecast.dt + 43200, // +12 hours if not available
      temp: {
        day: dayForecast.main.temp,
        min: minTemp,
        max: maxTemp,
        night: items[items.length - 1]?.main.temp || dayForecast.main.temp,
        eve: items[Math.min(items.length - 1, midIndex + 2)]?.main.temp || dayForecast.main.temp,
        morn: items[0]?.main.temp || dayForecast.main.temp,
      },
      feels_like: {
        day: dayForecast.main.feels_like,
        night: items[items.length - 1]?.main.feels_like || dayForecast.main.feels_like,
        eve: items[Math.min(items.length - 1, midIndex + 2)]?.main.feels_like || dayForecast.main.feels_like,
        morn: items[0]?.main.feels_like || dayForecast.main.feels_like,
      },
      pressure: dayForecast.main.pressure,
      humidity: dayForecast.main.humidity,
      weather: dayForecast.weather,
      speed: dayForecast.wind?.speed || 0,
      deg: dayForecast.wind?.deg || 0,
      gust: dayForecast.wind?.gust || 0,
      clouds: dayForecast.clouds?.all || 0,
      pop: pop,
      rain: dayForecast.rain?.["3h"] || 0,
      snow: dayForecast.snow?.["3h"] || 0,
    }
  })
}

// This function fetches weather data for multiple cities
export async function fetchWeatherForCities(cities: City[], units: "metric" | "imperial" = "metric"): Promise<City[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "YOUR_OPENWEATHER_API_KEY"

  // If no API key, return mock data
  if (!apiKey || apiKey === "YOUR_OPENWEATHER_API_KEY") {
    return cities.map((city) => ({
      ...city,
      weather: {
        temp: Math.round(15 + Math.random() * 10),
        high: Math.round(20 + Math.random() * 10),
        low: Math.round(10 + Math.random() * 5),
        description: ["Clear", "Cloudy", "Rainy"][Math.floor(Math.random() * 3)],
        icon: ["01d", "02d", "10d"][Math.floor(Math.random() * 3)],
      },
    }))
  }

  try {
    // Use Promise.all to fetch weather data for all cities in parallel
    const updatedCities = await Promise.all(
      cities.map(async (city) => {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${city.latitude}&lon=${city.longitude}&units=${units}&appid=${apiKey}`,
          )

          if (!response.ok) {
            throw new Error(`Failed to fetch weather for ${city.name}: ${response.status}`)
          }

          const weatherData = await response.json()

          return {
            ...city,
            weather: {
              temp: Math.round(weatherData.main.temp),
              high: Math.round(weatherData.main.temp_max),
              low: Math.round(weatherData.main.temp_min),
              description: weatherData.weather[0].description,
              icon: weatherData.weather[0].icon,
            },
          }
        } catch (error) {
          console.error(`Error fetching weather for ${city.name}:`, error)
          // Return the city without weather data if there's an error
          return city
        }
      }),
    )

    return updatedCities
  } catch (error) {
    console.error("Error fetching weather for cities:", error)
    return cities
  }
}

// Mock data for development or when API is unavailable
function getMockWeatherData(units: "metric" | "imperial"): WeatherResponse {
  const tempUnit = units === "metric" ? 20 : 68
  const windUnit = units === "metric" ? 5 : 11

  const current: WeatherData = {
    coord: { lon: -0.1257, lat: 51.5085 },
    weather: [
      {
        id: 800,
        main: "Clear",
        description: "clear sky",
        icon: "01d",
      },
    ],
    base: "stations",
    main: {
      temp: tempUnit,
      feels_like: tempUnit - 2,
      temp_min: tempUnit - 3,
      temp_max: tempUnit + 3,
      pressure: 1013,
      humidity: 65,
    },
    visibility: 10000,
    wind: {
      speed: windUnit,
      deg: 240,
    },
    clouds: {
      all: 0,
    },
    dt: Math.floor(Date.now() / 1000),
    sys: {
      type: 2,
      id: 2019646,
      country: "GB",
      sunrise: Math.floor(Date.now() / 1000) - 3600,
      sunset: Math.floor(Date.now() / 1000) + 3600,
    },
    timezone: 3600,
    id: 2643743,
    name: "London",
    cod: 200,
  }

  // Generate mock forecast data for 7 days
  const forecast: ForecastData[] = Array.from({ length: 7 }, (_, i) => {
    const dayOffset = i * 86400 // seconds in a day
    const now = Math.floor(Date.now() / 1000)

    return {
      dt: now + dayOffset,
      sunrise: now - 3600 + dayOffset,
      sunset: now + 3600 + dayOffset,
      temp: {
        day: tempUnit + Math.floor(Math.random() * 5),
        min: tempUnit - Math.floor(Math.random() * 5),
        max: tempUnit + Math.floor(Math.random() * 8),
        night: tempUnit - Math.floor(Math.random() * 3),
        eve: tempUnit,
        morn: tempUnit - 2,
      },
      feels_like: {
        day: tempUnit - 1,
        night: tempUnit - 3,
        eve: tempUnit - 1,
        morn: tempUnit - 4,
      },
      pressure: 1013,
      humidity: 65,
      weather: [
        {
          id: 800 + Math.floor(Math.random() * 3),
          main: ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
          description: ["clear sky", "few clouds", "light rain"][Math.floor(Math.random() * 3)],
          icon: ["01d", "02d", "10d"][Math.floor(Math.random() * 3)],
        },
      ],
      speed: windUnit,
      deg: 240,
      gust: windUnit + 2,
      clouds: Math.floor(Math.random() * 100),
      pop: Math.random(),
    }
  })

  return { current, forecast }
}
