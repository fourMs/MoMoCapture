import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HTTP } from '@ionic-native/http/ngx';
import 'hammerjs';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { PowerManagement } from '@ionic-native/power-management/ngx';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SessionDataService } from './providers/sessionData.service';

import { Geolocation } from '@ionic-native/geolocation/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { File } from '@ionic-native/file/ngx';

import { DynamicFormsIonicUIModule } from "@ng-dynamic-forms/ui-ionic";
import { DynamicFormsMaterialUIModule } from "@ng-dynamic-forms/ui-material";
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
  	BrowserModule, 
    HttpClientModule,
  	IonicModule.forRoot({animated: false}), 
  	AppRoutingModule,
    ReactiveFormsModule,
    DynamicFormsMaterialUIModule,
    BrowserAnimationsModule
  	],
  providers: [
    StatusBar,
    SplashScreen,
    PowerManagement,
    Geolocation,
    BackgroundMode,
    NativeStorage,
    SessionDataService,
    File,
    HTTP,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
