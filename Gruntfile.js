module.exports = function(grunt) {
  var config = grunt.file.readJSON('config.json');

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      css: {
        files: ['email_builder/**/*.less'],
        tasks: ['less:develop'],
        options: {
          spawn: false,
          livereload: true
        }
      },
      html: {
        files: ['email_builder/**/*.html'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      bower: {
        files: ['bower.json'],
        tasks: ['bower:install'],
        options: {
          spawn: false
        }
      }
    },
    clean: {
      tmp: {
        files: {
          src: ['tmp']
        }
      }
    },
    usemin: {
      options: {
        dirs: 'tmp',
        assetsDirs: ['email_builder']
      },
      html: 'tmp/tmp.html'
    },
    less: {
      develop: {
        options: {
          sourceMap: true
        },
        files: config.less_files
      }
    },
    bower: {
      install: {
        forceLatest: false,
        options: {
          targetDir: 'email_builder/bower_components',
          layout: 'byComponent',
          install: true
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 8000,
          livereload: true,
          base: 'email_builder/',
          open: {
            target: 'http://localhost:8000/templates/'
          }
        }
      }
    },
    filerev: {
      options: {
        encoding: 'utf8',
        algorithm: 'md5',
        length: 12
      },
      dist: {
        src: [
          'email_builder/images/**/*.{png,jpg,jpeg,gif,webp}'
        ],
        dest: 'images-tmp'
      }
    }
  });

  // -----------------------------------------------------------------------------

  grunt.registerTask('server', [
    'bower:install',
    'less:develop',
    'connect:server',
    'watch'
  ]);

  // -----------------------------------------------------------------------------

  grunt.registerTask('push_to_remote', function(){
    // Process revisions for images
    grunt.config.set('filerev.generated', {
      src: 'email_builder/images/**/*.{png,jpg,jpeg,gif,webp}',
      dest: 'tmp/images'
    });
    grunt.task.run('filerev:generated');

    // Rsync dir to stupeflix_cloudfront
    grunt.config.set('rsync.generated', {
      options: {
        args: ["-az", "--verbose"],
        src: "tmp/images",
        dest: config.remote.path,
        host: config.remote.host
      }
    });
    grunt.task.run('rsync:generated');

    // Call usemin to replace images by revved ones
    grunt.task.run('usemin');

    // Replace image URL with grunt-cdn
    grunt.config.set('cdn.generated', {
      options: {
        cdn: config.remote.url
      },
      src: 'tmp/tmp.html'
    });
    grunt.task.run('cdn:generated');
  });

  // -----------------------------------------------------------------------------

  grunt.registerTask('build', function(fileName){
    if(fileName === undefined){
      grunt.fail.warn('You must pass a file name from templates dir without extension following this example:\n\t> grunt build:filename\n');
      return;
    }

    // Check if fileName exists as a path
    var filePath = fileName;
    fileName = fileName.replace('.html', '');
    if(!grunt.file.exists(filePath)){
      filePath = 'email_builder/templates/'+fileName+'.html';

      if(!grunt.file.exists(filePath)){
        grunt.fail.warn('Unable to find this file: '+filePath+'\n');
        return;
      }
    }

    grunt.task.run('clean:tmp');
    grunt.task.run('bower');
    grunt.task.run('less');

    // Uncss strip all css rules which are unused
    grunt.config.set('uncss.generated', {
      src: [filePath],
      dest: 'tmp/tmp.css'
    });
    grunt.task.run('uncss:generated');

    // Copy html file
    grunt.config.set('copy.generated-html', {
      src: filePath,
      dest: 'tmp/tmp.html'
    });
    grunt.task.run('copy:generated-html');

    if(config.remote.active){
      // Call push_to_remote meta task
      grunt.task.run('push_to_remote');
    }

    // Process html file to build css and change rev files
    grunt.task.run('usemin');

    // Premailer make all css rules to be inline + check css properties compatibility
    grunt.config.set('premailer.generated', {
      files: { 'tmp/tmp.html': ['tmp/tmp.html'] }
    });
    grunt.task.run('premailer:generated');

    // Copy distribution file to dist/
    grunt.config.set('copy.generated', {
      src: 'tmp/tmp.html',
      dest: 'dist/'+fileName+'.html'
    });
    grunt.task.run('copy:generated');

    grunt.task.run('clean:tmp');
  });

};