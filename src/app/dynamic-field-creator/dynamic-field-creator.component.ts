import { AfterContentInit, Component, ElementRef } from '@angular/core';
import { Drake } from 'dragula';
import * as _ from 'lodash';
import { DragulaService, Group } from 'ng2-dragula';
import { Subscription } from 'rxjs';

import { DynamicFieldItem, DynamicFieldLocation } from '../dynamic-field-item/dynamic-field-item.component';

@Component({
  selector: 'dynamic-field-creator',
  templateUrl: './dynamic-field-creator.component.html',
  styleUrls: ['./dynamic-field-creator.component.less'],
  providers: [DragulaService]
})
export class DynamicFieldCreatorComponent implements AfterContentInit {

  private BLANK: string = 'BLANK';

  fields: Array<string> = [];

  private _orginalFields: Array<string> = [];
  rows: Array<number> = [];
  columns: Array<number> = [];
  matrix: Array<any> = [];
  selectedField: string = this.BLANK;
  selectedControlType: string = 'Label';
  private _dragulaGroup: Group;
  private _subs = new Subscription();
  private _drake: Drake;

  constructor(
    private _elementRef: ElementRef,
    private _dragulaService: DragulaService
  ) {

    this._dragulaGroup = this._dragulaService.find('DFC');
    if (!this._dragulaGroup) {
      this._dragulaGroup = this._dragulaService.createGroup('DFC', {
        revertOnSpill: true
      });
    }

    this._drake = this._dragulaGroup.drake;

    this._subs.add(this._dragulaService.drag('DFC')
      .subscribe(({ name, el, source }) => {
      }));

    this._subs.add(this._dragulaService.drop('DFC')
      .subscribe(({ name, el, target, source, sibling }) => {
        console.log(`drop: ${target}`);

        const sourceUid: string = source.getAttribute('data-item-uid');

        const sourceLocation = {
          rowIndex: Number(source.getAttribute('data-row-index')),
          columnIndex: Number(source.getAttribute('data-column-index'))
        };

        const sourceItem: DynamicFieldItem = this.findItemByUid(sourceUid);

        const isTrash: number = target.className.indexOf('trashcan');

        if (isTrash > -1) {
          this.removeItem(sourceItem);
          return;
        }

        const targetUid: string = target.getAttribute('data-item-uid');
        const targetLocation = {
          rowIndex: Number(target.getAttribute('data-row-index')),
          columnIndex: Number(target.getAttribute('data-column-index'))
        };

        this._drake.cancel(true);

        this.moveItem(sourceItem, targetLocation);

      }));

    // You can also get all events, not limited to a particular group
    this._subs.add(this._dragulaService.drop()
      .subscribe(({ name, el, target, source, sibling }) => {
        console.log(`drop: ${target}`);

      })
    );

    this._subs.add(this._dragulaService.over('DFC')
      .subscribe(({ el, container }) => {
        console.log('over', container);
        this.addClass(container, 'dfc-ex-over');
      })
    );

    this._subs.add(this._dragulaService.out('DFC')
      .subscribe(({ el, container }) => {
        console.log('out', container);
        this.removeClass(container, 'dfc-ex-over');
      })
    );

    // this._orginalFields.push(this.BLANK);
    for (let i = 1; i < 30; i++) {
      this._orginalFields.push(`Item ${i}`);
    }
    this.init(12, 5);
  }

  ngAfterContentInit(): void {
    this.setAvailableFields();
  }

  addClass(container: Element, className: string) {
    container.className = container.className + ` ${className}`;
  }

  removeClass(container: Element, className: string) {
    container.className = container.className.replace(className, '').trim();
  }

  setAvailableFields(): void {
    const tempFields: Array<string> = _.clone(this._orginalFields);

    const usedFields: Array<string> = _.reject(_.flatten(this.matrix), _.isUndefined).map(x => x.field);

    const difference: Array<string> = _.difference(tempFields, usedFields);

    // difference.sort();

    // if (difference[0] !== this.BLANK) {
    //   difference.splice(0, 0, this.BLANK);
    // }

    this.fields = difference;
    this.selectedField = this.fields[0];
  }



  init(rows: number, columns: number) {
    this.rows.length = 0
    this.columns.length = 0

    for (let i = 0; i < rows; i++) {
      this.rows.push(i);
    }

    for (let i = 0; i < columns; i++) {
      this.columns.push(i);
    }

    for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
      this.matrix[columnIndex] = [];
      for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
        this.matrix[columnIndex][rowIndex] = undefined;
      }
    }
  }

  appendItem($event: MouseEvent): void {
    let newSpot = this.findOpenCell();
    console.log(newSpot);
    if (newSpot !== undefined) {
      const isBlank: boolean = this.selectedField === this.fields[0];
      const newItem: DynamicFieldItem = {
        uid: newSpot.columnIndex.toString() + '_' + newSpot.rowIndex.toString(),
        field: this.selectedField, // isBlank ? '&nbsp;' : this.selectedField,
        location: newSpot,
        controlType: 'label'
      };
      this.matrix[newSpot.columnIndex][newSpot.rowIndex] = newItem;
    }
    this.setAvailableFields();
  }

  insertSpacer($event): void {
    let newSpot = this.findOpenCell();
    console.log(newSpot);
    if (newSpot !== undefined) {
      const isBlank: boolean = this.selectedField === this.fields[0];
      const newItem: DynamicFieldItem = {
        uid: newSpot.columnIndex.toString() + '_' + newSpot.rowIndex.toString(),
        field: this.BLANK,
        location: newSpot,
        controlType: 'hr'
      };
      this.matrix[newSpot.columnIndex][newSpot.rowIndex] = newItem;
    }
  }

  insertItem($event: MouseEvent): void {

    // const isBlank: boolean = this.selectedField === this.BLANK;
    const newItem: DynamicFieldItem = {
      uid: '0_0',
      field: this.selectedField, // isBlank ? '&nbsp;' : this.selectedField,
      location: { rowIndex: 0, columnIndex: 0 },
      controlType: this.selectedControlType // isBlank ? 'label' : this.selectedControlType
    };

    const flatten: Array<DynamicFieldItem> = _.flatten(this.matrix);

    flatten.unshift(newItem);

    let firstIndex = flatten.findIndex(x => x === undefined);

    flatten.splice(firstIndex, 1);

    this.reorderItems(flatten);
    this.setAvailableFields();
  }

  reorderItems(array: Array<DynamicFieldItem>): void {

    this.clearMatrix();

    for (let columnIndex = 0; columnIndex < this.matrix.length; columnIndex++) {

      let rows = this.matrix[columnIndex];

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {

        if (array.length > 0) {

          const item: DynamicFieldItem = array.shift();
          if (item) {
            const newLocation = {
              rowIndex: rowIndex,
              columnIndex: columnIndex
            }
            const newUid = newLocation.columnIndex.toString() + '_' + newLocation.rowIndex.toString();
            const newItem: DynamicFieldItem = Object.assign({}, item, { location: newLocation, uid: newUid });
            this.matrix[columnIndex][rowIndex] = newItem;
          }
        }
      }
    }
  }

  removeItem(item: any): void {
    if (item) {
      this.matrix[item.location.columnIndex][item.location.rowIndex] = undefined;
    }
    this.setAvailableFields();
  }

  onColumnsChange($event): void {
    this.init(this.rows.length, $event);
  }

  onRowsChange($event): void {
    this.init($event, this.columns.length);
  }

  findItemByUid(uid: string): DynamicFieldItem {
    for (let columnIndex = 0; columnIndex < this.matrix.length; columnIndex++) {
      let rows = this.matrix[columnIndex];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const item: DynamicFieldItem = this.matrix[columnIndex][rowIndex];
        if (item !== undefined) {
          if (item.uid === uid) {
            return item;
          }
        }
      }
    }
    return undefined;
  }

  findOpenCell(): DynamicFieldLocation {
    for (let columnIndex = 0; columnIndex < this.matrix.length; columnIndex++) {
      let rows = this.matrix[columnIndex];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        let row = rows[rowIndex];
        if (row === undefined) {
          return { columnIndex: columnIndex, rowIndex: rowIndex };
        }
      }
    }
    return undefined;
  }

  hasCollision(location: DynamicFieldLocation): boolean {
    return this.matrix[location.columnIndex][location.rowIndex] !== undefined;
  }

  moveItem(item: DynamicFieldItem, newLocation: DynamicFieldLocation) {
    // we already have an item here.  we need to see if we can move it
    // to the next location.
    if (this.hasCollision(newLocation)) {
      // need to insert into spot it needs to go and then shift
      // everything until first blank spot
      this.matrix[item.location.columnIndex].splice(item.location.rowIndex, 1);
      this.matrix[newLocation.columnIndex].splice(newLocation.rowIndex, 0, item);
      const flatten: Array<DynamicFieldItem> = _.flatten(this.matrix);
      this.reorderItems(flatten);
    } else {
      this.matrix[item.location.columnIndex][item.location.rowIndex] = undefined;
      this.matrix[newLocation.columnIndex][newLocation.rowIndex] =
        Object.assign({}, item, { location: newLocation });
    }
  }

  clearItems($event: MouseEvent): void {
    this.clearMatrix();
    this.setAvailableFields();
  }

  findNextCell(item: DynamicFieldItem, newLocation: DynamicFieldLocation): DynamicFieldLocation {
    return undefined;
  }

  public getModel(): any {
    return JSON.stringify(this.matrix, null, 4);
  }

  collaspeColumns($event): void {
    for (let columnIndex = 0; columnIndex < this.matrix.length; columnIndex++) {
      let rows = this.matrix[columnIndex];
      const cells = rows.filter(x => x !== undefined);
      for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
        const item: DynamicFieldItem = cells[rowIndex];
        item.location = {
          rowIndex: rowIndex,
          columnIndex: columnIndex
        };
      }

      for (let index = cells.length; index < rows.length; index++) {
        cells.push(undefined);
      }

      this.matrix[columnIndex] = cells;
    }
  }

  collaspeAll($event): void {

    this.collaspeColumns($event);

    const compacted = _.reject(_.flatten(this.matrix), _.isUndefined);

    this.reorderItems(compacted);

    // this.clearMatrix();

    // for (let columnIndex = 0; columnIndex < this.matrix.length; columnIndex++) {

    //   let rows = this.matrix[columnIndex];

    //   for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {

    //     if (compacted.length > 0) {

    //       const item: DynamicFieldItem = compacted.shift();
    //       if (item) {
    //         const newLocation = {
    //           rowIndex: rowIndex,
    //           columnIndex: columnIndex
    //         }
    //         const newUid = newLocation.columnIndex.toString() + '_' + newLocation.rowIndex.toString();
    //         const newItem: DynamicFieldItem = Object.assign({}, item, { location: newLocation, uid: newUid });
    //         this.matrix[columnIndex][rowIndex] = newItem;
    //       }
    //     }
    //   }
    // }
  }

  clearMatrix(): void {
    for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
      this.matrix[columnIndex] = [];
      for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
        this.matrix[columnIndex][rowIndex] = undefined;
      }
    }
  }

  toMatrix(array: Array<any>, elementsPerSubArray: number) {
    let matrix = [], i, k;

    for (i = 0, k = -1; i < array.length; i++) {
      if (i % elementsPerSubArray === 0) {
        k++;
        matrix[k] = [];
      }

      let item = array[i];
      matrix[k].push(item);
    }

    return matrix;
  }


  canMoveUp(item: DynamicFieldItem): boolean {


    if (item.location.rowIndex === 0) {
      return false;
    }

    if (item.location.rowIndex === 0) {
      return false;
    }


    return false;
  }


}

