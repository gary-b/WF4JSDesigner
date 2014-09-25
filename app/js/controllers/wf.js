'use strict';

/* Controllers */

app.controller('wf', function($scope) {
    $scope.data = {
        writeLine: {
            type: "WriteLine",
            displayName: "WriteLine DisplayName",
            args: {
                text: "Hello World"
            }
        },
        arguments: [
            {
                name: 'Name',
                direction: 'In',
                type:'String',
                defaultValue: ''
            }
        ],
        sequence: {
            type: "Sequence",
            displayName: "Sequence DisplayName",
            variables: [],
            activities: [
                {
                    type: "WriteLine",
                    displayName: "1.1 WriteLine DisplayName",
                    args: {
                        text: "I run 1st"
                    }
                }, {
                    type: "WriteLine",
                    displayName: "1.2 WriteLine DisplayName",
                    args: {
                        text: "I run 2nd"
                    }
                }, {
                    type: "Sequence",
                    displayName: "1.3 Sequence DisplayName",
                    activities: [
                        {
                            type: "WriteLine",
                            displayName: "1.3.1 WriteLine DisplayName",
                            args: {
                                text: "I run 3rd"
                            }
                        }
                    ],
                    variables: [
                        {
                            name: 'Var1',
                            type: 'String',
                            defaultValue: 'Default'
                        },{
                            name: 'Var2',
                            type: 'String',
                            defaultValue: 'Default'
                        },{
                            name: 'Var3',
                            type: 'String',
                            defaultValue: 'Default'
                        }
                    ]
                }
            ]
        }
     };
});
