'use strict';

app.directive('propGridFlowSwitch', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propGridFlowSwitch.html',
        scope: {
            propGridFlowSwitch: '='
        }
    };
});
