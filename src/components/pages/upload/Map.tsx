import { APIProvider, ColorScheme, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { PostI } from '../tabs/Post';
import { Link } from 'react-router';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// Note: Advanced Markers require a Map ID. You can generate one in your Google Cloud Console.
const MAP_ID = 'YOUR_GOOGLE_MAP_ID';

export interface Props {
    theme?: ColorScheme;
    properties?: Partial<PostI>[];

}

// Simple helper to format currency (adjust currency/locale as needed)
const formatPrice = (price?: number) => {
    if (!price) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'UGX',
        maximumFractionDigits: 0
    }).format(price);
};

const MapComponent = ({ theme, properties }: Props) => {
    // Default center coordinates
    const defaultCenter = { lat: 0.3476, lng: 32.5825 };

    return (
        <APIProvider
            solutionChannel='GMP_devsite_samples_v3_rgmbasicmap'
            apiKey={API_KEY}>
            <Map
                mapId={MAP_ID}
                colorScheme={theme}
                defaultZoom={14} // Zoomed out slightly so you can see multiple properties
                defaultCenter={defaultCenter}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                {/* Default Center Marker */}
                <AdvancedMarker position={defaultCenter} />

                {/* Property Price Markers */}

                {
                    properties?.length != 0 &&
                    (properties as PostI[])?.map((p, index) => {
                        // Fallback to default center if coordinates are missing
                        // const lat = p?.location?.coordinates?.lat ?? defaultCenter.lat;
                        const lat = p?.location?.cordinates?.lat
                        const lng = p?.location?.cordinates?.lon

                        return (
                            <AdvancedMarker
                                key={p?.ID || index}
                                position={{ lat, lng }}
                            >
                                {/* Custom Price Tag Icon Styling */}
                                <Link
                                    to={`/post/${p?.ID}`}
                                    style={{
                                        background: '#ffffff',
                                        color: '#000000',
                                        padding: '6px 10px',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                        border: '1px solid #ddd',
                                        transform: 'translate(-50%, -100%)', // Centers the tag over the coordinate
                                        whiteSpace: 'nowrap'
                                    }}>
                                    {formatPrice(p?.price?.amount)}
                                </Link>
                            </AdvancedMarker>
                        );
                    })}
            </Map>
        </APIProvider>
    );
};

export default MapComponent;