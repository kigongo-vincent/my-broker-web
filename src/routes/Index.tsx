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
import Users from "../pages/tabs/admin/Users"
import Account from "../pages/tabs/user/Account"
import Verify from "../pages/tabs/user/Verify"
import PhoneChange from "../pages/tabs/user/PhoneChange"
import MapP from "../pages/tabs/user/MapP"


const Index = () => {

    const click = (e: { preventDefault?: () => void }) => {
        e?.preventDefault?.()
        // navigator.vibrate(50)
    }

    return (
        <div onClick={click}>

            <Routes>
                <Route path="/" Component={SplashScreen} />
                <Route path="/auth/*" Component={auth} />
                <Route path="/upload" Component={Upload} />
                <Route path="/tabs/*" Component={tabs} />
                <Route path="/chat/:id" Component={ChatRoom} />
                <Route path="/post/:postId" Component={PostDetails} />
                <Route path="/profile/:id" Component={Profile} />
                <Route path="/search/:query" Component={Search} />
                <Route path="/map" Component={MapP} />
                <Route path="/filters" Component={Filter} />
                <>
                    <>
                        <Route path="/users" Component={Users} />
                        <Route path="/account" Component={Account} />
                        <Route path="/verification" Component={Verify} />
                        <Route path="/phone" Component={PhoneChange} />
                    </>
                </>

            </Routes>
        </div>
    )
}

export default Index