import React from 'react'
import classNames from 'classnames'
import { getService } from 'vc-cake'
import _ from 'lodash'
import '../../../../../sources/less/wpbackend/representers/init.less'

const categories = getService('categories')
const cook = getService('cook')

export default class DefaultElement extends React.Component {
  static propTypes = {
    element: React.PropTypes.object.isRequired,
    api: React.PropTypes.object.isRequired,
    openElement: React.PropTypes.func.isRequired,
    activeElementId: React.PropTypes.string.isRequired,
    layout: React.PropTypes.func.isRequired,
    layoutWidth: React.PropTypes.object.isRequired
  }

  elementContainer = null

  constructor (props) {
    super(props)
    this.state = {
      hasAttributes: true,
      element: props.element,
      dropdownTop: '',
      dropdownLeft: '',
      dropdownWidth: '',
      isName: true,
      isArrow: true
    }
    this.handleClick = this.handleClick.bind(this)
    this.handleDropdownSize = this.handleDropdownSize.bind(this)
    this.handleElementSize = _.debounce(this.handleElementSize.bind(this), 150)
  }

  // Lifecycle

  componentWillMount () {
    let cookElement = cook.get({ tag: this.state.element.tag })
    if (!cookElement.get('metaBackendLabels')) {
      this.setState({ hasAttributes: false })
    }
  }

  componentWillReceiveProps (nextProps) {
    let { element, activeElementId, layoutWidth } = this.props
    this.setState({ element: nextProps.element })
    if (layoutWidth !== nextProps.layoutWidth) {
      if (activeElementId === element.id) {
        this.handleDropdownSize()
      }
    }
  }

  componentDidMount () {
    this.handleElementSize()
    this.addResizeListener(this.elementContainer, this.handleElementSize)
  }

  componentWillUnmount () {
    this.removeResizeListener(this.elementContainer, this.handleElementSize)
  }

  // Events

  addResizeListener (element, fn) {
    let isIE = !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/Edge/))
    if (window.getComputedStyle(element).position === 'static') {
      element.style.position = 'relative'
    }
    let obj = element.__resizeTrigger__ = document.createElement('object')
    obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; opacity: 0; pointer-events: none; z-index: -1;')
    obj.__resizeElement__ = element
    obj.onload = function (e) {
      this.contentDocument.defaultView.addEventListener('resize', fn)
    }
    obj.type = 'text/html'
    if (isIE) {
      element.appendChild(obj)
    }
    obj.data = 'about:blank'
    if (!isIE) {
      element.appendChild(obj)
    }
  }

  removeResizeListener (element, fn) {
    element.__resizeTrigger__.contentDocument.defaultView.removeEventListener('resize', fn)
    element.__resizeTrigger__ = !element.removeChild(element.__resizeTrigger__)
  }

  handleClick () {
    let { activeElementId, element, openElement } = this.props
    if (activeElementId === element.id) {
      openElement('')
    } else {
      openElement(element.id)
      this.handleDropdownSize()
    }
  }

  handleDropdownSize () {
    let layout = this.props.layout()
    let container = this.elementContainer
    let attrDropdown = container.querySelector('.vce-wpbackend-element-attributes')
    if (attrDropdown) {
      let size = container.getBoundingClientRect()
      let styles = window.getComputedStyle(container)
      let layoutStyles = window.getComputedStyle(layout)
      let layoutSize = layout.getBoundingClientRect()
      let layoutLeft = layoutSize.left + parseInt(layoutStyles.paddingLeft)
      let containerLeft = size.left
      let diff = containerLeft - layoutLeft
      let dropdownPos = 0 - diff - parseInt(styles.borderLeftWidth)
      this.setState({
        dropdownWidth: `${layoutSize.width - parseInt(layoutStyles.paddingLeft) - parseInt(layoutStyles.paddingRight)}px`,
        dropdownLeft: `${dropdownPos}px`,
        dropdownTop: `${size.height - parseInt(styles.borderBottomWidth) - parseInt(styles.borderTopWidth)}px`
      })
    }
  }

  handleElementSize () {
    let container = this.elementContainer
    let header = this.getElementData('.vce-wpbackend-element-header')
    let nameWrapper = this.getElementData('.vce-wpbackend-element-header-name-wrapper')
    let nameInner = this.getElementData('.vce-wpbackend-element-header-name')
    let icon = this.getElementData('.vce-wpbackend-element-header-icon')
    let nameWrapperElement = container.querySelector('.vce-wpbackend-element-header-name-wrapper')
    let nameWrapperStyles = window.getComputedStyle(nameWrapperElement)
    let nameWrapperPaddingLeft = parseInt(nameWrapperStyles.paddingLeft)
    let arrowPos = 22
    let offsets = nameWrapperPaddingLeft + arrowPos
    let { isName, isArrow } = this.state

    if (isName && nameInner.width > nameWrapper.width - offsets) {
      this.setState({ isName: false })
    } else if (!isName && nameInner.width < nameWrapper.width - offsets) {
      this.setState({ isName: true })
    }

    if (isArrow && icon.width > header.width - offsets) {
      this.setState({ isArrow: false })
    } else if (!isArrow && icon.width < header.width - offsets) {
      this.setState({ isArrow: true })
    }
  }

  // Getters

  getElementData (className) {
    return this.elementContainer.querySelector(className).getBoundingClientRect()
  }

  getDependency (label, element, cookElement) {
    let isDependency, isRuleTrue
    let options = cookElement.settings('metaBackendLabels').settings.options
    if (options && options.onChange) {
      isDependency = options.onChange.find((option) => {
        return option.dependency === label
      })
      if (isDependency) {
        isRuleTrue = isDependency.rule.value === element[ isDependency.rule.attribute ]
      }
    }
    return isRuleTrue
  }

  getRepresenter (element) {
    let cookElement = cook.get({ tag: element.tag })
    let backendLabels = cookElement.get('metaBackendLabels').value
    return backendLabels.map((label) => {
      if (this.getDependency(label, element, cookElement)) {
        return null
      }
      let RepresenterComponent = cookElement.settings(label).type.getRepresenter('Backend')
      return <RepresenterComponent
        key={`representer-${label}-${cookElement.get('id')}`}
        fieldKey={label}
        value={element[ label ]}
        {...this.props}
      />
    })
  }

  render () {
    const { element, hasAttributes, dropdownTop, dropdownLeft, dropdownWidth, isName, isArrow } = this.state
    const { activeElementId } = this.props
    let icon = categories.getElementIcon(element.tag, true)
    let attributesClasses = classNames({
      'vce-wpbackend-element-attributes': true,
      'vce-wpbackend-hidden': activeElementId !== element.id
    })

    let headerClasses = classNames({
      'vce-wpbackend-element-header': true,
      'vce-wpbackend-element-header-closed': activeElementId !== element.id,
      'vce-wpbackend-element-header-opened': activeElementId === element.id,
      'vce-wpbackend-element-header-no-arrow': !isArrow
    })

    let nameClasses = classNames({
      'vce-wpbackend-element-header-name-wrapper': true,
      'vce-wpbackend-invisible': !isName,
      'vce-wpbackend-hidden': !isArrow
    })

    let dropdownStyles = {
      top: dropdownTop,
      left: dropdownLeft,
      width: dropdownWidth
    }
    if (hasAttributes) {
      return <div
        className='vce-wpbackend-element-container'
        data-vcv-element={element.id}
        ref={(container) => { this.elementContainer = container }}
      >
        <div className={headerClasses} onClick={this.handleClick}>
          <div className='vce-wpbackend-element-header-icon'>
            <img src={icon} alt={element.name} title={element.name} />
          </div>
          <div className={nameClasses}>
            <span className='vce-wpbackend-element-header-name'>{element.name}</span>
          </div>
        </div>
        <div className={attributesClasses} style={dropdownStyles}>
          {this.getRepresenter(element)}
        </div>
      </div>
    }
    return <div
      className='vce-wpbackend-element-container'
      data-vcv-element={element.id}
      ref={(container) => { this.elementContainer = container }}
    >
      <div className='vce-wpbackend-element-header'>
        <div className='vce-wpbackend-element-header-icon'>
          <img src={icon} alt={element.name} title={element.name} />
        </div>
        <div className='vce-wpbackend-element-header-name-wrapper'>
          <span className='vce-wpbackend-element-header-name'>{element.name}</span>
        </div>
      </div>
    </div>
  }
}
