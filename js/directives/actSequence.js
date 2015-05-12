'use strict';

app.directive('actSequence', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/actSequence.html',
        scope: {
            actSequence: '='
        },
        link: function(scope, element, attrs, cntrl) {
            scope.cantExpand = attrs.cantExpand === 'true';
            scope.maximizer = function () {
                scope.$emit('wfPart:maximize', scope.actSequence);
            };
        }
    };
});
