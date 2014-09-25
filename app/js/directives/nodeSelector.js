'use strict';

app.directive('nodeSelector', function ($compile, wfPartDefs, flowchartPlumb) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs, ctrl) {
            var node = scope.$eval(attrs.nodeSelector);
            if (node != null) {
                //get the appropriate directive
                var dir;
                switch(node.type) {
                    case 'FlowStep':
                        //flowSteps dont have their own directive, the directive for the activity
                        //assigned to their action property is added tot he flowchart directly
                        //This also means we have to call the initialisation code (flowchartPlumb.initFlowStep)
                        //directly.
                        var activity = node.action;
                        dir = wfPartDefs.getDirective(activity.type);
                        element.attr(dir, attrs.nodeSelector + '.action');//FIXME: very hacky
                        flowchartPlumb.initFlowStep(element, node);
                        break;
                    case 'FlowDecision':
                    case 'FlowSwitch':
                        dir = wfPartDefs.getDirective(node.type);
                        element.attr(dir, attrs.nodeSelector);
                        break;
                    default:
                        throw "Unknown flowNode passed to nodeSelector";
                }
                //add style
                var pos = node.position;
                element.attr('style', 'position:absolute;top:' + pos.top + 'px;left:' + pos.left + 'px;');
                element.removeAttr('node-selector');
                element.removeAttr('ng-repeat');
                $compile(element)(scope);
            }
        }
    }
});