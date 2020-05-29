import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
    private httpNative: HTTP,
    private router: Router
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

        this.loadFormsID(true);
      } else {
        this.loadFormsID(false);
      }


    });
  }

  loadFormsID(isCordova) {
    if(isCordova) {

        var thisMethod: requestMethod = 'get';
        var options = { method: thisMethod };

        this.httpNative.sendRequest('https://www.uio.no/ritmo/english/news-and-events/events/musiclab/musiclab_app_nettskjema.txt', options).then(
            (response) => {
              let data = JSON.parse(response.data);
              this.sessionData.preFormId = data[0];
              this.sessionData.postFormId = data[1];
              this.loadFormsContent(data);
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
              this.loadFormsContent(response);
              this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response  + "\n" ;
            },
            error => {
              this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + error.status + "\n" + error.error  + "\n" ;
            }
          );
      }
  }

  loadFormsContent(formIds: any) {
    for (var i = 0; i < 2; i++) {
      if (this.platform.is('cordova')) {
          var thisMethod: requestMethod = 'get';
          var options = { method: thisMethod };
          this.httpNative.sendRequest('https://nettskjema.no/answer/answer.json?formId='+formIds[i], options).then(
              (response) => {
                let myResponse = JSON.parse(response.data);
                let formType = "none";
                if(myResponse.form.formId == this.sessionData.preFormId) {
                  this.sessionData.preFormObject = myResponse;
                  formType = "pre";
                  this.router.navigateByUrl('/tabs', { replaceUrl: true });
                }
                if(myResponse.form.formId == this.sessionData.postFormId) {
                  this.sessionData.postFormObject = myResponse;
                  formType = "post";
                }
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + formType + "Form load:" + response.status.toString() + "\n";
              },
              (err) => {
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + "Form load error:" + err.status + "\n" ;
            });
      } else {
        // Load Example forms
          const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type': 'application/x-www-form-urlencoded',
              'Access-Control-Allow-Origin': '*'
            })
          };
          this.http.get('assets/data/' + formIds[i] + '_answer.json').subscribe(
              response => {
                let myResponse:any = response;
                let formType = "none";
                if(myResponse.form.formId == this.sessionData.preFormId) {
                  this.sessionData.preFormObject = myResponse;
                  formType = "pre";
                  this.router.navigateByUrl('/tabs', { replaceUrl: true });
                }
                if(myResponse.form.formId == this.sessionData.postFormId) {
                  this.sessionData.postFormObject = myResponse;
                  formType = "post";
                }
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + formType + "Form load: ok\n";
              },
              error => {
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + "Form load: error\n" ;
              }
          );
      } // end if
    } // end for
  } // end loadFormsContent


}
