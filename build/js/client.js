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
                var fs          = require('fs');
                var gui         = require('nw.gui');
                //
                $scope.selected         = 'connection';
                $scope.connected        = false;
                $scope.sourceFile       = null;
                $scope.exportFolder     = null;
                $scope.appFolder        = gui.App.dataPath + '\\Export';
                $scope.loading          = false;
                $scope.offset           = 5;
                //
                if (!fs.existsSync($scope.appFolder)) fs.mkdirSync($scope.appFolder);
                //
                var buffer      = [];
                var tags        = {};
                var stream      = null;
                $scope.export = function()                                      {
                    if ($scope.loading || !$scope.sourceFile || !$scope.exportFolder) return;
                    var exportFile  = $scope.exportFolder.path + '/export.csv';
                    if (fs.existsSync(exportFile)) fs.truncateSync(exportFile, 0);
                    var reportFile  = $scope.exportFolder.path + '/report.csv';
                    if (fs.existsSync(reportFile)) fs.truncateSync(reportFile, 0);
                    tags            = {};
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
                //
                var leftover    = '';
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
                //
                function parseLine(line)                                        {
                    line = line.trim();
                    if (line.charAt(0) == '"' || line.charAt(0) =="'") line = line.substr(1);
                    if (line.charAt(line.length-1) == '"' || line.charAt(line.length-1) =="'") line = line.substr(0, line.length-1);
                    if (line.indexOf('*TAG:') < 0) return '';
                    var lineParts = line.split(" "); lineParts.shift();
                    //
                    lineParts.shift();
                    lineParts.shift();
                    //
                    var datePart    = lineParts.shift();
                    var timePart    = lineParts.shift();
                    var tag         = lineParts.join(' ');
                    var dateTime    = new Date(datePart.substr(6), datePart.substr(0, 2), datePart.substr(3, 2), timePart.substr(0, 2), timePart.substr(3, 2), timePart.substr(6, 2), timePart.substr(9));
                    var date        = ("00" + dateTime.getDate()).substr(-2) + "/" + ("00" + dateTime.getMonth()).substr(-2) + "/" + dateTime.getFullYear();
                    var time        = ("00" + dateTime.getHours()).substr(-2) + ":" + ("00" + dateTime.getMinutes()).substr(-2) + ":" + ("00" + dateTime.getSeconds()).substr(-2);
                    //
                    if (!tags[tag]) tags[tag]   = {time: dateTime, start: date + " " + time, aproaches: 1};
                    tags[tag].end               = date + " " + time;
                    if (dateTime - tags[tag].time > $scope.offset * 1000) tags[tag].aproaches++;
                    tags[tag].time = dateTime;
                    //
                    line    = '';
                    line    += dateTime.getTime() + ",";
                    line    += date + ",";
                    line    += time + ",";
                    line    += tag;
                    //
                    return line + '\n';
                }
                
                var saving = false; 
                function writeData()                                            {
                    if (saving || !$scope.exportFolder) return; saving = true;
                    var exportFile  = $scope.exportFolder.path + '/export.csv';
                    var line        = buffer.shift();
                    fs.appendFile(exportFile, line, function(err)               {
                        saving = false;
                        if (!err && buffer.length) writeData();
                        else if (err) console.log(err);
                        else if (stream) stream.resume();
                        else writeReport();
                    });
                }
                
                function writeReport()                                          {
                    if (!tags || !$scope.exportFolder) return;
                    //
                    var report = '';
                    for (var tag in tags)                                       {
                        report += (report?'\n':'') + tag + ',' + tags[tag].start + ',' + tags[tag].end + ',' + tags[tag].aproaches;
                    }
                    //
                    var reportFile  = $scope.exportFolder.path + '/report.csv';
                    fs.writeFile(reportFile, report);
                }
                
                var nwWindow  = require('nw.gui').Window.get();
                $scope.switchDebug = function() {
                    if (!nwWindow.isDevToolsOpen()) nwWindow.showDevTools();
                    else nwWindow.closeDevTools();
                };
                // nwWindow.showDevTools();
            }
        ]
    };
}]);
