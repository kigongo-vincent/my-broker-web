import { Activity, useMemo } from 'react'
import { UserI, useUserStore } from '../../../store/auth'
import Post, { PostI } from '../../../components/pages/tabs/Post'
import FlexRender from '../../../components/base/FlexRender'
import Header from '../../../components/pages/tabs/Header'
import { useInfiniteQuery } from '@tanstack/react-query'
import { APIResponse } from '../../../../api'
import { Post as P } from "../../../../api/index"
import { useNavigate, useParams } from 'react-router'
import Empty from '../../../components/base/Empty'
import { Telephone1Solid, Message2Solid, WhatsappOutlined } from '@lineiconshq/free-icons'
import Lineicons from '@lineiconshq/react-lineicons'
import { useAppStore } from '../../../store/app'
import { ProfileSkeleton } from '../../../components/base/PageSkeleton'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { TextCropper } from '../../../utils/text'

export interface AccountI {
    user: Partial<UserI>
    posts: PostI[]
}

export const useInfiniteUserProfile = (params: { limit: number; userId?: string }) => {

    return useInfiniteQuery({
        queryKey: ['user-profile', params.userId ?? 'me'],
        queryFn: async ({ pageParam = 1 }) => {
            const path = `posts/user/${params.userId}`
            const res = await P<{ pagination: { page: number; limit: number } }, AccountI>(
                path,
                { pagination: { page: pageParam, limit: params.limit } }
            )
            return res as APIResponse<AccountI>
        },
        getNextPageParam: (lastPage, allPages) => {
            const pagination = lastPage.pagination
            if (!pagination) return undefined

            const { page, limit, total } = pagination
            const fetched = allPages.length * limit
            return fetched < total ? page + 1 : undefined
        },
        initialPageParam: 1,
    })
}

export interface AccountI {
    user: Partial<UserI>
    posts: PostI[]
}

const Profile = () => {
    const { user, getUserPhoto, getUser } = useUserStore()
    const { id } = useParams()
    const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteUserProfile({ limit: 5, userId: id })

    const account = useMemo<AccountI | null>(() => {
        const lastPage = data?.pages[data.pages.length - 1]
        if (!lastPage) return null

        const posts = data.pages.flatMap((page) => page.data.posts)
        return { user: lastPage.data.user, posts }
    }, [data])

    const navigate = useNavigate()
    const isAuthenticated = Boolean((user as UserI)?.ID)
    const { LoginPrompt } = useAppStore()
    const u = account?.user as UserI

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
            navigate(`/chat/${u?.ID || u.ID}`, { state: { user: u } })
        } else {
            LoginPrompt("direct messages")
        }

    }

    function handleWhatsApp(): void {
        if (!isAuthenticated) {
            LoginPrompt("direct messages")
            return
        }

        if (u?.phone) {
            // Strips out spaces, dashes, and special characters from the phone number
            const cleanPhone = u.phone.replace(/\D/g, "")
            window.open(`https://wa.me/${cleanPhone}`, "_blank")
        } else {
            alert("Phone number is not available for this user.")
        }
    }


    const isOwner = getUser()?.ID == Number(id)

    return (
        <div>
            <Header
                back
                title={account?.user?.name || (user as UserI | undefined)?.name || 'Profile'}
                caption={"last seen " + account?.user?.lastSeen || ""}
            />

            {
                isLoading
                    ?
                    <ProfileSkeleton />
                    :
                    <div className="mt-30">
                        <img
                            src={getUserPhoto?.(account?.user?.photo)}
                            className='h-30 w-30 left-[50%] transform -translate-x-[50%] top-25 border-4 border-paper absolute rounded-full object-cover'
                            alt=""
                        />

                        <div className=" p-6 flex flex-col border-b items-center gap-1.5 border-text/10">
                            <h3 className="text-2xl font-bold">
                                <div className="flex items-center gap-1">
                                    <p className="font-medium">
                                        {TextCropper(u?.name, 23)}
                                    </p>
                                    {u?.verified && <CheckBadgeIcon className="h-6 w-6 text-primary" />}
                                    {u?.role == "broker" && <div className="text-sm text-white font-medium bg-primary px-4 py-1 rounded-full">broker</div>}
                                </div>

                            </h3>
                            <p className='text-text/50'>{account?.user?.email}</p>

                            {/* bio  */}
                            <Activity mode={account?.user?.role == "broker" ? "visible" : "hidden"}>

                                <p className='text-text/50'>{account?.user?.BrokerDetails?.Bio}</p>
                                <p className='text-text/50 bg-pale px-4 py-2 rounded-full'>charges {account?.user?.BrokerDetails?.Fee}</p>
                            </Activity>
                        </div>
                        <br />

                        {isLoading ? (
                            <div className="py-4 text-sm text-text/50"></div>
                        ) : account?.posts.length === 0 ? (
                            <Empty type='posts' />
                        ) : (
                            <FlexRender
                                className="gap-10"
                                items={account?.posts || []}
                                render={(item, index) => <Post {...(item as PostI)} key={index} />}
                            />
                        )}

                        {hasNextPage && (
                            <button onClick={() => fetchNextPage()} className="mt-4 text-sm text-text/70">
                                Load more
                            </button>
                        )}
                    </div>
            }

            <div className="h-30"></div>

            {/* fixed nav  */}
            <Activity mode={isOwner ? "hidden" : "visible"}>
                <div className='fixed z-50 px-4 gap-2 flex items-center border-t border-text/10 h-20 bottom-0 left-0 w-full bg-paper'>

                    <button onClick={handleWhatsApp} disabled={u?.hideContact} className={`btn flex-1 font-medium rounded-full bg-[#128C7E] text-white ${u?.hideContact && "opacity-10"}`}>
                        <Lineicons icon={WhatsappOutlined} />
                        chat via whatsapp
                    </button>

                    {
                        !u?.hideContact && <button
                            onClick={handleCall}
                            className=" h-16 w-16 flex items-center bg-pale justify-center rounded-full"
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

        </div>
    )
}

export default Profile