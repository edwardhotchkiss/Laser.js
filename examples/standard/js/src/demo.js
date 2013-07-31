
/**
 * @file demo.js
 * @description create a demo laser.js sequence
 */

$(function() {

  'use strict';

  // create new sequence with logging (DEBUG : true)
  var demoSequence = new Laser({
    DEBUG : true
  })

  // on complete log id of completed animation
  .on('animation:completed', function(animation) {
    this.log('completed animation %s', animation.id);
  })
  
  // on complete, rewind
  .on('sequence:completed', function(elapsed) {
    this.rewind();
    this.off('sequence:completed');
  })

  // custom easing method
  .addEasing('bounceOut', 'cubic-bezier(.33,1.66,.08,-1.71)')

  // add animations to sequence
  .add('.box', { left : 500 }, { duration : 750, when : 500  })
  .add('.box', { top  : 250 }, { duration : 750, when : 1250 })
  .add('.box', { left : 50  }, { duration : 750, when : 2000 })
  .add('.box', { top  : 50  }, { duration : 750, when : 2750 })

  // assign a name for debugging
  .name('demo')

  // display event triggers in view
  .on('sequence:started', function() {
    $('.current').text('started');
  })
  
  .on('sequence:completed', function() {
    $('.current').text('completed');
  })
  
  .on('sequence:rewinding', function() {
    $('.current').text('rewinding');
  })

  .on('sequence:paused', function() {
    $('.current').text('paused');
  })

  // play sequence
  demoSequence.play();

});
