'use strict';

app.directive('actSequence', function($rootScope) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/actSequence.html',
        scope: {
            actSequence: '='
        },
        link: function(scope, element, attrs, cntrl) {
            scope.cantExpand = attrs.cantExpand === 'true';
            scope.maximizer = function () {
                $rootScope.$emit('maximizedWfPart', scope.actSequence);
            };
        }
    };
});
