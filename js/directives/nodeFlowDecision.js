'use strict';

app.directive('nodeFlowDecision', function() {
    return {
        restrict: 'A',
        require: '^actFlowchart',
        templateUrl: './js/templates/nodeFlowDecision.html',
        scope: {
            nodeFlowDecision: '='
        },
        link: function(scope, element, attrs, cntrl) {
            cntrl.flowchartInstance.initFlowDecision(element, scope.nodeFlowDecision);
        }
    };
});