import { Route, Routes } from "react-router"
import AuthSplash from "../pages/auth/Index"
import PhoneAuth from "../pages/auth/PhoneAuth"

const auth = () => {
    return (
        <Routes>
            <Route path="/" Component={AuthSplash} />
            <Route path="/phone" Component={PhoneAuth} />
        </Routes>
    )
}

export default auth