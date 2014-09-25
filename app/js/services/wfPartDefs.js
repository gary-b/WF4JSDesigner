'use strict';

app.factory('wfPartDefs', function () {
    function getGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
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
                        var index = -1;
                        for(var i = 0; i < this.activities.length; i++) {
                            if (this.activities[i] === child) {
                                index = i;
                            }
                        }
                        if (index > -1) {
                            this.activities.splice(index, 1);
                        } else {
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
                },
                appendModelMethods: function (model) {
                    model.getChildren = function() {
                        var activities = [];
                        angular.forEach(this.nodes, function(node) {
                            //TODO: get activity from property depending on type of flownode
                        });
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
                        angular.forEach(this.nodes, function(node) {
                            node.disconnectNode(nodeId);
                        });
                    },
                        model.deleteNode = function(node) {
                            var index = -1;
                            for(var i = 0; i < this.nodes.length; i++) {
                                if (this.nodes[i] === node) {
                                    index = i;
                                }
                            }
                            if (index > -1) {
                                this.nodes.splice(index, 1);
                            } else {
                                throw "the supplied node is not in nodes collection on flowchart";
                            }
                        },
                        model.connectNode = function (nodeId, sourceInfo) {
                            this.startNode = nodeId;
                        };
                    model.disconnectNode = function (nodeId) {
                        if (this.startNode == nodeId) {
                            this.startNode = null;
                        }
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
                },
                appendModelMethods: function (model) {
                    model.connectNode = function (nodeId, sourceInfo) {
                        this.next = nodeId;
                    };
                    model.disconnectNode = function (nodeId) {
                        //the nodeId may not relate to a node we are connected to
                        if (this.next === nodeId) {
                            this.next = null;
                        }
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
                },
                appendModelMethods: function (model) {
                    model.getChildren = function() {
                        return null;
                    };
                    model.getVariableArray = function() {
                        return null;
                    };
                    model.connectNode = function (nodeId, sourceInfo) {
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
                    };
                    model.disconnectNode = function (nodeId) {
                        //the nodeId may not relate to a node we are connected to at all
                        if (this.true === nodeId) {
                            this.true = null;
                        }
                        if (this.false === nodeId) {
                            this.false = null;
                        }
                    };
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
                },
                appendModelMethods: function (model) {
                    model.getChildren = function() {
                        return null;
                    };
                    model.getVariableArray = function() {
                        return null;
                    };
                    model.connectNode = function (nodeId, sourceInfo) {
                        if (sourceInfo == null) {
                            throw 'FlowSwitch.connectNode: sourceInfo must not be null';
                        }
                        if (sourceInfo.case == null) {
                            throw 'FlowSwitch.connectNode: sourceInfo.case must not be null';
                        }
                        sourceInfo.case.nodeId = nodeId;
                        this.cases.push(sourceInfo.case);
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
                    model.disconnectNode = function (nodeId) {
                        var i = 0, foundCase = null;
                        while(i < this.cases.length) {
                            if (this.cases[i].nodeId === nodeId) {
                                foundCase = this.cases[i];
                                if (this.default.case === foundCase) {
                                    this.default.case = null;
                                }
                                this.cases.splice(i, 1);
                            } else {
                                i++;
                            }
                        }
                    };
                    model.tiedToPart = function (wfPart) {
                        return (this === wfPart);
                    };
                }
            }
        }
    };
});