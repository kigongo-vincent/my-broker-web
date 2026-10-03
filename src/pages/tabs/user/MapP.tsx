import Header from "../../../components/pages/tabs/Header"
import MapLight from "../../../assets/map-light.webp"
import MapDark from "../../../assets/map-dark.webp"
import { useGeoData } from "../../../hooks/posts"
import useSystemTheme from "../../../hooks/theme"
import Map from "../../../components/pages/tabs/home/Map"
import { motion } from "framer-motion"
import MapIcon from "../../../assets/map.webp"


const MapP = () => {
    const { data, isError, error } = useGeoData()
    const { theme } = useSystemTheme()
    const properties = data
    return (
        <div className="h-screen relative w-screen overflow-hidden bg-paper">

            <motion.img initial={{ scale: "2%" }} animate={{ scale: 1 }} transition={{ duration: 10 }} src={theme == "light" ? MapLight : MapDark} className=" absolute h-full w-full" alt="" />
            <div className="absolute bg-black/5 backdrop-blur-lg h-full w-full flex items-center justify-center">

                <img src={MapIcon} className="h-20 animate-bounce object-contain w-20" alt="" />
            </div>

            <Header back noMargin title="properties map" caption="browser properties by places" />
            {
                isError &&
                <div className="absolute z-10 top-24 left-4 right-4 rounded-xl border border-text/10 bg-paper p-4 text-center text-danger shadow">
                    Failed to load map properties: {(error as Error)?.message}
                </div>
            }
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0"
            >
                <Map showDirections properties={properties || []} />
            </motion.div>
        </div >
    )
}

export default MapP