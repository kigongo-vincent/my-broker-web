import { useEffect, useMemo, useState } from "react"
import Search from "../../../components/pages/tabs/home/Search"
import FlexRender from "../../../components/base/FlexRender"
import { UserI, useUserStore } from "../../../store/auth"
import { useNavigate } from "react-router"
import { TextCropper } from "../../../utils/text"
import { ChatMessageI, ChatRoomI, getChatRooms, Participants } from "../../../hooks/chats"

const ChatComponent = (c: ChatRoomI) => {

    const { getUserPhoto } = useUserStore()
    const navigate = useNavigate()
    const participant = c?.users ? c.users[0] : null

    return (
        <div
            onClick={() => navigate(`/chat/${c?.users ? c?.users[0]?.ID : 0}`)}
            className="flex items-center gap-3">

            <img src={getUserPhoto?.(participant?.photo)} className="h-15 w-15 rounded-full object-cover" alt="" />

            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="font-medium">{participant?.name || "Conversation"}</p>
                </div>

                <div className="flex items-center mt-1 justify-between">
                    <p className="text-text/50">{TextCropper(c?.lastMessage?.text || "no messages yet", 38)}</p>
                    <div className="flex items-center gap-1 text-sm font-semibold opacity-40">
                        <p>{c?.lastMessage?.CreatedAt ? new Date(c.lastMessage?.CreatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Chat = () => {

    const tabs = ["All", "read", "unread"]
    const [seletcedTab, setSlelectedTab] = useState(tabs[0])
    const [chats, setChats] = useState<ChatRoomI[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { user } = useUserStore()

    const getUserID = useMemo(() => {
        const rawUser = user as UserI
        const userId = rawUser ? Number(rawUser.ID) : 0
        return userId
    }, [user])

    useEffect(() => {
        let mounted = true
        const loadChats = async () => {
            try {
                const response = await getChatRooms()
                if (!mounted) return
                // setChats(response.data || [])

                const data = response.data as { users: UserI[], lastMessage: ChatMessageI }[]
                setChats(data?.map(i => ({ user: i?.users[0], lastMessage: i?.lastMessage, users: Participants(getUserID, i?.users) } as ChatRoomI)))

            } catch (err) {
                if (!mounted) return
                setError("Unable to load chats right now")
            } finally {
                if (mounted) setLoading(false)
            }
        }

        loadChats()
        return () => {
            mounted = false
        }
    }, [])

    return (
        <div>
            <Search placeholder="search for chats" />
            <FlexRender row className="flex-row my-4 gap-2" items={tabs} render={(item, index) => <div
                onClick={() => setSlelectedTab(item)}
                className={`px-5 py-3 flex-1 text-center cursor-pointer ${seletcedTab == item && "border-primary border-b-2 text-primary"}`} key={index}>{item}
            </div>} />

            {loading ? (
                <div className="space-y-6 py-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="h-15 w-15 animate-pulse rounded-full bg-text/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-2/5 animate-pulse rounded-full bg-text/10" />
                                <div className="h-3 w-3/4 animate-pulse rounded-full bg-text/10" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="py-4 text-sm text-danger">{error}</div>
            ) : chats.length === 0 ? (
                <div className="py-4 text-sm text-text/50">No conversations yet.</div>
            ) : (
                <FlexRender className="gap-10" items={chats} render={(item, index) => <ChatComponent {...item} key={index} />} />
            )}
        </div>
    )
}

export default Chat