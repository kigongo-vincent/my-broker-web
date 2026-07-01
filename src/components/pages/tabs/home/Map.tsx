import { ColorScheme } from "@vis.gl/react-google-maps"
import useSystemTheme from "../../../../hooks/theme"
import MapComponent from "../../upload/Map"
import { PostI } from "../Post"
export interface Props {
    properties: Partial<PostI>[]
}

const Map = ({ properties }: Props) => {

    const { theme } = useSystemTheme()

    return (
        <div className="h-[80vh] w-100vh rounded-2xl overflow-hidden">
            <MapComponent theme={theme as ColorScheme} properties={properties} />
        </div>
    )
}

export default Map