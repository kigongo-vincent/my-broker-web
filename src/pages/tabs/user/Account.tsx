
import Header from "../../../components/pages/tabs/Header"
import { UserI, useUserStore } from "../../../store/auth"
import { Shell } from "./Upload"
import { CameraIcon } from "@heroicons/react/20/solid"


const Account = () => {

    const { user, getUserPhoto } = useUserStore()

    return (
        <div>
            <Header back />
            <Shell >

                <div className="pt-[9vh] flex flex-col gap-4 p-4">
                    <div className="h-40 relative w-40 self-center mb-8 rounded-full overflow-hidden">
                        <img src={getUserPhoto?.((user as UserI)?.photo)} className="h-full absolute object-cover w-full" />
                        <div className="absolute bg-black/50 flex items-center justify-center text-white left-0 to-0% h-full w-full">
                            <CameraIcon className="h-14 w-14" />
                        </div>
                    </div>
                    <div className="flex flex-col  gap-2">
                        <span className="text-sm">Name</span>
                        <input value={(user as UserI)?.name} type="text" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="john mccathy" />
                    </div>
                </div>
            </Shell>
        </div>
    )
}

export default Account