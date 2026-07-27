import { Get as ApiGet } from "../../../../api/index"
import Lineicons from "@lineiconshq/react-lineicons"
import { BaseI, UserI, useUserStore } from "../../../store/auth"
import Modal from "../../base/Modal"
import {
    HeartOutlined,
    HeartSolid,
    Message2Solid,
    Telephone1Solid
} from "@lineiconshq/free-icons"
import { Activity, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { CheckBadgeIcon, EllipsisVerticalIcon } from "@heroicons/react/20/solid"
import { Bed, Bathtub, Toilet } from "@phosphor-icons/react"
import { TextCropper } from "../../../utils/text"
import { useNavigate } from "react-router"
import { useAppStore } from "../../../store/app"
import { motion } from "framer-motion"
import { BottomSheet } from "react-spring-bottom-sheet"


// ------------------------------------------------------------

export const formatAmount = (amount: number): string => {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? "-" : ""

    const format = (value: number, suffix: string) => {
        const rounded = Math.round(value * 10) / 10
        return `${sign}${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`
    }

    if (abs >= 1_000_000_000) return format(abs / 1_000_000_000, "B")
    if (abs >= 1_000_000) return format(abs / 1_000_000, "M")
    if (abs >= 1_000) return format(abs / 1_000, "k")

    return `${sign}${abs}`
}

const capitalize = (s: string): string =>
    s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s

export const formatLocation = (location: string): string => {
    const parts = location
        .split(",")
        .map(p => p.trim())
        .filter(Boolean)
        .map(capitalize)
        .slice(0, 3)

    if (parts.length === 0) return ""
    if (parts.length === 1) return parts[0]

    const [first, second, ...rest] = parts
    return [`${first} ${second}`, ...rest].join(", ")
}
// ------------------------------------------------------------

export type PostType = "rental" | "short-stay" | "residential"
export type PostAssetType = "image" | "video" | "thumb"

export interface PostAssetI {
    url: string
    type: PostAssetType
}

export type Currency = "USD" | "UGX" | "kSH"

export interface CordinatesI {
    lat: number
    lon: number
}

export interface LocationI {
    cordinates: CordinatesI
    name: string
}

export interface PriceI {
    amount: number
    currency: Currency
}

export interface PostI extends BaseI {
    author: UserI
    authorId?: UserI
    type: PostType
    assets: PostAssetI[]
    price: PriceI
    location: LocationI
    favourites?: UserI[]
    bathrooms: number
    bedrooms: number
    toilets: number
    amenities: string[]
    negotiable: boolean
    extras: string[]
    months: number
    units: number
    approved: boolean
    liked?: boolean
    available: boolean
    hideHeader?: boolean
}

export const ValidatePost = (post: Partial<PostI>): string => {
    if (!post.type) {
        return "Post type is required"
    }

    if (!post.assets || post.assets.length === 0) {
        return "At least one asset is required"
    }

    if (!post.price) {
        return "Price is required"
    }

    if (!post.price.amount || post.price.amount <= 0) {
        return "Price amount must be greater than zero"
    }

    if (!post.price.currency) {
        return "Price currency is required"
    }

    if (!post.location) {
        return "Location is required"
    }

    if (!post.location.name) {
        return "Location name is required"
    }

    if (!post.location.cordinates) {
        return "Location coordinates are required"
    }

    if (
        post.location.cordinates.lat === undefined ||
        post.location.cordinates.lon === undefined
    ) {
        return "Invalid location coordinates"
    }

    if (post.bedrooms === undefined || post.bedrooms < 0) {
        return "Invalid number of bedrooms"
    }

    if (post.bathrooms === undefined) {
        return "Invalid number of bathrooms"
    }

    if (post.toilets === undefined) {
        return "Invalid number of toilets"
    }

    if (post.months === undefined || post.months < 0) {
        return "Invalid months value"
    }

    if (post.units === undefined || post.units < 1) {
        return "Units must be at least 1"
    }

    return ""
}

export interface Props extends UserI {
    noActions?: boolean
    actions?: ReactNode
    post?: PostI
}

// Gmail-like palette
const AVATAR_COLORS = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7",
    "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
    "#009688", "#4CAF50", "#FF9800", "#FF5722",
]

const getInitials = (name?: string) => {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    const initials = parts.length === 1
        ? parts[0].slice(0, 2)
        : parts[0][0] + parts[parts.length - 1][0]
    return initials.toUpperCase()
}

const getColorFromString = (str?: string) => {
    if (!str) return AVATAR_COLORS[0]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const FLIP_INTERVAL = 300 // flip every 30s while visible
const FLIP_BACK_DELAY = 600 // how long the back stays showing

const FlipAvatar = ({
    photo,
    name,
    onClick,
}: {
    photo: string
    name?: string
    onClick?: () => void
}) => {
    const [isFlipped, setIsFlipped] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.5 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!isVisible) return

        const interval = setInterval(() => {
            setIsFlipped(true)
            const backTimeout = setTimeout(() => setIsFlipped(false), FLIP_BACK_DELAY)
            return () => clearTimeout(backTimeout)
        }, FLIP_INTERVAL)

        return () => clearInterval(interval)
    }, [isVisible])

    const initials = useMemo(() => getInitials(name), [name])
    const bgColor = useMemo(() => getColorFromString(name), [name])

    return (
        <div
            ref={containerRef}
            onClick={onClick}
            className="h-12 w-12 shrink-0"
            style={{ perspective: 1000 }}
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            >
                {/* Front - photo */}
                <div
                    className="absolute inset-0"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <img
                        src={photo}
                        className="h-12 w-12 rounded-full object-cover"
                        alt=""
                    />
                </div>

                {/* Back - colored initials */}
                <div
                    className="absolute inset-0 flex items-center justify-center rounded-full"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        backgroundColor: bgColor,
                    }}
                >
                    <span className="text-base font-semibold text-white">
                        {initials}
                    </span>
                </div>
            </motion.div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// User header — modular, Instagram-style: dark bar, avatar + name/last-seen,
// and a single kebab menu that opens a bottom sheet with call/chat actions.
// ---------------------------------------------------------------------------
export const User = ({ noActions, actions, post, ...u }: Props) => {

    const { getUserPhoto, user, getUser } = useUserStore()
    const navigate = useNavigate()
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const [showActions, setShowActions] = useState(false)
    const isAuthenticated = Boolean((user as UserI)?.ID)
    const { setSelectedPost, LoginPrompt } = useAppStore()

    const handleCall = () => {
        setShowActions(false)
        if (!isAuthenticated) {
            LoginPrompt("direct messages")
            return
        }
        if (u?.phone) {
            window.open(`tel:${u.phone}`, "_self")
        } else {
            alert("Phone number is not available for this user.")
        }
    }

    const handleChat = async () => {
        setShowActions(false)
        if (isAuthenticated) {
            setSelectedPost(post)
            navigate(`/chat/${u?.ID || u.ID}`, { state: { user: u } })
        } else {
            LoginPrompt("direct messages")
        }
    }

    const canShowActions = !(noActions || getUser()?.ID == u?.ID)

    return (
        <div className={`flex cursor-pointer items-center justify-between  ${post && "px-4"} py-3`}>
            <div
                className="flex items-center gap-3"
                onClick={() => navigate(`/profile/${u?.ID}`)}
            >
                <FlipAvatar
                    photo={getUserPhoto?.(u.photo) || ""}
                    name={u?.name}
                />
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <p className="font-medium text-text">
                            {TextCropper(u?.name, 23)}
                        </p>
                        {u?.verified && <CheckBadgeIcon className="h-5 w-5 text-primary" />}
                        {u?.role == "broker" && <span className="text-xs text-primary">broker</span>}
                    </div>
                    <span className="text-sm text-text/50">
                        last seen {u.lastSeen}
                    </span>
                </div>
            </div>

            {actions ? (
                actions
            ) : (
                <Activity mode={canShowActions ? "visible" : "hidden"}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowActions(true) }}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 active:bg-white/10"
                    >
                        <EllipsisVerticalIcon className="h-6 w-6" />
                    </button>
                </Activity>
            )}

            {/* actions sheet */}
            <Modal position="bottom" open={showActions} onClose={() => setShowActions(false)}>
                <div className="flex flex-col gap-3 rounded-3xl bg-paper p-4">
                    {!u?.hideContact && (
                        <button
                            onClick={handleCall}
                            className="flex items-center gap-3 rounded-2xl bg-pale px-4 py-4"
                        >
                            <Lineicons icon={Telephone1Solid} />
                            <span className="font-medium">Call {u?.name}</span>
                        </button>
                    )}
                    <button
                        onClick={handleChat}
                        className="flex items-center gap-3 rounded-2xl bg-pale px-4 py-4"
                    >
                        <Lineicons icon={Message2Solid} />
                        <span className="font-medium">Message {u?.name}</span>
                    </button>
                </div>
            </Modal>

            <BottomSheet open={showAuthPrompt} onDismiss={() => setShowAuthPrompt(false)}>
                <div className="rounded-3xl bg-paper p-4">
                    <p className="text-xl font-semibold">Sign in to continue</p>
                    <p className="mt-2 text-sm text-text/60">Create an account or log in to contact owners, start chats, and save listings.</p>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => { setShowAuthPrompt(false); navigate("/auth/phone") }} className="btn flex-1 rounded-full bg-primary text-white">Log in</button>
                        <button onClick={() => setShowAuthPrompt(false)} className="btn flex-1 rounded-full bg-pale">Cancel</button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    )
}

const NativeLazyImage = ({ src, placeholderSrc, alt }: { src: string; placeholderSrc?: string; alt: string }) => {
    const [highResLoaded, setHighResLoaded] = useState(false);

    return (
        <div className="absolute inset-0 w-full h-full bg-pale overflow-hidden">
            {/* 1. Low-res blurred preview background layer */}
            {placeholderSrc && !highResLoaded && (
                <img
                    src={placeholderSrc}
                    className="absolute inset-0 w-full h-full object-cover scale-105 blur-xl transition-opacity duration-300 pointer-events-none"
                    alt=""
                />
            )}

            {/* 2. High-res target layer */}
            <img
                src={src}
                alt={alt}
                loading="lazy" // Native browser scheduling
                onLoad={() => setHighResLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${highResLoaded ? "opacity-100" : "opacity-0"
                    }`}
            />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Post — modular IG-style card:
//   1. dark header bar (User)
//   2. clean full-bleed media carousel with dot pagination
//   3. dark details panel below the media (location, price, stats)
// ---------------------------------------------------------------------------
const Post = (p: PostI) => {
    const [liked, setLiked] = useState(false)
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const { user, getUser } = useUserStore()
    const navigate = useNavigate()
    const isAuthenticated = Boolean((user as UserI)?.ID)
    const { setFavouritesCount, favouritesCount, LoginPrompt } = useAppStore()
    const isOwner = getUser()?.ID == p?.authorId
    const showAvailability = isOwner
    const scrollRef = useRef<HTMLDivElement>(null)

    const mediaAssets = useMemo(
        () => p.assets?.filter(item => item.type === "image" || item.type === "video") || [],
        [p.assets]
    )

    useEffect(() => {
        setLiked(Boolean(p?.favourites?.some(f => f?.ID == (user as UserI)?.ID)))
    }, [p?.favourites])

    const handleScroll = () => {
        const el = scrollRef.current
        if (!el || el.clientWidth === 0) return
        const index = Math.round(el.scrollLeft / el.clientWidth)
        setActiveIndex(index)
    }

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!isAuthenticated) {
            LoginPrompt("direct messages")
            return
        }

        const previousLikedState = liked
        if (previousLikedState) {
            setFavouritesCount(favouritesCount - 1)
        } else {
            setFavouritesCount(favouritesCount + 1)
        }
        setLiked(!previousLikedState)

        try {
            await ApiGet<any>(`posts/${p.ID}/favourite`)
        } catch (error) {
            setLiked(previousLikedState)
            console.error("Failed to toggle favourite on server:", error)
        }
    }

    const handleClick = () => {
        navigate(`/post/${p?.ID}`)
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl ">
            {/* user */}
            {!p?.hideHeader && <User post={p} {...p.author} />}

            {/* media */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onClick={handleClick}
                    className="flex h-[30vh] w-full snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                >
                    {mediaAssets.map((item, index) => {
                        const originalIndex = p.assets.findIndex(a => a.url === item.url)
                        const nextAsset = p.assets[originalIndex + 1]
                        const thumbnailSrc = nextAsset && nextAsset.type === "thumb" ? nextAsset.url : undefined

                        return (
                            <div
                                key={index}
                                className="relative h-full w-full shrink-0 snap-center overflow-hidden bg-pale"
                            >
                                {item.type === "image" ? (
                                    <NativeLazyImage
                                        alt={p.location?.name || ""}
                                        src={item.url}
                                        placeholderSrc={thumbnailSrc}
                                    />
                                ) : (
                                    <video
                                        src={item.url}
                                        controls
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* type chip */}
                <span className="absolute left-4 top-4 flex h-max items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-dark">
                    {p?.type || "residential"}
                </span>

                {/* like button */}
                <button
                    onClick={handleLike}
                    className="absolute right-4 top-4 rounded-2xl bg-black/30 p-4 text-white transition-transform active:scale-95"
                >
                    <Lineicons icon={liked ? HeartSolid : HeartOutlined} />
                </button>

                {/* pagination dots */}
                {mediaAssets.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
                        {mediaAssets.map((_, index) => (
                            <span
                                key={index}
                                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* details */}
            <div
                onClick={handleClick}
                className="flex cursor-pointer flex-col gap-3  px-4 py-4 "
            >
                {showAvailability && (
                    <div className={`${p?.available ? "bg-success" : "bg-danger"} w-max rounded-full px-4 py-2 text-sm font-medium text-white`}>
                        {p?.available == false && "un"}available
                    </div>
                )}

                <div className="text-text/60">
                    Located <span className=" text-text">{TextCropper(formatLocation(p.location.name), 60)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <h2 className=" underline decoration-2 underline-offset-2">
                        {p.price.currency} {formatAmount(p.price.amount)}
                    </h2>
                    <span className="text-text/60">/month</span>

                    <Activity mode={p.negotiable ? "visible" : "hidden"}>
                        <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary">
                            negotiable
                        </span>
                    </Activity>
                </div>

                <div className="flex flex-wrap gap-4 text-text/50">
                    <span className="flex items-center gap-1.5">
                        <Bed size={20} weight="fill" />
                        {p.bedrooms} bedroom{p.bedrooms !== 1 && "s"}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Toilet size={20} weight="fill" />
                        {p.toilets} toilet{p.toilets !== 1 && "s"}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Bathtub size={20} weight="fill" />
                        {p.bathrooms} bathroom{p.bathrooms !== 1 && "s"}
                    </span>
                </div>
            </div>

            <Modal hideClose position="bottom" open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)}>
                <div className="rounded-3xl bg-paper p-4">
                    <p className="text-xl font-semibold">Sign in to continue</p>
                    <p className="mt-2 text-sm text-text/60">Create an account or log in to like posts and use the full experience.</p>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => { setShowAuthPrompt(false); navigate("/auth/phone") }} className="btn flex-1 rounded-full bg-primary text-white">Log in</button>
                        <button onClick={() => setShowAuthPrompt(false)} className="btn flex-1 rounded-full bg-pale">Cancel</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Post