'use strict';

app.directive('propGridFlowchart', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propGridFlowchart.html',
        scope: {
            propGridFlowchart: '='
        }
    };
});