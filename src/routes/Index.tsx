import { Route, Routes } from "react-router"
import auth from "./auth"
import tabs from "./tabs"
import SplashScreen from "../pages/Index"
import Upload from "../pages/tabs/user/Upload"
import ChatRoom from "../pages/tabs/user/ChatRoom"


const Index = () => {
    return (
        <Routes>
            <Route path="/" Component={SplashScreen} />
            <Route path="/auth/*" Component={auth} />
            <Route path="/upload" Component={Upload} />
            <Route path="/tabs/*" Component={tabs} />
            <Route path="/chat/:id" Component={ChatRoom} />
        </Routes>
    )
}

export default Index