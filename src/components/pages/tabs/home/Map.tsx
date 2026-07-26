import { ColorScheme } from "@vis.gl/react-google-maps"
import useSystemTheme from "../../../../hooks/theme"
import MapComponent from "../../upload/Map"
import { PostI } from "../Post"
export interface Props {
    properties: Partial<PostI>[]
    showDirections?: boolean

}

const Map = ({ properties, showDirections }: Props) => {

    const { theme } = useSystemTheme()


    return (
        <div className="h-[100vh] w-100vh rounded-2xl overflow-hidden">
            <MapComponent showDirections={showDirections} theme={theme?.toUpperCase() as ColorScheme} properties={properties} />
        </div>
    )
}

export default Map