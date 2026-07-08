
import FlexRender from "../../../components/base/FlexRender"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import { useUserStore } from "../../../store/auth"

const Favourites = () => {

    const { data, isLoading } = { data: { content: [] }, isLoading: false }
    const posts = (data?.content as Partial<PostI>[]) || []

    const { user } = useUserStore()

    return (
        <div>
            {isLoading ? <div className="p-4 text-center">Loading favourites...</div> :
                <FlexRender className="gap-10" items={posts?.map(p => ({ ...p, author: (p as any)?.author || user }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />
            }

        </div>
    )
}

export default Favourites