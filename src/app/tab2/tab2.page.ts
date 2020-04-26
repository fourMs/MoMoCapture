import { Component } from '@angular/core';
import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { Platform } from '@ionic/angular';
import { UUID } from 'angular2-uuid';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { SessionDataService } from '../providers/sessionData.service';

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

type requestMethod = "head" | "get" | "post" | "put" | "patch" | "delete" | "options" | "upload" | "download";

declare const cordova: any;

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

	private docEvtDevMotion:EventListenerOrEventListenerObject = null;
	private docEvtDevMotionAux:EventListenerOrEventListenerObject = null;
	private geoSubscription: Subscription;
	captureOn: boolean = false;
	acc: AccelerationType = {x:0, y:0, z:0};
	rot: RotationType = {alpha:0, beta:0, gamma:0};
	general: GeneralInfoType = {time:0, timestamp:0};
	geo: GeolocationType = {timestamp:0, latitude:0, longitude:0, accuracy:0};
	readFrequency: number;
	dateStart: Date;
	countMotionReading: number;
	countGPSReading: number;
	hasDeviceMotion: boolean = false;
	hasAccelerometer: boolean = false;
	hasGyroscope: boolean = false;
	hasGeolocation: boolean = false;
	deviceMotionList: DeviceMotionType[] = [];
	geolocationList: GeolocationType[] = [];

  constructor(
  	private zone: NgZone,
  	private geolocation: Geolocation,
  	private backgroundMode: BackgroundMode,
  	private nativeStorage: NativeStorage,
  	private platform: Platform,
  	private http: HttpClient,
  	private httpNative: HTTP,
  	private file: File,
  	private sessionData: SessionDataService
  	) {  	
    let self = this;
    this.docEvtDevMotion = (event: DeviceMotionEvent)=>{
        self.processEvent(event);
    }
    this.docEvtDevMotionAux = (event: DeviceMotionEvent)=>{
        self.checkDeviceMotion(event);
    }
    let _window: any = window;
    if(_window.DeviceMotionEvent) {
    	this.hasDeviceMotion = true;
    }
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
  }

  checkDeviceMotion(event: DeviceMotionEvent) {
		this.zone.run(() => {
		    if(event.accelerationIncludingGravity.x) {
			    this.hasAccelerometer = true;
		  	}
		  	if(event.rotationRate.alpha) {
			    this.hasGyroscope = true;
		  	}
			if(this.hasDeviceMotion) {
				window.removeEventListener("devicemotion", this.docEvtDevMotionAux, false);
			}
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

	    if(event.accelerationIncludingGravity.x) {
		    this.acc.x = parseFloat(event.accelerationIncludingGravity.x.toFixed(4));
		    this.acc.y = parseFloat(event.accelerationIncludingGravity.y.toFixed(4));
		    this.acc.z = parseFloat(event.accelerationIncludingGravity.z.toFixed(4));
	  	}

	  	if(event.rotationRate.alpha) {
		    this.rot.alpha = parseFloat(event.rotationRate.alpha.toFixed(4));
		    this.rot.beta = parseFloat(event.rotationRate.beta.toFixed(4));
		    this.rot.gamma = parseFloat(event.rotationRate.gamma.toFixed(4));
	  	}

	  	this.deviceMotionList.push({
	  			timestamp: currentTime,
	  		    time: event.timeStamp,
				x: event.accelerationIncludingGravity.x,
				y: event.accelerationIncludingGravity.y,
				z: event.accelerationIncludingGravity.z,
				alpha: event.rotationRate.alpha,
				beta: event.rotationRate.beta,
				gamma: event.rotationRate.gamma
	  	});

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
	  this.captureOn = true;
		this.dateStart = new Date();
		this.countMotionReading = 0;
		this.countGPSReading = 0;
		if(this.hasDeviceMotion) {
			window.addEventListener("devicemotion", this.docEvtDevMotion, false);
		}
		let watch = this.geolocation.watchPosition({ maximumAge: 3000, timeout: 2000, enableHighAccuracy: false });
		this.geoSubscription = watch.subscribe((data: Position) => {
			 if(Object.prototype.toString.call(data) === "[object PositionError]") {  
			 	console.log("watch.subscribe: " + data); 
			 	return;
			 }
			 // console.log("watch.subscribe: " + data);
			 console.log("watch.subscribe: " + 'lat: ' + data.coords.latitude + ', lon: ' + data.coords.longitude);
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

	stopCapture(e: any) {
		//window.removeEventListener("devicemotion",this.processEvent.bind(this), true);	
		if(this.hasDeviceMotion) {
			window.removeEventListener("devicemotion", this.docEvtDevMotion, false);
		}
		this.geoSubscription.unsubscribe();
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
		//console.log(csvString);
		return(csvString);
	}

	private async sendFileHttp(){
	   var zip = new JSZip();
	    zip.file(this.sessionData.uuid + '.deviceMotion.csv', this.arrayToCSV(this.deviceMotionList));
	    if(this.geolocationList.length > 0)
	    	zip.file(this.sessionData.uuid + '.geoLocation.csv', this.arrayToCSV(this.geolocationList));

    var zipfile = await zip.generateAsync({ type: "blob" });


    const form = new cordova.plugin.http.ponyfills.FormData()
    form.append('answersAsMap[1996787].textAnswer', this.sessionData.uuid);
    form.append('answersAsMap[1996788].attachment.upload', zipfile, "data.zip");
    this.httpNative.setDataSerializer("multipart");
    var thisMethod: requestMethod = 'post';
    var options = { method: thisMethod, data: form };

    this.sessionData.httpRequest += new Date().toLocaleString() + "\n" + JSON.stringify(options) + "\n";

//    this.httpNative.sendRequest('https://nettskjema.no/answer/deliver.json?formId=141510', options).then(
//        (response) => {
//			    console.log(response.status);
//			    console.log(JSON.parse(response.data)); // JSON data returned by server
//			    console.log(response.headers);
//			    this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + response.status.toString() + "\n" + response.data  + "\n" ;
//        },
//        (err) => {
//			    console.error(err.status);
//			    console.error(err.error); // Error message as string
//			    console.error(err.headers);
//			    this.sessionData.httpResponse += new Date().toLocaleString() + "\n" + err.status + "\n" + err.error  + "\n" ;
//			});
//

	}

}
