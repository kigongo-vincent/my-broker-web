import { ReactNode } from "react"

export interface Props {
    children: ReactNode
    loading: boolean
}

const Loader = ({ children, loading }: Props) => {
    return (
        <>
            {
                loading
                    ?
                    <div className="border border-text animate-ping rounded-full h-4 w-4">

                    </div>
                    :
                    children
            }
        </>
    )
}

export default Loader