import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import firebase from 'firebase';
import moment from 'moment';


@Component({
  selector: 'page-comments',
  templateUrl: 'comments.html',
})
export class CommentsPage 
{
  post: any = {};
  comments: any[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private viewCtrl: ViewController) 
  {
    // receive the post object from the feed page's navParams
    this.post = this.navParams.get("post");
    console.log(this.post);

    // query our comments collection for the post that is equal to our postId
    firebase.firestore().collection("comments").where("post", "==", this.post.id)
    // order the results in ascending order
    .orderBy("created", "asc").get().then((data) => {
      
      // collect all the comments from the data object
      this.comments = data.docs;

    }).catch((err) => {
      console.log(err);
    })
  }

  // close the modal 
  close()
  {
    this.viewCtrl.dismiss();
  }

  // used to calculate how long ago comments were made
  ago(time)
  {
    let difference = moment(time).diff(moment());
    // convert this into a human readable format
    return moment.duration(difference).humanize();
  }


}
