import { useNavigate } from "react-router"
import Header from "../../components/pages/tabs/Header"

interface SectionProps {
    title: string
    children: React.ReactNode
}

const Section = ({ title, children }: SectionProps) => (
    <div className="flex flex-col gap-2 py-6 border-b border-pale">
        <h2 className=" text-lg font-semibold">{title}</h2>
        <div className="text-text/50  leading-7">{children}</div>
    </div>
)

const List = ({ items }: { items: string[] }) => (
    <ul className="list-disc list-inside text-text/50 text-sm leading-7 space-y-1 mt-2">
        {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
)

const TermsPage = () => {
    const navigate = useNavigate()

    return (
        <div className="relative min-h-screen w-full ">

            <Header back title="Terms & conditions" />

            <div className="max-w-2xl mx-auto px-4 pb-24">

                {/* intro block */}
                <div className="flex flex-col items-center text-center gap-3 py-10">
                    <h1 className="text-2xl font-semibold">Terms and Conditions</h1>
                    <p className="text-text/50 text-sm leading-6 max-w-[85%]">
                        Please read how My Broker collects and uses your data, in line with
                        Uganda's Data Protection and Privacy Act, 2019.
                    </p>
                    <span className="text-xs text-text/30">Last updated: July 25th, 2026</span>
                </div>

                <Section title="1. Introduction">
                    Welcome to My Broker ("we," "us," "our," or the "Platform"), a rental
                    management service connecting property owners and brokers ("Listers")
                    with people seeking rentals ("Seekers"). By creating an account or
                    posting a listing, you agree to these Terms and to how we process your
                    personal data, as described below.
                </Section>

                <Section title="2. Data we collect">
                    <p className="mb-1 text-text/70 font-medium text-sm">Account & profile data</p>
                    <List items={["Full name", "Email address", "Phone number", "Profile photo", "Account credentials (stored encrypted)"]} />
                    <p className="mt-4 mb-1 text-text/70 font-medium text-sm">Property listing data</p>
                    <List items={["Property images", "Location / GPS coordinates", "Rental price", "Description and features"]} />
                </Section>

                <Section title="3. Why we collect it">
                    We only use your data to run your account, publish and manage your
                    listings, let interested Seekers reach out to you, prevent fraud, and
                    improve your experience on the Platform. We do not sell your personal
                    data, and we don't use it for anything beyond these purposes without
                    asking you first.
                </Section>

                <Section title="4. Sharing between users">
                    When a Seeker contacts a Lister, limited contact details (name, phone,
                    email) are shared between the two of you so you can talk directly. Your
                    listing's photos, price, and location are visible to other users of the
                    Platform, since that's how the search works. You can choose to hide your
                    phone number from public view in your privacy settings.
                </Section>

                <Section title="5. Data storage and security">
                    We use reasonable technical safeguards — encryption, access controls,
                    and secure hosting — to protect your data. We keep it only as long as
                    needed to provide the service or as required by law.
                </Section>

                <Section title="6. Your rights">
                    Under the DPA, you can at any time:
                    <List items={[
                        "Access the data we hold about you",
                        "Correct inaccurate details",
                        "Request deletion of your data",
                        "Withdraw consent for optional processing",
                        "Lodge a complaint with Uganda's Personal Data Protection Office",
                    ]} />
                </Section>

                <Section title="7. Your responsibilities">
                    Listers confirm they have the right to advertise the properties they
                    post, and that listing details are accurate. Users agree not to upload
                    false information, misuse other users' contact details, or post someone
                    else's personal data without their consent.
                </Section>

                <Section title="8. Liability">
                    The Platform facilitates connections between Seekers and Listers but is
                    not a party to any rental agreement. We don't guarantee the accuracy of
                    listings or the conduct of other users — please verify details
                    independently before entering any agreement.
                </Section>

                <Section title="9. Changes to these terms">
                    We may update these Terms from time to time. Continuing to use the
                    Platform after changes take effect means you accept the updated Terms.
                </Section>

                <Section title="10. Governing law">
                    These Terms are governed by the laws of the Republic of Uganda,
                    including the Data Protection and Privacy Act, 2019.
                </Section>



                <p className="text-text/30 text-xs text-center mt-8 leading-6">
                    This document is a general summary and does not replace independent
                    legal advice.
                </p>
            </div>

            {/* sticky bottom action */}
            <div className="fixed bottom-0 left-0 w-full bg-paper/98 backdrop-blur border-t border-pale px-4 py-4">
                <button onClick={() => navigate(-1)} className="btn bg-primary text-white w-full rounded-full">
                    Done
                </button>
            </div>
        </div>
    )
}

export default TermsPage