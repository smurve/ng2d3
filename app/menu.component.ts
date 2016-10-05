import { Component, EventEmitter } from '@angular/core';

@Component({
    selector: 'my-menu',
    template: `
    
    <span *ngFor="let st of statsArray; let i=index">                                         
        <input type="checkbox"  id="{{st}}" #cv [checked]=true                                       
            (change)="onChange(i,cv.checked)">
         {{st}}
                    <!--,{{cv.checked}}-->
          <br>
    </span>

    `,
    inputs: ['statsArray'],
    outputs: ['checkedInfo']
})

export class MyMenuComponent{
    public statsArray: Array<string>;
    public checkedInfo: EventEmitter<[number, boolean]>;
    
    constructor(){
        this.checkedInfo = new EventEmitter();
    }
    
    onChange(index, flag){
        //console.log("stat "+index+" : "+flag);
        this.checkedInfo.emit([index,flag]);
   }
   
}