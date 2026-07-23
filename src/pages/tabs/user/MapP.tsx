import Header from "../../../components/pages/tabs/Header"
import MapLight from "../../../assets/map-light.webp"
import MapDark from "../../../assets/map-dark.webp"
import { useGeoData } from "../../../hooks/posts"
import useSystemTheme from "../../../hooks/theme"
import Map from "../../../components/pages/tabs/home/Map"
import { AnimatePresence, motion } from "framer-motion"
import MapIcon from "../../../assets/map.webp"
import { Activity } from "react"


const MapP = () => {
    const { data } = useGeoData()
    const { theme } = useSystemTheme()
    const properties = data?.data
    return (
        <div className="h-screen relative w-screen overflow-hidden">

            <motion.img initial={{ scale: "2%" }} animate={{ scale: 1 }} transition={{ duration: 10 }} src={theme == "light" ? MapLight : MapDark} className=" absolute h-full w-full" alt="" />
            <div className="absolute bg-black/5 backdrop-blur-lg h-full w-full flex items-center justify-center">

                <img src={MapIcon} className="h-20 animate-bounce object-contain w-20" alt="" />
            </div>

            <Header back noMargin title="properties map" caption="browser properties by places" />
            {
                <Activity mode={properties?.length != 0 ? "visible" : "hidden"}>
                    <AnimatePresence >
                        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                            <Map properties={properties || []} />
                        </motion.div>
                    </AnimatePresence>
                </Activity>
            }
        </div >
    )
}

export default MapP