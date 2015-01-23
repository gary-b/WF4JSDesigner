'use strict';

app.directive('actSelector', function($compile, wfPartDefs, ContextMenuService) {
    return {
        restrict: 'A',
        scope:false,
        /*  Attributes expected are actSelector set to expression returning activity to display
         Optional attribute: changeable set to a boolean: when true the directive watches for
         changes to actSelector and acts accordingly.
         (Since this is a placeholder directive of sorts that dynamically adds a directive
         for the specific type of Activity passed in i decided not to use an isolated scope.
         Now that we are using scope.$eval everywhere im not so sure that was a good decision
         */
        link: function(scope, element, attrs, ctrl) {
            var lastDirective;
            var lastScope;
            function destroyLastDirective(){
                if (lastDirective != null) {
                    ContextMenuService.closeFlag = true;
                    element.removeAttr(lastDirective);
                    lastScope.$destroy();
                }
                lastDirective = null;
                lastScope = null;
            }
            function selectDirective(activity) {
                destroyLastDirective();
                var newDirective = wfPartDefs.getDirective(activity.type);
                element.attr(newDirective, attrs.actSelector);
                element.removeAttr('act-selector');
                element.removeAttr('ng-repeat');
                lastScope = scope.$new();
                $compile(element)(lastScope);
                lastDirective = newDirective;
            }

            var activity = scope.$eval(attrs.actSelector);

            if (activity != null) {
                selectDirective(activity);
            }
            if (scope.$eval(attrs.changeable) === true) {
                scope.$watch(function() {
                    return scope.$eval(attrs.actSelector);
                }, function(newVal, oldVal) {

                    if (newVal != null) {
                        selectDirective(newVal);
                    }
                });
            }
            scope.$on('nearestActSelectorDestroyDirective', function(event, args) {
                destroyLastDirective();
            });
        }
    };
});