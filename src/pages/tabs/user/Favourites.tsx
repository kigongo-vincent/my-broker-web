
import { useQuery } from "@tanstack/react-query"
import FlexRender from "../../../components/base/FlexRender"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import { Get } from "../../../../api"
import { useEffect, useState } from "react"
import Modal from "../../../components/base/Modal"

const Favourites = () => {


    const { data, isLoading, error } = useQuery({ queryKey: ["favs"], queryFn: () => Get<PostI[]>("me/favourites") })
    const posts = data?.data as PostI[]

    const [er, setEr] = useState("")

    useEffect(() => {
        if (error) {
            setEr(error?.message)
        }
    }, [error])

    return (
        <div>
            {isLoading ? <div className="p-4 text-center">Loading favourites...</div> :
                <FlexRender className="gap-10" items={posts?.map(p => ({ ...p }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />
            }
            <Modal open={er != ""} onClose={() => setEr("")}>
                <p className="text-danger text-2xl font-semibold">error</p>
                <p>{er}</p>
            </Modal>

        </div>
    )
}

export default Favourites