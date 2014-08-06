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
