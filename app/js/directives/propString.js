'use strict';

app.directive('propString', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propString.html',
        scope: {
            propString: '=',
            label: '@'
        }
    };
});