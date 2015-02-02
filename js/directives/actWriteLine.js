'use strict';

app.directive('actWriteLine', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/actWriteLine.html',
        scope: {
            actWriteLine: '='
        }
    };
});