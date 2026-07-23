import { User } from "../../../components/pages/tabs/Post"
import BGL from "../../../assets/light.webp"
import BGD from "../../../assets/dark.webp"
import useSystemTheme from "../../../hooks/theme"
import { Activity, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Lineicons from "@lineiconshq/react-lineicons"
import { ArrowLeftCircleSolid, HandTakingUserSolid, MenuMeatballs1Solid, Trash3Solid, User4Solid, XmarkSolid } from "@lineiconshq/free-icons"
import { UserI, useUserStore } from "../../../store/auth"
import Modal from "../../../components/base/Modal"
import FlexRender from "../../../components/base/FlexRender"
import { PaperAirplaneIcon } from "@heroicons/react/20/solid"
import { useLocation, useNavigate, useParams } from "react-router"
import { ChatMessageI, ChatRoomI } from "../../../hooks/chats"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import PostComponent from "../../../components/pages/tabs/Post"
import { DeleteReq, Post } from "../../../../api"
import { useAppStore } from "../../../store/app"
import Loader from "../../../components/base/Loader"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageType = "chat" | "typing" | "delivered" | "read" | "presence" | "error"

export interface IncomingMessage<T> {
    type: MessageType
    to: number
    room_id: number
    data: T
}

export interface OutgoingMessage<T> {
    id?: string
    type: MessageType
    from: number
    to: number
    room_id?: number
    data: T
    timestamp?: string // ISO 8601 date string
}

interface SocketPayload {
    type?: string
    message?: ChatMessageI
}

// ---------------------------------------------------------------------------
// React Query keys — centralized so cache reads/writes stay in sync
// ---------------------------------------------------------------------------

const chatKeys = {
    room: (roomId?: string) => ["chat_room", roomId] as const,
}

// ---------------------------------------------------------------------------
// Query fn: fetch (or create) the room + its message history
// ---------------------------------------------------------------------------

const fetchChatRoom = (userId: number, partnerId: number) =>
    Post<{ users: number[] }, ChatRoomI>(`chats/room`, {
        users: [userId, partnerId],
    })

// ---------------------------------------------------------------------------
// Mutation fn: send a message over HTTP
// ---------------------------------------------------------------------------

const sendChatMessage = (payload: OutgoingMessage<ChatMessageI>) =>
    Post<OutgoingMessage<ChatMessageI>, unknown>("chats/send", payload)

// ---------------------------------------------------------------------------
// Hook: useChatSocket
// Owns the websocket lifecycle; on incoming "message" events it writes
// directly into the React Query cache for the room, so <ChatRoom /> never
// needs its own useState for messages.
// ---------------------------------------------------------------------------

const useChatSocket = (roomId: string | undefined, currentUserId: number | undefined) => {
    const queryClient = useQueryClient()
    const socketRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        if (!roomId) return

        const numericRoomId = Number(roomId)
        const apiBase = import.meta.env.VITE_API_URL || ""
        const rawAuth = localStorage.getItem("_jdncjnsckchsbchkbcknsncknksjncchbfk")
        const token = rawAuth ? JSON.parse(rawAuth || "{}").state?.token : ""
        const socketUrl = `${apiBase.replace(/^http/, "ws")}/chats/ws?wsat=${token}`

        const socket = new WebSocket(socketUrl)
        socketRef.current = socket

        socket.addEventListener("open", () => {
            socket.send(JSON.stringify({ type: "join", roomId: numericRoomId }))
        })

        socket.addEventListener("message", (event) => {
            try {
                const payload: SocketPayload = JSON.parse(event.data)
                if (payload?.type === "message" && payload?.message) {
                    const incoming = payload.message

                    const newMessage: ChatMessageI = {
                        ID: incoming.ID,
                        RoomID: incoming.RoomID,
                        SenderID: incoming.SenderID,
                        CreatedAt: incoming.CreatedAt,
                        UpdatedAt: incoming.UpdatedAt,
                        Text: incoming.Text || "",
                        Attachment: incoming.Attachment,
                        Sender:
                            incoming.SenderID !== currentUserId && incoming.Sender
                                ? ({ ...incoming.Sender } as UserI)
                                : undefined,
                    }

                    queryClient.setQueryData<ChatRoomI | undefined>(
                        chatKeys.room(roomId),
                        (old) => {
                            if (!old) return old
                            return {
                                ...old,
                                Messages: [...(old.Messages || []), newMessage],
                            }
                        }
                    )
                }
            } catch {
                // ignore malformed socket payloads
            }
        })

        return () => {
            socket.close()
            socketRef.current = null
        }
    }, [roomId, currentUserId, queryClient])

    return socketRef
}

// ---------------------------------------------------------------------------
// Hook: useChatRoomData
// Wraps the room query + send mutation, and does the optimistic cache update
// on send so the sender sees their message immediately.
// ---------------------------------------------------------------------------

const useChatRoomData = (partnerId: string | undefined, currentUser: UserI | undefined) => {
    const queryClient = useQueryClient()

    const roomQuery = useQuery({
        queryKey: chatKeys.room(partnerId),
        queryFn: () => fetchChatRoom(currentUser?.ID || 0, partnerId ? +partnerId : 0),
        enabled: !!partnerId,
    })

    const sendMutation = useMutation({
        mutationFn: sendChatMessage,
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: chatKeys.room(partnerId) })

            const previous = queryClient.getQueryData<ChatRoomI>(chatKeys.room(partnerId))

            const optimisticMessage: ChatMessageI = {
                // Using a negative number or temporary flag helps identify it
                ID: Date.now() * -1,
                SenderID: payload.from,
                postId: payload.data.postId,
                Text: payload.data.text,
                CreatedAt: new Date().toISOString(),
            }

            queryClient.setQueryData<ChatRoomI | undefined>(
                chatKeys.room(partnerId),
                (old) => {
                    if (!old) return old
                    return {
                        ...old,
                        Messages: [...(old.Messages || []), optimisticMessage],
                    }
                }
            )

            return { previous }
        },
        onError: (_err, _payload, context) => {
            if (context?.previous) {
                queryClient.setQueryData(chatKeys.room(partnerId), context.previous)
            }
        },
        // ADD THIS: This ensures the UI syncs with the server after the message is sent
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.room(partnerId) })
        },
    })

    return { roomQuery, sendMutation }
}

// ---------------------------------------------------------------------------
// Presentational: Message bubble
// ---------------------------------------------------------------------------

const Message = ({ senderId, Attachment, text, CreatedAt, post, postId }: Partial<ChatMessageI>) => {

    const { user } = useUserStore()
    const mine = Number((user as UserI)?.ID) == senderId

    return (
        <>
            <div className={`bg-pale ${mine && "bg-primary  flex flex-col gap-1.5 items-end self-end text-white"} p-6 py-4 rounded-xl ${!postId && "max-w-[80%] w-max"}  `}>
                <span>{text}</span>

                {Attachment && (
                    <div>
                        <img src={Attachment} className="rounded-3xl mt-4" alt="" />
                    </div>
                )}
                <div className="mt-3 text-sm opacity-50 ">
                    {CreatedAt ? new Date(CreatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
            </div>
            {post?.ID != 0 && post && (
                <PostComponent hideHeader  {...post} />
            )}
        </>
    )
}

// ---------------------------------------------------------------------------
// Presentational: Header
// ---------------------------------------------------------------------------

interface ChatHeaderProps {
    partnerName?: string
    partnerPhoto?: string
    partnerLastSeen?: string
    onBack: () => void
    onOpenMenu: () => void
}

const ChatHeader = ({ partnerName, partnerPhoto, partnerLastSeen, onBack, onOpenMenu }: ChatHeaderProps) => {



    return (
        <div className="w-full fixed z-200 top-0 ">
            <div className="flex w-full bg-black/6 border-b  border-text/10 dark:bg-paper/80 backdrop-blur-lg px-6 py-4  items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="h-14 ">
                        <Lineicons icon={ArrowLeftCircleSolid} />
                    </button>
                    <User
                        name={partnerName || "Conversation"}
                        photo={partnerPhoto}
                        noActions
                        lastSeen={partnerLastSeen ? `last seen ${partnerLastSeen}` : "online"}
                    />
                </div>

                <button onClick={onOpenMenu} className="h-12 w-12 flex items-center justify-center">
                    <Lineicons icon={MenuMeatballs1Solid} className="transform rotate-z-[90deg]" />
                </button>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Presentational: Message list
// ---------------------------------------------------------------------------

interface MessageListProps {
    messages: ChatMessageI[]
}


const MessageList = ({ messages }: MessageListProps) => {
    const { getUser } = useUserStore()
    const scrollRef = useRef<HTMLDivElement>(null)

    const MarkMessagesRead = async () => {
        const msgs = messages?.filter(m => !m?.isRead && m?.senderId != getUser()?.ID)
        if (msgs?.length != 0) {
            await Post<ChatMessageI[], unknown>("chats/mark-read", msgs)
        }
    }

    useEffect(() => {
        MarkMessagesRead()
    }, [messages])

    // Scroll to bottom whenever messages update
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="max-h-[90vh] pt-[11vh] overflow-y-auto flex flex-col gap-5 w-full p-4">
            <FlexRender
                emptyContainer={<></>}
                items={messages || []}
                render={(item, index) => <Message {...item} key={item.ID ?? index} />}
            />
            {/* Invisible element at the bottom to target for scrolling */}
            <div ref={scrollRef} />
        </div>
    )
}

// ---------------------------------------------------------------------------
// Presentational: Composer (input + send button)
// ---------------------------------------------------------------------------

interface ChatComposerProps {
    draft: string
    onDraftChange: (value: string) => void
    onSend: () => void
    sending: boolean
}

const ChatComposer = ({ draft, onDraftChange, onSend, sending }: ChatComposerProps) => {
    return (
        <div className="shrink-0 flex  fixed bottom-0  left-0 items-center px-4 pb-5 pt-2 gap-2 w-full">
            <div className="rounded-full flex bg-pale items-center px-6  border border-text/10 h-18 flex-1">
                <input
                    value={draft}
                    onChange={(e) => onDraftChange(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSend()}
                    type="text"
                    placeholder="say something"
                    className="flex-1 outline-0"
                />
                <button onClick={onSend} disabled={sending} className="h-14 w-16 text-text/60 flex items-center justify-center">
                    <PaperAirplaneIcon className="h-8 w-8" />
                </button>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Presentational: User actions menu (report / block / clear / view profile)
// ---------------------------------------------------------------------------

interface UserActionsMenuProps {
    open: boolean
    RoomID: number
    onClose: () => void
    onViewProfile: () => void
}

interface UserReport {
    ReporteeID: number
}

const UserActionsMenu = ({ RoomID, open, onClose, onViewProfile }: UserActionsMenuProps) => {
    const [loading, setLoading] = useState(false)
    const { setError, setSuccess } = useAppStore()
    const navigate = useNavigate()
    const { id } = useParams()

    const FileReport = async () => {
        try {
            setLoading(true)
            const { status, msg } = await Post<UserReport, unknown>("me/report", { ReporteeID: id ? +id : 0 })
            if (status != 200) {
                setError({ title: "Failed to file report", body: msg })
            } else {
                setSuccess({ title: "Complaint sent", body: msg })
            }
            onClose?.()

        } catch (error) {
            setError({ title: "Report error", body: "failed to file report" })
        } finally {
            setLoading(false)
        }
    }

    const clearChat = async () => {

        try {
            setLoading(true)
            const { status, msg } = await DeleteReq<unknown>(`chats/clear/${RoomID}`)
            if (status == 200) {
                setSuccess({ title: "Chat cleared", body: msg })
                navigate(-1)
                onClose?.()
            }
            else {
                setError({ title: "Clear chat error", body: msg })
            }
        } catch (error) {
            setError({ title: "Error", body: "something went wrong" })
        } finally {
            setLoading(false)
        }

    }

    return (
        <Modal open={open} className="" onClose={onClose}>
            <div className="flex flex-col gap-4 ">
                <button onClick={onViewProfile} className="btn justify-start gap-5">
                    <Lineicons icon={User4Solid} />
                    View profile
                </button>

                <button onClick={FileReport} className="btn justify-start gap-5">
                    <Loader loading={loading}>
                        <Lineicons icon={HandTakingUserSolid} />
                        Report user
                    </Loader>
                </button>
                {/* 
                <button className="btn justify-start gap-5">
                    <Lineicons icon={User4Stroke} />
                    Block user
                </button> */}
                <button onClick={clearChat} className="btn justify-start gap-5">
                    <Loader loading={loading}>
                        <Lineicons icon={Trash3Solid} />
                        Clear chat
                    </Loader>
                </button>
            </div>
        </Modal>
    )
}

// ---------------------------------------------------------------------------
// Container: ChatRoom
// ---------------------------------------------------------------------------


const ChatRoom = () => {
    const { theme } = useSystemTheme()
    const [loading] = useState(false)
    const [draft, setDraft] = useState("")
    const [showUserMenu, setShowMenu] = useState<boolean>(false)
    const bg = theme == "dark" ? BGD : BGL
    const navigate = useNavigate()
    const { user } = useUserStore()
    const ParsedUser = user as UserI
    const { id } = useParams<{ id: string }>()
    const { state } = useLocation()
    const { roomQuery, sendMutation } = useChatRoomData(id, ParsedUser)
    const parsedState = (state as { user: UserI })
    useChatSocket(id, ParsedUser?.ID)

    const messages = roomQuery.data?.data?.Messages || []

    const partner = useMemo(() => {

        return parsedState?.user ? parsedState?.user : roomQuery.data?.data?.users ? roomQuery.data?.data?.users?.find(u => u?.ID != ParsedUser?.ID) : null
    }, [roomQuery.data?.data])

    const { selectedPost, setSelectedPost } = useAppStore()


    const handleSend = useCallback(() => {
        const trimmed = draft.trim()
        if (!trimmed || !id) return

        sendMutation.mutate(
            {
                type: "chat",
                from: ParsedUser?.ID ? ParsedUser?.ID : 0,
                to: id ? +id : 0,
                data: {
                    SenderID: ParsedUser?.ID ? ParsedUser?.ID : 0,
                    text: draft,
                    postId: selectedPost?.ID,
                    post: selectedPost
                },
            },
            {
                onSuccess: () => {
                    setDraft("")
                    setSelectedPost(undefined)
                },
            }
        )
    }, [draft, id, ParsedUser?.ID, sendMutation])


    return (
        <div className="relative  overflow-hidden flex-1 h-screen">

            <Activity mode={selectedPost ? "visible" : "hidden"}>
                <div className="fixed w-full  z-300 bottom-[10vh] p-5">
                    <div className="backdrop-blur-sm w-full bg-paper/80  border-text/10 border  flex items-center gap-3 rounded-xl p-4">
                        <img src={selectedPost?.assets[0]?.url} alt="" className="h-16 w-16 object-cover rounded-xl" />
                        <div className="flex flex-col justify-center flex-1">
                            <div className="flex gap-2 items-center">
                                <h2 className="text-xl font-medium">
                                    {selectedPost?.price.currency} {selectedPost?.price.amount.toLocaleString("en-US")}
                                </h2>
                            </div>

                            <div className="flex items-center gap-1 text-text/50 text-sm">
                                <span>{selectedPost?.location.name}</span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedPost(undefined)} className="justify-self-end  h-16 flex items-center justify-center w-16">
                            <Lineicons icon={XmarkSolid} />
                        </button>
                    </div>
                </div>
            </Activity>

            <img src={bg} className="absolute h-full w-full mix-blend-luminosity object-cover" alt="" />

            <div className={`absolute inset-0 h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden ${loading && "bg-paper/90 animate-pulse"}`}>
                <ChatHeader
                    partnerName={partner?.name}
                    partnerPhoto={partner?.photo}
                    partnerLastSeen={partner?.lastSeen}
                    onBack={() => navigate(-1)}
                    onOpenMenu={() => setShowMenu(true)}
                />


                <MessageList messages={messages} />

                <ChatComposer
                    draft={draft}
                    onDraftChange={setDraft}
                    onSend={handleSend}
                    sending={sendMutation.isPending}
                />
            </div>

            <UserActionsMenu
                open={showUserMenu}
                RoomID={roomQuery?.data?.data?.ID || 0}
                onClose={() => setShowMenu(false)}
                onViewProfile={() => navigate(`/profile/${1}`)}
            />
        </div>
    )
}

export default ChatRoom