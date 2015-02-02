'use strict';

app.directive('propGridWriteLine', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propGridWriteLine.html',
        scope: {
            propGridWriteLine: '='
        }
    };
});