import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { UUID } from 'angular2-uuid';
import { SessionDataService } from './providers/sessionData.service';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type requestMethod = "head" | "get" | "post" | "put" | "patch" | "delete" | "options" | "upload" | "download";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private nativeStorage: NativeStorage,
    private sessionData: SessionDataService,
    private backgroundMode: BackgroundMode,
    public http: HttpClient,
    private httpNative: HTTP
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      //this.statusBar.styleDefault();
      if (this.platform.is('cordova')) {
        this.splashScreen.hide();
        this.nativeStorage.getItem('uuid')
          .then(
            data => { 
              this.sessionData.uuid = data;
              console.log('Already stored item uuid:' + data)
            },
            error => {
              //console.error(error)
              let uuid = UUID.UUID();
              this.sessionData.uuid = uuid;
              this.nativeStorage.setItem('uuid', uuid)
                .then(
                  () => console.log('Stored item uuid:' + uuid),
                  error => console.error('Error storing item uuid', error)
                );
            }
          );
        this.backgroundMode.on("activate").subscribe(() => {
           this.backgroundMode.disableWebViewOptimizations(); 
           this.backgroundMode.disableBatteryOptimizations();
           this.sessionData.backgroundMode += new Date().toLocaleString() + ": activate\n";
        });

        this.backgroundMode.on("enable").subscribe(() => {
           this.sessionData.backgroundMode += new Date().toLocaleString() + ": enable\n";
        });
        this.backgroundMode.on("disable").subscribe(() => {
           this.sessionData.backgroundMode += new Date().toLocaleString() + ": disable\n";
        });
        this.backgroundMode.on("deactivate").subscribe(() => {
           this.sessionData.backgroundMode += new Date().toLocaleString() + ": deactivate\n";
        });
        this.backgroundMode.on("failure").subscribe(() => {
           this.sessionData.backgroundMode += new Date().toLocaleString() + ": failure\n";
        });

        var thisMethod: requestMethod = 'get';
        var options = { method: thisMethod };

        this.httpNative.sendRequest('https://www.uio.no/ritmo/english/news-and-events/events/musiclab/musiclab_app_nettskjema.txt', options).then(
            (response) => {
              let data = JSON.parse(response.data);
              this.sessionData.preFormId = data[0];
              this.sessionData.postFormId = data[1];
              this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response.status.toString() + "\n" + response.data  + "\n" ;
            },
            (err) => {
              this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + err.status + "\n" + err.error  + "\n" ;
          });

      } else {
        this.sessionData.uuid = UUID.UUID();

        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Access-Control-Allow-Origin': '*'
          })
        };
        this.http.get('assets/data/musiclab_app_nettskjema.txt').subscribe(
            response => {
              this.sessionData.preFormId = response[0];
              this.sessionData.postFormId = response[1];
              this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response  + "\n" ;
            },
            error => {
              this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + error.status + "\n" + error.error  + "\n" ;
            }
          );
      }


    });
  }
}
