import { HTMLAttributes, useState } from "react"
import FlexRender from "../../../components/base/FlexRender"
import Search from "../../../components/pages/tabs/home/Search"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import { UserI, useUserStore } from "../../../store/auth"
import Lineicons from "@lineiconshq/react-lineicons"
import { MapMarker1Solid } from "@lineiconshq/free-icons"
import { motion } from "framer-motion"
import Modal from "../../../components/base/Modal"
import Map from "../../../components/pages/tabs/home/Map"
import { useNavigate } from "react-router"

interface FABProps extends HTMLAttributes<HTMLButtonElement> {

}

const FAB = ({ ...attr }: FABProps) => {
    return (
        <motion.button
            drag
            onClick={attr?.onClick}
            transition={{ ease: "linear" }}
            className="fixed z-40 bottom-40 right-10 bg-primary h-18 w-18 flex items-center justify-center text-white rounded-full">
            <Lineicons icon={MapMarker1Solid} />
        </motion.button>
    )
}

const Home = () => {

    const tabs = ["rentals", "short stays"]
    const [seletcedTab, setSlelectedTab] = useState(tabs[0])
    const [showMap, setShowMap] = useState(false)
    const { user } = useUserStore()

    const { data, isLoading } = { data: { content: [] }, isLoading: false }
    const posts = (data?.content as Partial<PostI>[]) || []
    const properties = posts

    const [query, setQuery] = useState("")
    const navigate = useNavigate()
    return (
        <div>
            <Search filter handleSubmit={() => navigate(`/search/${query}`)} value={query} onChange={(e) => setQuery(e?.currentTarget?.value)} />
            <FlexRender row className="flex-row my-4 gap-2" items={tabs} render={(item, index) => <div
                onClick={() => setSlelectedTab(item)}
                className={` px-5 py-3  cursor-pointer flex-1 text-center ${seletcedTab == item && "border-b-2 border-primary text-primary"}`} key={index}>{item}
            </div>} />
            {isLoading ? <div className="p-4 text-center">Loading properties...</div> :
                <FlexRender className="gap-10" items={posts?.map(p => ({ ...p, author: user as UserI }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />
            }

            <FAB onClick={() => setShowMap(true)} />

            <Modal position="right" open={showMap} onClose={() => setShowMap(false)}>
                <Map properties={properties} />
            </Modal>
        </div>
    )
}

export default Home