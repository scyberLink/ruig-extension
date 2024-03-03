import { BaseExtension } from "ruig-type";
import PickTool from './ruig/internal-extension/tool/PickTool';
class InternalExtension extends BaseExtension {
    static extensionAuthor = "Ruig";
    static extensionName = "InternalExtension";
    init() {
        new PickTool(this.appContainer);
    }
}
export default InternalExtension;
