'use strict';

angular.module('lampreyParser', [], function ($compileProvider)                 {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|data|blob):/);
});

/**
 * 
 * This process aims to capture the browser's vertical scrollbar width and
 * strore the value in the config service under a variable called 'SCROLLBAR_WIDTH'.
 * 
 * @param {window} $window The global angular reference to the window DOMElement.
 */
angular.module('lampreyParser').run(['$window', 'config', function($window, config) {
    var outer                   = $window.document.createElement("div");
    outer.style.visibility      = "hidden";
    outer.style.width           = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    $window.document.body.appendChild(outer);
    var widthNoScroll           = outer.offsetWidth;
    //
    outer.style.overflow        = "scroll";
    var inner                   = $window.document.createElement("div");
    inner.style.width           = "100%";
    outer.appendChild(inner);
    var widthWithScroll         = inner.offsetWidth;
    //
    outer.parentNode.removeChild(outer);
    //
    config.SCROLLBAR_WIDTH      = widthNoScroll - widthWithScroll;
}]);

angular.module('lampreyParser').run(['$window',
    function($window)                                                           {
        // Load native UI library
        var gui     = require('nw.gui');
        
        // Create a tray icon
        var tray    = new gui.Tray({ title: 'Tray', icon: 'media/16x16.png' });
        
        // Give it a menu
        var menu    = new gui.Menu();
        menu.append(new gui.MenuItem({ type: 'checkbox', label: 'box1' }));
        
        tray.menu   = menu;
    }
])
angular.module('lampreyParser').factory('config', [
    function()                                                                  {
        return {
            SCROLLBAR_WIDTH:     0
        };
    }
]);

angular.module('lampreyParser').directive('filePicker', [function()             {
    return {
        restrict:       'E',
        scope:          {
            file:           "=",
            initFolder:     "="
        },
        transclude: true,
        templateUrl:    'templates/directives/filePicker.html',
        controller:     ['$scope', '$element',
            function($scope, $element)                                          {
                var browser     = $element.find("#FILE");
                browser.on('change', function()                                 {
                    $scope.file = (this.files && this.files.length)?this.files[0]:null; 
                    $scope.$apply();
                })
                $scope.browse   = function() { browser.click();                 };
            }
        ]
    };
}]);

angular.module('lampreyParser').directive('folderPicker', [function()           {
    return {
        restrict:       'E',
        scope:          {
            folder:         "=",
            initFolder:     "="
        },
        transclude: true,
        templateUrl:    'templates/directives/folderPicker.html',
        controller:     ['$scope', '$element',
            function($scope, $element)                                          {
                var browser     = $element.find("#FOLDER");
                browser.on('change', function()                                 {
                    $scope.folder = (this.files && this.files.length)?this.files[0]:null; 
                    $scope.$apply();
                })
                $scope.browse   = function() { browser.click();                 };
            }
        ]
    };
}]);

angular.module('lampreyParser').directive('main', [function()                   {
    return {
        restrict:       'E',
        scope:          {},
        templateUrl:    'templates/directives/main.html',
        controller:     ['$scope',
            function($scope)                                                    {
                var gui         = require('nw.gui');
                //
                $scope.selected         = 'connection';
                $scope.connected        = false;
                $scope.sourceFile       = null;
                $scope.exportFolder     = null;
                $scope.appFolder        = gui.App.dataPath + '\\Export';
                $scope.loading          = false;
                
                //
                var fs          = require('fs');
                var stream      = null;
                $scope.export = function()                                      {
                    if ($scope.loading || !$scope.sourceFile || !$scope.exportFolder) return;
                    var exportFile  = $scope.exportFolder.path + '/export.csv';
                    if (fs.existsSync(exportFile)) fs.truncateSync(exportFile, 0);
                    buffer.length   = 0;
                    $scope.loading  = true;
                    stream          = fs.createReadStream($scope.sourceFile.path);
                    stream.on('data', function(data)                            {
                        stream.pause();
                        readData(data.toString().split('\r').join(''));
                        $scope.$digest();
                    });
                    stream.on('end', function() {
                        $scope.loading = false;
                        stream  = null;
                        readData('');
                        $scope.$digest();
                    });
                };

                var leftover    = '';
                var buffer      = [];
                function readData(data)                                         {
                    while (data)                                                {
                        var eol     = data.indexOf('\n') + 1;
                        if (eol > 0)                                            {
                            var line    = data.substring(0, eol);
                            data        = data.substr(eol);
                            buffer.push(parseLine(leftover + line));
                            leftover    = '';
                            writeData();
                        } else                                                  {
                            leftover    = data;
                            data        = '';
                        }
                    }
                }
                
                var saving = false; 
                function writeData()                                            {
                    if (saving || !$scope.exportFolder) return; saving = true;
                    var exportFile  = $scope.exportFolder.path + '/export.csv';
                    var line = buffer.shift();
                    fs.appendFile(exportFile, line, function(err)               {
                        saving = false;
                        if (!err && buffer.length) writeData();
                        else if (err) console.log(err);
                        else if (stream) stream.resume();
                        else console.log('Save done!');
                    });
                }
                
                function parseLine(line)                                        {
                    line = line.trim();
                    if (line.charAt(0) == '"' || line.charAt(0) =="'") line = line.substr(1);
                    if (line.charAt(line.length-1) == '"' || line.charAt(line.length-1) =="'") line = line.substr(0, line.length-1);
                    if (line.indexOf('*TAG:') < 0) return '';
                    var lineParts = line.split(" "); lineParts.shift();
                    
                    lineParts[2] = new Date(lineParts[2].substr(6), lineParts[2].substr(0, 2), lineParts[2].substr(3, 2), lineParts[3].substr(0, 2), lineParts[3].substr(3, 2), lineParts[3].substr(6, 2), lineParts[3].substr(9));
                    lineParts.splice(3, 1);
                    
                    line    = '';
                    line    += lineParts.shift() + ',';
                    line    += lineParts.shift() + ',';
                    line    += lineParts.shift().getTime() + ',';
                    line    += lineParts.join(' ');
                    
                    return line + '\n';
                }
                
                var nwWindow  = require('nw.gui').Window.get();
                $scope.switchDebug = function() {
                    if (!nwWindow.isDevToolsOpen()) nwWindow.showDevTools();
                    else nwWindow.closeDevTools();
                };
            }
        ]
    };
}]);
