import { Injectable } from '@angular/core';
import { GRAPH1 } from './mock-data1';
import { GRAPH2 } from './mock-data2';
import {GraphData} from "./graphData";

@Injectable()

export class GraphDataService{
    getData(): GraphData[][]{
        return [GRAPH2, GRAPH1];
    }
}