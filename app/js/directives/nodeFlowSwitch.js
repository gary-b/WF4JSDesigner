'use strict';

app.directive('nodeFlowSwitch', function(flowchartPlumb) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/nodeFlowSwitch.html',
        scope: {
            nodeFlowSwitch: '='
        },
        link: function(scope, element, attrs, cntrl) {
            flowchartPlumb.initFlowSwitch(element, scope.nodeFlowSwitch);
        }
    };
});