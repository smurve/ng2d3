import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent }   from './app.component';
import{ MyGraphsComponent } from './mygraphs.component';
import{ MyMenuComponent } from './menu.component';
import{ GraphDataService } from './graphData.service';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent, MyGraphsComponent, MyMenuComponent],
  providers:    [GraphDataService],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }