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
angular
    .module('ng-context-menu', [])
    .factory('ContextMenuService', function($rootScope, $document) {
        return {
            element: null,
            menuElement: null,
            closeFlag: false,   //external directives set this to false when they have stopped click event propagating
            opened: false,   //stored whether menu displayed
            closeFlagWatchDereg: null,
            open: function(event, menuElement) {
                menuElement.removeClass('hide');
                menuElement.addClass('show');
                //Directives that stop propagation of the click event set this to true
                //We will therefore watch this value when menu is open
                //Hacky solution
                this.closeFlag = false;
                var cms = this;
                this.closeFlagWatchDereg = $rootScope.$watch(function() {
                    return cms.closeFlag;
                }, function (newValue, oldValue) {
                    if (newValue === true) {
                        cms.close(menuElement);
                    }
                });

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
                this.opened = true;
            },
            close: function (menuElement) {
                if (this.closeFlagWatchDereg !== undefined) {
                    this.closeFlagWatchDereg();
                }
                menuElement.removeClass('show');
                menuElement.addClass('hide');
                this.opened = false;
            },
            setup: function (targetElement, menuElement) {
                if (this.menuElement !== null) {
                    this.close(this.menuElement);
                }
                this.element = targetElement;
                this.menuElement = menuElement;
            }
        };
    })
    .directive('contextMenu', ['$document', 'ContextMenuService', function($document, ContextMenuService) {
        return {
            restrict: 'A',
            scope: {
                'callback': '&contextMenu',
                'disabled': '&contextMenuDisabled'
            },
            link: function($scope, $element, $attrs) {
                $element.bind('contextmenu', function(event) {
                    if (!$scope.disabled()) {
                        ContextMenuService.setup(event.target, angular.element(document.getElementById($attrs.target)));

                        //console.log('set', ContextMenuService.element);

                        event.preventDefault();
                        event.stopPropagation();
                        $scope.$apply(function() {
                            $scope.callback({ $event: event });
                            ContextMenuService.open(event, ContextMenuService.menuElement);
                        });
                    }
                });
                function handleKeyUpEvent(event) {
                    //console.log('keyup');
                    if (!$scope.disabled() && ContextMenuService.opened && event.keyCode === 27) {
                        $scope.$apply(function() {
                            ContextMenuService.close(ContextMenuService.menuElement);
                        });
                    }
                }
                function handleClickEvent(event) {
                    if (!$scope.disabled() &&
                        ContextMenuService.opened &&
                        (event.button !== 2 || event.target !== ContextMenuService.element)) {
                        $scope.$apply(function() {
                            ContextMenuService.close(ContextMenuService.menuElement);
                        });
                    }
                }

                $document.bind('keyup', handleKeyUpEvent);
                // Firefox treats a right-click as a click and a contextmenu event while other browsers
                // just treat it as a contextmenu event
                $document.bind('click', handleClickEvent);
                $document.bind('contextmenu', handleClickEvent);

                $scope.$on('$destroy', function() {
                    //console.log('destroy');
                    $document.unbind('keyup', handleKeyUpEvent);
                    $document.unbind('click', handleClickEvent);
                    $document.unbind('contextmenu', handleClickEvent);
                });
            }
        };
    }]);