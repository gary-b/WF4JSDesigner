'use strict';

app.directive('actFlowchart', function (designerUI, wfPartDefs, flowchartPlumb, environment, $rootScope) {
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
            scope.cantExpand = attrs.cantExpand === 'true';
            scope.mustExpand = attrs.mustExpand === 'true';
            scope.expanded = false;
            scope.expander = function() {
                scope.expanded = !scope.expanded;
                //wait for dom, initialize jsPlumb and create endpoint on start-node
                if (scope.expanded) {
                    cntrl.flowchartInstance = flowchartPlumb.createFlowchart();
                    cntrl.flowchartInstance.initFlowchart(element, scope.actFlowchart, 'ConnectionsContextMenu');
                    scope.availableTypes = environment.types;

                    scope.deleteConnection = function() {
                        cntrl.flowchartInstance.deleteConnection();
                    };
                    scope.mouseDown = function(event) {
                        event.stopPropagation();
                        event.preventDefault();
                    };
                    //jquery droppable - handling drops from toolbox
                    var droppableArea = angular.element(element.find('div')[0]);
                    droppableArea.droppable({
                        accept: '.activity-tool, .flow-node-tool',
                        drop: function (event, ui) {
                            var type = ui.draggable.attr('data-type');
                            var category = ui.draggable.attr('data-category');
                            //convert screen coordinates to coordinates relative to top left of flowchart
                            var elementBounds = element.find('.drop-zone')[0].getBoundingClientRect();
                            var relPos = {
                                left: ui.position.left - elementBounds.left,
                                top: ui.position.top - elementBounds.top
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
                    scope.$on('$destroy', function() {
                        droppableArea.droppable('disable');
                    });
                }
            };
            if (scope.mustExpand) {
                scope.expander();
            }
            //unlink expander when view is locked
            if (scope.mustExpand || scope.cantExpand) {
                scope.expander = undefined;
            }
            scope.maximizer = function () {
                $rootScope.$emit('maximizedWfPart', scope.actFlowchart);
            };
        }
    };
});