'use strict';

app.directive('wfDesignSurface', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/wfDesignSurface.html',
        scope: {
            wfDesignSurface: '='
        },
        link: function(scope, element, attrs, ctrl) {
            scope.$watch('wfDesignSurface', function(newVal, oldVal) {
               if (newVal == null) {
                   scope.$broadcast('nearestActSelectorDestroyDirective');
               }
            });
        }
    };
});