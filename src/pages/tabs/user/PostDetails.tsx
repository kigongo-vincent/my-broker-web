import { Activity, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { PostI, User } from "../../../components/pages/tabs/Post"
import Header from "../../../components/pages/tabs/Header"
import GoogleLogo from "../../../assets/google-maps-logo.png"
import MapComponent from "../../../components/pages/upload/Map"
import Modal from "../../../components/base/Modal"
import { ExclamationTriangleIcon, PhoneIcon } from "@heroicons/react/20/solid"
import { CategoryI } from "./Upload"
import electricityIcon from "../../../assets/upload/electricity.png"
import waterIcon from "../../../assets/upload/water.png"
import parkingIcon from "../../../assets/upload/parking.png"
import trashIcon from "../../../assets/upload/trash.png"
import Lineicons from "@lineiconshq/react-lineicons"
import { ChatBubble2Solid } from "@lineiconshq/free-icons"
import { UserI } from "../../../store/auth"
import useSystemTheme from "../../../hooks/theme"
import { ColorScheme } from "@vis.gl/react-google-maps"

const PostDetails = () => {

    const { id } = useParams()

    const [post, setPost] = useState<PostI | undefined>()
    const [showMaP, setShowMap] = useState(false)
    const [image, setImage] = useState("")
    const { theme } = useSystemTheme()

    const navigate = useNavigate()

    const ammenities: CategoryI[] = [
        {
            icon: waterIcon,
            label: "water",
            selected: true
        },
        {
            icon: electricityIcon,
            label: "electricity"
        },
        {
            icon: trashIcon,
            label: "trash",
            selected: true
        },
        {
            icon: parkingIcon,
            label: "parking"
        },
    ]

    useEffect(() => {
        setPost(
            {
                ID: 42,
                CreatedAt: "2026-06-28T08:15:00Z",
                UpdatedAt: "2026-07-01T09:00:00Z",

                author: {
                    ID: 100,
                    CreatedAt: "2025-03-10T11:12:00Z",
                    UpdatedAt: "2026-07-01T09:00:00Z",
                    name: "Joan Namubiru",
                    email: "joan.namubiru@example.com",
                    phone: "+256701234567",
                    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
                    verified: true,
                    broker: true,
                    lastSeen: "2 hours ago",
                },

                type: "rental",

                assets: [
                    {
                        url: "https://images.pexels.com/photos/35213047/pexels-photo-35213047.jpeg",
                        type: "image",
                    },
                    {
                        url: "https://images.pexels.com/photos/34662920/pexels-photo-34662920.jpeg",
                        type: "image",
                    },
                    {
                        url: "https://www.pexels.com/download/video/32477075/",
                        type: "video",
                    },
                ],

                price: {
                    amount: 5500000,
                    currency: "UGX",
                },

                location: {
                    cordinates: {
                        lat: 0.3345,
                        lon: 32.5892,
                    },
                    name: "Kololo, Kampala",
                },

                bathrooms: 3,
                bedrooms: 3,
                toilets: 3,
                ammenities: [
                    "24/7 security",
                    "Backup generator",
                    "Borehole water",
                    "2 parking slots",
                    "Gated compound",
                ],
                negotiable: true,
                extras: [
                    "Garbage collection included",
                    "Fitted kitchen cabinets",
                    "Ensuite master bedroom",
                ],
                months: 12,
                units: 1,
                approved: true,
                liked: false,
                available: true,
            }
        )
    }, [id])

    return (
        <div className="w-full">
            <Header back />

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

                        <span
                            className="
 bg-primary
text-white
px-4
py-2
rounded-full
text-sm
"
                        >
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
                        <p className="text-2xl font-semibold">4</p>
                        <p className="text-lg">units available</p>
                    </div>
                    <p className="flex items-center mt-2 gap-2 text-yellow-600 bg-yellow-600/5 px-6 py-4 rounded-full">
                        <ExclamationTriangleIcon className="h-8 w-8" />
                        <span>4 months needed for the first month</span>
                    </p>
                </div>

                <div>
                    <p className="text-xl font-semibold">Ammenities</p>
                    <p className="text-text/50 text-sm mt-1">please provide define whats inclusive on the monthly rent</p>

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

                <div className="fixed h-22 gap-3 bottom-0 p-4 flex w-full bg-paper/80 backdrop-blur-sm shadow-md border-t left-0 border-text/5">
                    <button className="btn bg-paper flex-1">
                        <PhoneIcon className="h-6 w-6" />
                        <span>contact owner</span>
                    </button>
                    <button onClick={() => navigate("/chat/" + post?.author?.ID)} className="btn flex-1 bg-primary text-white">
                        <Lineicons icon={ChatBubble2Solid} />
                        <span>chat in app</span>
                    </button>
                </div>

                <Modal open={showMaP} onClose={() => setShowMap(false)}>
                    <div className="h-[60vh] min-h-[60vh] rounded-xl overflow-hidden w-full min-w-full">
                        <MapComponent theme={theme?.toUpperCase() as ColorScheme} />
                    </div>
                </Modal>

                <Modal open={image?.length != 0} onClose={() => setImage("")}>
                    <img src={image} className="h-[60vh] rounded-2xl min-h-[60vh] w-full" />
                </Modal>

            </div>
        </div>
    )
}

export default PostDetails