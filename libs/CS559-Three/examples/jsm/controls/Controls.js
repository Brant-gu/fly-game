// ./libs/CS559-Three/examples/jsm/controls/Controls.js
import { EventDispatcher } from "three";

/**
 * Minimal base class for controls used by FlyControls/others.
 * Compatible with three/examples style controls that expect:
 * - object, domElement
 * - enabled
 * - connect()/disconnect()
 * - dispatchEvent() via EventDispatcher
 */
class Controls extends EventDispatcher {
  /**
   * @param {import("three").Object3D} object
   * @param {?HTMLElement} domElement
   */
  constructor(object, domElement = null) {
    super();
    this.object = object;
    this.domElement = domElement;
    this.enabled = true;
  }

  /**
   * @param {HTMLElement} domElement
   */
  connect(domElement) {
    this.domElement = domElement;
  }

  disconnect() {
    // subclasses remove listeners
  }

  dispose() {
    this.disconnect();
  }
}

export { Controls };
