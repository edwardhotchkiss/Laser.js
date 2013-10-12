
module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      options: {
        browser: true,
        globals: {
          jQuery: true
        }
      },
      files: {
        src: [
          'Gruntfile.js',
          'js/src/**/*.js'
        ]
      }
    },
    watch: {
      scripts: {
        files: [
          'Gruntfile.js',
          'js/src/demo.js',
          '../src/laser.js'
        ],
        tasks: ['jshint']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint','watch']);

};
