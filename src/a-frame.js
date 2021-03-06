import runtime from './core/runtime.js'
import checkDependencies from './a-frame/check-dependencies.js'
// components
import data3dComponent from './a-frame/component/data3d.js'
import furnitureComponent from './a-frame/component/furniture.js'
import tourComponent from './a-frame/component/tour.js'
import gBlockComponent from './a-frame/component/gblock.js'
// other
import inspectorPluginsLauncher from './a-frame/inspector-plugins-launcher.js'
import Data3dView from './a-frame/three/data3d-view.js'

// dependency check (for node.js compatibility)

checkDependencies({
  three: false,
  aFrame: true,
  onError: function (){
    // show aframe dependency warning, since it is unexpected to run aframe on server
    if (runtime.isBrowser) console.warn('AFRAME library not found: related features will be disabled.')
  }
}, function registerComponents () {

  // register components

  AFRAME.registerComponent('io3d-data3d', data3dComponent)
  AFRAME.registerComponent('io3d-furniture', furnitureComponent)
  AFRAME.registerComponent('tour', tourComponent)
  // check if gblock component has already been registered
  if (AFRAME.components.gblock) {
    // legacy warning in case gblock has been registered using https://github.com/archilogic-com/aframe-gblock/
    console.error('3dio.js error: Please remove any other "<script>" tags registering the "gblock" A-Frame component. This component is included in 3dio.js')
  } else {
    AFRAME.registerComponent('gblock', gBlockComponent)
  }


  // init plugin launcher

  inspectorPluginsLauncher.init()

})

// export

var aFrame = {
  three: {
    Data3dView: Data3dView
  }
}

export default aFrame