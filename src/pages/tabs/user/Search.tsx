import { useState } from "react"
import FlexRender from "../../../components/base/FlexRender"
import { useNavigate, useParams } from "react-router"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import user from "../../../routes/tabs/user"


const Search = () => {

    const tabs = ["users", "rentals",]
    const { query } = useParams()
    const [seletcedTab, setSlelectedTab] = useState(tabs[1])
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

    const navigate = useNavigate()
    return (
        <div>

            <div className="p-4 bg-primary text-white">
                <div className="flex items-center mb-2 gap-2">
                    <button onClick={() => navigate(-1)} className="font-semibold px-5 py-2 bg-white/10 rounded-full">back</button>
                    <p className="text-2xl">4 matches found</p>
                </div>
                <p>Search results for <b>"{query}"</b></p>
            </div>
            <div className="p-4  w-full h-full">
                <FlexRender row className="flex-row my-4 gap-2" items={tabs} render={(item, index) => <div
                    onClick={() => setSlelectedTab(item)}
                    className={` px-5 py-3  cursor-pointer flex-1 text-center ${seletcedTab == item && "border-b-2 border-primary text-primary"}`} key={index}>{item}
                </div>} />
                <br />
                <FlexRender className="gap-10" items={posts?.map(p => ({ ...p, author: user }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />
            </div>

        </div>
    )
}

export default Search