import { useState } from "react"
import FlexRender from "../../../components/base/FlexRender"
import Post, { PostI } from "../../../components/pages/tabs/Post"
import { useUserStore } from "../../../store/auth"


const Favourites = () => {

    const [posts] = useState<Partial<PostI>[]>([

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

    return (
        <div>
            <FlexRender className="gap-10" items={posts?.map(p => ({ ...p, author: user }))} render={(item, index) => <Post {...(item as PostI)} key={index} />} />

        </div>
    )
}

export default Favourites