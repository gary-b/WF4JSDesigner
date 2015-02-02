'use strict';

app.directive('propGridFlowDecision', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propGridFlowDecision.html',
        scope: {
            propGridFlowDecision: '='
        }
    };
});
