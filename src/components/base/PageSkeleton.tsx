import { HTMLAttributes } from "react"

export interface LProps extends HTMLAttributes<HTMLDivElement> {
    rows: number

}
export const ListStackSkeleton = ({ className }: LProps) => {
    return (
        <div className={className}>ListStackSkeleton</div>
    )
}
