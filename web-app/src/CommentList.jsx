import React from "react";

export default ({ comments }) => {
  const renderedComments = comments?.map((comment) => {
    let content;
    let textStyle = "text-white"; // Default text color

    if (comment.status === "approved") {
      content = comment.content;
      // textStyle="text-white";
    } else if (comment.status === "pending") {
      content = "This comment is awaiting moderation";
      textStyle = "text-white italic";
    } else if (comment.status === "rejected") {
      content = "This comment has been rejected";
      textStyle = "text-red-500 font-medium";
    }

    return (
      <li key={comment.id} className={`mb-2 ${textStyle} text-sm`}>
        {content}
      </li>
    );
  });

  return (
    <div>
      <h4 className="text-lg font-semibold mb-2">{comments?.length>0 && "Comments"}</h4>
      <ul className="list-disc pl-5">{renderedComments}</ul>
    </div>
  );
};
