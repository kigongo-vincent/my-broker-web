import { Activity, useMemo } from 'react'
import { UserI, useUserStore } from '../../../store/auth'
import Post, { PostI } from '../../../components/pages/tabs/Post'
import FlexRender from '../../../components/base/FlexRender'
import Header from '../../../components/pages/tabs/Header'
import { useInfiniteQuery } from '@tanstack/react-query'
import { APIResponse } from '../../../../api'
import { Post as P } from "../../../../api/index"
import { useParams } from 'react-router'

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
    const { user, getUserPhoto } = useUserStore()
    const { id } = useParams()
    const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteUserProfile({ limit: 5, userId: id })

    const account = useMemo<AccountI | null>(() => {
        const lastPage = data?.pages[data.pages.length - 1]
        if (!lastPage) return null

        const posts = data.pages.flatMap((page) => page.data.posts)
        return { user: lastPage.data.user, posts }
    }, [data])

    return (
        <div>
            <Header
                back
                title={account?.user?.name || (user as UserI | undefined)?.name || 'Profile'}
                caption='last seen 2hrs ago'
            />

            <div className="mt-30">
                <img
                    src={getUserPhoto?.(account?.user?.photo)}
                    className='h-30 w-30 left-[50%] transform -translate-x-[50%] top-25 border-4 border-paper absolute rounded-full object-cover'
                    alt=""
                />

                <div className=" p-6 flex flex-col items-center gap-1.5 rounded-xl">
                    <h3 className="text-2xl font-bold">{account?.user?.name}</h3>
                    <p className='text-text/50'>{account?.user?.email}</p>

                    {/* bio  */}
                    <Activity mode={account?.user?.role == "broker" ? "visible" : "hidden"}>
                        <p className='text-text/50'>{account?.user?.BrokerDetails?.Bio}</p>
                        <p className='text-text/50'>{account?.user?.BrokerDetails?.Fee}</p>
                    </Activity>
                </div>
                <br />

                {isLoading ? (
                    <div className="py-4 text-sm text-text/50">Loading listings...</div>
                ) : account?.posts.length === 0 ? (
                    <div className="py-4 text-sm text-text/50">No listings yet.</div>
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
        </div>
    )
}

export default Profile