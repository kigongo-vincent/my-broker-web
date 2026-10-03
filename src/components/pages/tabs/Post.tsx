import { Get as ApiGet } from "../../../../api/index"
import Lineicons from "@lineiconshq/react-lineicons"
import { BaseI, UserI, useUserStore } from "../../../store/auth"
import Modal from "../../base/Modal"
import {
    HeartOutlined,
    HeartSolid,
    Message2Outlined,
    Telephone1Solid,
    WhatsappOutlined
} from "@lineiconshq/free-icons"
import { Activity, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { CheckBadgeIcon, EllipsisVerticalIcon } from "@heroicons/react/20/solid"
import { Bed, Bathtub, Toilet } from "@phosphor-icons/react"
import { TextCropper } from "../../../utils/text"
import { useNavigate } from "react-router"
import { useAppStore } from "../../../store/app"
import { BottomSheet } from "react-spring-bottom-sheet"
import TikTokVideo, { getSafeTikTokVideoUrl } from "./TikTokVideo"
import GoogleLogo from "../../../assets/google-maps-logo.webp"


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

// Normalises a phone number to international format. A leading 0 becomes +256
// (Uganda), e.g. "0743 914 230" -> "+256743914230".
export const formatPhone = (raw?: string): string => {
    if (!raw) return ""
    const cleaned = raw.replace(/[^\d+]/g, "")
    if (!cleaned) return ""
    if (cleaned.startsWith("+")) return "+" + cleaned.slice(1).replace(/\D/g, "")
    if (cleaned.startsWith("00")) return "+" + cleaned.slice(2)
    if (cleaned.startsWith("0")) return "+256" + cleaned.slice(1)
    if (cleaned.startsWith("256")) return "+" + cleaned
    return cleaned.length <= 9 ? "+256" + cleaned : "+" + cleaned
}

// wa.me wants digits only (no "+"). Without a phone it opens WhatsApp's contact picker.
export const whatsappLink = (phone?: string, text?: string): string => {
    const digits = formatPhone(phone).replace(/\D/g, "")
    const query = text ? `?text=${encodeURIComponent(text)}` : ""
    return `https://wa.me/${digits}${query}`
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
    authorId?: number
    source?: "backend" | "tiktok"
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

const formatPostedTime = (date?: string) => {
    if (!date) return ""
    const timestamp = new Date(date).getTime()
    if (!Number.isFinite(timestamp)) return ""

    const seconds = Math.round((timestamp - Date.now()) / 1000)
    const intervals: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 60 * 60 * 24 * 365],
        ["month", 60 * 60 * 24 * 30],
        ["week", 60 * 60 * 24 * 7],
        ["day", 60 * 60 * 24],
        ["hour", 60 * 60],
        ["minute", 60],
    ]
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    for (const [unit, size] of intervals) {
        if (Math.abs(seconds) >= size) {
            return `posted ${formatter.format(Math.round(seconds / size), unit)}`
        }
    }
    return "posted just now"
}

const UserAvatar = ({ photo, name }: { photo: string; name?: string }) => {
    const initials = getInitials(name)
    const bgColor = getColorFromString(name)
    return (
        <div className="isolate flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: bgColor }}>
            {photo ? (
                <img src={photo} className="block h-full w-full rounded-full object-cover" alt="" />
            ) : (
                <span className="text-base font-semibold text-white">{initials}</span>
            )}
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

    // Google Maps link: prefer exact coordinates, fall back to the place name
    const mapsUrl = (() => {
        const lat = post?.location?.cordinates?.lat
        const lon = post?.location?.cordinates?.lon
        if (typeof lat === "number" && typeof lon === "number" && Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)) {
            return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
        }
        const name = post?.location?.name?.trim()
        return name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}` : ""
    })()

    const handleOpenMap = () => {
        setShowActions(false)
        if (mapsUrl) window.open(mapsUrl, "_blank", "noopener,noreferrer")
    }

    const isTikTokUser = u.source === "tiktok" || post?.source === "tiktok"
    const canShowActions = !noActions && (isTikTokUser || getUser()?.ID != u?.ID)
    function handleWhatsApp(): void {
        if (!isAuthenticated) {
            LoginPrompt("direct messages")
            return
        }

        if (u?.phone) {
            const tikTokUrl = post?.source === "tiktok"
                ? getSafeTikTokVideoUrl(post.assets?.find((a) => a.type === "video")?.url ?? "")
                : undefined
            window.open(
                whatsappLink(u.phone, tikTokUrl ? `Hi, I'm interested in this property: ${tikTokUrl}` : undefined),
                "_blank",
                "noopener,noreferrer"
            )
        } else {
            alert("Phone number is not available for this user.")
        }
    }

    return (
        <div className={`flex cursor-pointer items-center justify-between  ${post && "px-4"} py-3`}>
            <div
                className="flex items-center gap-3"
                onClick={() => navigate(
                    u.source === "tiktok" && u.username
                        ? `/profile/tiktok/${encodeURIComponent(u.username)}`
                        : `/profile/${u?.ID}`
                )}
            >
                <UserAvatar
                    photo={getUserPhoto?.(u.photo) || ""}
                    name={u?.name}
                />
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <p className="font-medium text-text">
                            {TextCropper(u?.name, 23)}
                        </p>
                        {u?.verification == "approved" && <CheckBadgeIcon className="h-6 w-6 text-primary" />}
                        {u?.role == "broker" && <span className="text-sm font-medium text-primary">broker</span>}
                    </div>
                    {isTikTokUser ? (
                        post?.CreatedAt && (
                            <span className="text-sm text-text/50">
                                {formatPostedTime(post.CreatedAt)}
                            </span>
                        )
                    ) : u.lastSeen && (
                        <span className="text-sm text-text/50">
                            last seen {u.lastSeen}
                        </span>
                    )}
                </div>
            </div>

            {actions ? (
                actions
            ) : canShowActions ? (
                <button
                    onClick={(e) => { e.stopPropagation(); setShowActions(true) }}
                    className="flex h-10 w-10 items-center justify-center "
                >
                    <EllipsisVerticalIcon className="h-9 w-9" />
                </button>
            ) : null}

            {/* actions sheet */}
            <BottomSheet open={showActions} onDismiss={() => setShowActions(false)}>
                <div className="flex flex-col gap-3  rounded-3xl  p-4 py-10">
                    {!u?.hideContact && (
                        <button
                            onClick={handleCall}
                            className="btn
                            w-full justify-start
                            "
                        >
                            <Lineicons icon={Telephone1Solid} />
                            <span >Call {u?.name}</span>
                        </button>
                    )}
                    {u.source !== "tiktok" && (
                        <button
                            onClick={handleChat}
                            className="btn w-full justify-start"
                        >
                            <Lineicons icon={Message2Outlined} />
                            <span>Message {u?.name}</span>
                        </button>
                    )}
                    {!u?.hideContact && (
                        <button
                            onClick={handleWhatsApp}
                            className="btn
                            w-full justify-start
                            "
                        >
                            <Lineicons icon={WhatsappOutlined} />
                            <span >chat via whatsapp</span>
                        </button>
                    )}
                    {mapsUrl && (
                        <button
                            onClick={handleOpenMap}
                            className="btn w-full justify-start"
                        >
                            <img src={GoogleLogo} className="h-6 w-6 object-contain" alt="" />
                            <span>open in google maps</span>
                        </button>
                    )}
                </div>
            </BottomSheet>

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

export const NativeLazyImage = ({ src, placeholderSrc, alt }: { src: string; placeholderSrc?: string; alt: string }) => {
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

export interface postProps extends PostI {
    hideAvailability?: boolean
}

const Post = ({ hideAvailability, ...p }: postProps) => {
    const [liked, setLiked] = useState(false)
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const { user, getUser } = useUserStore()
    const navigate = useNavigate()
    const isAuthenticated = Boolean((user as UserI)?.ID)
    const { setFavouritesCount, favouritesCount, LoginPrompt } = useAppStore()
    const currentUserId = getUser()?.ID
    const isOwner =
        p.source !== "tiktok" &&
        currentUserId !== undefined &&
        currentUserId === p.authorId
    const showAvailability = isOwner && !hideAvailability
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

        if (p.source === "tiktok") {
            return
        }
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
        if (p.source === "tiktok") return
        navigate(
            `/post/${p?.ID}`
        )
    }

    return (
        <div className="flex flex-col overflow-hidden  ">
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
                                    p.source === "tiktok" ? (
                                        <TikTokVideo url={item.url} poster={thumbnailSrc} />
                                    ) : (
                                        <video
                                            src={item.url}
                                            controls
                                            preload="none"
                                            playsInline
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    )
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* type chip */}
                {p.source !== "tiktok" && (
                    <span className="absolute left-4 top-4 flex h-max items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-dark">
                        {p?.type || "residential"}
                    </span>
                )}

                {/* like button */}
                {p.source !== "tiktok" && (
                    <button
                        onClick={handleLike}
                        className="absolute right-4 top-4 rounded-2xl bg-black/30 p-4 text-white transition-transform active:scale-95"
                    >
                        <Lineicons icon={liked ? HeartSolid : HeartOutlined} />
                    </button>
                )}

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


                {p.location?.name?.trim() && (
                    <div className="text-text/60">
                        Located <span className=" text-text">{TextCropper(formatLocation(p.location.name), 60)}</span>
                    </div>
                )}

                {(p.price?.amount > 0 || showAvailability) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {p.price?.amount > 0 && (
                            <>
                                <h2 className=" underline decoration-2 underline-offset-2">
                                    {p.price.currency} {formatAmount(p.price.amount)}
                                </h2>
                                <span className="text-text/60">/month</span>
                                <Activity mode={p.negotiable ? "visible" : "hidden"}>
                                    <span className="rounded-full bg-primary text-white px-2 py-1 text-xs ">
                                        negotiable
                                    </span>
                                </Activity>
                            </>
                        )}
                        {showAvailability && (
                            <div className={`${p?.available ? "bg-success" : "bg-danger"} w-max rounded-full px-2 py-1 text-xs font-medium text-white`}>
                                {p?.available == false && "un"}available
                            </div>
                        )}
                    </div>
                )}

                {(p.bedrooms > 0 || p.toilets > 0 || p.bathrooms > 0) && (
                    <div className="flex flex-wrap gap-4 text-text/50">
                        {p.bedrooms > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Bed size={20} weight="fill" />
                                {p.bedrooms} bedroom{p.bedrooms !== 1 && "s"}
                            </span>
                        )}
                        {p.toilets > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Toilet size={20} weight="fill" />
                                {p.toilets} toilet{p.toilets !== 1 && "s"}
                            </span>
                        )}
                        {p.bathrooms > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Bathtub size={20} weight="fill" />
                                {p.bathrooms} bathroom{p.bathrooms !== 1 && "s"}
                            </span>
                        )}
                    </div>
                )}
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