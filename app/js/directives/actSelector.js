'use strict';

app.directive('actSelector', function($compile, wfPartDefs) {
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
            function selectDirective(activity) {
                if (lastDirective != null) {
                    element.removeAttr(lastDirective);
                }
                var newDirective = wfPartDefs.getDirective(activity.type);
                element.attr(newDirective, attrs.actSelector);
                element.removeAttr('act-selector');
                element.removeAttr('ng-repeat');
                $compile(element)(scope);
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
        }
    };
});