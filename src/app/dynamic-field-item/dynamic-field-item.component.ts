import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'dynamic-field-item',
  templateUrl: './dynamic-field-item.component.html',
  styleUrls: ['./dynamic-field-item.component.less']
})
export class DynamicFieldItemComponent implements OnInit {

  @Output() remove: EventEmitter<any> = new EventEmitter<any>();
  @Input() fields: Array<string> = [];
  @Input() item: DynamicFieldItem;

  constructor() {
  }

  ngOnInit() {
  }

}

export class DynamicFieldItem {
  uid: string;
  field: string;
  location: DynamicFieldLocation;
  controlType: string;
}

export class DynamicFieldLocation {
  columnIndex: number;
  rowIndex: number;
}