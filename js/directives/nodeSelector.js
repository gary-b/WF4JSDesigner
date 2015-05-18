'use strict';

app.directive('nodeSelector', function ($compile, wfPartDefinitions) {
    return {
        restrict: 'A',
        require: '^actFlowchart',
        scope: false,
        link: function(scope, element, attrs, cntrl) {
            var node = scope.$eval(attrs.nodeSelector);
            if (node != null) {
                //get the appropriate directive
                var dir;
                switch(node.type) {
                    case 'FlowStep':
                        //flowSteps dont have their own directive, the directive for the activity
                        //assigned to their action property is added to the flowchart directly
                        //This also means we have to call the initialisation code (flowchartPlumb.initFlowStep)
                        //directly.
                        var activity = node.action;
                        dir = wfPartDefinitions.getDirective(activity.type);
                        element.attr(dir, attrs.nodeSelector + '.action');//FIXME: very hacky
                        cntrl.flowchartInstance.initFlowStep(element, node);
                        break;
                    case 'FlowDecision':
                    case 'FlowSwitch':
                        dir = wfPartDefinitions.getDirective(node.type);
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