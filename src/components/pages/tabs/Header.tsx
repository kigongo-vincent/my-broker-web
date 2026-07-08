
import { useUserStore } from "../../../store/auth"
import Logo from "../../base/Logo"
import { useNavigate } from "react-router"

export interface props {
    back?: boolean
    title?: string
}

const Header = ({ back, title }: props) => {

    const { getUserPhoto } = useUserStore()
    const photo = getUserPhoto?.()
    const navigate = useNavigate()

    return (
        <div className=" fixed max-h-[9vh] min-h-[9vh] border-b border-text/10 z-50 bg-paper dark:bg-paper/80 dark:backdrop-blur-sm top-0 w-full h-[8vh] flex items-center justify-between px-4">

            {
                !back
                    ?
                    <Logo className="h-16" />
                    :
                    <button onClick={() => navigate(-1)} className="font-semibold  h-20 w-20 justify-start">
                        back
                    </button>
            }

            {
                !title
                    ?
                    <p className='font-semibold black-ops-one-regular text-2xl'>My Broker</p>
                    :
                    <p className='font-medium   text-primary'>{title}</p>
            }

            <img src={photo} className="h-14 w-14 rounded-full object-cover" alt="" />

        </div>
    )
}

export default Header