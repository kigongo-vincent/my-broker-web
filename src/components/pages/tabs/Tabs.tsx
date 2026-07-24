import FlexRender from "../../base/FlexRender"
import Tab, { LinkI } from "./Tab"

export interface Props {
    links: LinkI[]
}

const Tabs = ({ links }: Props) => {
    return (
        <div className="bg-pale  h-[13vh]  min-h-max sm:w-[400px] fixed bottom-0 w-full flex items-center justify-center border-t border-text/10">
            <FlexRender className="flex-row  w-full px-4 justify-between" items={links} render={(item, index) => <Tab {...item} key={index} />} />
        </div>
    )
}

export default Tabs