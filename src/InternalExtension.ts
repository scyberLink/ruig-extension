import REI from "ruiged";
import  PickTool from "./tool/PickTool";
import IAppContainer from "ruiged/layers/view/application/components/base/model/IAppContainer";

class InternalExtension extends REI.BaseExtension {
    static extensionAuthor = "Ruig";
    static extensionName = "InternalExtension";
    init() {
        new PickTool(this.appContainer as IAppContainer);
    }
}

export default InternalExtension