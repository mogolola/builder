import React from 'react'

import PanelsContainer from './panelsContainer'
import NavbarContainer from './navbarContainer'
import Workspace from 'public/resources/components/workspace'
import {getStorage, env} from 'vc-cake'

const workspace = getStorage('workspace')
const workspaceSettings = workspace.state('settings')

export default class WorkspaceCont extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      content: false,
      settings: {}
    }
    this.setContent = this.setContent.bind(this)
    this.getNavbarPosition = this.getNavbarPosition.bind(this)
    this.setPanelSize = this.setPanelSize.bind(this)
    this.resetPanelSize = this.resetPanelSize.bind(this)
    this.updatePanel = this.updatePanel.bind(this)
  }
  componentDidMount () {
    workspace.state('content').onChange(this.setContent)
  }
  componentWillUnmount () {
    workspace.state('content').ignoreChange(this.setContent)
  }
  setContent (value, id) {
    const content = value || false
    this.setState({
      content: content,
      contentId: id || '',
      settings: workspace.state('settings').get() || {}
    })
  }

  getNavbarPosition (position) {
    this.positionChanged = this.navbarPosition !== position
    this.navbarPosition = position
    this.panel && this.navbar && this.positionChanged && this.updatePanel()
  }

  resetPanelSize () {
    if (this.panel) {
      this.panel.style.minWidth = ''
      this.panel.style.minHeight = ''
    }
  }

  setPanelSize () {
    switch (this.navbarPosition) {
      case 'left':
      case 'right':
        this.panel.style.minWidth = (window.innerWidth - this.navbar.getBoundingClientRect().width) + 'px'
        this.panel.style.minHeight = ''
        break
      case 'top':
      case 'bottom':
        this.panel.style.minHeight = (window.innerHeight - this.navbar.getBoundingClientRect().height) + 'px'
        this.panel.style.minWidth = ''
        break
      default:
        this.resetPanelSize()
    }
  }

  updatePanel () {
    let currentSettings = workspaceSettings.get()
    if (currentSettings && currentSettings.action && currentSettings.action === 'addHub') {
      this.setPanelSize()
      window.addEventListener('resize', this.setPanelSize)
    } else {
      this.resetPanelSize()
      window.removeEventListener('resize', this.setPanelSize)
    }
  }

  render () {
    const {content, contentId, settings} = this.state

    if (env('HUB_REDESIGN')) {
      this.updatePanel()
    }

    if (env('HUB_REDESIGN')) {
      return (
        <Workspace content={!!content}>
          <NavbarContainer getNavbarPosition={this.getNavbarPosition} wrapperRef={(navbar) => { this.navbar = navbar }} />
          <PanelsContainer
            content={content}
            settings={settings}
            contentId={contentId}
            wrapperRef={(panel) => {
              this.panel = panel
            }}
          />
        </Workspace>
      )
    }
    return (
      <Workspace content={!!content}>
        <NavbarContainer />
        <PanelsContainer
          content={content}
          settings={settings}
          contentId={contentId}
        />
      </Workspace>
    )
  }
}
