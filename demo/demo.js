
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
  .add('.box', { rotateY : 180 }, { duration : 750, easing : 'easeOutExpo', when : 4500 })
  
  // start play back
  .start();
  
  // artificial timing on pause/resume example.
  setTimeout(function() {
    seq.pause();
    setTimeout(function() {
      seq.resume();
    }, 2000);
  }, 4700);

});