
import Logo from "../../components/base/Logo"
// import GoogleIcon from "../../assets/google-logo.png"
import { useNavigate } from "react-router"
import { PhoneIcon } from "@heroicons/react/24/solid"


const Index = () => {

    const navigate = useNavigate()

    return (
        <div className="gap-20  h-[90vh] flex flex-col items-center overflow-hidden justify-around p-4">
            <div />

            <main className="flex flex-col items-center w-full  justify-center gap-2">
                <Logo className="h-24 mb-2" />
                <h3 className="text-3xl black-ops-one-regular font-bold -mb-2">My Broker</h3>
                <p className="  text-center text-text/70  leading-7.5 my-10 max-w-[90%]">are you house hunting, get rentals at the comfort of your place, for the landlord, get straight to the tenant, no middleman</p>

                <button
                    onClick={() => navigate("/auth/phone")}
                    className="btn w-full mb-2 h-16 rounded-full text-white bg-primary">
                    <PhoneIcon className="h-6 w-6" />
                    <span>
                        continue with phone number
                    </span>
                </button>

                <button
                    onClick={() => navigate("/tabs/user")}
                    className="btn w-full h-16 bg-pale  rounded-full">
                    {/* <img src={GoogleIcon} className="h-7" alt="" /> */}
                    <span>skip to rentals</span>
                </button>
            </main>


            <footer className="text-sm text-text/50">
                all rights reserved &copy; mybroker.net
            </footer>

        </div>
    )
}

export default Index