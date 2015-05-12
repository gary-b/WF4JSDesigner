/**
 Modified from:
 ng-context-menu - v0.1.4 - An AngularJS directive to display a context menu when
 a right-click event is triggered

 The MIT License (MIT)

 Copyright (c) 2013 Ian Walter

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 @author Ian Kennington Walter (http://ianvonwalter.com)
 */
app.factory('contextMenu', function($rootScope, $document) {
    var service = {
        menuElements: [],
        boundHandlers: [],
        detectingCloseEvents: false, // flag ultimately detects if were currently listening for events that will close all open menus
        open: function(event, menuElement) { // opens the menu passed in at mouse location, calls detectCloseEvents
            this.close();
            this.menuElements.push(menuElement);
            menuElement.removeClass('hide');
            menuElement.addClass('show');

            var doc = $document[0].documentElement;
            var docLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0),
                docTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0),
                elementHeight = menuElement[0].scrollHeight;
            var docHeight = doc.clientHeight + docTop,
                totalHeight = elementHeight + event.pageY,
                top = Math.max(event.pageY - docTop, 0);

            if (totalHeight > docHeight) {
                top = top - (totalHeight - docHeight);
            }
            menuElement.css('top', top + 'px');
            menuElement.css('left', Math.max(event.pageX - docLeft, 0) + 'px');

            this.detectCloseEvents();
        },
        detectCloseEvents: function() {
            if(this.detectingCloseEvents){
                return;
            }
            var self = this;
            var handleKeyUpEvent = function(event) {
                if (event.keyCode === 27) {
                    $rootScope.$apply(function() {
                        self.close();
                    });
                }
            };
            var handleClickEvent = function(event) {
                if (event.button !== 2 || event.target !== target) {
                    $rootScope.$apply(function() {
                        self.close();
                    });
                }
            };
            this.bindHandler('keyup', handleKeyUpEvent);
            // Firefox treats a right-click as a click and a contextmenu event while other browsers
            // just treat it as a contextmenu event
            this.bindHandler('click', handleClickEvent);
            this.bindHandler('contextmenu', handleClickEvent);
        },
        bindHandler: function(eventName, fn) {
            this.boundHandlers.push({eventName: eventName, fn: fn });
            $document.bind(eventName, fn);
        },
        unBindHandlers: function() {
            angular.forEach(this.boundHandlers, function(boundHandler){
                $document.unbind(boundHandler.eventName, boundHandler.fn);
            });
            this.boundHandlers.length = 0;
        },
        close: function () {    // closes any menus that are currently open and deregisters listeners / watches
            if (this.menuElements.length == 0){
                return;
            }
            angular.forEach(this.menuElements, function(menuElement){
                menuElement.removeClass('show');
                menuElement.addClass('hide');
            });
            this.menuElements.length = 0;
            this.unBindHandlers();
            this.detectingCloseEvents = false;
        }
    };
    $rootScope.$on('contextMenu:open', function(event, params){
        service.open(params.originalEvent, params.contextMenu);
    });
    $rootScope.$on('contextMenu:close', function(event, argObject){
        service.close();
    });
    return service;
});