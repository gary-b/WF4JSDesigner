'use strict';

app.directive('flowSwitchCasePopup', function() {
    return {
        restrict: 'A',
        require: '^actFlowchart',
        templateUrl: './js/templates/flowSwitchCasePopup.html',
        link: function(scope, element, attrs, cntrl) {
            var popupViewModel = null;
            scope.showCasePopup = false;
            scope.$watch(function() {
                return cntrl.flowchartInstance.flowSwitchCasePopup;
            }, function(newVal, oldVal) {
               if (newVal != null) {
                   popupViewModel = newVal;
                   scope.showCasePopup = true;
               }
            });
            scope.cancelCase = function() {
                cntrl.flowchartInstance.cancelFlowSwitchCase(popupViewModel);
                cntrl.flowchartInstance.flowSwitchCasePopup = popupViewModel = null; //release references to object
                scope.showCasePopup = false;
            };
            scope.setCase = function(caseValue) {
                popupViewModel['case'].caseValue = caseValue; //update object property
                cntrl.flowchartInstance.flowSwitchCasePopup = popupViewModel = null; //release references to object
                scope.showCasePopup = false;
            };
        }
    };
});