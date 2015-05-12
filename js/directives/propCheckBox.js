'use strict';

app.directive('propCheckBox', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/propCheckBox.html',
        scope: {
            propCheckBox: '=',
            label: '@'
        }
    };
});