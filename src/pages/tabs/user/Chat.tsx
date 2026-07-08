import { useState } from "react"
import Search from "../../../components/pages/tabs/home/Search"
import FlexRender from "../../../components/base/FlexRender"
import { BaseI, UserI, useUserStore } from "../../../store/auth"
// import { ClockIcon } from "@heroicons/react/20/solid"
import { useNavigate } from "react-router"
import { TextCropper } from "../../../utils/text"

export interface ChatCompnentI extends BaseI {
    sender: UserI
    lastMessage: string
    newMessages: number

}

const ChatComponent = (c: ChatCompnentI) => {

    const { getUserPhoto } = useUserStore()
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/chat/${c?.ID}`)}
            className="flex items-center    gap-3">

            <img src={getUserPhoto?.(c?.sender?.photo)} className="h-15 w-15  rounded-full" alt="" />

            <div className="flex-1">


                {/* header  */}
                <div className="flex items-center justify-between">
                    <p className="font-medium">{c?.sender?.name}</p>
                    {c?.newMessages != 0 && <span className="bg-danger text-white h-8 w-8 text-sm flex items-center justify-center rounded-full">{c?.newMessages}</span>}
                </div>

                <div className="flex items-center mt-1 justify-between">
                    <p className=" text-text/50">{TextCropper(c?.lastMessage, 38)}</p>
                    <div className="flex items-center gap-1 text-sm font-semibold opacity-40">
                        {/* <ClockIcon className="h-4 w-4" /> */}
                        <p>{c?.CreatedAt}</p>
                    </div>
                </div>

            </div>
        </div>
    )

}


const Chat = () => {

    const tabs = ["All", "read", "unread"]
    const [seletcedTab, setSlelectedTab] = useState(tabs[0])

    const [chats] = useState<ChatCompnentI[]>(
        [
            {
                CreatedAt: "4:12",
                sender: {
                    ID: 1,
                    name: "Sarah Namutebi",
                    email: "sarah.namutebi@example.com",
                    phone: "+256701234567",
                    photo: "https://i.pravatar.cc/150?img=1",
                    verified: true,
                    broker: true,
                    lastSeen: "2026-06-30T08:15:00Z",
                },
                lastMessage: "Hey, is the apartment in Kololo still available?",
                newMessages: 3,
            },
            {
                CreatedAt: "4:12",
                sender: {
                    ID: 2,
                    name: "David Okello",
                    email: "david.okello@example.com",
                    phone: "+256772345678",
                    photo: "https://i.pravatar.cc/150?img=2",
                    verified: false,
                    broker: false,
                    lastSeen: "2026-06-29T19:42:00Z",
                },
                lastMessage: "Thanks, I'll send the deposit tomorrow.",
                newMessages: 0,
            },
            {
                CreatedAt: "4:12",
                sender: {
                    ID: 3,
                    name: "Grace Achieng",
                    email: "grace.achieng@example.com",
                    phone: "+256758912345",
                    photo: "https://i.pravatar.cc/150?img=3",
                    verified: true,
                    broker: true,
                    lastSeen: "2026-06-30T07:50:00Z",
                },
                lastMessage: "Can we schedule a viewing this weekend?",
                newMessages: 1,
            },
            {
                CreatedAt: "4:12",
                sender: {
                    ID: 4,
                    name: "Brian Mugisha",
                    photo: "https://i.pravatar.cc/150?img=4",
                    verified: false,
                    broker: false,
                    lastSeen: "2026-06-28T14:20:00Z",
                },
                lastMessage: "Okay noted, thanks for the info.",
                newMessages: 0,
            },
            {
                CreatedAt: "4:12",
                sender: {
                    ID: 5,
                    name: "Patricia Nansubuga",
                    email: "patricia.n@example.com",
                    phone: "+256712098765",
                    photo: "https://i.pravatar.cc/150?img=5",
                    verified: true,
                    broker: false,
                    lastSeen: "2026-06-30T09:05:00Z",
                },
                lastMessage: "Voice message",
                newMessages: 5,
            },
        ])

    return (
        <div>
            <Search placeholder="search for chats" />
            <FlexRender row className="flex-row my-4 gap-2" items={tabs} render={(item, index) => <div
                onClick={() => setSlelectedTab(item)}
                className={` px-5 py-3 flex-1 text-center cursor-pointer ${seletcedTab == item && "border-primary border-b-2 text-primary"}`} key={index}>{item}
            </div>} />
            <FlexRender className="gap-10" items={chats} render={(item, index) => <ChatComponent {...item} key={index} />} />
        </div>
    )
}

export default Chat