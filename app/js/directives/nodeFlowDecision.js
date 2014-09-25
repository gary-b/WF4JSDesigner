'use strict';

app.directive('nodeFlowDecision', function(flowchartPlumb) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/nodeFlowDecision.html',
        scope: {
            nodeFlowDecision: '='
        },
        link: function(scope, element, attrs, cntrl) {
            flowchartPlumb.initFlowDecision(element, scope.nodeFlowDecision);
        }
    };
});