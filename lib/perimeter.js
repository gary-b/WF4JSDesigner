/*
 *  This is a modified version of the Perimeter.js project
 *
 *  Creates an invisible perimeter around a target element and monitors mouse breaches.
 *  When a breach is detected the corresponding callback will be invoked.
 *  This gives the opportunity to e.g. lazy-load scripts, show a tooltip or whatnot.
 *
 *  @author  : Boye Oomens <github@e-sites.nl>
 *  @version : 0.3.0
 *  @license : MIT
 *  @see     : http://github.e-sites.nl/perimeter.js/
 */

(function (window, document, undefined) {

    'use strict';

    var win = window,
        doc = document,
        docElem = doc.documentElement,
        docBody = doc.body,
        instances = [];

    /**
     * Global Perimeter constructor
     *
     * @param {Object} options
     * @constructor
     */
    function Perimeter(options) {

        // We need at least a target element and an outline to work with
        if ( !options || !options.target || !options.outline ) {
            return;
        }

        // Called as function
        if ( !(this instanceof Perimeter) ) {
            return new Perimeter(options);
        }

        /**
         * Perimeter options
         *
         * @type {Object}
         */
        this.options = options;

        /**
         * The amount of perimeter breaches
         *
         * @type {Array}
         */
        this.breaches = [];

        /**
         * Whether the perimeter has been breached
         *
         * @type {Boolean}
         */
        this.alarm = false;

        /**
         * Outline around the target element
         * This can either be an array with top/right/bottom/left dimensions
         * or just one number which acts as shorthand for all directions
         *
         * @type {Number|Array}
         */
        this.outline = this.formatOutline(options.outline);

        /**
         * Target element
         *
         * @type {Object}
         */
        this.target = (typeof options.target === 'string' ? doc.getElementById(options.target) : options.target);

        /**
         * Breach monitor
         * @type {Monitor}
         */
        this.monitor = new this.Monitor(this);

        this.resyncPosition();

        return this.init(options);
    }

    /**
     * Small helper to fetch cross-browser scroll values
     *
     * @return {Object} top and left scroll pos
     */
    Perimeter.prototype.getScrollPos = function () {
        return {
            top: docElem.scrollTop || docBody.scrollTop,
            left: docElem.scrollLeft || docBody.scrollLeft
        };
    };

    /**
     * Returns the given element dimensions and offset
     * based on getBoundingClientRect including document scroll offset
     *
     * @param {HTMLElement} elem target element
     * @return {Object}
     */
    Perimeter.prototype.getClientRect = function (elem) {
        var scrollPos = this.getScrollPos(),
            box;

        if ( typeof elem.getBoundingClientRect === 'undefined' ) {
            throw new Error('Perimeter.js detected that your browser does not support getBoundingClientRect');
        }

        box = elem.getBoundingClientRect();

        return {
            width: box.width || elem.offsetWidth,
            height: box.height || elem.offsetHeight,
            top: (box.top + scrollPos.top - docElem.clientTop),
            left: (box.left + scrollPos.left - docElem.clientLeft)
        };
    };

    /**
     * When triggered via onresize it will recalculate the clientRect and reflow all existing boundaries
     */
    Perimeter.prototype.recalculate = function () {
        var inst, i;
        if ( this instanceof Perimeter ) {
            this.outline = this.formatOutline( this.outline );
        } else {

            i = instances.length;
            while (i--) {
                inst = instances[i];
                inst.resyncPosition();
            }
        }
    };

    /**
     * Triggers the corresponding callback of the given event type
     *
     * @param {String} event event type
     * @return {Boolean}
     */
    Perimeter.prototype.trigger = function (event) {
        var events = {
            'breach': this.options.onBreach,
            'leave': this.options.onLeave
        };

        if ( events.hasOwnProperty(event) && (events[event] instanceof Function) ) {
            events[event].apply(this, []);
        }
    };

    /**
     * Formats the given outline, this can either be a number or an array with numbers
     * When the numbers are passed as string they will be converted to numbers
     * Also,
     *
     * @param  {Array|Number} outline
     * @return {Array}
     */
    Perimeter.prototype.formatOutline = function (outline) {
        var arr = [],
            i = 0;

        while (i < 4) {
            if ( !isNaN(outline) ) {
                arr.push( parseInt(outline, 10) );
            } else {
                arr.push( (!outline[i] ? 0 : parseInt(outline[i], 10)) );
            }
            i++;
        }

        return arr;
    };

    /**
     * Main init method that kickstarts everything
     *
     * @param {Object} options Perimeter options
     */
    Perimeter.prototype.init = function (options) {
        // Cancel the process when the target DOM element is not present
        if ( !this.target ) {
            return;
        }

        // Keep track of all instances
        instances.push( this );
        this.mouseMoveEl = (options.monitor || doc);
        this.mouseMoveEl.addEventListener('mousemove', this.monitor.observe, false);
        win.addEventListener('resize', this.recalculate, false);
        // Due to different browser behavior when it comes to triggering the mousemove event
        // while scrolling using the mousehweel, we need to listen to this event as well
        doc.addEventListener('DOMMouseScroll', this.monitor.resyncAndObserve, false);
        doc.addEventListener('mousewheel', this.monitor.resyncAndObserve, false);
    };

    /**
     * Check where the element is currently located on the screen
     *
     * @param {Object} options Perimeter options
     */
    Perimeter.prototype.resyncPosition = function () {
        // Cancel the process when the target DOM element is not present
        if ( !this.target ) {
            return;
        }

        this.resyncPositionRequired = true;
    };

    /**
     * Start tracking the elements position on screen, eg during dragging
     *
     * @param {Object} options Perimeter options
     */
    Perimeter.prototype.startTrackingPosition = function () {
        // Cancel the process when the target DOM element is not present
        if ( !this.target ) {
            return;
        }

        this.trackPosition = true;
    };

    /**
     * Stop tracking the elements position on screen, eg when dragging has stopped
     *
     * @param {Object} options Perimeter options
     */
    Perimeter.prototype.stopTrackingPosition = function () {
        // Cancel the process when the target DOM element is not present
        if ( !this.target ) {
            return;
        }

        this.trackPosition = false;
    };

    /**
     * Method which unbinds listeners. The instance is defunct at this point.
     *
     */
    Perimeter.prototype.unbindEvents = function(){
        this.mouseMoveEl.removeEventListener('mousemove', this.monitor.observe, false);
        win.removeEventListener('resize', this.recalculate, false);
        doc.removeEventListener('DOMMouseScroll', this.monitor.resyncAndObserve, false);
        doc.removeEventListener('mousewheel', this.monitor.resyncAndObserve, false);
    };

    // Expose Perimeter to global scope
    win.Perimeter = Perimeter;

}(window, window.document));

/**
 * Monitor that observes the given element and detects mouse breaches
 *
 * @param {Object} perimeter Perimeter instance
 * @return {Object}
 * @constructor
 */

/* global Perimeter */

(function (Perimeter, window) {

    'use strict';

    Perimeter.prototype.Monitor = function (perimeter) {

        var monitor = this;

        /**
         * Reference to the event object
         *
         * @type {Object}
         */
        this.event = null;

        /**
         * Detects a breach and when the cursor leaves the perimeter
         *
         * @param {String} state either breach or leave
         */
        this.detect = function (state) {
            var	outline = perimeter.outline,
                posX = this.event.clientX,
                posY = this.event.clientY,
                scrollPos = perimeter.getScrollPos(),
                maxTop = parseInt((perimeter.rects.top - scrollPos.top - outline[0]), 10),
                maxLeft = parseInt((perimeter.rects.left - scrollPos.left - outline[3]), 10);

            switch (state) {
                case 'breach':
                    if (
                        posY >= maxTop &&
                        posY < ((maxTop + perimeter.rects.height) + (outline[0] + outline[2])) &&
                        posX >= maxLeft &&
                        posX < ((maxLeft + perimeter.rects.width) + (outline[1] + outline[3]))
                    ) {
                        perimeter.breaches.push([posX, posY]);
                        perimeter.trigger('breach');
                        perimeter.alarm = true;
                    }
                    break;
                case 'leave':
                    if (
                        posY < maxTop ||
                        posY > (maxTop + perimeter.rects.height + (outline[0] + outline[2])) ||
                        posX < maxLeft ||
                        posX > (maxLeft + perimeter.rects.width + (outline[1] + outline[3]))
                    ) {
                        perimeter.trigger('leave');
                        perimeter.alarm = false;
                    }
                    break;
            }
        };

        /**
         * Main observer that invokes the detection
         *
         * @param {Object} e Event object
         */
        this.observe = function (e) {
            monitor.event = e || window.event;
            if (perimeter.resyncPositionRequired === true || perimeter.trackPosition === true) {
                perimeter.rects = perimeter.getClientRect(perimeter.target);
                perimeter.resyncPositionRequired = false;
            }
            perimeter.monitor.detect( perimeter.alarm ? 'leave' : 'breach' );

            if(perimeter.target.parentNode == null){
                perimeter.unbindEvents();
            }
        };

        /**
         * Observer that resyncs position and invokes the detection
         *
         * @param {Object} e Event object
         */
        this.resyncAndObserve = function (e) {
            perimeter.resyncPositionRequired = true;
            perimeter.monitor.observe(e);
            perimeter.resyncPositionRequired = true;
        };

        return this.event;
    };

}(Perimeter, window));