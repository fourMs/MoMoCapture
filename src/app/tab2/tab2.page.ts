import { Component, OnInit, OnDestroy } from '@angular/core';
import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { Platform, PopoverController } from '@ionic/angular';
import { UUID } from 'angular2-uuid';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { SessionDataService } from '../providers/sessionData.service';
import { PowerManagement } from '@ionic-native/power-management/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { PopupComponent } from '../popup/popup.component';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Subscription } from "rxjs";
import * as JSZip from "jszip";
import { saveAs } from 'file-saver';


export interface GeneralInfoType {
  timestamp: number;
  time: number;
}

export interface AccelerationType {
  x: number;
  y: number;
  z: number;
}

export interface RotationType {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface GeolocationType {
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface DeviceMotionType {
  timestamp: number;
  time: number;
  x: number;
  y: number;
  z: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface DeviceOrientationType {
  timestamp: number;
  time: number;
  alpha: number;
  beta: number;
  gamma: number;
}

type requestMethod = "head" | "get" | "post" | "put" | "patch" | "delete" | "options" | "upload" | "download";

declare const cordova: any;

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {

	private docEvtDevMotion:EventListenerOrEventListenerObject = null;
	private docEvtDevMotionAux:EventListenerOrEventListenerObject = null;
        private docEvtDevOrient:EventListenerOrEventListenerObject = null;
        private docEvtDevOrientAux:EventListenerOrEventListenerObject = null;
	private geoSubscription: Subscription;
	private ngUnsubscribe = new Subject();
	captureOn: boolean = false;
	acc: AccelerationType = {x:0, y:0, z:0};
	rot: RotationType = {alpha:0, beta:0, gamma:0};
	general: GeneralInfoType = {time:0, timestamp:0};
	geo: GeolocationType = {timestamp:0, latitude:0, longitude:0, accuracy:0};
	readFrequency: number;
	dateStart: Date;
	countMotionReading: number;
        countOrientationReading: number;
	countGPSReading: number;
	hasDeviceMotion: boolean = false;
	hasAccelerometer: boolean = false;
	hasGyroscope: boolean = false;
	hasGeolocation: boolean = false;
	deviceMotionList: DeviceMotionType[] = [];
	geolocationList: GeolocationType[] = [];
        deviceOrientationList: DeviceOrientationType[] = [];
	isIOS: boolean = false;
	isIOS13: boolean = false;
	isIOSMotion: boolean = false;
	dataUploadTimer: number = 0.0;

  constructor(
  	private zone: NgZone,
  	private geolocation: Geolocation,
  	private backgroundMode: BackgroundMode,
  	private nativeStorage: NativeStorage,
  	private platform: Platform,
  	private http: HttpClient,
  	private httpNative: HTTP,
  	private file: File,
  	private sessionData: SessionDataService,
  	private powerManagement: PowerManagement,
  	private localNotifications: LocalNotifications,
  	public popoverController: PopoverController
  	) {  	
    let self = this;
    this.docEvtDevMotion = (event: DeviceMotionEvent)=>{
        self.processEvent(event);
    }
    this.docEvtDevMotionAux = (event: DeviceMotionEvent)=>{
        self.checkDeviceMotion(event);
    }
    this.docEvtDevOrientAux = (event: DeviceOrientationEvent)=>{
        self.checkDeviceOrientation(event);
    }
    this.docEvtDevOrient = (event: DeviceOrientationEvent)=>{
        self.processOrientationEvent(event);
    }
    let _window: any = window;
    if(_window.DeviceMotionEvent) {
    	this.hasDeviceMotion = true;
    }
  }

  ngOnInit() {
       this.isIOSMotion = ((/iPad|iPhone|iPod/.test(navigator.userAgent)) && (typeof (DeviceMotionEvent as any).requestPermission === 'function'));
       if(this.isIOSMotion) {
       	 this.requestPermissionIOS();
       }
		this.platform.pause
		.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
		  this.zone.run(() => {
		    if(this.captureOn === true && this.isIOS === true) {
				this.stopCapture();
				// Schedule a single notification
				this.localNotifications.schedule({
					id: 1,
					title: 'The MusicLab app has stopped recording.',
					text: 'Please resume recording if you are still participating in the experiment.',
					foreground: true
				});
		    }
		  });
		});
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ionViewDidEnter() {
		if(this.hasDeviceMotion) {
			window.addEventListener("devicemotion", this.docEvtDevMotionAux, false);
		}
	  // get current position
	  this.geolocation.getCurrentPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: false }).then(pos => {
	    this.hasGeolocation = true;
	  }).catch((error) => {
	      this.hasGeolocation = false;
	  });;

	if (this.platform.is('ios')) {
		this.isIOS = true;
		this.localNotifications.hasPermission()
		  .then((hasPermission) => {
			if(!hasPermission) {
				this.localNotifications.requestPermission();
			}
		  });
	}
  }

  checkDeviceMotion(event: DeviceMotionEvent) {
		// console.log('checkDeviceMotion in');
		this.zone.run(() => {
			// console.log(JSON.stringify(event));
			// console.log(this.hasDeviceMotion);
		    if(event.accelerationIncludingGravity.x) {
			    this.hasAccelerometer = true;
		  	}
		  	if(event.rotationRate == null) {
		  	  this.isIOS13 = true;
		  	} else if (event.rotationRate.alpha) {
			    this.hasGyroscope = true;
		  	}
			if(this.hasDeviceMotion) {
				//console.log('removing motion listener');
				window.removeEventListener("devicemotion", this.docEvtDevMotionAux, false);
			}
		});
	}


  checkDeviceOrientation(event: DeviceOrientationEvent) {
		//console.log('checkDeviceOrientation in');
		this.zone.run(() => {
			//console.log(JSON.stringify(event));
			//console.log(this.hasDeviceMotion);
		  	if(event.alpha) {
			    this.hasGyroscope = true;
		  	}
			if(this.hasDeviceMotion) {
				//console.log('removing orientation listener');
				window.removeEventListener("deviceorientation", this.docEvtDevOrientAux, false);
			}
		});
	}

        processOrientationEvent(event: DeviceOrientationEvent) {
		this.zone.run(() => {

		   var currentTime: number = new Date().getTime();
		   this.countOrientationReading++;

	  	if(event && event.alpha) {
		    this.rot.alpha = parseFloat(event.alpha.toFixed(4));
		    this.rot.beta = parseFloat(event.beta.toFixed(4));
		    this.rot.gamma = parseFloat(event.gamma.toFixed(4));
	  	}

	  	this.deviceOrientationList.push({
	  			timestamp: currentTime,
	  		        time: event.timeStamp,
				alpha: event.alpha,
				beta: event.beta,
				gamma: event.gamma
	  		});

		});       
        }

	processEvent(event: DeviceMotionEvent) {
	  //console.log(event);
		this.zone.run(() => {

		var currentTime: number = new Date().getTime();
		var timeDiff: number = currentTime - this.dateStart.getTime();
		this.countMotionReading++;
	    this.readFrequency = parseFloat((1000 * this.countMotionReading / (timeDiff)).toFixed(4));

	    this.general.timestamp = parseFloat(event.timeStamp.toFixed(4));
		
		//Change sign to match between iOS and Android
		let factor = 1.0;
		if(this.isIOS){
			factor = -1.0;
		}

	    if(event.accelerationIncludingGravity.x) {
		    this.acc.x = factor * parseFloat(event.accelerationIncludingGravity.x.toFixed(4));
		    this.acc.y = factor * parseFloat(event.accelerationIncludingGravity.y.toFixed(4));
		    this.acc.z = factor * parseFloat(event.accelerationIncludingGravity.z.toFixed(4));
	  	}

		let alpha = 0;
        let beta = 0;
        let gamma = 0;

	  	if(event.rotationRate && event.rotationRate.alpha) {
		    this.rot.alpha = parseFloat(event.rotationRate.alpha.toFixed(4));
		    this.rot.beta = parseFloat(event.rotationRate.beta.toFixed(4));
		    this.rot.gamma = parseFloat(event.rotationRate.gamma.toFixed(4));
		    alpha = event.rotationRate.alpha;
		    beta = event.rotationRate.beta;
		    gamma = event.rotationRate.gamma;
	  	}

	  	this.deviceMotionList.push({
	  			timestamp: currentTime,
	  		    time: event.timeStamp,
				x: factor * event.accelerationIncludingGravity.x,
				y: factor * event.accelerationIncludingGravity.y,
				z: factor * event.accelerationIncludingGravity.z,
				alpha: alpha,
				beta: beta,
				gamma: gamma
	  	});

		let periodInMs = 10000
		if((currentTime - this.dataUploadTimer) >= periodInMs){
			//Upload data
			this.sendFileHttp(false);
			this.dataUploadTimer = currentTime;
			console.log('data');
		}


		});
	}


	startCapture(e: any) {
		if (this.platform.is('cordova')) {
			this.backgroundMode.setDefaults({
				title : 'MusicLab app is running', 
				text : 'Click here to turn it off',
			    icon: 'ic_launcher',
			    color: 'F14F4D', // hex format
			    resume: true,
			    hidden: false,
			    //bigText: true,
			    // To run in background without notification
			    silent: false
			});
			this.backgroundMode.enable();
		}
	    this.turnOnWakeLock();
	    this.captureOn = true;
		this.dateStart = new Date();
		this.dataUploadTimer = this.dateStart.getTime();
		this.countMotionReading = 0;
		this.countOrientationReading = 0;
		this.countGPSReading = 0;
		if(this.hasDeviceMotion) {
			window.addEventListener("devicemotion", this.docEvtDevMotion, false);
		}
		if(this.isIOS13) {
			window.addEventListener("deviceorientation", this.docEvtDevOrient, false);
		}
		let watch = this.geolocation.watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: false });
		this.geoSubscription = watch.subscribe((data: Position) => {
			 if(Object.prototype.toString.call(data) === "[object PositionError]") {  
			 	console.log(data); 
			 	return;
			 }
			 //console.log(data);
			 this.countGPSReading++;
			 this.geo.latitude = parseFloat(data.coords.latitude.toFixed(4));
			 this.geo.longitude = parseFloat(data.coords.longitude.toFixed(4));
			 this.geo.accuracy = data.coords.accuracy;
			 this.geo.timestamp = data.timestamp;
			 this.geolocationList.push({
				 timestamp: data.timestamp,
				 latitude: data.coords.latitude,
				 longitude: data.coords.longitude,
				 accuracy: data.coords.accuracy
			 });
		}, 
		(error: PositionError) => console.log(error));

	 }

	stopCapture() {
	  //window.removeEventListener("devicemotion",this.processEvent.bind(this), true);	
	  if(this.hasDeviceMotion) {
	    window.removeEventListener("devicemotion", this.docEvtDevMotion, false);
	  }
	  if(this.isIOS13) {
	    window.removeEventListener("deviceorientation", this.docEvtDevOrient, false);
	  }
	  this.geoSubscription.unsubscribe();
	  this.turnOffWakeLock();
	  this.captureOn = false;
	  if (this.platform.is('cordova')) {
		  this.backgroundMode.disable();
		}
	  this.sendFileHttp();
	}

	moveToBackground(e: any) {
		if (this.platform.is('cordova')) {
			this.backgroundMode.moveToBackground();
		}
	}

	getGeolocation(e: any) {
	  // get current position
	  this.geolocation.getCurrentPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: false }).then(pos => {
	    this.hasGeolocation = true;
	    alert("Geolocation is on!");
	    console.log('lat: ' + pos.coords.latitude + ', lon: ' + pos.coords.longitude);
	  }).catch((error) => {
	      this.hasGeolocation = false;
	      alert("Geolocation is off!");
	      console.log("getGeolocation: ",error);
	  });;
	}

	arrayToCSV(array) {
		const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
		const header = Object.keys(array[0]);
		let csv = array.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
		csv.unshift(header.join(','));
		let csvString = csv.join('\r\n');
		// console.log(csvString);
		return(csvString);
	}

	private async sendFileHttp(alertWhenSucess = true){
	   var zip = new JSZip();
	    zip.file(this.sessionData.uuid + '.deviceMotion.csv', this.arrayToCSV(this.deviceMotionList));
	    if(this.geolocationList.length > 0)
	    	zip.file(this.sessionData.uuid +  '.geoLocation.csv', this.arrayToCSV(this.geolocationList));
	    if(this.isIOS13 && this.deviceOrientationList.length > 0) {
                zip.file(this.sessionData.uuid +  '.deviceOrientation.csv', this.arrayToCSV(this.deviceOrientationList));
	     }

		var zipfile = await zip.generateAsync({ type: "blob" });

		const form = new cordova.plugin.http.ponyfills.FormData()
		form.append('answersAsMap[1996787].textAnswer', this.sessionData.uuid);
		form.append('answersAsMap[1996788].attachment.upload', zipfile, "data.zip");
		this.httpNative.setDataSerializer("multipart");
		var thisMethod: requestMethod = 'post';
		var options = { method: thisMethod, data: form };

		this.sessionData.httpRequest += new Date().toLocaleString() + "\n" + JSON.stringify(options) + "\n";

		this.httpNative.sendRequest('https://nettskjema.no/answer/deliver.json?formId=141510', options).then(
			(response) => {
					console.log(response.status);
					console.log(JSON.parse(response.data)); // JSON data returned by server
					console.log(response.headers);
					if(alertWhenSucess)
						alert("Data sent successfully!");
					this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response.status.toString() + "\n" + response.data  + "\n" ;
					this.deviceMotionList = [];
					this.geolocationList = [];
					this.deviceOrientationList = [];
			},
			(err) => {
					console.error(err.status);
					console.error(err.error); // Error message as string
					console.error(err.headers);
					alert("Error sending data!");
					this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + err.status + "\n" + err.error  + "\n" ;
				});

	}

  turnOnWakeLock() {
    this.powerManagement.dim().then(() => {
    	this.sessionData.wakeLock += new Date().toLocaleString() + ": Wakelock acquired\n";
    }).catch(() => {
    	this.sessionData.wakeLock += new Date().toLocaleString() + ": Failed to acquire wakelock\n";
    });
  }

  turnOffWakeLock() {
    this.powerManagement.release().then(() => {
    	this.sessionData.wakeLock += new Date().toLocaleString() + ": Wakelock released\n";
    }).catch(() => {
    	this.sessionData.wakeLock += new Date().toLocaleString() + ": Failed to release wakelock\n";
    });
  }

  // for requesting permission on iOS 13 devices
  requestPermissionIOS() {
    this.requestDeviceMotionIOS();
    this.requestDeviceOrientationIOS();
  }

  // requesting device orientation permission
  requestDeviceMotionIOS() {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: 'granted' | 'denied' | 'default') => {
          if (permissionState === 'granted') {
        	this.hasDeviceMotion = true;
			window.addEventListener("devicemotion", this.docEvtDevMotionAux, false);
			alert('Motion access granted');
          }
        })
        .catch(console.error);
    } else {
			//console.log('motion access not granted');
      // handle regular non iOS 13+ devices
    }
  }

  // requesting device orientation permission
  requestDeviceOrientationIOS() {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: 'granted' | 'denied' | 'default') => {
          if (permissionState === 'granted') {
    		this.hasDeviceMotion = true;
			window.addEventListener("deviceorientation", this.docEvtDevOrientAux, false);
			//console.log('orientation access granted');
          }
        })
        .catch(console.error);
    } else {
			//console.log('orientation access not granted');
      // handle regular non iOS 13+ devices
    }
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

}
