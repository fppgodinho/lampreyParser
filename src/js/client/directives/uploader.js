angular.module('lampreyParser').directive('uploader', [function()               {
    return {
        restrict:       'E',
        scope:          {},
        templateUrl:    'templates/directives/uploader.html',
        controller:     ['$scope', '$element',
            function($scope, $element)                                          {
                var fileBrowser = $element.$("#FILE");
//                
//                $scope.browse = function()                                      {
//                    console.log('HUmmmmm');
//                }
            }
        ]
    };
}]);
