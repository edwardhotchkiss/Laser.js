
/**
 * @file init.js
 * @description setup dependencies and available
 * module interface(s), with a "DemoSequence" laser.js
 * instance to play
 */

require.config({

  baseUrl: 'js/',
  optimize: 'none',
  inlineText: true,

  paths: {
    'jquery':'vendor/jquery-2.0.3.min',
    'laser' :'../../../src/laser',
    'demo'  :'src/demo'
  },

  shim: {
    laser: {
      exports: 'Laser',
      deps: ['jquery']
    }
  },

  deps: ['jquery']

});

// demo handler - start on ready
require(['src/demo'],
  function(demoSequence) {
    'use strict';

    // display event triggers in view
    demoSequence.on('sequence:started', function() {
      $('.current').text('started');
    });
    demoSequence.on('sequence:completed', function() {
      $('.current').text('completed');
    });
    demoSequence.on('sequence:rewinding', function() {
      $('.current').text('rewinding');
    });
    demoSequence.on('sequence:paused', function() {
      $('.current').text('paused');
    });

    // play sequence
    demoSequence.play();

  }
);
