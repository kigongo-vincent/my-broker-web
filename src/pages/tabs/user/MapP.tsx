import Header from "../../../components/pages/tabs/Header"
import Map from "../../../components/pages/tabs/home/Map"
import { useGeoData } from "../../../hooks/posts"



const MapP = () => {
    const { data } = useGeoData()
    const properties = data?.data
    console.log(properties)
    return (
        <div className="h-screen w-screen ">
            <Header noblur back title="properties map" caption="browser properties by places" />
            <Map properties={properties || []} />
        </div>
    )
}

export default MapP