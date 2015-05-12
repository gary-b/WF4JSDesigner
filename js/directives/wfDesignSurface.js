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
                if (newVal == null && oldVal != null) {
                   scope.$broadcast('rootWfPart:Deleted');
                }
                scope.display(newVal);
            });
            scope.$on('wfPart:maximize', function(event, wfPart) {
                scope.display(wfPart);
            });
            scope.$on('wfPart:delete', function(event, wfPart) {
                if (scope.displayWfPart === wfPart
                    && scope.wfDesignSurface !== wfPart
                    && wfPart.parent != null) {
                    scope.display(wfPart.parent);
                }
            });
            scope.display = function (wfPart) {
                scope.displayWfPart = wfPart;
                scope.path = [];
                var part = wfPart;
                while (part != null) {
                    scope.path.unshift(part);
                    part = part.parent;
                }
            };
        }
    };
});