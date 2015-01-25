'use strict';

app.directive('wfPropertyGrid', function ($compile, designerUI, wfPartDefs, flowchartPlumb) {
    return {
        templateUrl: './js/templates/wfPropertyGrid.html',
        restrict: 'A',
        scope: {},
        link: function (scope, element, attrs, ctrl) {
            var target = $('#PropList');
            scope.expanded = true;
            function selectDirective(item) {
                target.html(null);
                if (item == null) {
                    target.html('(No item selected)');
                } else {
                    var dirName;
                    if (item.modelType === 'wfPart') {
                        dirName = wfPartDefs.getPropGridDirective(item.type);
                    } else if (item.modelType === 'flowchartPlumbConnection') {
                        dirName = flowchartPlumb.getPropGridDirective(item.type);
                    } else {
                        throw "Unknown modelType";
                    }
                    if (dirName == null) {
                        target.html('Selected item has no properties');
                    } else {
                        var dir = angular.element('<div ' + dirName + '="selectedItem"></div>');
                        target.append(dir);
                        $compile(target)(scope);
                    }
                }
            }
            scope.$watch(function () {
                return designerUI.selectedItem;
            }, function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    scope.selectedItem = newVal;
                    selectDirective(newVal);
                }
            });
            scope.expander = function() {
                scope.expanded = !scope.expanded;
            }
        }
    }
});