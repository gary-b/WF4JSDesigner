'use strict';

app.directive('actFlowchart', function (designerUI, wfPartDefs, flowchartPlumb, environment) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/actFlowchart.html',
        scope: {
            actFlowchart: '='
        },
        link: function (scope, element, attrs, cntrl) {
            scope.expanded = false;
            scope.expand = function() {
                scope.expanded = true;
                //wait for dom, initialize jsPlumb and create endpoint on start-node
                flowchartPlumb.initFlowchart(element, scope.actFlowchart, 'ConnectionsContextMenu');
            },
                scope.collapse = function() {
                    scope.expanded = false;
                    alert('not implemented - handle jsplumb stuff');
                };
            scope.deleteConnection = function() {
                flowchartPlumb.deleteConnection();
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
                            flowchartPlumb.insertPartToWfModel(category, type, relPos);
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
                flowchartPlumb.insertPartToWfModel('flow-node-tool', 'FlowSwitch', scope.flowSwitchDropRelPos, genericParams);
            };
            scope.cancelCreateFlowSwitch = function() {
                scope.showFlowSwitchPopup = false;
                scope.flowSwitchDropRelPos = null;
            };
            scope.$watchCollection('actFlowchart.nodes', function (newNodes, oldNodes) {
                if (newNodes != null && oldNodes != null) {
                    flowchartPlumb.checkForAndHandleRemovedNodes(newNodes);
                }
            });
        }
    };
});