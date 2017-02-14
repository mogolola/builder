/* global vcv */
/* global vceAssetsBackgroundSlider */
vcv.on('ready', function (action, id) {
  if (action !== 'merge') {
    var selector = '[data-vce-assets-slider]';
    selector = id ? '[data-vcv-element="' + id + '"] ' + selector : selector;
    vceAssetsBackgroundSlider(selector);
  }
});