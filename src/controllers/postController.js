import {
  createPost,
  getPosts,
  createMetaData,
  getLastPost,
  getPostsById,
} from "../repositories/postRepository.js";
import { getExistingHashtags, insertHashtags, insertHashtagsLinksMiddleTable } from "../repositories/hashtagRepository.js";

export async function postLink(req, res) {
  const { link, postText } = req.body;
  const { user } = res.locals;
  const { regex } = res.locals;
  try {
    await createPost(link, postText, user.id);
    const { rows: lastPost } = await getLastPost(user.id);
    await createMetaData(lastPost);
    if(regex.length > 0) postHashtags(lastPost[0].id, res);
    else res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

async function postHashtags(postId, res){
  try{
    const {regex} = res.locals;
    for(let i = 0; i < regex.length; i++){
      if(i != regex.indexOf(regex[i])){
        regex.splice(i, 1)
        i--
      }
    }
    let str = "WHERE ";
    let firstTime = true;
    let arr= [];
    for(let i = 0 ; i < regex.length ; i++){
      if(firstTime){
        arr.push(regex[0]);
        str+=`name = $${arr.length}`
        firstTime = false
      }
      else{
        arr.push(regex[i])
        str+= ` OR name = $${arr.length}`
      }
    }
    const { rows: existingHashtags } = await getExistingHashtags(str, arr);
    const hashtagsToAdd = [...regex]
    for(let i = 0; i < existingHashtags.length; i++){
      hashtagsToAdd.splice(hashtagsToAdd.indexOf(existingHashtags[i].name), 1)
    }
    
    if(hashtagsToAdd.length > 0){
      str = "VALUES ";
      arr = [];
      for(let i = 0 ; i < hashtagsToAdd.length ; i++){
        arr.push(hashtagsToAdd[i]);
        if(i < hashtagsToAdd.length - 1){
          str+=`($${arr.length}), `
        }
        else{
          str+= `($${arr.length})`
        }
      }
      const { rows: newHashtags } = await insertHashtags(str, arr)
      const allHashtags = [...existingHashtags, ...newHashtags]
      postHashtagsLinks(postId, allHashtags, res)
    }else{
      postHashtagsLinks(postId, existingHashtags, res)
    }
  }catch(error){
      console.log(error);
      res.sendStatus(500);
  }
}

async function postHashtagsLinks(postId, hashtags, res){
  try{
    let str = "VALUES ";
    const arr = [];
    for(let i = 0; i < hashtags.length; i++){
      arr.push(hashtags[i].id);
      if(i < hashtags.length - 1){
        str+=`($${arr.length}, `;
        arr.push(postId);
        str+=`$${arr.length}), `;
      }
      else{
        str+= `($${arr.length}, `
        arr.push(postId);
        str+=`$${arr.length})`;
      }
    }
    console.log(str)
    console.log(arr)
    await insertHashtagsLinksMiddleTable(str, arr)
    res.sendStatus(201)
  }catch(error){
    console.log(error);
    res.sendStatus(500);
  }
}

export async function posts(req, res) {
  try {
    const result = await getPosts();

    res.send(
      result.rows.map((row) => {
        
        const [
          id,
          link,
          postText,
          userId,
          metaId,
          postId,
          url,
          title,
          description,
          image,
          userName,
          userImage
        ] = row;

        return {
          id,
          link,
          postText,
          userId,
          metadata: { url, title, description, image },
          userName,
          userImage
        };
      })
    );
  } catch (error) {
    console.log(error);
  }
}

export async function postsById(req, res) {
  const {id} = req.params
  try {
    const result = await getPostsById(id);

    res.send(
      result.rows.map((row) => {
        
        const [
          id,
          link,
          postText,
          userId,
          metaId,
          postId,
          url,
          title,
          description,
          image,
          userName,
          userImage
        ] = row;

        return {
          id,
          link,
          postText,
          userId,
          metadata: { url, title, description, image },
          userName,
          userImage
        };
      })
    );
  } catch (error) {
    console.log(error);
  }
}