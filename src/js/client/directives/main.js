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
