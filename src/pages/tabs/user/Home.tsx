import { HTMLAttributes, useEffect, useRef, useState, useCallback, useMemo, Activity } from "react"
import FlexRender from "../../../components/base/FlexRender"
import Search from "../../../components/pages/tabs/home/Search"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import Lineicons from "@lineiconshq/react-lineicons"
import { MapMarker1Solid, XmarkSolid } from "@lineiconshq/free-icons"
import { motion } from "framer-motion"
import { useNavigate } from "react-router"
import { useInfinitePosts } from "../../../hooks/posts"
import { useAppStore } from "../../../store/app"
import { BadgeSkeleton, ListStackSkeleton } from "../../../components/base/PageSkeleton"
import Empty from "../../../components/base/Empty"
import Bot from "../../../assets/bot.webp"

interface FABProps extends HTMLAttributes<HTMLButtonElement> { }
const FAB = ({ ...attr }: FABProps) => {
    const constraintsRef = useRef<HTMLDivElement>(null)

    return (
        <motion.button
            drag
            dragConstraints={constraintsRef}
            dragElastic={0}
            dragMomentum={false}
            onClick={attr?.onClick}
            className="fixed bottom-25 right-5 bg-primary h-14 w-14 flex items-center justify-center text-white rounded-full pointer-events-auto"
        >
            <Lineicons icon={MapMarker1Solid} />
        </motion.button>
    )
}

// @ts-ignore
const FAB2 = ({ ...attr }: FABProps) => {
    const constraintsRef = useRef<HTMLDivElement>(null)

    return (
        <motion.button
            drag
            dragConstraints={constraintsRef}
            dragElastic={0}
            dragMomentum={false}
            onClick={attr?.onClick}
            className="fixed bottom-25 left-5 bg-white shadow-custom h-14 w-14  flex items-center justify-center  rounded-full pointer-events-auto"
        >
            <img src={Bot} alt="" className="h-13 w-13" />
        </motion.button>
    )
}
const LIMIT = 3

// Nearest ancestor that actually scrolls (null = the window scrolls)
const getScrollParent = (node: HTMLElement): HTMLElement | null => {
    let el = node.parentElement
    while (el) {
        const { overflowY } = getComputedStyle(el)
        if (overflowY === "auto" || overflowY === "scroll") return el
        el = el.parentElement
    }
    return null
}

const Home = () => {
    const tabs = ["rentals", "short stays"]
    const [selectedTab, setSelectedTab] = useState(tabs[0])
    const [query, setQuery] = useState("")
    const { filters, removeFilter, setShowHomeBadge } = useAppStore()

    const navigate = useNavigate()

    const handleSearchSubmit = () => {
        const trimmed = query.trim()
        if (trimmed) navigate(`/search/${encodeURIComponent(trimmed)}`)
    }

    // Home's own feed is unfiltered — search results live on /search/:query
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

    // skeletons only for an explicit refresh; background updates stay invisible
    const [isManualRefresh, setIsManualRefresh] = useState(false)
    const isRefreshing = isManualRefresh

    const posts = useMemo(
        () => data?.pages.flatMap((page) => page.data) ?? [],
        [data]
    )


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
            root: getScrollParent(node),
            rootMargin: "0px 0px 800px 0px",
            threshold: 0,
        })

        observer.observe(node)
        return () => observer.disconnect()
    }, [handleIntersect, posts.length, hasNextPage])
    const { refresh, setRefresh } = useAppStore()

    useEffect(() => {
        if (!refresh) return

        // jump to top first (instant) so the skeletons are visible, not just the old list scrolling away
        document.querySelector('main')?.scrollTo({ top: 0 })

        setIsManualRefresh(true)
        refetch().finally(() => setIsManualRefresh(false))
        setRefresh?.(false)
    }, [refresh, refetch, setRefresh])

    return (
        <div className="flex flex-col gap-3 flex-1">

            <div className="px-4 flex flex-col gap-1">
                <div className="h-21"></div>
                <Search
                    filter
                    value={query}
                    onChange={(e) => setQuery(e?.currentTarget?.value || "")}
                    handleSubmit={handleSearchSubmit}
                />

                {
                    filters?.length != 0 &&
                    <>
                        <FlexRender className="mt-3 overflow-x-auto" row items={filters} render={(item, index) => <button onClick={() => removeFilter(item?.column)} key={index} className="flex items-center gap-2 bg-pale min-w-max px-6 py-2 pr-1  rounded-full">{item?.label} <Lineicons icon={XmarkSolid} className="bg-danger text-white rounded-full p-2 h-8 w-8" /></button>} />
                    </>
                }

                <Activity mode={"hidden"}>
                    {
                        isLoading
                            ?
                            <BadgeSkeleton />
                            :
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4  mt-5  flex items-center gap-4 p-6 bg-primary/5 rounded-2xl">
                                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src="https://static.vecteezy.com/system/resources/thumbnails/060/043/598/small/tranquil-picturesque-modern-apartment-building-facade-modular-design-no-background-with-transparent-background-sharp-free-png.png" className="  object-contain    w-[35%] " alt="" />
                                <div className="flex flex-col items-start">
                                    <p className="text-lg font-semibold">Your rental plug</p>
                                    <p className="text-sm text-text/60 leading-5 mt-1">house hunting has never been easier & cheaper</p>
                                    <button onClick={() => setShowHomeBadge()} className="bg-text/10 px-4 py-1 rounded-full mt-2">close</button>
                                </div>
                            </motion.div>
                    }
                </Activity>
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

            {isLoading || isRefreshing ? (
                <div className="py-4">
                    <ListStackSkeleton rows={3} className="space-y-8" />
                </div>
            ) : isError ? (
                <div className="p-4 text-center text-red-500">
                    Failed to load properties: {(error as Error)?.message}
                    <button className="btn bg-pale w-full text-text rounded-full mt-2" onClick={() => refetch()}>
                        Retry
                    </button>
                </div>
            ) : posts.length === 0 ? (
                // <div className="p-4 text-center">No properties found.</div>
                <Empty type="posts" title="No properties found" />
            ) : (
                <>
                    <div className="flex flex-col gap-2">
                        {posts.map((item, index) => (
                            <div key={`${item.source ?? "backend"}-${item.ID ?? index}`}>
                                <Post {...(item as PostI)} hideAvailability />
                            </div>
                        ))}
                    </div>

                    <div ref={sentinelRef} className="h-1 w-full" />
                    <div className="flex items-center justify-center py-6">
                        {isFetchingNextPage ? (
                            <span className="text-sm text-text/50 animate-pulse">
                                Loading more properties...
                            </span>
                        ) : hasNextPage ? (
                            <button
                                onClick={() => fetchNextPage()}
                                className="btn rounded-full bg-pale px-6 text-text"
                            >
                                Load more
                            </button>
                        ) : (
                            <span className="text-sm text-text/50">
                                You've reached the end.
                            </span>
                        )}
                    </div>
                </>
            )}

            <FAB onClick={() => navigate(`/map`)} />
            {/* <FAB2 onClick={() => navigate(`/chat-filter`)} /> */}

        </div>
    )
}

export default Home