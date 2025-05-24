"use client"

import { useState, useEffect } from "react"
import { fetchWeather, type WeatherData, type ForecastData } from "@/lib/weather"
import type { City } from "@/lib/cities"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Droplets,
  Wind,
  Thermometer,
  BarChart3,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Compass,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface WeatherDisplayProps {
  city: City
}

export default function WeatherDisplay({ city }: WeatherDisplayProps) {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [units, setUnits] = useState<"metric" | "imperial">("metric")

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { current, forecast } = await fetchWeather({
          lat: city.latitude,
          lon: city.longitude,
          units,
        })

        setCurrentWeather(current)
        setForecast(forecast)
        setLoading(false)
      } catch (err) {
        setError("Failed to load weather data. Please try again.")
        setLoading(false)
      }
    }

    loadWeatherData()
  }, [city, units])

  const getWeatherIcon = (code: string) => {
    // Map weather codes to icons
    if (code.startsWith("01")) return <Sun className="h-8 w-8 text-yellow-500" />
    if (code.startsWith("02")) return <Cloud className="h-8 w-8 text-gray-400" />
    if (code.startsWith("03") || code.startsWith("04")) return <Cloud className="h-8 w-8 text-gray-500" />
    if (code.startsWith("09")) return <CloudDrizzle className="h-8 w-8 text-blue-400" />
    if (code.startsWith("10")) return <CloudRain className="h-8 w-8 text-blue-500" />
    if (code.startsWith("11")) return <CloudLightning className="h-8 w-8 text-purple-500" />
    if (code.startsWith("13")) return <CloudSnow className="h-8 w-8 text-blue-200" />
    if (code.startsWith("50")) return <CloudFog className="h-8 w-8 text-gray-400" />
    return <Cloud className="h-8 w-8 text-gray-400" />
  }

  const getBackgroundClass = () => {
    if (!currentWeather) return "bg-gradient-to-b from-blue-100 to-blue-50"

    const code = currentWeather.weather[0].icon
    const temp = currentWeather.main.temp
    const isDay = code.endsWith("d")

    // Clear sky
    if (code.startsWith("01")) {
      if (isDay) {
        if (temp > 30) return "bg-gradient-to-b from-orange-400 to-yellow-200" // Hot day
        return "bg-gradient-to-b from-blue-400 to-blue-100" // Normal day
      } else {
        return "bg-gradient-to-b from-indigo-900 to-blue-900" // Clear night
      }
    }

    // Partly cloudy
    if (code.startsWith("02") || code.startsWith("03")) {
      return isDay
        ? "bg-gradient-to-b from-blue-300 to-gray-100" // Partly cloudy day
        : "bg-gradient-to-b from-gray-800 to-indigo-900" // Partly cloudy night
    }

    // Cloudy
    if (code.startsWith("04")) {
      return "bg-gradient-to-b from-gray-400 to-gray-200"
    }

    // Rain
    if (code.startsWith("09") || code.startsWith("10")) {
      return isDay
        ? "bg-gradient-to-b from-blue-500 to-blue-300" // Rainy day
        : "bg-gradient-to-b from-blue-900 to-gray-800" // Rainy night
    }

    // Thunderstorm
    if (code.startsWith("11")) {
      return "bg-gradient-to-b from-purple-600 to-purple-300"
    }

    // Snow
    if (code.startsWith("13")) {
      return "bg-gradient-to-b from-blue-100 to-white"
    }

    // Mist/Fog
    if (code.startsWith("50")) {
      return "bg-gradient-to-b from-gray-300 to-gray-200"
    }

    // Temperature based fallback
    if (temp > 30) return "bg-gradient-to-b from-orange-400 to-yellow-200" // Hot
    if (temp < 0) return "bg-gradient-to-b from-blue-200 to-white" // Cold

    return "bg-gradient-to-b from-blue-100 to-blue-50" // Default
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const toggleUnits = () => {
    setUnits(units === "metric" ? "imperial" : "metric")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading weather data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (!currentWeather || !forecast) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">No Data</h2>
        <p>Weather data is not available for this location.</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl p-6 ${getBackgroundClass()}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center">
          <div className="mr-4">{getWeatherIcon(currentWeather.weather[0].icon)}</div>
          <div>
            <h2 className="text-4xl font-bold mb-1">
              {Math.round(currentWeather.main.temp)}°{units === "metric" ? "C" : "F"}
            </h2>
            <p className="text-lg capitalize">{currentWeather.weather[0].description}</p>
            <p className="text-sm">
              Feels like {Math.round(currentWeather.main.feels_like)}°{units === "metric" ? "C" : "F"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end">
          <div className="mb-2">
            <p className="text-sm">
              High: {Math.round(currentWeather.main.temp_max)}°{units === "metric" ? "C" : "F"}
              &nbsp;•&nbsp; Low: {Math.round(currentWeather.main.temp_min)}°{units === "metric" ? "C" : "F"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="units">°C</Label>
            <Switch id="units" checked={units === "imperial"} onCheckedChange={toggleUnits} />
            <Label htmlFor="units">°F</Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="font-medium">{currentWeather.main.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center">
                <Wind className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Wind</p>
                  <p className="font-medium">
                    {Math.round(currentWeather.wind.speed)} {units === "metric" ? "m/s" : "mph"}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pressure</p>
                  <p className="font-medium">{currentWeather.main.pressure} hPa</p>
                </div>
              </div>
              <div className="flex items-center">
                <Thermometer className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Visibility</p>
                  <p className="font-medium">{(currentWeather.visibility / 1000).toFixed(1)} km</p>
                </div>
              </div>
              <div className="flex items-center">
                <Compass className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Wind Direction</p>
                  <p className="font-medium">{currentWeather.wind.deg}°</p>
                </div>
              </div>
              <div className="flex items-center">
                <Cloud className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Cloudiness</p>
                  <p className="font-medium">{currentWeather.clouds.all}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sun & Moon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sunrise</p>
                <p className="font-medium">
                  {new Date(currentWeather.sys.sunrise * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sunset</p>
                <p className="font-medium">
                  {new Date(currentWeather.sys.sunset * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Day Length</p>
                <p className="font-medium">
                  {(() => {
                    const dayLengthSeconds = currentWeather.sys.sunset - currentWeather.sys.sunrise
                    const hours = Math.floor(dayLengthSeconds / 3600)
                    const minutes = Math.floor((dayLengthSeconds % 3600) / 60)
                    return `${hours}h ${minutes}m`
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Local Time</p>
                <p className="font-medium">
                  {new Date((currentWeather.dt + currentWeather.timezone) * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Forecast</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {forecast.slice(0, 5).map((day, index) => (
              <Card key={index} className="bg-white/80">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm font-medium">{formatDate(day.dt)}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-center">
                  {getWeatherIcon(day.weather[0].icon)}
                  <p className="mt-2 text-sm capitalize">{day.weather[0].description}</p>
                  <p className="mt-1 font-medium">
                    {Math.round(day.temp.max)}° / {Math.round(day.temp.min)}°
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Precip: {Math.round(day.pop * 100)}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="hourly" className="mt-4">
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-4 min-w-max">
              {forecast.slice(0, 8).map((day, index) => (
                <Card key={index} className="bg-white/80 w-[100px]">
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm font-medium">
                      {new Date(day.dt * 1000).toLocaleDateString([], {
                        weekday: "short",
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-center">
                    {getWeatherIcon(day.weather[0].icon)}
                    <p className="mt-2 font-medium">{Math.round(day.temp.day)}°</p>
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(day.pop * 100)}%</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Map */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>
            {city.name}, {city.country} ({city.latitude.toFixed(2)}, {city.longitude.toFixed(2)})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 aspect-video relative">
          <div className="absolute inset-0 bg-gray-200 rounded-b-lg">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0, borderBottomLeftRadius: "0.5rem", borderBottomRightRadius: "0.5rem" }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${city.longitude - 0.1}%2C${city.latitude - 0.1}%2C${city.longitude + 0.1}%2C${city.latitude + 0.1}&layer=mapnik&marker=${city.latitude}%2C${city.longitude}`}
              allowFullScreen
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
