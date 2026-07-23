import { Route, Routes } from "react-router"
import Home from "../../pages/tabs/user/Home"
import Favourites from "../../pages/tabs/user/Favourites"
import Settings from "../../pages/tabs/user/Settings"
import Upload from "../../pages/tabs/user/Upload"
import Chat from "../../pages/tabs/user/Chat"
import AuthProtector from "../../components/base/AuthProtector"


const user = () => {
    return (
        <Routes>
            <Route path="/" Component={Home} />
            <Route path="/favourites" element={<AuthProtector><Favourites /></AuthProtector>} />
            <Route path="/upload" element={<AuthProtector><Upload /></AuthProtector>} />
            <Route path="/chat" element={<AuthProtector><Chat /></AuthProtector>} />
            <Route path="/settings" element={<AuthProtector><Settings /></AuthProtector>} />
        </Routes>
    )
}

export default user