
import { useQuery } from "@tanstack/react-query"
import FlexRender from "../../../components/base/FlexRender"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import { Get } from "../../../../api"
import { useEffect, useMemo, useState } from "react"
import Modal from "../../../components/base/Modal"
import { useUserStore } from "../../../store/auth"
import { useAppStore } from "../../../store/app"

const Favourites = () => {

    const { getUser } = useUserStore()
    const { data, isLoading, error } = useQuery({ queryKey: ["favs"], queryFn: () => Get<PostI[]>("me/favourites") })
    const posts = useMemo(() => data?.data?.map(p => ({ ...p, favourites: [getUser()] })) as PostI[], [data])
    const [er, setEr] = useState("")
    const { setFavouritesCount } = useAppStore()

    useEffect(() => {
        if (error) {
            setEr(error?.message)
        }
    }, [error])

    useEffect(() => {
        setFavouritesCount(posts?.length)
    }, [posts])

    return (
        <div>
            {isLoading ? <div className="p-4 text-center">Loading favourites...</div> :
                <FlexRender className={`gap-10 ${posts?.length == 0 || posts == null && "px-4"}`} items={posts || []} render={(item, index) => <Post {...(item as PostI)} key={index} />} />
            }
            <Modal open={er != ""} onClose={() => setEr("")}>
                <p className="text-danger text-2xl font-semibold">error</p>
                <p>{er}</p>
            </Modal>

        </div>
    )
}

export default Favourites