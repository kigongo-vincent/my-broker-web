import { Navigate, Route, Routes } from "react-router"
import auth from "./auth"
import tabs from "./tabs"
import Upload from "../pages/tabs/user/Upload"
import ChatRoom from "../pages/tabs/user/ChatRoom"
import PostDetails from "../pages/tabs/user/PostDetails"
import Profile from "../pages/tabs/user/Profile"
import Search from "../pages/tabs/user/Search"
import Filter from "../pages/tabs/user/Filter"
import Account from "../pages/tabs/user/Account"
import Verify from "../pages/tabs/user/Verify"
import PhoneChange from "../pages/tabs/user/PhoneChange"
import MapP from "../pages/tabs/user/MapP"
import NotFound from "../pages/NotFound"
import Terms from "../pages/auth/Terms"
import ChatFilter from "../components/base/ChatFilter"
import Privacy from "../pages/tabs/user/Privacy"


const Index = () => {

    return (
        <div>

            <Routes>
                <Route path="/" Component={() => <Navigate to="/tabs/user/" replace />} />
                <Route path="/auth/*" Component={auth} />
                <Route path="/chat-filter" Component={ChatFilter} />
                <Route path="/upload" Component={Upload} />
                <Route path="/tabs/*" Component={tabs} />
                <Route path="/terms" Component={Terms} />

                <Route path="/chat/:id" Component={ChatRoom} />
                <Route path="/post/:postId" Component={PostDetails} />
                <Route path="/profile/:id" Component={Profile} />
                <Route path="/search/:query" Component={Search} />
                <Route path="/map" Component={MapP} />
                <Route path="/filters" Component={Filter} />
                <>
                    <>
                        <Route path="/account" Component={Account} />
                        <Route path="/verification" Component={Verify} />
                        <Route path="/phone" Component={PhoneChange} />
                        <Route path="/privacy" Component={Privacy} />
                    </>
                </>
                <Route path="/*" Component={NotFound} />
            </Routes>
        </div>
    )
}

export default Index