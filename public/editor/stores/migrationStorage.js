import { addStorage, getStorage, getService } from 'vc-cake'

addStorage('migration', (storage) => {
  const cook = getService('cook')
  const utils = getService('utils')
  const elementsStorage = getStorage('elements')

  storage.on('migrateContent', (contentData) => {
    window.setTimeout(() => {
      if (!contentData._migrated) {
        const textElement = cook.get({ tag: 'textBlock', output: utils.wpAutoP(contentData.content, '__VCVID__') })
        if (textElement) {
          elementsStorage.trigger('add', textElement.toJS())
        }
      } else {
        let elements = storage.state('elements').get()
        let elementsArray = []
        for (let key in elements) {
          if (elements.hasOwnProperty(key)) {
            elementsArray.push(elements[ key ])
          }
        }
        elementsArray.sort((first, second) => first.element.order - second.element.order)
        elementsArray.forEach((element) => {
          elementsStorage.trigger('add', element.element, element.wrap, element.options)
        })
      }
    }, 150)
    // Timeout needed to be last in the call-stack
  })

  storage.on('add', (element, wrap = true, options = {}) => {
    let elements = storage.state('elements').get() || {}
    elements[ element.id ] = { element: element, wrap: wrap, options: options }
    storage.state('elements').set(elements)
  })

  storage.on('update', (id, element) => {
    let elements = storage.state('elements').get() || {}
    if (!elements[ id ]) {
      console.warn('Update called for wrong element', element)
    }
    elements[ id ].element = element
    storage.state('elements').set(elements)
  })
})
