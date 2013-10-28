
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      options: {
        wrap: false,
        mangle: false,
        compress: false,
        banner: '// <%= pkg.name %> v<%= pkg.version %>, by <%= pkg.author %>\r\n// <%= pkg.homepage %>\n'
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
          'src/**/*.js'
        ]
      }
    },

    concat: {
      options: {
      },
      dist: {
        src: [
          'src/logger.js',
          'src/laser.js'
        ],
        dest: 'dist/laser-<%= pkg.version %>.js'
      }
    },

    watch: {
      scripts: {
        files: [
          'Gruntfile.js',
          'src/**/*.js'
        ],
        tasks: ['jshint','concat']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['jshint','concat','uglify']);
  grunt.registerTask('default', ['jshint','concat','watch']);

};
