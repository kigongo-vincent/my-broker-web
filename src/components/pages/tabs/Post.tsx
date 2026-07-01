import Lineicons from "@lineiconshq/react-lineicons"
import { BaseI, UserI, useUserStore } from "../../../store/auth"
import {
    HeartOutlined,
    HeartSolid,
    MapMarker5Solid,
    Message2Solid,
    Telephone1Solid
} from "@lineiconshq/free-icons"
import { Activity, useEffect, useState } from "react"
import { CheckBadgeIcon } from "@heroicons/react/20/solid"
import { TextCropper } from "../../../utils/text"


export type PostType = "rental" | "short-stay"

export type PostAssetType = "image" | "video"

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
    type: PostType
    assets: PostAssetI[]
    price: PriceI
    location: LocationI
    bathrooms: number
    bedrooms: number
    toilets: number
    ammenities: string[]
    negotiable: boolean
    extras: string[]
    months: number
    units: number
    approved: boolean
    liked?: boolean
    available: boolean
}

export interface Props extends UserI {
    noActions?: boolean
}

export const User = ({ noActions, ...u }: Props) => {

    const { getUserPhoto } = useUserStore()

    return (
        <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

                <img
                    src={getUserPhoto?.(u.photo)}
                    className="h-14 w-14 rounded-full object-cover"
                />

                <div className="flex flex-col">

                    <div className="flex items-center gap-1">
                        <p className="font-medium">
                            {TextCropper(u?.name, 23)}
                        </p>
                        {
                            u?.verified && <CheckBadgeIcon className="h-6 w-6 text-primary" />
                        }
                        {
                            u?.broker && <div className="text-sm text-primary">broker</div>
                        }
                    </div>

                    <span className="text-sm text-text/50">
                        last seen {u.lastSeen}
                    </span>

                </div>

            </div>


            {
                !noActions && <div className="flex gap-3">

                    <button className="bg-pale h-16 w-16 flex items-center justify-center rounded-full">
                        <Lineicons icon={Telephone1Solid} />
                    </button>


                    <button className="bg-pale h-16 w-16 flex items-center justify-center rounded-full">
                        <Lineicons icon={Message2Solid} />
                    </button>

                </div>
            }

        </div>
    )
}



const Post = (p: PostI) => {

    const [liked, setLiked] = useState(false)
    useEffect(() => { setLiked(Boolean(p?.liked)) }, [p?.liked])

    const handleLike = () => {
        setLiked(!liked)
    }

    const handleClick = () => {

    }

    return (

        <div className="flex flex-col gap-4" onClick={handleClick} onDoubleClick={handleClick}>


            {/* user */}
            <User {...p.author} />



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
                    p.assets?.map((item, index) => (

                        <div
                            key={index}
                            className="
                                relative
                                shrink-0
                                snap-center
                                w-[100%]
                                h-[50vh]
                                rounded-2xl
                                overflow-hidden
                                bg-pale
                            "
                        >


                            {
                                item.type === "image"
                                    ?

                                    <img
                                        src={item.url}
                                        className="
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



                            {/* first asset overlay only */}
                            {
                                index === 0 && (

                                    <div
                                        className="
                                            absolute
                                            inset-0
                                            p-8
                                            flex
                                            flex-col
                                            justify-between
                                            bg-gradient-to-t
                                            from-black
                                            to-black/30
                                        "
                                    >


                                        {/* actions */}
                                        <div className="flex justify-end">

                                            <button
                                                onClick={handleLike}
                                                className="
                                                    bg-white/30
                                                    text-white
                                                    p-4
                                                    rounded-2xl
                                                "
                                            >

                                                <Lineicons
                                                    icon={
                                                        liked
                                                            ? HeartSolid
                                                            : HeartOutlined
                                                    }
                                                />

                                            </button>

                                        </div>





                                        {/* details */}
                                        <div
                                            className="
                                                flex
                                                flex-col
                                                gap-3
                                                text-white
                                            "
                                        >


                                            <div className="flex gap-2 items-center">


                                                <h2 className="text-2xl font-medium">

                                                    {p.price.currency}{" "}
                                                    {p.price.amount.toLocaleString("en-US")}

                                                </h2>



                                                <Activity
                                                    mode={
                                                        p.negotiable
                                                            ? "visible"
                                                            : "hidden"
                                                    }
                                                >

                                                    <span
                                                        className="
                                                            bg-primary/20
                                                            text-primary
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




                                            <div className="flex items-center gap-1 text-sm">

                                                <Lineicons
                                                    icon={MapMarker5Solid}
                                                    className="h-6"
                                                />

                                                <span className="underline">
                                                    {p.location.name}
                                                </span>

                                            </div>





                                            <div
                                                className="
                                                    flex
                                                    gap-2
                                                    flex-wrap
                                                    
                                                "
                                            >

                                                <div className="bg-white/20 px-5 flex items-center py-3 rounded-full">
                                                    {p.toilets} toilet{p.toilets !== 1 && "s"}
                                                </div>


                                                <div className="bg-white/20 px-5 flex items-center py-3 rounded-full">
                                                    {p.bathrooms} bathroom{p.bathrooms !== 1 && "s"}
                                                </div>


                                                <div className="bg-white/20 px-5 flex items-center py-3 rounded-full">
                                                    {p.bedrooms} bedroom{p.bedrooms !== 1 && "s"}
                                                </div>


                                            </div>


                                        </div>


                                    </div>

                                )
                            }


                        </div>

                    ))
                }


            </div>


        </div>

    )
}


export default Post