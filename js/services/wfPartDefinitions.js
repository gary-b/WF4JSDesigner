'use strict';

app.factory('wfPartDefinitions', function () {
    function getGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
    function removeFromArrayByProp(array, prop, value) {
        var index = null;
        for(var i = 0; i < array.length; i++) {
            if(array[i][prop] === value){
                index = i;
                break;
            }
        }
        if(index != null) {
            array.splice(index, 1);
        }
    }
    //FIXME: similar to remove(..) function in wfVariables and wfArguments
    function removeFromArray(array, element) {
        var index = array.indexOf(element);
        if(index != -1) {
            array.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }
    return {
        exists: function exists(activityType) {
            return (this.definitions[activityType] != null);
        },
        createModel: function(parent, activityType, genericParams) {
            if (!this.exists(activityType)) {
                throw "No definition for the activity type: " + activityType;
            }
            var model = {
                modelType: 'wfPart',
                parent: parent,
                type: activityType,
                displayName: activityType
            };
            this.definitions[activityType].appendModelProperties(model, genericParams);
            this.definitions[activityType].appendModelMethods(model);
            return model;
        },
        appendMethods: function(activity) {
            if (!this.exists(activity.type)) {
                throw "No definition for the type of this activity: " + activity.type;
            }
            activity.modelType = 'wfPart';
            this.definitions[activity.type].appendModelMethods(activity)
        },
        getPropGridDirective: function(activityType) {
            if (!this.exists(activityType)) {
                throw "No definition for the type of this activity: " + activityType;
            }
            return this.definitions[activityType].propGridDirective;
        },
        getDirective: function(activityType) {
            if (!this.exists(activityType)) {
                throw "No definition for the type of this activity: " + activityType;
            }
            return this.definitions[activityType].actDirective;
        },
        definitions: {
            'WriteLine': {
                actDirective: 'act-write-line',
                propGridDirective: 'prop-grid-write-line',
                appendModelProperties: function (model, genericParams) {
                    model.text = '"Enter expression"';
                },
                appendModelMethods: function(model) {
                    model.getChildren = function () {
                        return null;
                    };
                    model.getVariableArray = function() {
                        return null;
                    };
                }
            },
            'Sequence': {
                actDirective: 'act-sequence',
                propGridDirective: 'prop-grid-sequence',
                appendModelProperties: function (model, genericParams) {
                    model.activities = [];
                    model.variables = [];
                },
                appendModelMethods: function (model) {
                    model.getChildren = function() {
                        return this.activities.slice(); // slice so ref to actual array not passed back
                    };
                    model.getVariableArray = function() {
                        return this.variables; // we want reference to actual array
                    };
                    model.deleteChild = function(child) {
                        if (!removeFromArray(this.activities, child)) {
                            throw "the supplied activity is not a child of this activity";
                        }

                    }
                }
            },
            'Flowchart': {
                actDirective: 'act-flowchart',
                propGridDirective: 'prop-grid-flowchart',
                appendModelProperties: function (model, genericParams) {
                    model.startNode = null;
                    model.nodes = [];
                    model.variables = [];
                    model.connections = [];
                },
                appendModelMethods: function (model) {
                    model.getChildren = function() {
                        var activities = [];
                        //TODO: get activity from property depending on type of flownode
                        return activities;
                    };
                    model.getVariableArray = function() {
                        return this.variables; // we want reference to actual array
                    };
                    model.deleteChild = function(child) {
                        var nodeId;
                        angular.forEach(this.nodes, function(node) {
                            if (node.tiedToPart(child)) {
                                nodeId = node.nodeId;
                                model.deleteNode(node);
                            }
                        });
                        if (nodeId == null) {
                            throw "the supplied wfPart is not a child of the flowchart";
                        }

                        /* rely on jsPlumb raising events as the connections are removed and
                            these resulting in relevant nodes being disconnected
                        angular.forEach(this.nodes, function(node) {
                            node.disconnectNode(nodeId);
                        });*/
                    },
                    model.deleteNode = function(node) {
                        if (!removeFromArray(this.nodes, node)) {
                            throw "the supplied node is not in nodes collection on flowchart";
                        }
                    },
                    model.connectNode = function (nodeId, sourceInfo, sourcePos, targetPos) {
                        this.startNode = nodeId;
                        this.connections.push({
                            sourcePos: sourcePos,
                            targetPos: targetPos,
                            targetNodeId: nodeId
                        });
                    };
                    model.disconnectNode = function (info) {
                        this.startNode = null;
                        this.connections.length = 0;
                    };
                }
            },
            'FlowStep': {
                appendModelProperties: function (model, genericParams) {
                    model.nodeId = getGuid();
                    model.flowchart = model.parent;
                    model.position = null;
                    model.next = null;
                    model.action = null;
                    model.connections = [];
                },
                appendModelMethods: function (model) {
                    model.connectNode = function (nodeId, sourceInfo, sourcePos, targetPos) {
                        this.next = nodeId;
                        this.connections.push({
                            sourcePos: sourcePos,
                            targetPos: targetPos,
                            targetNodeId: nodeId
                        });
                    };
                    model.disconnectNode = function (info) {
                        this.next = null;
                        this.connections.length = 0;
                    };
                    model.tiedToPart = function (wfPart) {
                        return (this.action === wfPart);
                    };
                }
            },
            'FlowDecision': {
                actDirective: 'node-flow-decision',
                propGridDirective: 'prop-grid-flow-decision',
                appendModelProperties: function (model, genericParams) {
                    model.nodeId = getGuid();
                    model.flowchart = model.parent;
                    model.position = null;
                    model.true = null;
                    model.false = null;
                    model.condition = null;
                    model.falseLabel = 'False';
                    model.trueLabel = 'True';
                    model.connections = [];
                },
                appendModelMethods: function (model) {
                    model.getChildren = function() {
                        return null;
                    };
                    model.getVariableArray = function() {
                        return null;
                    };
                    model.connectNode = function (nodeId, sourceInfo, sourcePos, targetPos) {
                        //not checking nodeId valid
                        if (sourceInfo == null) {
                            throw 'connectNode on FlowDecision called without sourceInfo';
                        }
                        var name = sourceInfo.name;
                        if (name === 'true') {
                            this.true = nodeId;
                        } else if (name === 'false') {
                            this.false = nodeId;
                        } else {
                            throw 'connectNode on FlowDecision called with sourceInfo.name having unexpected value';
                        }
                        this.connections.push({
                            sourcePos: sourcePos,
                            targetPos: targetPos,
                            name: sourceInfo.name,
                            targetNodeId: nodeId
                        });
                    };
                    model.disconnectNode = function (info) {
                        if (info.name === 'true') {
                            this.true = null;
                        } else if (info.name === 'false') {
                            this.false = null;
                        }
                        removeFromArrayByProp(this.connections, 'name', info.name);
                    },
                    model.tiedToPart = function (wfPart) {
                        return (this === wfPart);
                    };
                }
            },'FlowSwitch': {
                actDirective: 'node-flow-switch',
                propGridDirective: 'prop-grid-flow-switch',
                appendModelProperties: function (model, genericParams) {
                    if (genericParams == null) {
                        throw 'FlowSwitch.appendModelProperties should be passed a genericParams param';
                    }
                    if (genericParams.t == null) {
                        throw 'FlowSwitch.appendModelProperties genericParams should include a property for t';
                    }
                    model.nodeId = getGuid();
                    model.flowchart = model.parent;
                    model.position = null;
                    model.expression = null;
                    model.t = genericParams.t;
                    model.cases = [];
                    model.default = {
                        case: null,
                        defaultDisplayName: 'Default'
                    };
                    model.connections = [];
                },
                appendModelMethods: function (model) {
                    model.getChildren = function() {
                        return null;
                    };
                    model.getVariableArray = function() {
                        return null;
                    };
                    model.connectNode = function (nodeId, sourceInfo, sourcePos, targetPos) {
                        if (sourceInfo == null) {
                            throw 'FlowSwitch.connectNode: sourceInfo must not be null';
                        }
                        if (sourceInfo.case == null) {
                            throw 'FlowSwitch.connectNode: sourceInfo.case must not be null';
                        }
                        sourceInfo.case.nodeId = nodeId;
                        this.cases.push(sourceInfo.case);
                        this.connections.push({
                            sourcePos: sourcePos,
                            targetPos: targetPos,
                            'case': sourceInfo.case,
                            targetNodeId: nodeId
                        });
                        return sourceInfo.case;
                    };
                    model.createCase = function () {
                        var self = this;
                        return {
                            caseValue: null,
                            nodeId: null,
                            default: self.default //reference default so its accessible from prop grid
                        };
                    },
                    model.disconnectNode = function (info) {
                        if (this.default.case === info.case) {
                            this.default.case = null;
                        }
                        removeFromArray(this.cases, info.case);
                        removeFromArrayByProp(this.connections, 'case', info.case);
                    };
                    model.tiedToPart = function (wfPart) {
                        return (this === wfPart);
                    };
                }
            }
        }
    };
});