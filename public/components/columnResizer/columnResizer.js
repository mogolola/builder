import React from 'react'
import ReactDOM from 'react-dom'
import vcCake from 'vc-cake'
import Layout from '../../sources/attributes/rowLayout/Component'

const elementsStorage = vcCake.getStorage('elements')
const layoutStorage = vcCake.getStorage('layout')
let previousLayoutCustomMode = false

class ColumnResizer extends React.Component {
  static defaultGridPercentage = [ 20, 25, 33.33, 50, 66.66, 75 ]

  static deviceViewports = {
    xs: 0,
    sm: 544,
    md: 768,
    lg: 992,
    xl: 1200
  }

  resizerData = {
    rowId: null,
    rowData: null,
    rowWidth: null,
    helper: null,
    rightColumn: null,
    leftColumn: null,
    bothColumnsWidth: null,
    bothColumnsWidthPx: null,
    columnGap: null,
    mousePosition: null,
    resizerPositions: null,
    snapWidth: 7,
    leftColumnIndex: null
  }

  constructor (props) {
    super(props)
    this.state = {
      dragging: false,
      leftColPercentage: null,
      rightColPercentage: null,
      labelPosition: null,
      isVisible: true
    }
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleLayoutCustomModeChange = this.handleLayoutCustomModeChange.bind(this)
  }

  componentDidMount () {
    vcCake.onDataChange('vcv:layoutCustomMode', this.handleLayoutCustomModeChange)
  }

  componentWillUnmount () {
    vcCake.ignoreDataChange('vcv:layoutCustomMode', this.handleLayoutCustomModeChange)
  }

  componentDidUpdate (props, state) {
    let ifameDocument = document.querySelector('#vcv-editor-iframe').contentWindow
    let data = {}
    if (this.state.dragging && !state.dragging) {
      previousLayoutCustomMode = vcCake.getData('vcv:layoutCustomMode') && vcCake.getData('vcv:layoutCustomMode').mode
      data = {
        mode: 'columnResizer',
        options: {}
      }
      vcCake.setData('vcv:layoutCustomMode', data)
      ifameDocument.addEventListener('mousemove', this.handleMouseMove)
      ifameDocument.addEventListener('mouseup', this.handleMouseUp)
      vcCake.setData('vcv:layoutColumnResize', this.resizerData.rowId)
    } else if (!this.state.dragging && state.dragging) {
      const newLayoutMode = previousLayoutCustomMode === 'contentEditable' ? previousLayoutCustomMode : null
      data = {
        mode: newLayoutMode,
        options: {}
      }
      vcCake.setData('vcv:layoutCustomMode', newLayoutMode ? data : null)
      vcCake.setData('vcv:layoutColumnResize', null)
      ifameDocument.removeEventListener('mousemove', this.handleMouseMove)
      ifameDocument.removeEventListener('mouseup', this.handleMouseUp)
    }
  }

  handleLayoutCustomModeChange (data) {
    if (data === 'contentEditable') {
      this.hide()
    } else {
      this.show()
    }
  }

  getRowData (e) {
    let $helper = ReactDOM.findDOMNode(this)
    let $tempRightCol = $helper.nextElementSibling
    let $rightCol = null
    let $leftCol = null

    // Search for next visible column
    while (!$tempRightCol.offsetParent) {
      $tempRightCol = $tempRightCol.nextElementSibling
    }

    let $tempLeftCol = $helper.previousElementSibling

    while (!$tempLeftCol.offsetParent) {
      $tempLeftCol = $tempLeftCol.nextElementSibling
    }

    if ($tempLeftCol.getBoundingClientRect().left > $tempRightCol.getBoundingClientRect().left) {
      $rightCol = $tempLeftCol
      $leftCol = $tempRightCol
    } else {
      $rightCol = $tempRightCol
      $leftCol = $tempLeftCol
    }

    let rightColId = $rightCol ? $rightCol.id.replace('el-', '') : null
    let leftColId = $leftCol ? $leftCol.id.replace('el-', '') : null
    let rowId = vcCake.getService('document').get(rightColId || leftColId).parent
    let rowData = vcCake.getService('document').get(rowId)
    let columnGap = rowData.columnGap ? parseInt(rowData.columnGap) : 0
    let rowWidth = $helper.parentElement.getBoundingClientRect().width + columnGap - parseFloat(window.getComputedStyle($helper.parentElement).paddingLeft) - parseFloat(window.getComputedStyle($helper.parentElement).paddingRight)
    let bothColumnsWidth = ($leftCol.getBoundingClientRect().width + $rightCol.getBoundingClientRect().width + columnGap * 2) / rowWidth
    let bothColumnsWidthPx = $leftCol.getBoundingClientRect().width + $rightCol.getBoundingClientRect().width
    let allColumns = [].slice.call($helper.parentElement.querySelectorAll('.vce-col'))
    let leftColumnIndex = allColumns.indexOf($leftCol)
    let rightColumnIndex = allColumns.indexOf($rightCol)

    this.resizerData.rowId = rowId
    this.resizerData.rowData = rowData
    this.resizerData.rowWidth = rowWidth
    this.resizerData.helper = $helper
    this.resizerData.rightColumn = $rightCol
    this.resizerData.leftColumn = $leftCol
    this.resizerData.bothColumnsWidth = bothColumnsWidth
    this.resizerData.bothColumnsWidthPx = bothColumnsWidthPx
    this.resizerData.columnGap = columnGap
    this.resizerData.mousePosition = e.clientX
    this.resizerData.leftColumnIndex = leftColumnIndex
    this.resizerData.rightColumnIndex = rightColumnIndex
    this.resizerData.currentDevice = this.getCurrentDevice()
  }

  handleMouseDown (e) {
    if (e.nativeEvent.which === 1) {
      this.getRowData(e)
      this.getResizerPositions(e)
      this.createWrapBlockers()
      this.setResizeLabelsPosition(e)
      let colSizes = this.getResizedColumnsWidth(e)

      this.setState({
        dragging: true,
        leftColPercentage: colSizes.leftCol,
        rightColPercentage: colSizes.rightCol
      })
      layoutStorage.state('resizeColumns').set(true)
    }
  }

  getResizerPositions (e) {
    let positions = []
    let currentResizer = e.currentTarget
    let currentResizerClientRect = currentResizer.getBoundingClientRect()

    let allResizers = document.querySelector('#vcv-editor-iframe').contentWindow.document.querySelectorAll('.vce-column-resizer-handler')
    allResizers = [].slice.call(allResizers)

    let resizerRow = currentResizer.parentElement.parentElement
    // row first and last column position
    let firstInRow, lastInRow
    for (let i = 0; i < resizerRow.childNodes.length; i++) {
      let elementClasses = resizerRow.childNodes[ i ].classList
      if (elementClasses.contains('vce-col--all-first') || elementClasses.contains('vce-col--' + this.resizerData.currentDevice + '-first')) {
        firstInRow = resizerRow.childNodes[ i ].getBoundingClientRect()
      }
      if (elementClasses.contains('vce-col--all-last') || elementClasses.contains('vce-col--' + this.resizerData.currentDevice + '-last')) {
        lastInRow = resizerRow.childNodes[ i ].getBoundingClientRect()
      }
      if (firstInRow && lastInRow) {
        i = resizerRow.childNodes.length
      }
    }
    // get content part position and width relative to window,
    let rowContentWidth = lastInRow.left + lastInRow.width - firstInRow.left + currentResizerClientRect.width
    ColumnResizer.defaultGridPercentage.forEach((percentage) => {
      let position = firstInRow.left - currentResizerClientRect.width / 2 + rowContentWidth * (percentage / 100)
      positions.push((Math.round(position * 100) / 100))

      let leftPosition = this.resizerData.leftColumn.getBoundingClientRect().left - currentResizerClientRect.width / 2 + rowContentWidth * (percentage / 100)
      positions.push((Math.round(leftPosition * 100) / 100))

      let rightColClientRect = this.resizerData.rightColumn.getBoundingClientRect()
      let rightPosition = rightColClientRect.left + rightColClientRect.width + currentResizerClientRect.width / 2 - rowContentWidth * (percentage / 100)
      positions.push((Math.round(rightPosition * 100) / 100))
    })
    // get default grid snap points and add them to positions []
    allResizers.forEach((resizer) => {
      if (resizer !== currentResizer && window.getComputedStyle(resizer.parentElement).getPropertyValue('display') !== 'none') {
        let resizerClientRect = resizer.getBoundingClientRect()
        let position = resizerClientRect.left + resizerClientRect.width / 2
        if (positions.indexOf(position) < 0) {
          positions.push((Math.round(position * 100) / 100))
        }
      }
    })
    this.resizerData.resizerPositions = positions
  }

  handleMouseUp () {
    this.setState({ dragging: false })
    this.removeWrapBlockers()
    this.rebuildRowLayout()
    this.removeTemporaryColStyles()
    layoutStorage.state('resizeColumns').set(false)
  }

  handleMouseMove (e) {
    if (!this.state.dragging) {
      return
    }
    this.renderTemporaryColStyles(e)
    this.setResizeLabelsPosition(e)
  }

  setResizeLabelsPosition (e) {
    let labelPosition = e.clientY - this.resizerData.helper.getBoundingClientRect().top
    this.setState({ labelPosition: labelPosition })
  }

  renderTemporaryColStyles (e) {
    let columnGap = this.resizerData.columnGap
    let colSizes = this.getResizedColumnsWidth(e)
    let resizerPercentages = colSizes.leftCol
    let rightResizerPercentages = colSizes.rightCol

    let equalSpace = columnGap * (resizerPercentages * 100 - 1)
    let rightEqualSpace = columnGap * (rightResizerPercentages * 100 - 1)
    let gapSpace = columnGap * (100 - 1)

    let rowWidth = this.resizerData.rowWidth - this.resizerData.columnGap

    let mouseLeftPosition = e.clientX
    this.resizerData.resizerPositions.forEach((position) => {
      let minPosition = Math.round(position) - this.resizerData.snapWidth
      let maxPosition = Math.round(position) + this.resizerData.snapWidth
      if (mouseLeftPosition > minPosition && mouseLeftPosition < maxPosition) {
        let fullRowWidth = this.resizerData.rowWidth
        let resizerWidth = position - this.resizerData.leftColumn.getBoundingClientRect().left + this.resizerData.columnGap / 2
        let leftCol = resizerWidth / fullRowWidth

        resizerPercentages = leftCol
        rightResizerPercentages = this.resizerData.bothColumnsWidth - leftCol
        equalSpace = columnGap * (resizerPercentages * 100 - 1)
        rightEqualSpace = columnGap * (rightResizerPercentages * 100 - 1)
      }
    })

    let leftWidth = `calc((100% - ${gapSpace}px) * ${resizerPercentages} + ${equalSpace}px)`
    let rightWidth = `calc((100% - ${gapSpace}px) * ${rightResizerPercentages} + ${rightEqualSpace}px)`

    if (this.resizerData.mousePosition > e.clientX) {
      let left = (rowWidth - gapSpace) * resizerPercentages + equalSpace
      let right = this.resizerData.rightColumn.getBoundingClientRect().width

      if ((left + right) < this.resizerData.bothColumnsWidthPx) {
        this.resizerData.leftColumn.style.flexBasis = leftWidth
        this.resizerData.leftColumn.style.maxWidth = leftWidth

        this.resizerData.rightColumn.style.flexBasis = this.resizerData.bothColumnsWidthPx - this.resizerData.leftColumn.getBoundingClientRect().width + 'px'
        this.resizerData.rightColumn.style.maxWidth = this.resizerData.bothColumnsWidthPx - this.resizerData.leftColumn.getBoundingClientRect().width + 'px'
      }
    } else if (this.resizerData.mousePosition < e.clientX) {
      let left = this.resizerData.leftColumn.getBoundingClientRect().width
      let right = (rowWidth - gapSpace) * rightResizerPercentages + rightEqualSpace
      if ((left + right) < this.resizerData.bothColumnsWidthPx) {
        this.resizerData.rightColumn.style.flexBasis = rightWidth
        this.resizerData.rightColumn.style.maxWidth = rightWidth

        this.resizerData.leftColumn.style.flexBasis = this.resizerData.bothColumnsWidthPx - this.resizerData.rightColumn.getBoundingClientRect().width + 'px'
        this.resizerData.leftColumn.style.maxWidth = this.resizerData.bothColumnsWidthPx - this.resizerData.rightColumn.getBoundingClientRect().width + 'px'
      }
    }

    let columnCalc = (100 * columnGap) + (rowWidth - gapSpace)
    let leftCol = columnGap + this.resizerData.leftColumn.getBoundingClientRect().width
    let rightCol = columnGap + this.resizerData.rightColumn.getBoundingClientRect().width
    let leftPercentage = leftCol / columnCalc
    let rightPercentage = rightCol / columnCalc

    this.setLabelPercentages(leftPercentage, rightPercentage)

    this.resizerData.mousePosition = e.clientX
  }

  removeTemporaryColStyles () {
    this.resizerData.leftColumn.removeAttribute('style')
    this.resizerData.rightColumn.removeAttribute('style')
  }

  createWrapBlockers () {
    let $resizer = this.resizerData.helper
    let firstRowElement = this.getSibling($resizer, 'prev', 'vce-col--all-first') || this.getSibling($resizer, 'prev', 'vce-col--' + this.resizerData.currentDevice + '-first')
    let blockElement = document.createElement('div')
    blockElement.className = 'vce-column-wrap-blocker'

    if (firstRowElement) {
      firstRowElement.parentNode.insertBefore(blockElement, firstRowElement)
    }
  }

  removeWrapBlockers () {
    let blocker = this.resizerData.helper.parentNode.querySelector('.vce-column-wrap-blocker')
    blocker.parentNode.removeChild(blocker)
  }

  getSibling (element, direction, className) {
    let sibling = null
    if (direction === 'prev') {
      direction = 'previousElementSibling'
    } else if (direction === 'next') {
      direction = 'nextElementSibling'
    } else {
      return null
    }

    let getElementSibling = (element, dir) => {
      let siblingElement = element[ dir ]
      if (!siblingElement) {
        return null
      }
      let siblingClasses = element[ dir ].className.split(' ')
      if (siblingClasses.indexOf(className) > -1) {
        sibling = element[ dir ]
      } else {
        getElementSibling(element[ dir ], dir)
      }
    }
    getElementSibling(element, direction)
    return sibling
  }

  setLabelPercentages (left, right) {
    this.setState({
      leftColPercentage: left,
      rightColPercentage: right
    })
  }

  getResizedColumnsWidth (e, leftColumn) {
    let rowWidth = this.resizerData.rowWidth
    let resizerWidth = e.clientX - (leftColumn || this.resizerData.leftColumn.getBoundingClientRect().left) + this.resizerData.columnGap / 2
    let leftCol = resizerWidth / rowWidth
    return { leftCol: leftCol, rightCol: this.resizerData.bothColumnsWidth - leftCol }
  }

  rebuildRowLayout () {
    const parentRow = vcCake.getService('document').get(this.resizerData.rowId)
    let layoutData = this.getLayoutData(this.resizerData.rowId)

    let leftSize = (Math.round(this.state.leftColPercentage * 10000) / 10000) * 100
    leftSize = leftSize.toString().slice(0, leftSize.toString().indexOf('.') + 3)
    let rightSize = (Math.round(this.state.rightColPercentage * 10000) / 10000) * 100
    rightSize = rightSize.toString().slice(0, rightSize.toString().indexOf('.') + 3)

    const device = layoutData.hasOwnProperty('all') ? 'all' : this.resizerData.currentDevice

    layoutData[ device ][ this.resizerData.leftColumnIndex ] = `${leftSize}%`
    layoutData[ device ][ this.resizerData.rightColumnIndex ] = `${rightSize}%`
    parentRow.layout.layoutData = layoutData
    elementsStorage.trigger('update', parentRow.id, parentRow, '', { changedAttributeType: 'rowLayout' })
  }

  getCurrentDevice () {
    const iframeDocument = document.querySelector('#vcv-editor-iframe').contentWindow
    const windowWidth = Math.max(iframeDocument.document.documentElement.clientWidth, iframeDocument.innerWidth || 0)
    let currentDevice = null

    Object.keys(ColumnResizer.deviceViewports).forEach((device) => {
      const viewport = ColumnResizer.deviceViewports[ device ]

      if (windowWidth >= viewport) {
        currentDevice = device
      }
    })

    return currentDevice
  }

  getLayoutData (rowId) {
    const deviceLayoutData = {}
    const rowChildren = vcCake.getService('document').children(rowId)

    // Get layout for 'all'
    rowChildren.forEach((element) => {
      if (element.size[ 'all' ]) {
        if (!deviceLayoutData.hasOwnProperty('all')) {
          deviceLayoutData.all = []
        }
        deviceLayoutData[ 'all' ].push(element.size[ 'all' ])
      }
    })

    if (!deviceLayoutData.hasOwnProperty('all')) { // Get layout for devices, if 'all' is not defined
      Layout.devices.forEach((device) => {
        rowChildren.forEach((element) => {
          if (element.size[ device ]) {
            if (!deviceLayoutData.hasOwnProperty(device)) {
              deviceLayoutData[ device ] = []
            }
            deviceLayoutData[ device ].push(element.size[ device ])
          }
        })
      })
    }

    return deviceLayoutData
  }

  hide () {
    this.setState({ isVisible: false })
  }

  show () {
    this.setState({ isVisible: true })
  }

  render () {
    if (!this.state.isVisible) {
      return null
    }
    let resizerLabels = ''
    if (this.state.dragging) {
      let labelProps = {
        style: {
          top: `${this.state.labelPosition}px`
        }
      }
      resizerLabels = (
        <div className='vce-column-resizer-label-container' {...labelProps}>
          <div className='vce-column-resizer-label vce-column-resizer-label-left'>
            <svg width='5px' height='23px' viewBox='0 0 5 23'
              version='1.1'
              xmlns='http://www.w3.org/2000/svg'>
              <g id='Page-1' stroke='none' strokeWidth='1' fill='rgba(40, 40, 40, .5)' fillRule='evenodd'>
                <path
                  d='M9.67660985,2.33058017e-12 L35.1786526,0 C37.9367983,0 40.1727172,2.24721412 40.1727172,4.99065745 L40.1727172,18.0093426 C40.1727172,20.7656066 37.9304373,23 35.1786526,23 L9.67660985,23 C9.12217523,23 8.35313873,22.6804216 7.97065195,22.2979348 L0.582842894,12.9101257 C-0.195948043,12.1313348 -0.192612096,10.8653293 0.582842894,10.0898743 L7.97065195,0.702065207 C8.35839186,0.3143253 9.12167598,2.33058017e-12 9.67660985,2.33058017e-12 Z'
                  transform='translate(20.086359, 11.500000) scale(-1, 1) translate(-20.086359, -11.500000)' />
              </g>
            </svg>
            <div className='vce-column-resizer-label-background'>
              <span
                className='vce-column-resizer-label-percentage'>{Math.round(this.state.leftColPercentage * 100) + '%'}</span>
            </div>
            <svg width='11px' height='23px' viewBox='0 0 11 23'
              version='1.1' xmlns='http://www.w3.org/2000/svg'>
              <g id='Page-1' stroke='none' strokeWidth='1' fillRule='evenodd'
                transform='translate(-30.000000, 0.000000)' fill='rgba(40, 40, 40, .5)'>
                <path
                  d='M9.67660985,2.33058017e-12 L35.1786526,0 C37.9367983,0 40.1727172,2.24721412 40.1727172,4.99065745 L40.1727172,18.0093426 C40.1727172,20.7656066 37.9304373,23 35.1786526,23 L9.67660985,23 C9.12217523,23 8.35313873,22.6804216 7.97065195,22.2979348 L0.582842894,12.9101257 C-0.195948043,12.1313348 -0.192612096,10.8653293 0.582842894,10.0898743 L7.97065195,0.702065207 C8.35839186,0.3143253 9.12167598,2.33058017e-12 9.67660985,2.33058017e-12 Z'
                  transform='translate(20.086359, 11.500000) scale(-1, 1) translate(-20.086359, -11.500000)' />
              </g>
            </svg>
          </div>
          <div className='vce-column-resizer-label vce-column-resizer-label-right'>
            <svg width='10px' height='23px' viewBox='0 0 10 23' version='1.1' xmlns='http://www.w3.org/2000/svg'>
              <g id='Page-1' stroke='none' strokeWidth='1' fillRule='evenodd' fill='#282828' opacity='0.5'>
                <path
                  d='M9.67660985,2.33058017e-12 L35.1786526,0 C37.9367983,0 40.1727172,2.24721412 40.1727172,4.99065745 L40.1727172,18.0093426 C40.1727172,20.7656066 37.9304373,23 35.1786526,23 L9.67660985,23 C9.12217523,23 8.35313873,22.6804216 7.97065195,22.2979348 L0.582842894,12.9101257 C-0.195948043,12.1313348 -0.192612096,10.8653293 0.582842894,10.0898743 L7.97065195,0.702065207 C8.35839186,0.3143253 9.12167598,2.33058017e-12 9.67660985,2.33058017e-12 Z' />
              </g>
            </svg>
            <div className='vce-column-resizer-label-background'>
              <span
                className='vce-column-resizer-label-percentage'>{Math.round(this.state.rightColPercentage * 100) + '%'}</span>
            </div>
            <svg width='6px' height='23px' viewBox='0 0 6 23' version='1.1' xmlns='http://www.w3.org/2000/svg'>
              <g id='Page-1' stroke='none' strokeWidth='1' fillRule='evenodd' fill='#282828' opacity='0.5'>
                <path
                  d='M-25.3233902,2.33058017e-12 L0.178652594,0 C2.93679829,0 5.17271716,2.24721412 5.17271716,4.99065745 L5.17271716,18.0093426 C5.17271716,20.7656066 2.93043732,23 0.178652594,23 L-25.3233902,23 C-25.8778248,23 -26.6468613,22.6804216 -27.029348,22.2979348 L-34.4171571,12.9101257 C-35.195948,12.1313348 -35.1926121,10.8653293 -34.4171571,10.0898743 L-27.029348,0.702065207 C-26.6416081,0.3143253 -25.878324,2.33058017e-12 -25.3233902,2.33058017e-12 Z' />
              </g>
            </svg>
          </div>
        </div>
      )
    }

    return (
      <div className='vcvhelper vce-column-resizer'>
        <div className='vce-column-resizer-handler' data-vcv-linked-element={this.props.linkedElement} onMouseDown={this.handleMouseDown} ref='resizerHandler'>
          {resizerLabels}
        </div>
      </div>
    )
  }
}

export default ColumnResizer
