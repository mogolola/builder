import React from 'react'
import { getStorage, getService, env } from 'vc-cake'
import classNames from 'classnames'
import { getResponse } from 'public/tools/response'

const dataProcessor = getService('dataProcessor')
const settingsStorage = getStorage('settings')

export default class Permalink extends React.Component {
  static localizations = window.VCV_I18N && window.VCV_I18N()
  constructor (props) {
    super(props)

    let permalinkHtml = settingsStorage.state('permalinkHtml').get()
    let data = permalinkHtml ? Permalink.getPermalinkData(permalinkHtml) : null

    this.state = {
      baseUrlFirst: (data && data.baseUrlFirst) || null,
      baseUrlLast: (data && data.baseUrlLast) || null,
      permalink: (data && data.permalink) || null,
      permalinkFull: (data && data.permalinkFull) || null,
      editable: (data && data.editable) || false,
      value: (data && data.value) || null,
      urlFull: (data && data.urlFull) || null
    }

    this.preventNewLine = this.preventNewLine.bind(this)
    this.updateContent = this.updateContent.bind(this)
    this.updatePermalinkHtml = this.updatePermalinkHtml.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    settingsStorage.state('permalinkHtml').onChange(this.updatePermalinkHtml)
  }

  componentWillUnmount () {
    settingsStorage.state('permalinkHtml').ignoreChange(this.updatePermalinkHtml)
  }

  ajax (data, successCallback, failureCallback) {
    dataProcessor.appAllDone().then(() => {
      dataProcessor.appAdminServerRequest(data).then(successCallback, failureCallback)
    })
  }

  preventNewLine (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.nativeEvent.stopImmediatePropagation()
      event.stopPropagation()
      this.contentEditableElement.blur()
      this.updateContent(event)
    }
  }

  setNewPermalinkHtml (value) {
    this.ajax(
      {
        'vcv-action': 'settings:parseSlug:adminNonce',
        'vcv-post-name': value
      },
      this.loadSuccess.bind(this),
      this.loadFailed.bind(this)
    )
  }

  loadSuccess (request) {
    const responseData = getResponse(request)
    if (responseData && responseData.permalinkHtml) {
      settingsStorage.state('permalinkHtml').set(responseData.permalinkHtml)
    }
  }

  loadFailed (request) {
    const responseData = getResponse(request)
    if (env('VCV_DEBUG')) {
      console.warn(responseData)
    }
  }

  static getPermalinkData (permalinkHtml) {
    const range = document.createRange()
    const documentFragment = range.createContextualFragment(permalinkHtml)
    const editButtons = documentFragment.querySelector('#edit-slug-buttons')
    const full = documentFragment.querySelector('#editable-post-name-full')

    if (editButtons) {
      const url = documentFragment.querySelector('#sample-permalink a')
      const childNodes = url && url.childNodes
      return {
        editable: true,
        baseUrlFirst: childNodes && childNodes[ 0 ] && childNodes[ 0 ].textContent,
        baseUrlLast: childNodes && childNodes[ 2 ] && childNodes[ 2 ].textContent,
        permalink: childNodes && childNodes[ 1 ] && childNodes[ 1 ].innerHTML,
        permalinkFull: full && full.innerHTML,
        value: childNodes && childNodes[ 1 ] && childNodes[ 1 ].innerHTML
      }
    } else {
      const url = documentFragment.querySelector('#sample-permalink')
      return {
        editable: false,
        urlFull: url && url.innerText
      }
    }
  }

  updateContent (event) {
    this.focused = false
    const value = event.currentTarget.innerText
    if (value) {
      this.setNewPermalinkHtml(value)
    } else {
      event.currentTarget.innerText = this.state.value
    }
  }

  updatePermalinkHtml (permalinkHtml) {
    const permalinkData = permalinkHtml ? Permalink.getPermalinkData(permalinkHtml) : null
    if (permalinkData) {
      this.setState(permalinkData)
      settingsStorage.state('postName').set(permalinkData.permalinkFull)
    }
  }

  handleClick () {
    this.setState({
      value: this.state.permalinkFull
    })
  }

  render () {
    let permalinkClass = classNames({
      'vcv-permalink-container': true,
      'vcv-permalink-container--editable': this.state.editable
    })

    let content = ''
    if (this.state.editable) {
      content = (
        <React.Fragment>
          <span className='vcv-permalink-base-url'>
            {this.state.baseUrlFirst}
          </span>
          <span
            className='vcv-permalink-editable'
            onBlur={this.updateContent}
            onKeyDown={this.preventNewLine}
            onClick={this.handleClick}
            suppressContentEditableWarning
            contentEditable={this.state.editable}
            ref={span => { this.contentEditableElement = span }}
          >
            {this.state.value}
          </span>
          <span className='vcv-permalink-base-url'>
            {this.state.baseUrlLast}
          </span>
        </React.Fragment>
      )
    } else {
      content = (
        <span className='vcv-permalink-base-url'>
          {this.state.urlFull}
        </span>
      )
    }

    return <div className={permalinkClass}>
      <span className='vcv-permalink-text'>{Permalink.localizations ? Permalink.localizations.permalink : 'Permalink'}:&nbsp;</span>
      <span className='vcv-permalink-link'>
        {content}
      </span>
    </div>
  }
}
