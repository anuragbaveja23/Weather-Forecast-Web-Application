import CitiesTable from "@/components/cities-table"
import { Suspense } from "react"
import Loading from "./loading"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Weather Forecast</h1>
      <Suspense fallback={<Loading />}>
        <CitiesTable />
      </Suspense>
    </main>
  )
}
