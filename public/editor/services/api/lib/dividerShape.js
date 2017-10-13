import React from 'react'
import vcCake from 'vc-cake'
const { Component, PropTypes } = React
let shapes = require('./shapes')
if (vcCake.env('NEW_DIVIDER_SHAPES')) {
  shapes = require('./shapes-new')
}

export default class DividerShape extends Component {
  static propTypes = {
    width: PropTypes.string,
    height: PropTypes.string,
    fill: PropTypes.string,
    shape: PropTypes.string,
    fillType: PropTypes.string,
    backgroundImage: PropTypes.string,
    id: PropTypes.string,
    flipHorizontally: PropTypes.bool,
    deviceKey: PropTypes.string,
    videoEmbed: PropTypes.object,
    percentageHeight: PropTypes.string
  }

  getLinearGradient () {
    if (this.props.fillType !== 'gradient') {
      return null
    }

    let startColor = this.props.gradientColorStart
    let endColor = this.props.gradientColorEnd
    let angle = this.props.gradientAngle

    if (this.props.flipHorizontally) {
      startColor = this.props.gradientColorEnd
      endColor = this.props.gradientColorStart
    }

    let id = `gradient-${this.props.id}-${this.props.deviceKey}`
    return (
      <linearGradient id={id} gradientUnits='objectBoundingBox' gradientTransform={`rotate(${angle} 0.5 0.5)`}>
        <stop offset='0%' style={{ stopColor: startColor, stopOpacity: '1' }} />
        <stop offset='100%' style={{ stopColor: endColor, stopOpacity: '1' }} />
      </linearGradient>
    )
  }

  changePercentageHeight (height, svgContent, position, defaultWidth, defaultHeight) {
    let heightToPx = defaultWidth * height / 100
    let difference = heightToPx - defaultHeight

    let parser = new window.DOMParser()
    let doc = parser.parseFromString(svgContent, 'text/html')

    let paths = doc.querySelectorAll('path')
    paths = [].slice.call(paths)
    paths.forEach((path) => {
      let d = path.getAttribute('d')
      let commands = d.split(/(?=[LMCZ])/)
      commands.pop()

      let pointArrays = commands.map((d) => {
        let letter = d[ 0 ]
        let pointsArray = d.slice(1, d.length).split(' ')
        let points = []
        pointsArray.forEach((item) => {
          if (item !== '') {
            let coordinates = item.split(',')
            let newY = parseFloat(coordinates[ 1 ])
            let pointToPx = defaultHeight * newY
            let newPointToPx = pointToPx + difference

            if (position === 'top') {
              if (newY !== 0 && newY !== 1) {
                newY = newPointToPx / heightToPx
              }
            } else {
              if (newY !== 0 && newY !== 1) {
                newY = pointToPx / heightToPx
              }
            }
            points.push(coordinates[ 0 ] + ',' + newY)
          }
        })
        return letter + points.join(' ')
      })
      path.setAttribute('d', `${pointArrays.join(' ')} Z`)
    })
    return doc.body && doc.body.innerHTML
  }

  changeHeight (height, svgContent, position, defaultHeight) {
    let parser = new window.DOMParser()
    let doc = parser.parseFromString(svgContent, 'text/html')
    height = parseFloat(height)
    let paths = doc.querySelectorAll('path')
    paths = [].slice.call(paths)
    paths.forEach((path) => {
      let d = path.getAttribute('d')
      let commands = d.split(/(?=[LMCZ])/)
      commands.pop()

      let pointArrays = commands.map((d) => {
        let letter = d[ 0 ]
        let pointsArray = d.slice(1, d.length).split(' ')
        let points = []
        pointsArray.forEach((item) => {
          if (item !== '') {
            let coordinates = item.split(',')
            let newX = parseFloat(coordinates[ 1 ])
            if (position === 'top') {
              if (newX !== 0) {
                newX = newX + height
              }
            } else {
              if (newX - defaultHeight !== 0) {
                newX = newX - height
              }
            }
            points.push(coordinates[ 0 ] + ',' + newX)
          }
        })
        return letter + points.join(' ')
      })
      path.setAttribute('d', `${pointArrays.join(' ')} Z`)
    })
    return doc.body && doc.body.innerHTML
  }

  render () {
    let { type, width, height, fill, shape, fillType, backgroundImage, deviceKey, id, videoEmbed, percentageHeight } = this.props
    let currentShape = shapes[ shape ]
    let viewBoxWidth = currentShape.viewBox && currentShape.viewBox.width
    let viewBoxHeight = currentShape.viewBox && currentShape.viewBox.height

    if (vcCake.env('NEW_DIVIDER_SHAPES')) {
      currentShape = currentShape && currentShape[ `${type.toLowerCase()}` ]
    }

    if (!currentShape) {
      return null
    }

    let videoData = null
    let videoUrl = ''
    if (videoEmbed && videoEmbed.urls && videoEmbed.urls.length) {
      videoData = videoEmbed.urls[ 0 ]
      videoUrl = videoEmbed.urls[ 0 ].url
    }
    let svgContent = currentShape.content
    let svgUnitContent = currentShape.unitContent
    let viewBox = `0 0 ${viewBoxWidth} ${viewBoxHeight}`
    let position = type ? type.toLowerCase() : 'top'

    if (fillType === 'color' || fillType === 'gradient' || (fillType === 'image' && !backgroundImage) || (fillType === 'videoEmbed' && !videoUrl)) {
      let newHeight = height
      if (percentageHeight) {
        newHeight = viewBoxWidth * (parseFloat(percentageHeight) / 100)
      }
      let html = this.changeHeight(newHeight, svgContent, position, viewBoxHeight)
      let customAttributes = {}
      customAttributes.fill = fill

      if (fillType === 'gradient') {
        let gradientId = `gradient-${id}-${deviceKey}`
        customAttributes.fill = `url(#${gradientId})`
      }
      let svgProps = {
        viewBox: viewBox,
        preserveAspectRatio: 'none'
      }
      if (!vcCake.env('NEW_DIVIDER_SHAPES')) {
        svgProps.height = viewBoxHeight
        svgProps.width = width
      }

      return (
        <svg className='vce-divider-svg' {...svgProps}>
          {this.getLinearGradient()}
          <g {...customAttributes} dangerouslySetInnerHTML={{ __html: html }} />
        </svg>
      )
    }

    if (fillType === 'image') {
      let imageId = `image-el-${id}-${deviceKey}`
      let html = svgUnitContent
      let backgroundImageUrl = `url(${backgroundImage})`
      let imageProps = {}
      imageProps.style = {
        width: width
      }

      if (percentageHeight) {
        percentageHeight = parseFloat(percentageHeight) + 10
        imageProps.style.paddingBottom = `${percentageHeight}%`
        html = this.changePercentageHeight(percentageHeight, svgUnitContent, position, viewBoxWidth, viewBoxHeight)
      } else {
        imageProps.style.height = `${parseFloat(height)}px`
      }

      let percentage = width.replace('%', '')
      let backgroundProps = {}

      backgroundProps.style = {
        width: `${100 / percentage * 100}%`,
        backgroundImage: backgroundImageUrl
      }

      return (
        <div className='vce-divider-with-image'>
          <svg className='vce-divider-svg'>
            <clipPath id={imageId} dangerouslySetInnerHTML={{ __html: html }} clipPathUnits='objectBoundingBox' />
          </svg>
          <div {...imageProps} className='vce-divider-image-block'>
            <div {...backgroundProps} className='vce-divider-image-background-block' />
          </div>
        </div>
      )
    }

    if (fillType === 'videoEmbed') {
      let imageId = `video-el-${id}-${deviceKey}`
      let html = svgUnitContent
      let percentage = width.replace('%', '')
      let imageProps = {}
      imageProps.style = {
        width: width
      }
      let backgroundProps = {}
      backgroundProps.style = {
        width: `${100 / percentage * 100}%`
      }

      if (percentageHeight) {
        percentageHeight = parseFloat(percentageHeight) + 10
        backgroundProps.style.paddingBottom = `${percentageHeight}%`
        html = this.changePercentageHeight(percentageHeight, svgUnitContent, position, viewBoxWidth, viewBoxHeight)
      } else {
        imageProps.style.height = `${parseFloat(height)}px`
      }

      return (
        <div className='vce-divider-with-video'>
          <svg className='vce-divider-svg'>
            <clipPath id={imageId} dangerouslySetInnerHTML={{ __html: html }} clipPathUnits='objectBoundingBox' />
          </svg>
          <div {...imageProps} className='vce-divider-video-block'>
            <div {...backgroundProps} className='vce-divider-video-background-block'>
              <div className='vce-divider-video-background-inner-block'
                data-vce-assets-video-embed={videoData.id}
                data-vce-assets-video-replacer='.vce-asset-video-embed-player'
                data-vce-assets-video-orientation-class='vce-asset-video-embed--state-landscape'>
                <svg className='vce-asset-video-embed-sizer' />
                <video className='vce-asset-video-embed-player'>
                  <source src={videoUrl} type='video/mp4' />
                </video>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
}