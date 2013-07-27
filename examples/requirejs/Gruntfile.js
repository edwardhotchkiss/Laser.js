
/*!
 * @description Gruntfile for 
 */

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      build: {
        src: 'js/app.js',
        dest: 'js/app.min.js'
      }
    },
    jshint: {
      options: {
        browser: true,
        laxcomma: true,
        globals: {
          jQuery: true
        }
      },
      all: {
        files: {
          src: [
            'js/src/**/*.js',
            'js/vendor/laser.js'
          ]
        }
      }
    },
    concat: {
      options: {
      },
      dist: {
        src: [
          'js/vendor/require.js',
          'js/vendor/jquery.min.js',
          'js/src/require-config.js',
          'js/src/demo.js'
        ],
        dest: 'js/app.js'
      }
    },
    less: {
      development: {
        options: {
          paths: ['less'],
          yuicompress: false
        },
        files: {
          'css/app.css':'less/index.less'
        }
      }
    },
    cssmin: {
      compress: {
        files: {
          'css/app.min.css': ['css/app.css']
        }
      }
    },
    watch: {
      less: {
        files: 'less/**/*.less',
        tasks: ['less'],
      },
      scripts: {
        files: ['Gruntfile.js','js/vendor/laser.js','js/src/**/*.js'],
        tasks: ['jshint','concat']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('build', ['jshint','concat','uglify','less','cssmin']);
  grunt.registerTask('default', ['jshint','concat','less','watch']);

};
