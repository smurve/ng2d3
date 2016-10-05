import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent }   from './app.component';
import{ MyGraphsComponent } from './mygraphs.component';
import{ GraphDataService } from './graphData.service';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent, MyGraphsComponent],
  providers:    [GraphDataService],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }