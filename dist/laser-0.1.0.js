
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


/**
 * @library laser.js
 * @author Edward Hotchkiss <edward@candidblend.la>
 * @contributor Lindsey Mysse <lindsey.mysse@gmail.com>
 * @description Laser-precision animation sequencing & timing
 * @license MIT
 */

;(function(root) {

  'use strict';

  /**
   * @constructor Laser
   */

  var Laser = function Laser(params) {
    _extend(this, params);
    this.listeners = {};
    this.animations = [];
    this.DEBUG = this.DEBUG || false;
    this.console = (typeof(root.console) === 'object');
    return this;
  };

  /**
   * @private _cachedElements
   * @description never wrap a selector into a jQuery object more
   * than once per page
   */

  var _cachedElements = {};

  /**
   * @private _div
   * @description div element to pull attributes from based on vendor
   */

  var _div = document.createElement('div');

  /**
   * @private _objList
   * @description list of div style attributes
   */

  var _objList = _div.style;

  /**
   * @private _omPrefixes
   * @description CSSOM prefixes
   */

  var _omPrefixes = [
    '',
    'webkit',
    'Moz',
    'o',
    'ms'
  ];

  /**
   * @private _transitionendEvents
   * @description a hacky and brittle way to assign transition events. because
   * of shitty garbage collection/event overwriting use "setTimeout" instead :/
   * @example $element.on(_transitionendEvents, function) to assign events
   */

  var _transitionend = [
    'webkitTransitionEnd',
    'oTransitionEnd',
    'otransitionend',
    'transitionend',
    'msTransitionEnd'
  ].join(' ');

  /**
   * @private _transformTypes
   * @description list of CSS3 transform types
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
   * @private _nativeEasing
   * @description list of native easing methods
   */

  var _nativeEasing = [
    'ease',
    'linear',
    'ease-in',
    'ease-out',
    'ease-in-out'
  ];

  /**
   * @private _customEasing
   * @description custom aliased cubic-bezier strings
   */

  var _customEasing = {};

  /**
   * @extend jQuery CSS3 hooks for "rotate" (all,x,y)
   */

  ['rotate','rotateX','rotateY'].forEach(function(key, index) {
    $.cssHooks[key] = {
      get: function(elem, computed, extra) {
        var matrix = _processMatrix($(elem));
        return '(' + matrix.angle + 'deg)';
      },
      set: function(elem, value) {
        $(elem).css(_getPropertyName('Transform').css, value);
      }
    };
  });

  /**
   * @extend jQuery CSS3 hook for "scale"
   */

  $.cssHooks.scale = {
    get: function(elem, computed) {
      return _processMatrix($(elem)).scale;
    },
    set: function(elem, value) {
      $(elem).css(_getPropertyName('Transform').css, value);
    }
  };

  function _isValidEasing(name) {
    return (_getEasing(name) !== undefined) ? true : false;
  }

  /**
   * @private _getEasing
   * @description gets the value for an aliased CSS3 easing type
   * @param {String} name easing name alias
   * @return {String} 'cubic-bezier' easing string method
   */

  function _getEasing(name) {
    if (_nativeEasing.indexOf(name) !== -1) {
      return name;
    } else if (_customEasing[name]) {
      return _customEasing[name];
    }
  }

  /**
   * @method _setEasing
   * @description sets an alias to a custom css3 cubic-bezier fn str
   */

  function _setEasing(name, easing) {
    _customEasing[name] = easing;
  }

  /**
   * @private _extend
   */

  function _extend(parent, params) {
    return Object.keys(params).forEach(function(key, index, obj) {
      parent[key] = params[key];
    });
  }

  /**
   * @private _processMatrix
   * @description returns values from a matrix
   */

  function _processMatrix($elem) {
    var a, b, c, d, angle, scale, values, matrix;
    matrix = $elem.css(_getPropertyName('Transform').css);
    if (matrix === 'none') {
        return 0;
    }
    values = matrix.split('(')[1].split(')')[0].split(',');
    a = values[0];
    b = values[1];
    c = values[2];
    d = values[3];
    return {
      scale : Math.sqrt((a * a) + (b*b)),
      angle : Math.round(Math.atan2(b, a) * (180/Math.PI))
    };
  }

  /**
   * @private _getCachedElement
   * @param {String} selector CSS selector
   * @description gets cached jQuery element
   * @return {Object} jQuery wrapped element
   */

  function _getCachedElement(selector) {
    return _cachedElements[selector];
  }

  /**
   * @private _setCachedElement
   * @param {String} selector css selector
   * @description first checks for cached jQuery element by selector,
   * otherwise caches reference to the jQuery element
   * @return {Object} jQuery wrapped element
   */

  function _setCachedElement(selector) {
    _cachedElements[selector] = _getCachedElement(selector) || $(selector);
    return _cachedElements[selector];
  }

  /**
   * @private _formatUnit
   * @description takes an attr value, depending on attr type,
   * returns the type if missing
   * @param {String/Number} val user passed value to parse
   * @param {String} unit example, 'px'/'%'
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
   * @private _insertCSSClass
   * @description creates a css .class with a unique id to 
   * add/remove css transitions
   * @return {String} name inserted css class name
   */

  function _insertCSSClass(name, content) {
    var style = '<style id="' + name + '"> .'+ name + ' { ' + content + '} </style>';
    $('html > head').append(style);
    return name;
  }

  /**
   * @private _counter
   * @description incrementing counter for ids
   * @return {Number} id
   */

  var _counter = 0;

  /**
   * @private _id
   * @description generate a unique id, prefixed with "laser_tr_"
   * @return {String} id class name
   */

  function _id(initial) {
    return ['LASER_TR', ++_counter].join('_');
  }

  /**
   * @private _camelCase
   * @description String to camelCaseFn
   */

  function _camelCase(string) {
    return string.replace( /-([a-z])/ig, function(all, letter) {
      return letter.toUpperCase();
    });
  }

  /**
   * @private _upperCase
   * @description capitalize String's first letter
   */

  function _upperCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * @private _getPrefix
   */

  function _getPrefix(prop) {
    var prefix, propBrowserTest = _camelCase(prop);
    _omPrefixes.forEach(function(val) {
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
   * @private _getPropertyName
   * @return {object} containing CSS and CSSOM prefix
   */

  function _getPropertyName(prop) {
    return { 
      css : _getPrefix(prop).css + prop.toLowerCase(),
      om  : _getPrefix(prop).om + prop
    };
  }

  /**
   * @method _createTransitionString
   * @description Generates the a transition string
   * @params {Object, jQuery Object} Transition changes, jquery objects
   * @returns {String} Returns string of transition
   */

  function _createTransitionString(params, startParams, _duration, easing) {
    var cur, val, unit, duration, transformString, blandTransition = '', finalTransition = '';
    duration = _formatDuration(_duration); 
    Object.keys(params).forEach(function(key, index, arr) {
      val = params[key];
      cur = startParams[key];
      if (_transformTypes.indexOf(key) !== -1) {
        unit = (key === 'perspective') ? 'px' : 'deg';
        unit = (key === 'scale') ? '' : unit;
        if (transformString === '') {
          transformString += ' ' + key + '(' + _formatUnit(val, cur, unit) + ') ';
        } else {
          transformString = key + '(' + _formatUnit(val, cur, unit) + ') ';
        }
      } else {
        unit = (key === 'opacity') ? '' : 'px';
        blandTransition += _getPropertyName(key).css + ' : ' + _formatUnit(val, cur, unit) + ' !important;';
      }
    });
    finalTransition += (_getPropertyName('transition-duration').css + ': ' + duration + ' !important;');
    finalTransition += (_getPropertyName('transition-timing-function').css + ':' + _getEasing(easing) + '!important;');
    if (transformString !== undefined ) {
      finalTransition += _getPropertyName('Transform').css + ':' + transformString + ' !important;';
    }
    finalTransition += blandTransition; 
    return finalTransition; 
  }

  /**
   * @private _formatDuration
   * @description to seconds, then to string with trailing "s"
   * @param {Number} duration time in milliseconds
   * @return {String} css3 animation formated time
   */

  function _formatDuration(val) {
    if (typeof(val) === 'string' && !/^[0-9]+$/.test(val)) {
      return val;
    }
    return (val / 1000) + 's';
  }

  /**
   * @private _isTransform
   */

  function _isTransform(val) {
    return (/(rotate|scale)/).test(val);
  }

  /**
   * @private _getCSSPath
   * @description gets full css path of a jQuery object
   * @param {String} selector
   * @return {String} full path with selector
   */

  function _getCSSPath(selector) {
    var path, elem = $(selector)[0];
    if (elem.id) {
      return '#' + elem.id;
    }
    if (elem.tagName == 'BODY') {
      return '';
    }
    path = _getCSSPath(elem.parentNode);
    if (elem.className) {
      return path + ' ' + elem.tagName + '.' + elem.className;
    }
    return path + ' ' + elem.tagName;
  }

  /**
   * @private _where
   * @description search an array by key/value
   * @param {Array} arr list to search
   * @param {Object} search params
   * @return {Array} filtered arr
   */

  function _where(list, query) {
    var results = list.filter(function(val, index, arr) {
      Object.keys(query).forEach(function(key, index, obj) {
        if (obj[key] !== query[key]) {
          return false;
        } else {
          return true;
        }
      });
    });
  }

  /**
   * @private Animation
   * @description constructor fn
   */

  var Animation = function Animation(params) {
    _extend(this, params);
    if (this.$elem.hasClass('animation') === false) {
      this.$elem.addClass('animation');
      this.setInitialStyle();
    }
    this.state = 'ON_STACK';
    return this;
  };

  /**
   * @description extend Animation
   */

  Animation.prototype = {

    /**
     * @method getCurrentParams
     * @description get current values of animations params
     * to maintain state
     * @return {Object} current key/value pairs of animated
     * param keys with their current values
     */

    getCurrentParams: function() {
      var current = {};
      Object.keys(this.params).forEach(function(key, index, arr) {
        if (_isTransform(key)) {
          current.transform = this.$elem.css(key);
        }
        current[key] = this.$elem.css(key);
      }, this);
      return current;
    },

    /**
     * @method setInitialStyle
     * @description creates a class where rewind doesnt cause a "jerk"
     */

    setInitialStyle: function() {
      var key, duration;
      key = _getPropertyName('transition-duration').css;
      duration = _formatDuration(this.options.duration);
      this.initialStyle = key + ':' + duration + ';';
    },

    /**
     * @method play
     * @description plays animation, either with jQuery.animate or a
     * CSS3 transition
     */

    play: function() {
      this.startParams = this.getCurrentParams();
      this.state = 'PLAYING';
      this.transition();
    },

    /**
     * @method complete
     * @description on complete callback
     */

    complete: function() {
      this.sequence.trigger('animation:completed', this);
      this.state = 'COMPLETED';
    },

    /**
     * @method pause
     * @description stops/pauses a transition
     */

    pause: function() {
      Object.keys(this.getCurrentParams()).forEach(function(key, index, arr) {
        this.$elem.css(key, this.$elem.css(key));
      }, this);
      this.$elem.removeClass(this.id);
      this.state = 'PAUSED';
    },

    /**
     * @method resume
     * @description resumes a transition from last play state
     */

    resume: function() {
      this.$elem.addClass(this.id);
      Object.keys(this.getCurrentParams()).forEach(function(val, key) {
        this.$elem.css(key, '');
      }, this);
      this.completeTimeout = setTimeout(function() {
        this.complete();
      }.bind(this), this.options.duration);
      this.state = 'PLAYING';
    },

    /**
     * @method rewind
     * @description returns transition to its original state
     */

    rewind: function() {
      // ease back into original state
      if (this.initialStyle !== undefined) {
        this.$elem.attr('style', this.initialStyle);
      }
      this.$elem.removeClass(this.id);
      this.completeTimeout = setTimeout(function() {
        this.complete();
      }.bind(this), this.options.duration);
    },

    /**
     * @method transition
     * @description css3 transition animation
     */

    transition: function() {
      var transitionString = _createTransitionString(
        this.params,  
        this.startParams,        
        this.options.duration,  
        this.options.easing          
      );
      _insertCSSClass(this.id, transitionString);
      this.$elem.addClass(this.id);
      this.completeTimeout = setTimeout(function() {
        this.complete();
      }.bind(this), this.options.duration);
    }

  };

  /**
   * @description extend Laser
   */

  Laser.prototype = {

    /**
     * @method log
     */

    log: function(message) {
      var args = arguments;
      if (!this.console || !this.DEBUG) {
        return this;
      } else {
        Logger.log(args);
        return this;
      }
    },

    /**
     * @method get
     * @param {String} attr instance attribute
     * @param {Object} query set of key/values to match
     * @description instance attribute getter
     */

    get: function(attr, query) {
      if (query === undefined) {
        return this[attr];
      } else {
        return _where(this[attr], params);
      }
    },

    /**
     * @method set
     * @param {String} attr instance attribute
     * @param {Object} where set of key/values to match
     * @param {Object} params set of key/values to set
     * @description instance attribute getter
     */

    set: function(attr, where, params) {
      var item = this.get(attr, where);
      if (!item) {
        throw new Error('Unknown Attribute: "'+attr+'"');
      }
      Object.keys(params).forEach(function(val, key) {
        result[key] = val;
      }, this);
      return obj;
    },

    /**
     * @method on
     * @param {String} name event name
     * @param {Function} fn trigger function to store
     * @description bind function to event name
     */

    on: function(name, fn) {
      this.listeners[name] = this.listeners[name] || [];
      this.listeners[name].push(fn);
      return this;
    },

    /**
     * @method off
     * @param {String} name event name
     * @description remove event listener
     */

    off: function(name) {
      if (this.listeners[name]) {
        delete this.listeners[name];
      }
      return this;
    },

    /**
     * @method trigger
     * @param {String} name Event name
     * @description trigger event listener
     */

    trigger: function(name) {
      if (!this.listeners[name]) {
        return this;
      }
      var args = Array.prototype.slice.call(arguments, 1);
      this.listeners[name].forEach(function(val, index, arr) {
        val.apply(this, args);
      }, this);
      return this;
    },

    /**
     * @method add
     * @description sets up params via arguments for a
     * new Animation object to push onto the sequence stack
     * @param {String} selector css selector for element to animate
     * @param {Object} params jQuery standard animation parameters
     * @param {Object} options animation options,
     * excluding the 'when' attribute
     */

    add: function(selector, params, options) {
      var when, sequence = this, $elem = _setCachedElement(selector);
      when = (options.when || 0);
      options.easing = (options.easing || 'ease-out');
      if (!_isValidEasing(options.easing)) {
        throw new Error('Unknown easing method! - ' + options.easing);
      }
      this.animations.push(
        new Animation({
          id       : _id(),
          when     : when,
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
     * @method addEasing
     * @description add a css3 cubic-bezier easing str
     */

    addEasing: function(name, easing) {
      _setEasing(name, easing);
      return this;
    },

    /**
     * @method onAnimated
     * @description on animations all played out, check for a
     * padded sequence ending, regardless trigger sequence complete
     */

    onAnimated: function() {
      if (this.padTime) {
        setTimeout(function() {
          this.trigger('sequence:completed');
        }.bind(this), this.padTime);
      } else {
        this.log('sequence completed');
        this.trigger('sequence:completed');
      }
    },

    /**
     * @method onAnimationComplete
     * @description as animations are completed, trigger user listeners,
     * check remaining and note Animation state
     * @param {Object} animation completed animation instance reference
     */

    onAnimationComplete: function(animation) {
      this.remaining--;
      if (this.remaining === 0) {
        this.trigger('sequence:animated');
      }
    },

    /**
     * @method play
     * @description plays animation sequence, looks for state being set
     * to paused, so that start/resume diffs are transparent to the user
     */

    play: function() {
      var animations = this.get('animations');
      this.remaining = animations.length;
      this.startedAt = new Date().getTime();
      this.trigger('sequence:started', this.remaining);
      this.log('starting sequence');
      animations.forEach(function(val, index) {
        val.whenTimeout = setTimeout(function() {
          val.play();
        }.bind(this), val.when);
      }, this);
      this.on('sequence:animated', function() {
        this.onAnimated();
      });
      this.on('animation:completed', function(animation) {
        this.onAnimationComplete(animation);
      });
      this.state = 'playing';
      return this;
    },

    /**
     * @method wait
     * @description pad an animation sequences' ending
     * @param {Number} milliseconds length to pad animation ending with
     */

    wait: function(milliseconds) {
      this.padTime = milliseconds;
    },

    /**
     * @method pause
     * @description pause all active animations, retaining state
     */
    
    pause: function() {
      this.pausedAt = (new Date().getTime() - this.startedAt);
      this.log('pausing');
      this.get('animations').forEach(function(val, index) {
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
     * @method resume
     * @description resume all paused/on-stack animations
     */
    
    resume: function() {
      var PAUSE_OFFSET = this.pausedAt;
      this.log('resuming');
      this.get('animations').forEach(function(val, index) {
        switch(val.state) {
          case 'PAUSED':
            val.resume();
            break;
          case 'ON_STACK_RESET':
            val.whenTimeout = setTimeout(function() {
              val.play();
            }.bind(this), val.when - PAUSE_OFFSET);
            this.state = 'ON_STACK';
            break;
        }
      }, this);
      this.trigger('sequence:resuming');
      this.state = 'resuming';
      return this;
    },

    /**
     * @method rewind
     * @description rewind animation sequence based on current
     * state versus rewinding from the initial state
     */

    rewind: function() {
      var runTime, reversedAnimations;
      runTime = this.getRunTime();
      this.log('rewinding');
      reversedAnimations = this.get('animations').map(function(val, index, arr) {
        val.when = (runTime - val.when - val.options.duration);
        return val;
      });
      reversedAnimations.reverse();
      reversedAnimations.forEach(function(val, index, arr) {
        val.whenTimeout = setTimeout(function() {
          val.rewind();
        }.bind(this), val.when);
      }, this);
      this.direction = 'rewind';
      this.remaining = reversedAnimations.length;
      this.trigger('sequence:rewinding');
      this.state = 'rewinding';
      return this;
    },

    /**
     * @method getRunTime
     * @description determine the total run time of a sequence up until invocation point
     * @return {Number} run time in milliseconds
     */

    getRunTime: function() {
      var last, animations = this.get('animations');
      last = animations[animations.length - 1];
      return last.when + last.options.duration;
    },

    /**
     * @method name
     * @description sets a sequences "name" attr for debug/logging purposes
     * @param {String} name identifier
     */

    name: function(name) {
      this.name = name;
      return this;
    }

  };

  /**
   * @description attach obj to root
   */

  root.Laser = Laser;

}(window));
