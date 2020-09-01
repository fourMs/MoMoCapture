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
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';

import { DynamicFormsIonicUIModule } from "@ng-dynamic-forms/ui-ionic";
import { DynamicFormsMaterialUIModule } from "@ng-dynamic-forms/ui-material";
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PopupComponent } from './popup/popup.component';

@NgModule({
  declarations: [AppComponent, PopupComponent],
  entryComponents: [PopupComponent],
  imports: [
  	BrowserModule, 
    HttpClientModule,
  	IonicModule.forRoot({animated: false}), 
  	AppRoutingModule,
    ReactiveFormsModule,
    DynamicFormsMaterialUIModule,
    DynamicFormsIonicUIModule,
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
    LocalNotifications,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
