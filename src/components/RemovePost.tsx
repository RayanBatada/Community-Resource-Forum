"use client";

import { useState } from "react";

{
  /* rest of the code should have a remove post logic where the post is removed if readonly is true and the button is clicked */
}
{
  /* if the button is clicked, then it should called the remove post api to remove the post */
}

interface RemovePostProps {
  postId: string;
  userId: string;
}

export default function RemovePost({ postId, userId }: RemovePostProps) {
  const [removed, setRemoved] = useState(false);

  const handleRemove = async () => {
    if (removed) return;

    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userId}`,
      },
    });

    if (res.ok) {
      setRemoved(true);
    }
  };

  return (
    <button onClick={handleRemove} disabled={removed}>
      {removed ? "Post Removed" : "Remove Post"}
    </button>
  );
}
