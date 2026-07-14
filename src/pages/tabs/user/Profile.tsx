import { useEffect, useMemo, useState } from 'react'
import { UserI, useUserStore } from '../../../store/auth'
import Post, { PostI } from '../../../components/pages/tabs/Post'
import FlexRender from '../../../components/base/FlexRender'
import Header from '../../../components/pages/tabs/Header'
import { useInfinitePosts } from '../../../hooks/posts'

export interface AccountI {
    user: Partial<UserI>
    posts: PostI[]
}

const Profile = () => {

    const { user, getUserPhoto } = useUserStore()
    const [account, setAccount] = useState<AccountI | null>(null)
    const { data, isLoading } = useInfinitePosts({ limit: 5 })

    const posts = useMemo(() => {
        const items = data?.pages.flatMap((page) => page.data) ?? []
        return items.filter((item) => item.author?.ID === (user as UserI)?.ID)
    }, [data, user])

    useEffect(() => {
        setAccount(() => ({ posts: posts as PostI[], user: user }))
    }, [posts, user])

    return (
        <div>
            <Header back title={(account?.user as UserI | undefined)?.name || (user as UserI | undefined)?.name || 'Profile'} caption='last seen 2hrs ago' />

            <div className="h-[4vh]"></div>

            <div className='bg-pale bg-center bg-cover p-10 relative h-[18vh]'>

                <img src={getUserPhoto?.(account?.user?.photo)} className='h-30 w-30 left-[50%] transform -translate-x-[50%] top-25 border-4 border-paper absolute rounded-full object-cover' alt="" />



            </div>

            <div className="mt-30 p-4">

                <div className="bg-pale p-6 flex flex-col gap-1.5 rounded-xl">
                    <h3 className="text-2xl font-bold ">{account?.user?.name}</h3>
                    <p>{account?.user?.email}</p>
                    <p>{account?.user?.phone}</p>
                </div>
                <br />
                {isLoading ? (
                    <div className="py-4 text-sm text-text/50">Loading listings...</div>
                ) : posts.length === 0 ? (
                    <div className="py-4 text-sm text-text/50">No listings yet.</div>
                ) : (
                    <FlexRender className="gap-10" items={posts?.map(p => ({ ...p, author: user }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />
                )}


            </div>
        </div>
    )
}

export default Profile