import { AdjustmentsHorizontalIcon } from "@heroicons/react/20/solid"
import { Search1Solid } from "@lineiconshq/free-icons"
import Lineicons from "@lineiconshq/react-lineicons"
import { InputHTMLAttributes } from "react"

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    filter?: boolean
}

const Search = ({ filter, className, ...attr }: Props) => {
    return (
        <div className="bg-pale w-full rounded-full h-17 flex gap-3 items-center pl-6 pr-4">
            <Lineicons icon={Search1Solid} />
            <input type="text" placeholder="search for rentals" className={`flex-1 outline-0 ${className}`} {...attr} />
            {
                filter && <button>
                    <AdjustmentsHorizontalIcon className="h-14 w-14 p-2.5 rounded-full" />
                </button>
            }
        </div>
    )
}

export default Search