import { useNavigate } from "react-router"


const NotFound = () => {
    const navigate = useNavigate()
    return (
        <div className="p-6 h-screen flex gap-4 flex-col text-center  items-center justify-center">
            <h2 className="text-3xl font-semibold">Seems you're lost</h2>
            <p className="text-text/50 ">You followed the wrong route, let's take you back to working sections</p>
            <button onClick={() => navigate("/tabs/user")} className="btn bg-primary w-full mt-3 text-white rounded-full">back to working sections</button>
        </div>
    )
}

export default NotFound