import { HTMLAttributes, ReactNode } from "react"
import Empty from "./Empty"
import { ListStackSkeleton } from "./PageSkeleton"


export interface Props<T> extends HTMLAttributes<HTMLDivElement> {
    items: T[]
    render: (item: T, index: number) => ReactNode
    row?: boolean
    emptyContainer?: ReactNode
    emptyTitle?: string
    emptyCaption?: string
    isLoading?: boolean
    loadingContainer?: ReactNode
}
const FlexRender = <T,>({ items, render, row, emptyContainer, emptyTitle, emptyCaption, className, isLoading, loadingContainer }: Props<T>) => {
    return (
        <div className={`flex  ${row ? "gap-3" : "gap-6  flex-col"} ${className}`}>
            {
                isLoading
                    ?
                    (
                        <div role="status" aria-live="polite" aria-busy="true" className="w-full min-w-0" data-skeleton="flex-render-loading">
                            <span className="sr-only">Loading list</span>
                            {loadingContainer || <ListStackSkeleton rows={3} className="py-1 " />}
                        </div>
                    )
                    :
                    items?.length == 0
                        ?
                        emptyContainer ? emptyContainer : <Empty title={emptyTitle} caption={emptyCaption} />
                        :
                        items?.map((render))
            }
        </div>
    )
}

export default FlexRender