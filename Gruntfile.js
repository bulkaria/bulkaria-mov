module.exports = function(grunt) {

  grunt.initConfig({
    nggettext_extract: {
      pot: {
        files: {
          'www/po/template.pot': ['www/templates/*.html']
        }
      },
    },
    nggettext_compile: {
      all: {
        files: {
          'www/js/translations.js': ['www/po/*.po']
        }
      },
    },    
  });

  grunt.loadNpmTasks('grunt-angular-gettext');
};