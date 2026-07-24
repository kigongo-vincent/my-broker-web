import { Activity, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { PostI, User } from "../../../components/pages/tabs/Post"
import Header from "../../../components/pages/tabs/Header"
import GoogleLogo from "../../../assets/google-maps-logo.webp"
import MapComponent from "../../../components/pages/upload/Map"
import MapLight from "../../../assets/map-light.webp"
import MapDark from "../../../assets/map-dark.webp"
import MapIcon from "../../../assets/map.webp"
import Modal from "../../../components/base/Modal"
import { ExclamationTriangleIcon, PhoneIcon } from "@heroicons/react/20/solid"
import { CategoryI } from "./Upload"
import Lineicons from "@lineiconshq/react-lineicons"
import { ChatBubble2Solid, EyeSolid, Pencil1Solid, Trash3Solid, XmarkSolid } from "@lineiconshq/free-icons"
import { UserI, useUserStore } from "../../../store/auth"
import useSystemTheme from "../../../hooks/theme"
import { ColorScheme } from "@vis.gl/react-google-maps"
import { usePostDetails } from "../../../hooks/posts"
import electricityIcon from "../../../assets/upload/electricity.webp";
import waterIcon from "../../../assets/upload/water.webp";
import parkingIcon from "../../../assets/upload/parking.webp";
import trashIcon from "../../../assets/upload/trash.webp";
import { motion } from "framer-motion"
import { useAppStore } from "../../../store/app"
import Loader from "../../../components/base/Loader"
import { DeleteReq, Put } from "../../../../api"

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

const PostAuthorActions = ({ ...p }: Partial<PostI>) => {
    const navigate = useNavigate()
    const { setPostToUpdate, setError, setSuccess } = useAppStore()
    const [showDelete, setShowDelete] = useState(false)
    const [available, setAvailable] = useState(p?.available)
    const [deleting, setDeleting] = useState(false)
    const handleEdit = () => {
        setPostToUpdate(p as PostI)
        navigate(`/upload`)
    }

    const handleDelete = async () => {
        try {
            const { status, msg } = await DeleteReq<unknown>("posts/post/" + p?.ID)
            if (status != 200) {
                setError({ title: "Delete error", body: msg })
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
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const { theme } = useSystemTheme()
    const { user, getUser } = useUserStore()



    const navigate = useNavigate()
    const isAuthenticated = Boolean((user as UserI)?.ID)


    const { data } = usePostDetails()
    const { postToUpdate } = useAppStore()
    const post = data?.data
    const ammenities = post?.amenities?.map(a => ({ label: a, icon: IconFinder(a) } as CategoryI))
    const UserID = getUser()?.ID
    const PostAuthorID = post?.author.ID
    const IsOwner = UserID == PostAuthorID

    useEffect(() => {
        console.log(postToUpdate)
    }, [postToUpdate])

    return (
        <div className="w-full">
            <Header back noMargin />

            <button onClick={() => setShowMap(true)} className="fixed border border-text/10 z-100 btn max-w-max left-[50%] top-30 transform -translate-x-[50%] rounded-full bg-paper ">
                <img src={GoogleLogo} className="h-8 w-8" alt="" />
                <span>open map</span>
            </button>

            {/* assets */}
            <div
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
                    post?.assets?.map((item, index) => (

                        <div
                            key={index}
                            className="
                                relative
                                shrink-0
                                snap-center
                                w-full
                                h-[70vh]

                                overflow-hidden
                                bg-pale
                            "
                        >

                            {
                                item.type === "image"
                                    ?
                                    <img
                                        onClick={() => setImage(item?.url)}
                                        src={item.url}
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
                                    <video
                                        src={item.url}
                                        controls
                                        className="
                                            absolute
                                            inset-0
                                            w-full
                                            h-full
                                            object-cover
                                        "
                                    />
                            }

                        </div>

                    ))
                }

            </div>


            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-end">

                </div>
                <br />
                <User {...post?.author as UserI} noActions />
                <br />
                <div className="flex items-end gap-2">

                    <h3 className="text-2xl font-semibold">{post?.price?.currency} {post?.price?.amount?.toLocaleString("en-US")}</h3>

                    <Activity
                        mode={
                            post?.negotiable
                                ? "visible"
                                : "hidden"
                        }
                    >

                        <span className="bg-primary text-white px-4 py-2 rounded-full text-sm">
                            negotiable
                        </span>

                    </Activity>
                </div>
                <p>{post?.location?.name}</p>

                <div className="flex -items-center flex-wrap gap-3">
                    <div className="bg-pale px-5 flex items-center py-3 rounded-full">
                        {post?.bedrooms} bedroom{post?.bedrooms !== 1 && "s"}
                    </div>
                    <div className="bg-pale px-5 flex items-center py-3 rounded-full">
                        {post?.bathrooms} bathroom{post?.bathrooms !== 1 && "s"}
                    </div>
                    <div className="bg-pale px-5 flex items-center py-3 rounded-full">
                        {post?.toilets} toliet{post?.toilets !== 1 && "s"}
                    </div>
                </div>

                <div className="border-text/10 border my-4 rounded-xl p-4">
                    <div className="flex items-center gap-1">
                        <p className="text-2xl font-semibold">{post?.units}</p>
                        <p className="text-lg">unit{post?.units != 1 && "s"} available</p>
                    </div>
                    <p className="flex items-center mt-2 gap-2 text-yellow-600 bg-yellow-600/5 px-6 py-4 rounded-full">
                        <ExclamationTriangleIcon className="h-8 w-8" />
                        <span>{post?.months} month{post?.months != 1 && "s"} needed for the first month</span>
                    </p>
                </div>

                <div>
                    <p className="text-xl font-semibold">Amenities</p>
                    <p className="text-text/50 text-sm mt-1">Below are some of the things that come inclusive on your monthly rent</p>

                    <br />
                    <div className="grid gap-4 grid-cols-2">

                        {
                            ammenities?.map(a => <div key={a?.label} className={`flex px-4 py-10 rounded-xl bg-pale  flex-col items-center justify-center  ${a?.selected && "border border-primary/20 bg-primary/2"}`}>
                                <img src={a?.icon} className="h-20 object-contain" alt="" />
                                <p className="mt-6">{a?.label}</p>
                            </div>)
                        }

                    </div>
                    <br />
                    <div className="h-[10vh]"></div>

                </div>

                <div className="fixed h-22 gap-3 bottom-0 p-4 flex w-full bg-paper/80 backdrop-blur-sm shadow-md border-t left-0 border-text/10">
                    {
                        IsOwner
                            ?
                            <PostAuthorActions {...post} />
                            :
                            <>
                                <button onClick={() => isAuthenticated ? window.open(`tel:${post?.author?.phone || ""}`, "_self") : setShowAuthPrompt(true)} className="btn bg-paper flex-1 rounded-full border border-text/10">
                                    <PhoneIcon className="h-6 w-6" />
                                    <span>contact owner</span>
                                </button>
                                <button onClick={() => isAuthenticated ? navigate("/chat/" + post?.author?.ID) : setShowAuthPrompt(true)} className="btn rounded-full flex-1 bg-primary text-white">
                                    <Lineicons icon={ChatBubble2Solid} />
                                    <span>chat in app</span>
                                </button>
                            </>
                    }
                </div>

                <Modal position="bottom" className="p-0" open={showMaP} onClose={() => setShowMap(false)}>
                    <div className="h-[70vh]  relative  w-full min-w-full">
                        <motion.img initial={{ scale: "2%" }} animate={{ scale: 1 }} transition={{ duration: 10 }} src={theme == "light" ? MapLight : MapDark} className=" absolute   w-full" alt="" />
                        <div className="absolute bg-black/10 backdrop-blur-sm h-full w-full flex items-center rounded-4xl justify-center">

                            <img src={MapIcon} className="h-20  animate-bounce object-contain w-20 " alt="" />
                        </div>
                        <MapComponent theme={theme?.toUpperCase() as ColorScheme} />
                    </div>
                </Modal>

                <Modal position="bottom" open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)}>
                    <div className="rounded-3xl bg-paper p-4">
                        <p className="text-xl font-semibold">Sign in to continue</p>
                        <p className="mt-2 text-sm text-text/60">Log in or create an account to contact owners and start chats.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => { setShowAuthPrompt(false); navigate("/auth/phone") }} className="btn flex-1 rounded-full bg-primary text-white">Log in</button>
                            <button onClick={() => setShowAuthPrompt(false)} className="btn flex-1 rounded-full bg-pale">Cancel</button>
                        </div>
                    </div>
                </Modal>

                <Modal position="right" className="relative" open={image?.length != 0} onClose={() => setImage("")}>
                    <img onClick={() => setImage("")} src={image} className="absolute left-0 top-0 h-full object-cover object-center w-full " />
                </Modal>

            </div>
        </div>
    )
}

export default PostDetails