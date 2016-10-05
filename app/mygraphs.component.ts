//import { Component, EventEmitter, SimpleChange, OnChanges } from '@angular/core';
import {Directive, DoCheck, ElementRef, Input, OnInit, SimpleChanges} from '@angular/core';
import * as D3 from 'd3';

import {GraphData} from './graphData';
import {GraphDataService} from './graphData.service';

@Directive({
    selector: 'my-graphs',
    inputs: ['selectedStats']
})


export class MyGraphsComponent implements DoCheck, OnInit {

    private canvas: any;
    private gService: GraphDataService;   // for the data injection

    private graphs: GraphData[][] = [];         // the actual data

    public selectedStats: Array<boolean> = [false, false]; // stats selected to display
    private oldStats: Array<boolean> = [false, false];     // to check if there were changes
    private line: any[];
    private yAxis: any[];

    // params
    private svg_width: number = 1400;
    private svg_height: number = 900;


    constructor(elementRef: ElementRef, gService: GraphDataService) {
        let d3: any = D3;  // to shut stupid typescript up about type checking
        let el: any = elementRef.nativeElement;  // reference to <my-graph> element from the app component
        this.canvas = d3.select(el);             // D3 chart container
        this.gService = gService;
        this.oldStats = this.selectedStats;
    }    // end of constructor

    // TODO: make it so that it redraws the graphs when selectedStats changes
    ngOnInit() {
        let d3: any = D3;
        this.graphs[0] = this.gService.getData();

        let numGraphs: number = this.selectedStats.length;

        let selected: any[] = this.selectedStats;



        // d3 code "inspired" by http://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
        // create the canvas that will contain the graph
        let svg: any = this.canvas
            .append('svg')
            .attr('width', this.svg_width)
            .attr('height', this.svg_height);


        // layout variables
        let axisWidth: number = 40;
        let margin_top: number = 20,
            margin_right: number = 20,
            margin_left: number = 40 + axisWidth * numGraphs;

        let width: number = + this.svg_width - margin_left - margin_right,
            height_focus: number = this.svg_height / 4,
            height_context: number = this.svg_height / 16;

        let ratio: number = height_context / (height_focus);




        // linear scale for the x
        let x: any = d3.scaleLinear().range([0, width]),
            x2: any = d3.scaleLinear().range([0, width]);


        // linear scale for the y
        let y: any[] = [
            d3.scaleLinear().range([height_focus, 0]),
            d3.scaleLinear().range([height_focus, 0])];

        // define the 3 axes
        let xAxis: any = d3.axisBottom(x)
        let yAxis: any[] = [d3.axisLeft(y[0]),
            d3.axisLeft(y[1])];
        this.yAxis = yAxis;

        let brush: any = d3.brushX()        // define a brush on the X axis
            .extent([[0, 0], [width, height_context * numGraphs]]) // the area that the brush may span
            .on("brush end", brushed);           // listen to events (move and mouseup on the brush) and call the function brushed


        let zoom: any = d3.zoom()           // define a zoom
            .scaleExtent([1, Infinity])     // which can zoom up to infinity
            .translateExtent([[0, 0], [width, height_focus * 2]])     // region that can be zoomed
            .extent([[0, 0], [width, height_focus * 2]])      // what's the difference from the one above?
            .on("zoom", zoomed);            // listen to the event zoom and call zoomed


        // functions to retrieve data stats
        // TODO: find a way to import data in a loop so that the number/name of the stats can be variable
        let stats: any[] = [
            d => d.time,
            d => d.stat1,
            d => d.stat2
        ];
        // functions to refer to the data stats when drawing the lines
        // TODO: find a way to import data in a loop so that the number/name of the stats can be variable
        let statsLine: any[] = [
            d => x(d.time),
            d => y[0](d.stat1),
            d => y[1](d.stat2)
        ];

        // typescript version
        let resize: (fn: any) => any =
            function (fn: any): any {
                return (x)=>fn(x) * ratio
            };


        // big graphs
        let line: any[] = [
            d3.line()
                .x(statsLine[0])
                .y(statsLine[1]),

            d3.line()
                .x(statsLine[0])
                .y(statsLine[2])
        ];
        this.line = line;

        // small graphs
        let line2: any[] = [
            d3.line()
                .x(statsLine[0])
                .y(resize(statsLine[1])),
            d3.line()
                .x(statsLine[0])
                .y(resize(statsLine[2]))
        ];


        // limit the area where the graph is visible (used in css)
        // so when zooming the graph doesn't go out of boundaries
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height_focus);

        // group with the big graph
        let focus: any = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin_left + "," + margin_top + ")");

        // group with the small graph
        let tempHeight2: number = height_focus + margin_top * 3;
        let context: any = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin_left + "," + tempHeight2 + ")");


        // set domain range for x axes (same for all graphs)
        x.domain(d3.extent(this.graphs[0], stats[0]));
        x2.domain(x.domain());

        // draw X axis for big graphs
        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height_focus / 2 + ")")
            .call(xAxis);

        for (let i: number = 1; i <= numGraphs; i++) {

            // draw big graph
            focus.append("path")
                .datum(this.graphs[0])
                .attr("class", "g" + i);
            //.attr("d", line[i-1]);

            // set domain range for y axes
            y[i - 1].domain(d3.extent(this.graphs[0], stats[i]));
            // draw Y axis for big graph
            focus.append("g")
                .attr("class", "axis axis--y" + i)
                .attr("transform", "translate(" + -axisWidth * (i - 1) + ",0)");
            //.call(yAxis[i-1]);

            if (!this.selectedStats[i - 1]) continue;        // skip unselected stats

            focus.select(".g" + i).attr("d", line[i - 1]);  // draw big graph
            focus.select(".axis--y" + i).call(yAxis[i - 1]);  // draw y axis for big graph
        }


        for (let i: number = 1; i <= numGraphs; i++) {
            //if(!this.selectedStats[i-1]) continue;        // skip unselected stats
            // draw small graph
            context.append("path")
                .datum(this.graphs[0])
                .attr("class", "gs" + i)
                .attr("transform", "translate( 0," + height_context * (i - 1) + ")")
                .attr("d", line2[i - 1]);

            // draw X axis for small graph
            context.append("g")
                .attr("class", "axis axis--x" + i)
                .attr("transform", "translate(0," + height_context * (i - 1 / 2) + ")")
                .call(xAxis);
        }


        // attach brushable area to the small graph
        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        // attach zoomable area to the big graph
        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", width)
            .attr("height", height_focus)
            .attr("transform", "translate(" + margin_left + "," + margin_top + ")")
            .call(zoom);


        function zoomed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
            let t: any = d3.event.transform;    // save info about the zoom event


            // redraw graphs
            focus.select(".axis--x").call(xAxis); // redraw zoomed x axis
            x.domain(t.rescaleX(x2).domain());    // set new range for the x variable
            for (let i = 1; i <= numGraphs; i++) {
                if (!selected[i - 1]) continue;        // skip unselected stats
                focus.select(".g" + i).attr("d", line[i - 1]);   // redraw zoomed graph

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
            for (let i: number = 1; i <= numGraphs; i++) {
                if (!selected[i - 1]) continue;        // skip unselected stats
                focus.select(".g" + i).attr("d", line[i - 1]);
            }
            focus.select(".axis--x").call(xAxis);  // reload the x axis

            // call the zoom function in case the brush was resized
            svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
                .scale(width / (s[1] - s[0]))
                .translate(-s[0], 0));

        }

    }


// custom check for changes in the input selectedStats
    ngDoCheck() {
        let d3: any = D3;

        // TODO: find a way to remove the element without setting dummy empty values
        let emptyLine: any = d3.line()
            .x(0)
            .y(0);

        let emptyAxis: any[] = [d3.axisLeft(0),
            d3.axisLeft(0)];

        for (let i: number = 1; i <= this.selectedStats.length; i++) {
            if (!this.oldStats[i - 1] && this.selectedStats[i - 1]) {    // stat selected
                this.oldStats[i - 1] = this.selectedStats[i - 1];     // update selected stats
                d3.select(".g" + i).attr("d", this.line[i - 1]);    // draw big graph
                d3.select(".axis--y" + i).call(this.yAxis[i - 1]);  // draw y axis for big graph
                // TODO: delete/draw the graph
            }
            if (this.oldStats[i - 1] && !this.selectedStats[i - 1]) {    // stat unselected
                this.oldStats[i - 1] = this.selectedStats[i - 1];     // update selected stats
                d3.select(".g" + i).attr("d", emptyLine);         // delete big graph
                //d3.select(".axis--y"+i).call(emptyAxis);  // draw y axis for big graph
                // TODO: delete/draw the graph
            }

        }
    }

}