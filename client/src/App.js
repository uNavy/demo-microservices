import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCreate from './PostCreate';
import PostList from './PostList';

export default () => {
  const [posts, setPosts] = useState({});

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:4002/posts');
      setPosts(res.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    fetchPosts(); // Fetch once when the component mounts

    const interval = setInterval(() => {
      fetchPosts(); // Fetch posts every 5 seconds
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="container">
      <h1>Create Post</h1>
      <PostCreate fetchPosts={fetchPosts} /> {/* Pass fetchPosts as a prop */}
      <hr />
      <h1>Posts</h1>
      <PostList posts={posts} />
    </div>
  );
};
