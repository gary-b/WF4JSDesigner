'use strict';

app.directive('flowNode', function(designerUI) {
    return {
        restrict: 'A',
        transclude: true,
        templateUrl: './js/templates/flowNodeBase.html',
        scope: {
            flowNode: '='
        },
        link: function(scope, element, attrs, cntrl){
            //FIXME: use controller, share with actBase
            scope.select = function($event) {
                if ($event.originalEvent.selectHandled !== true) {
                    designerUI.setSelectedItem(scope.flowNode);
                    $event.originalEvent.selectHandled = true;
                }
            };
            scope.isSelected = function() {
                return designerUI.isSelectedItem(scope.flowNode);
            };
        }
    };
});