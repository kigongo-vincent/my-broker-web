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
import { CheckBadgeIcon } from "@heroicons/react/20/solid"
import { TextCropper } from "../../../utils/text"
import { useNavigate } from "react-router"
import { useAppStore } from "../../../store/app"
import { motion } from "framer-motion"

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
const FLIP_BACK_DELAY = 3000 // how long the back stays showing

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
            className="h-14 w-14 shrink-0"
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
                        className="h-14 w-14 rounded-full object-cover"
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
                    <span className="text-lg font-semibold text-white">
                        {initials}
                    </span>
                </div>
            </motion.div>
        </div>
    )
}

export const User = ({ noActions, actions, post, ...u }: Props) => {

    const { getUserPhoto, user, getUser } = useUserStore()
    const navigate = useNavigate()
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const isAuthenticated = Boolean((user as UserI)?.ID)
    const { setSelectedPost, LoginPrompt } = useAppStore()

    const handleCall = () => {
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

    const handleChat = async (e: React.MouseEvent) => {
        if (isAuthenticated) {
            e.preventDefault()
            setSelectedPost(post)
            navigate(`/chat/${u?.ID || u.ID}`, { state: { user: u } })
        } else {
            LoginPrompt("direct messages")
        }

    }

    return (
        <div className={`flex cursor-pointer ${post && "px-4"} items-center justify-between`}>
            <div className="flex items-center gap-2">
                <FlipAvatar
                    photo={getUserPhoto?.(u.photo) || ""}
                    name={u?.name}
                    onClick={() => navigate(`/profile/${u?.ID}`)}
                />
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <p className="font-medium">
                            {TextCropper(u?.name, 23)}
                        </p>
                        {u?.verified && <CheckBadgeIcon className="h-6 w-6 text-primary" />}
                        {u?.broker && <div className="text-sm text-primary">broker</div>}
                    </div>
                    <span className="text-sm text-text/50">
                        last seen {u.lastSeen}
                    </span>
                </div>
            </div>

            {actions ? (
                actions
            ) : (
                (
                    <Activity mode={noActions || getUser()?.ID == u?.ID ? "hidden" : "visible"}>
                        <div className="flex gap-3">
                            {
                                !u?.hideContact && <button
                                    onClick={handleCall}
                                    className="bg-pale h-16 w-16 flex items-center justify-center rounded-full"
                                >
                                    <Lineicons icon={Telephone1Solid} />
                                </button>
                            }

                            <button
                                onClick={handleChat}
                                className="bg-pale h-16 w-16 flex items-center justify-center rounded-full"
                            >
                                <Lineicons icon={Message2Solid} />
                            </button>
                        </div>
                    </Activity>
                )
            )}

            <Modal position="bottom" open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)}>
                <div className="rounded-3xl bg-paper p-4">
                    <p className="text-xl font-semibold">Sign in to continue</p>
                    <p className="mt-2 text-sm text-text/60">Create an account or log in to contact owners, start chats, and save listings.</p>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => { setShowAuthPrompt(false); navigate("/auth/phone") }} className="btn flex-1 rounded-full bg-primary text-white">Log in</button>
                        <button onClick={() => setShowAuthPrompt(false)} className="btn flex-1 rounded-full bg-pale">Cancel</button>
                    </div>
                </div>
            </Modal>
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

const Post = (p: PostI) => {
    const [liked, setLiked] = useState(false)
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const { user, getUser } = useUserStore()
    const navigate = useNavigate()
    const isAuthenticated = Boolean((user as UserI)?.ID)
    const { setFavouritesCount, favouritesCount, LoginPrompt } = useAppStore()
    const isOwner = getUser()?.ID == p?.authorId
    const showAvailability = isOwner

    useEffect(() => {
        setLiked(Boolean(p?.favourites?.some(f => f?.ID == (user as UserI)?.ID)))
    }, [p?.favourites])

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
        <div className="flex flex-col gap-4" >
            {/* user */}
            {
                !p?.hideHeader && <User post={p} {...p.author} />

            }
            {/* assets */}
            <div onClick={handleClick} className={`flex gap-4  overflow-x-auto snap-x ${p?.hideHeader && "rounded-4xl"} snap-mandatory scrollbar-hide`}>
                {p.assets?.[0] && p.assets
                    .filter(item => item.type === "image" || item.type === "video")
                    .map((item, index) => {
                        const originalIndex = p.assets.findIndex(a => a.url === item.url);
                        const nextAsset = p.assets[originalIndex + 1];
                        const thumbnailSrc = nextAsset && nextAsset.type === "thumb" ? nextAsset.url : undefined;

                        return (
                            <div
                                key={index}
                                className="relative shrink-0 snap-center w-[100%] h-[50vh] min-h-max  overflow-hidden bg-pale"
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
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}

                                {/* first asset overlay only */}
                                {index === 0 && (
                                    <div className="absolute inset-0 p-4 flex flex-col justify-between bg-gradient-to-t from-black from-20% to-black/30 ">
                                        {/* actions */}
                                        <div className="flex justify-between ">

                                            <span className="bg-white text-dark font-medium text-sm flex items-center gap-2 h-max px-5 py-2 rounded-full">
                                                {p?.type || "residential"}
                                            </span>
                                            <button
                                                onClick={handleLike}
                                                className="bg-white/30 text-white p-4 rounded-2xl transition-transform active:scale-95"
                                            >
                                                <Lineicons icon={liked ? HeartSolid : HeartOutlined} />
                                            </button>
                                        </div>

                                        {/* details */}
                                        <div onClick={handleClick} className="flex flex-col gap-3 text-white cursor-pointer">
                                            {
                                                showAvailability && <div className={`${p?.available ? "bg-success" : "bg-danger"} w-max px-4 rounded-full text-sm font-medium py-2 text-white`}>
                                                    {p?.available == false && "un"}available
                                                </div>
                                            }
                                            <div className="flex gap-2 items-center">


                                                <h2 className="text-2xl font-medium">
                                                    {p.price.currency} {p.price.amount.toLocaleString("en-US")}
                                                </h2>

                                                <Activity mode={p.negotiable ? "visible" : "hidden"}>
                                                    <span className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm">
                                                        negotiable
                                                    </span>
                                                </Activity>
                                            </div>

                                            <div className="flex items-center gap-1 text-sm">
                                                <span>{TextCropper(p.location.name, 60)}</span>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                <div className="bg-white/10 min-w-max gap-1 px-4 h-12 flex items-center rounded-full">
                                                    {/* <img src="https://png.pngtree.com/png-vector/20230903/ourmid/pngtree-open-white-toilet-png-image_9951695.png" alt="" className="h-8 w-8 object-contain" /> */}
                                                    {p.toilets} {" "}
                                                    toilet{p.toilets !== 1 && "s"}
                                                </div>
                                                {/* <div className="bg-white/20 px-4 flex items-center py-3 rounded-full"> */}
                                                <div className="bg-white/10 min-w-max px-4 h-12 gap-1 flex items-center rounded-full">

                                                    {/* <img src="https://static.vecteezy.com/system/resources/thumbnails/046/853/951/small_2x/eco-friendly-shower-solutions-free-png.png" alt="" className="h-8 w-8 object-contain" /> */}
                                                    {p.bathrooms} {" "}
                                                    bathroom{p.bathrooms !== 1 && "s"}
                                                </div>
                                                {/* <div className="bg-white/20 px-4 flex items-center py-3 rounded-full"> */}
                                                <div className="bg-white/10 min-w-max px-4 h-12 gap-2 flex items-center rounded-full">

                                                    {/* <img src="https://www.transparentpng.com/download/bed/black-white-elegant-bed-png-hd--rgrF4o.png" alt="" className="h-8 w-8 object-contain" /> */}
                                                    {p.bedrooms} {" "}
                                                    bedroom{p.bedrooms !== 1 && "s"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                }
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