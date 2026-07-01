import FlexRender from "../../base/FlexRender"
import Tab, { LinkI } from "./Tab"

export interface Props {
    links: LinkI[]
}

const Tabs = ({ links }: Props) => {
    return (
        <div className="bg-pale  h-[11vh] max-h-[11vh] fixed bottom-0 w-full flex items-center justify-center">
            <FlexRender className="flex-row  w-full px-4 justify-between" items={links} render={(item, index) => <Tab {...item} key={index} />} />
        </div>
    )
}

export default Tabs