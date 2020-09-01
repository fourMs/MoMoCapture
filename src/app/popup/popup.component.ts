import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionDataService } from '../providers/sessionData.service';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss'],
})
export class PopupComponent implements OnInit {

  constructor(
  	private router: Router,
  	private sessionData: SessionDataService
  	) { }

  ngOnInit() {}

  goToWithdraw() {
  	if(this.sessionData.currentPopover) {
  		this.sessionData.currentPopover.dismiss();
  	}
    this.router.navigateByUrl('/tabs/form-withdraw', { replaceUrl: true });
  }

}
