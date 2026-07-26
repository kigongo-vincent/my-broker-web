// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { APIProvider, ColorScheme, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { PostI } from '../tabs/Post';
import { Link } from 'react-router';
import { TextCropper } from '../../../utils/text';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// Note: Advanced Markers require a Map ID. You can generate one in your Google Cloud Console.
const MAP_ID = 'YOUR_GOOGLE_MAP_ID';

export interface defaultCenterI {
    lat: number
    lng: number
}

export interface Props {
    theme?: ColorScheme;
    properties?: Partial<PostI>[];
    defaultCenter?: defaultCenterI
    showDirections?: boolean
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

// ---- Type helpers pulled from loaded library instances ----
// Never reference the ambient `google` namespace directly; derive everything
// from the objects returned by useMapsLibrary, same as your `routes` types.
type GeometryLibrary = NonNullable<ReturnType<typeof useMapsLibrary>>;
type LatLngT = InstanceType<GeometryLibrary['encoding']> extends never
    ? never
    : ReturnType<GeometryLibrary['encoding']['decodePath']>[number];

// Polyline comes from the 'maps' library instance
type MapsLibraryT = NonNullable<ReturnType<typeof useMapsLibrary>>;
type PolylineT = InstanceType<MapsLibraryT['Polyline']>;
type PolylineOptionsT = ConstructorParameters<MapsLibraryT['Polyline']>[0];

// LatLngBounds lives in the 'core' library instance, not 'maps'
type CoreLibraryT = NonNullable<ReturnType<typeof useMapsLibrary>>;
type LatLngBoundsT = InstanceType<CoreLibraryT['LatLngBounds']>;

// ---- Routes API (new) response shape ----
// Minimal shape of what we need from the computeRoutes response.
interface RoutesApiResponse {
    routes?: {
        polyline?: { encodedPolyline?: string };
        distanceMeters?: number;
        duration?: string;
    }[];
}

// One decoded route per destination
interface RenderedRoute {
    key: string;
    path: defaultCenterI[];
}

// Renders one Polyline per destination from origin -> destination using the Routes API
const RoutesLayer = ({
    origin,
    destinations
}: {
    origin: defaultCenterI;
    destinations: defaultCenterI[];
}) => {
    const map = useMap();
    const geometryLibrary = useMapsLibrary('geometry');
    const mapsCoreLibrary = useMapsLibrary('maps');
    const [routes, setRoutes] = useState<RenderedRoute[]>([]);
    const polylinesRef = useRef<PolylineT[]>([]);

    useEffect(() => {
        if (!geometryLibrary || !map) return;
        if (!destinations || destinations.length === 0) return;

        let cancelled = false;

        const fetchRoutes = async () => {
            const results: RenderedRoute[] = [];

            for (let i = 0; i < destinations.length; i++) {
                const destination = destinations[i];

                try {
                    const response = await fetch(
                        'https://routes.googleapis.com/directions/v2:computeRoutes',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Goog-Api-Key': API_KEY,
                                // Only request the fields we actually use, to keep cost/quota low
                                'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration'
                            },
                            body: JSON.stringify({
                                origin: {
                                    location: {
                                        latLng: { latitude: origin.lat, longitude: origin.lng }
                                    }
                                },
                                destination: {
                                    location: {
                                        latLng: { latitude: destination.lat, longitude: destination.lng }
                                    }
                                },
                                travelMode: 'DRIVE'
                            })
                        }
                    );

                    if (!response.ok) {
                        console.error('Routes API error:', response.status, await response.text());
                        continue;
                    }

                    const data: RoutesApiResponse = await response.json();
                    const encoded = data.routes?.[0]?.polyline?.encodedPolyline;
                    if (!encoded) continue;

                    // Decode the polyline using the Maps JS geometry library
                    const decodedPath: LatLngT[] = geometryLibrary.encoding.decodePath(encoded);
                    const path: defaultCenterI[] = decodedPath.map((p) => ({ lat: p.lat(), lng: p.lng() }));

                    results.push({ key: `${destination.lat}-${destination.lng}-${i}`, path });
                } catch (err) {
                    console.error('Failed to fetch route:', err);
                }
            }

            if (!cancelled) setRoutes(results);
        };

        fetchRoutes();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geometryLibrary, map, JSON.stringify(origin), JSON.stringify(destinations)]);

    // Draw/update polylines on the map whenever `routes` changes
    useEffect(() => {
        if (!map || !mapsCoreLibrary) return;

        // Clear previous polylines
        polylinesRef.current.forEach((pl) => pl.setMap(null));
        polylinesRef.current = [];

        routes.forEach((route) => {
            const options: PolylineOptionsT = {
                map,
                path: route.path,
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 4
            };
            const polyline: PolylineT = new mapsCoreLibrary.Polyline(options);
            polylinesRef.current.push(polyline);
        });

        return () => {
            polylinesRef.current.forEach((pl) => pl.setMap(null));
            polylinesRef.current = [];
        };
    }, [map, mapsCoreLibrary, routes]);

    return null;
};

// Fits the map viewport to contain every point passed in (origin + destinations,
// or origin + properties when directions aren't shown). Replaces a hardcoded
// defaultZoom, since the right zoom depends entirely on how spread out the
// points are — a single property needs a tight zoom, a city-wide list doesn't.
const FitBoundsLayer = ({ points }: { points: defaultCenterI[] }) => {
    const map = useMap();
    const coreLibrary = useMapsLibrary('core');

    useEffect(() => {
        if (!map || !coreLibrary) return;
        if (!points || points.length === 0) return;

        // A single point can't form meaningful bounds — center on it with a
        // reasonable close-in zoom instead of calling fitBounds.
        if (points.length === 1) {
            map.setCenter(points[0]);
            map.setZoom(15);
            return;
        }

        const bounds: LatLngBoundsT = new coreLibrary.LatLngBounds();
        points.forEach((point) => bounds.extend(point));

        // Padding keeps markers/pins from being clipped at the viewport edge
        map.fitBounds(bounds, 60);
    }, [map, coreLibrary, JSON.stringify(points)]);

    return null;
};

const MapComponent = ({ theme, properties, defaultCenter = { lat: 0.3476, lng: 32.5825 }, showDirections = false }: Props) => {
    const [currentLocation, setCurrentLocation] = useState<defaultCenterI | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const hasProperties = !!properties && properties.length !== 0;

    // Request current-location permission only when directions are actually needed
    useEffect(() => {
        if (!showDirections || !hasProperties) return;

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position: GeolocationPosition) => {
                setCurrentLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error: GeolocationPositionError) => {
                setLocationError(error.message);
            }
        );
    }, [showDirections, hasProperties]);

    // Effective center: current location overrides the passed-in defaultCenter when directions are on
    const effectiveCenter: defaultCenterI = showDirections && currentLocation ? currentLocation : defaultCenter;

    // Build valid destination list from properties
    const destinations: defaultCenterI[] = (hasProperties ? (properties as PostI[]) : [])
        .map((p: Partial<PostI>): defaultCenterI | null => {
            const lat = p?.location?.cordinates?.lat;
            const lon = p?.location?.cordinates?.lon;
            if (typeof lat !== 'number' || typeof lon !== 'number') return null;
            return { lat, lng: lon };
        })
        .filter((d): d is defaultCenterI => d !== null);

    const shouldShowDirections = showDirections && hasProperties && destinations.length > 0 && !!currentLocation;

    // Points to fit the viewport to: origin + every destination when directions
    // are shown, otherwise just origin + all property pins.
    const boundsPoints: defaultCenterI[] = shouldShowDirections
        ? [effectiveCenter, ...destinations]
        : hasProperties
            ? [effectiveCenter, ...destinations]
            : [effectiveCenter];

    return (
        <APIProvider
            solutionChannel='GMP_devsite_samples_v3_rgmbasicmap'
            apiKey={API_KEY}>
            <Map
                mapId={MAP_ID}
                colorScheme={theme}
                defaultZoom={14} // Initial value only — FitBoundsLayer recalculates this from the actual points
                defaultCenter={effectiveCenter}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                {/* Default Center Marker (current location if directions requested & granted) */}
                <AdvancedMarker position={effectiveCenter} />

                {/* Recomputes zoom/center to contain all plotted points whenever they change */}
                <FitBoundsLayer points={boundsPoints} />

                {/* Directions from effective center to all property locations, via the new Routes API */}
                {shouldShowDirections && (
                    <RoutesLayer origin={effectiveCenter} destinations={destinations} />
                )}

                {locationError && showDirections && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            background: 'var(--color-paper)',
                            color: 'var(--color-text)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}
                    >
                        Couldn't get your location: {locationError}
                    </div>
                )}

                {/* Property Price Markers */}

                {hasProperties &&
                    (properties as PostI[]).map((p: Partial<PostI>, index: number) => {
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

                                    {TextCropper(p?.location?.name || "", 20)}
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