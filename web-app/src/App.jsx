import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import PostCreate from "./PostCreate";
import PostList from "./PostList";



const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-6 text-center">Create Post</h1>
        <PostCreate /> {/* No need to pass fetchPosts */}

        <hr className="border-gray-600 my-8" />

        <h1 className="text-3xl font-bold mb-4 text-center">List of Posts</h1>
        <PostList />
      </div>
    </div>
  );
};

export default App;
