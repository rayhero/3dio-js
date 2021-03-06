import runtime from '../../core/runtime.js'

// TODO: extend this for bakedModel
var validTypes = [
  'interior',
  'group',
  'level',
  'plan'
]

export default function toHtml(sceneStructure, options) {
  if (!sceneStructure) {
    console.error('nothing to convert')
    return
  }
  // check if the request was made by a browser
  runtime.assertBrowser()

  // api
  options = options || {}
  var isArray = Array.isArray(sceneStructure)
  sceneStructure = isArray ? sceneStructure : [sceneStructure]

  // start parsing
  var html = getHtmlFromSceneStructure(sceneStructure)
  return isArray ? html : html[0]
}

// recursive parsing through sceneStructre
function getHtmlFromSceneStructure(sceneStructure, parent) {
  var collection = parent ? null : [] // use collection or parent
  sceneStructure.forEach(function(element3d) {
    if (validTypes.indexOf(element3d.type) > -1) {
      var el = addEntity({
        attributes: getAttributes(element3d),
        parent: parent
      })
      if (element3d.children && element3d.children.length) getHtmlFromSceneStructure(element3d.children, el)
      if (collection) collection.push(el)
    }
  })
  return collection
}

// get html attributes from element3d params
function getAttributes(element3d) {
  var attributes = {
    'io3d-uuid': element3d.id,
    position: element3d.x + ' ' + element3d.y + ' ' + element3d.z,
    rotation: '0 ' + element3d.ry + ' 0'
  }
  if (element3d.type === 'interior') {
    attributes['io3d-furniture'] = {id: element3d.src.substring(1)}
    attributes['shadow'] = {cast: true, receive: false}
  }

  return attributes
}

function addEntity(args) {
  var
    tag = args.tag || 'a-entity',
    parent = args.parent,
    attributes = args.attributes || {}

  var el = document.createElement(tag)

  Object.keys(attributes).forEach(function(key) {
    el.setAttribute(key, attributes[key])
  })

  if (parent) return parent.appendChild(el)
  else return el
}