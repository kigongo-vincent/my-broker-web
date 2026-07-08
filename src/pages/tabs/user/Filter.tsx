import { useState } from "react"
import { MapMarker1Solid, MapMarker5Solid } from "@lineiconshq/free-icons"
import Header from "../../../components/pages/tabs/Header"
import Lineicons from "@lineiconshq/react-lineicons"
import { PriceI, Currency } from "../../../components/pages/tabs/Post"
import { AnimatePresence, motion } from "framer-motion"

interface PriceRangeI {
    label: string
    min: PriceI
    max: PriceI
}

interface FilterState {
    location: string
    minPrice: string
    maxPrice: string
    currency: Currency
    bedroom: string
    bathroom: string
    toilets: string
}

const initialFilterState: FilterState = {
    location: "",
    minPrice: "",
    maxPrice: "",
    currency: "UGX",
    bedroom: "",
    bathroom: "",
    toilets: "",
}

// common ranges for the Ugandan property market — adjust cutoffs as needed
const PRICE_RANGES: PriceRangeI[] = [
    { label: "Under 500K", min: { amount: 0, currency: "UGX" }, max: { amount: 500_000, currency: "UGX" } },
    { label: "500K - 1M", min: { amount: 500_000, currency: "UGX" }, max: { amount: 1_000_000, currency: "UGX" } },
    { label: "1M - 3M", min: { amount: 1_000_000, currency: "UGX" }, max: { amount: 3_000_000, currency: "UGX" } },
    { label: "3M - 5M", min: { amount: 3_000_000, currency: "UGX" }, max: { amount: 5_000_000, currency: "UGX" } },
    { label: "5M - 10M", min: { amount: 5_000_000, currency: "UGX" }, max: { amount: 10_000_000, currency: "UGX" } },
    { label: "10M - 50M", min: { amount: 10_000_000, currency: "UGX" }, max: { amount: 50_000_000, currency: "UGX" } },
    { label: "50M - 100M", min: { amount: 50_000_000, currency: "UGX" }, max: { amount: 100_000_000, currency: "UGX" } },
    { label: "100M+", min: { amount: 100_000_000, currency: "UGX" }, max: { amount: Number.MAX_SAFE_INTEGER, currency: "UGX" } },
]

const Filter = () => {
    const [filters, setFilters] = useState<FilterState>(initialFilterState)
    const [locating, setLocating] = useState(false)
    const [activeRangeLabel, setActiveRangeLabel] = useState<string | null>(null)

    const updateField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) return

        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    )
                    const data = await res.json()
                    updateField("location", data.display_name ?? `${latitude}, ${longitude}`)
                } catch {
                    updateField("location", `${latitude}, ${longitude}`)
                } finally {
                    setLocating(false)
                }
            },
            () => setLocating(false)
        )
    }

    const handleSelectRange = (range: PriceRangeI) => {
        setActiveRangeLabel(range.label)
        setFilters((prev) => ({
            ...prev,
            minPrice: String(range.min.amount),
            maxPrice: range.max.amount === Number.MAX_SAFE_INTEGER ? "" : String(range.max.amount),
            currency: range.min.currency,
        }))
    }

    const handleManualPriceChange = (key: "minPrice" | "maxPrice", value: string) => {
        setActiveRangeLabel(null) // manual edit overrides preset selection
        updateField(key, value)
    }

    const buildPriceRange = (): { min?: PriceI; max?: PriceI } => {
        const min = filters.minPrice
            ? { amount: Number(filters.minPrice), currency: filters.currency }
            : undefined
        const max = filters.maxPrice
            ? { amount: Number(filters.maxPrice), currency: filters.currency }
            : undefined
        return { min, max }
    }

    const handleApplyFilters = () => {
        const { min, max } = buildPriceRange()
        const payload = {
            location: filters.location || undefined,
            price: { min, max },
            bedroom: filters.bedroom ? Number(filters.bedroom) : undefined,
            bathroom: filters.bathroom ? Number(filters.bathroom) : undefined,
            toilets: filters.toilets ? Number(filters.toilets) : undefined,
        }

        // TODO: wire this into your search/query state (Zustand store, router query params, etc.)
        console.log("Applying filters:", payload)
    }

    const handleReset = () => {
        setFilters(initialFilterState)
        setActiveRangeLabel(null)
    }

    return (
        <AnimatePresence mode="sync">

            <motion.div


            >
                <Header back />
                <div className="pt-[8vh] p-4">
                    <div className="flex flex-col gap-4 mt-6 rounded-lg">

                        <div>
                            <p className="text-xl font-semibold">Property location</p>
                            <p className="text-text/50 text-sm mt-1">please provide the location of the property</p>
                        </div>

                        <button
                            className="btn bg-primary rounded-full w-full text-white disabled:opacity-60"
                            onClick={handleUseCurrentLocation}
                            disabled={locating}
                        >
                            <Lineicons icon={MapMarker1Solid} />
                            <span>{locating ? "locating..." : "use current location"}</span>
                        </button>

                        <div className="bg-pale  w-full dark:border border-text/10 rounded-full h-16 flex gap-3 items-center pl-6 pr-1.5">
                            <Lineicons icon={MapMarker5Solid} className="text-text/50" />
                            <input
                                type="text"
                                placeholder="provide the location"
                                className="flex-1 outline-0"
                                value={filters.location}
                                onChange={(e) => updateField("location", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">Price</span>

                            <div className="flex flex-wrap gap-2">
                                {PRICE_RANGES.map((range) => {
                                    const isActive = activeRangeLabel === range.label
                                    return (
                                        <button
                                            key={range.label}
                                            type="button"
                                            onClick={() => handleSelectRange(range)}
                                            className={`px-4 py-2 rounded-full text-sm  transition-colors ${isActive
                                                ? "bg-primary text-white border-primary"
                                                : "bg-pale text-text border-text/10"
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center gap-2 w-full mt-1">
                                <input
                                    type="number"
                                    className="outline-0 bg-pale h-14 w-full rounded-lg px-6"
                                    placeholder="minimum"
                                    value={filters.minPrice}
                                    onChange={(e) => handleManualPriceChange("minPrice", e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="outline-0 w-full bg-pale h-14 rounded-lg px-6"
                                    placeholder="maximum"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleManualPriceChange("maxPrice", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">bedroom</span>
                            <input
                                type="number"
                                className="outline-0 bg-pale h-14 rounded-lg px-6"
                                placeholder="bedroom e.g 4"
                                value={filters.bedroom}
                                onChange={(e) => updateField("bedroom", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">bathroom</span>
                            <input
                                type="number"
                                className="outline-0 bg-pale h-14 rounded-lg px-6"
                                placeholder="bathroom e.g 4"
                                value={filters.bathroom}
                                onChange={(e) => updateField("bathroom", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">toilets</span>
                            <input
                                type="number"
                                className="outline-0 bg-pale h-14 rounded-lg px-6"
                                placeholder="toilets e.g 4"
                                value={filters.toilets}
                                onChange={(e) => updateField("toilets", e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button className="btn rounded-full bg-pale flex-1" onClick={handleReset}>
                                reset
                            </button>
                            <button className="btn bg-primary rounded-full text-white flex-1" onClick={handleApplyFilters}>
                                apply filters
                            </button>
                        </div>

                    </div>
                </div>
            </motion.div>
        </AnimatePresence>

    )
}

export default Filter