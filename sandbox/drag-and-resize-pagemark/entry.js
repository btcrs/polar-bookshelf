const interact = require("interactjs");
const $ = require("jquery");
const assert = require("assert");
const {Rects} = require("../../web/js/Rects");
const {Objects} = require("../../web/js/util/Objects");
const {Styles} = require("../../web/js/util/Styles");
const {assertJSON} = require("../../web/js/test/Assertions");
const {Rect} = require("../../web/js/Rect");
const {RectAdjacencyCalculator} = require("../../web/js/pagemarks/view/interact/drag/RectAdjacencyCalculator");
const {RectResizeAdjacencyCalculator} = require("../../web/js/pagemarks/view/interact/resize/RectResizeAdjacencyCalculator");
const {RectEdges} = require("../../web/js/pagemarks/view/interact/edges/RectEdges");
const {Preconditions} = require("../../web/js/Preconditions");

/**
 */
function calculateIntersectedPagemarks(element, resizeRect) {

    Preconditions.assertNotNull(element, "element");
    Preconditions.assertNotNull(resizeRect, "resizeRect");

    // // This is where we are NOW, now where we are GOING to be.
    // let elementRect = Rects.fromElementStyle(element);

    // console.log(`x: ${x}: y: ${y}`);
    console.log("calculateIntersectedPagemarks: resizeRect is: " + JSON.stringify(resizeRect, null, "  "));

    let doc = element.ownerDocument;
    let pagemarks = Array.from(doc.querySelectorAll(".pagemark"))
                                  .filter( current => current !== element);

    // make sure that our pagemarks aren't the same ID as the element. we can
    // remove this when we go to production
    pagemarks.forEach(current => current.getAttribute("id") !== element.getAttribute("id"));

    let intersectedRects = [];

    pagemarks.forEach(pagemark => {

        let pagemarkRect = Rects.fromElementStyle(pagemark);

        if(Rects.intersect(pagemarkRect, resizeRect)) {
            intersectedRects.push(pagemarkRect);
        }

    });

    return {
        resizeRect,
        intersectedRects
    }

}

function updateTargetText(target) {

    target.textContent = JSON.stringify(Rects.fromElementStyle(target), null, "  ");

}

function moveTargetElement(x, y, target) {

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

    //updateTargetText(target);

}

function resizeTargetElement(rect, target) {

    // first move it the same way as if it were dragged
    moveTargetElement(rect.left, rect.top, target);

    // now set the width and height
    target.style.width  = `${rect.width}px`;
    target.style.height = `${rect.height}px`;

}

function captureStartTargetRect(interactionEvent) {
    interactionEvent.interaction.startTargetRect = Rects.fromElementStyle(interactionEvent.target);
}

function computeOriginXY(interactionEvent) {

    let delta = {
        x: interactionEvent.pageX - interactionEvent.interaction.startCoords.page.x,
        y: interactionEvent.pageY - interactionEvent.interaction.startCoords.page.y
    };

    // console.log(`dragmove: delta.x: ${delta.x} and delta.y: ${delta.y}`);
    // console.log(`dragmove: interactionEvent.interaction.startCoords.page: ` + JSON.stringify(interactionEvent.interaction.startCoords.page) );
    // console.log(`dragmove: testDelta: ` + JSON.stringify(delta));

    let x = interactionEvent.interaction.startTargetRect.left + delta.x;
    let y = interactionEvent.interaction.startTargetRect.top + delta.y;

    return {x, y};

}

function init(selector) {

    interact(selector)
        .draggable({

            inertia: false,
            restrict: {
                restriction: "parent",
                outer: 'parent',

                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },

            restrictEdges: {
                outer: 'parent',
                // outer: computeRestriction,
            },

        })
        .resizable({

            // resize from all edges and corners
            edges: {
                left: true,
                right: true,
                bottom: true,
                top: true
            },

            // Keep the edges inside the parent. this is needed or else the
            // bound stretches slightly beyond the container.
            restrictEdges: {
                outer: 'parent',
                // outer: computeRestriction,
            },

            restrict: {
                restriction: 'parent',
                // restriction: computeRestriction
            },

            // minimum size
            restrictSize: {
                min: { width: 50, height: 50 },
            },

            inertia: false,

        })
        .on('dragstart',(interactionEvent) => {
            captureStartTargetRect(interactionEvent);
        })
        .on('dragmove',(interactionEvent) => {

            // console.log("=====================")
            // console.log("dragmove: event: ", event);
            // console.log("dragmove: event.interaction.myTimestamp: ", event.interaction.myTimestamp);
            // console.log("dragmove: event.target: ", event.target);
            // console.log("dragmove: event.restrict: ", event.restrict);
            // console.log(`dragmove: event.dx: ${event.dx} and event.dy: ${event.dy}`);
            // console.log(`dragmove: event.x0: ${event.x0} and event.y0: ${event.y0}`);
            // console.log(`dragmove: event.clientX: ${event.clientX} and event.clientY: ${event.clientY}`);
            // console.log(`dragmove: event.clientX0: ${event.clientX0} and event.clientY0: ${event.clientY0}`);

            let target = interactionEvent.target;

            let origin = computeOriginXY(interactionEvent);

            let targetRect = Rects.fromElementStyle(target);

            let intersectedPagemarks = calculateIntersectedPagemarks(interactionEvent.currentTarget, Rects.createFromBasicRect({
                left: origin.x,
                top: origin.y,
                width: targetRect.width,
                height: targetRect.height
            }));

            if(intersectedPagemarks.intersectedRects.length === 0) {

                console.log("NOT INTERSECTED");

                console.log("Moving to origin: " + JSON.stringify(origin));
                moveTargetElement(origin.x, origin.y, target);

            } else {

                console.log("INTERSECTED");

                let primaryRect = Rects.createFromBasicRect({
                    left: origin.x,
                    top: origin.y,
                    width: targetRect.width,
                    height: targetRect.height
                });

                let intersectedRect = intersectedPagemarks.intersectedRects[0];

                let restrictionRect = Rects.createFromBasicRect({
                    left: 0,
                    top: 0,
                    width: target.parentElement.offsetWidth,
                    height: target.parentElement.offsetHeight
                });

                let adjacency = RectAdjacencyCalculator.calculate(primaryRect, intersectedRect, restrictionRect);

                let adjustedRect = adjacency.adjustedRect;

                if(adjustedRect) {
                    moveTargetElement(adjustedRect.left, adjustedRect.top, target);
                } else {

                    // FIXME: if we resize slightly..it triggers this code and
                    // the adjustment doesn't work.

                    console.warn("Can't move due to no valid adjustedRect we can work with.");

                    console.log("FIXME: primaryRect: " + JSON.stringify(primaryRect, null, "  "));
                    console.log("FIXME: intersectedRect: " + JSON.stringify(intersectedRect, null, "  "));
                    console.log("FIXME: restrictionRect: " + JSON.stringify(restrictionRect, null, "  "));

                    // FIXME: the invisible rect resize problem still remains...
                    //
                    //        - it happens when we're to the RIGHT of the intersect
                    //          and we try to resize in two dimensions.


                    // looks like it happens when the primary is too large...

                    // FIXME: primaryRect: {
                    //     "left": 291,
                    //         "top": 133,
                    //         "right": 523,
                    //         "bottom": 366,
                    //         "width": 232,
                    //         "height": 233
                    // }
                    // entry.js:233 FIXME: intersectedRect: {
                    //     "left": 170,
                    //         "top": 162,
                    //         "right": 370,
                    //         "bottom": 362,
                    //         "width": 200,
                    //         "height": 200
                    // }
                    // entry.js:234 FIXME: restrictionRect: {
                    //     "left": 0,
                    //         "top": 0,
                    //         "right": 800,
                    //         "bottom": 500,
                    //         "width": 800,
                    //         "height": 500
                    // }

                }

            }

        })
        .on('resizestart', interactionEvent => {
            captureStartTargetRect(interactionEvent);
            console.log("resizestart: interactionEvent.rect: " + JSON.stringify(interactionEvent.rect, null, "  "));
            interactionEvent.interaction.startRect = Objects.duplicate(interactionEvent.rect);

        })
        .on('resizemove', interactionEvent => {

            console.log("resizemove: event: ", interactionEvent);
            console.log("resizemove: event.target: ", interactionEvent.target);
            console.log("resizemove: event.restrict: ", interactionEvent.restrict);
            console.log("resizemove: interactionEvent.rect: " + JSON.stringify(interactionEvent.rect, null, "  "));
            console.log("resizemove: interactionEvent.interaction.startRect: " + JSON.stringify(interactionEvent.interaction.startRect, null, "  "));

            let target = interactionEvent.target;

            // the tempRect is the rect that the user has attempted to draw
            // but which we have not yet accepted and is controlled by interact.js

            let tempRect = Rects.createFromBasicRect(interactionEvent.rect);

            let deltaRect = Rects.subtract(tempRect, interactionEvent.interaction.startRect);

            let resizeRect = Rects.add(interactionEvent.interaction.startTargetRect, deltaRect);

            // before we resize, verify that we CAN resize..

            let intersectedPagemarks = calculateIntersectedPagemarks(target, resizeRect);

            console.log("resizemove: deltaRect: " + JSON.stringify(deltaRect, null, "  "));

            if(intersectedPagemarks.intersectedRects.length === 0) {

                console.log("Resizing in non-intersected mode");

                resizeTargetElement(resizeRect, target);

            } else {

                console.log("Resizing in intersected mode");

                let rectResizeAdjacencyCalculator = new RectResizeAdjacencyCalculator();

                let intersectedRect = intersectedPagemarks.intersectedRects[0];

                let rectEdges = new RectEdges(interactionEvent.edges);

                let adjustedRect = rectResizeAdjacencyCalculator.calculate(resizeRect, intersectedRect, rectEdges);

                console.log("resizemove: adjustedRect: " + JSON.stringify(adjustedRect, null, "  "));

                resizeTargetElement(adjustedRect, target);

            }

        });
}

$(document).ready( () => {

    console.log("Ready now...");

    console.log("Interact setup!");
    // init("#pagemark0");
    // init("#pagemark1");

    init(".resize-drag");

});
