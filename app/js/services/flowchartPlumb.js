'use strict';

app.value('jsPlumb', jsPlumb)
    .factory('flowchartPlumb', function (jsPlumb, renderWaiter, designerUI, $rootScope, ContextMenuService, wfPartDefs) {
        return {
            getPropGridDirective: function (type) {
                switch(type) {
                    case 'FlowchartConnection': // ie connection from start-node
                    case 'FlowStepConnection':
                    case 'FlowDecisionConnection':
                        return null;
                        break;
                    case 'FlowSwitchConnection':
                        return 'prop-grid-flow-switch-connection';
                        break;
                    default:
                        throw 'Unknown flowchartPlumbConnection type';
                }
            },
            createFlowchart: function () {
                return {
                    jsPlumbInstance: null,
                    flowchart: null, //the single flowchart model this service will deal with
                    nodeElements: [],  //keep track of nodes and associated dom element
                    connectorParams: {  //FIXME: look into jsPlumb.Defaults
                        connector: "Flowchart",
                        endpoint: "Rectangle",
                        paintStyle: { width: 15, height: 11, strokeStyle: "lightgrey", fillStyle: 'lightgrey' },
                        connectorStyle: { lineWidth: 3, strokeStyle: "lightgrey", fillStyle: 'lightgrey' }
                    },
                    selectedConPaintStyle: { //FIXME: look into jsPlumb 'types'
                        lineWidth: 3, strokeStyle: "deepskyblue", fillStyle: 'deepskyblue'
                    },
                    unRegSelectedItemWatch: null, // FIXME: call when unregistering jsPlumb stuff
                    unRegBoundLabels: [],  // FIXME: look at when unregistering jsPlumb stuff
                    connectionsMenu: null, //context menu for connections
                    flowSwitchCasePopup: null, //a directive watches this property and shows popup to user when not null capturing caseValue
                    //It immediately sets it null afterward
                    bindLabel: function(tiedObject, label, labelFn) {
                        var unReg = {
                            tiedObject: tiedObject,
                            fn: $rootScope.$watch(labelFn, function (newVal, oldVal) {
                                if (newVal != oldVal) {
                                    label.setLabel(newVal);
                                }
                            })
                        };
                        this.unRegBoundLabels.push(unReg);
                    },
                    unBindLabels: function(tiedObject) {
                        var i = 0;
                        while(i < this.unRegBoundLabels.length) {
                            var unReg = this.unRegBoundLabels[i];
                            if (unReg.tiedObject === tiedObject) {
                                unReg.fn();
                                this.unRegBoundLabels.splice(i, 1);
                            } else {
                                i++;
                            }
                        }
                    },
                    initFlowchart: function (element, flowchartModel, conMenu) {
                        //wait for dom, initialize jsPlumb and create endpoint on start-node
                        this.flowchart = flowchartModel;
                        var self = this;
                        renderWaiter.afterRender(function () {
                            return $(element).find('.start-node');
                        }, function () {
                            self.connectionsMenu = angular.element(document.getElementById(conMenu));
                            self.unRegSelectedItemWatch = $rootScope.$watch(function() {
                                return designerUI.selectedItem;
                            }, function (newValue, oldValue) {
                                self.selectedItemChanged(newValue, oldValue);
                            });
                            function coalesce(value, ifnull) {
                                if (value === null || value === undefined)
                                    return ifnull;
                                return value;
                            }
                            function connectionAdded(elSource, elTarget, connection, sourceEndpoint) {
                                var sourcePart = $(elSource).data('flowchartPart');
                                var targetPart = $(elTarget).data('flowchartPart');

                                if (sourcePart.type === 'FlowDecision' && sourcePart.modelType === 'wfPart') {
                                    // sourceInfo is an object that was added to each flowDecision source endpoint.
                                    // It lets us identify whether the connection is from the true or false endpoint.
                                    // Since user can change the display name from True False to something else
                                    // the sourceInfo object also contains a Fn to retrieve the relevant label.
                                    // We use this to bind the label value to a label overlay displayed on the connection.
                                    var sourceInfo = sourceEndpoint.getParameter('sourceInfo');
                                    sourcePart.connectNode(targetPart.nodeId, sourceInfo);
                                    connection.addOverlay([ 'Label', {
                                        label: sourceInfo.labelFn(),
                                        id:'label'
                                    } ]);
                                    var label = connection.getOverlay('label');
                                    self.bindLabel(connection, label, sourceInfo.labelFn);
                                } else if (sourcePart.type === 'FlowSwitch' && sourcePart.modelType === 'wfPart') {
                                    // Here we must retrieve a new case object from the FlowSwitch, then pass this
                                    // back to the flowswitch when we call connectNode. We need the case object so
                                    // we can:
                                    // a) Pass the case to the FlowSwitchCasePopup directive to allow the user
                                    //     set the initial case value.
                                    // b) Bind case.caseValue to the overlay label on the connection
                                    // c) Add the case as a property to the connection so when the connection is
                                    //    later selected in the GUI the case object is accessible by the
                                    //    propGridFlowSwitch directive so its properties can be edited in the
                                    //    propertyGrid.
                                    var sourceInfo = {
                                        case: sourcePart.createCase()
                                    };
                                    sourcePart.connectNode(targetPart.nodeId, sourceInfo);
                                    //retVal will be a case object
                                    var labelFn = function() {
                                        return (sourceInfo.case.default.case === sourceInfo.case) ?
                                            coalesce(sourceInfo.case.default.defaultDisplayName, '') :
                                            coalesce(sourceInfo.case.caseValue, '');
                                    };
                                    connection.setParameter('case', sourceInfo.case);
                                    connection.addOverlay([ 'Label', {
                                        label: labelFn(),
                                        id:'label'
                                    } ]);
                                    var label = connection.getOverlay('label');
                                    self.bindLabel(connection, label, labelFn);
                                    self.showFlowSwitchCasePopup(sourceInfo.case, connection);
                                }
                                //parameters copied from sourceEndpoint to connection by default - dont need this
                                connection.setParameter('sourceInfo', undefined);
                            }
                            function connectionRemoved(elSource, elTarget, connection) {
                                var sourcePart = $(elSource).data('flowchartPart');
                                var targetPart = $(elTarget).data('flowchartPart');
                                sourcePart.disconnectNode(targetPart.nodeId);
                                self.unBindLabels(connection);
                                connection.setParameter('case', undefined);
                            }
                            $(element).find('.start-node').data('flowchartPart', self.flowchart);
                            self.jsPlumbInstance = jsPlumb.getInstance();
                            self.jsPlumbInstance.setContainer($(element).find('.drop-zone'));
                            self.jsPlumbInstance.addEndpoint($(element).find('.start-node'), {
                                anchor: [0.5, 1, 0, 1, 0, 4],
                                isSource: true
                            }, self.connectorParams);

                            self.jsPlumbInstance.bind("connection", function (info, originalEvent) {
                                //fires when connection moved as well as for new connections
                                connectionAdded(info.source, info.target, info.connection, info.sourceEndpoint);

                                //info param properties:
                                //connection - the new Connection. you can register listeners on this etc.
                                //sourceId - id of the source element in the Connection
                                //targetId - id of the target element in the Connection
                                //source - the source element in the Connection
                                //target - the target element in the Connection
                                //sourceEndpoint - the source Endpoint in the Connection
                                //targetEndpoint - the targetEndpoint in the Connection
                                if (originalEvent != null) {
                                    originalEvent.preventDefault();
                                    originalEvent.stopPropagation();
                                }
                            });
                            self.jsPlumbInstance.bind("connectionDetached", function (info, originalEvent) {
                                //Does not fire for the old element when connection moved between elements
                                if (info.connection.pending === false) {
                                    connectionRemoved(info.source, info.target, info.connection);
                                    if (designerUI.selectedItem != null) {
                                        if (designerUI.selectedItem.modelType === 'flowchartPlumbConnection') {
                                            //sometimes this event is raised through a programmatic call to remove connection
                                            //thus it is already within a digest cycle
                                            if (originalEvent == null) {
                                                designerUI.selectedItem = flowchartModel;
                                            } else {
                                                $rootScope.$apply(function () {
                                                    designerUI.selectedItem = flowchartModel;
                                                });
                                            }
                                        }
                                    }
                                }
                            });
                            self.jsPlumbInstance.bind("connectionMoved", function (info, originalEvent) {
                                //fires when connection moved from 1 element to another
                                //does not provide source and target properties like connection event
                                var elSource = $('#' + info.originalSourceId);
                                var elTarget = $('#' + info.originalTargetId);
                                connectionRemoved(elSource, elTarget, info.connection);
                                //the connection event will fire after this
                            });
                            self.jsPlumbInstance.bind("click", function (connection, originalEvent) {
                                originalEvent.stopPropagation();
                                originalEvent.preventDefault();
                                $rootScope.$apply(function () {
                                    self.setConnectionAsSelectedItem(connection);
                                    //since weve stopped propagation of the click event, apply hacky solution to closing open standard context menu
                                    ContextMenuService.closeFlag = true;
                                });
                            });
                            self.jsPlumbInstance.bind("contextmenu", function (component, originalEvent) {
                                originalEvent.preventDefault();
                                originalEvent.stopPropagation();

                                if (component instanceof jsPlumb.Connection) {
                                    $rootScope.$apply(function () {
                                        self.setConnectionAsSelectedItem(component);
                                    });
                                    //alert('JsPlumb Context Menu Action');
                                    ContextMenuService.setup(originalEvent.target, self.connectionsMenu);
                                    ContextMenuService.open(originalEvent, self.connectionsMenu);
                                }
                            });
                        })
                    },
                    insertPartToWfModel: function (category, wfPartType, relativePos, genericParams) {
                        var displayPart = wfPartDefs.createModel(this.flowchart, wfPartType, genericParams);
                        var flowNode;
                        if (category === 'activity-tool') {
                            flowNode = wfPartDefs.createModel(this.flowchart, "FlowStep");
                            flowNode.action = displayPart;
                        } else if (category === 'flow-node-tool') {
                            flowNode = displayPart;
                        } else {
                            throw 'That category of tool is not supported in a flowchart';
                        }
                        flowNode.position = relativePos;
                        this.flowchart.nodes.push(flowNode);
                        designerUI.setSelectedItem(displayPart);
                    },
                    setConnectionAsSelectedItem: function(connection) {
                        var sourcePart = $(connection.source).data('flowchartPart');
                        var conSel = {
                            modelType: 'flowchartPlumbConnection',
                            type: sourcePart.type + 'Connection',
                            sourcePart: sourcePart,
                            connection: connection
                        };
                        connection.setPaintStyle(this.selectedConPaintStyle);
                        designerUI.setSelectedItem(conSel);
                    },
                    deleteConnection: function () {
                        if (designerUI.selectedItem.modelType === 'flowchartPlumbConnection') {
                            this.jsPlumbInstance.detach(designerUI.selectedItem.connection); //code in jsPlumb detach event will handle rest
                        } else {
                            alert('deleting this modelType is not implemented in flowchartPlumb');
                        }
                    },
                    initFlowNode: function (element, node, specificFlowNodeInitFn) {
                        //wait for dom, set draggable and create endpoints
                        element.data("flowchartPart", node); //adding node to DOM element
                        var self = this;
                        renderWaiter.afterRender(function () {
                            return $(element).find('.header');
                        }, function () {
                            self.jsPlumbInstance.draggable($(element), {
                                containment: true,
                                stop: function (params) {
                                    node.position.left = element.prop('offsetLeft');
                                    node.position.top = element.prop('offsetTop');
                                }
                            });
                            specificFlowNodeInitFn();
                        });
                        this.nodeElements.push({
                            node: node,
                            element: element
                        });
                    },
                    initFlowStep: function(element, node) {
                        var self = this;
                        this.initFlowNode(element, node, function () {
                            self.addFlowStepEndpoints(element);
                        });
                    },
                    initFlowDecision: function(element, node) {
                        var self = this;
                        this.initFlowNode(element, node, function () {
                            self.addFlowDecisionEndpoints(element, node);
                        });
                    },
                    initFlowSwitch: function(element, node) {
                        var self = this;
                        this.initFlowNode(element, node, function () {
                            self.addFlowSwitchEndpoints(element, node);
                        });
                    },
                    showFlowSwitchCasePopup: function (caseModel, connection) {
                        var self = this;
                        var popupViewModel = {
                            case: caseModel,
                            connection: connection
                        };
                        $rootScope.$apply(function () {
                            self.flowSwitchCasePopup = popupViewModel;
                        });
                    },
                    cancelFlowSwitchCase: function(popupViewModel) {
                        this.jsPlumbInstance.detach(popupViewModel.connection); // our detach code will delete the case object
                    },
                    //FIXME:refactor definitions of FlowNode objects
                    addFlowSwitchEndpoints: function(element, node) {
                        var self = this;
                        function addSourceEndpoint(anchorPos) {
                            self.jsPlumbInstance.addEndpoint($(element), {
                                anchor: anchorPos,
                                isSource: true,
                                maxConnections: -1
                            }, self.connectorParams);
                        }

                        this.addTargetEndpoints(element, 0.1, 0.5, 0.9);
                        addSourceEndpoint([1, 0.5, 1, 0, 6, 0]);
                    },
                    addFlowDecisionEndpoints: function(element, node) {
                        var self = this;
                        function addSourceEndpoint(pos, name, labelFn) {
                            var labelLoc, anchorPos;
                            if (pos === 'left') {
                                labelLoc = [ 0, 1.5 ];
                                anchorPos = [0, 0.5, -1, 0, -6, 0]; //x, y, x-direction, y-dir, x-offset, y-off;
                            } else if (pos = 'right') {
                                labelLoc = [ 1.1, 1.5 ];
                                anchorPos = [1, 0.5, 1, 0, 6, 0];
                            } else {
                                throw 'Invalid arg passed to addFlowDecisionEndpoints: pos must be right or left';
                            }
                            var endpoint = self.jsPlumbInstance.addEndpoint($(element), {
                                anchor: anchorPos,
                                isSource: true,
                                overlays:[
                                    [ "Label", {
                                        label: labelFn(),
                                        id: "label",
                                        location: labelLoc,
                                        cssClass: 'node-flow-decision-overlay'
                                    }]
                                ],
                                parameters: {
                                    sourceInfo: {
                                        name: name,
                                        labelFn: labelFn
                                    }
                                }
                            }, self.connectorParams);
                            var label = endpoint.getOverlay('label');
                            self.bindLabel(node, label, labelFn);
                        }

                        this.addTargetEndpoints(element, 0.1, 0.5, 0.9);
                        addSourceEndpoint('left', 'true', function() {
                            return node.trueLabel;
                        });
                        addSourceEndpoint('right', 'false', function() {
                            return node.falseLabel;
                        });
                    },
                    addFlowStepEndpoints: function(element) {
                        this.addTargetEndpoints(element, 0.35, 0.5, 0.65);
                        this.jsPlumbInstance.addEndpoint($(element), {
                            anchor: [0.5, 1, 0, 1, 0, 5],
                            isSource: true
                        }, this.connectorParams);
                    },
                    addTargetEndpoints: function(element, left, middle, right) {
                        this.jsPlumbInstance.addEndpoint($(element), {
                            anchor: [left, 0, 0, -1, 0, -6], //x, y, x-direction, y-dir, x-offset, y-off
                            isTarget: true,
                            maxConnections: -1
                        }, this.connectorParams);
                        this.jsPlumbInstance.addEndpoint($(element), {
                            anchor: [middle, 0, 0, -1, 0, -6],
                            isTarget: true,
                            maxConnections: -1
                        }, this.connectorParams);
                        this.jsPlumbInstance.addEndpoint($(element), {
                            anchor: [right, 0, 0, -1, 0, -6],
                            isTarget: true,
                            maxConnections: -1
                        }, this.connectorParams);
                    },
                    checkForAndHandleRemovedNodes: function (nodes) {
                        //detect of a node has been deleted then remove endpoints and connections
                        //NOTE: this code runs before the element is removed from the DOM
                        //if something were to happen that caused it to run afterward, might result in errors
                        function posInNodes(node) {
                            for (var i = 0; i < nodes.length; i++) {
                                if (nodes[i] === node) {
                                    return i;
                                }
                            }
                            return -1;
                        }
                        if (nodes.length < this.nodeElements.length) {
                            for (var i = 0; i < this.nodeElements.length; i++) {
                                var pos = posInNodes(this.nodeElements[i].node);
                                if (pos === -1) {
                                    this.unBindLabels(this.nodeElements[i].node);
                                    this.jsPlumbInstance.removeAllEndpoints(this.nodeElements[i].element);
                                    this.nodeElements.splice(i, 1);
                                    return;
                                }
                            }
                        }
                    },
                    selectedItemChanged: function (newValue, oldValue) {
                        if (oldValue != null) {
                            if (oldValue.modelType === 'flowchartPlumbConnection') {
                                //FIXME: handling of selected connections different to handling of selected wfParts

                                //check that connection not deleted by looking at source prop
                                if (oldValue.connection != newValue.connection && oldValue.connection.source != null) {

                                    oldValue.connection.setPaintStyle(this.connectorParams.paintStyle);
                                }

                            }
                        }
                    }
                }
            }
        }
    });
