import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { SortableModule } from '@progress/kendo-angular-sortable';
import { ToolBarModule } from '@progress/kendo-angular-toolbar';
import { DragulaModule } from 'ng2-dragula';

import { AppComponent } from './app.component';
import { DynamicFieldCreatorComponent } from './dynamic-field-creator/dynamic-field-creator.component';
import { DynamicFieldItemComponent } from './dynamic-field-item/dynamic-field-item.component';
import { SafePipe } from './safe.pipe';

@NgModule({
  bootstrap: [
    AppComponent
  ],
  declarations: [
    AppComponent,
    DynamicFieldCreatorComponent,
    DynamicFieldItemComponent,
    DynamicFieldCreatorComponent,
    SafePipe
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    BrowserAnimationsModule,
    DropDownsModule,
    ButtonsModule,
    InputsModule,
    SortableModule,
    DragulaModule,
    ToolBarModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
