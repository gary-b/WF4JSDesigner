'use strict';

app.directive('flowSwitchCasePopup', function(flowchartPlumb) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/flowSwitchCasePopup.html',
        link: function(scope, element, attrs, cntrl) {
            var popupViewModel = null;
            scope.showCasePopup = false;
            scope.$watch(function() {
                return flowchartPlumb.flowSwitchCasePopup;
            }, function(newVal, oldVal) {
               if (newVal != null) {
                   popupViewModel = newVal;
                   scope.showCasePopup = true;
               }
            });
            scope.cancelCase = function() {
                flowchartPlumb.cancelFlowSwitchCase(popupViewModel);
                flowchartPlumb.flowSwitchCasePopup = popupViewModel = null; //release references to object
                scope.showCasePopup = false;
            };
            scope.setCase = function(caseValue) {
                popupViewModel['case'].caseValue = caseValue; //update object property
                flowchartPlumb.flowSwitchCasePopup = popupViewModel = null; //release references to object
                scope.showCasePopup = false;
            };
        }
    };
});