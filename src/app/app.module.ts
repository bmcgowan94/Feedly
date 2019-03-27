import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { HttpClientModule } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';

import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { FeedPage } from '../pages/feed/feed';
import { CommentsPage } from '../pages/comments/comments';

import { Camera } from '@ionic-native/camera';
import { Firebase } from '@ionic-native/firebase';

import firebase from 'firebase';



// config used to link app to your firebase project
var config = {
  apiKey: "AIzaSyBx7yRBEGTKvtcnC064ZeYoj7BQtwvw6iQ",
  authDomain: "feedlyapp-4109f.firebaseapp.com",
  databaseURL: "https://feedlyapp-4109f.firebaseio.com",
  projectId: "feedlyapp-4109f",
  storageBucket: "feedlyapp-4109f.appspot.com",
  messagingSenderId: "119798842038"
};

firebase.initializeApp(config);

// this line helps firestore work correctly so timestamps can be used 
firebase.firestore().settings({ timestampsInSnapshots: true });

@NgModule({
  declarations: [
    MyApp,
    LoginPage, 
    SignupPage, 
    FeedPage, 
    CommentsPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage, 
    SignupPage, 
    FeedPage, 
    CommentsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Camera,
    HTTP,
    Firebase,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
