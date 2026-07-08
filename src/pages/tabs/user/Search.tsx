import { useState } from "react"
import FlexRender from "../../../components/base/FlexRender"
import { useNavigate, useParams } from "react-router"
import Post, { PostI } from "../../../components/pages/tabs/Post"



const Search = () => {

    const tabs = ["users", "rentals",]
    const { query } = useParams()
    const [seletcedTab, setSlelectedTab] = useState(tabs[1])
    const { data, isLoading } = { data: { content: [] }, isLoading: false }
    const posts = (data?.content as Partial<PostI>[]) || []

    const navigate = useNavigate()
    return (
        <div>

            <div className="p-4 bg-primary text-white">
                <div className="flex items-center mb-2 gap-2">
                    <button onClick={() => navigate(-1)} className="font-semibold px-5 py-2 bg-white/10 rounded-full">back</button>
                    <p className="text-2xl">4 matches found</p>
                </div>
                <p>Search results for <b>"{query}"</b></p>
            </div>
            <div className="p-4  w-full h-full">
                <FlexRender row className="flex-row my-4 gap-2" items={tabs} render={(item, index) => <div
                    onClick={() => setSlelectedTab(item)}
                    className={` px-5 py-3  cursor-pointer flex-1 text-center ${seletcedTab == item && "border-b-2 border-primary text-primary"}`} key={index}>{item}
                </div>} />
                <br />
                {isLoading ? <div className="p-4 text-center">Searching...</div> :
                    <FlexRender className="gap-10" items={posts?.map(p => ({ ...p, author: (p as any)?.author }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />
                }
            </div>

        </div>
    )
}

export default Search