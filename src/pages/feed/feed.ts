import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController, ActionSheetController, AlertController, ModalController } from 'ionic-angular';
import firebase from 'firebase';
import moment from 'moment';
import { LoginPage } from '../login/login';
import { Camera, CameraOptions } from '@ionic-native/camera';

import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';

import { CommentsPage } from '../comments/comments';
import { Firebase } from '@ionic-native/firebase/ngx';

@Component({
  selector: 'page-feed',
  templateUrl: 'feed.html',
})

export class FeedPage 
{

  text: string = "";
  posts: any[] = [];
  // this variable dictates how many posts are loaded initially
  pageSize: number = 10;
  cursor: any;
  infiniteEvent: any;
  image: string;


  constructor(public navCtrl: NavController, 
              public navParams: NavParams, 
              private loadingCtrl: LoadingController, 
              private toastCtrl: ToastController, 
              private camera: Camera, 
              private http: HttpClient, 
              //private http: HTTP,
              private actionSheetCtrl: ActionSheetController, 
              private alertCtrl: AlertController, 
              private modalCtrl: ModalController, 
              private firebaseCordova: Firebase) 
  {
    // get all posts as soon as page loads
    this.getPosts();

    // get the users token to send push notifications
    this.firebaseCordova.getToken().then((token) => {
      console.log(token)

      this.updateToken(token, firebase.auth().currentUser.uid);

    }).catch((err) => {
      console.log(err);
    })
  }

  // This function saves the users token into firebase 
  updateToken(token: string, uid: string)
  {
    firebase.firestore().collection("users").doc(uid).set({
      token: token, 
      tokenUpdate: firebase.firestore.FieldValue.serverTimestamp()
    }, {
      // 'merge' ensures anything in the users document doesnt get overwritten, just merged
      merge: true
    }).then(() => {
      console.log("Token saved to cloud firestore!");
    }).catch((err) => {
      console.log(err);
    })

  }


  // This function is used to grab all posts to be displayed from firestore 
  getPosts()
  {
    this.posts = []

    let loading = this.loadingCtrl.create({
      content: "Loading Feed..."
    });

    loading.present();
    
    // query firestore for posts 
    let query = firebase.firestore().collection("posts").orderBy("created", "desc").limit(this.pageSize)
   
    // anytime there is a change to the result set of the query
     query.onSnapshot((snapshot) => 
    {
      let changedDocs = snapshot.docChanges();

      changedDocs.forEach((change) =>
      {
        // 3 different types of changes that can occur (added, modified, removed)
        if(change.type == "added")
        {
          console.log("Document with the id " + change.doc.id + " has been added!")
        }
        if(change.type == "modified")
        {
          // loop over all posts to see which one has been modified (liked/unliked)
          for(let i = 0; i < this.posts.length; i++)
          {
            if(this.posts[i].id == change.doc.id)
            {
              this.posts[i] = change.doc;
            }
          }
        }
        if(change.type == "removed")
        {
          console.log("Document with the id " + change.doc.id + " has been removed!")
        }
      })
    })  

    query.get()
    .then((docs) => 
    {
      // loop over all the docs (posts)
      docs.forEach((doc) => {
        // and save into our posts array
        this.posts.push(doc);
      })

      loading.dismiss();

      this.cursor = this.posts[this.posts.length - 1];

      console.log(this.posts)

    }).catch((err) => {
      console.log(err);
    })
  }


  loadMorePosts(event)
  {
    // load all posts AFTER those that have already been loaded
    firebase.firestore().collection("posts").orderBy("created", "desc").startAfter(this.cursor).limit(this.pageSize).get()
    .then((docs) => {

      // loop over all the docs (posts)
      docs.forEach((doc) => {
        // and save into our posts array
        this.posts.push(doc);
      })

      console.log(this.posts)

      if(docs.size < this.pageSize)
      {
        // if all docs have been loaded
        event.enable(false);
        this.infiniteEvent = event;
      } 
      else 
      {
        event.complete();
        this.cursor = this.posts[this.posts.length - 1];
      }

    }).catch((err) => {
      console.log(err);
    })
  }


  refresh(event)
  {
    this.posts = [];

    this.getPosts();

    if(this.infiniteEvent)
    {
      this.infiniteEvent.enable(true);
    }
    
    event.complete();
  }


  // This function gathers all the necessary information from a post and saves it to Firebase
  post() 
  {
    // Collections are just containers for similar documents, similar to rows in a RDBS
    firebase.firestore().collection("posts").add({
      text: this.text, 
      created: firebase.firestore.FieldValue.serverTimestamp(), 
      owner: firebase.auth().currentUser.uid, 
      owner_name: firebase.auth().currentUser.displayName
    }).then(async (doc) => 
    {
      console.log(doc)

      // if there is an image, wait for it to be uploaded
      if(this.image)
      {
        await this.upload(doc.id)
      }

      // cleaer text input and image preview
      this.text = "";
      this.image = undefined;

      // display toast message
      let toast = this.toastCtrl.create({
        message: "Your post has been created successfully!", 
        duration: 3000
      }).present();
      
      this.getPosts();
      
    }).catch((err) => 
    {
      console.log(err)
    })
  }


  // used to calculate how long ago posts were made
  ago(time)
  {
    let difference = moment(time).diff(moment());
    // convert this into a human readable format
    return moment.duration(difference).humanize();
  }


  logout()
  {
    firebase.auth().signOut().then(() => {
        let toast = this.toastCtrl.create({
          message: "You have been logged out successfully!", 
          duration: 3000
        }).present();

        this.navCtrl.setRoot(LoginPage);
    });
  }


  addPhoto()
  {
    this.launchCamera();
  }


  launchCamera()
  {
    let options: CameraOptions = 
    {
      quality: 100, 
      sourceType: this.camera.PictureSourceType.CAMERA, 
      destinationType: this.camera.DestinationType.DATA_URL, 
      encodingType: this.camera.EncodingType.PNG, 
      mediaType: this.camera.MediaType.PICTURE, 
      correctOrientation: true, 
      targetHeight: 512, 
      targetWidth: 512, 
      allowEdit: true
    }

    this.camera.getPicture(options).then((base64Image) => {
      console.log(base64Image);

      // assign base64 string to image var.. include the string before it so that it can understand it as an image
      this.image = "data:image/png;base64," + base64Image;

    }).catch((err) => {
      console.log(err)
    })
  }


  upload(name: string)
  {
    return new Promise((resolve, reject) => {

      let loading = this.loadingCtrl.create({
        content: "Uploading Image..."
      })

      loading.present();

      let ref = firebase.storage().ref("postImages/" + name);

      // split function used to take out the string of text at start of this.image
      let uploadTask = ref.putString(this.image.split(',')[1], "base64");

      uploadTask.on("state_changed", (taskSnapshot: any) => {
        console.log(taskSnapshot)

        let percentage = taskSnapshot.bytesTransferred / taskSnapshot.totalBytes * 100;

        loading.setContent("Uploaded " + percentage + "%...");

      }, (error) => {
        console.log(error)
      }, () => {
        console.log("The upload has completed!");

        uploadTask.snapshot.ref.getDownloadURL().then((url) => {
          
          // Upload the image id to database to be stored along with the post document
          firebase.firestore().collection("posts").doc(name).update({
            image: url
          }).then(() => {
            // if the resolve function gets called here then it means everything in this code block has worked successfully
            loading.dismiss()
            resolve()
          }).catch((err) => {
            // or if it hits this, then something has went wrong
            loading.dismiss()
            reject()
          })

        }).catch((err) => {
          loading.dismiss()
          reject()
        })
      })

    })

  }


  // This function deals with liking or unliking a post
  like(post)
  {
    // Remember, as we are firing a cloud function we need a JSON object to send to it
    // This object creates that JSON object to be sent to the cloud function for evaluation
    let body = 
    {
      postId: post.id, 
      userId: firebase.auth().currentUser.uid, 
      // does the post contain any likes, if so has the current user liked it already, if so then assign to unlike
      action: post.data().likes && post.data().likes[firebase.auth().currentUser.uid] == true ? "unlike" : "like" 
    }

    let toast = this.toastCtrl.create({
      message: "Updating like... please wait"
    });
    
    toast.present();

    // calling our cloud function, and passing in the object of data
    this.http.post("https://us-central1-feedlyapp-4109f.cloudfunctions.net/updateLikesCount", JSON.stringify(body), {
      responseType: "text"
    }).subscribe((data) => {
      console.log(data)

      toast.setMessage("Like updated!");
      
      setTimeout(() => {
        toast.dismiss();
      }, 3000)

    }, (error) => {

      toast.setMessage("An error has occurred. Please try again later.")
      setTimeout(() => {
        toast.dismiss();
      }, 3000)

      console.log(error)
    })

  }


  // This function deals with adding or removing comments from posts 
  comment(post)
  {
    // firstly, let the user decide if they wish to view the comments, or make their own
    this.actionSheetCtrl.create({
      buttons: 
      [
        {
          text: "View All Comments",
          handler: () => 
          {
            // open a modal to display the comments page
            this.modalCtrl.create(CommentsPage, {
              // pass the post object to the comments page
              "post": post
            }).present();
          }
        }, 
        {
          text: "Add New Comment", 
          handler: () => 
          {
            this.alertCtrl.create({
              title: "New Comment", 
              message: "Type your comment...", 
              inputs: 
              [
                {
                  name: "comment", 
                  type: "text"
                }
              ], 
              buttons:
              [
                {
                  text: "Cancel"
                }, 
                {
                  text: "Post", 
                  handler: (data) => 
                  {
                    // Save the comment in the database 
                    if(data.comment)
                    {
                      firebase.firestore().collection("comments").add({
                        text: data.comment, 
                        post: post.id, 
                        owner: firebase.auth().currentUser.uid, 
                        owner_name: firebase.auth().currentUser.displayName, 
                        created: firebase.firestore.FieldValue.serverTimestamp()
                      }).then((doc) => {
                        // if successful, show a toast message
                        this.toastCtrl.create({
                          message: "Comment posted successfully!", 
                          duration: 3000
                        }).present();
                      }).catch((err) => {
                        // if unsuccessful, let the user know
                        this.toastCtrl.create({
                          message: err.message, 
                          duration: 3000
                        }).present();
                      })
                    }
                  }
                }
              ]
            // remember to present the alert ctrl (similar to toast controller)
            }).present();
          }
        }
      ]
    // and the action sheet controller also
    }).present();
  }


}
