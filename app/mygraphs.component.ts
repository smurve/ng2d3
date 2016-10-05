//import { Component, EventEmitter, SimpleChange, OnChanges } from '@angular/core';
import {Directive, DoCheck, ElementRef, Input, OnInit, SimpleChanges} from '@angular/core';
import * as D3 from 'd3';

import {GraphData} from './graphData';
import {GraphDataService} from './graphData.service';

@Directive({
    selector: 'my-graphs',
})


export class MyGraphsComponent implements OnInit {

    private canvas: any;
    private gService: GraphDataService;   // for the data injection

    private graphs: GraphData[][] = [];         // the actual data

    private data: any[];

    // layout params
    private svg_width = 1400;
    private svg_height = 900;

    private width_per_y_axis = 40;
    private margin_top = 20;
    private margin_right = 20;
    private margin_left = 40 + this.width_per_y_axis * 2; // max two y-axes

    private width = +this.svg_width - this.margin_left - this.margin_right;
    private height_focus = this.svg_height / 4;
    private height_context = this.svg_height / 16;

    private ratio = this.height_context / this.height_focus;

    constructor(elementRef: ElementRef, gService: GraphDataService) {
        let d3: any = D3;  // to shut stupid typescript up about type checking
        let el: any = elementRef.nativeElement;  // reference to <my-graph> element from the app component
        this.canvas = d3.select(el);             // D3 chart container
        this.gService = gService;
    }    // end of constructor


    ngOnInit() {

        let that = this;

        let d3: any = D3;
        this.graphs = that.gService.getData();

        // d3 code "inspired" by http://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
        // create the canvas that will contain the graph
        let svg: any = that.canvas
            .append('svg')
            .attr('width', that.svg_width)
            .attr('height', that.svg_height);

        // limit the area where the graph is visible (used in css)
        // so when zooming the graph doesn't go out of boundaries
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", that.width)
            .attr("height", that.height_focus);





        // linear scale for the y axis
        let y: any[] = [
            d3.scaleLinear().range([that.height_focus, 0]),
            d3.scaleLinear().range([that.height_focus, 0])];

        let y_range: any[] = [
            (d: GraphData) => y[0](d.v),
            (d: GraphData) => y[1](d.v)
        ];

        let x: any = d3.scaleLinear().range([0, that.width]);
        x.domain(d3.extent(this.graphs[0], (d:GraphData) => d.t));
        let xAxis: any = d3.axisBottom(x);
        let x_range: any = (d: GraphData) => x(d.t);

        // set domain range for x axes (same for all graphs)
        let x2: any = d3.scaleLinear().range([0, that.width]);
        x2.domain(x.domain());

        that.data = [
            d3.line().x(x_range).y(y_range[0]),
            d3.line().x(x_range).y(y_range[1])
        ];


        /***************************************************************************************
         *                 DRAW THE FOCUS GRAPH
         ***************************************************************************************/

        // group
        let focus: any = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + that.margin_left + "," + that.margin_top + ")");

        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + that.height_focus / 2 + ")")
            .call(xAxis);


        for (let i: number = 1; i <= that.graphs.length; i++) {

            focus.append("path")
                .datum(that.graphs[i-1])
                .attr("class", "g" + i);

            // set domain range for y axes
            y[i - 1].domain(d3.extent(that.graphs[i-1], (d:GraphData) => d.v));
            // draw Y axis for big graph
            focus.append("g")
                .attr("class", "axis axis--y" + i)
                .attr("transform", "translate(" + -that.width_per_y_axis * (i - 1) + ",0)");

            focus.select(".g" + i).attr("d", that.data[i - 1]);
            focus.select(".axis--y" + i).call(d3.axisLeft(y[i-1]));  // draw y axis
        }


        /***************************************************************************************
         *                 DRAW THE CONTEXT GRAPH
         ***************************************************************************************/
        let resize: (fn: any) => any =
                function (fn: any): any {
                    return (x)=>fn(x) * that.ratio
                };

        let context_data: any[] = [
            d3.line().x(x_range).y(resize(y_range[0])),
            d3.line().x(x_range).y(resize(y_range[1]))
        ];

        // group with the small graph
        let tempHeight2: number = that.height_focus + that.margin_top * 3;
        let context: any = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + that.margin_left + "," + tempHeight2 + ")");

        for (let i: number = 1; i <= that.graphs.length; i++) {
            //if(!this.selectedStats[i-1]) continue;        // skip unselected stats
            // draw small graph
            context.append("path")
                .datum(that.graphs[i-1])
                .attr("class", "gs" + i)
                .attr("transform", "translate( 0," + that.height_context * (i - 1) + ")")
                .attr("d", context_data[i - 1]);

            // draw X axis for small graph
            context.append("g")
                .attr("class", "axis axis--x" + i)
                .attr("transform", "translate(0," + that.height_context * (i - 1 / 2) + ")")
                .call(xAxis);
        }


        /***************************************************************************************
         *                 ZOOM AND BRUSH
         ***************************************************************************************/
        let brush: any = d3.brushX()        // define a brush on the X axis
            .extent([[0, 0], [that.width, this.height_context * that.graphs.length]]) // the area that the brush may span
            .on("brush end", brushed);           // listen to events (move and mouseup on the brush) and call the function brushed

        let zoom: any = d3.zoom()           // define a zoom
            .scaleExtent([1, Infinity])     // which can zoom up to infinity
            .translateExtent([[0, 0], [that.width, that.height_focus * 2]])     // region that can be zoomed
            .extent([[0, 0], [that.width, that.height_focus * 2]])      // what's the difference from the one above?
            .on("zoom", zoomed);            // listen to the event zoom and call zoomed

        // attach brushable area to the small graph
        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        // attach zoomable area to the big graph
        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", that.width)
            .attr("height", that.height_focus)
            .attr("transform", "translate(" + that.margin_left + "," + that.margin_top + ")")
            .call(zoom);

        function zoomed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
            let t: any = d3.event.transform;    // save info about the zoom event


            // redraw graphs
            focus.select(".axis--x").call(xAxis); // redraw zoomed x axis
            x.domain(t.rescaleX(x2).domain());    // set new range for the x variable
            for (let i = 1; i <= that.graphs.length; i++) {
                focus.select(".g" + i).attr("d", that.data[i - 1]);   // redraw zoomed graph
            }
            context.select(".brush").call(brush.move, x.range().map(t.invertX, t));    // resizes the brush in the lower part

        }


        function brushed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

            // save info about the brush event
            let s: any;
            if (d3.event.selection)
                s = d3.event.selection;
            else s = x2.range();    // when click outside the brush, zoom out

            x.domain(s.map(x2.invert, x2)); // redefine domain of big graph according to the new brush range
            // reload the graph lines
            for (let i: number = 1; i <= that.graphs.length; i++) {
                focus.select(".g" + i).attr("d", that.data[i - 1]);
            }
            focus.select(".axis--x").call(xAxis);  // reload the x axis

            // call the zoom function in case the brush was resized
            svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
                .scale(that.width / (s[1] - s[0]))
                .translate(-s[0], 0));

        }

    }

}