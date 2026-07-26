import FlexRender from "../../base/FlexRender"
import Tab, { LinkI } from "./Tab"

export interface Props {
    links: LinkI[]
}

const Tabs = ({ links }: Props) => {
    return (
        <FlexRender className="flex-row fixed bottom-0 left-0 bg-pale  max-h-[11vh] min-h-[11vh] items-center w-full px-4 justify-between" items={links} render={(item, index) => <Tab {...item} key={index} />} />
    )
}

export default Tabs