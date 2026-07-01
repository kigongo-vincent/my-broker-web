import { HTMLAttributes, useState } from "react"
import FlexRender from "../../../components/base/FlexRender"
import Search from "../../../components/pages/tabs/home/Search"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import { useUserStore } from "../../../store/auth"
import Lineicons from "@lineiconshq/react-lineicons"
import { MapMarker1Solid } from "@lineiconshq/free-icons"
import { motion } from "framer-motion"
import Modal from "../../../components/base/Modal"
import Map from "../../../components/pages/tabs/home/Map"

interface FABProps extends HTMLAttributes<HTMLButtonElement> {

}

const FAB = ({ ...attr }: FABProps) => {
    return (
        <motion.button
            drag
            onClick={attr?.onClick}
            transition={{ ease: "linear" }}
            className="fixed z-40 bottom-40 right-10 bg-primary h-18 w-18 flex items-center justify-center text-white rounded-full">
            <Lineicons icon={MapMarker1Solid} />
        </motion.button>
    )
}

const Home = () => {

    const tabs = ["rentals", "short stays"]
    const [seletcedTab, setSlelectedTab] = useState(tabs[0])
    const [showMap, setShowMap] = useState(false)

    const [posts] = useState<Partial<PostI>[]>([
        {
            ID: 1,
            location: {
                name: "Namungoona, Kampala, Uganda",
                cordinates: {
                    lat: 0, lon: 0
                }
            },
            CreatedAt: "2026-06-10T08:00:00Z",
            UpdatedAt: "2026-06-10T08:00:00Z",

            type: "rental",

            assets: [
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=80",
                },
                {
                    type: "video",
                    url: "/videos/villa-tour.mp4",
                },
            ],

            price: { amount: 4500000, currency: "UGX" },

            bathrooms: 3,
            bedrooms: 4,
            toilets: 4,

            ammenities: [
                "WiFi",
                "Parking",
                "24/7 Security",
                "Garden",
                "Balcony",
                "CCTV",
            ],

            negotiable: true,

            extras: [
                "Solar Power",
                "Electric Fence",
                "Air Conditioning",
            ],

            months: 12,
            units: 1,
            approved: true,
            liked: true,
            available: true,
        },

        {
            ID: 2,
            location: {
                name: "Namungoona, Kampala, Uganda",
                cordinates: {
                    lat: 0, lon: 0
                }
            },
            CreatedAt: "2026-06-12T09:15:00Z",
            UpdatedAt: "2026-06-12T09:15:00Z",

            type: "rental",

            assets: [
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80",
                },
                {
                    type: "video",
                    url: "/videos/apartment-tour.mp4",
                },
            ],

            price: { amount: 2200000, currency: "UGX" },

            bathrooms: 2,
            bedrooms: 3,
            toilets: 2,

            ammenities: [
                "Parking",
                "Security",
                "WiFi",
                "Paved Compound",
                "Water",
            ],

            negotiable: false,

            extras: [
                "Caretaker",
                "Laundry Area",
                "DSTV Ready",
            ],

            months: 6,
            units: 8,
            approved: true,
            liked: false,
            available: true,
        },

        {
            ID: 3,
            location: {
                name: "Namungoona, Kampala, Uganda",
                cordinates: {
                    lat: 0, lon: 0
                }
            },
            CreatedAt: "2026-06-14T10:30:00Z",
            UpdatedAt: "2026-06-14T10:30:00Z",

            type: "short-stay",

            assets: [
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
                },
                {
                    type: "video",
                    url: "/videos/shortstay-tour.mp4",
                },
            ],

            price: { amount: 150, currency: "USD" },

            bathrooms: 2,
            bedrooms: 2,
            toilets: 2,

            ammenities: [
                "Netflix",
                "Smart TV",
                "WiFi",
                "Swimming Pool",
                "Gym",
                "Housekeeping",
            ],

            negotiable: false,

            extras: [
                "Airport Pickup",
                "Daily Cleaning",
                "Breakfast",
            ],

            months: 1,
            units: 3,
            approved: true,
            liked: true,
            available: true,
        },

        {
            ID: 4,
            location: {
                name: "Namungoona, Kampala, Uganda",
                cordinates: {
                    lat: 0, lon: 0
                }
            },
            CreatedAt: "2026-06-15T15:45:00Z",
            UpdatedAt: "2026-06-15T15:45:00Z",

            type: "rental",

            assets: [
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&q=80",
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80",
                },
                {
                    type: "video",
                    url: "/videos/luxury-villa-tour.mp4",
                },
            ],

            price: { amount: 1800, currency: "USD" },

            bathrooms: 4,
            bedrooms: 5,
            toilets: 5,

            ammenities: [
                "Swimming Pool",
                "Gym",
                "Parking",
                "WiFi",
                "CCTV",
                "Garden",
                "Children's Play Area",
            ],

            negotiable: true,

            extras: [
                "Home Office",
                "Solar System",
                "Backup Generator",
                "Walk-in Closet",
            ],

            months: 12,
            units: 1,
            approved: true,
            liked: false,
            available: false,
        },
    ])

    const { user } = useUserStore()


    const [properties, setProperties] = useState<Partial<PostI>[]>([
        {
            ID: 1,
            price: { amount: 5500000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3284, lon: 32.5912 },
                name: "Kololo Apartments"
            }
        },
        {
            ID: 2,
            price: { amount: 7200000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3245, lon: 32.5786 },
                name: "Nakasero Office Tower"
            }
        },
        {
            ID: 3,
            price: { amount: 2500000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3178, lon: 32.6104 },
                name: "Bugolobi Village Studio"
            }
        },
        {
            ID: 4,
            price: { amount: 12000000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.2989, lon: 32.6045 },
                name: "Muyenga Hillside Heights"
            }
        },
        {
            ID: 5,
            price: { amount: 1800000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3542, lon: 32.6120 },
                name: "Ntinda Ministers Village"
            }
        },
        {
            ID: 6,
            price: { amount: 6000000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3421, lon: 32.6023 },
                name: "Naguru Peak View Residences"
            }
        },
        {
            ID: 7,
            price: { amount: 3200000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3340, lon: 32.5680 },
                name: "Makerere Main Gate Court"
            }
        },
        {
            ID: 8,
            price: { amount: 4500000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3505, lon: 32.5955 },
                name: "Bukoto Plaza Complex"
            }
        },
        {
            ID: 9,
            price: { amount: 1500000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3372, lon: 32.5854 },
                name: "Kamwokya Kanjokya Street Suites"
            }
        },
        {
            ID: 10,
            price: { amount: 2200000, currency: "UGX" },
            location: {
                cordinates: { lat: 0.3620, lon: 32.5790 },
                name: "Kyebando Central Bungalow"
            }
        }
    ]);

    return (
        <div>
            <Search filter />
            <FlexRender row className="flex-row my-4 gap-2" items={tabs} render={(item, index) => <div
                onClick={() => setSlelectedTab(item)}
                className={` px-5 py-3  cursor-pointer flex-1 text-center ${seletcedTab == item && "border-b-2 border-primary text-primary"}`} key={index}>{item}
            </div>} />
            <FlexRender className="gap-10" items={posts?.map(p => ({ ...p, author: user }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />

            <FAB onClick={() => setShowMap(true)} />

            <Modal position="right" open={showMap} onClose={() => setShowMap(false)}>
                <Map properties={properties} />
            </Modal>
        </div>
    )
}

export default Home