'use strict';

app.directive('actSequence', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/actSequence.html',
        scope: {
            actSequence: '='
        }
    };
});
