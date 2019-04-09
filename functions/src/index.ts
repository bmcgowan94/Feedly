import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

const cors = require('cors')({
  origin: true
});


const sendNotification = (owner_uid, type) => 
{
  
  return new Promise((resolve, reject) => {
    return admin.firestore().collection("users").doc(owner_uid).get().then((doc) => {
      if(doc.exists && doc.data().token)
      {
        if(type == "new_comment")
        {
          admin.messaging().sendToDevice(doc.data().token, {
            data: {
              title: "A new comment has been made on your post!", 
              sound: "default", 
              body: "Tap here to check it out..."
            }
          }).then((sent) => {
            resolve(sent)
          }).catch((err) => {
            reject(err)
          })
        } else if(type == "new_like")
        {
          admin.messaging().sendToDevice(doc.data().token, {
            data: {
              title: "Someone liked your post!", 
              sound: "default", 
              body: "Tap to check..."
            }
          }).then((sent) => {
            resolve(sent)
          }).catch((err) => {
            reject(err)
          })
        }
      }
    })
  })


}


/* this cloud function is used to update the likes on a post
- it receives three parameters in the post body 
- and will update those respective fields in the post document (e.g number of likes)
- check out this link for work around for CORS error...
- https://ilikekillnerds.com/2017/05/enabling-cors-middleware-firebase-cloud-functions/
*/
exports.updateLikesCount = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
     
      console.log(req.body);
    
      const postId = JSON.parse(req.body).postId;
      const userId = JSON.parse(req.body).userId;
      const action = JSON.parse(req.body).action; // 'like' or 'unlike' 
    
      // from this data object we can get the value of all the fields in the document
      admin.firestore().collection("posts").doc(postId).get().then((data) => {
    
        // if likes counts = 0, then assume there are no likes 
        let likesCount = data.data().likesCount || 0;
        // likewise if there are no likes, then assign an empty array
        let likes = data.data().likes || [];
    
        let updateData = {};
    
        if(action == "like")
        {
          updateData["likesCount"] = ++likesCount;
          updateData[`likes.${userId}`] = true;
        } 
        else 
        {
          updateData["likesCount"] = --likesCount;
          updateData[`likes.${userId}`] = false;
        }
    
        admin.firestore().collection("posts").doc(postId).update(updateData).then(async () => {

          if(action == "like")
          {
            await sendNotification(data.data().owner, "new_like");
          }

          res.status(200).send("Done")
        }).catch((err) => {
          res.status(err.code).send(err.message);
        })
    
      }).catch((err) => {
        res.status(err.code).send(err.message);
      })
    
    })
  });



/* This second cloud function is used to update the comments count on a post
  - Rather than invoking a HTTP function like above, this time we invoke a firestore method
  - This will watch the document specified (comments in this case)
*/
export const updateCommentsCount = functions.firestore.document('comments/{commentId}').onCreate(async (event) => {
  let data = event.data();

  let postId = data.post;

  let doc = await admin.firestore().collection("posts").doc(postId).get();

  if(doc.exists)
  {
    let commentsCount = doc.data().commentsCount || 0;
    commentsCount++;

    await admin.firestore().collection("posts").doc(postId).update({
      "commentsCount": commentsCount
    })

    return await sendNotification(doc.data().owner, "new_comment");
  }
  else
  {
    return false;
  }
})