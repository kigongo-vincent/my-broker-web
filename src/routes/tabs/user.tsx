import { Route, Routes } from "react-router"
import Home from "../../pages/tabs/user/Home"
import Favourites from "../../pages/tabs/user/Favourites"
import Settings from "../../pages/tabs/user/Settings"
import Upload from "../../pages/tabs/user/Upload"


const user = () => {
    return (
        <Routes>
            <Route path="/" Component={Home} />
            <Route path="/favourites" Component={Favourites} />
            <Route path="/upload" Component={Upload} />
            <Route path="/settings" Component={Settings} />
            <Route path="/upload" Component={Upload} />
        </Routes>
    )
}

export default user