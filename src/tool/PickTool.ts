import REI from "ruiged";
import BaseComponent from "ruiged/layers/view/application/components/base/BaseComponent";
import IAppContainer from "ruiged/layers/view/application/components/base/model/IAppContainer";
import IDrawingCanvas from "ruiged/layers/view/application/components/base/model/IDrawingCanvas";
import DesignElement from "ruiged/layers/view/design/DesignElement";

class PickTool extends REI.DrawingToolbarItem {

    activate(e: MouseEvent) {
        e.preventDefault()
        alert("Pick tool is active")
    }

    appContainer: IAppContainer;
    canvas: IDrawingCanvas;

    constructor(appContainer: IAppContainer) {
        super()
        this.appContainer = appContainer
        this.canvas = appContainer.getDrawingCanvas()
        this.init({
            svgPathData:
                'M0 55.2V426c0 12.2 9.9 22 22 22c6.3 0 12.4-2.7 16.6-7.5L121.2 346l58.1 116.3c7.9 15.8 27.1 22.2 42.9 14.3s22.2-27.1 14.3-42.9L179.8 320H297.9c12.2 0 22.1-9.9 22.1-22.1c0-6.3-2.7-12.3-7.4-16.5L38.6 37.9C34.3 34.1 28.9 32 23.2 32C10.4 32 0 42.4 0 55.2z',
            hint: 'Pick tool',
            description: 'This enables selection and deselection of an object',
        })
            ; (appContainer.getDrawingToolBar() as BaseComponent).appendChildren(this)


    }

    action = (designElement?: DesignElement) => {
        ; (this.canvas as BaseComponent).onclick = this.activate
        return true as never;
    };
}
REI.registerElement('PickTool', PickTool as unknown as any)

export default PickTool