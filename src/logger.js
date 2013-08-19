
/**
 * @file logger.js
 * @description console.log debug
 */

;(function(root) {

  'use strict';

  /**
   * @private startedAt
   * @description file init time
   */

  var startedAt = new Date().getTime();

  /**
   * @private _padMilliseconds
   * @description pads timer with up to six zeroes
   * @param {Number} milliseconds milliseconds to pad
   */

  function _padMilliseconds(milliseconds) {
    var max = '000000';
    return (max + milliseconds).slice(-(max.length));
  }

  /**
   * @private _elapsed
   * @description determine elapsed time since init
   * @return {Number} milliseconds into app run time
   */

  function _elapsed() {
    return (new Date().getTime() - startedAt);
  }

  /**
   * @description augment console with debug, main module object
   */

  var Logger = {

    log: function(args) {
      var log, message = args[0];
      args[0] = ('DEBUG [' + _padMilliseconds(_elapsed()) + '] > ') + message;
      log = Function.prototype.bind.call(console.log, console);
      log.apply(console, args);
    }

  };

  /**
   * @description attach obj to root
   */

  root.Logger = Logger;
  
}(window));
