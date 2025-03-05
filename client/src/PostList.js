import React from 'react';
import CommentCreate from './CommentCreate';
import CommentList from './CommentList';

export default ({ posts }) => {
  const renderedPosts = Object.values(posts).map((post) => (
    <div className="card" style={{ width: '30%', marginBottom: '20px' }} key={post.id}>
      <div className="card-body">
        <h3>{post.title}</h3>
        <CommentList comments={post.comments} />
        <CommentCreate postId={post.id} />
      </div>
    </div>
  ));

  return <div className="d-flex flex-row flex-wrap justify-content-between">{renderedPosts}</div>;
};
