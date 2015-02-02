'use strict';

app.factory('environment', function() {
    return {
        types: [
            'String', 'Int32', 'Int64', 'Single', 'Double', 'Decimal'
        ]
    }
});