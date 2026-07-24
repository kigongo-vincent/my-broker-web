import { useState } from "react"
import { MapMarker1Solid, MapMarker5Solid } from "@lineiconshq/free-icons"
import Header from "../../../components/pages/tabs/Header"
import Lineicons from "@lineiconshq/react-lineicons"
import { PriceI, Currency, PostType } from "../../../components/pages/tabs/Post"
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router"
import { useAppStore } from "../../../store/app"

interface PriceRangeI {
    label: string
    min: PriceI
    max: PriceI
}

interface ResolvedLocation {
    lat: number
    lon: number
    label: string
}

type TriState = "any" | "yes" | "no"

interface FilterState {
    locationQuery: string
    resolvedLocation: ResolvedLocation | null
    radius: number // meters
    minPrice: string
    maxPrice: string
    currency: Currency
    bedroom: string
    bathroom: string
    toilets: string
    type: PostType | ""
    negotiable: TriState
    available: TriState
    amenities: string[]
    extras: string[]
    months: string
    units: string
}

export interface FilterColumn {
    label?: string
    column: string
    operator: string
    value: unknown
}

const initialFilterState: FilterState = {
    locationQuery: "",
    resolvedLocation: null,
    radius: 200,
    minPrice: "",
    maxPrice: "",
    currency: "UGX",
    bedroom: "",
    bathroom: "",
    toilets: "",
    type: "",
    negotiable: "any",
    available: "any",
    amenities: [],
    extras: [],
    months: "",
    units: "",
}

// common ranges for the Ugandan property market — adjust cutoffs as needed
const PRICE_RANGES: PriceRangeI[] = [
    { label: "Under 50K", min: { amount: 0, currency: "UGX" }, max: { amount: 50_000, currency: "UGX" } },
    { label: "50K - 200K", min: { amount: 50_000, currency: "UGX" }, max: { amount: 200_000, currency: "UGX" } },
    { label: "200K - 300K", min: { amount: 200_000, currency: "UGX" }, max: { amount: 300_000, currency: "UGX" } },
    { label: "300K - 450K", min: { amount: 300_000, currency: "UGX" }, max: { amount: 450_000, currency: "UGX" } },
    { label: "450K - 1M", min: { amount: 450_000, currency: "UGX" }, max: { amount: 1_000_000, currency: "UGX" } },
    { label: "1M - 1.5M", min: { amount: 1_000_000, currency: "UGX" }, max: { amount: 1_500_000, currency: "UGX" } },
    { label: "1.5M - 2.5M", min: { amount: 1_500_000, currency: "UGX" }, max: { amount: 2_500_000, currency: "UGX" } },
    { label: "2.5M - 4M", min: { amount: 2_500_000, currency: "UGX" }, max: { amount: 4_000_000, currency: "UGX" } },
    { label: "4M - 7M", min: { amount: 4_000_000, currency: "UGX" }, max: { amount: 7_000_000, currency: "UGX" } },
    { label: "7M - 12M", min: { amount: 7_000_000, currency: "UGX" }, max: { amount: 12_000_000, currency: "UGX" } },
    { label: "12M+", min: { amount: 12_000_000, currency: "UGX" }, max: { amount: Number.MAX_SAFE_INTEGER, currency: "UGX" } },
]

const RADIUS_OPTIONS: { label: string; meters: number }[] = [
    { label: "100m", meters: 100 },
    { label: "200m", meters: 200 },
    { label: "400m", meters: 400 },
    { label: "800m", meters: 800 },
    { label: "1.6km", meters: 1600 },
]

// const POST_TYPES: { label: string; value: PostType }[] = [
//     { label: "Rental", value: "rental" },
//     { label: "Short stay", value: "short-stay" },
//     { label: "Residential", value: "residential" },
// ]

// Starter tag lists — these aren't sourced from the backend, so treat as a
// reasonable default set; swap for a canonical list if one exists server-side.
// const AMENITY_OPTIONS = [
// "Water", "Electricity",
// "Security",
// "Parking",
// "Trash"
// "Furnished",
// "Backup Generator", "Borehole", "Swimming Pool", "Gym", "WiFi",
// ]
// const EXTRA_OPTIONS = [
//     "Balcony", "Garden", "Servant's Quarter", "CCTV", "Perimeter Wall", "Store",
// ]

// Reverse of buildColumns(): turns whatever is currently persisted in the
// zustand store back into the shape the form controls need. Column names /
// operators here must stay in sync with buildColumns() below.
const parseFiltersFromColumns = (columns: FilterColumn[]): FilterState => {
    const state: FilterState = { ...initialFilterState, amenities: [], extras: [] }

    for (const col of columns) {
        switch (col.column) {
            case "location": {
                const v = col.value as { lat?: number; lon?: number; radius?: number } | undefined
                if (v && typeof v.lat === "number" && typeof v.lon === "number") {
                    const label = `${v.lat}, ${v.lon}`
                    state.resolvedLocation = { lat: v.lat, lon: v.lon, label }
                    state.locationQuery = label
                    if (typeof v.radius === "number") state.radius = v.radius
                }
                break
            }
            case "(price->>'amount')::numeric": {
                if (col.operator === "gte") {
                    state.minPrice = String(col.value)
                } else if (col.operator === "lte") {
                    state.maxPrice = String(col.value)
                }
                break
            }
            case "bedrooms":
                state.bedroom = String(col.value)
                break
            case "bathrooms":
                state.bathroom = String(col.value)
                break
            case "toilets":
                state.toilets = String(col.value)
                break
            case "type":
                state.type = col.value as PostType
                break
            case "negotiable":
                state.negotiable = col.value ? "yes" : "no"
                break
            case "available":
                state.available = col.value ? "yes" : "no"
                break
            case "months":
                state.months = String(col.value)
                break
            case "units":
                state.units = String(col.value)
                break
            case "amenities":
                state.amenities = Array.isArray(col.value) ? (col.value as string[]) : []
                break
            case "extras":
                state.extras = Array.isArray(col.value) ? (col.value as string[]) : []
                break
            default:
                break
        }
    }

    return state
}

// Figures out whether the hydrated min/max price matches one of the presets,
// so the preset button shows as active instead of looking unselected.
const findMatchingRangeLabel = (state: FilterState): string | null => {
    if (!state.minPrice && !state.maxPrice) return null

    const match = PRICE_RANGES.find((range) => {
        const minMatches = String(range.min.amount) === (state.minPrice || "0")
        const maxMatches =
            range.max.amount === Number.MAX_SAFE_INTEGER
                ? state.maxPrice === ""
                : String(range.max.amount) === state.maxPrice
        return minMatches && maxMatches
    })

    return match?.label ?? null
}

const Filter = () => {
    const { filters: storedColumns, updateFilters } = useAppStore()

    const [filters, setFilters] = useState<FilterState>(() =>
        storedColumns && storedColumns.length > 0
            ? parseFiltersFromColumns(storedColumns)
            : initialFilterState
    )
    const [activeRangeLabel, setActiveRangeLabel] = useState<string | null>(() =>
        storedColumns && storedColumns.length > 0
            ? findMatchingRangeLabel(parseFiltersFromColumns(storedColumns))
            : null
    )
    const [locating, setLocating] = useState(false)
    const [geocoding, setGeocoding] = useState(false)
    const [applying, setApplying] = useState(false)
    const navigate = useNavigate()

    // Pad-style quick-select state for numeric filters. "any" means the filter
    // field is left blank (no constraint applied); "other" reveals a custom
    // number input. Hydrated from any already-persisted filter value so
    // returning to this screen shows the right pad selected instead of
    // silently defaulting to "any".
    type PadValue = "any" | "0" | "1" | "2" | "3" | "other"
    // "any" (blank filter value) and "0" (an explicit, valid filter value) must
    // stay distinguishable — an empty string means "no constraint", not zero.
    const toPad = (value: string, options: readonly string[]): PadValue => {
        if (value === "") return "any"
        return (options as string[]).includes(value) ? (value as PadValue) : "other"
    }

    const [bedroomPad, setBedroomPad] = useState<PadValue>(() => toPad(filters.bedroom, ["0", "1", "2", "3"]))
    const [bathroomPad, setBathroomPad] = useState<PadValue>(() => toPad(filters.bathroom, ["0", "1", "2", "3"]))
    const [toiletsPad, setToiletsPad] = useState<PadValue>(() => toPad(filters.toilets, ["0", "1", "2", "3"]))
    // months/units of 0 isn't a meaningful real-world value, so their pads stay 1-3
    const [monthsPad, setMonthsPad] = useState<PadValue>(() => toPad(filters.months, ["1", "2", "3"]))
    const [unitsPad, setUnitsPad] = useState<PadValue>(() => toPad(filters.units, ["1", "2", "3"]))

    const roomPadOptions: readonly PadValue[] = ["any", "0", "1", "2", "3", "other"]
    const countPadOptions: readonly PadValue[] = ["any", "1", "2", "3", "other"]

    const handlePadSelect = (
        field: "bedroom" | "bathroom" | "toilets" | "months" | "units",
        setPad: (v: PadValue) => void,
        opt: PadValue
    ) => {
        setPad(opt)
        if (opt === "any") {
            updateField(field, "")
        } else if (opt !== "other") {
            updateField(field, opt)
        }
        // "other" leaves the current field value alone until the custom input changes
    }

    const updateField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    // const toggleTag = (key: "amenities" | "extras", tag: string) => {
    //     setFilters((prev) => {
    //         const current = prev[key]
    //         const next = current.includes(tag)
    //             ? current.filter((t) => t !== tag)
    //             : [...current, tag]
    //         return { ...prev, [key]: next }
    //     })
    // }

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
                    const label = data.display_name ?? `${latitude}, ${longitude}`
                    setFilters((prev) => ({
                        ...prev,
                        locationQuery: label,
                        resolvedLocation: { lat: latitude, lon: longitude, label },
                    }))
                } catch {
                    setFilters((prev) => ({
                        ...prev,
                        locationQuery: `${latitude}, ${longitude}`,
                        resolvedLocation: { lat: latitude, lon: longitude, label: `${latitude}, ${longitude}` },
                    }))
                } finally {
                    setLocating(false)
                }
            },
            () => setLocating(false)
        )
    }

    // Forward geocode typed text into coordinates. Radius search needs a lat/lon,
    // so free-typed addresses have to be resolved before they're useful as a filter.
    const handleGeocodeTypedLocation = async () => {
        if (!filters.locationQuery.trim()) return

        setGeocoding(true)
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(filters.locationQuery.trim())}`
            )
            const results = await res.json()
            const first = results?.[0]
            if (first) {
                updateField("resolvedLocation", {
                    lat: Number(first.lat),
                    lon: Number(first.lon),
                    label: first.display_name ?? filters.locationQuery.trim(),
                })
            }
        } catch {
            // leave resolvedLocation as-is; handleApplyFilters will just skip the radius filter
        } finally {
            setGeocoding(false)
        }
    }

    const handleLocationTextChange = (value: string) => {
        setFilters((prev) => ({ ...prev, locationQuery: value, resolvedLocation: null }))
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

    const buildColumns = (): FilterColumn[] => {
        const columns: FilterColumn[] = []

        if (filters.resolvedLocation) {
            columns.push({
                column: "location",
                operator: "within_radius",
                label: "location",
                value: {
                    lat: filters.resolvedLocation.lat,
                    lon: filters.resolvedLocation.lon,
                    radius: filters.radius,
                },
            })
        }

        if (filters.minPrice) {
            columns.push({
                column: "(price->>'amount')::numeric",
                operator: "gte",
                label: `> ${Number(filters.minPrice)?.toLocaleString("en-US")}`,
                value: Number(filters.minPrice),
            })
        }

        if (filters.maxPrice) {
            columns.push({
                column: "(price->>'amount')::numeric",
                operator: "lte",
                label: `< ${Number(filters.maxPrice)?.toLocaleString("en-US")}`,
                value: Number(filters.maxPrice),
            })
        }

        if (filters.bedroom) {
            columns.push({ column: "bedrooms", operator: "eq", value: Number(filters.bedroom), label: "bedrooms" })
        }
        if (filters.bathroom) {
            columns.push({ column: "bathrooms", operator: "eq", value: Number(filters.bathroom), label: "bathrooms" })
        }
        if (filters.toilets) {
            columns.push({ column: "toilets", operator: "eq", value: Number(filters.toilets), label: "toilets" })
        }
        if (filters.type) {
            columns.push({ column: "type", operator: "eq", value: filters.type, label: "property type" })
        }
        if (filters.negotiable !== "any") {
            columns.push({ column: "negotiable", operator: "eq", value: filters.negotiable === "yes", label: "barginable" })
        }
        if (filters.available !== "any") {
            columns.push({ column: "available", operator: "eq", value: filters.available === "yes" })
        }
        if (filters.months) {
            columns.push({ column: "months", operator: "eq", value: Number(filters.months), label: "allowed months" })
        }
        if (filters.units) {
            columns.push({ column: "units", operator: "eq", value: Number(filters.units), label: "avialable units" })
        }
        if (filters.amenities.length > 0) {
            columns.push({ column: "amenities", operator: "contains_all", value: filters.amenities, label: "amenities" })
        }
        if (filters.extras.length > 0) {
            columns.push({ column: "extras", operator: "contains_all", value: filters.extras, label: "extras" })
        }

        return columns
    }

    const handleApplyFilters = async () => {
        setApplying(true)
        try {
            updateFilters(buildColumns())
            navigate("/tabs/user")

        } catch (err) {
            // Post() already shows a toast on failure; nothing else needed here
            console.error("Failed to apply filters:", err)
        } finally {
            setApplying(false)
        }
    }

    const handleReset = () => {
        setFilters(initialFilterState)
        setActiveRangeLabel(null)
        setBedroomPad("any")
        setBathroomPad("any")
        setToiletsPad("any")
        setMonthsPad("any")
        setUnitsPad("any")
        // clear the persisted filters too, otherwise leaving and re-entering
        // this screen would silently repopulate the "reset" form
        updateFilters([])
    }

    return (
        <AnimatePresence mode="sync">
            <motion.div>
                <Header back title="filters" caption="apply filters to properties" />
                <div className=" px-4">
                    <div className="flex flex-col gap-4  rounded-lg">

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

                        <div className="bg-pale w-full dark:border border-text/10 rounded-full h-16 flex gap-3 items-center pl-6 pr-1.5">
                            <Lineicons icon={MapMarker5Solid} className="text-text/50" />
                            <input
                                type="text"
                                placeholder="provide the location"
                                className="flex-1 outline-0"
                                value={filters.locationQuery}
                                onChange={(e) => handleLocationTextChange(e.target.value)}
                                onBlur={handleGeocodeTypedLocation}
                            />
                            {filters.locationQuery.trim() && !filters.resolvedLocation && (
                                <button
                                    type="button"
                                    className="btn bg-primary rounded-full text-white text-sm px-4 disabled:opacity-60"
                                    onClick={handleGeocodeTypedLocation}
                                    disabled={geocoding}
                                >
                                    {geocoding ? "..." : "find"}
                                </button>
                            )}
                        </div>

                        {filters.resolvedLocation && (
                            <div className="flex flex-col gap-2">
                                <span className="text-sm">Search radius</span>
                                <div className="flex flex-wrap gap-2">
                                    {RADIUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.label}
                                            type="button"
                                            onClick={() => updateField("radius", opt.meters)}
                                            className={`px-4 py-2 rounded-full text-sm transition-colors ${filters.radius === opt.meters
                                                ? "bg-primary text-white border-primary"
                                                : "bg-pale text-text border-text/10"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!filters.resolvedLocation && filters.locationQuery.trim() && (
                            <p className="text-xs text-text/50">
                                tap "find" to resolve this address before radius search applies
                            </p>
                        )}

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
                                            className={`px-4 py-2 rounded-full text-sm transition-colors ${isActive
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

                        {/* <div className="flex flex-col gap-2">
                            <span className="text-sm">Property type</span>
                            <div className="flex flex-wrap gap-2">
                                {POST_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => updateField("type", filters.type === t.value ? "" : t.value)}
                                        className={`px-4 py-2 rounded-full text-sm transition-colors ${filters.type === t.value
                                            ? "bg-primary text-white border-primary"
                                            : "bg-pale text-text border-text/10"
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div> */}

                        {(
                            [
                                { field: "bedroom" as const, label: "bedroom", pad: bedroomPad, setPad: setBedroomPad },
                                { field: "bathroom" as const, label: "bathroom", pad: bathroomPad, setPad: setBathroomPad },
                                { field: "toilets" as const, label: "toilets", pad: toiletsPad, setPad: setToiletsPad },
                            ]
                        ).map(({ field, label, pad, setPad }) => (
                            <div key={field} className="flex flex-col gap-2">
                                <span className="text-sm capitalize">{label}</span>
                                <div className="grid grid-cols-6 gap-2">
                                    {roomPadOptions.map((opt) => {
                                        const isSelected = pad === opt
                                        return (
                                            <div
                                                key={opt}
                                                onClick={() => handlePadSelect(field, setPad, opt)}
                                                className="relative h-14 bg-pale rounded-xl flex items-center justify-center cursor-pointer"
                                            >
                                                {isSelected && (
                                                    <motion.div
                                                        layoutId={`${field}PadRing`}
                                                        className="absolute inset-0 border border-primary bg-primary/5 rounded-xl z-0"
                                                        transition={{ duration: 0.2 }}
                                                    />
                                                )}
                                                <span className="relative z-10 font-medium capitalize text-sm">
                                                    {opt === "any" ? "any" : opt === "other" ? "other" : opt}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                                {pad === "other" && (
                                    <input
                                        type="number"
                                        min={1}
                                        className="outline-0 bg-pale h-14 rounded-lg px-6 mt-1"
                                        placeholder={`custom ${label} e.g 4`}
                                        value={filters[field]}
                                        onChange={(e) => updateField(field, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">months (lease length)</span>
                            <div className="grid grid-cols-5 gap-2">
                                {countPadOptions.map((opt) => {
                                    const isSelected = monthsPad === opt
                                    return (
                                        <div
                                            key={opt}
                                            onClick={() => handlePadSelect("months", setMonthsPad, opt)}
                                            className="relative h-14 bg-pale rounded-xl flex items-center justify-center cursor-pointer"
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="monthsPadRing"
                                                    className="absolute inset-0 border border-primary bg-primary/5 rounded-xl z-0"
                                                    transition={{ duration: 0.2 }}
                                                />
                                            )}
                                            <span className="relative z-10 font-medium capitalize text-sm">
                                                {opt}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            {monthsPad === "other" && (
                                <input
                                    type="number"
                                    min={1}
                                    className="outline-0 bg-pale h-14 rounded-lg px-6 mt-1"
                                    placeholder="custom months e.g 12"
                                    value={filters.months}
                                    onChange={(e) => updateField("months", e.target.value)}
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">units available</span>
                            <div className="grid grid-cols-5 gap-2">
                                {countPadOptions.map((opt) => {
                                    const isSelected = unitsPad === opt
                                    return (
                                        <div
                                            key={opt}
                                            onClick={() => handlePadSelect("units", setUnitsPad, opt)}
                                            className="relative h-14 bg-pale rounded-xl flex items-center justify-center cursor-pointer"
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="unitsPadRing"
                                                    className="absolute inset-0 border border-primary bg-primary/5 rounded-xl z-0"
                                                    transition={{ duration: 0.2 }}
                                                />
                                            )}
                                            <span className="relative z-10 font-medium capitalize text-sm">
                                                {opt}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            {unitsPad === "other" && (
                                <input
                                    type="number"
                                    min={1}
                                    className="outline-0 bg-pale h-14 rounded-lg px-6 mt-1"
                                    placeholder="custom units e.g 1"
                                    value={filters.units}
                                    onChange={(e) => updateField("units", e.target.value)}
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">negotiable</span>
                            <div className="flex gap-2">
                                {(["any", "yes", "no"] as TriState[]).map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => updateField("negotiable", v)}
                                        className={`px-4 py-2 rounded-full text-sm capitalize transition-colors ${filters.negotiable === v
                                            ? "bg-primary text-white border-primary"
                                            : "bg-pale text-text border-text/10"
                                            }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* <div className="flex flex-col gap-2">
                            <span className="text-sm">available</span>
                            <div className="flex gap-2">
                                {(["any", "yes", "no"] as TriState[]).map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => updateField("available", v)}
                                        className={`px-4 py-2 rounded-full text-sm capitalize transition-colors ${filters.available === v
                                            ? "bg-primary text-white border-primary"
                                            : "bg-pale text-text border-text/10"
                                            }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div> */}

                        {/* <div className="flex flex-col gap-2">
                            <span className="text-sm">amenities</span>
                            <div className="flex flex-wrap gap-2">
                                {AMENITY_OPTIONS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag("amenities", tag)}
                                        className={`px-4 py-2 rounded-full text-sm transition-colors ${filters.amenities.includes(tag)
                                            ? "bg-primary text-white border-primary"
                                            : "bg-pale text-text border-text/10"
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div> */}

                        {/* <div className="flex flex-col gap-2">
                            <span className="text-sm">extras</span>
                            <div className="flex flex-wrap gap-2">
                                {EXTRA_OPTIONS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag("extras", tag)}
                                        className={`px-4 py-2 rounded-full text-sm transition-colors ${filters.extras.includes(tag)
                                            ? "bg-primary text-white border-primary"
                                            : "bg-pale text-text border-text/10"
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div> */}

                        <div className="min-h-20"></div>

                        <div className="flex gap-2 mt-2 fixed bottom-0 w-full left-0 p-4 backdrop-blur-md border-t border-text/10">
                            <button className="btn rounded-full bg-pale flex-1" onClick={handleReset}>
                                reset
                            </button>
                            <button
                                className="btn bg-primary rounded-full text-white flex-1 disabled:opacity-60"
                                onClick={handleApplyFilters}
                                disabled={applying}
                            >
                                {applying ? "applying..." : "apply filters"}
                            </button>
                        </div>

                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

export default Filter