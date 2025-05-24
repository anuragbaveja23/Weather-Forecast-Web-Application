"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronUp, Filter, Search, X, Loader2, SunMedium, CloudRain, Thermometer } from "lucide-react"
import Link from "next/link"
import { fetchCities, fetchWeatherForCities, type City } from "@/lib/cities"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useDebounce } from "@/hooks/use-debounce"

export default function CitiesTable() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortField, setSortField] = useState<keyof City>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [units, setUnits] = useState<"metric" | "imperial">("metric")

  const observer = useRef<IntersectionObserver | null>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const lastCityElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore],
  )

  // Initial data load
  useEffect(() => {
    loadCities()
  }, [page, debouncedSearchTerm, sortField, sortDirection, filters])

  // Search suggestions
  useEffect(() => {
    if (searchTerm.length > 1) {
      fetchCities({
        page: 1,
        limit: 5,
        search: searchTerm,
      })
        .then((data) => {
          setSuggestions(data.cities)
          setShowSuggestions(true)
        })
        .catch((err) => {
          console.error("Error fetching suggestions:", err)
        })
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  // Load weather data for visible cities
  useEffect(() => {
    if (cities.length > 0 && !weatherLoading) {
      loadWeatherData()
    }
  }, [cities])

  const loadCities = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page,
        limit: 20,
        search: debouncedSearchTerm,
        sortField: sortField as string,
        sortDirection,
        ...filters,
      }

      const data = await fetchCities(params)

      if (page === 1) {
        setCities(data.cities)
      } else {
        setCities((prev) => [...prev, ...data.cities])
      }

      setHasMore(data.hasMore)
      setLoading(false)
    } catch (err) {
      console.error("Error loading cities:", err)
      setError("Failed to load cities. Please try again.")
      setLoading(false)
    }
  }

  const loadWeatherData = async () => {
    try {
      setWeatherLoading(true)

      // Only fetch weather for cities that don't already have weather data
      const citiesToUpdate = cities.filter((city) => !city.weather)

      if (citiesToUpdate.length === 0) {
        setWeatherLoading(false)
        return
      }

      const updatedCities = await fetchWeatherForCities(citiesToUpdate, units)

      // Merge the updated cities with the existing cities
      setCities((prevCities) =>
        prevCities.map((city) => {
          const updatedCity = updatedCities.find((c) => c.id === city.id)
          return updatedCity || city
        }),
      )

      setWeatherLoading(false)
    } catch (error) {
      console.error("Error loading weather data:", error)
      setWeatherLoading(false)
    }
  }

  const handleSort = (field: keyof City) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setPage(1)
  }

  const handleFilter = (field: keyof City, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setPage(1)
  }

  const clearFilter = (field: keyof City) => {
    const newFilters = { ...filters }
    delete newFilters[field]
    setFilters(newFilters)
    setPage(1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const selectSuggestion = (city: City) => {
    setSearchTerm(city.name)
    setSuggestions([])
    setShowSuggestions(false)
    setPage(1)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSuggestions([])
    setShowSuggestions(false)
    setPage(1)
  }

  const getWeatherIcon = (icon: string) => {
    if (icon.startsWith("01") || icon.startsWith("02")) return <SunMedium className="h-5 w-5 text-yellow-500" />
    if (icon.startsWith("09") || icon.startsWith("10")) return <CloudRain className="h-5 w-5 text-blue-500" />
    return <Thermometer className="h-5 w-5 text-gray-500" />
  }

  // Function to handle right-click on city name
  const handleCityRightClick = (e: React.MouseEvent, cityId: string) => {
    // Don't prevent default to allow the browser's context menu to open
    // This ensures "Open in new tab" works as expected
  }

  // Generate country filter options
  const countryOptions = Array.from(new Set(cities.map((city) => city.country))).sort()

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchTerm && (
            <Button variant="ghost" size="icon" onClick={clearSearch} className="h-8 w-8 mr-1">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 shadow-lg">
            <ul className="py-2">
              {suggestions.map((city) => (
                <li
                  key={city.id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => selectSuggestion(city)}
                >
                  {city.name}, {city.country}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(filters).map(([field, value]) => (
          <Badge key={field} variant="secondary" className="flex items-center gap-1">
            {field}: {value}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => clearFilter(field as keyof City)}
              className="h-4 w-4 ml-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center">
                  City Name
                  <Button variant="ghost" size="icon" onClick={() => handleSort("name")} className="ml-1 h-6 w-6">
                    {sortField === "name" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Filter by first letter</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[
                        "A",
                        "B",
                        "C",
                        "D",
                        "E",
                        "F",
                        "G",
                        "H",
                        "I",
                        "J",
                        "K",
                        "L",
                        "M",
                        "N",
                        "O",
                        "P",
                        "Q",
                        "R",
                        "S",
                        "T",
                        "U",
                        "V",
                        "W",
                        "X",
                        "Y",
                        "Z",
                      ].map((letter) => (
                        <DropdownMenuItem key={letter} onClick={() => handleFilter("name", letter)}>
                          Starts with {letter}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Country
                  <Button variant="ghost" size="icon" onClick={() => handleSort("country")} className="ml-1 h-6 w-6">
                    {sortField === "country" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                      <DropdownMenuLabel>Filter by country</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {countryOptions.map((country) => (
                        <DropdownMenuItem key={country} onClick={() => handleFilter("country", country)}>
                          {country}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Timezone
                  <Button variant="ghost" size="icon" onClick={() => handleSort("timezone")} className="ml-1 h-6 w-6">
                    {sortField === "timezone" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Filter by timezone</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {["UTC", "UTC+1", "UTC+2", "UTC+3", "UTC-5", "UTC-6"].map((tz) => (
                        <DropdownMenuItem key={tz} onClick={() => handleFilter("timezone", tz)}>
                          {tz}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Population
                  <Button variant="ghost" size="icon" onClick={() => handleSort("population")} className="ml-1 h-6 w-6">
                    {sortField === "population" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Filter by population</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleFilter("population", ">1000000")}>
                        Over 1 million
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFilter("population", ">5000000")}>
                        Over 5 million
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFilter("population", ">10000000")}>
                        Over 10 million
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Weather
                  {weatherLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.map((city, index) => {
              const isLastElement = index === cities.length - 1
              return (
                <TableRow key={city.id} ref={isLastElement ? lastCityElementRef : null}>
                  <TableCell>
                    <Link
                      href={`/city/${city.id}`}
                      className="text-primary hover:underline"
                      onContextMenu={(e) => handleCityRightClick(e, city.id)}
                    >
                      {city.name}
                    </Link>
                  </TableCell>
                  <TableCell>{city.country}</TableCell>
                  <TableCell>{city.timezone}</TableCell>
                  <TableCell>{city.population.toLocaleString()}</TableCell>
                  <TableCell>
                    {city.weather ? (
                      <div className="flex items-center">
                        {city.weather.icon && getWeatherIcon(city.weather.icon)}
                        <span className="ml-2 mr-2">{city.weather.temp}°</span>
                        <span className="text-xs text-muted-foreground">
                          {city.weather.high}° / {city.weather.low}°
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    Loading more cities...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && cities.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No cities found. Try adjusting your search or filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
