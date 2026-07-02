import { GallerySolid, MapMarker1Solid, MapMarker5Solid, Trash3Solid, XmarkSolid } from "@lineiconshq/free-icons"
import Lineicons from "@lineiconshq/react-lineicons"
import { HTMLAttributes, ReactNode, useMemo, useState } from "react"
import { useNavigate } from "react-router"
// import MapComponent from "../../../components/pages/upload/Map"
import FlexRender from "../../../components/base/FlexRender"
import commercialIcon from "../../../assets/upload/commercial.png"
import residentialIcon from "../../../assets/upload/residential.png"
import hostelIcon from "../../../assets/upload/hostel.png"
import electricityIcon from "../../../assets/upload/electricity.png"
import waterIcon from "../../../assets/upload/water.png"
import parkingIcon from "../../../assets/upload/parking.png"
import trashIcon from "../../../assets/upload/trash.png"
import Modal from "../../../components/base/Modal"

export interface StepI {
    id: number
    content: ReactNode
}

interface ShellProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    onBack?: () => void
    onNext?: () => void
}

export const Shell = ({ onBack, onNext, children, className }: ShellProps) => {
    return (
        <div className={`flex h-screen flex-col p-4 justify-between ${className}`}>

            <div className="p-4">
                {children}
            </div>

            {/* actions  */}
            <div className="flex fixed bottom-5 px-4 left-0 w-full items-center justify-between">
                <button onClick={() => onBack?.()} className="btn bg-pale w-max">
                    back
                </button>
                <button onClick={() => onNext?.()} className="btn bg-primary text-white w-max">
                    next
                </button>
            </div>

        </div>
    )
}

export interface CategoryI {

    icon: string,
    label: string,
    selected?: boolean
    onPress?: () => void


}

export const Category = (c: CategoryI) => {
    return (
        <div
            onClick={() => c?.onPress?.()}
            className="h-50 min-w-[28%]  bg-pale flex-1 rounded-xl flex items-center justify-center flex-col">
            <img src={c?.icon} className="h-20 mb-3 min-w-auto" alt="" />
            <span>{c?.label}</span>
        </div>
    )
}

const Upload = () => {

    const [photo] = useState("https://images.pexels.com/photos/34574610/pexels-photo-34574610.jpeg")
    const navigate = useNavigate()
    const [currentStepID, setCurrentStepID] = useState<number>(1)
    const [showNegotiationModal, setShowNegotiationModal] = useState(false)
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>(["https://images.pexels.com/photos/20200292/pexels-photo-20200292.jpeg", "https://images.pexels.com/photos/37460680/pexels-photo-37460680.jpeg", "https://images.pexels.com/photos/37460692/pexels-photo-37460692.jpeg"])
    const handleRemovePhoto = (url?: string) => {
        setSelectedPhotos(prev => prev?.filter(p => p != url))
    }
    const categories: CategoryI[] = ([
        {
            icon: commercialIcon,
            label: "commercial"
        },
        {
            icon: residentialIcon,
            label: "residential"
        },
        {
            icon: hostelIcon,
            label: "hostel"
        }
    ])

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

    const steps: StepI[] = useMemo(() => [
        {
            id: 1,
            content: <div className="h-screen relative">

                {/* bg image  */}
                <img src={photo} className="absolute  h-full w-full" alt="" />

                {/* selected images  */}
                {
                    selectedPhotos?.length != 0 && <div className="fixed z-400 bottom-[20vh] left-4">
                        <FlexRender row className="overflow-x-scroll" items={selectedPhotos} render={(item, index) => <div key={index} className="h-20 relative w-20 rounded-xl">
                            <img src={item} alt="" className="h-full absolute w-full rounded-2xl" />
                            <div
                                onClick={() => handleRemovePhoto?.(item)}
                                className="absolute h-full w-full bg-black/10 rounded-2xl text-white flex items-center justify-center">
                                <Lineicons className="" icon={Trash3Solid} />
                            </div>
                        </div>} />
                    </div>
                }

                {/* overlay  */}
                <div className="absolute bg-black/10 flex flex-col justify-end  h-full w-full">

                    {/* actions  */}
                    <div className="flex items-center fixed w-full text-white bottom-0 justify-around bg-black/80 p-10">

                        <button className="bg-white/10 p-5 rounded-full">
                            <Lineicons icon={GallerySolid} size={30} />
                        </button>

                        <div className="p-1 flex items-center justify-center border-2 border-white rounded-full">
                            <button
                                onClick={() => setCurrentStepID(2)}
                                className="bg-white h-20 rounded-full w-20">

                            </button>
                        </div>

                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white/10 p-5 rounded-full">
                            <Lineicons icon={XmarkSolid} size={30} />
                        </button>

                    </div>

                </div>

            </div>
        }, {
            content: <Shell onBack={() => setCurrentStepID(prev => prev - 1)} onNext={() => setCurrentStepID(prev => prev + 1)}>
                <div className="flex gap-4  flex-col relative">


                    {/* <div className="h-[50vh] rounded-2xl overflow-hidden">
                        <MapComponent />
                    </div> */}

                    <div>
                        <p className="text-xl font-semibold">Property loaction</p>
                        <p className="text-text/50 text-sm mt-1">please provide the location of the property</p>
                    </div>

                    <button className="btn bg-primary text-white">
                        <Lineicons icon={MapMarker1Solid} />
                        <span>use current location</span>
                    </button>

                    <div className="bg-pale w-full dark:border border-text/10 rounded-full h-16 flex gap-3 items-center pl-6 pr-1.5">
                        <Lineicons icon={MapMarker5Solid} className="text-text/50" />
                        <input type="text" placeholder="provide the location" className={`flex-1 outline-0 `} />
                    </div>

                </div>
            </Shell>,
            id: 2
        },
        {
            id: 3,
            content: <Shell onBack={() => setCurrentStepID(prev => prev - 1)} onNext={() => setCurrentStepID(prev => prev + 1)}>
                <div>
                    <p className="text-xl font-semibold">Property Type</p>
                    <p className="text-text/50 text-sm mt-1">please provide the category of property you're uploading</p>
                    <br />
                    <FlexRender className="grid grid-cols-2" row items={categories} render={(item, index) => <Category key={index} {...item} />} />

                </div>
            </Shell>
        }
        , {
            id: 4,
            content: <Shell onBack={() => setCurrentStepID(prev => prev - 1)} onNext={() => setCurrentStepID(prev => prev + 1)}>
                <div>
                    <p className="text-xl font-semibold">Bedrooms, Bathrooms & Toilets</p>
                    <p className="text-text/50 text-sm mt-1">please provide the bedrooms, bathrooms & toilet situation of the property</p>
                    <br />

                    <div className="flex flex-col gap-4 mt-6   rounded-lg">

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">bedroom</span>
                            <input type="number" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="bedroom e.g 4" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">bathroom</span>
                            <input type="number" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="bathroom e.g 4" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm">toilets</span>
                            <input type="number" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="toilets e.g 4" />
                        </div>

                    </div>

                </div>
            </Shell>
        }, {
            id: 5,
            content: <Shell onBack={() => setCurrentStepID(prev => prev - 1)} onNext={() => setShowNegotiationModal(true)}>
                <div>
                    <p className="text-xl font-semibold">Property Pricing</p>
                    <p className="text-text/50 text-sm mt-1">please provide the required monthly rent</p>
                    <br />

                    <div className="flex flex-col gap-2">
                        <span className="text-sm">Price</span>
                        <input type="text" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="how much..." />
                    </div>
                </div>
            </Shell>
        }
        , {
            id: 6,
            content: <Shell onBack={() => setCurrentStepID(prev => prev - 1)} onNext={() => setCurrentStepID(prev => prev + 1)}>
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

                </div>
            </Shell>
        }, {
            id: 7,
            content: <Shell onBack={() => setCurrentStepID(prev => prev - 1)} onNext={() => navigate(-1)}>
                <div>
                    <p className="text-xl font-semibold">Initial Payment</p>
                    <p className="text-text/50 text-sm mt-1">please provide the number of months acceptable for the first month</p>
                    <br />
                    <div className="flex flex-col gap-2">
                        <span className="text-sm">Months payment required for the first month</span>
                        <input type="text" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="3 months" />
                    </div>
                </div>
            </Shell>
        }
    ], [photo, currentStepID, showNegotiationModal, selectedPhotos])
    return (
        <>
            {steps.find(s => s?.id == currentStepID)?.content}
            <Modal
                className="p-10"
                actions={<><button onClick={() => setShowNegotiationModal(false)} className="btn bg-pale">no</button><button onClick={() => { setCurrentStepID(prev => prev + 1); setShowNegotiationModal(false) }} className="btn bg-primary text-white">yes</button></>}
                open={showNegotiationModal} onClose={() => setShowNegotiationModal(false)}>
                <p className="text-xl font-semibold">Negotiation terms</p>
                <p className="text-text/50 text-sm mt-1">is the price of the property negotiable</p>



            </Modal>
        </>
    )
}

export default Upload