'use strict';

app.factory('toolbox', function () {
    return {
        tools: [
            { name: 'WriteLine', category: 'activity-tool' },
            { name: 'Sequence',  category: 'activity-tool' },
            { name: 'Flowchart', category: 'activity-tool' },
            { name: 'FlowDecision', category: 'flow-node-tool' },
            { name: 'FlowSwitch', category: 'flow-node-tool' }
        ]
    }
});