
# laser.js

> Laser-precision animation sequencing & timing

### Why?

  * **Precise Sequencing**
  * **Rewind**, **Pause**, and **Resume** Sequence
  * **Automatic jQuery Element caching**
  * **CSS3 Animations**
  * **Event Emitter based** vs. callback approach
  * Debugging option with millisecond count

### Tested Compatibility:

  * **IE10+**
  * **Chrome 27+**
  * **Safari 6+**
  * **Firefox 21+**

### Usage

**_JavaScript_**

```javascript
$(function() {

  // create new sequence with loggin
  var seq = new Laser({
    DEBUG : true
  })

  // on complete log id of animation
  .on('animation:completed', function(animation) {
    this.log('completed animation %s', animation.id);
  })
  
  // on complete, rewind
  .on('sequence:completed', function(elapsed) {
    this.rewind();
    this.off('sequence:completed');
  })
  
  // add animations to sequence
  .add('.box', { rotate : 90 }, { duration : 750, easing : 'easeOutExpo', when : 0 })
  .add('.box', { left : 250 }, { duration : 750, easing : 'easeOutExpo', when : 750 })
  .add('.box', { top : 250 }, { duration : 750, easing : 'easeOutExpo', when : 1500 })
  .add('.box', { opacity : 0 }, { duration : 750, easing : 'easeOutExpo', when : 2250 })
  .add('.box', { opacity : 1 }, { duration : 750, easing : 'easeOutExpo', when : 3000 })
  .add('.box', { scale : 2 }, { duration : 750, easing : 'easeOutExpo', when : 3750 })
  
  // start play back
  .start();
  
  // artificial timing on pause/resume example.
  setTimeout(function() {
    seq.pause();
    setTimeout(function() {
      seq.resume();
    }, 2000);
  }, 850);

});
```

**_HTML_**

```html
<div class="box"></div>
```

**_CSS_**

```css
.box {
  top: 50px;
  left: 50px;
  width: 50px;
  height: 50px;
  position: absolute;
  background-color: #ff0099;
}
```

**Please see _examples_ for a full working example**

```bash
$ bower install
```

### Brought to you by:

  * **@edwardhotchkiss (CandidBlend, LLC)**
  * **@lindseymysse**

### License (MIT)

> Copyright (c) 2013, Edward Hotchkiss

