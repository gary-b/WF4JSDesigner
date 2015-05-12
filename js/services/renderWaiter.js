'use strict';

app.factory('renderWaiter', function () {
    return {
        afterRender: function (targetResolver, action) {
            $.fn.exists = function () {
                return this.length !== 0;
            };
            var target;
            var checkForElement = setInterval(function () {
                target = targetResolver();
                if (target.exists()) {
                    clearInterval(checkForElement);
                    action();
                }
            }, 10);
        }
    }
});