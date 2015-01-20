'use strict';

app.directive('actFlowchart', function (designerUI, wfPartDefs, flowchartPlumb, environment) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/actFlowchart.html',
        scope: {
            actFlowchart: '='
        },
        controller: function($scope){
            //controller required as a means to share flowchartInstance with nested directives
            //flowchartInstance is set in the link function for now
        },
        link: function (scope, element, attrs, cntrl) {

            //storing the flowchartPlumb instance on the controller so nested directives can access it
            cntrl.flowchartInstance = flowchartPlumb.createFlowchart();

            scope.expanded = false;
            scope.expand = function() {
                scope.expanded = true;
                //wait for dom, initialize jsPlumb and create endpoint on start-node
                cntrl.flowchartInstance.initFlowchart(element, scope.actFlowchart, 'ConnectionsContextMenu');
            };
            scope.collapse = function() {
                scope.expanded = false;
                alert('not implemented - handle jsplumb stuff');
            };
            scope.deleteConnection = function() {
                cntrl.flowchartInstance.deleteConnection();
            };
            scope.mouseDown = function(event) {
                event.stopPropagation();
                event.preventDefault();
            };
            scope.availableTypes = environment.types;

            //jquery droppable - handling drops from toolbox
            element.find('div').droppable({
                accept: '.activity-tool, .flow-node-tool',
                drop: function (event, ui) {
                    var type = ui.draggable.attr('data-type');
                    var category = ui.draggable.attr('data-category');
                    var relPos = {
                        //distance flowchart is left and 100px for toolbox width
                        left: ui.position.left - element.prop('offsetLeft') - 100,
                        //distance flowchart is from top
                        top: ui.position.top - element.prop('offsetTop')
                    };
                    scope.$apply(function() {
                        if (category == 'flow-node-tool' && type == 'FlowSwitch') {
                            scope.flowSwitchDropRelPos = relPos;
                            scope.showFlowSwitchPopup = true;
                        } else {
                            cntrl.flowchartInstance.insertPartToWfModel(category, type, relPos);
                        }
                    });
                }
            });
            scope.createFlowSwitch = function(genericParamT) {
                if (genericParamT == null) {
                    throw 'createFlowSwitch function requires genericParamT parameter';
                }
                var genericParams = {
                    t: genericParamT
                };
                scope.showFlowSwitchPopup = false;
                cntrl.flowchartInstance.insertPartToWfModel('flow-node-tool', 'FlowSwitch', scope.flowSwitchDropRelPos, genericParams);
            };
            scope.cancelCreateFlowSwitch = function() {
                scope.showFlowSwitchPopup = false;
                scope.flowSwitchDropRelPos = null;
            };
            scope.$watchCollection('actFlowchart.nodes', function (newNodes, oldNodes) {
                if (newNodes != null && oldNodes != null) {
                    cntrl.flowchartInstance.checkForAndHandleRemovedNodes(newNodes);
                }
            });
        }
    };
});