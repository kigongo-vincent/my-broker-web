import { Activity, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { formatAmount, formatLocation, PostI, User } from "../../../components/pages/tabs/Post"
import Header from "../../../components/pages/tabs/Header"
import GoogleLogo from "../../../assets/google-maps-logo.webp"
import MapComponent from "../../../components/pages/upload/Map"
import Modal from "../../../components/base/Modal"
import { ExclamationTriangleIcon, PhoneIcon } from "@heroicons/react/20/solid"
import { CategoryI } from "./Upload"
import Lineicons from "@lineiconshq/react-lineicons"
import { ChatBubble2Solid, EyeSolid, Pencil1Solid, Trash3Solid, WhatsappOutlined, Telephone1Solid, XmarkSolid } from "@lineiconshq/free-icons"
import { UserI, useUserStore } from "../../../store/auth"
import useSystemTheme from "../../../hooks/theme"
import { ColorScheme } from "@vis.gl/react-google-maps"
import { usePostDetails } from "../../../hooks/posts"
import electricityIcon from "../../../assets/upload/electricity.webp";
import waterIcon from "../../../assets/upload/water.webp";
import parkingIcon from "../../../assets/upload/parking.webp";
import trashIcon from "../../../assets/upload/trash.webp";
import { useAppStore } from "../../../store/app"
import Loader from "../../../components/base/Loader"
import { DeleteReq, Put } from "../../../../api"
import { BottomSheet } from "react-spring-bottom-sheet"
import { PostSkeleton } from "../../../components/base/PageSkeleton"
import { Bed, Toilet, Bathtub } from "@phosphor-icons/react"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"
import TikTokVideo, { getSafeTikTokVideoUrl } from "../../../components/pages/tabs/TikTokVideo"

interface IconI {
    url: string;
    label: IconType;
}

export const icons = [
    { url: parkingIcon, label: "parking" },
    { url: waterIcon, label: "water" },
    { url: electricityIcon, label: "electricity" },
    { url: trashIcon, label: "trash" },
] as IconI[];
export type IconType = "parking" | "water" | "electricity" | "trash";

export const IconFinder = (i: IconType | string): string => {
    return icons.find((ii) => ii?.label == i)?.url || "";
};

const TikTokBrandIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
        <path fill="#25F4EE" d="M13.3 2h3.1c.2 1.8 1.2 3.4 2.8 4.3.9.5 1.8.8 2.8.9v3.2a10 10 0 0 1-5.6-1.8v7.2a6.7 6.7 0 1 1-6.7-6.7c.5 0 1 .1 1.5.2v3.4a3.4 3.4 0 1 0 2.1 3.1V2z" transform="translate(-1.1 1.2)" />
        <path fill="#FE2C55" d="M13.3 2h3.1c.2 1.8 1.2 3.4 2.8 4.3.9.5 1.8.8 2.8.9v3.2a10 10 0 0 1-5.6-1.8v7.2a6.7 6.7 0 1 1-6.7-6.7c.5 0 1 .1 1.5.2v3.4a3.4 3.4 0 1 0 2.1 3.1V2z" transform="translate(.8 -.5)" />
        <path fill="#000000" d="M13.3 2h3.1c.2 1.8 1.2 3.4 2.8 4.3.9.5 1.8.8 2.8.9v3.2a10 10 0 0 1-5.6-1.8v7.2a6.7 6.7 0 1 1-6.7-6.7c.5 0 1 .1 1.5.2v3.4a3.4 3.4 0 1 0 2.1 3.1V2z" />
    </svg>
);

// A single real asset (image or video) paired with its low-res thumb, if any.
interface MediaPair {
    full: { url: string; type: string };
    thumb?: { url: string; type: string };
}

const PostAuthorActions = ({ ...p }: Partial<PostI>) => {
    const navigate = useNavigate()
    const { setPostToUpdate, setError, setSuccess, } = useAppStore()
    const [showDelete, setShowDelete] = useState(false)
    const [available, setAvailable] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const handleEdit = () => {
        setPostToUpdate(p as PostI)
        navigate(`/upload`)
    }

    useEffect(() => {
        setAvailable(Boolean(p?.available))
    }, [p?.available])

    const handleDelete = async () => {
        try {
            const { status, msg } = await DeleteReq<unknown>("posts/post/" + p?.ID)
            if (status != 200) {
                setError({ title: "Delete error", body: msg || "" })
                return
            }
            setSuccess({ title: "Success", body: "the property was removed successfully" })
            navigate(-1)
        } catch (error) {

        } finally {
            setDeleting(false)
        }
    }

    const handleAvailability = () => {

        try {
            setAvailable(!available)
            Put<Partial<PostI>, unknown>("posts/post/" + p?.ID, { ID: p?.ID, available: !p?.available })
        } catch (error) {

        }

    }

    return <div className="flex items-center gap-2  w-full">
        <button onClick={handleAvailability} className={`btn ${available ? "bg-danger" : "bg-success"} text-white rounded-full flex-1`}>
            <Lineicons icon={!available ? EyeSolid : XmarkSolid} />
            mark {available == true ? "taken" : "available"}
        </button>
        <button className="btn" onClick={() => setShowDelete(true)}>
            <Lineicons icon={Trash3Solid} />
        </button>
        <button onClick={handleEdit} className="btn">
            <Lineicons icon={Pencil1Solid} />
        </button>

        {/* delete confirmation */}
        <Modal open={showDelete} onClose={() => setShowDelete(false)} actions={<><button className="btn flex-1 bg-pale" onClick={() => setShowDelete(false)}>cancel</button><button className="btn bg-danger flex-1 text-white" onClick={handleDelete}><Loader loading={deleting}>delete</Loader></button></>}>
            <h3 className=" text-xl font-semibold">Delete confirmation</h3>
            <p className="text-text/50">Are you sure you want to proceed with deleting this property</p>
        </Modal>
    </div>
}

const PostDetails = () => {
    const [showMaP, setShowMap] = useState(false)
    const [image, setImage] = useState("")
    const { theme } = useSystemTheme()
    const { user, getUser } = useUserStore()



    const navigate = useNavigate()
    const isAuthenticated = Boolean((user as UserI)?.ID)


    const { data, isLoading, isError, error } = usePostDetails()
    const post = data
    const ammenities = post?.amenities?.map(a => ({ label: a, icon: IconFinder(a) } as CategoryI))
    const UserID = getUser()?.ID
    const PostAuthorID = post?.author.ID
    const IsOwner =
        Boolean(post) &&
        post?.source !== "tiktok" &&
        UserID !== undefined &&
        UserID === PostAuthorID
    const sheetRef = useRef(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const { LoginPrompt } = useAppStore()
    const scrollRef = useRef<HTMLDivElement>(null)
    const handleScroll = () => {
        const el = scrollRef.current
        if (!el || el.clientWidth === 0) return
        const index = Math.round(el.scrollLeft / el.clientWidth)
        setActiveIndex(index)
    }

    // Pair each real asset (image/video) with the thumb that immediately
    // follows it in the raw assets array, so thumbs act as blur-up
    // placeholders instead of showing up as their own carousel slides.
    const mediaAssets = useMemo<MediaPair[]>(() => {
        const pairs: MediaPair[] = []
        post?.assets?.forEach(item => {
            if (item.type === "image" || item.type === "video") {
                pairs.push({ full: item })
            } else if (item.type === "thumb" && pairs.length) {
                pairs[pairs.length - 1].thumb = item
            }
        })
        return pairs
    }, [post?.assets])
    const originalTikTokUrl =
        post?.source === "tiktok"
            ? getSafeTikTokVideoUrl(
                post.assets?.find((asset) => asset.type === "video")?.url ?? ""
            )
            : undefined;
    const tikTokContactDisabled = Boolean(
        post?.author?.hideContact || !post?.author?.phone
    );

    if (isLoading) {
        return (
            <>
                <Header back noMargin />
                <PostSkeleton />
            </>
        )
    }

    if (isError) {
        return (
            <>
                <Header back noMargin />
                <div className="p-6 text-center text-red-500">
                    Failed to load post: {(error as Error)?.message}
                </div>
            </>
        )
    }
    if (!post) {
        return (
            <>
                <Header back noMargin />
                <div className="p-6 text-center text-text/60">Post not found.</div>
            </>
        )
    }

    return (
        <div className="w-full">
            <Header back noMargin />

            <Activity mode={showMaP ? "hidden" : "visible"}>
                <button onClick={() => setShowMap(true)} className="fixed border border-text/10 z-100 btn max-w-max left-[50%] top-30 transform -translate-x-[50%] rounded-full bg-paper ">
                    <img src={GoogleLogo} className="h-8 w-8" alt="" />
                    <span>open map</span>
                </button>
            </Activity>

            {/* assets */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="
                    flex
                    gap-4
                    overflow-x-auto
                    snap-x
                    snap-mandatory
                    scrollbar-hide
                "
            >

                {
                    mediaAssets.map(({ full, thumb }, index) => (

                        <div
                            key={index}
                            className="
                                relative
                                shrink-0
                                snap-center
                                w-full
                                h-[60vh]

                                overflow-hidden
                                bg-pale
                            "
                        >

                            {
                                full.type === "image"
                                    ?
                                    <LazyLoadImage
                                        onClick={() => setImage(full.url)}
                                        src={full.url}
                                        placeholderSrc={thumb?.url}
                                        effect="blur"
                                        wrapperClassName="!absolute !inset-0 w-full h-full"
                                        className="
                                            cursor-pointer
                                            absolute
                                            inset-0
                                            w-full
                                            h-full
                                            object-cover
                                        "
                                        alt=""
                                    />
                                    :
                                    post?.source === "tiktok" ? (
                                        <TikTokVideo url={full.url} poster={thumb?.url} />
                                    ) : (
                                        <video
                                            src={full.url}
                                            poster={thumb?.url}
                                            controls
                                            preload="none"
                                            playsInline
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    )
                            }

                            {mediaAssets.length > 1 && (
                                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
                                    {mediaAssets.map((_, i) => (
                                        <span
                                            key={i}
                                            className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>

                    ))
                }

            </div>


            <div className="p-4 flex  flex-col gap-2">
                <br />
                <User {...post?.author as UserI} noActions />
                {post.source === "tiktok" && post.author?.phone && (
                    <a
                        href={`tel:${post.author.phone}`}
                        className="mx-4 -mt-2 mb-2 w-fit text-sm font-medium text-primary underline underline-offset-2"
                    >
                        {post.author.phone}
                    </a>
                )}
                <br />
                <div className="flex flex-col gap-4 bg-pale rounded-xl p-4 py-6">
                    {(Number(post?.price?.amount) > 0 || post?.available !== undefined) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {Number(post?.price?.amount) > 0 && (
                                <>
                                    <h2 className=" underline decoration-2 underline-offset-2">
                                        {post?.price.currency} {formatAmount(Number(post?.price.amount))}
                                    </h2>
                                    <span className="text-text/60">/month</span>
                                    <Activity mode={post?.negotiable ? "visible" : "hidden"}>
                                        <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary">
                                            negotiable
                                        </span>
                                    </Activity>
                                </>
                            )}
                            {post?.available !== undefined && (
                                <div className={`${post.available ? "bg-success" : "bg-danger"} w-max rounded-full px-2 py-1 text-xs font-medium text-white`}>
                                    {post.available == false && "un"}available
                                </div>
                            )}
                        </div>
                    )}
                    <p className="text-text/50">{formatLocation(post?.location?.name || "")}</p>

                    {(Number(post?.bedrooms) > 0 || Number(post?.toilets) > 0 || Number(post?.bathrooms) > 0) && (
                        <div className="flex flex-wrap gap-4 text-text/50">
                            {Number(post?.bedrooms) > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Bed size={20} weight="fill" />
                                    {post?.bedrooms} bedroom{post?.bedrooms !== 1 && "s"}
                                </span>
                            )}
                            {Number(post?.toilets) > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Toilet size={20} weight="fill" />
                                    {post?.toilets} toilet{post?.toilets !== 1 && "s"}
                                </span>
                            )}
                            {Number(post?.bathrooms) > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Bathtub size={20} weight="fill" />
                                    {post?.bathrooms} bathroom{post?.bathrooms !== 1 && "s"}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {(Number(post?.units) > 0 || Number(post?.months) > 0) && (
                    <div className="bg-pale py-6 my-4 rounded-xl p-4">
                        {Number(post?.units) > 0 && (
                            <div className="flex items-center gap-1">
                                <p className=" font-semibold">{post?.units}</p>
                                <p className="">unit{post?.units != 1 && "s"} available</p>
                            </div>
                        )}
                        {Number(post?.months) > 0 && (
                            <p className="flex items-center mt-2 gap-2 text-yellow-600 bg-yellow-600/5 px-6 py-4 rounded-xl">
                                <ExclamationTriangleIcon className="h-6 w-6" />
                                <span>{post?.months} month{post?.months != 1 && "s"} needed for the first month</span>
                            </p>
                        )}
                    </div>
                )}

                {Boolean(ammenities?.length) && (
                    <div>
                        <p className="font-semibold">Amenities</p>
                        <p className="text-text/50 text-sm mt-1">Below are some of the things that come inclusive on your monthly rent</p>
                        <br />
                        <div className="grid gap-4 grid-cols-2">
                            {ammenities?.map(a => (
                                <div key={a.label} className={`flex px-4 py-10 rounded-xl bg-pale flex-col items-center justify-center ${a.selected && "border border-primary/20 bg-primary/2"}`}>
                                    {a.icon && <img src={a.icon} className="h-20 object-contain" alt="" />}
                                    <p className="mt-6">{a.label}</p>
                                </div>
                            ))}
                        </div>
                        <br />
                        <div className="h-[10vh]" />
                    </div>
                )}

                <div className="fixed h-22 gap-3 bottom-0 p-4 flex w-full bg-paper/80 backdrop-blur-sm shadow-md border-t left-0 border-text/10">
                    {
                        post.source === "tiktok" ? (
                            <div className="flex w-full items-center gap-3">
                                <button
                                    type="button"
                                    aria-label="Share TikTok video on WhatsApp"
                                    title="Share on WhatsApp"
                                    disabled={!originalTikTokUrl}
                                    onClick={() => originalTikTokUrl && window.open(
                                        `https://wa.me/?text=${encodeURIComponent(originalTikTokUrl)}`,
                                        "_blank",
                                        "noopener,noreferrer"
                                    )}
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-text/10 bg-pale text-text disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Lineicons icon={WhatsappOutlined} />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Call property owner"
                                    title="Call"
                                    disabled={tikTokContactDisabled}
                                    onClick={() => isAuthenticated
                                        ? post.author?.phone && window.open(`tel:${post.author.phone}`, "_self")
                                        : LoginPrompt("messages")}
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-text/10 bg-pale text-text disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Lineicons icon={Telephone1Solid} />
                                </button>
                                {originalTikTokUrl ? (
                                    <a
                                        href={originalTikTokUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="View on TikTok"
                                        title="View on TikTok"
                                        className="btn h-14 min-w-0 flex-1 justify-center rounded-full bg-white text-black"
                                    >
                                        <img src="https://img.magnific.com/premium-vector/tiktok-app-icon-social-media-logo_277909-647.jpg?semt=ais_hybrid&w=740&q=80" className="h-8" />
                                        <span>Visit on TikTok</span>
                                    </a>
                                ) : (
                                    <span
                                        aria-label="TikTok video unavailable"
                                        className="btn h-14 min-w-0 flex-1 justify-center rounded-full bg-white text-black/40"
                                    >
                                        <span>TikTok unavailable</span>
                                        <TikTokBrandIcon />
                                    </span>
                                )}
                            </div>
                        ) : IsOwner
                            ?
                            <PostAuthorActions {...post} />
                            :
                            <>
                                {
                                    post?.author?.hideContact == false && <button onClick={() => isAuthenticated ? window.open(`tel:${post?.author?.phone || ""}`, "_self") : LoginPrompt("messages")} className="btn bg-paper flex-1 rounded-full border border-text/10">
                                        <PhoneIcon className="h-6 w-6" />
                                        <span>contact owner</span>
                                    </button>
                                }
                                <button onClick={() => isAuthenticated ? navigate("/chat/" + post?.authorId) : LoginPrompt("messages")} className="btn rounded-full flex-1 bg-primary text-white">
                                    <Lineicons icon={ChatBubble2Solid} />
                                    <span>chat in app</span>
                                </button>
                            </>
                    }
                </div>

                {/* <Modal position="bottom" className="p-0" open={showMaP} onClose={() => setShowMap(false)}>
                    <div className="h-[70vh]  relative  w-full min-w-full">
                        <motion.img initial={{ scale: "2%" }} animate={{ scale: 1 }} transition={{ duration: 10 }} src={theme == "light" ? MapLight : MapDark} className=" absolute   w-full" alt="" />
                        <div className="absolute bg-black/10 backdrop-blur-sm h-full w-full flex items-center rounded-4xl justify-center">

                            <img src={MapIcon} className="h-20  animate-bounce object-contain w-20 " alt="" />
                        </div>
                    </div>
                </Modal> */}

                <BottomSheet open={showMaP} onDismiss={() => setShowMap(false)} ref={sheetRef} className="z-000">
                    <div className="h-[70vh]">
                        <MapComponent provider="leaflet" defaultCenter={{ lat: post?.location?.cordinates?.lat || 0.3476, lng: post?.location?.cordinates?.lon || 32.5825 }} theme={theme?.toUpperCase() as ColorScheme} />
                    </div>
                </BottomSheet>

                <Modal position="right" className="relative" open={image?.length != 0} onClose={() => setImage("")}>
                    <img onClick={() => setImage("")} src={image} className="absolute left-0 top-0 h-full object-contain object-center w-full " />
                </Modal>

            </div>
        </div>
    )
}

export default PostDetails