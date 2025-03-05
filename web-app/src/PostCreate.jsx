import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const createPost = async (title) => {
  const response = await axios.post("http://localhost:4000/posts", { title });
  return response.data;
};

const PostForm = () => {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      setTitle(""); // Clear input field
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Refetch posts
    },
    onError: (error) => {
      console.error("Error creating post:", error);
    },
  });

  const onSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    mutation.mutate(title);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="text-2xl block text-gray-300 font-bold mb-1">Title</label>
          <input
            type="text"
            className="w-full border border-gray-700 bg-gray-900 px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            disabled={mutation.isPending} // Disable input while submitting
          />
        </div>
        <button
          type="submit"
          className="text-sm bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 disabled:bg-gray-500"
          disabled={mutation.isPending} // Disable button while submitting
        >
          {mutation.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default PostForm;
