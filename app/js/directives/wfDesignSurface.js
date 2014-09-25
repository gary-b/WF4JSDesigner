'use strict';

app.directive('wfDesignSurface', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/wfDesignSurface.html',
        scope: {
            wfDesignSurface: '='
        }
    };
});