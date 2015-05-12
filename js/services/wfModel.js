'use strict';

app.factory('wfModel', function (wfPartDefs) {
    return {
        initialize: function (root, args) {
            if (root.parent !== undefined) {
                console.log("Looks like workflow already intialized");
            }

            root.parent = null;
            initializeWfPart(root);

            function initializeWfPart(part) {
                //FIXME: might need to create properties as well, eg where sequence activity returned from server as json with no variables - will the server render an empty / undefined property in its place?
                wfPartDefs.appendMethods(part);
                angular.forEach(part.getChildren(), function(child) {
                    child.parent = part;
                    initializeWfPart(child);
                });
            }
        }
    };
})