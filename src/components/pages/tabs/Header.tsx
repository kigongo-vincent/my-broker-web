
import { Activity } from "react"
import { useAppStore } from "../../../store/app"
import { UserI, useUserStore } from "../../../store/auth"
import Logo from "../../base/Logo"
import { Link, useNavigate } from "react-router"

export interface props {
    back?: boolean
    title?: string
    caption?: string
    noblur?: boolean
    noMargin?: boolean
}

const Header = ({ back, title, noMargin, noblur, caption }: props) => {

    const { token, getUserPhoto, user } = useUserStore()
    const photo = getUserPhoto?.((user as UserI)?.photo)
    const { LoginPrompt } = useAppStore()
    const navigate = useNavigate()

    function handleProfileClick(): void {

        if (token != "") {
            navigate(`/profile/0`)
        } else {
            LoginPrompt("profile")
        }

    }

    return (
        <>
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
                            <Link to={"/"}>
                                <Logo className="h-16" />
                            </Link>
                        </>
                        :
                        <img src={photo} onClick={handleProfileClick} className="h-12 cursor-pointer w-12 rounded-full object-cover" alt="" />

                }
            </div>
            <Activity mode={noMargin ? "hidden" : "visible"}>
                <div className="min-h-[11vh]"></div>
            </Activity>
        </>

    )
}

export default Header