import Header from "../../../components/pages/tabs/Header"
import { User } from "../../../components/pages/tabs/Post"
import BGL from "../../../assets/light.png"
import BGD from "../../../assets/dark.png"
import useSystemTheme from "../../../hooks/theme"
import { useState } from "react"
import Lineicons from "@lineiconshq/react-lineicons"
import { Camera1Solid, HandTakingUserSolid, MenuMeatballs1Solid, Trash3Solid, User4Solid, User4Stroke } from "@lineiconshq/free-icons"
import { BaseI, UserI } from "../../../store/auth"
import Modal from "../../../components/base/Modal"
import FlexRender from "../../../components/base/FlexRender"
import { PaperAirplaneIcon } from "@heroicons/react/20/solid"

interface MessageI extends BaseI {
    sender?: UserI
    attachment?: string
    text: string
}

const Message = ({ sender, attachment, text, CreatedAt }: MessageI) => {

    return (
        <div className={`bg-paper ${sender && "bg-primary self-end text-white"} p-6 rounded-3xl max-w-[90%]`}>
            {text}

            {/* attachment  */}
            {
                attachment && <div>
                    <img src={attachment} className="rounded-3xl mt-4" alt="" />
                </div>
            }
            <div className="mt-3">{new Date(CreatedAt || "")?.toTimeString()}</div>
        </div>
    )

}


const ChatRoom = () => {

    const { theme } = useSystemTheme()
    const [loading,] = useState(false)

    const [messages] = useState<MessageI[]>([
        {
            ID: 1,
            CreatedAt: "2026-07-01T10:00:00Z",
            UpdatedAt: "2026-07-01T10:00:00Z",
            text: "Hello Joan! Is the 3-bedroom apartment in Kololo still available for viewing?"
        },
        {
            ID: 3,
            CreatedAt: "2026-07-01T10:07:00Z",
            UpdatedAt: "2026-07-01T10:07:00Z",

            text: "Great! Could you send me over the property layout map first so I can check the bedroom sizes?"
        },
        {
            ID: 4,
            CreatedAt: "2026-07-01T10:12:00Z",
            UpdatedAt: "2026-07-01T10:12:00Z",
            sender: {
                ID: 100,
                CreatedAt: "2025-03-10T11:12:00Z",
                UpdatedAt: "2026-07-01T09:00:00Z",
                name: "Joan Namubiru",

            },
            attachment: "https://images.unsplash.com/photo-1545464693-f1798a373343",
            text: "Here is the exact blueprint layout of the Kololo unit. The master bedroom is ensuite."
        },
        {
            ID: 5,
            CreatedAt: "2026-07-01T10:15:00Z",
            UpdatedAt: "2026-07-01T10:15:00Z",

            text: "Looks perfect. Is the price of UGX 5,500,000 inclusive of the security and service charge?"
        },
        {
            ID: 6,
            CreatedAt: "2026-07-01T10:20:00Z",
            UpdatedAt: "2026-07-01T10:20:00Z",
            sender: {
                ID: 100,
                CreatedAt: "2025-03-10T11:12:00Z",
                UpdatedAt: "2026-07-01T09:00:00Z",
                name: "Joan Namubiru",

            },
            text: "It includes security, garbage collection, and 2 parking slots. Water and power are paid separately."
        },
        {
            ID: 7,
            CreatedAt: "2026-07-01T11:00:00Z",
            UpdatedAt: "2026-07-01T11:00:00Z",
            text: "Understood. Let's do 5:00 PM today. Can you send over the pin location?"
        },
        {
            ID: 8,
            CreatedAt: "2026-07-01T11:02:00Z",
            UpdatedAt: "2026-07-01T11:02:00Z",
            sender: {
                ID: 100,
                CreatedAt: "2025-03-10T11:12:00Z",
                UpdatedAt: "2026-07-01T09:00:00Z",
                name: "Joan Namubiru",

            },
            text: "Perfect timing. I'm attaching a photo of the front gate so you don't miss it when you turn off Acacia Avenue."
        },
        {
            ID: 9,
            CreatedAt: "2026-07-01T11:03:00Z",
            UpdatedAt: "2026-07-01T11:03:00Z",
            attachment: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
            text: "I've also generated the route link on the live map tab for you. See you there!"
        },
        {
            ID: 10,
            CreatedAt: "2026-07-01T11:15:00Z",
            UpdatedAt: "2026-07-01T11:15:00Z",
            sender: {
                ID: 99,
                CreatedAt: "2026-01-15T08:30:00Z",
                UpdatedAt: "2026-06-20T14:22:00Z",
                name: "Brian Okello",

            },
            text: "Thanks, Joan. Just opened the route tracking, I'm heading out shortly."
        }
    ]);


    const [showUserMenu, setShowMenu] = useState<boolean>(false)
    const bg = theme == "dark" ? BGD : BGL
    return (
        <div className=" relative border overflow-hidden flex-1 h-screen">

            <img src={bg} className="absolute  h-full w-full" alt="" />

            <div className={`absolute h-full   ${loading && "bg-paper/90 animate-pulse"} w-full`}>

                <Header back />
                <div className=" mt-[10vh]   flex flex-col gap-5 max-h-[80vh] overflow-hidden w-full p-4 absolute">

                    <div className="flex w-full bg-black/6 border border-white backdrop-blur-lg px-6 py-4 rounded-full items-center justify-between">
                        <User name="vincent" noActions lastSeen="23hrs ago" />
                        <button onClick={() => setShowMenu(true)} className=" h-12 w-12 flex items-center justify-center"><Lineicons icon={MenuMeatballs1Solid} /></button>
                    </div>

                    <div className=" rounded-2xl  h-[58vh] p-4  overflow-y-auto">

                        {/* single message  */}
                        <FlexRender items={messages} render={(item, index) => <Message {...item} key={index} />} />
                    </div>

                    <div className="flex items-center bottom-5 left-0 px-4 fixed gap-2 w-full">
                        <div className="rounded-full  flex items-center px-6 bg-paper h-18 flex-1">
                            <input type="text" placeholder="say something" className="flex-1 outline-0" />
                            <button className=" h-14 w-16 text-text/60 flex items-center justify-center">
                                <Lineicons icon={Camera1Solid} size={30} />
                            </button>
                            <button className=" h-14 w-16 text-text/60 flex items-center justify-center">
                                <PaperAirplaneIcon className="h-8 w-8" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* message sender actions  */}
            <Modal open={showUserMenu} onClose={() => setShowMenu(false)}>

                <button className="btn justify-start gap-5">
                    <Lineicons icon={User4Solid} />
                    vieew profile</button>

                <button className="btn justify-start gap-5">
                    <Lineicons icon={HandTakingUserSolid} />
                    Report user</button>

                <button className="btn justify-start gap-5">
                    <Lineicons icon={User4Stroke} />
                    Block user</button>
                <button className="btn justify-start gap-5">
                    <Lineicons icon={Trash3Solid} />
                    clear chate</button>

            </Modal>

        </div>
    )
}

export default ChatRoom