
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