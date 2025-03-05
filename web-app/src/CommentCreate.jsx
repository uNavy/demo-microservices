import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import SentIcon from "../public/icons/sentIcon";

const CommentCreate = ({ postId, onCommentAdded }) => {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient(); // Access React Query's cache

  const mutation = useMutation({
    mutationFn: async (newComment) => {
      return axios.post(`http://localhost:4001/posts/${postId}/comments`, newComment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]); // Refetch posts to update comments
      onCommentAdded;
      setContent(""); // Clear input field
    },
    onError: (error) => {
      console.error("Error posting comment:", error);
    },
  });

  const onSubmit = (event) => {
    event.preventDefault();
    if (content.trim() === "") return; // Prevent empty submissions

    mutation.mutate({ content }); // Trigger mutation
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <input
            type="text"
            className="w-full border border-gray-600 bg-gray-800 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 placeholder:text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
          />
        </div>
        <button
          type="submit"
          className="text-sm bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 flex items-center space-x-2"
          disabled={mutation.isLoading} // Disable while posting
        >
          <span>{mutation.isLoading ? "Sending..." : "Send"}</span>
          <SentIcon />
        </button>
      </form>
    </div>
  );
};

export default CommentCreate;
