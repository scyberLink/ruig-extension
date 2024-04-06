import REI from "ruiged"
import IAnyObject from "ruiged/common/models/IAnyObject"

class LinkDesignElement extends REI.DesignElement {
  type = REI.DesignElementTypes.SPAN

  constructor(style?: IAnyObject) {
    super({
      ...(style ?? {}),
      display: 'inline',
    })

    this.extendedElement.textContent = 'Span'
  }
}

export default REI.registerElement('LinkDesignElement', LinkDesignElement as unknown as any)