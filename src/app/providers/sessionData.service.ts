import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class SessionDataService {

  public uuid: string = "";
  public httpResponse: string = "";
  public httpRequest: string = "";
  public backgroundMode: string = "";
  public wakeLock: string = "";

  public consentGiven: boolean = null;

  public dataFormId: number;
  public preFormId: number;
  public postFormId: number;
  public consentFormId: number;
  public withdrawFormId: number;

  public dataFormObject: any = null;
  public preFormObject: any = null;
  public postFormObject: any = null;
  public consentFormObject: any = null;
  public withdrawFormObject: any = null;

  public formsMeta: any[] = []
  public formsObjects: any[] = []

  public currentPopover: any = null;

  public brightness: number = -1;

  constructor(
  ) {
  }

}