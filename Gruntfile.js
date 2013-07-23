
/**
 * @description Watch, concat and minify for dist.
 */

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! laser.js v<%= pkg.version %>, <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'dist/laser-<%= pkg.version %>.js',
        dest: 'dist/laser-<%= pkg.version %>.min.js'
      }
    },
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
          'src/laser.js'
        ]
      }
    },
    concat: {
      options: {
      },
      dist: {
        src: [
          'src/laser.js'
        ],
        dest: 'dist/laser-<%= pkg.version %>.js'
      }
    },
    watch: {
      scripts: {
        files: [
          'Gruntfile.js',
          'src/laser.js'
        ],
        tasks: ['jshint']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['jshint','concat','uglify']);
  grunt.registerTask('default', ['jshint','watch']);

};

/* EOF */