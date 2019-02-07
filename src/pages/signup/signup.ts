import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import firebase from 'firebase';
import { FeedPage } from '../feed/feed';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage {

  name: string = "";
  email: string = "";
  password: string = "";

  constructor(public navCtrl: NavController, public navParams: NavParams, public toastCtrl: ToastController, public alertCtrl: AlertController) {
  }

  // This function creates the user on firebase 
  // A promise is then being executed on this function, indicated by the '.then' part
  // This is because the createUser function is a network function and might take some time
  signup()
  {
    firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then(
      (data) => 
      {
        console.log(data);

        // extract the data into newUser
        let newUser: firebase.User = data.user;

        // set the users displayname also
        newUser.updateProfile({
          displayName: this.name, 
          photoURL: ""
        }).then(() => 
        {
          console.log("Profile Updated!")

          this.alertCtrl.create({
            title: "Account Created", 
            message: "Your account has been created successfully", 
            buttons: 
            [
              {
                text: "OK", 
                handler: () => 
                {
                  // Navigate to the feeds page 
                  this.navCtrl.setRoot(FeedPage)
                }
              }
            ]
          }).present();

        }).catch((err) => 
        {
          console.log(err);
        })
        
      }).catch((err) => 
      {
        console.log(err);

        this.toastCtrl.create({
          message: err.message, 
          duration: 3000
        }).present();
      })
  }


  goBack()
  {
    this.navCtrl.pop();
  }

}
