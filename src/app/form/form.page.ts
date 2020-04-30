import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionDataService } from '../providers/sessionData.service';
import { ActivatedRoute } from '@angular/router';

type requestMethod = "head" | "get" | "post" | "put" | "patch" | "delete" | "options" | "upload" | "download";

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
})
export class FormPage implements OnInit {
  title: string = "";
  myResponse: any;
  formType: string = null;
  formId: number;

  constructor(
  	private platform: Platform,
  	private sessionData: SessionDataService,
    public http: HttpClient,
    private httpNative: HTTP,
    private activatedRoute: ActivatedRoute
  	) { }

  ngOnInit() {
    this.formType = this.activatedRoute.snapshot.paramMap.get('type');
    if(this.formType == 'pre') {
      this.formId = this.sessionData.preFormId;
      this.myResponse = this.sessionData.preFormObject;
    }
    if(this.formType == 'post') {
      this.formId = this.sessionData.postFormId;
      this.myResponse = this.sessionData.postFormObject;
    }
  	if (this.platform.is('cordova')) {

        if(this.myResponse == null) {
          var thisMethod: requestMethod = 'get';
          var options = { method: thisMethod };
          this.httpNative.sendRequest('https://nettskjema.no/answer/answer.json?formId='+this.formId, options).then(
              (response) => {
                this.myResponse = response.data;
                if(this.formType == 'pre') {
                  this.sessionData.preFormObject = response.data;
                }
                if(this.formType == 'post') {
                  this.sessionData.postFormObject = response.data;
                }
                this.processForm();
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + this.formType + "Form load:" + response.status.toString() + "\n";
              },
              (err) => {
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + this.formType + "Form load error:" + err.status + "\n" ;
            });
        } else {
          this.processForm();
        }


  	} else {

        if(this.myResponse == null) {
          const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type': 'application/x-www-form-urlencoded',
              'Access-Control-Allow-Origin': '*'
            })
          };
          this.http.get('assets/data/' + this.formId + '_answer.json').subscribe(
              response => {
                this.myResponse = response;
                if(this.formType == 'pre') {
                  this.sessionData.preFormObject = response;
                }
                if(this.formType == 'post') {
                  this.sessionData.postFormObject = response;
                }
                this.processForm();
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + this.formType + "Form load: ok\n";
              },
              error => {
                this.sessionData.httpResponse += new Date().toLocaleString() + "\n " + this.formType + "Form load: error\n" ;
              }
          );
        } else {
          this.processForm();
        }
  	}

  }

  processForm() {
  	this.title = this.myResponse.form.title;
  }

}
