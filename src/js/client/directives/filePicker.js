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
