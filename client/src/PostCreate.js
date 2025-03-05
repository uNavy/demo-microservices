import React, { useState } from 'react';
import axios from 'axios';

export default ({ fetchPosts }) => {
  const [title, setTitle] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:4000/posts', { title }); // Wait for the response

      if (response.status === 201) { // Only fetch posts if the request was successful
        setTitle(''); // Clear input field
        await fetchPosts(); // Fetch latest posts
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <button className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
};
