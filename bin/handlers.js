'use strict';
import { getURLParam } from './frontendHelpers.js';

const commentControlButtons = Array.from(
  document.getElementsByClassName('comments__showBtn')
);
const postDeleteButtons = Array.from(
  document.getElementsByClassName('postDelete__btn')
);
const submitCommentBtn = Array.from(
  document.getElementsByClassName('submitCommentBtn')
);

const commentForm = Array.from(
  document.getElementsByClassName('comment__form')
)
 


const toggleActiveEl = (el, className) => {
  if (el.classList.contains(`${className}--disable`)) {
    el.classList.remove(`${className}--disable`);
    el.classList.add(`${className}--active`);
  } else {
    el.classList.add(`${className}--disable`);
    el.classList.remove(`${className}--active`);
  }
};



commentControlButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    let commentsBlock = Array.from(
      btn.closest('.post').getElementsByClassName('post__comments')
    )[0];
    toggleActiveEl(commentsBlock, 'post__comments');
  });
});



let posts = Array.from(document.querySelectorAll('.post'));
let postsObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let postId = entry.target.id.replace('post', '');
        renderPostComments(postId);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

posts.forEach((p) => {
  postsObserver.observe(p);
});

const renderPostComments = (postId) => {
  let commentsBlock = Array.from(
    document.getElementById(`post${postId}`)
            .getElementsByClassName('post__comments')
  )[0];
  let postControlsBlock = Array.from(document.getElementById(`post${postId}`).getElementsByClassName('post__controls'))[0];
  let commentsCountNode = document.createElement('span');
  commentsCountNode.classList.add('comments__count')
  postControlsBlock.appendChild(commentsCountNode);
  let commentsCountCreatedNode = Array.from(document.getElementById(`post${postId}`).getElementsByClassName('comments__count'))[0];
  fetch(`/profile/comment?postId=${postId}`)
    .then(response => response.json()) 
    .then( data => {
      const currentPageUserId = getURLParam('id');
      const isOwnerPage = currentPageUserId === data.id;
      
      data.comments.forEach((comment) => {
        if(data.length !== 0) { commentsCountCreatedNode.innerHTML = `(${data.comments.length})` }
        let commentContainer = document.createElement('div');
        commentContainer.classList.add('comment');
        commentContainer.id = `comment${comment.ID}`;
        commentContainer.innerHTML = `<div class="comment__main">
                                        <h5 class="comment__owner full__name">
                                          ${comment.First_Name + ' ' +comment.Last_Name}</h5>
                                        <p class="comment__text" >
                                          ${comment.CommentText}
                                        </p>
                                        <div class="comment__createDate">
                                          ${comment.Create_Date}
                                        </div>
                                      </div>
                                      ${isOwnerPage ? 
                                       ` <div class="header__control">
                                          <svg class="commentDelete__btn" width='35px' height='35px' viewBox="-500 0 1500 1500" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 281.296l0 -68.355q1.953 -37.107 29.295 -62.496t64.449 -25.389l93.744 0l0 -31.248q0 -39.06 27.342 -66.402t66.402 -27.342l312.48 0q39.06 0 66.402 27.342t27.342 66.402l0 31.248l93.744 0q37.107 0 64.449 25.389t29.295 62.496l0 68.355q0 25.389 -18.553 43.943t-43.943 18.553l0 531.216q0 52.731 -36.13 88.862t-88.862 36.13l-499.968 0q-52.731 0 -88.862 -36.13t-36.13 -88.862l0 -531.216q-25.389 0 -43.943 -18.553t-18.553 -43.943zm62.496 0l749.952 0l0 -62.496q0 -13.671 -8.789 -22.46t-22.46 -8.789l-687.456 0q-13.671 0 -22.46 8.789t-8.789 22.46l0 62.496zm62.496 593.712q0 25.389 18.553 43.943t43.943 18.553l499.968 0q25.389 0 43.943 -18.553t18.553 -43.943l0 -531.216l-624.96 0l0 531.216zm62.496 -31.248l0 -406.224q0 -13.671 8.789 -22.46t22.46 -8.789l62.496 0q13.671 0 22.46 8.789t8.789 22.46l0 406.224q0 13.671 -8.789 22.46t-22.46 8.789l-62.496 0q-13.671 0 -22.46 -8.789t-8.789 -22.46zm31.248 0l62.496 0l0 -406.224l-62.496 0l0 406.224zm31.248 -718.704l374.976 0l0 -31.248q0 -13.671 -8.789 -22.46t-22.46 -8.789l-312.48 0q-13.671 0 -22.46 8.789t-8.789 22.46l0 31.248zm124.992 718.704l0 -406.224q0 -13.671 8.789 -22.46t22.46 -8.789l62.496 0q13.671 0 22.46 8.789t8.789 22.46l0 406.224q0 13.671 -8.789 22.46t-22.46 8.789l-62.496 0q-13.671 0 -22.46 -8.789t-8.789 -22.46zm31.248 0l62.496 0l0 -406.224l-62.496 0l0 406.224zm156.24 0l0 -406.224q0 -13.671 8.789 -22.46t22.46 -8.789l62.496 0q13.671 0 22.46 8.789t8.789 22.46l0 406.224q0 13.671 -8.789 22.46t-22.46 8.789l-62.496 0q-13.671 0 -22.46 -8.789t-8.789 -22.46zm31.248 0l62.496 0l0 -406.224l-62.496 0l0 406.224z"/>
                                          </svg>
                                        </div>` :` <div></div>` }`;
        commentsBlock.appendChild(commentContainer);
        
        if(isOwnerPage) {
          removeCommentListener(
            document.querySelectorAll('.commentDelete__btn:last-child'),
            isOwnerPage
          );
        } else {
          const createdDateNodes = document.querySelectorAll('.comment__createDate:last-child');
          const createdDateNode = Array.from(createdDateNodes)[createdDateNodes.length - 1];

          countCommentsListener(
            createdDateNode,
          )
        }
      });
    });
};
postDeleteButtons.forEach( (el) => {
  el.addEventListener('click', (e) => {
    let postId = el.closest('.post').id;
    let postDbId = postId.replace('post', '')
    let postNode = document.getElementById(postId);
    fetch(`/profile/post/${postDbId}`, {
      method: 'DELETE'
    })
    .then(res => {
      el.closest('.posts__field').removeChild(postNode);

    })
  });
});

let removeCommentListener = (button, isOwnerPage) => {
  let commentDeleteBtn = Array.from(button);
  let commentId = commentDeleteBtn[commentDeleteBtn.length - 1].closest('.comment').id;
  const commentDbId = commentId.replace('comment', '')
  let commentNode = document.getElementById(commentId);
  
  commentDeleteBtn[commentDeleteBtn.length - 1].addEventListener('click', e => {
    fetch(`/profile/comment/${commentDbId}`, {
      method: 'DELETE'
    })
    .then(res => {
      if(isOwnerPage) {
        countCommentsListener(commentNode)
      }
      commentDeleteBtn[commentDeleteBtn.length - 1]
      .closest('.post__comments')
      .removeChild(commentNode);
    })
    }
  );
};

const countCommentsListener = (node) => {
    const commentCountNode = Array.from(node.closest('.post').getElementsByClassName('comments__count'))[0];
    // if comments more than 0
    const commentCountNodeValue = parseInt(commentCountNode.innerText[1]);
    if ( commentCountNodeValue !== 1 ) { 
      commentCountNode.innerHTML = `(${commentCountNodeValue - 1})`
    } else {
      commentCountNode.innerHTML = ''
    }
}


