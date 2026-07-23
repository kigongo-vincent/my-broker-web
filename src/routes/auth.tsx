import { Route, Routes } from "react-router"
import AuthSplash from "../pages/auth/Index"
import PhoneAuth from "../pages/auth/PhoneAuth"
import NotFound from "../pages/NotFound"

const auth = () => {
    return (
        <Routes>
            <Route path="/" Component={AuthSplash} />
            <Route path="/phone" Component={PhoneAuth} />
            <Route path="/*" Component={NotFound} />

        </Routes>
    )
}

export default auth