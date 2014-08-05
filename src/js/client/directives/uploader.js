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
