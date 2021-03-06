import React from 'react'
import { getStorage, env } from 'vc-cake'

const settingsStorage = getStorage('settings')
const workspaceStorage = getStorage('workspace')
const workspaceIFrame = workspaceStorage.state('iframe')

export default class TitleSettings extends React.Component {
  constructor (props) {
    super(props)
    let pageTitle = settingsStorage.state('pageTitle').get()
    let pageTitleDisabled = settingsStorage.state('pageTitleDisabled').get()
    this.state = {
      current: pageTitle,
      disabled: pageTitleDisabled,
      showToggle: this.getShowToggle()
    }
    this.updateTitle = this.updateTitle.bind(this)
    this.updateTitleToggle = this.updateTitleToggle.bind(this)
    this.onIframeChange = this.onIframeChange.bind(this)
    this.getShowToggle = this.getShowToggle.bind(this)
    this.getThemeType = this.getThemeType.bind(this)
    this.checkShowToggle = this.checkShowToggle.bind(this)
    this.updateShowToggle = this.updateShowToggle.bind(this)
    this.updatePageTitle = this.updatePageTitle.bind(this)
    workspaceIFrame.onChange(this.onIframeChange)
  }

  componentDidMount () {
    settingsStorage.state('pageTitle').onChange(this.updatePageTitle)
  }

  componentWillUnmount () {
    workspaceIFrame.ignoreChange(this.onIframeChange)
    settingsStorage.state('pageTitle').ignoreChange(this.updatePageTitle)
  }

  checkShowToggle (themeType) {
    return themeType === 'theme'
  }

  getShowToggle () {
    return (window.vcvLastLoadedPageTemplate && window.vcvLastLoadedPageTemplate.type === 'theme') || (window.VCV_PAGE_TEMPLATES_LAYOUTS_CURRENT && window.VCV_PAGE_TEMPLATES_LAYOUTS_CURRENT().type === 'theme')
  }

  getThemeType () {
    return (window.vcvLastLoadedPageTemplate && window.vcvLastLoadedPageTemplate.type) || (window.VCV_PAGE_TEMPLATES_LAYOUTS_CURRENT && window.VCV_PAGE_TEMPLATES_LAYOUTS_CURRENT().type)
  }

  updateShowToggle (themeType) {
    let toggleCheckResult = this.checkShowToggle(themeType)
    if (toggleCheckResult !== this.state.showToggle) {
      this.setState({
        showToggle: toggleCheckResult
      })
    }
  }

  onIframeChange (data = {}) {
    let { type = 'loaded' } = data
    if (type === 'reload') {
      data && data.template && data.template.type && this.updateShowToggle(data.template.type)
    }
  }

  updateTitle (event) {
    let { disabled } = this.state
    let newDisabled = false
    const newValue = event.target.value
    if (newValue) {
      if (!this.state.current) {
        newDisabled = false
      }
    } else {
      newDisabled = true
    }

    let newVar = {
      current: newValue
    }
    if (disabled !== newDisabled) {
      newVar[ 'disabled' ] = newDisabled
      settingsStorage.state('pageTitleDisabled').set(newDisabled)
    }
    this.setState(newVar)
    settingsStorage.state('pageTitle').set(newValue)
  }

  updatePageTitle (title) {
    if (title || title === '') {
      this.setState({ current: title })
    }
  }

  updateTitleToggle (event) {
    const checked = event.target.checked
    this.setState({
      disabled: checked
    })

    settingsStorage.state('pageTitleDisabled').set(checked)
  }

  render () {
    const localizations = window.VCV_I18N && window.VCV_I18N()
    const settingName = localizations ? localizations.title : 'Title'
    const pageTitleDisableDescription = localizations ? localizations.pageTitleDisableDescription : 'Disable page title'
    let checked = (this.state.disabled) ? 'checked' : ''

    let toggleHTML = null
    if (this.state.showToggle) {
      toggleHTML = (
        <div className='vcv-ui-form-group vcv-ui-form-group-style--inline'>
          <div className='vcv-ui-form-switch-container'>
            <label className='vcv-ui-form-switch'>
              <input type='checkbox' onChange={this.updateTitleToggle} id='vcv-page-title-disable' checked={checked} />
              <span className='vcv-ui-form-switch-indicator' />
              <span className='vcv-ui-form-switch-label' data-vc-switch-on='on' />
              <span className='vcv-ui-form-switch-label' data-vc-switch-off='off' />
            </label>
            <label htmlFor='vcv-page-title-disable'
              className='vcv-ui-form-switch-trigger-label'>{pageTitleDisableDescription}</label>
          </div>
        </div>
      )
    }
    const disableTitleToggleControl = !env('VCV_JS_THEME_EDITOR') ? toggleHTML : ''

    return (
      <React.Fragment>
        <div className='vcv-ui-form-group vcv-ui-form-group-style--inline'>
          <span className='vcv-ui-form-group-heading'>{settingName}</span>
          <input type='text' className='vcv-ui-form-input' value={this.state.current} onChange={this.updateTitle} onBlur={this.handleBlur} />
        </div>
        {disableTitleToggleControl}
      </React.Fragment>
    )
  }
}
