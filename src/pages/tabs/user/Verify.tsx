
import Header from "../../../components/pages/tabs/Header"
import { Shell } from "./Upload"
import { CheckBadgeIcon } from "@heroicons/react/20/solid"

const Verify = () => {
    return (
        <div>
            <Header back />
            <Shell onBack={() => null} >
                <div className="pt-[7vh]">

                    <div className="shadow-custom p-8 rounded-2xl ">
                        <h2 className="text-xl  font-semibold">Face verification</h2>
                        <p className="leading-7 mt-6">Verifcation earns you a <b>verification badge</b>, which represents you as an authentic user of the platform</p>
                        <button className="btn bg-primary text-white mt-10">
                            <CheckBadgeIcon className="h-6 w-6" />
                            request verification
                        </button>
                    </div>



                </div>
            </Shell>
        </div>
    )
}

export default Verify