import { Route, Routes } from "react-router"
import auth from "./auth"
import tabs from "./tabs"
import SplashScreen from "../pages/Index"


const Index = () => {
    return (
        <Routes>
            <Route path="/" Component={SplashScreen} />
            <Route path="/auth/*" Component={auth} />
            <Route path="/tabs/*" Component={tabs} />
        </Routes>
    )
}

export default Index