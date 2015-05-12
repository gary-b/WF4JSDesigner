'use strict';

app.directive('actBase', function(designerUI) {
    return {
        restrict: 'A',
        transclude: true,
        templateUrl: './js/templates/actBase.html',
        scope: {
            actBase: '=',
            expander: '='
        },
        link: function(scope, element, attrs, cntrl){
            //FIXME: use controller, share with flowNode
            scope.select = function($event) {
                if ($event.originalEvent.selectHandled !== true) {
                    designerUI.setSelectedItem(scope.actBase);
                    $event.originalEvent.selectHandled = true;
                }
            };
            scope.isSelected = function() {
                return designerUI.isSelectedItem(scope.actBase);
            };
        }
    };
});