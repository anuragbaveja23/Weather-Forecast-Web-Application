export interface City {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  population: number
  timezone: string
  weather?: {
    temp: number
    high: number
    low: number
    description: string
    icon: string
  }
}

interface FetchCitiesParams {
  page?: number
  limit?: number
  search?: string
  sortField?: string
  sortDirection?: "asc" | "desc"
  [key: string]: any
}

interface FetchCitiesResponse {
  cities: City[]
  hasMore: boolean
  total: number
}

// This function fetches cities from the OpenDataSoft API
export async function fetchCities(params: FetchCitiesParams = {}): Promise<FetchCitiesResponse> {
  const { page = 1, limit = 20, search = "", sortField = "name", sortDirection = "asc", ...filters } = params

  // Build the query parameters
  const queryParams = new URLSearchParams()

  // Calculate offset based on page and limit
  const offset = (page - 1) * limit

  // Add pagination parameters
  queryParams.append("rows", limit.toString())
  queryParams.append("start", offset.toString())

  // Add search parameter if provided
  if (search) {
    queryParams.append("q", search)
  }

  // Add sort parameter
  queryParams.append("sort", `${sortDirection === "desc" ? "-" : ""}${sortField}`)

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      queryParams.append(`refine.${key}`, value.toString())
    }
  })

  // Format: JSON
  queryParams.append("format", "json")

  try {
    // Fetch data from the API
    const response = await fetch(
      `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&${queryParams.toString()}`,
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`)
    }

    const data = await response.json()

    // Transform the API response to our City interface
    const cities: City[] = data.records.map((record: any) => ({
      id: record.recordid,
      name: record.fields.name,
      country: record.fields.cou_name_en,
      latitude: record.fields.coordinates[0],
      longitude: record.fields.coordinates[1],
      population: record.fields.population || 0,
      timezone: record.fields.timezone || "Unknown",
    }))

    return {
      cities,
      hasMore: offset + cities.length < data.nhits,
      total: data.nhits,
    }
  } catch (error) {
    console.error("Error fetching cities:", error)

    // For development/demo purposes, return mock data if API call fails
    const mockCities: City[] = Array.from({ length: limit }, (_, i) => ({
      id: `mock-${i + offset}`,
      name: `City ${i + offset + 1}`,
      country: ["USA", "Canada", "UK", "Germany", "France"][Math.floor(Math.random() * 5)],
      latitude: Math.random() * 180 - 90,
      longitude: Math.random() * 360 - 180,
      population: Math.floor(Math.random() * 10000000),
      timezone: ["UTC", "UTC+1", "UTC-5", "UTC+8"][Math.floor(Math.random() * 4)],
    }))

    return {
      cities: mockCities,
      hasMore: page < 5, // Limit mock data to 5 pages
      total: 100,
    }
  }
}

// This function fetches a single city by ID
export async function getCityById(id: string): Promise<City | null> {
  try {
    const response = await fetch(
      `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&q=recordid:${id}`,
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch city: ${response.status}`)
    }

    const data = await response.json()

    if (data.records.length === 0) {
      return null
    }

    const record = data.records[0]

    return {
      id: record.recordid,
      name: record.fields.name,
      country: record.fields.cou_name_en,
      latitude: record.fields.coordinates[0],
      longitude: record.fields.coordinates[1],
      population: record.fields.population || 0,
      timezone: record.fields.timezone || "Unknown",
    }
  } catch (error) {
    console.error("Error fetching city by ID:", error)

    // For development/demo purposes, return mock data if API call fails
    if (id.startsWith("mock-")) {
      const idNumber = Number.parseInt(id.replace("mock-", ""))
      return {
        id,
        name: `City ${idNumber + 1}`,
        country: ["USA", "Canada", "UK", "Germany", "France"][Math.floor(Math.random() * 5)],
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180,
        population: Math.floor(Math.random() * 10000000),
        timezone: ["UTC", "UTC+1", "UTC-5", "UTC+8"][Math.floor(Math.random() * 4)],
      }
    }

    return null
  }
}

// This function updates the weather data for a city
export function updateCityWeather(city: City, weatherData: any): City {
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
}

// Add the fetchWeatherForCities function after the updateCityWeather function
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
