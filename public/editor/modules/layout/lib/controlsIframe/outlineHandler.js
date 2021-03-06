import { getService } from 'vc-cake'
import { exceptionalElements } from './exceptionalElements'
const documentManager = getService('document')
const cook = getService('cook')

export default class Outline {
  constructor (props) {
    this.iframeContainer = props.iframeContainer
    this.iframeOverlay = props.iframeOverlay
    this.iframe = props.iframe
    this.iframeWindow = props.iframeWindow
    this.iframeDocument = props.iframeDocument
    this.outlineContainer = null
    this.colorIndex = null

    this.outline = null

    this.state = {
      outlineTimeout: null
    }

    this.setup()
  }

  /**
   * Generate outline and add it to overlay
   */
  setup () {
    this.outlineContainer = document.createElement('div')
    this.outlineContainer.classList.add('vcv-ui-element-outline-container')
    this.iframeOverlay.appendChild(this.outlineContainer)

    this.outline = document.createElement('svg')
    this.outline.classList.add('vcv-ui-element-outline')
    this.outline.classList.add('vcv-ui-element-outline-type-custom')
    this.outlineContainer.appendChild(this.outline)
  }

  /**
   * Show outline
   * @param element
   */
  show (element, id) {
    const vcElement = this.getVcElement(id)
    this.colorIndex = this.getElementColorIndex(vcElement)
    this.outline.classList.add(`vcv-ui-element-outline-type-index-${this.colorIndex}`)
    this.outline.classList.add('vcv-state--visible')
    this.autoUpdatePosition(element)
  }

  /**
   * Hide outline
   */
  hide () {
    this.outline.classList.remove(`vcv-ui-element-outline-type-index-${this.colorIndex}`)
    this.outline.classList.remove('vcv-state--visible')
    this.stopAutoUpdatePosition()
  }

  /**
   * Update outline position
   * @param element
   * @param frame
   */
  updatePosition (element, frame) {
    let { top, left, width, height } = element.getBoundingClientRect()
    if (this.iframe.tagName.toLowerCase() !== 'iframe') {
      let iframePos = this.iframe.getBoundingClientRect()
      top -= iframePos.top
      left -= iframePos.left
    }
    frame.style.top = top + 'px'
    frame.style.left = left + 'px'
    frame.style.width = width + 'px'
    frame.style.height = height + 'px'
  }

  /**
   * Automatically update outline position after timeout
   * @param element
   */
  autoUpdatePosition (element) {
    this.stopAutoUpdatePosition()
    if (!this.state.outlineTimeout) {
      this.updatePosition(element, this.outline)
      this.state.outlineTimeout = this.iframeWindow.setInterval(this.updatePosition.bind(this, element, this.outline), 16)
    }
  }

  /**
   * Stop automatically update outline position and clear timeout
   */
  stopAutoUpdatePosition () {
    if (this.state.outlineTimeout) {
      this.iframeWindow.clearInterval(this.state.outlineTimeout)
      this.state.outlineTimeout = null
    }
  }

  /**
   * Get vc element color index
   * @param vcElement
   * @returns {number}
   */
  getElementColorIndex (vcElement) {
    let colorIndex = 2
    if (vcElement && vcElement.containerFor().length > 0) {
      const isColoredElement = exceptionalElements.find(element => vcElement.containerFor().indexOf(element) > -1)
      colorIndex = isColoredElement ? 0 : 1
    }
    return colorIndex
  }

  /**
   * Get vc element
   * @param elementId
   */
  getVcElement (elementId) {
    return cook.get(documentManager.get(elementId))
  }

  /**
   * Update iframe variables
   */
  updateIframeVariables (DOMNodes) {
    this.iframe = DOMNodes.iframe
    this.iframeWindow = DOMNodes.iframeWindow
    this.iframeDocument = DOMNodes.iframeDocument
  }
}
