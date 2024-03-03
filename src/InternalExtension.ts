import { BaseExtension } from "ruig-type";
import IAppContainer from "ruig-type/layers/view/application/components/base/model/IAppContainer";
import PickTool from './ruig/internal-extension/tool/PickTool'

class InternalExtension extends BaseExtension {
    static extensionAuthor = "Ruig"
    static extensionName = "InternalExtension"

    init(): void {
        new PickTool(this.appContainer as IAppContainer)
    }

}

export default InternalExtension