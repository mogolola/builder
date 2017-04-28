import $ from 'jquery'

$(() => {
  let $pluginRow = $(`[data-plugin="${window.vcvPluginName}"]`)
  if ($pluginRow.length) {
    let $deactivationLink = $pluginRow.find('.deactivate a')
    let noticeShown = false
    let template = $('#vcv-deactivation-notice-template').html()
    let showNotice = () => {
      noticeShown = true
      $(template).insertAfter($pluginRow)
    }

    $deactivationLink.click((e) => {
      if (!noticeShown) {
        e.preventDefault()
        showNotice()
      }
    })
    $(document).on('click', '.vcv-deactivation-submit-button', (e) => {
      e.preventDefault()
      $deactivationLink.get(0).click()
    })
  }
})