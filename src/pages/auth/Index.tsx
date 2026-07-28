
import Logo from "../../components/base/Logo"
// import GoogleIcon from "../../assets/google-logo.png"
import { useNavigate } from "react-router"
import { PhoneIcon } from "@heroicons/react/24/solid"

export function GoogleMark() {
    return (
        <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden className="shrink-0">
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
        </svg>
    )
}

const Index = () => {

    const navigate = useNavigate()

    function handleGoogleLogin() {
        const state = crypto.randomUUID();
        sessionStorage.setItem("google_oauth_state", state);

        const params = new URLSearchParams({
            // client_id: process.me.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            // redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!, // must equal the backend callback URL, byte-for-byte
            redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URL,
            response_type: "code",
            scope: "openid email profile",
            state,
            access_type: "online",
            prompt: "select_account",
        });

        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

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
                    onClick={handleGoogleLogin}
                    className="btn w-full mb-2 h-16 rounded-full border-text/20 border bg-transparent">
                    <GoogleMark />
                    <span>
                        continue with google
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
                all rights reserved &copy; {window?.location.host}
            </footer>

        </div>
    )
}

export default Index