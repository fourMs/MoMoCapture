import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionDataService } from '../providers/sessionData.service';
import { ActivatedRoute } from '@angular/router';
import {
    DynamicFormService,
    DynamicFormModel,
    DynamicFormControlModel,
    DynamicCheckboxModel,
    DynamicInputModel,
    DynamicCheckboxGroupModel,
    DynamicRadioGroupModel
} from "@ng-dynamic-forms/core";
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

type requestMethod = "head" | "get" | "post" | "put" | "patch" | "delete" | "options" | "upload" | "download";

declare const cordova: any;

const fieldTypes = {
  'ATTACHMENT': 'upload',
  'CHECKBOX': 'checkbox',
  'MATRIX_CHECKBOX': 'checkbox',
  'RADIO': 'radio',
  'MATRIX_RADIO': 'radio',
  'SELECT': 'radio',
  'QUESTION': 'text',
  'QUESTION_MULTILINE': 'text',
}

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
})
export class FormPage implements OnInit {
  title: string = "";
  myResponse: any;
  myFormSpec: any;
  formType: string = null;
  formId: number;
  formModel: DynamicFormModel;
  formGroup: FormGroup;
  showForm: boolean = false;

  constructor(
  	private platform: Platform,
  	private sessionData: SessionDataService,
    public http: HttpClient,
    private httpNative: HTTP,
    private activatedRoute: ActivatedRoute,
    private formService: DynamicFormService,
    private changeDetectorRef: ChangeDetectorRef
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
                this.myResponse = JSON.parse(response.data);
                if(this.formType == 'pre') {
                  this.sessionData.preFormObject = this.myResponse;
                }
                if(this.formType == 'post') {
                  this.sessionData.postFormObject = this.myResponse;
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

  formSpec(answerJson) {
    const { form: { pages } } = answerJson
    const allElements = pages.reduce((a, b) => [...a, ...b.elements], [])
    const allQuestions = allElements.reduce((a, b) => [...a, ...(
      b.questions.map(question => ({...question, type: fieldTypes[b.elementType] || 'unknown' }))
    )], [])
    const questionFields = allQuestions.map(question => {
      const options = question.answerOptions.length > 0 ? {
        options: question.answerOptions.map(option => ({
          id: option.answerOptionId,
          name: option.text,
        })),
      } : {}
      return {
        name: question.text,
        type: question.type,
        id: question.questionId,
        required: question.mandatory,
        ...options,
      }})
    return {
      form: { id: answerJson.form.formId },
      fields: questionFields,
    }
  }

  processForm() {
  	this.title = this.myResponse.form.title;
    this.formModel = [];
    this.myFormSpec = this.formSpec(this.myResponse)
    console.log(this.myFormSpec);
    let newModel = null;
    //this.changeDetectorRef.detach();
    for (var question of this.myFormSpec.fields) {
      if(question.type == 'text') {
        newModel = new DynamicInputModel({
                id: "_"+question.id,
                label: question.name
          });
      }
      if(question.type == 'checkbox') {
        newModel = new DynamicCheckboxGroupModel({
                id: "_"+question.id,
                label: question.name,
                group: []
            });
        for (var option of question.options) {
          newModel.group.push(
            new DynamicCheckboxModel(
                  {
                      id: "_"+option.id,
                      label: option.name
                  }
              )
          )
        }
      }
      if(question.type == 'radio') {
        newModel = new DynamicRadioGroupModel({
                id: "_"+question.id,
                label: question.name,
                options: []
            });
        for (var option of question.options) {
          newModel.options.push(
                  {
                      value: "_"+option.id,
                      label: this.decodeHtml(option.name)
                  }
          )
        }
      }
      if(question.required) {
        newModel.required = true;
      }
      this.formModel.push(newModel)  
    }
    this.formGroup = this.formService.createFormGroup(this.formModel);
    this.showForm = true;
    this.changeDetectorRef.detectChanges();
  }

  decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  onSubmit() {
    const form = new cordova.plugin.http.ponyfills.FormData();
    for (var questionId in this.formGroup.value) {
      let id = questionId.replace("_","");
      let questionType;
      for (var question of this.myFormSpec.fields) {
        if(question.id == id) {
          questionType = question.type;
        }
      }
      if(questionType == 'text') {
        form.append('answersAsMap[' + id + '].textAnswer', this.formGroup.value[questionId]);
      }
      if(questionType == 'checkbox') {
        let checkbox = this.formGroup.value[questionId];
        for (var option in checkbox) {
          if(checkbox[option]) {
            let optionId = option.replace("_","");
            form.append('answersAsMap[' + id + '].answerOptions', optionId);
          }
        }        
      }
      if(questionType == 'radio') {
        let option = this.formGroup.value[questionId];
        form.append('answersAsMap[' + id + '].answerOption', option.replace("_",""));
      }
    }
    //form.append('answersAsMap[1996787].textAnswer', this.sessionData.uuid);
    this.httpNative.setDataSerializer("multipart");
    var thisMethod: requestMethod = 'post';
    var options = { method: thisMethod, data: form };

    this.sessionData.httpRequest += new Date().toLocaleString() + "\n" + JSON.stringify(options) + "\n";

    this.httpNative.sendRequest('https://nettskjema.no/answer/deliver.json?formId='+this.formId, options).then(
        (response) => {
          console.log(response.status);
          console.log(JSON.parse(response.data)); // JSON data returned by server
          console.log(response.headers);
          this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response.status.toString() + "\n" + response.data  + "\n" ;
        },
        (err) => {
          console.error(err.status);
          console.error(err.error); // Error message as string
          console.error(err.headers);
          this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + err.status + "\n" + err.error  + "\n" ;
      });


  }

}
