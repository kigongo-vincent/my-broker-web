import { HTMLAttributes } from "react"

export interface LProps extends HTMLAttributes<HTMLDivElement> {
    rows: number
}

export const ListStackSkeleton = ({ className, rows = 3 }: LProps) => {
    return (
        <div className={`space-y-6 ${className ?? ""}`}>
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-14 animate-pulse rounded-full bg-text/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-2/5 animate-pulse rounded-full bg-text/10" />
                            <div className="h-3 w-3/4 animate-pulse rounded-full bg-text/10" />
                        </div>
                    </div>
                    <div className="h-40 animate-pulse rounded-3xl bg-text/10" />
                </div>
            ))}
        </div>
    )
}
