
/**
 * @library Laser.js
 * @author Edward Hotchkiss <edward@candidblend.la>
 * @contributor Lindsey Mysse <lindsey.mysse@gmail.com>
 * @contributor Peng Wang <peng@useallfive.com>
 * @description Laser-precision animation sequencing & timing.
 * @license MIT
 */

(function(window, undefined) {

  'use strict';

  /**
   * Laser.
   * @constructor Laser
   * @global
   * @namespace
   * @param {Object} params
   */

  var Laser = window.Laser = function Laser(params) {
    _.extend(this, params);
    this.listeners = {};
    this.state = 'blank';
    this.animations = [];
    this.direction = 'forward';
    this.transition = _isTransition;
    this.DEBUG = this.DEBUG ||
      (/http(s)?:\/\/(localhost:8888|[^\/]+.local|192\.168\.1\..*)\//).test(window.location);
    this.console = (typeof(window.console) === 'object');
    return this;
  };

  /**
   * Never wrap a selector into a jQuery object more than once per page.
   * @memberof Laser
   * @private
   * @type {Object.<external:jQuery>}
   */

  var _cachedElements = {};

  /**
   * Div element to pull attributes from based on vendor.
   * @memberof Laser
   * @private
   * @type {Element}
   */

  var _div = document.createElement('div');

  /**
   * List of div style attributes.
   * @memberof Laser
   * @private
   * @type {Object}
   */

  var _objList = _div.style;

  /**
   * CSSOM prefixes.
   * @constant
   * @memberof Laser
   * @private
   * @type {Array.<string>}
   */

  var _omPrefixes = [
    '',
    'webkit',
    'Moz',
    'o',
    'ms'
  ];

  /**
   * A hacky and brittle way to assign transition events. because of shitty
   * garbage collection/event overwriting use "setTimeout" instead :/
   * @constant
   * @example $element.on(_transitionendEvents, function) to assign events
   * @memberof Laser
   * @private
   * @type {string}
   */

  var _transitionend = [
    'webkitTransitionEnd',
    'oTransitionEnd',
    'otransitionend',
    'transitionend',
    'msTransitionEnd'
  ].join(' ');

  /**
   * List of CSS3 transform types.
   * @constant
   * @memberof Laser
   * @private
   * @type {Array.<string>}
   */

  var _transformTypes = [
    'matrix',
    'matrix3d',
    'translate',
    'translate3d',
    'translateX',
    'translateY',
    'translateZ',
    'scale',
    'scale3d',
    'scaleX',
    'scaleY',
    'scaleZ',
    'rotate',
    'rotate3d',
    'rotateX',
    'rotateY',
    'rotateZ',
    'skew',
    'skewX',
    'skewY',
    'perspective'
  ];

  /**
   * @memberof Laser
   * @private
   * @type {external:jQuery}
   */

  var _$head;

  /**
   * @memberof Laser
   * @private
   * @static
   * @type {boolean}
   */

  var _isIE9 = (/MSIE 9\.0/).test(navigator.userAgent);
  /**
   * Determine whether to use style updates instead of jQuery.animate.
   * @memberof Laser
   * @private
   * @static
   * @type {boolean}
   */

  var _isTransition = !_isIE9;

  /**
   * @memberof Laser
   * @param {string} selector
   * @private
   * @return {external:jQuery}
   */

  function _getCachedElement(selector) {
    return _cachedElements[selector];
  }

  /**
   * First checks for cached jQuery element by selector, otherwise caches
   * reference to the jQuery element.
   * @memberof Laser
   * @param {string} selector
   * @private
   * @return {external:jQuery}
   */

  function _setCachedElement(selector) {
    _cachedElements[selector] = _getCachedElement(selector) || $(selector);
    return _cachedElements[selector];
  }

  /**
   * Pads timer with up to six zeroes.
   * @memberof Laser
   * @param {number} milliseconds
   * @private
   * @return {number}
   */
  function _padMilliseconds(milliseconds) {
    var max = '000000';
    return (max + milliseconds).slice(-(max.length));
  }

  /**
   * Invalid easing method aliases bork .animate/.transition. Check that the
   * alias exists in the dictionary.
   * @memberof Laser
   * @param {string} alias
   * @private
   * @return {boolean}
   */

  function _isValidEasing(alias) {
    if (_isTransition) {
      return ($.cssEase[alias] !== undefined) ? true : false;
    } else {
      return ($.easing[alias] !== undefined) ? true : false;
    }
  }

  /**
   * Takes an attr value, depending on attr type, returns the type if missing
   * @memberof Laser
   * @param {string|number} val - User passed value to parse.
   * @param {string|number} currentVal
   * @param {string} unit - 'px'/'%'
   * @private
   * @return {string} [description]
   */

  function _formatUnit(val, currentVal, unit) {
    var result, relativeUnit;
    if (typeof(val) === 'string') {
        relativeUnit = val.match(/^(-|\+)|(=)|([0-9]+$)/g);
        if (unit === '') {
            result = val;
        } else if (relativeUnit && relativeUnit.length === 3) {
            currentVal = currentVal.replace(/deg|px/, '');
            if (relativeUnit[0] === '-') {
                result = (currentVal - relativeUnit[2]) + unit;
            } else if (relativeUnit[0] === '+') {
                result = (currentVal + relativeUnit[2]) + unit;
            }
        } else if (!/^[0-9]+$/.test(val)) {
            result = val;
        }
    } else {
        result = (val.toString() + unit);
    }
    return result;
  }

  /**
   * Generate a unique id, prefixed with "tr_"
   * @memberof Laser
   * @private
   * @return {number} Id.
   */

  function _id() {
    return _.uniqueId('laser_tr_');
  }

  /**
   * @memberof Laser
   * @param {string} string
   * @private
   * @return {string}
   */

  function _camelCase(string) {
    return string.replace( /-([a-z])/ig, function(all, letter) {
      return letter.toUpperCase();
    });
  }

  /**
   * Capitalize string's first letter.
   * @memberof Laser
   * @param {string} string
   * @private
   * @return {string}
   */

  function _upperCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * @memberof Laser
   * @param {string} prop
   * @private
   * @return {string}
   * @todo TODO: Consider using Modernizr.
   */

  function _getPrefix(prop) {
    var prefix, propBrowserTest = _camelCase(prop);
    _.each(_omPrefixes, function(val) {
      if (_objList[(val + _upperCase(propBrowserTest))] === '') {
        prefix = { css : '-' + val.toLowerCase()+'-', om : val };
      }
      if (_objList[prop.toLowerCase()] === '') {
        prefix = { css : '', om : '' };
      }
    });
    return prefix;
  }

  /**
   * @memberof Laser
   * @param {string} prop
   * @private
   * @return {Object.<string>} Containing CSS and CSSOM prefix.
   */

  function _getPropertyName(prop) {
    return {
      css : _getPrefix(prop).css + prop.toLowerCase(),
      om  : _getPrefix(prop).om + prop
    };
  }

  /**
   * Generates transition property list.
   * @memberof Laser
   * @param {Object} params
   * @param {Object} startParams
   * @param {number} duration
   * @param {string} easing
   * @private
   * @return {Object}
   */

  function _createTransitionCSS(params, startParams, duration, easing) {
    var css = _createAnimationCSS(params, startParams);
    css[_getPropertyName('transition-duration').css] = _formatDuration(duration);
    css[_getPropertyName('transition-timing-function').css] = $.cssEase[easing];
    return css;
  }

  /**
   * @memberof Laser
   * @param {Object} params
   * @param {Object} startParams
   * @param {boolean=} [prefixed=true]
   * @private
   * @return {Object}
   */

  function _createAnimationCSS(params, startParams, prefixed) {
    var cur, unit, transformString;
    var css = {};
    prefixed = (prefixed === null) ? true : prefixed;
    _.each(params, function(val, key) {
      cur = startParams[key];
      if (_.contains(_transformTypes, key)) {
        unit = (key === 'perspective') ? 'px' : 'deg';
        unit = (key === 'scale') ? '' : unit;
        if (transformString === '') {
          transformString += ' ' + key + '(' + _formatUnit(val, cur, unit) + ') ';
        } else {
          transformString = key + '(' + _formatUnit(val, cur, unit) + ') ';
        }
      } else {
        unit = (key === 'opacity') ? '' : 'px';
        css[prefixed ? _getPropertyName(key).css : key] =  _formatUnit(val, cur, unit);
      }
    });
    if (transformString !== undefined) {
      css[prefixed ? _getPropertyName('Transform').css : 'transform'] =  transformString;
    }
    return css;
  }

  /**
   * To seconds, then to string with trailing "s".
   * @param {number} duration - Time in milliseconds.
   * @private
   * @return {string} css3 animation formated time.
   */

  function _formatDuration(val) {
    if (typeof(val) === 'string' && !/^[0-9]+$/.test(val)) {
      return val;
    }
    return (val / 1000) + 's';
  }

  /**
   * @param {string} val
   * @private
   * @return {boolean}
   */

  function _isTransform(val) {
    return (/(rotate|scale)/).test(val);
  }

  /**
   * Gets full css path of a jQuery object.
   * @memberof Laser
   * @param {string} selector
   * @private
   * @return {string} Full path with selector.
   */

  function _getCSSPath(selector) {
    var path, elem = $(selector)[0];
    if (elem.id) {
      return "#" + elem.id;
    }
    if (elem.tagName === 'BODY') {
      return '';
    }
    path = _getCSSPath(elem.parentNode);
    if (elem.className) {
      return path + " " + elem.tagName + "." + elem.className;
    }
    return path + " " + elem.tagName;
  }

  /**
   * @private
   * @description constructor fn
   */

  /**
   * @constructor Animation
   * @param {Object} params
   */

  var Animation = function Animation(params) {
    _.extend(this, params);

    /**
     * @default
     * @memberof Animation
     * @type {string}
     */
    
    this.state = 'ON_STACK';
    
    /**
     * @memberof Animation
     * @type {string}
     */
    
    this.originalStyle = this.$elem.attr('data-original-style');
    if (this.originalStyle === undefined) {
      this.originalStyle = this.$elem.attr('style');
      this.$elem.attr('data-original-style', this.originalStyle);
    }
    return this;
  };

  Animation.prototype = {

    /**
     * Get current values of animations params to maintain state.
     * @return {Object} Key/value pairs of animated param keys with their current values.
     */

    getCurrentParams: function() {
      var params = {};
      _.forEach(this.params, function(val, key) {
        if (_isTransform(key)) {
          params.transform = this.$elem.css(key);
        }
        params[key] = this.$elem.css(key);
      }, this);
      return params;
    },

    /**
     * Plays animation, either with jQuery.animate or a CSS3 transition.
     */

    play: function() {

      /**
       * @memberof Animation
       * @type {Object}
       */
      
      this.startParams = this.getCurrentParams();
      this.state = 'PLAYING';
      
      /**
       * @memberof Animation
       * @type {boolean}
       */
      
      this.active = true;
      if (_isTransition) {
        this.transition();
      } else {
        this.animate();
      }
    },

    /**
     * On complete callback.
     */

    complete: function() {
      
      /**
       * @memberof Animation
       * @type {Laser}
       */
      
      this.sequence.trigger('animation:completed', this);
      this.state = 'COMPLETED';
      this.active = false;
    
    },

    /**
     * @memberof Animation
     * @type {string}
     */

    pause: function() {
      this.pausedStyle = this.$elem.attr('style');
      _.forEach(this.getCurrentParams(), function(val, key) {
        this.$elem.css(key, this.$elem.css(key));
      }, this);
      this.$elem.removeClass(this.id);
      this.state = 'PAUSED';
    },

    /**
     * resumes a transition from last play state.
     */

    resume: function() {
      this.$elem.addClass(this.id);
      _.forEach(this.getCurrentParams(), function(val, key) {
        this.$elem.css(key, '');
      }, this);
      this.completeTimeout = setTimeout(_.bind(function() {
        this.complete();
      }, this), this.options.duration);
      this.state = 'PLAYING';
    },

    /**
     * returns transition to its original state.
     */

    rewind: function() {
      this.$elem.addClass('rewind-shim');
      this.$elem.removeClass(this.id);
      this.completeTimeout = setTimeout(_.bind(function() {
        this.complete();
        this.$elem.removeClass('rewind-shim');
      }, this), this.options.duration);
    },

    /**
     * Animate item's properties using jQuery fallback.
     */

    animate: function() {
      var params, transformName, customEasing;
      this.options.queue = false;
      this.options.complete = _.bind(function() {
        this.sequence.trigger('animation:completed', this);
        this.state = 'COMPLETED';
        this.active = false;
      }, this);
      if (!this.$elem.length) {
        // Skip if nothing animatable.
        this.options.complete();
      } else if (this.params.display) {
        // Skip to using `css` if property isn't animatable.
        this.$elem.css('display', this.params.display);
        this.options.complete();
      } else {
        if (this.options.easing) {
          // Convert css cubic-bezier easing to jQuery easing.
          customEasing = $.easing[this.options.easing];
          if (_.isString(customEasing) && customEasing.indexOf('cubic-bezier') === 0) {
            this.options.easing = $.bez(customEasing.match((/-?\d?\.\d+/g)));
          }
        }
        params = _createAnimationCSS(this.params, this.startParams, false);
        this.sequence.log(this.selector, params, this.options);
        this.$elem
          .delay(this.options.when)
          .animate(params, this.options);
      }
    },

    /**
     * animate item's properties using css3 transition.
     */

    transition: function() {
      this.$elem.css(_createTransitionCSS(
        this.params,
        this.startParams,
        this.options.duration,
        this.options.easing
      ));
      this.completeTimeout = setTimeout(_.bind(function() {
        this.complete();
      }, this), this.options.duration);
    }

  };

  Laser.prototype = {

    /**
     * determine elapsed time in ms of sequence playback.
     * @return {number}
     */

    elapsed: function() {
      return (new Date().getTime() - this.startedAt);
    },

    /**
     * debug log.
     * @param {string} message - Value label.
     */

    log: function(message) {
      if (!this.console || !this.DEBUG) {
        return;
      }
      var log, args, name;
      name = this.name || 'NO NAME';
      args = Array.prototype.slice.call(arguments);
      args[0] = ('LASER [' + _padMilliseconds(this.elapsed()) + '] > ') + message + ' "' + name + '"';
      if (_isIE9) {
        _.each(_.rest(arguments), function(arg, idx) {
          if ($.isPlainObject(arg)) {
              args[idx + 1] = window.JSON.stringify(arg);
          }
        });
      }
      log = Function.prototype.bind.call(console.log, console);
      log.apply(console, args);
    },

    /**
     * instance attribute getter.
     * @param {string} attr - Instance attribute.
     * @param {Object} where - Set of key/values to match.
     * @return {*}
     */

    get: function(attr, where) {
      if (where === undefined) {
        return this[attr];
      } else {
        return _.where(this[attr], where);
      }
    },

    /**
     * instance attribute setter.
     * @param {string} attr - Instance attribute.
     * @param {Object} where - Set of key/values to match.
     * @param {Object} params - Set of key/values to set.
     * @return {*}
     */

    set: function(attr, where, params) {
      var item = this.get(attr, where);
      if (item === undefined) {
        return undefined;
      } else {
        _.forEach(params, function(val, key) {
          item[key] = val;
        }, this);
        return item;
      }
    },

    /**
     * add event listener.
     * @param {string} name - Event name.
     * @param {Function} fn - Trigger function to store.
     * @return {Laser} Instance for chaining.
     */

    on: function(name, fn) {
      this.listeners[name] = this.listeners[name] || [];
      this.listeners[name].push(fn);
      return this;
    },

    /**
     * remove event listener.
     * @param {string} name - Event name.
     * @param {Function} fn - Trigger function to remove.
     * @return {Laser} Instance for chaining.
     */

    off: function(name, fn) {
      if (this.listeners[name]) {
        this.listeners[name].splice(this.listeners[name].indexOf(fn), 1);
      } else {
        this.listeners = {};
        if (_.isArray(this.timers)) {
          _.each(this.timers, function(timeout) {
            clearTimeout(timeout);
          });
        }
      }
      return this;
    },

    /**
     * trigger event listener.
     * @param {string} name - Event name.
     * @return {Laser} Instance for chaining.
     */

    trigger: function(name) {
      if (this.listeners[name]) {
        var args = Array.prototype.slice.call(arguments, 1);
        _.forEach(this.listeners[name], function(val, index, obj) {
          val.apply(this, args);
        }, this);
      }
      return this;
    },

    /**
     * sets up params via arguments for a new Animation object to push onto the
     * sequence stack.
     * @param {string} selector - Css selector for element to animate.
     * @param {Object} params - jQuery standard animation parameters.
     * @param {Object} options - Animation options.
     * @return {Laser} Instance for chaining.
     */

    add: function(selector, params, options) {
      var when, sequence = this, $elem = _setCachedElement(selector);
      when = (options.when || 0);
      options.easing = (options.easing || 'easeOutExpo');
      if (!_isValidEasing(options.easing)) {
        if (!_isValidEasing('easeOutExpo')) {
          throw new Error('Unknown easing method! - ' + options.easing);
        } else {
          options.easing = 'easeOutExpo';
        }
      }
      options.duration = options.duration || 500;
      this.animations.push(
        new Animation({
          id       : _id(),
          when     : when,
          active   : false,
          params   : params,
          options  : options,
          sequence : sequence,
          selector : selector,
          $elem    : $elem
        })
      );
      return this;
    },

    /**
     * add either a css3 cubic-bezier ease or a jquery easing fn.
     * @param {string} alias
     * @param {string|Function} easing
     * @return {Laser} Instance for chaining.
     */

    addEasing: function(alias, easing) {
      if (_isTransition) {
        $.cssEase[alias] = easing;
      } else {
        $.easing[alias] = easing;
      }
      return this;
    },

    /**
     * on animations all played out, check for a padded sequence ending,
     * regardless trigger sequence complete.
     */

    onAnimated: function() {
      if (this.padTime) {
        setTimeout(_.bind(function() {
          this.log('sequence completed');
          this.trigger('sequence:completed');
        }, this), this.padTime);
      } else {
        this.log('sequence completed');
        this.trigger('sequence:completed');
      }
    },

    /**
     * as animations are completed, trigger user listeners, check remaining and
     * note Animation state.
     * @param {Animation} animation
     */

    onAnimationComplete: function(animation) {
      this.remaining--;
      //this.log('completed: '+animation.selector, 'remaining: '+this.remaining);
      if (this.remaining === 0) {
        this.trigger('sequence:animated');
      }
      if (this.remaining < 0 && window.console) {
        console.warn('Remaining animations count should not be below 0', this.name);
      }
    },

    /**
     * plays animation sequence.
     * @return {Laser} Instance for chaining.
     */

    start: function() {
      if (this.getState() === 'paused') {
        return this.resume();
      }
      var animations = this.get('animations');
      this.startedAt = new Date().getTime();
      this.remaining = animations.length;
      this.trigger('sequence:started', this.remaining);
      this.log('starting sequence');
      _.forEach(animations, function(val, index) {
        val.whenTimeout = setTimeout(_.bind(function() {
          val.play();
        }, this), val.when);
      }, this);
      this.on('sequence:animated', function() {
        this.onAnimated();
        this.log('animated sequence');
      });
      this.on('animation:completed', function(animation) {
        this.onAnimationComplete(animation);
      });
      this.state = 'playing';
      return this;
    },

    /**
     * pad an animation sequences' ending
     * @param {number}
     * @return {Laser} Instance for chaining.
     */

    wait: function(milliseconds) {
      this.padTime = milliseconds;
      return this;
    },

    /**
     * pause all active animations, retaining state.
     * @return {Laser} Instance for chaining.
     */

    pause: function() {
      if (this.getState() === 'paused') {
        return this;
      }
      this.pausedAt = this.elapsed();
      this.log('pausing');
      _.forEach(this.get('animations'), function(val, index) {
        if (!_isTransition) {
          val.$elem.pause();
          return;
        }
        switch(val.state) {
          case 'STOPPED':
            break;
          case 'ON_STACK':
            val.state = 'ON_STACK_RESET';
            clearTimeout(val.whenTimeout);
            break;
          case 'PLAYING':
            clearTimeout(val.completeTimeout);
            val.pause();
            break;
        }
      }, this);
      this.trigger('sequence:paused');
      this.state = 'paused';
      return this;
    },

    /**
     * resume all paused/on-stack animations.
     * @return {Laser} Instance for chaining.
     */

    resume: function() {
      var PAUSE_OFFSET = this.pausedAt;
      this.log('resuming');
      _.forEach(this.get('animations'), function(val, index) {
        if (!_isTransition) {
          val.$elem.resume();
          return;
        }
        switch(val.state) {
          case 'PAUSED':
            val.resume();
            break;
          case 'ON_STACK_RESET':
            val.whenTimeout = setTimeout(_.bind(function() {
              val.play();
            }, this), val.when - PAUSE_OFFSET);
            this.state = 'ON_STACK';
            break;
        }
      }, this);
      this.trigger('sequence:resuming');
      this.state = 'resuming';
      return this;
    },

    /**
     * rewind animation sequence based on current state versus rewinding from
     * the initial state.
     * @return {Laser} Instance for chaining.
     */

    rewind: function() {
      if (!_isTransition) {
        return this;
      }
      var runTime, reversedAnimations, PAUSE_OFFSET;
      this.pause();
      PAUSE_OFFSET = this.pausedAt;
      runTime = this.getRunTime();
      this.log('rewinding');
      reversedAnimations = _.map(this.get('animations'), function(val, index) {
        val.when = (runTime - val.when - val.options.duration);
        return val;
      }, this);
      reversedAnimations.reverse();
      _.forEach(reversedAnimations, function(val, index) {
        val.whenTimeout = setTimeout(_.bind(function() {
          val.rewind();
        }, this), val.when);
      }, this);
      this.direction = 'rewind';
      this.remaining = reversedAnimations.length;
      this.trigger('sequence:rewinding');
      this.state = 'rewinding';
      return this;
    },

    /**
     * determine the total run time of a sequence up until invocation point.
     * @return {number}
     */

    getRunTime: function() {
      var last, animations = this.get('animations');
      last = animations[animations.length - 1];
      return last.when + last.options.duration;
    },

    /**
     * simple getter for sequence's (not animation) state.
     * @return {string}
     */

    getState: function() {
      return this.state;
    },

    /**
     * gets a sequences "name" attr for debug/logging purposes.
     * @return {string}
     */

    getName: function() {
      return this.name;
    },

    /**
     * sets a sequences "name" attr for debug/logging purposes.
     * @param {string}
     * @return {Laser} Instance for chaining.
     */

    setName: function(name) {
      this.name = name;
      return this;
    }

  };

}(window));
