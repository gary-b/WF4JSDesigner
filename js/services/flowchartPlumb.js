'use strict';

app.value('jsPlumb', jsPlumb)
    .factory('flowchartPlumb', function (jsPlumb, renderWaiter, designerUI, $rootScope, wfPartDefinitions) {
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
                    flowchartElement: null,
                    nodeElements: [],  //keep track of nodes and associated dom element
                    connectorParams: {  //FIXME: look into jsPlumb.Defaults
                        connector: "Flowchart",
                        endpoint: "Rectangle",
                        cssClass: 'invisible',
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
                    endpoints: {},
                    endpointAdded: function(nodeId, position, endpoint) {
                        if (this.endpoints[nodeId] == null) {
                            this.endpoints[nodeId] = {};
                        }
                        this.endpoints[nodeId][position] = endpoint;
                    },
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
                        this.flowchartElement = element;
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
                            function decorateFlowDecisionConnection(connection, sourceInfo) {
                                connection.addOverlay([ 'Label', {
                                    label: sourceInfo.labelFn(),
                                    id:'label'
                                } ]);
                                connection.setParameter('name', sourceInfo.name);
                                var label = connection.getOverlay('label');
                                self.bindLabel(connection, label, sourceInfo.labelFn);
                            }
                            function decorateFlowSwitchConnection(connection, sourceInfo) {
                                var labelFn = function () {
                                    return (sourceInfo.case.default.case === sourceInfo.case) ?
                                        coalesce(sourceInfo.case.default.defaultDisplayName, '') :
                                        coalesce(sourceInfo.case.caseValue, '');
                                };
                                connection.setParameter('case', sourceInfo.case);
                                connection.addOverlay(['Label', {
                                    label: labelFn(),
                                    id: 'label'
                                }]);
                                var label = connection.getOverlay('label');
                                self.bindLabel(connection, label, labelFn);
                            }
                            function connectionAdded(elSource, elTarget, connection, sourceEndpoint, targetEndpoint) {
                                var sourcePart = $(elSource).data('flowchartPart');
                                var targetPart = $(elTarget).data('flowchartPart');
                                var sourcePos = sourceEndpoint.getParameter('position');
                                var targetPos = targetEndpoint.getParameter('position');

                                if (sourcePart.type === 'FlowDecision') {
                                    // sourceInfo is an object that was added to each flowDecision source endpoint.
                                    // It lets us identify whether the connection is from the true or false endpoint.
                                    // Since user can change the display name from True False to something else
                                    // the sourceInfo object also contains a Fn to retrieve the relevant label.
                                    // We use this to bind the label value to a label overlay displayed on the connection.
                                    var sourceInfo = sourceEndpoint.getParameter('sourceInfo');
                                    sourcePart.connectNode(targetPart.nodeId, sourceInfo, sourcePos, targetPos);
                                    decorateFlowDecisionConnection(connection, sourceInfo);
                                } else if (sourcePart.type === 'FlowSwitch') {
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
                                    sourcePart.connectNode(targetPart.nodeId, sourceInfo, sourcePos, targetPos);
                                    decorateFlowSwitchConnection(connection, sourceInfo);
                                    self.showFlowSwitchCasePopup(sourceInfo.case, connection);
                                } else if (sourcePart.type === 'Flowchart' || sourcePart.type === 'FlowStep') {
                                    sourcePart.connectNode(targetPart.nodeId, null, sourcePos, targetPos);
                                }
                                //parameters copied from sourceEndpoint to connection by default - dont need this
                                connection.setParameter('sourceInfo', undefined);
                            }
                            function connectionRemoved(elSource, elTarget, connection) {
                                //this method is also called when a connection is being moved
                                var sourcePart = $(elSource).data('flowchartPart');
                                var targetPart = $(elTarget).data('flowchartPart');
                                var info = null;
                                if (sourcePart.type === 'FlowDecision'){
                                    info = { name: connection.getParameter('name') };
                                    connection.setParameter('name', undefined);
                                } else if (sourcePart.type === 'FlowSwitch') {
                                    info = { 'case': connection.getParameter('case') };
                                    connection.setParameter('case', undefined);
                                }
                                connection.removeOverlay('label');
                                sourcePart.disconnectNode(info);
                                self.unBindLabels(connection);
                            }
                            $(element).find('.start-node').data('flowchartPart', self.flowchart);
                            self.jsPlumbInstance = jsPlumb.getInstance();
                            self.jsPlumbInstance.setContainer($(element).find('.drop-zone'));
                            self.jsPlumbInstance.bind("connection", function (info, originalEvent) {
                                info.connection.addOverlay([ "Arrow", { foldback:1, location:1, width:10, length:12 } ]);
                            });
                            self.endpointAdded("FlowChart", "bottom", self.jsPlumbInstance.addEndpoint($(element).find('.start-node'), {
                                anchor: [0.5, 1, 0, 1],
                                isSource: true,
                                parameters: {
                                    position: 'bottom'
                                }
                            }, self.connectorParams));

                            //create connections once jsPlumb has created endpoints
                            setTimeout(function() {
                                var startNodeElement = self.flowchartElement.find('.start-node');
                                new Perimeter({
                                    monitor: startNodeElement[0].parentNode,
                                    target: startNodeElement[0],
                                    outline: 30,
                                    onBreach: function () {
                                        self.jsPlumbInstance.selectEndpoints({ element: startNodeElement }).removeClass('invisible');
                                    },
                                    onLeave: function () {
                                        self.jsPlumbInstance.selectEndpoints({ element: startNodeElement }).addClass('invisible');
                                    }
                                });
                                if (flowchartModel.startNode != null) {
                                    var con = flowchartModel.connections[0];
                                    self.jsPlumbInstance.connect({
                                        source: self.endpoints["FlowChart"][con.sourcePos],
                                        target: self.endpoints[con.targetNodeId][con.targetPos]
                                    });
                                }
                                angular.forEach(flowchartModel.nodes, function (node) {
                                    angular.forEach(node.connections, function(conModel) {
                                        var sourceEndpoint = self.endpoints[node.nodeId][conModel.sourcePos];
                                        var targetEndpoint = self.endpoints[conModel.targetNodeId][conModel.targetPos];
                                        var connection = self.jsPlumbInstance.connect({
                                            source: sourceEndpoint,
                                            target: targetEndpoint
                                        });
                                        if (node.type === 'FlowDecision') {
                                            var sourceInfo = sourceEndpoint.getParameter('sourceInfo');
                                            decorateFlowDecisionConnection(connection, sourceInfo);
                                        } else if (node.type === 'FlowSwitch') {
                                            var sourceInfo = {
                                                case: conModel.case
                                            };
                                            decorateFlowSwitchConnection(connection, sourceInfo);
                                        }
                                    });
                                });
                                self.jsPlumbInstance.bind("connection", function (info, originalEvent) {
                                    //fires when connection moved as well as for new connections
                                    connectionAdded(info.source, info.target, info.connection, info.sourceEndpoint, info.targetEndpoint);

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
                                    if (info.connection.pending !== true) {
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
                                        if(connection.source != null) {
                                            self.setConnectionAsSelectedItem(connection);
                                        }
                                        //weve stopped propagation of the click event - close context menu if open
                                        $rootScope.$emit('contextMenu:close');
                                    });
                                });
                                self.jsPlumbInstance.bind("contextmenu", function (component, originalEvent) {
                                    originalEvent.preventDefault();
                                    originalEvent.stopPropagation();

                                    if (component instanceof jsPlumb.Connection) {
                                        $rootScope.$apply(function () {
                                            self.setConnectionAsSelectedItem(component);
                                        });
                                        $rootScope.$emit('contextMenu:open', {
                                            originalEvent: originalEvent,
                                            contextMenu: self.connectionsMenu
                                        });
                                    }
                                });
                            }, 0);
                        })
                    },
                    insertPartToWfModel: function (category, wfPartType, relativePos, genericParams) {
                        var displayPart = wfPartDefinitions.createModel(this.flowchart, wfPartType, genericParams);
                        var flowNode;
                        if (category === 'activity-tool') {
                            flowNode = wfPartDefinitions.createModel(this.flowchart, "FlowStep");
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
                        //wait for dom, set perimeter, set draggable and create endpoints
                        element.data("flowchartPart", node); //adding node to DOM element
                        var self = this;
                        renderWaiter.afterRender(function () {
                            return $(element).find('.header');
                        }, function () {

                            var perimeter = new Perimeter({
                                monitor: self.flowchartElement.find('.start-node')[0].parentNode,
                                target: element[0],
                                outline: 30,
                                onBreach: function () {
                                    self.jsPlumbInstance.selectEndpoints({ element:element }).removeClass('invisible');
                                    //self.jsPlumbInstance.selectEndpoints({ element: element }).setVisible(true, true, true);
                                    /*self.jsPlumbInstance.selectEndpoints({ element: element }).each(function(endpoint) {
                                        endpoint.setEndpoint('Dot');
                                    });*/
                                },
                                onLeave: function () {
                                    self.jsPlumbInstance.selectEndpoints({ element:element }).addClass('invisible');
                                    //self.jsPlumbInstance.selectEndpoints({ element: element }).setVisible(false, true, true);
                                    /*self.jsPlumbInstance.selectEndpoints({ element: element }).each(function(endpoint) {
                                        endpoint.setEndpoint('Blank');
                                    });*/
                                }
                            });
                            self.jsPlumbInstance.draggable($(element), {
                                containment: true,
                                start: function () {
                                    perimeter.startTrackingPosition();
                                },
                                stop: function () {
                                    node.position.left = element.prop('offsetLeft');
                                    node.position.top = element.prop('offsetTop');
                                    perimeter.stopTrackingPosition();
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
                            self.addFlowStepEndpoints(element, node);
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
                            self.endpointAdded(node.nodeId, "right", self.jsPlumbInstance.addEndpoint($(element), {
                                anchor: anchorPos,
                                isSource: true,
                                maxConnections: -1,
                                parameters: {
                                    position: 'right'
                                }
                            }, self.connectorParams));
                        }
                        this.addTargetEndpoints(element, node);
                        addSourceEndpoint([1, 0.5, 1, 0]);
                    },
                    addFlowDecisionEndpoints: function(element, node) {
                        var self = this;
                        function addSourceEndpoint(pos, name, labelFn) {
                            var labelLoc, anchorPos;
                            if (pos === 'left') {
                                labelLoc = [ 0, 1.5 ];
                                anchorPos = [0, 0.5, -1, 0]; //x, y, x-direction, y-dir, x-offset, y-off;
                            } else if (pos = 'right') {
                                labelLoc = [ 1.1, 1.5 ];
                                anchorPos = [1, 0.5, 1, 0];
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
                                    position: pos,
                                    sourceInfo: {
                                        name: name,
                                        labelFn: labelFn
                                    }
                                }
                            }, self.connectorParams);
                            self.endpointAdded(node.nodeId, pos, endpoint);
                            var label = endpoint.getOverlay('label');
                            self.bindLabel(node, label, labelFn);
                        }

                        this.addTargetEndpoints(element, node);
                        addSourceEndpoint('left', 'true', function() {
                            return node.trueLabel;
                        });
                        addSourceEndpoint('right', 'false', function() {
                            return node.falseLabel;
                        });
                    },
                    addFlowStepEndpoints: function(element, node) {
                        var self = this;
                        this.addTargetEndpoints(element, node);
                        self.endpointAdded(node.nodeId, 'bottom', self.jsPlumbInstance.addEndpoint($(element), {
                            anchor: [0.5, 1, 0, 1],
                            isSource: true,
                            parameters: {
                                position: 'bottom'
                            }
                        }, this.connectorParams));
                    },
                    addTargetEndpoints: function(element, node) {
                        var self = this;
                        self.endpointAdded(node.nodeId, 'top', self.jsPlumbInstance.addEndpoint($(element), {
                            anchor: [0.5, 0, 0, -1],
                            isTarget: true,
                            maxConnections: -1,
                            parameters: {
                                position: 'top'
                            }
                        }, this.connectorParams));
                    },
                    checkForAndHandleRemovedNodes: function (nodes) {
                        //detect of a node has been deleted then remove endpoints and connections
                        //NOTE: this code runs before the element is removed from the DOM
                        //if something were to happen that caused it to run afterward, might result in errors
                        if (nodes.length < this.nodeElements.length) {
                            for (var i = 0; i < this.nodeElements.length; i++) {
                                var pos = nodes.indexOf(this.nodeElements[i].node);
                                if (pos === -1) {
                                    this.endpoints[this.nodeElements[i].nodeId] = undefined;
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
