import { HTMLAttributes } from "react"

export interface LProps extends HTMLAttributes<HTMLDivElement> {
    rows: number
}

export const ListStackSkeleton = ({ className, rows = 3 }: LProps) => {


    return (
        <div className={`space-y-6 ${className ?? ""}`}>
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="space-y-4">
                    <div className="flex items-center  px-4 gap-3">
                        <div className="h-14 w-14 animate-pulse rounded-full bg-text/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-2/5 animate-pulse rounded-full bg-text/10" />
                            <div className="h-3 w-3/4 animate-pulse rounded-full bg-text/10" />
                        </div>
                    </div>
                    <div className="h-40 animate-pulse rounded bg-text/10" />
                </div>
            ))}
        </div>
    )
}


export const BadgeSkeleton = () => {
    return <div className="flex items-center mt-3 gap-2">

        {/* image  */}
        <div className="h-30 w-40 bg-text/10 animate-pulse rounded-xl">

        </div>
        {/* details  */}
        <div className="flex flex-col gap-2  flex-1">

            <div className="h-4 rounded-full w-[80%] bg-text/10 animate-pulse"></div>
            <div className="h-5 rounded-xl w-full bg-text/10 animate-pulse"></div>
            <div className="h-5 rounded-xl w-[60%] bg-text/10 animate-pulse"></div>
            <div className="h-3 rounded-full w-[40%] bg-text/10 animate-pulse"></div>

        </div>


    </div>
}
