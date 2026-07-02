import Lineicons from "@lineiconshq/react-lineicons"
import Logo from "../../components/base/Logo"
import { PhoneSolid } from "@lineiconshq/free-icons"
import GoogleIcon from "../../assets/google-logo.png"
import { useNavigate } from "react-router"


const Index = () => {

    const navigate = useNavigate()

    return (
        <div className="h-screen flex flex-col items-center overflow-hidden justify-around p-4">
            <div />

            <main className="flex flex-col items-center w-full  justify-center gap-2">
                <Logo className="h-24 mb-2" />
                <h3 className="text-3xl black-ops-one-regular font-bold -mb-2">My Broker</h3>
                <p className="  text-center  leading-8 mt-8  mb-8 max-w-[70%]">are you house hunting, get rentals at the comfort of your place</p>

                <button className="btn mb-2 text-white bg-primary">
                    <Lineicons icon={PhoneSolid} />
                    continue with phone number
                </button>

                <button
                    onClick={() => navigate("/tabs/user")}
                    className="btn bg-pale">
                    <img src={GoogleIcon} className="h-7" alt="" />
                    <span>Continue with google </span>
                </button>
            </main>


            <footer className="text-sm text-text/50">
                all rights reserved &copy; mybroker.net
            </footer>

        </div>
    )
}

export default Index