import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormPageRoutingModule } from './form-routing.module';

import { FormPage } from './form.page';
import { DynamicFormsCoreModule, DYNAMIC_VALIDATORS, Validator, ValidatorFactory } from "@ng-dynamic-forms/core";
import { DynamicFormsIonicUIModule } from "@ng-dynamic-forms/ui-ionic";
import { DynamicFormsMaterialUIModule } from "@ng-dynamic-forms/ui-material";
import { ReactiveFormsModule,  NG_VALIDATORS, NG_ASYNC_VALIDATORS } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormPageRoutingModule,
    ReactiveFormsModule,
    DynamicFormsCoreModule.forRoot(), 
    DynamicFormsMaterialUIModule
  ],
  declarations: [FormPage]
})
export class FormPageModule {}
