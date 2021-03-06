import clone from 'lodash/clone'

export default {
  schema: {
    autoStart: {
      type: 'boolean',
      default: true
    },
    loop: {
      type: 'boolean',
      default: true
    },
    wait: {
      type: 'number',
      default: 2000
    },
    move: {
      type: 'number',
      default: 3000
    }
  },

  init: function () {
    this._currentWayPoint = -1
    this.el.setAttribute('animation__move', { startEvents: 'doNotFire', pauseEvents: 'pauseTour', resumeEvents:'resumeTour', property: 'position', easing: 'easeInOutSine', dur: 100 })
    this.el.setAttribute('animation__turn', { startEvents: 'doNotFire', pauseEvents: 'pauseTour', resumeEvents:'resumeTour', property: 'rotation', easing: 'easeInOutSine', dur: 100 })
    this._nextWaypointHandler = this._nextWaypoint.bind(this)
  },

  update: function () {
    this._waypoints = Array.from(this.el.querySelectorAll('[tour-waypoint]'))

    if(this.data.autoStart) {
      this.playTour()
    }
  },

  playTour: function () {
    if (this._isPlaying) {
      if(this._isChangingAnimation) {
        clearTimeout(this._nextAnimationTimeout)
        this.goTo(this._waypoints[this._currentWayPoint].getAttribute('tour-waypoint'), this._isPlaying)
      } else {
        this.el.dispatchEvent(new CustomEvent('resumeTour'))
      }
      this._isPaused = false
    } else {
      this._isPlaying = true
      this._isPaused = false
      this.el.addEventListener('animation__move-complete', this._nextWaypointHandler)
      var next = this._waypoints[++this._currentWayPoint]
      if (next) this.goTo(next.getAttribute('tour-waypoint'), true)
      else if (this.data.loop) {
        this._currentWayPoint = 0
        this.goTo(this._waypoints[0].getAttribute('tour-waypoint'), true)
      }
    }
  },

  pauseTour: function () {
    this._isPaused = true
    this.el.dispatchEvent(new CustomEvent('pauseTour'))
  },

  stopTour: function () {
    this.pauseTour()
    this.el.removeEventListener('animation__move-complete', this._nextWaypointHandler)
    this._isPlaying = false
    this._isPaused = false
  },

  goTo: function (label, keepPlaying) {
    this._isPlaying = !!keepPlaying
    var target = this._waypoints.find(function (item) { return item.getAttribute('tour-waypoint') === label })
    if (!target) {
      console.error('The given waypoint '+ label + ' does not exist. Available waypoints:', this._waypoints.map(function (elem) { elem.getAttribute('tour-waypoint') }))
      return
    }

    this.animate(target)
  },

  setViewPoint: function (mode) {
    var HEIGHT_PERSON = 1.4
    var HEIGHT_BIRDS_EYE = 7
    var ANGLE_PERSON = 0
    var ANGLE_BIRDS_EYE = -60
    if (['person', 'bird'].indexOf(mode) < -1) {
      console.error('not supported camera mode: ' + mode)
      return
    }
    this._isPlaying = false
    var pos = clone(this.el.getAttribute('position'))
    var rot = clone(this.el.getAttribute('rotation'))
    pos.y = mode === 'person' ? HEIGHT_PERSON : HEIGHT_BIRDS_EYE
    rot.x = mode === 'person' ? ANGLE_PERSON : ANGLE_BIRDS_EYE
    var target = {
      position: AFRAME.utils.coordinates.stringify(pos),
      rotation: AFRAME.utils.coordinates.stringify(rot)
    }
    this.animate(target)
  },

  animate: function (bookmark) {
    var isDomElement = isElement(bookmark)
    var entity = this.el
    var newPosition = isDomElement ? bookmark.getAttribute('position') : bookmark.position
    var newRotation = isDomElement ? bookmark.getAttribute('rotation') : bookmark.rotation
    var currentPosition = entity.getAttribute('position')
    var currentRotation = entity.getAttribute('rotation')
    var startPosition = AFRAME.utils.coordinates.stringify(currentPosition)
    var startRotation = AFRAME.utils.coordinates.stringify(currentRotation)

    // compute distance to adapt speed
    var d = dist(currentPosition, AFRAME.utils.coordinates.parse(newPosition))
    // compute angle difference to adapt speed
    var angle = Math.abs(currentRotation.y - AFRAME.utils.coordinates.parse(newRotation).y)
    // compute animation time
    // add 1 to the this.data.move parameter to allow users to specify 0 without the animation cancelling out
    var t = Math.round((this.data.move === undefined ? 3000 : this.data.move + 1) / 6 * (d + angle / 30))
    if (t > Math.max(10000, this.data.move)) t = Math.max(10000, this.data.move)

    // prevent zero length animation
    if (!t) return this._nextWaypoint()

    entity.components.animation__move.pauseAnimation()
    entity.components.animation__turn.pauseAnimation()
    entity.components.animation__move.data.dur = t
    entity.components.animation__move.data.from = startPosition
    entity.components.animation__move.data.to = newPosition
    entity.components.animation__move.update()
    entity.components.animation__turn.data.dur = t
    entity.components.animation__turn.data.from = startRotation
    entity.components.animation__turn.data.to = newRotation
    entity.components.animation__turn.update()
    entity.components.animation__move.resumeAnimation()
    entity.components.animation__turn.resumeAnimation()
    this._isChangingAnimation = false
  },

  _nextWaypoint: function () {
    if (!this._isPlaying) return this.stopTour()
    if (this._currentWayPoint === this._waypoints.length - 1) {
      if (!this.data.loop) return
      this._currentWayPoint = -1
    }
    this._isChangingAnimation = true
    var next = this._waypoints[++this._currentWayPoint]
    this._nextAnimationTimeout = setTimeout(function () { this.goTo(next.getAttribute('tour-waypoint'), this._isPlaying) }.bind(this), this.data.wait === undefined ? 0 : this.data.wait)
  }
}

function dist(p, q) {
  var a = parseFloat(q.x) - parseFloat(p.x)
  var b = parseFloat(q.y) - parseFloat(p.y)
  var c = parseFloat(q.z) - parseFloat(p.z)
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) + Math.pow(c, 2))
}

// Returns true if it is a DOM element
// https://stackoverflow.com/a/384380/2835973
function isElement(o){
  var DOM_ELEMENT = 1
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
      o && typeof o === "object" && o !== null && o.nodeType === DOM_ELEMENT && typeof o.nodeName==="string"
  );
}