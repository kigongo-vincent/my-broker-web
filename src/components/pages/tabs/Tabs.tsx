import FlexRender from "../../base/FlexRender"
import Tab, { LinkI } from "./Tab"

export interface Props {
    links: LinkI[]
}

const Tabs = ({ links }: Props) => {
    if (!links?.length) return null

    return (
        <FlexRender
            className="flex-row shrink-0 bg-pale items-center w-full px-4 justify-between border-t border-text/10 h-[calc(9vh+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]"
            items={links}
            render={(item, index) => <Tab {...item} key={index} />}
        />
    )
}

export default Tabs