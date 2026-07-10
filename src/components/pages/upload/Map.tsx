import { APIProvider, ColorScheme, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { PostI } from '../tabs/Post';
import { Link } from 'react-router';
import { TextCropper } from '../../../utils/text';

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

                {properties && properties.length > 0 &&
                    (properties as PostI[]).map((p, index) => {
                        // Safe extraction respecting your exact types
                        const lat = p?.location?.cordinates?.lat;
                        const lon = p?.location?.cordinates?.lon;

                        // Skip rendering this marker entirely if coordinates are missing/malformed
                        if (typeof lat !== 'number' || typeof lon !== 'number') {
                            return null;
                        }

                        return (
                            <AdvancedMarker
                                key={p?.ID || index}
                                // Map your 'lon' safely to Google's 'lng' property
                                position={{ lat, lng: lon }}
                            >
                                <Link
                                    to={`/post/${p?.ID}`}
                                    style={{
                                        background: "var(--color-paper)",
                                        color: 'var(--color-text)',
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                        transform: 'translate(-50%, -100%)',
                                        whiteSpace: 'nowrap',
                                        display: 'inline-block'
                                    }}>

                                    {TextCropper(p?.location?.name, 18)}
                                    <hr className='my-2 border border-text/10' />
                                    {formatPrice(p?.price?.amount)}
                                </Link>
                            </AdvancedMarker>
                        );
                    })
                }
            </Map>
        </APIProvider>
    );
};

export default MapComponent;