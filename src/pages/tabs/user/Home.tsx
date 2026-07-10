import { HTMLAttributes, useEffect, useRef, useState, useCallback, useMemo } from "react"
import FlexRender from "../../../components/base/FlexRender"
import Search from "../../../components/pages/tabs/home/Search"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import Lineicons from "@lineiconshq/react-lineicons"
import { MapMarker1Solid } from "@lineiconshq/free-icons"
import { motion } from "framer-motion"
import { useNavigate } from "react-router"
import { useInfinitePosts } from "../../../hooks/posts"

interface FABProps extends HTMLAttributes<HTMLButtonElement> { }

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

const LIMIT = 3
const PREFETCH_THRESHOLD = 3 // sentinel sits 3 items from the end of what's loaded

const Home = () => {
    const tabs = ["rentals", "short stays"]
    const [selectedTab, setSelectedTab] = useState(tabs[0])
    const [query, setQuery] = useState("")

    const navigate = useNavigate()

    const {
        data,
        isLoading,
        isFetchingNextPage,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = useInfinitePosts({ limit: LIMIT })


    const posts = useMemo(
        () => data?.pages.flatMap((page) => page.data) ?? [],
        [data]
    )

    console.log(posts)

    const sentinelRef = useRef<HTMLDivElement | null>(null)

    const handleIntersect = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    )

    useEffect(() => {
        const node = sentinelRef.current
        if (!node) return

        const observer = new IntersectionObserver(handleIntersect, {
            root: null,
            rootMargin: "200px",
            threshold: 0,
        })

        observer.observe(node)
        return () => observer.disconnect()
    }, [handleIntersect, posts.length])

    const sentinelIndex = Math.max(posts.length - PREFETCH_THRESHOLD, 0)

    return (
        <div>
            <Search
                filter
                value={query}
                onChange={(e) => setQuery(e?.currentTarget?.value || "")}
            />

            <div className="mb-4 border border-primary/40 mt-5 h-[16vh] flex items-center gap-4 p-4 py-2 bg-primary/5 rounded-2xl">
                <img src="https://static.vecteezy.com/system/resources/thumbnails/060/043/598/small/tranquil-picturesque-modern-apartment-building-facade-modular-design-no-background-with-transparent-background-sharp-free-png.png" className="  object-contain object-bottom rounded-xl h-full w-[35%]" alt="" />
                <div className="flex flex-col items-start">
                    <p className="text-lg font-semibold">20+ New listings</p>
                    <p className="text-sm text-text/60 leading-5 mt-1">house hunting has never been easier & cheaper</p>
                </div>
            </div>

            <FlexRender
                row
                className="flex-row hidden my-4 gap-2"
                items={tabs}
                render={(item, index) => (
                    <div
                        onClick={() => setSelectedTab(item)}
                        className={`px-5 py-3 cursor-pointer flex-1 text-center ${selectedTab === item ? "border-b-2 border-primary text-primary" : ""}`}
                        key={index}>
                        {item}
                    </div>
                )}
            />

            {isLoading ? (
                <div className="p-4 text-center">Loading properties...</div>
            ) : isError ? (
                <div className="p-4 text-center text-red-500">
                    Failed to load properties: {(error as Error)?.message}
                    <button className="block mx-auto mt-2 underline" onClick={() => refetch()}>
                        Retry
                    </button>
                </div>
            ) : posts.length === 0 ? (
                <div className="p-4 text-center">No properties found.</div>
            ) : (
                <>
                    <div className="flex flex-col gap-10">
                        {posts.map((item, index) => (
                            // Assuming item has a unique id property, change 'index' to 'item.id' if available
                            <div key={item.ID || index}>
                                <Post {...(item as PostI)} />
                                {index === sentinelIndex && (
                                    <div ref={sentinelRef} className="h-1 w-full" />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center py-6">
                        {isFetchingNextPage ? (
                            <span className="text-sm text-gray-400 animate-pulse">
                                Loading more properties...
                            </span>
                        ) : !hasNextPage ? (
                            <span className="text-sm text-gray-400">
                                You've reached the end.
                            </span>
                        ) : null}
                    </div>
                </>
            )}

            <FAB onClick={() => navigate(`/map`)} />
        </div>
    )
}

export default Home