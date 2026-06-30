import { AdjustmentsHorizontalIcon } from "@heroicons/react/20/solid"
import { Search1Solid } from "@lineiconshq/free-icons"
import Lineicons from "@lineiconshq/react-lineicons"
import { InputHTMLAttributes } from "react"

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    filter?: boolean
}

const Search = ({ filter, className, ...attr }: Props) => {
    return (
        <div className="bg-pale w-full rounded-full h-16 flex gap-3 items-center pl-6 pr-1.5">
            <Lineicons icon={Search1Solid} className="text-text/50" />
            <input type="text" placeholder="search for rentals" className={`flex-1 outline-0 ${className}`} {...attr} />
            {
                filter && <button>
                    <AdjustmentsHorizontalIcon className="h-14 w-14 bg-paper rounded-full p-4" />
                </button>
            }
        </div>
    )
}

export default Search