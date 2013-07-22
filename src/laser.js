
/**
 * @library laser.js
 * @author Edward Hotchkiss <edward@candidblend.la>
 * @contributor Lindsey Mysse <lindsey.mysse@gmail.com>
 * @description Laser-precision animation sequencing & timing
 * @license MIT
 */

(function(window, undefined) {

  'use strict';

  /**
   * @method Laser
   * @description constructor fn
   */

  var Laser = window.Laser = function Laser(params) {
    _.extend(this, params);
    this.listeners = {};
    this.animations = [];
    this.direction = 'forward';
    this.transition = _isTransition();
    this.DEBUG = this.DEBUG || false;
    this.console = (typeof(window.console) === 'object');
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
   * @description fallback support for IE9
   */

  if (_isTransition()) {

    /**
     * @extend jQuery CSS3 hooks for "rotate", "rotateY" and "rotateX"
     */

    _.map(['rotate','rotateY','rotateX'], function(val, key) {
      $.cssHooks.rotate = {
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

  }

  /**
   * @private _processMatrix
   * @description returns values from a matrix
   */

  function _processMatrix($elem) {
    var a, b, c, d, angle, scale, values, matrix;
    matrix = $elem.css(_getPropertyName('Transform').css);
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
   * @private _padMilliseconds
   * @description pads timer with up to six zeroes
   * @param {Number} milliseconds milliseconds to pad
   */

  function _padMilliseconds(milliseconds) {
    var max = '000000';
    return (max + milliseconds).slice(-(max.length));
  }

  /**
   * @private _isTransition
   * @description determine whether jQuery transit is available
   * @return {Boolean} availability
   */

  function _isTransition() {
    return (/(MSIE 9\.0)/.test(navigator.userAgent)) ? false : true;
  }

  /**
   * @private _isValidEasing
   * @description invalid easing method aliases bork .animate/.transition
   * check that the alias exists in the dictionary
   * @param {String} ea easing alias
   * @return {Boolean} exists or doesn't
   */

  function _isValidEasing(alias) {
    if (_isTransition()) {
      return ($.cssEase[alias] !== undefined) ? true : false;
    } else {
      return ($.easing[alias] !== undefined) ? true : false;
    }
  }

  /**
   * @private _getEasingBezier
   * @description gets the value for an aliased CSS3 easing type
   * @param {String} alias easing name alias
   * @return {String} 'cubic-bezier' easing string method
   */

  function _getEasingBezier(alias) {
    return $.cssEase[alias];
  }

  /**
   * @private _formatUnit
   * @description takes an attr value, depending on attr type,
   * returns the type if missing
   * @param {String/Number} val user passed value to parse
   * @param {String} unit example, 'px'/'%'
   */

  function _formatUnit(val, unit) {
    if (unit === '') {
      return val;
    }
    if (typeof(val) === 'string' && !/^[0-9]+$/.test(val)) {
      return val;
    }
    return (val.toString() + unit);
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
   * @private _removeCSSClass
   * @description removes a .css class by id
   * @param {String} classId class identifier
   */

  function _removeCSSClass(classId) {
    var stylesheets, deleteRule;
    stylesheets = document.styleSheets;
    deleteRule = 'deleteRule' in stylesheets[0] ? 'deleteRule' : 'removeRule';
    _.forEach(stylesheets, function(stylesheet, index) {
      if (stylesheet.ownerNode.id === classId) {
        stylesheets[index][deleteRule]();
      }
    });
  }

  /**
   * @private _id
   * @description generate a unique id, prefixed with "tr_"
   * @return {Number} id
   */

  function _id() {
    return _.uniqueId('laser_tr_');
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

  function _createTransitionString(params, _duration, easing) {
    var unit, duration, transformString, blandTransition = '', finalTransition = '';
    duration = _formatDuration(_duration); 
    _.each(params, function(val, key) {
      if (_.contains(_transformTypes, key)) {
        unit = (key === 'perspective') ? 'px' : 'deg';
        unit = (key === 'scale') ? '' : unit;
        if (transformString === '') {
          transformString += ' ' + key + '(' + _formatUnit(val, unit) + ') ';
        } else {
          transformString = key + '(' + _formatUnit(val, unit) + ') ';
        }
      } else {
        unit = (key === 'opacity') ? '' : 'px';
        blandTransition += _getPropertyName(key).css + ' : ' + _formatUnit(val, unit) + ' !important;';
      }
    });
    finalTransition += (_getPropertyName('transition-duration').css + ': ' + duration + ' !important;');
    finalTransition += (_getPropertyName('transition-timing-function').css + ':' + _getEasingBezier(easing) + '!important;');
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
      return "#" + elem.id;
    }
    if (elem.tagName == 'BODY') {
      return '';
    }
    path = _getCSSPath(elem.parentNode);
    if (elem.className) {
      return path + " " + elem.tagName + "." + elem.className;
    }
    return path + " " + elem.tagName;
  }

  /**
   * @private Animation
   * @description constructor fn
   */

  var Animation = function Animation(params) {
    _.extend(this, params);
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
     * @return {Object} key/value pairs of animated param keys with
     * their current values
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
     * @method play
     * @description plays animation, either with jQuery.animate or a
     * CSS3 transition
     */

    play: function() {
      if (this.sequence.transition) {
        this.transition();
      } else {
        this.animate();
      }
      this.startParams = this.getCurrentParams();
      this.state = 'PLAYING';
      this.active = true;
    },

    /**
     * @method complete
     * @description on complete callback
     */

    complete: function() {
      this.sequence.trigger('animation:completed', this);
      this.state = 'COMPLETED';
      this.active = false;
    },

    /**
     * @method pause
     * @description stops/pauses a transition
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
     * @method resume
     * @description resumes a transition from last play state
     */

    resume: function() {
      _.forEach(this.getCurrentParams(), function(val, key) {
        this.$elem.css(key, '');
      }, this);
      this.$elem.addClass(this.id);
      this.completeTimeout = setTimeout(_.bind(function() {
        this.complete();
      }, this), this.options.duration);
      this.state = 'PLAYING';
    },

    /**
     * @method rewind
     * @description returns transition to its original state
     */

    rewind: function() {
      this.$elem.removeClass(this.id);
      this.completeTimeout = setTimeout(_.bind(function() {
        this.complete();
      }, this), this.options.duration);
    },

    /**
     * @method animate
     * @description animates item's properties
     */

    animate: function() {
      var $elem = this.$elem;
      delete this.options.when;
      this.options.queue = false;
      this.options.complete = _.bind(function() {
        this.sequence.trigger('animation:completed', this);
        this.state = 'COMPLETED';
        this.active = false;
      }, this);
      return this.$elem.animate(this.params, this.options);
    },

    /**
     * @method transition
     * @description css3 transition animation
     */

    transition: function() {
      var transitionString;
      transitionString = _createTransitionString(
        this.params,          
        this.options.duration,  
        this.options.easing          
      );
      _insertCSSClass(this.id, transitionString);
      this.$elem.addClass(this.id);
      this.completeTimeout = setTimeout(_.bind(function() {
        this.complete();
      }, this), this.options.duration);
    }

  };

  /**
   * @description extend Laser
   */

  Laser.prototype = {

    /**
     * @method elapsed
     * @description determine elapsed time in ms of sequence playback
     * @return {Number} milliseconds into playback
     */

    elapsed: function() {
      return (new Date().getTime() - this.startedAt);
    },

    /**
     * @method log
     */

    log: function(message) {
      if (!this.console || !this.DEBUG) {
        return;
      }
      var log, args;
      args = Array.prototype.slice.call(arguments);
      args[0] = ('DEBUG [' + _padMilliseconds(this.elapsed()) + '] > ') + message;
      log = Function.prototype.bind.call(console.log, console);
      log.apply(console, args);
    },

    /**
     * @method get
     * @param {String} attr instance attribute
     * @param {Object} where set of key/values to match
     * @description instance attribute getter
     */

    get: function(attr, where) {
      if (where === undefined) {
        return this[attr];
      } else {
        return _.where(this[attr], where);
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
      if (item === undefined) {
        return undefined;
      } else {
        _.forEach(params, function(val, key) {
          result[key] = val;
        }, this);
        return obj;
      }
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
     * @param {Function} fn trigger function to remove
     * @description remove event listener
     */

    off: function(name, fn) {
      if (this.listeners[name]) {
        this.listeners[name].splice(this.listeners[name].indexOf(fn), 1);
      }
      return this;
    },

    /**
     * @method trigger
     * @param {String} name Event name
     * @description trigger event listener
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
     * @method addEasing
     * @description add either a css3 cubic-bezier ease or a jquery easing fn
     */

    addEasing: function(alias, easing) {
      if (typeof(easing) === 'string') {
        $.cssEase[alias] = easing;
      } else {
        $.easing[alias] = easing;
      }
      return this;
    },

    /**
     * @method onAnimated
     * @description on animations all played out, check for a
     * padded sequence ending, regardless trigger sequence complete
     */

    onAnimated: function() {
      if (this.padTime) {
        setTimeout(_.bind(function() {
          this.trigger('sequence:completed');
        }, this), this.padTime);
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
     * @description plays animation sequence
     */

    start: function() {
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
      });
      this.on('animation:completed', function(animation) {
        this.onAnimationComplete(animation);
      });
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
      if (!this.transition) {
        return this;
      }
      this.pausedAt = this.elapsed();
      this.log('pausing');
      _.forEach(this.get('animations'), function(val, index) {
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
      return this;
    },

    /**
     * @method resume
     * @description resume all paused/on-stack animations
     */
    
    resume: function() {
      if (!this.transition) {
        return this;
      }
      var PAUSE_OFFSET = this.pausedAt;
      this.log('resuming');
      _.forEach(this.get('animations'), function(val, index) {
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
      return this;
    },

    /**
     * @method rewind
     * @description rewind animation sequence based on current
     * state versus rewinding from the initial state
     */

    rewind: function() {
      if (!this.transition) {
        return this;
      }
      var runTime, reversedAnimations, PAUSE_OFFSET;
      PAUSE_OFFSET = this.pausedAt;
      runTime = this.getRunTime();
      this.log('reverse');
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
    }

  };
  
}(window));
