
import { useUserStore } from "../../../store/auth"
import Logo from "../../base/Logo"
import { useNavigate } from "react-router"

export interface props {
    back?: boolean
    title?: string
    caption?: string
    noblur?: boolean
}

const Header = ({ back, title, noblur, caption }: props) => {

    const { getUserPhoto } = useUserStore()
    const photo = getUserPhoto?.()
    const navigate = useNavigate()

    return (
        <div className={`fixed max-h-[9vh] min-h-[9vh] border-b border-text/10 z-50 bg-paper  ${!noblur && "dark:backdrop-blur-sm dark:bg-paper/80"} top-0 w-full h-[8vh] flex items-center justify-between px-4`}>

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
                    !caption
                        ?
                        <p className='font-semibold text-center text-xl'>{title}</p>
                        :
                        <div className="flex flex-col items-center justify-center">
                            <p className='font-semibold '>{title}</p>
                            <p className=' text-sm text-text/60'>{caption}</p>
                        </div>
            }

            {
                title
                    ?
                    <>
                        <Logo className="h-16" />
                    </>
                    :
                    <img src={photo} className="h-14 w-14 rounded-full object-cover" alt="" />

            }
        </div>
    )
}

export default Header