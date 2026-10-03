import { Activity, useMemo } from 'react'
import { UserI, useUserStore } from '../../../store/auth'
import Post, { PostI } from '../../../components/pages/tabs/Post'
import FlexRender from '../../../components/base/FlexRender'
import Header from '../../../components/pages/tabs/Header'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import Empty from '../../../components/base/Empty'
import { Telephone1Solid, Message2Solid, WhatsappOutlined } from '@lineiconshq/free-icons'
import Lineicons from '@lineiconshq/react-lineicons'
import { useAppStore } from '../../../store/app'
import { ProfileSkeleton } from '../../../components/base/PageSkeleton'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { TextCropper } from '../../../utils/text'
import { feedFactory, type FeedSource, type ProfilePage } from '../../../factories/feed'

export const useInfiniteUserProfile = (params: { limit: number; userId?: string; source: FeedSource }) => {

    return useInfiniteQuery({
        queryKey: ['user-profile', params.source, params.userId ?? 'me', params.limit],
        queryFn: ({ pageParam }) =>
            feedFactory.fetchProfilePage(
                params.userId ?? "",
                pageParam,
                params.limit,
                params.source
            ),
        getNextPageParam: (lastPage, allPages) => {
            const { page, limit, total } = lastPage.pagination
            return allPages.length * limit < total ? page + 1 : undefined
        },
        initialPageParam: 1,
    })
}

const Profile = () => {
    const { user, getUserPhoto, getUser } = useUserStore()
    const { id = "", source } = useParams()
    const profileSource: FeedSource = source === "tiktok" ? "tiktok" : "backend"
    const { data, isLoading, isError, error, fetchNextPage, hasNextPage } = useInfiniteUserProfile({ limit: 5, userId: id, source: profileSource })

    const account = useMemo<ProfilePage | null>(() => {
        const pages = data?.pages ?? []
        if (!pages.length) return null
        const posts = pages.flatMap((page) => page.posts)
        return { user: pages[pages.length - 1].user, posts, pagination: pages[pages.length - 1].pagination }
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


    const isOwner = profileSource === "backend" && getUser()?.ID == Number(id)

    return (
        <div>
            <Header
                back
                title={account?.user?.name || (user as UserI | undefined)?.name || 'Profile'}
                caption={profileSource === "backend" && account?.user?.lastSeen ? "last seen " + account.user.lastSeen : ""}
            />

            {
                isLoading
                    ?
                    <ProfileSkeleton />
                    : isError
                        ? <div className="p-6 text-center text-red-500">Failed to load profile: {(error as Error)?.message}</div>
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

                        {account?.posts.length === 0 ? (
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


            {/* fixed nav  */}
            <Activity mode={isOwner ? "hidden" : "visible"}>
                <div className='fixed  px-4 gap-2 flex items-center border-t border-text/10 h-20 bottom-0 left-0 w-full bg-paper'>

                    <button onClick={handleWhatsApp} disabled={u?.hideContact} className={`btn flex-1 font-medium rounded-full bg-pale ${u?.hideContact && "opacity-10"}`}>
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

                    {profileSource === "backend" && (
                        <button
                            onClick={handleChat}
                            className="bg-pale h-16 w-16 flex items-center justify-center rounded-full"
                        >
                            <Lineicons icon={Message2Solid} />
                        </button>
                    )}

                </div>
            </Activity>

        </div>
    )
}

export default Profile