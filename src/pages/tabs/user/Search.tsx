import { useCallback, useEffect, useMemo, useRef } from "react"
import { useParams } from "react-router"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import { useInfinitePosts } from "../../../hooks/posts"
import { ListStackSkeleton } from "../../../components/base/PageSkeleton"
import Header from "../../../components/pages/tabs/Header"

const LIMIT = 3
const PREFETCH_THRESHOLD = 3

const Search = () => {
    const { query = "" } = useParams()

    const {
        data,
        isLoading,
        isFetchingNextPage,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = useInfinitePosts({ limit: LIMIT, search: query })

    const posts = useMemo(
        () => (data?.pages.flatMap((page) => page.data) as Partial<PostI>[]) ?? [],
        [data]
    )

    // total match count from the API's pagination payload (Total, capitalized,
    // matching the Go struct's field name), falling back to what's loaded
    // so far if the first page hasn't resolved a total yet
    const totalMatches = data?.pages?.[0]?.pagination?.Total ?? posts.length

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
            <Header back title="search" caption={isLoading ? "Searching..." : `${totalMatches} match${totalMatches === 1 ? "" : "es"} found`} />
            <div className="px-4">

                <p>Search results for <b className="text-primary">"{query}"</b></p>
            </div>

            <div className=" w-full h-full">
                {/* <FlexRender
                    row
                    className="flex-row my-4 gap-2"
                    items={tabs}
                    render={(item, index) => (
                        <div
                            onClick={() => setSelectedTab(item)}
                            className={`px-5 py-3 cursor-pointer flex-1 text-center ${selectedTab === item ? "border-b-2 border-primary text-primary" : ""}`}
                            key={index}>
                            {item}
                        </div>
                    )}
                /> */}
                <br />

                {isLoading ? (
                    <div className="py-4">
                        <ListStackSkeleton rows={3} className="space-y-8" />
                    </div>
                ) : isError ? (
                    <div className="p-4 text-center text-red-500">
                        Failed to load results: {(error as Error)?.message}
                        <button className="block mx-auto mt-2 underline" onClick={() => refetch()}>
                            Retry
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="p-4 text-center">No matches found for "{query}".</div>
                ) : (
                    <>
                        <div className="flex flex-col gap-10">
                            {posts.map((item, index) => (
                                <div key={(item as any).ID || index}>
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
                                    Loading more results...
                                </span>
                            ) : !hasNextPage ? (
                                <span className="text-sm text-gray-400">
                                    You've reached the end.
                                </span>
                            ) : null}
                        </div>
                    </>
                )}
            </div>

        </div>
    )
}

export default Search