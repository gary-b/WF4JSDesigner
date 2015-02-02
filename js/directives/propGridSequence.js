'use strict';

app.directive('propGridSequence', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propGridSequence.html',
        scope: {
            propGridSequence: '='
        }
    };
});