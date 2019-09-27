/**
 * @module VerticalSpeedTape
 * @version 2018.12.01
 * @description <div style="display:flex;"><div style="width:50%;">
 *              <b>Vertical speed tape widget.</b>
 *              <p>This display uses a linear gauge.
 *              A graduated string shows the range of possible vertical speeds.
 *              An indicator on the tape points to the current vertical speed and moves up/down when the value change
 *              The tape unit is 100 feet per minute.</p>
 *              <p>This implementation requires the installation of the pvsio-web toolkit
 *              (<a href="http://www.pvsioweb.org" target=_blank>www.pvsioweb.org</a>).</p>
 *              <p>Google Chrome is recommended for correct rendering of the widget.</p></div>
 *              <img src="images/daa-vertical-speed-tape.png" style="margin-left:8%; max-height:250px;" alt="DAA Vertical Speed Tape Widget"></div>
 * @example
// file index.js (to be stored in pvsio-web/examples/demos/daa-displays/)
require.config({
    paths: {
        widgets: "../../client/app/widgets",
        text: "../../client/app/widgets/daa-displays/lib/text/text"
    }
});
require(["widgets/daa-displays/daa-vertical-speed-tape"], function (VerticalSpeedTape) {
    "use strict";
    const verticalSpeedTape = new VerticalSpeedTape("vertical-speed", {
        top: 210, left: 600
    });
    verticalSpeedTape.setVerticalSpeed(1);
    verticalSpeedTape.setBands({
        RECOVERY: [ { from: -1, to: 1.5 } ],
        NEAR: [ { from: 1.5, to: 2 }, { from: -2, to: -1 } ]
    });
});

// file index.html (to be stored in pvsio-web/examples/demos/daa-displays/)
<!DOCTYPE HTML>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible">
        <title></title>
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="../../client/app/widgets/daa-displays/lib/bootstrap/4.1.3/css/bootstrap.min.css">
        <link rel="stylesheet" href="../../client/app/widgets/daa-displays/lib/font-awesome/5.6.1/css/all.min.css">
        <link rel="stylesheet" href="../../client/app/widgets/daa-displays/css/daa-displays.css">
    </head>
    <script src="../../client/app/widgets/daa-displays/lib/underscore/underscore.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/jquery/jquery-3.3.1.slim.min.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/popper/popper-1.14.3.min.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/bootstrap/4.1.3/bootstrap.min.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/handlebars/handlebars-v4.0.12.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/requireJS/require.js" data-main="index.js"></script>
</html>

 * @author Paolo Masci
 * @date October 2018
 * @copyright
 * Copyright 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration. No
 * copyright is claimed in the United States under Title 17,
 * U.S. Code. All Other Rights Reserved.
 * <br>
 * Disclaimers
 * <br>
 * No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY
 * WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY,
 * INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE
 * WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM
 * INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR
 * FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO
 * THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER,
 * CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT
 * OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY
 * OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE.
 * FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES
 * REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE,
 * AND DISTRIBUTES IT "AS IS."
 * <br>
 * Waiver and Indemnity: RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS
 * AGAINST THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND
 * SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF
 * THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES, DEMANDS, DAMAGES,
 * EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY DAMAGES FROM
 * PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT
 * SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED
 * STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY
 * PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE
 * REMEDY FOR ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL
 * TERMINATION OF THIS AGREEMENT.
 **/
/*jslint esnext: true */
/*global _, bandColors, createDiv, meters2feet, limit */
define(function (require, exports, module) {
    "use strict";
    require("daadisplays/daa-displays-min/daa-utils");
    require("daadisplays/daa-displays-min/templates/daa-vertical-speed-templates.js");
    // const vspeedTemplate = require("text!widgets/daa-displays/templates/daa-vertical-speed.handlebars");
    // const altitudeBandsTemplate = require("text!widgets/daa-displays/templates/daa-linear-bands-template.handlebars");

    // utility function for creating altitude tick marks
    function _create_vspeed_ticks(_this) {
        function normalVS(val) {
            if (Math.trunc(val) === val) {
                // integer number
                return val.toFixed(0);
            }
            return val.toFixed(1);
        }
        $(".vspeedP1").text(normalVS(_this.verticalSpeedStep * 2));
        $(".vspeedP2").text(normalVS(_this.verticalSpeedStep * 4));
        $(".vspeedP3").text(normalVS(_this.verticalSpeedStep * 12));
    }
    // utility function for drawing resolution bands
    function _draw_bands(_this) {
        let theHTML = "";
        let ranges = [{
                from: _this.verticalSpeedStep * 4,
                to: _this.verticalSpeedStep * 12,
                zero: 60,
                tickHeight: _this.tape_size[2] / 2,
                tapeLength: _this.tape_size[2],
                step: _this.verticalSpeedStep
            },
            {
                from: _this.verticalSpeedStep * 2,
                to: _this.verticalSpeedStep * 4,
                zero: 163,
                tickHeight: _this.tape_size[1] / 2,
                tapeLength: _this.tape_size[1],
                step: _this.verticalSpeedStep
            },
            {
                from: 0,
                to: _this.verticalSpeedStep * 2,
                zero: 192,
                tickHeight: _this.tape_size[0] / 2,
                tapeLength: _this.tape_size[0],
                step: _this.verticalSpeedStep
            },
            {
                from: -_this.verticalSpeedStep * 2,
                to: 0,
                zero: 192,
                tickHeight: _this.tape_size[0] / 2,
                tapeLength: _this.tape_size[0],
                step: _this.verticalSpeedStep
            },
            {
                from: -_this.verticalSpeedStep * 4,
                to: -_this.verticalSpeedStep * 2,
                zero: 222,
                tickHeight: _this.tape_size[1] / 2,
                tapeLength: _this.tape_size[1],
                step: _this.verticalSpeedStep
            },
            {
                from: -_this.verticalSpeedStep * 12,
                to: -_this.verticalSpeedStep * 4,
                zero: 324,
                tickHeight: _this.tape_size[2] / 2,
                tapeLength: _this.tape_size[2],
                step: _this.verticalSpeedStep
            }
        ];

        function moduloRange(seg, range) {
            if (seg.to > range.from && seg.from <= range.to) {
                // (seg.from >= range.from && seg.from <= range.to
                //     || seg.from <= range.from && seg.to >= range.to)) {
                let p = (seg.from >= range.from) ? seg.from : range.from;
                let q = (seg.to < range.to) ? seg.to : range.to;
                return (p < q) ? {
                    from: p,
                    to: q
                } : {
                    from: q,
                    to: p
                };
            }
            return null;
        }
        // console.log("ranges", ranges);
        // console.log("vspeed-bands", _this.bands);
        _.each(_this.bands, function (segments, alert) {
            if (segments.length > 0) {
                let segs = [];
                // console.log("segments", segments);
                segments.forEach(function (segment, i) {
                    // console.log("original segment", segments[i]);
                    ranges.forEach(function (range) {
                        let moduloSeg = moduloRange(segment, range);
                        if (moduloSeg) {
                            // console.log("moduloSeg", moduloSeg);
                            let height = (moduloSeg.to - moduloSeg.from) / _this.verticalSpeedStep * range.tickHeight;
                            // console.log("height", height);
                            // place the segment in the right place on the tape
                            segs.push({
                                top: range.zero - (moduloSeg.from / range.step * range.tickHeight) - height,
                                left: 30,
                                width: 4,
                                height: height,
                                from: moduloSeg.from,
                                to: moduloSeg.to,
                                id: "vspeed-band-" + alert + "-" + i
                            });
                        }
                    });
                });
                theHTML += Handlebars.compile(vspeedBandsTemplate)({
                    segments: segs,
                    color: bandColors[alert].color,
                    dash: bandColors[alert].style === "dash"
                });
            }
            // console.log(theHTML);
        });
        $("#" + _this.id + "-bands").html(theHTML);
    }
    // utility function for updating the bug position based on the current vertical speed value
    function _update_bug(_this) {
        let bug_position = _this.zero;
        let range1 = _this.verticalSpeedStep * 2;
        let range2 = range1 * 2;
        let max = range2 * 3;
        let val = limit(-max, max)(_this.currentVerticalSpeed);
        if (val >= 0) {
            if (val <= range1) {
                bug_position = _this.zero - (val / _this.verticalSpeedStep) * (_this.tape_size[0] / 2); // the division by two is because the tape contains 2 ticks
            } else if (val <= range2) {
                bug_position = 118 - ((val - _this.verticalSpeedStep * 2) / _this.verticalSpeedStep) * (_this.tape_size[1] / 2);
            } else {
                bug_position = 55 - ((val - _this.verticalSpeedStep * 4) / _this.verticalSpeedStep) * (_this.tape_size[2] / 2);
            }
        } else {
            if (val >= -range1) {
                bug_position = _this.zero - (val / _this.verticalSpeedStep) * (_this.tape_size[0] / 2); // the division by two is because the tape contains 2 ticks
            } else if (val >= -range2) {
                bug_position = 176 - ((val - _this.verticalSpeedStep * 2) / _this.verticalSpeedStep) * (_this.tape_size[1] / 2);
            } else {
                bug_position = 318 - ((val - _this.verticalSpeedStep * 4) / _this.verticalSpeedStep) * (_this.tape_size[2] / 2);
            }
        }
        $("#" + _this.id + "-bug").css({
            "transition-duration": "1000ms",
            top: bug_position + "px"
        });
    }

    class VerticalSpeedTape {
        /**
         * @function <a name="VerticalSpeedTape">VerticalSpeedTape</a>
         * @description Constructor.
         * @param id {String} Unique widget identifier.
         * @param coords {Object} The four coordinates (top, left, width, height) of the widget, specifying
         *        the left/top corners, and the width/height of the (rectangular) widget area.
         *        Default is { top: 103, left: 300, width: 92, height: 432 }.
         *        FIXME: The current implementation support only a fixed size, 92x432.
         * @param opt {Object} Style options defining the visual appearance of the widget.
         *          <li>airspeedStep (real): the airspeed step (default is 20 knots)</li>
         *          <li>parent (String): the HTML element where the display will be appended (default is "body")</li>
         * @memberof module:VerticalSpeedTape
         * @instance
         */
        constructor(id, coords, opt) {
            opt = opt || {};
            this.id = id || "daa-vertical-speed-tape";

            coords = coords || {};
            this.top = (isNaN(+coords.top)) ? 210 : +coords.top;
            this.left = (isNaN(+coords.left)) ? 300 : +coords.left;

            // step is a parameter that can be specified using the options of the constructor
            this.verticalSpeedStep = opt.verticalSpeedStep || 0.5; // 100 feet per minute

            // the following are constants, should not be modified (unless you know what you're doing!)
            this.zero = 210; // px, number of pixels necessary to reach value 0 in the spinner; this number was obtained by manually inspecting the DOM
            this.tape_size = [
                92, // px, size of the first piece of tape (i.e., that closer to 0)
                (118 - 55), // px, size of the second piece of tape
                (55 - 7) / 4 // px, size of the third piece of tape, where the scale doubles
            ];
            this.tickHeight = {
                r1: this.tape_size[0] / 2, // px
                r2: this.tape_size[1] / 2, // px
                r3: this.tape_size[2] / 2 // px
            };
            this.tapeLength = this.tickHeight * 24; // 12 positive ticks + 12 negative ticks

            // create structure for storing resolution bands
            this.bands = {
                NONE: [],
                FAR: [],
                MID: [],
                NEAR: [],
                RECOVERY: [],
                UNKNOWN: []
            };

            // initialise vertical speed
            this.currentVerticalSpeed = 0; // feet

            // create DOM elements
            this.div = createDiv(id, {
                parent: opt.parent,
                zIndex: 2
            });
            let theHTML = Handlebars.compile(vspeedTemplate)({
                id: this.id,
                zIndex: 2,
                top: this.top
            });
            $(this.div).html(theHTML);
            _create_vspeed_ticks(this);
        }
        /**
         * @function <a name="setBands">setBands</a>
         * @description Renders airspeed resolution bands.
         *              Six types of resolution bands are supported:
         *              <li>FAR (dash yellow)</li>
         *              <li>MID (yellow)</li>
         *              <li>NEAR (red)</li>
         *              <li>RECOVERY (dash green)</li>
         *              <li>UNKNOWN (grey)</li>
         *              <li>NONE (transparent)</li>
         *              Band colors are defined in daa-utils.js
         * @param bands {Object} Bands to be rendered. This parameter is an object in the form { bandName: ranges },
         *                       where bandName is one of FAR, MID, NEAR, RECOVERY, UNKNOWN, NONE
         *                       and ranges is an Array of objects in the { from: real, to: real }.
         *                       Band range is given in 100 feet per minute.
         *                       Example bands: { RECOVERY: [ { from: 0, to: 300 } ], { NEAR: [ { from: 300, to: 600 } ] }
         * @param opt {Object} Options:
         *             <li>units (String): "x100mpm" or "mpm 100x", indicates that resolution bands are given in 100 meters per minute.<br>
         *                                 "mpm",  indicates that resolution bands are given in meters per minute.<br>
         *                                 The widget will automatically convert the bands to 100 feet per minute.</li>
         * @memberof module:VerticalSpeedTape
         * @instance
         */
        setBands(bands, opt) {
            opt = opt || {};

            function normaliseVerticalSpeedBand(b) {
                if (b && b.length > 0) {
                    return b.map(function (range) {
                        if (opt.units === "x100mpm" || opt.units === "mpm 100x") {
                            // if bands are given in 100x metres per minute, we need to convert in 100x feet per minute
                            return {
                                from: meters2feet(range.from),
                                to: meters2feet(range.to)
                            };
                        } else if (opt.units === "mpm") {
                            // if bands are given in metres per minute, we need to convert in 100x feet per minute
                            return {
                                from: meters2feet(range.from) / 100,
                                to: meters2feet(range.to) / 100
                            };
                        }
                        return {
                            from: range.from,
                            to: range.to
                        };
                    });
                }
                return [];
            }
            this.bands.NONE = normaliseVerticalSpeedBand(bands.NONE);
            this.bands.FAR = normaliseVerticalSpeedBand(bands.FAR);
            this.bands.MID = normaliseVerticalSpeedBand(bands.MID);
            this.bands.NEAR = normaliseVerticalSpeedBand(bands.NEAR);
            this.bands.RECOVERY = normaliseVerticalSpeedBand(bands.RECOVERY);
            this.bands.UNKNOWN = normaliseVerticalSpeedBand(bands.UNKNOWN);
            // console.log(this.id + "-vspeed-bands", this.bands);
            _draw_bands(this);
            return this;
        }
        /**
         * @function <a name="setVerticalSpeed">setVerticalSpeed</a>
         * @description Sets the altiude indicator to a given altitude value.
         * @param val {real} Vertical speed value. Default units is 100 feet per minute.
         * @memberof module:VerticalSpeedTape
         * @instance
         */
        setVerticalSpeed(val) {
            // val = limit(-6, 6, "vspeed")(val);
            // set vertical speed bug
            val = parseFloat(val);
            if (!isNaN(val)) {
                this.currentVerticalSpeed = val;
                _update_bug(this);
            } else {
                console.error("Warning, trying to set vertical speed with invalid value", val);
            }
            return this;
        }
        /**
         * @function <a name="setStep">setStep</a>
         * @description Sets the step value for the tape display.
         * @param val {real} Step size. Default units is 100 feet per minute. Default step size is 50 feet for the first 4 ticks, then step size doubles.
         * @memberof module:VerticalSpeedTape
         * @instance
         */
        setStep(val) {
            if (isNaN(parseFloat(val))) {
                console.error("Warning: trying to set an invalid altitude step", val);
                return this;
            }
            this.verticalSpeedStep = parseFloat(val);
            _create_vspeed_ticks(this);
            _update_bug(this);
            _draw_bands(this);
            return this.setVerticalSpeed(this.currentVerticalSpeed, {
                transitionDuration: "0ms"
            });
        }
        /**
         * @function <a name="getStep">getStep</a>
         * @description Returns the current step size.
         * @return {real} The current step size, in 100 feet per minute.
         * @memberof module:VerticalSpeedTape
         * @instance
         */
        getStep() {
            return this.verticalSpeedStep;
        }
    }

    module.exports = VerticalSpeedTape;
});