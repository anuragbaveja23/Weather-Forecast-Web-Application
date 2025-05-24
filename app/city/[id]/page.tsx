import { Suspense } from "react"
import WeatherDisplay from "@/components/weather-display"
import Loading from "@/app/loading"
import { getCityById } from "@/lib/cities"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CityPage({ params }: { params: { id: string } }) {
  const city = await getCityById(params.id)

  if (!city) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="flex items-center text-primary mb-4 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to cities
        </Link>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">City not found</h1>
          <p>The city you're looking for doesn't exist or couldn't be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="flex items-center text-primary mb-4 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to cities
      </Link>
      <h1 className="text-3xl font-bold mb-2">{city.name}</h1>
      <p className="text-muted-foreground mb-6">{city.country}</p>

      <Suspense fallback={<Loading />}>
        <WeatherDisplay city={city} />
      </Suspense>
    </div>
  )
}
