import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const MapComponent = () => (
    <APIProvider
        solutionChannel='GMP_devsite_samples_v3_rgmbasicmap'
        apiKey={API_KEY}>
        <Map
            colorScheme='DARK'
            defaultZoom={18}
            defaultCenter={{
                lat: 0.3476,
                lng: 32.5825,
            }}

            gestureHandling={'greedy'}
            disableDefaultUI={true}
        >
            <Marker position={{
                lat: 0.3476,
                lng: 32.5825,
            }} />
        </Map>
    </APIProvider>
);
export default MapComponent