import { Injectable } from '@angular/core';
import { GRAPH } from './mock-data';
import {GraphData} from "./graphData";

@Injectable()

export class GraphDataService{
    getData(): GraphData[]{
        return GRAPH;
    }
}