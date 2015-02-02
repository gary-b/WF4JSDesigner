'use strict';

app.directive('tool', function() {
    return {
        restrict: 'A',
        templateUrl: './js/templates/tool.html',
        scope: {
            tool: '='
        },
        link: function(scope, element, attrs, ctrl) {
            //using jquery draggable here
            element.find('div').draggable({ helper: function() {
                var toDrag = $(element).find(".tool-text").clone();
                toDrag.css("position", "absolute");
                return toDrag;
            } });
        }
    }
});
