import { AdjustmentsHorizontalIcon } from "@heroicons/react/20/solid"
import { Search1Outlined } from "@lineiconshq/free-icons"
import Lineicons from "@lineiconshq/react-lineicons"
import { InputHTMLAttributes } from "react"
import { useNavigate } from "react-router"
import { useUserStore } from "../../../../store/auth"
import { useAppStore } from "../../../../store/app"
import Bot from "../../../../assets/bot.webp"

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    filter?: boolean
    handleSubmit?: () => void
}

const Search = ({ filter, className, value, handleSubmit, ...attr }: Props) => {

    const navigate = useNavigate()
    const { token } = useUserStore()
    const { LoginPrompt } = useAppStore()
    const filterAction = () => {
        // event.preventDefault()
        if (token == "") {
            LoginPrompt("filters")
            return
        }

        navigate(`/filters`)

    }

    const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        handleSubmit?.()
    }

    return (
        <form
            onSubmit={onFormSubmit}
            className="bg-pale w-full rounded-full h-17 flex gap-3 items-center px-6 ">
            <Lineicons icon={Search1Outlined} className="h-[6.5vw] w-[6.5vw] " />
            <input type="text" value={value} placeholder="search for rentals" className={`flex-1 outline-0 ${className}`} {...attr} />
            {
                filter &&
                <AdjustmentsHorizontalIcon type="button" onClick={filterAction} className="h-[6.5vw] min-h-[6.5vw]  w-[6.5vw] min-w-[6.5vw] " />

            }
            <img src={Bot} onClick={() => navigate(`/chat-filter`)} className="min-h-12 min-w-12 h-12 w-12" alt="" />
        </form>
    )
}

export default Search