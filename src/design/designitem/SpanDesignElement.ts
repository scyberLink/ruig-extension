import { registerElement } from "ruig-type"
import IAnyObject from "ruig-type/common/models/IAnyObject"
import DesignElementTypes from "ruig-type/layers/view/common/DesignElementTypes"
import DesignElement from "ruig-type/layers/view/design/DesignElement"

class LinkDesignElement extends DesignElement {
  type: DesignElementTypes = DesignElementTypes.SPAN

  constructor(style?: IAnyObject) {
    super({
      ...(style ?? {}),
      display: 'inline',
    })

    this.extendedElement.textContent = 'Span'
  }
}

export default registerElement('LinkDesignElement', LinkDesignElement as unknown as any)