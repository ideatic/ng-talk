import {Directive, ElementRef, EventEmitter, OnInit, Output} from '@angular/core';


@Directive({
  selector: '[hostCreated]'
})
export class HostCreatedDirective implements OnInit {
  @Output() public hostCreated = new EventEmitter<ElementRef<HTMLElement>>();

  constructor(private _host: ElementRef<HTMLElement>) {
  }

  public ngOnInit() {
    this.hostCreated.emit(this._host);
    this.hostCreated.complete();
  }
}
