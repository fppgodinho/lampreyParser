module.exports = function(grunt) {
    
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    
    grunt.initConfig({
        concat: {
            js: {
                files: {
                    'build/js/client.js': [
                        'src/js/client/module.js',
                        'src/js/client/factories/**/*.js',
                        'src/js/client/services/**/*.js',
                        'src/js/client/directives/**/*.js',
                        'src/js/client/filters/**/*.js',
                        'src/js/client/controllers/**/*.js',
                        'src/js/client/plugins/**/*.js'
                    ]
                }
            }
        },
        copy: {
            html: {
                files: [
                    {cwd: 'src/html', src: '**', dest: 'build/templates', expand: true}
                ]
            }
        },
        compass: {
            css: {
                options: {
                    environment:    'production',
                    config:         'config/compass.rb'
                }
            }
        },
        uglify: {
            dist:   {
                options:    {
                    beautify:   false,
                    compress:   { drop_console: false }
                },
                files:  [
                    {'build/js/client.js':      'build/js/client.js'}
                ]
            }
        },
        htmlmin:    {
            dist:         {
                options:        {
                    removeComments:       true,
                    collapseWhitespace:   true
                },
                files:          [{
                    expand: true,
                    cwd:    'build/templates',
                    dest:   'build/templates',
                    src:    '**/*.html'
                }]
            }
        },
        nodewebkit: {
            options:    {
                build_dir:  './dist',   // Where the build version of my node-webkit app is saved
                mac:        true,       // We want to build it for mac
                win:        true,       // We want to build it for win
                linux32:    false,      // We don't need linux32
                linux64:    false       // We don't need linux64
            },
            src: ['./build/**/*']       // Your node-webkit app
        }
    });

    grunt.registerTask('default', ['compile', 'nodewebkit']);
    grunt.registerTask('compile', ['concat:js', 'copy:html', 'compass:css']);
    grunt.registerTask('compress', ['uglify:dist', 'htmlmin:dist']);
};