import { BaseExtension } from "ruiged";
import PickTool from "./tool/PickTool";
class InternalExtension extends BaseExtension {
    static extensionAuthor = "Ruig";
    static extensionName = "InternalExtension";
    init() {
        new PickTool(this.appContainer);
    }
}
export default InternalExtension;
