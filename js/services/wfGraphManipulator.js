'use strict';

app.factory('wfGraphManipulator', function (wfPartDefinitions) {
    return {
        initialize: function (root, args) {
            if (root.parent !== undefined) {
                console.log("Looks like workflow already intialized");
            }

            root.parent = null;
            initializeWfPart(root);

            function initializeWfPart(part) {
                //FIXME: might need to create properties as well, eg where sequence activity returned from server as json with no variables - will the server render an empty / undefined property in its place?
                wfPartDefinitions.appendMethods(part);
                angular.forEach(part.getChildren(), function(child) {
                    child.parent = part;
                    initializeWfPart(child);
                });
            }
        },
        insertActivityAtPos: function(activity, target, pos) {
            target.splice(pos, 0, activity)
        },
        deleteWfPart: function(part) {
            if (part.parent == null) {
                var err = "parent of part null or undefined, cant be deleted through wfGraphManipulator.deleteWfPart";
                throw err;
            }
            part.parent.deleteChild(part);
        }
    };
})