import { useState, useRef, useEffect, useCallback, ReactNode } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import Lineicons from "@lineiconshq/react-lineicons"
import { MapMarker5Solid, ArrowRightSolid, RefreshUser1Solid } from "@lineiconshq/free-icons"
import { FilterColumn } from "../../pages/tabs/user/Filter"
import { searchAddress, reverseGeocode } from "../../pages/tabs/user/Upload"
import { useAppStore } from "../../store/app"
import { PostType } from "../pages/tabs/Post"
import Header from "../pages/tabs/Header"

/* ---------------------------------------------------------------------- */
/* Conversation model                                                     */
/* ---------------------------------------------------------------------- */

interface ResolvedLocation {
    lat: number
    lon: number
    label: string
}

interface Answers {
    resolvedLocation: ResolvedLocation | null
    minPrice: string
    maxPrice: string
    bedroom: string // "" = any
    type: PostType | ""
    negotiable: "any" | "yes" | "no"
}

const initialAnswers: Answers = {
    resolvedLocation: null,
    minPrice: "",
    maxPrice: "",
    bedroom: "",
    type: "",
    negotiable: "any",
}

const PRICE_RANGES = [
    { label: "Under 200K", min: 0, max: 200_000 },
    { label: "200K – 450K", min: 200_000, max: 450_000 },
    { label: "450K – 1M", min: 450_000, max: 1_000_000 },
    { label: "1M – 2.5M", min: 1_000_000, max: 2_500_000 },
    { label: "2.5M+", min: 2_500_000, max: null as number | null },
]

const BEDROOM_OPTIONS = ["any", "0", "1", "2", "3", "4+"] as const

const TYPE_OPTIONS: { label: string; value: PostType }[] = [
    { label: "Residential", value: "residential" as PostType },
    { label: "Commercial", value: "commercial" as PostType },
    { label: "Hostel", value: "hostel" as PostType },
]

type StepKind = "location" | "price" | "bedroom" | "type" | "negotiable" | "summary"

const STEP_ORDER: StepKind[] = ["location", "price", "bedroom", "type", "negotiable", "summary"]

/* ---------------------------------------------------------------------- */
/* Transcript entry types — every question and every answer becomes a     */
/* bubble, appended in order, so the whole thing reads like a chat log.   */
/* ---------------------------------------------------------------------- */

interface Bubble {
    id: string
    from: "bot" | "user"
    content: ReactNode
}

// const formatUGX = (n: number) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n)

const botCopy: Record<StepKind, string> = {
    location: "Hey! Let's find you a place. Where should we search?",
    price: "Got it. What's your budget per month?",
    bedroom: "How many bedrooms are you after?",
    type: "What kind of property is this?",
    negotiable: "Last thing — does the price need to be negotiable?",
    summary: "Here's what I've got. Ready to see matching properties?",
}

/* ---------------------------------------------------------------------- */
/* Presentational bits                                                    */
/* ---------------------------------------------------------------------- */

const BotBubble = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-end gap-2 max-w-[85%]"
    >
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-1">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <div className="bg-pale rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-6">{children}</div>
    </motion.div>
)

const UserBubble = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end"
    >
        <div className="bg-primary text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-6 max-w-[85%]">
            {children}
        </div>
    </motion.div>
)

// const ChipRow = ({ children }: { children: ReactNode }) => (
//     <div className="flex flex-wrap gap-2 pl-9">{children}</div>
// )

const Chip = ({
    active,
    onClick,
    children,
}: {
    active?: boolean
    onClick: () => void
    children: ReactNode
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`btn rounded-full text-sm transition-colors ${active ? "bg-primary text-white" : "bg-pale text-text"
            }`}
    >
        {children}
    </button>
)

/* ---------------------------------------------------------------------- */
/* Main component                                                         */
/* ---------------------------------------------------------------------- */

const ChatFilter = () => {
    const navigate = useNavigate()
    const { updateFilters } = useAppStore()

    const [answers, setAnswers] = useState<Answers>(initialAnswers)
    const [stepIndex, setStepIndex] = useState(0)
    const [bubbles, setBubbles] = useState<Bubble[]>([
        { id: "b-0", from: "bot", content: botCopy.location },
    ])
    const [locationInput, setLocationInput] = useState("")
    const [locating, setLocating] = useState(false)
    const [searching, setSearching] = useState(false)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [applying, setApplying] = useState(false)
    const [keyboardOffset, setKeyboardOffset] = useState(0)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const currentStep = STEP_ORDER[stepIndex]

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, [bubbles])

    /* ---- keep the header fixed and only resize the scrollable body   */
    /* when the on-screen keyboard opens (visualViewport), instead of   */
    /* letting the whole page get pushed up/resized by the keyboard.    */
    useEffect(() => {
        const vv = window.visualViewport
        if (!vv) return

        const handleResize = () => {
            const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
            setKeyboardOffset(offset)
        }

        vv.addEventListener("resize", handleResize)
        vv.addEventListener("scroll", handleResize)
        handleResize()

        return () => {
            vv.removeEventListener("resize", handleResize)
            vv.removeEventListener("scroll", handleResize)
        }
    }, [])

    const pushBubble = (from: Bubble["from"], content: ReactNode) => {
        setBubbles((p) => [...p, { id: `${from}-${p.length}`, from, content }])
    }

    const advance = (userAnswerLabel: ReactNode) => {
        pushBubble("user", userAnswerLabel)
        const next = STEP_ORDER[stepIndex + 1]
        setStepIndex((i) => i + 1)
        if (next) {
            setTimeout(() => pushBubble("bot", botCopy[next]), 300)
        }
    }

    /* ---- location ---- */

    const handleLocationTyping = (value: string) => {
        setLocationInput(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (value.trim().length < 3) {
            setSuggestions([])
            return
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true)
            try {
                const results = await searchAddress(value)
                setSuggestions(results)
            } catch {
                setSuggestions([])
            } finally {
                setSearching(false)
            }
        }, 350)
    }

    const chooseLocation = (loc: ResolvedLocation) => {
        setAnswers((p) => ({ ...p, resolvedLocation: loc }))
        setSuggestions([])
        setLocationInput("")
        advance(loc.label)
    }

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) return
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords
                try {
                    const data = await reverseGeocode(latitude, longitude)
                    chooseLocation({
                        lat: latitude,
                        lon: longitude,
                        label: data.display_name || `${latitude}, ${longitude}`,
                    })
                } catch {
                    chooseLocation({ lat: latitude, lon: longitude, label: `${latitude}, ${longitude}` })
                } finally {
                    setLocating(false)
                }
            },
            () => setLocating(false)
        )
    }

    /* ---- price ---- */

    const choosePriceRange = (range: (typeof PRICE_RANGES)[number]) => {
        setAnswers((p) => ({
            ...p,
            minPrice: String(range.min),
            maxPrice: range.max === null ? "" : String(range.max),
        }))
        advance(range.max === null ? `${range.label} (UGX)` : `${range.label} UGX`)
    }

    /* ---- bedroom ---- */

    const chooseBedroom = (opt: (typeof BEDROOM_OPTIONS)[number]) => {
        const value = opt === "any" ? "" : opt === "4+" ? "4" : opt
        setAnswers((p) => ({ ...p, bedroom: value }))
        advance(opt === "any" ? "No preference" : `${opt} bedroom${opt === "1" ? "" : "s"}`)
    }

    /* ---- type ---- */

    const chooseType = (t: (typeof TYPE_OPTIONS)[number]) => {
        setAnswers((p) => ({ ...p, type: t.value }))
        advance(t.label)
    }

    /* ---- negotiable ---- */

    const chooseNegotiable = (v: Answers["negotiable"]) => {
        setAnswers((p) => ({ ...p, negotiable: v }))
        advance(v === "any" ? "Doesn't matter" : v === "yes" ? "Yes, negotiable" : "No, fixed price")
    }

    /* ---- build FilterColumn[] identical in shape to Filter.tsx ---- */

    const buildColumns = useCallback((): FilterColumn[] => {
        const columns: FilterColumn[] = []

        if (answers.resolvedLocation) {
            columns.push({
                column: "location",
                operator: "within_radius",
                label: "location",
                value: {
                    lat: answers.resolvedLocation.lat,
                    lon: answers.resolvedLocation.lon,
                    radius: 800,
                },
            })
        }
        if (answers.minPrice) {
            columns.push({
                column: "(price->>'amount')::numeric",
                operator: "gte",
                label: `> ${Number(answers.minPrice).toLocaleString("en-US")}`,
                value: Number(answers.minPrice),
            })
        }
        if (answers.maxPrice) {
            columns.push({
                column: "(price->>'amount')::numeric",
                operator: "lte",
                label: `< ${Number(answers.maxPrice).toLocaleString("en-US")}`,
                value: Number(answers.maxPrice),
            })
        }
        if (answers.bedroom) {
            columns.push({ column: "bedrooms", operator: "eq", value: Number(answers.bedroom), label: "bedrooms" })
        }
        if (answers.type) {
            columns.push({ column: "type", operator: "eq", value: answers.type, label: "property type" })
        }
        if (answers.negotiable !== "any") {
            columns.push({
                column: "negotiable",
                operator: "eq",
                value: answers.negotiable === "yes",
                label: "barginable",
            })
        }

        return columns
    }, [answers])

    const handleApply = async () => {
        setApplying(true)
        try {
            updateFilters(buildColumns())
            navigate("/tabs/user")
        } finally {
            setApplying(false)
        }
    }

    const handleRestart = () => {
        setAnswers(initialAnswers)
        setStepIndex(0)
        setBubbles([{ id: "b-0", from: "bot", content: botCopy.location }])
        setSuggestions([])
        setLocationInput("")
    }

    /* ---------------------------------------------------------------- */
    /* Input area — swaps based on currentStep                          */
    /* ---------------------------------------------------------------- */

    const renderInputArea = () => {
        switch (currentStep) {
            case "location":
                return (
                    <div className="flex flex-col gap-3  w-full">
                        <div className="bg-pale w-full rounded-full h-16 flex gap-2 items-center px-5 relative">
                            <Lineicons icon={MapMarker5Solid} className="text-text/50" />
                            <input
                                type="text"
                                value={locationInput}
                                onChange={(e) => handleLocationTyping(e.target.value)}
                                placeholder="Type a neighborhood or address..."
                                className="flex-1  outline-0 bg-transparent"
                            />
                            {suggestions.length > 0 && (
                                <div className="bg-pale rounded-xl flex flex-col absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-20 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                                    {suggestions.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={() =>
                                                chooseLocation({
                                                    lat: parseFloat(item.lat),
                                                    lon: parseFloat(item.lon),
                                                    label: item.display_name,
                                                })
                                            }
                                            className="p-3 text-text/80 hover:bg-black/5 cursor-pointer text-sm border-b border-text/5 last:border-0"
                                        >
                                            {item.display_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            disabled={locating}
                            onClick={handleUseCurrentLocation}
                            className="btn bg-primary  w-full rounded-full text-white disabled:opacity-60"
                        >
                            {searching && <span className="text-xs opacity-70 mr-1">searching…</span>}
                            {locating ? "locating..." : "use current location"}
                        </button>
                    </div>
                )

            case "price":
                return (
                    <div className="flex flex-wrap gap-2">
                        {PRICE_RANGES.map((range) => (
                            <Chip key={range.label} onClick={() => choosePriceRange(range)}>
                                {range.label}
                            </Chip>
                        ))}
                    </div>
                )

            case "bedroom":
                return (
                    <div className="flex flex-wrap gap-2">
                        {BEDROOM_OPTIONS.map((opt) => (
                            <Chip key={opt} onClick={() => chooseBedroom(opt)}>
                                {opt === "any" ? "Any" : opt}
                            </Chip>
                        ))}
                    </div>
                )

            case "type":
                return (
                    <div className="flex flex-wrap gap-2">
                        {TYPE_OPTIONS.map((t) => (
                            <Chip key={t.value} onClick={() => chooseType(t)}>
                                {t.label}
                            </Chip>
                        ))}
                    </div>
                )

            case "negotiable":
                return (
                    <div className="flex flex-wrap gap-2">
                        <Chip onClick={() => chooseNegotiable("any")}>Doesn't matter</Chip>
                        <Chip onClick={() => chooseNegotiable("yes")}>Yes</Chip>
                        <Chip onClick={() => chooseNegotiable("no")}>No</Chip>
                    </div>
                )

            case "summary": {
                return (
                    <div className="flex flex-col gap-4">
                        {/* <div className="bg-pale rounded-2xl p-4 flex flex-col gap-2">
                            {columns.length === 0 && (
                                <p className="text-sm text-text/50">No filters set — this will show everything.</p>
                            )}
                            {columns.map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <Lineicons icon={CheckCircle1Solid} className="text-primary shrink-0" size={16} />
                                    <span className="capitalize text-text/80">{c.label ?? c.column}</span>
                                </div>
                            ))}
                        </div> */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleRestart}
                                className="btn bg-pale rounded-full flex-1"
                            >
                                <Lineicons icon={RefreshUser1Solid} size={16} />
                                <span>start over</span>
                            </button>
                            <button
                                type="button"
                                disabled={applying}
                                onClick={handleApply}
                                className="btn bg-primary min-w-max rounded-full text-white flex-1 disabled:opacity-60"
                            >
                                <span>{applying ? "applying..." : "show properties"}</span>
                                {!applying && <Lineicons icon={ArrowRightSolid} size={16} />}
                            </button>
                        </div>
                    </div>
                )
            }

            default:
                return null
        }
    }

    return (
        <>
            {/* Header sits outside the viewport-driven wrapper below, so the      */}
            {/* on-screen keyboard (which shrinks visualViewport) never moves it.  */}
            <Header back title="Find a place" caption="answer a few quick questions" />

            <div
                className="flex flex-col overflow-hidden"
                style={{ height: `calc(100dvh - ${keyboardOffset}px)` }}
            >
                <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 pb-2">
                    <AnimatePresence initial={false}>
                        {bubbles.map((b) =>
                            b.from === "bot" ? (
                                <BotBubble key={b.id}>{b.content}</BotBubble>
                            ) : (
                                <UserBubble key={b.id}>{b.content}</UserBubble>
                            )
                        )}
                    </AnimatePresence>
                </div>

                <div className="fixed w-full  bottom-0 px-4 pt-3 pb-4  backdrop-blur-lg border-t border-text/5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            className=" flex justify-center"
                            key={currentStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderInputArea()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </>
    )
}

export default ChatFilter