import { useUserStore } from "../../../store/auth"
import Logo from "../../base/Logo"


const Header = () => {

    const { getUserPhoto } = useUserStore()
    const photo = getUserPhoto?.()

    return (
        <div className=" fixed max-h-[8vh]  z-50 bg-paper dark:bg-paper/80 dark:backdrop-blur-sm top-0 w-full h-[8vh] flex items-center justify-between px-4">

            <Logo className="h-16" />
            <img src={photo} className="h-14 w-14 rounded-full object-cover" alt="" />

        </div>
    )
}

export default Header