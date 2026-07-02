import { Route, Routes } from "react-router"
import auth from "./auth"
import tabs from "./tabs"
import SplashScreen from "../pages/Index"
import Upload from "../pages/tabs/user/Upload"
import ChatRoom from "../pages/tabs/user/ChatRoom"
import PostDetails from "../pages/tabs/user/PostDetails"
import Profile from "../pages/tabs/user/Profile"
import Search from "../pages/tabs/user/Search"
import Filter from "../pages/tabs/user/Filter"


const Index = () => {
    return (
        <Routes>
            <Route path="/" Component={SplashScreen} />
            <Route path="/auth/*" Component={auth} />
            <Route path="/upload" Component={Upload} />
            <Route path="/tabs/*" Component={tabs} />
            <Route path="/chat/:id" Component={ChatRoom} />
            <Route path="/post/:id" Component={PostDetails} />
            <Route path="/profile/:id" Component={Profile} />
            <Route path="/search/:query" Component={Search} />
            <Route path="/filters" Component={Filter} />

        </Routes>
    )
}

export default Index