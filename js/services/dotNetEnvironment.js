'use strict';

app.factory('dotNetEnvironment', function() {
    return {
        types: [
            'String', 'Int32', 'Int64', 'Single', 'Double', 'Decimal'
        ]
    }
});