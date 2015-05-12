'use strict';

app.directive('wfToolbox', function (toolbox) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/wfToolbox.html',
        link: function (scope, element, attrs, ctrl) {
            scope.tools = toolbox.tools;
        }
    };
});