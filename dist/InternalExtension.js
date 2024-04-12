import REI from "ruiged";
import PickTool from "./tool/PickTool";
import PreviewTool from "./tool/PreviewTool";
class InternalExtension extends REI.BaseExtension {
    static extensionAuthor = "Ruig";
    static extensionName = "InternalExtension";
    init() {
        new PreviewTool(this.appContainer);
        new PickTool(this.appContainer);
    }
}
export default InternalExtension;
