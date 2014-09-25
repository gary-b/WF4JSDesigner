'use strict';

app.directive('propGridFlowSwitchConnection', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propGridFlowSwitchConnection.html',
        scope: {
            propGridFlowSwitchConnection: '='
        },
        link: function(scope, element, attr, cntrl) {
            scope.case = scope.propGridFlowSwitchConnection.connection.getParameter('case');
            scope.isDefault = (scope.case.default.case === scope.case);
            //a lot of model specific code here
            scope.$watch('isDefault', function(newVal, oldVal) {
                if (newVal === true) {
                    if (scope.case.default.case !== scope.case) {
                        scope.case.default.case = scope.case;
                        scope.case.default.defaultDisplayName = 'Default';
                        scope.case.caseValue = null;
                    }
                } else {
                    if (scope.case.default.case === scope.case) {
                        scope.case.default.case = null;
                    }
                }
            });
        }
    };
});