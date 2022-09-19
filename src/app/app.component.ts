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
import { Brightness } from '@ionic-native/brightness/ngx';

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
    private router: Router,
    private brightness: Brightness
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
        this.nativeStorage.getItem('consent')
          .then(
            data => { 
              this.sessionData.consentGiven = data;
              console.log('Already stored item consentGiven:' + data)
            },
            error => {
              console.error('storage item consentGiven does not exists')
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
      // this.brightness.getBrightness().then(bValue => {
      //   this.sessionData.brightness = bValue;
      //   //console.log('BrightXApp: ' + bValue);
      // }).catch((error) => {
      //     alert("Brightness acquisition error!");
      //     console.log("Brightness acquisition error: ",error);
      // });

    });
  }

  loadFormsID(isCordova) {
    if(isCordova) {

        var thisMethod: requestMethod = 'get';
        var options = { method: thisMethod };

        //this.httpNative.sendRequest('https://www.uio.no/ritmo/english/news-and-events/events/musiclab/musiclab_app_nettskjema_multi.txt', options).then(
        this.httpNative.sendRequest('https://www.uio.no/ritmo/english/projects/musiclab/musiclab_app_nettskjema_all.json', options).then(
            (response) => {
              let data = JSON.parse(response.data);
              this.sessionData.dataFormId = data.Data.id;
              this.sessionData.consentFormId = data.ConsentForm.id;
              this.sessionData.withdrawFormId = data.WithdrawForm.id;
              for(let form of Object.values(data.DynamicForms))
                this.sessionData.formsMeta.push(form);
              this.loadFormsContent([this.sessionData.dataFormId, this.sessionData.consentFormId, this.sessionData.withdrawFormId], null); //load Fixed forms
              this.loadFormsContent(null, this.sessionData.formsMeta);//load dynamic forms
              this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response  + "\n" ;
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

        this.http.get('assets/data/musiclab_app_nettskjema_all.json').subscribe(
          response => {
            let data : any = response;
            this.sessionData.dataFormId = data.Data.id;
            this.sessionData.consentFormId = data.ConsentForm.id;
            this.sessionData.withdrawFormId = data.WithdrawForm.id;
            for(let form of Object.values(data.DynamicForms))
              this.sessionData.formsMeta.push(form);
            this.loadFormsContent([this.sessionData.dataFormId, this.sessionData.consentFormId, this.sessionData.withdrawFormId], null); //load Fixed forms
            this.loadFormsContent(null, this.sessionData.formsMeta);//load dynamic forms
            this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response  + "\n" ;
          },
          error => {
            this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + error.status + "\n" + error.error  + "\n" ;
          }
        );
    }
  }

  loadFormsContent(formIds: any, formsMeta: any[]) {
    var self = this;
    function  assignFormContent(content:any){
      let myResponse = content;
      let formType = "none";
      if(myResponse.form.formId == self.sessionData.dataFormId) {
        self.sessionData.dataFormObject = myResponse;
        formType = "data";
      }
      if(myResponse.form.formId == self.sessionData.preFormId) {
        self.sessionData.preFormObject = myResponse;
        formType = "pre";
      }
      if(myResponse.form.formId == self.sessionData.postFormId) {
        self.sessionData.postFormObject = myResponse;
        formType = "post";
      }
      if(myResponse.form.formId == self.sessionData.consentFormId) {
        self.sessionData.consentFormObject = myResponse;
        formType = "consent";
        if(self.sessionData.consentGiven) {
          self.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
        } else {
          self.router.navigateByUrl('/form-consent', { replaceUrl: true });
        }
      }
      if(myResponse.form.formId == self.sessionData.withdrawFormId) {
        self.sessionData.withdrawFormObject = myResponse;
        formType = "withdraw";
      }
      return formType;
    }

    //Fixed forms
    if(formIds != null){
      for (var i = 0; i < formIds.length; i++) {
        if (this.platform.is('cordova')) {
            var thisMethod: requestMethod = 'get';
            var options = { method: thisMethod };
            this.httpNative.sendRequest('https://nettskjema.no/answer/answer.json?formId='+formIds[i], options).then(
                (response) => {
                  var formType = assignFormContent(JSON.parse(response.data));
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
                  var formType = assignFormContent(response)
                  this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + formType + "Form load: ok\n";
                },
                error => {
                  this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + "Form load: error\n" ;
                }
            );
        } // end if
      } // end for
    }

    //Dynamic forms
    if(formsMeta != null){
      for(var i = 0; i < formsMeta.length; i++){
        if (this.platform.is('cordova')) {
          var thisMethod: requestMethod = 'get';
          var options = { method: thisMethod };
          this.httpNative.sendRequestSync('https://nettskjema.no/answer/answer.json?formId='+formsMeta[i].id, options,
              (response) => {
                //this is for synchronizing
                var data: any = JSON.parse(response.data);
                for(var m = 0; m < formsMeta.length; m++){
                  if(data.form.formId == formsMeta[m].id)
                    this.sessionData.formsObjects[m] = data;
                }
                //console.log(this.sessionData.formsObjects);
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n All Forms load: ok\n";
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
          this.http.get('assets/data/' + formsMeta[i].id + '_answer.json').subscribe(
              response => {
                //this is for synchronizing
                var data: any = response;
                for(var m = 0; m < formsMeta.length; m++){
                  if(data.form.formId == formsMeta[m].id)
                    this.sessionData.formsObjects[m] = data;
                }                
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n All Forms load: ok\n";
              },
              error => {
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + "Forms load: error\n" ;
              }
          );
      } // end if
      }//end for meta
    }// end if meta
  } // end loadFormsContent
}
