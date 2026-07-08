import Header from "../../../components/pages/tabs/Header"
import Map from "../../../components/pages/tabs/home/Map"



const MapP = () => {
    return (
        <div className="h-screen w-screen ">
            <Header noblur back title="properties map" />
            <Map properties={[]} />
        </div>
    )
}

export default MapP