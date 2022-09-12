import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, PopoverController, IonContent } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionDataService } from '../providers/sessionData.service';
import { ActivatedRoute } from '@angular/router';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { PopupComponent } from '../popup/popup.component';
import { PopupFormsComponent } from '../popupforms/popupforms.component';
import {
    DynamicFormService,
    DynamicFormModel,
    DynamicFormControlModel,
    DynamicCheckboxModel,
    DynamicInputModel,
    DynamicCheckboxGroupModel,
    DynamicRadioGroupModel,
    DynamicTextAreaModel,
    DynamicSliderModel,
    AUTOCOMPLETE_OFF
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
  'TEXT': 'html',
  'HEADING': 'head',
  'IMAGE': 'image',
  'LINEAR_SCALE': 'linear'
}

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
})
export class FormPage implements OnInit {

  @ViewChild(IonContent, {static: true}) content: IonContent;

  title: string = "";
  myResponse: any;
  myFormSpec: any;
  formType: string = null;
  formId: number;
  formModel: DynamicFormModel;
  formGroup: FormGroup;
  showForm: boolean = false;
  isSubmittingForm: boolean = false;
  consentAgreeId: number;
  isConsentGiven: boolean = false;
  withdrawId: number;
  didWithdraw: boolean = false;

  constructor(
  	private platform: Platform,
  	private sessionData: SessionDataService,
    public http: HttpClient,
    private httpNative: HTTP,
    private activatedRoute: ActivatedRoute,
    private formService: DynamicFormService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private nativeStorage: NativeStorage,
    public popoverController: PopoverController
  	) { }

  ngOnInit() {
    this.activatedRoute.data.subscribe(data => {
      this.formType = data.type;

      if(this.formType == 'pre') {
        this.formId = this.sessionData.preFormId;
        this.myResponse = this.sessionData.preFormObject;
      }
      if(this.formType == 'post') {
        this.formId = this.sessionData.postFormId;
        this.myResponse = this.sessionData.postFormObject;
      }
      if(this.formType == 'consent') {
        this.formId = this.sessionData.consentFormId;
        this.myResponse = this.sessionData.consentFormObject;
      }
      if(this.formType == 'withdraw') {
        this.formId = this.sessionData.withdrawFormId;
        this.myResponse = this.sessionData.withdrawFormObject;
      }
      if(this.formType == 'custom') {
        var index = history.state.index
        this.formId = this.sessionData.formsMeta[index].id;
        this.myResponse = this.sessionData.formsObjects[index];
      }

      this.processForm();
    });
  }

  formSpec(answerJson) {
    this.content.scrollToTop();
    const { form: { pages } } = answerJson
    const allElements = pages.reduce((a, b) => [...a, ...b.elements], [])
    const allQuestions = allElements.reduce((a, b) => {
      if(b.elementType == "TEXT") {
        b.questions = new Array({
          questionId: b.elementId,
          text: b.description,
          mandatory: false,
          answerOptions: []
        });
      }
      if(b.elementType == "IMAGE" && b.image && b.image.imageId) {
        b.questions = new Array({
          questionId: b.elementId,
          text: b.image.imageId,
          mandatory: false,
          answerOptions: []
        });
      }
      if(b.elementType == "HEADING") {
        b.questions = new Array({
          questionId: b.elementId,
          text: b.title,
          mandatory: false,
          answerOptions: []
        });
      }
      return [...a, ...(
      b.questions.map(question => ({...question, type: fieldTypes[b.elementType] || 'unknown' }))
    )];
    }, [])
    const questionFields = allQuestions.map(question => {
      const options = question.answerOptions.length > 0 ? {
        options: question.answerOptions.map(option => ({
          id: option.answerOptionId,
          name: option.text,
        })),
      } : {}
      const linearParams = question.type == "linear" ? {
        max: question.maximumValue,
        min: question.minimumValue,
      } : {}
      return {
        name: question.text,
        type: question.type,
        id: question.questionId,
        required: question.mandatory,
        description: question.description == null ? null: question.description.replaceAll('<p>', '').replaceAll('</p>', '').replaceAll('\n', ''),
        ...options,
        ...linearParams
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
    let newModel = null;
    for (var question of this.myFormSpec.fields) {
      if(question.type == 'text') {
        newModel = new DynamicInputModel({
                id: "_"+question.id,
                label: " ",
                placeholder: this.decodeHtml(question.name),
                autoComplete: AUTOCOMPLETE_OFF
          });
        if(question.name == 'userID') {
          newModel.value = this.sessionData.uuid;
          newModel.layout =  {       
            element: {
              control: "userID-element-control",
              label: "userID-element-label"
            },
            grid: {
              control: "userID-grid-control",
              label: "userID-grid-label"
            }
          }
        } else {
        let newModelLabel = new DynamicRadioGroupModel({
              id: "_label_"+question.id,
              label: question.name
          });
        this.formModel.push(newModelLabel);
        }
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
          if(option.name.includes("I agree")) {
            this.consentAgreeId = option.id;
          }
          if(option.name.includes("Yes") && option.name.includes("withdraw")) {
            this.withdrawId = option.id;
          }
        }
      }
      if(question.type == 'html') {
        newModel = new DynamicRadioGroupModel({
                id: "_"+question.id,
                label: question.name
          });
      }
      if(question.type == 'head') {
        newModel = new DynamicRadioGroupModel({
                id: "_"+question.id,
                label: "<h2>" + question.name + "</h2>"
          });
      }
      if(question.type == 'image') {
        newModel = new DynamicRadioGroupModel({
                id: "_"+question.id,
                label: "<img src='https://nettskjema.no/image/" + question.name + "'>"
          });
      }
      if(question.type == 'linear') {
        newModel = new DynamicSliderModel({
          id: "_"+question.id,
          label: question.name,
          max: question.max,
          min: question.min,
          step: 1,
          vertical: false,
          additional:{
            thumbLabel: true
          }
        });
      }
      if(question.required) {
        newModel.required = true;
      }
      if(question.description != null){
        newModel.label += '\n<p> <em> <font size="2.5em" >' + question.description + ' </font> </em> </p>'
      }else{
        if(question.type == 'linear') {
          newModel.label +=  '\n<br>';
        }
      }
      this.formModel.push(newModel); 
    }
    this.formGroup = this.formService.createFormGroup(this.formModel);
    this.showForm = true;
    this.changeDetectorRef.detectChanges();
    console.log(this.formModel);
  }

  decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  onSubmit() {
    this.isSubmittingForm = true;
    if (!this.platform.is('cordova')) {
      window.setTimeout(() => {
        alert("Form submitted successfully!");
        if(this.formType == 'consent') {
          this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
          this.sessionData.consentGiven = true;
        }
        if(this.formType == 'withdraw') {
          this.router.navigateByUrl('/form-consent', { replaceUrl: true });
          this.sessionData.consentGiven = false;
        }
        this.isSubmittingForm = false;
      }, 2000);
      return;
    }
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
        if(this.formGroup.value[questionId] != null)
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
        if(option != null) {
          form.append('answersAsMap[' + id + '].answerOption', option.replace("_",""));
          if(option.replace("_","") == this.consentAgreeId) {
            this.isConsentGiven = true;
          }
          if(option.replace("_","") == this.withdrawId) {
            this.didWithdraw = true;
          }
        }
      }
      if(questionType == 'linear') {
        if(this.formGroup.value[questionId] != null)
          form.append('answersAsMap[' + id + '].textAnswer', this.formGroup.value[questionId]);
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
          alert("Form submitted successfully!");
          this.isSubmittingForm = false;
          this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response.status.toString() + "\n" + response.data  + "\n" ;
          if(this.formType == 'consent') {
            if(this.isConsentGiven) {
              this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
              this.nativeStorage.setItem('consent', true)
                .then(
                  () => console.log('Stored item consent:' + true),
                  error => console.error('Error storing item consent', error)
                );
            } else {
              alert("You can only use this app if you agree and consent!");
            }
          }
          if(this.formType == 'withdraw' && this.didWithdraw) {
            this.router.navigateByUrl('/form-consent', { replaceUrl: true });
            this.nativeStorage.setItem('consent', false)
              .then(
                () => console.log('Stored item consent:' + false),
                error => console.error('Error storing item consent', error)
              );
          }
        },
        (err) => {
          console.error(err.status);
          console.error(err.error); // Error message as string
          console.error(err.headers);
          alert("Error submitting the form!");
          this.isSubmittingForm = false;
          this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + err.status + "\n" + err.error  + "\n" ;
      });


  }

  async popoverMenu(e: any) {
    const popover = await this.popoverController.create({
      component: PopupComponent,
      translucent: false,
      showBackdrop: false,
      animated: true,
      event: e,
      cssClass: 'popoverClass',
    });
    this.sessionData.currentPopover = popover
    return await popover.present();
  }

  async popoverFormsMenu(e: any) {
    const popover = await this.popoverController.create({
      component: PopupFormsComponent,
      translucent: false,
      showBackdrop: false,
      animated: true,
      event: e,
      cssClass: 'popoverClass',
    });
    this.sessionData.currentPopover = popover
    return await popover.present();
  }

}
