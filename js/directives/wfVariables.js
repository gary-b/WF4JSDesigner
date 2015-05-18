'use strict';

app.directive('wfVariables', function(dotNetEnvironment, designerUI) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/wfVariables.html',
        scope: {
        },
        link: function (scope, element, attrs, ctrl) {
            scope.part = null;
            scope.variables = [];
            scope.partsForVars = [];
            scope.$watch(function() {
                return designerUI.selectedItem;
            }, resetView);
            function resetView(newVal) {
                if (newVal != null && newVal.modelType === 'wfPart') {
                    scope.part = newVal;
                } else {
                    scope.part = null;
                }
                //might be more performant not to clear variables each time?
                scope.variables = [];
                scope.partsForVars = getPartsForVars();
                if (scope.partsForVars.length === 0) {
                    $('#NewBar').html('Select an Activity which can hold Variables, or a child thereof');
                } else {
                    $('#NewBar').html('Create Variable');
                }
                angular.forEach(scope.partsForVars, function (activity) {
                    var vars = activity.getVariableArray();
                    if (vars != null) {
                        angular.forEach(vars, function (v) {
                            //warning - modifying the variable object here
                            //dont get old and new values with ngChange, so storing old value here
                            //saves us adding watches to a property on every variable
                            v.newScope = activity;
                            v.oldScope = activity;
                        });
                        scope.variables.push.apply(scope.variables, vars);
                    }
                });
            };
            scope.getAvailableTypes = function () {
                return dotNetEnvironment.types;
            };
            function getPartsForVars() {
                //must return closest part to scope.part first
                var parts = [ ];
                var part = scope.part;
                while (part != null) {
                    if (part.getVariableArray() != null) {
                        parts.push(part);
                    }
                    part = part.parent;
                }
                return parts;
            }
            scope.changeScope = function(variable) {
                //remove variable from current part and add to part in ngModel
                remove(variable.oldScope.getVariableArray(), variable);
                variable.newScope.getVariableArray().push(variable);
                variable.oldScope = variable.newScope;
            };
            scope.newVariable = function() {
                //create a new variable in collection giving it default type
                if (scope.partsForVars.length > 0) {
                    var closestPart = scope.partsForVars[0];
                    var variable = {
                        name: "",           //should generate next free name VariableX
                        type: "String",     //dependency
                        defaultValue: "",
                        newScope: closestPart,
                        oldScope: closestPart
                    };
                    closestPart.getVariableArray().push(variable);
                    //need to refresh the list of variables
                    resetView(scope.part); // hacky
                }
            };
            scope.deleteVariable = function(variable) {
                var arr = variable.newScope.getVariableArray();
                remove(arr, variable);
                resetView(scope.part); // hacky
            };
            //FIXME: repeated this code in wfArguments
            function remove(arr, item) {
                var index = arr.indexOf(item);
                if (index > -1) {
                    arr.splice(index, 1);
                }
            }
        }
    };
});