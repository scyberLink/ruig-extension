import { registerElement } from "ruiged"
import IAnyObject from "ruiged/common/models/IAnyObject"
import DesignElementTypes from "ruiged/layers/view/common/DesignElementTypes"
import DesignElement from "ruiged/layers/view/design/DesignElement"

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