import REI from "ruiged";
import PickTool from "./tool/PickTool";
class InternalExtension extends REI.BaseExtension {
    static extensionAuthor = "Ruig";
    static extensionName = "InternalExtension";
    init() {
        new PickTool(this.appContainer);
    }
}
export default InternalExtension;
