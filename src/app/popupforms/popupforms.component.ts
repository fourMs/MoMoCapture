import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { max } from 'rxjs/operators';
import { SessionDataService } from '../providers/sessionData.service';

@Component({
  selector: 'app-popupforms',
  templateUrl: './popupforms.component.html',
  styleUrls: ['./popupforms.component.scss'],
})
export class PopupFormsComponent implements OnInit {
  //It is assumed that names has 10 fix elements for now
  names: string[] = [];
  constructor(
  	private router: Router,
  	private sessionData: SessionDataService
  	) { }

    ngOnInit() {
      var maxForms = 15;
      var formsMeta = this.sessionData.formsMeta;
      var formsNum = formsMeta.length > maxForms ? maxForms : formsMeta.length;
      var i = 0;
      //Fill the buttons
      for(i = 0; i < formsNum; i++){
        this.names.push(this.sessionData.formsObjects[i].form.title);
        document.getElementById("btn_form_" + i).hidden = false;//Show
      }
    }

  goToWithdraw() {
  	if(this.sessionData.currentPopover) {
  		this.sessionData.currentPopover.dismiss();
  	}
    this.router.navigateByUrl('/tabs/form-withdraw', { replaceUrl: true });
  }

  goToForm(index:number) {
    if(this.sessionData.currentPopover) {
  		this.sessionData.currentPopover.dismiss();
  	}
    //HACK to reaload
    this.router.navigateByUrl('/').then(() => this.router.navigateByUrl('/tabs/form-custom', { replaceUrl: true, state: {index} }));
    //this.router.navigateByUrl('/tabs/form-custom', { replaceUrl: true, state: {index} });
  }
}
