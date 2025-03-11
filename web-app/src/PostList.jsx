import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import CommentCreate from "./CommentCreate";
import CommentList from "./CommentList";

const fetchPosts = async () => {
  const { data } = await axios.get("http://localhost:4002/posts");
  return data;
};

const PostList = () => {
  const queryClient = useQueryClient(); // Get React Query instance

  const { data: posts, error, isLoading, isFetching } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    refetchInterval: 4000, // Refetch every 10 seconds

  });

  const addCommentToCache = (postId, newComment) => {
    queryClient.setQueryData(["posts"], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        [postId]: {
          ...oldData[postId],
          comments: [...(oldData[postId].comments || []), newComment], // Append new comment
        },
      };
    });
  };

  // if (isLoading) return <p className="text-center text-gray-400">Loading posts...</p>;
  // if (error) return <p className="text-center text-red-500">Error fetching posts!</p>;

  return (
    <div>
      {isFetching && posts?.length == 0 && <p className="text-center text-gray-400">Updating posts...</p>}
      <div className="flex flex-wrap gap-4 justify-between">
        {Object.values(posts).map((post) => (
          <div
            key={post.id}
            className="bg-gray-800 shadow-lg p-4 rounded-lg w-full sm:w-1/2 lg:w-full mb-4 hover:shadow-xl transition duration-200 text-white"
          >
            <h3 className="text-2xl font-semibold mb-2">{post.title}</h3>
            <CommentList comments={post.comments || []} />
            <CommentCreate postId={post.id} onCommentAdded={addCommentToCache} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostList;
