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

angular.module('lampreyParser').directive('main', [function()                   {
    return {
        restrict:       'E',
        scope:          {},
        templateUrl:    'templates/directives/main.html',
        controller:     ['$scope',
            function($scope)                                                    {
                $scope.selected         = 'connection';
                $scope.connected        = false;
                //
                var nwWindow  = require('nw.gui').Window.get();
                $scope.switchDebug = function() {
                    if (!nwWindow.isDevToolsOpen()) nwWindow.showDevTools();
                    else nwWindow.closeDevTools();
                };
            }
        ]
    };
}]);

angular.module('lampreyParser').directive('uploader', [function()               {
    return {
        restrict:       'E',
        scope:          {},
        templateUrl:    'templates/directives/uploader.html',
        controller:     ['$scope', '$element',
            function($scope, $element)                                          {
                var browser     = $element.find("#FILE");
                browser.on('change', function(){ $scope.$apply(); })
                
                
                
                $scope.file     = null;
                
                $scope.browse   = function() { browser.click(); };
                
                $scope.$watch(function(){
                    return (browser.files && browser.files.length)?browser.files[0]:null;
                }, function(){
                    console.log('Hummm', $scope.file);
                });
                
            }
        ]
    };
}]);
