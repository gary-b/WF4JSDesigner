'use strict';

app.directive('nodeFlowSwitch', function() {
    return {
        restrict: 'A',
        require: '^actFlowchart',
        templateUrl: './js/templates/nodeFlowSwitch.html',
        scope: {
            nodeFlowSwitch: '='
        },
        link: function(scope, element, attrs, cntrl) {
            cntrl.flowchartInstance.initFlowSwitch(element, scope.nodeFlowSwitch);
        }
    };
});