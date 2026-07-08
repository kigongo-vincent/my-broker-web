import { AdjustmentsHorizontalIcon } from "@heroicons/react/20/solid"
import { Search1Outlined } from "@lineiconshq/free-icons"
import Lineicons from "@lineiconshq/react-lineicons"
import { InputHTMLAttributes } from "react"
import { useNavigate } from "react-router"

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    filter?: boolean
    handleSubmit?: () => void
}

const Search = ({ filter, className, value, handleSubmit, ...attr }: Props) => {

    const navigate = useNavigate()

    return (
        <form
            onSubmit={(e) => { e?.preventDefault(); value && handleSubmit?.() }}
            className="bg-pale w-full rounded-full h-17 flex gap-3 items-center pl-6 pr-4">
            <Lineicons icon={Search1Outlined} />
            <input type="text" value={value} placeholder="search for rentals" className={`flex-1 outline-0 ${className}`} {...attr} />
            {
                filter && <button onClick={() => navigate(`/filters`)}>
                    <AdjustmentsHorizontalIcon className="h-13 w-13 p-2.5 " />
                </button>
            }
        </form>
    )
}

export default Search