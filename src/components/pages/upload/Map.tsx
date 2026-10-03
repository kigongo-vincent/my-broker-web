// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PostI } from '../tabs/Post';
import { TextCropper } from '../../../utils/text';

// Google Maps
import { APIProvider, ColorScheme, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

// Leaflet
import { MapContainer, TileLayer, Marker, Polyline, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ────────────────────────────────────────────────────────────────────────
 * TYPES
 * ──────────────────────────────────────────────────────────────────────── */

export type MapProvider = 'google' | 'leaflet';
export type MapTheme = 'light' | 'dark' | 'follow-system';

export interface LatLng {
    lat: number;
    lng: number;
}

interface RenderedRoute {
    key: string;
    path: LatLng[];
}

export interface Props {
    /** Which map engine to render with. Defaults to 'google'. */
    provider?: MapProvider;
    /** Accepts our own MapTheme, or a raw Google ColorScheme for convenience. */
    theme?: MapTheme | ColorScheme;
    properties?: Partial<PostI>[];
    defaultCenter?: LatLng;
    showDirections?: boolean;
}

interface ProviderMapProps {
    theme?: MapTheme;
    properties?: Partial<PostI>[];
    defaultCenter: LatLng;
    showDirections: boolean;
}

/* ────────────────────────────────────────────────────────────────────────
 * SHARED HELPERS
 * (identical logic used by both providers, kept in one place so behavior
 * can't drift between them)
 * ──────────────────────────────────────────────────────────────────────── */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// Generate one in Google Cloud Console; Advanced Markers require a Map ID.
const GOOGLE_MAP_ID = 'YOUR_GOOGLE_MAP_ID';

// OSRM's free public routing server. No key needed, but no uptime/rate
// guarantees — swap for a self-hosted instance or paid provider (Mapbox
// Directions, etc.) before relying on this in production.
const OSRM_BASE_URL = 'https://router.project-osrm.org';

const formatPrice = (price?: number): string => {
    if (!price || price <= 0) return '';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'UGX',
        maximumFractionDigits: 0
    }).format(price);
};

const postPath = (property: Partial<PostI>): string | undefined =>
    property.source === 'tiktok'
        ? `/post/tiktok/${encodeURIComponent(String(property.ID ?? ''))}`
        : `/post/${encodeURIComponent(String(property.ID ?? ''))}`;

const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character] ?? character);

/** Extracts a valid {lat,lng} from a property, or null if coordinates are missing/malformed. */
const extractCoords = (p: Partial<PostI>): LatLng | null => {
    const lat = p?.location?.cordinates?.lat;
    const lon = p?.location?.cordinates?.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    return { lat, lng: lon };
};

/** Filters+maps a property list down to valid destination coordinates. */
const extractDestinations = (properties?: Partial<PostI>[]): LatLng[] => {
    if (!properties || properties.length === 0) return [];
    return properties.map(extractCoords).filter((d): d is LatLng => d !== null);
};

/**
 * Requests the browser's current position only when `enabled` is true (i.e.
 * directions are actually wanted). Shared by both providers so "where is the
 * user" behaves identically regardless of map engine.
 */
const useCurrentLocation = (enabled: boolean) => {
    const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) return;

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
    }, [enabled]);

    return { currentLocation, locationError };
};

/** The clickable price/name chip rendered on top of every Google property marker. */
const PropertyLabel = ({ property }: { property: Partial<PostI> }) => {
    const href = postPath(property);
    const label = (
        <>
            {TextCropper(property?.location?.name || '', 20)}
            {property?.price?.amount > 0 && (
                <>
                    <hr className="my-2 border border-text/10" />
                    {formatPrice(property.price.amount)}
                </>
            )}
        </>
    );
    const style = {
            background: 'var(--color-paper)',
            color: 'var(--color-text)',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transform: 'translate(-50%, -100%)',
            whiteSpace: 'nowrap',
            display: 'inline-block'
        };
    return href ? (
        <Link to={href} style={style}>{label}</Link>
    ) : (
        <span style={style}>{label}</span>
    );
};

/** Same chip pre-rendered to an HTML string, for Leaflet's non-React DivIcon. */
const propertyLabelHtml = (property: Partial<PostI>): string => {
    const name = escapeHtml(TextCropper(property?.location?.name || '', 20));
    const price = property?.price?.amount > 0 ? escapeHtml(formatPrice(property.price.amount)) : '';
    const href = postPath(property);
    if (!href) {
        return `<span class="map-property-label">${name}${price ? `<hr class="my-2 border border-text/10" />${price}` : ''}</span>`;
    }
    return `
        <a href="${escapeHtml(href)}" class="map-property-label">
            ${name}
            ${price ? `<hr class="my-2 border border-text/10" />${price}` : ''}
        </a>
    `;
};

/**
 * Styles for the Leaflet HTML label. Leaflet markers render raw DOM, not
 * React, so the Google version's inline `transform` above can't be reused
 * directly — this CSS reproduces the same visual anchor (centered above the
 * marker point) and strips Leaflet's default icon box constraints.
 */
const LEAFLET_PROPERTY_LABEL_CSS = `
.map-property-marker {
    background: transparent !important;
    border: none !important;
}
.leaflet-container a.map-property-label,
.leaflet-container a.map-property-label:hover,
.leaflet-container .map-property-label {
    background: var(--color-paper) !important;
    color: var(--color-text) !important;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    white-space: nowrap;
    display: inline-block;
    text-decoration: none !important;
    position: absolute;
    transform: translate(-50%, -100%);
}
`;

/* ────────────────────────────────────────────────────────────────────────
 * GOOGLE MAPS IMPLEMENTATION
 * ──────────────────────────────────────────────────────────────────────── */

interface RoutesApiResponse {
    routes?: {
        polyline?: { encodedPolyline?: string };
        distanceMeters?: number;
        duration?: string;
    }[];
}

/**
 * Renders one Polyline per destination from origin -> destination using
 * Google's Routes API (computeRoutes).
 *
 * NOTE: this calls routes.googleapis.com directly from the browser with a
 * client-exposed key. That's fine for a referrer-restricted Maps JS key but
 * the Routes REST endpoint is intended to be called server-side — consider
 * proxying this through your backend so the key never ships to the client.
 */
const GoogleRoutesLayer = ({ origin, destinations }: { origin: LatLng; destinations: LatLng[] }) => {
    const map = useMap();
    const geometryLibrary = useMapsLibrary('geometry');
    const mapsCoreLibrary = useMapsLibrary('maps');
    const [routes, setRoutes] = useState<RenderedRoute[]>([]);
    const polylinesRef = useRef<any[]>([]);

    useEffect(() => {
        if (!geometryLibrary || !map) return;
        if (!destinations || destinations.length === 0) return;

        let cancelled = false;

        const fetchRoutes = async () => {
            // Parallelized with Promise.allSettled instead of a sequential
            // for-loop — each destination's request no longer waits on the
            // previous one.
            const settled = await Promise.allSettled(
                destinations.map(async (destination, i): Promise<RenderedRoute | null> => {
                    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Goog-Api-Key': GOOGLE_API_KEY,
                            'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration'
                        },
                        body: JSON.stringify({
                            origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
                            destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
                            travelMode: 'DRIVE'
                        })
                    });

                    if (!response.ok) {
                        console.error('Routes API error:', response.status, await response.text());
                        return null;
                    }

                    const data: RoutesApiResponse = await response.json();
                    const encoded = data.routes?.[0]?.polyline?.encodedPolyline;
                    if (!encoded) return null;

                    const decodedPath = geometryLibrary.encoding.decodePath(encoded);
                    const path: LatLng[] = decodedPath.map((p: any) => ({ lat: p.lat(), lng: p.lng() }));

                    return { key: `${destination.lat}-${destination.lng}-${i}`, path };
                })
            );

            if (cancelled) return;

            const results = settled
                .filter((r): r is PromiseFulfilledResult<RenderedRoute | null> => r.status === 'fulfilled')
                .map((r) => r.value)
                .filter((r): r is RenderedRoute => r !== null);

            setRoutes(results);
        };

        fetchRoutes();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geometryLibrary, map, JSON.stringify(origin), JSON.stringify(destinations)]);

    useEffect(() => {
        if (!map || !mapsCoreLibrary) return;

        polylinesRef.current.forEach((pl) => pl.setMap(null));
        polylinesRef.current = [];

        routes.forEach((route) => {
            const pl = new mapsCoreLibrary.Polyline({
                map,
                path: route.path,
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 4
            });
            polylinesRef.current.push(pl);
        });

        return () => {
            polylinesRef.current.forEach((pl) => pl.setMap(null));
            polylinesRef.current = [];
        };
    }, [map, mapsCoreLibrary, routes]);

    return null;
};

/**
 * Fits the map viewport to contain every point passed in. Replaces a
 * hardcoded defaultZoom, since the right zoom depends entirely on how
 * spread out the points are.
 */
const GoogleFitBoundsLayer = ({ points }: { points: LatLng[] }) => {
    const map = useMap();
    const coreLibrary = useMapsLibrary('core');

    useEffect(() => {
        if (!map || !coreLibrary) return;
        if (!points || points.length === 0) return;

        if (points.length === 1) {
            map.setCenter(points[0]);
            map.setZoom(15);
            return;
        }

        const bounds = new coreLibrary.LatLngBounds();
        points.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, 60);
    }, [map, coreLibrary, JSON.stringify(points)]);

    return null;
};

const themeToColorScheme = (theme?: MapTheme): ColorScheme | undefined => {
    if (theme === 'dark') return 'DARK' as ColorScheme;
    if (theme === 'light') return 'LIGHT' as ColorScheme;
    return undefined; // 'follow-system' / unset -> let Google decide
};

/**
 * Accepts either our own MapTheme ('dark' | 'light' | 'follow-system') or a
 * raw Google ColorScheme ('DARK' | 'LIGHT' | 'FOLLOW_SYSTEM'), so callers
 * that still have a ColorScheme value lying around (e.g. from existing code
 * that talked to @vis.gl/react-google-maps directly) don't hit a type error
 * passing it into `theme`. Everything internally still runs on MapTheme.
 */
const normalizeTheme = (theme?: MapTheme | ColorScheme): MapTheme | undefined => {
    if (!theme) return undefined;
    switch (theme) {
        case 'DARK':
        case 'dark':
            return 'dark';
        case 'LIGHT':
        case 'light':
            return 'light';
        case 'FOLLOW_SYSTEM':
        case 'follow-system':
            return 'follow-system';
        default:
            return undefined;
    }
};

const GoogleMapView = ({ theme, properties, defaultCenter, showDirections }: ProviderMapProps) => {
    const hasProperties = !!properties && properties.length !== 0;
    const { currentLocation, locationError } = useCurrentLocation(showDirections && hasProperties);

    const effectiveCenter = showDirections && currentLocation ? currentLocation : defaultCenter;
    const destinations = extractDestinations(properties);
    const shouldShowDirections = showDirections && hasProperties && destinations.length > 0 && !!currentLocation;

    const boundsPoints = hasProperties ? [effectiveCenter, ...destinations] : [effectiveCenter];

    return (
        <APIProvider solutionChannel="GMP_devsite_samples_v3_rgmbasicmap" apiKey={GOOGLE_API_KEY}>
            <Map
                mapId={GOOGLE_MAP_ID}
                colorScheme={themeToColorScheme(theme)}
                defaultZoom={14}
                defaultCenter={effectiveCenter}
                gestureHandling="greedy"
                disableDefaultUI={true}
            >
                <AdvancedMarker position={effectiveCenter} />

                <GoogleFitBoundsLayer points={boundsPoints} />

                {shouldShowDirections && <GoogleRoutesLayer origin={effectiveCenter} destinations={destinations} />}

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

                {hasProperties &&
                    (properties as PostI[]).map((p: Partial<PostI>, index: number) => {
                        const coords = extractCoords(p);
                        if (!coords) return null;

                        return (
                            <AdvancedMarker key={p?.ID || index} position={coords}>
                                <PropertyLabel property={p} />
                            </AdvancedMarker>
                        );
                    })}
            </Map>
        </APIProvider>
    );
};

/* ────────────────────────────────────────────────────────────────────────
 * LEAFLET IMPLEMENTATION
 * ──────────────────────────────────────────────────────────────────────── */

// Leaflet's default marker icon paths break under most bundlers because they
// resolve relative to the CSS file, not the JS. This is the standard fix.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// A single free, no-API-key tile source (OpenStreetMap standard tiles) used
// for both themes. CARTO's basemaps — previously used here for a dedicated
// dark style — now require a free API key for all raster tiles as of 2026,
// which defeats the point of a no-signup Leaflet fallback. Dark mode is
// instead achieved with a CSS filter applied to the same OSM tiles, a
// common zero-dependency trick (invert + hue-rotate approximates a
// "dark matter" look without needing a second keyed tile service).
const LEAFLET_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const LEAFLET_TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Applied via a wrapping <div> around MapContainer when the resolved theme
// is dark. Filter-based dark mode is imperfect (colors shift, POI icons can
// look odd) but needs zero extra services or keys.
const LEAFLET_DARK_FILTER_CSS = `
.map-leaflet-dark .leaflet-tile-pane {
    filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
}
`;

const resolveTileTheme = (theme?: MapTheme): 'light' | 'dark' => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
    // 'follow-system' / unset: read the same signal Google's ColorScheme
    // would follow, so both providers react to system theme identically.
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

/**
 * Decodes a Google/OSRM-style encoded polyline string into [lat, lng] pairs.
 * This is the standard "Encoded Polyline Algorithm Format" — same one
 * Google's Routes API and OSRM both use — implemented inline so no extra
 * npm package (paid-mapping-adjacent or otherwise) is needed just to decode
 * a string of numbers. Public-domain algorithm, ~20 lines.
 */
const decodePolyline = (encoded: string, precision = 5): [number, number][] => {
    const factor = Math.pow(10, precision);
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;

        shift = 0;
        result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;

        points.push([lat / factor, lng / factor]);
    }

    return points;
};

interface OsrmResponse {
    routes?: {
        geometry?: string; // encoded polyline, precision 5 (OSRM default)
        distance?: number;
        duration?: number;
    }[];
    code?: string;
}

/**
 * Renders one Polyline per destination from origin -> destination using
 * OSRM's public routing API. This is the Leaflet-world equivalent of
 * GoogleRoutesLayer above.
 */
const LeafletRoutesLayer = ({ origin, destinations }: { origin: LatLng; destinations: LatLng[] }) => {
    const [routes, setRoutes] = useState<RenderedRoute[]>([]);

    useEffect(() => {
        if (!destinations || destinations.length === 0) return;

        let cancelled = false;

        const fetchRoutes = async () => {
            const settled = await Promise.allSettled(
                destinations.map(async (destination, i): Promise<RenderedRoute | null> => {
                    // OSRM expects "lng,lat;lng,lat" coordinate order.
                    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
                    const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=polyline`;

                    const response = await fetch(url);
                    if (!response.ok) {
                        console.error('OSRM error:', response.status, await response.text());
                        return null;
                    }

                    const data: OsrmResponse = await response.json();
                    const encoded = data.routes?.[0]?.geometry;
                    if (!encoded) return null;

                    const decoded: [number, number][] = decodePolyline(encoded);
                    const path: LatLng[] = decoded.map(([lat, lng]) => ({ lat, lng }));

                    return { key: `${destination.lat}-${destination.lng}-${i}`, path };
                })
            );

            if (cancelled) return;

            const results = settled
                .filter((r): r is PromiseFulfilledResult<RenderedRoute | null> => r.status === 'fulfilled')
                .map((r) => r.value)
                .filter((r): r is RenderedRoute => r !== null);

            setRoutes(results);
        };

        fetchRoutes();

        return () => {
            cancelled = true;
        };
    }, [JSON.stringify(origin), JSON.stringify(destinations)]);

    return (
        <>
            {routes.map((route) => (
                <Polyline
                    key={route.key}
                    positions={route.path.map((p) => [p.lat, p.lng])}
                    pathOptions={{ color: '#4285F4', opacity: 0.8, weight: 4 }}
                />
            ))}
        </>
    );
};

/**
 * Fits the map viewport to contain every point passed in. Mirrors
 * GoogleFitBoundsLayer so both providers behave identically.
 */
const LeafletFitBoundsLayer = ({ points }: { points: LatLng[] }) => {
    const map = useLeafletMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        if (points.length === 1) {
            map.setView([points[0].lat, points[0].lng], 15);
            return;
        }

        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [60, 60] });
    }, [map, JSON.stringify(points)]);

    return null;
};

/**
 * Leaflet markers render plain DOM, not React trees, so the shared price/name
 * chip is rendered to an HTML string (propertyLabelHtml) and mounted via a
 * DivIcon instead of the <PropertyLabel/> component Google uses directly.
 */
const LeafletPropertyMarker = ({ coords, property }: { coords: LatLng; property: Partial<PostI> }) => {
    const icon = L.divIcon({
        className: 'map-property-marker', // clears Leaflet's default icon box styling
        html: propertyLabelHtml(property),
        iconAnchor: [0, 0] // label positions itself via CSS transform, see LEAFLET_PROPERTY_LABEL_CSS
    });

    return <Marker position={[coords.lat, coords.lng]} icon={icon} />;
};

const LeafletMapView = ({ theme, properties, defaultCenter, showDirections }: ProviderMapProps) => {
    const hasProperties = !!properties && properties.length !== 0;
    const { currentLocation, locationError } = useCurrentLocation(showDirections && hasProperties);

    const effectiveCenter = showDirections && currentLocation ? currentLocation : defaultCenter;
    const destinations = extractDestinations(properties);
    const shouldShowDirections = showDirections && hasProperties && destinations.length > 0 && !!currentLocation;

    const boundsPoints = hasProperties ? [effectiveCenter, ...destinations] : [effectiveCenter];

    const isDark = resolveTileTheme(theme) === 'dark';

    return (
        <div className={isDark ? 'map-leaflet-dark' : undefined} style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
            {/* Injects the shared label styling + optional dark-mode tile filter once; Leaflet markers render raw HTML, not React, so this can't be inline JSX like Google's PropertyLabel. */}
            <style>{LEAFLET_PROPERTY_LABEL_CSS}{isDark ? LEAFLET_DARK_FILTER_CSS : ''}</style>

            <MapContainer
                center={[effectiveCenter.lat, effectiveCenter.lng]}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
            >
                <TileLayer url={LEAFLET_TILE_URL} attribution={LEAFLET_TILE_ATTRIBUTION} />

                <Marker position={[effectiveCenter.lat, effectiveCenter.lng]} />

                <LeafletFitBoundsLayer points={boundsPoints} />

                {shouldShowDirections && <LeafletRoutesLayer origin={effectiveCenter} destinations={destinations} />}

                {hasProperties &&
                    (properties as PostI[]).map((p: Partial<PostI>, index: number) => {
                        const coords = extractCoords(p);
                        if (!coords) return null;
                        return <LeafletPropertyMarker key={p?.ID || index} coords={coords} property={p} />;
                    })}
            </MapContainer>

            {locationError && showDirections && (
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 1000, // above Leaflet's own panes
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
        </div>
    );
};

/* ────────────────────────────────────────────────────────────────────────
 * PUBLIC ENTRY POINT
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Provider-agnostic map component. Renders Google Maps or Leaflet/OSM based
 * on the `provider` prop — both implementations expose identical features:
 * a current-location marker, property price markers, driving-direction
 * polylines to every property, viewport auto-fitting, and light/dark theming.
 *
 * Swapping providers only changes the rendering engine; props and behavior
 * stay the same, so callers don't need to branch on provider.
 */
const MapComponent = ({
    provider = 'google',
    theme,
    properties,
    defaultCenter = { lat: 0.3476, lng: 32.5825 },
    showDirections = false
}: Props) => {
    const providerProps: ProviderMapProps = { theme: normalizeTheme(theme), properties, defaultCenter, showDirections };

    if (provider === 'leaflet') {
        return <LeafletMapView {...providerProps} />;
    }

    return <GoogleMapView {...providerProps} />;
};

export default MapComponent;