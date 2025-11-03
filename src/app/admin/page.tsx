import { db } from "~/server/db";
import { posts, profiles, events, flags } from "~/server/db/schema";
import { sql } from "drizzle-orm";

import Post from "~/components/Post";

export default async function AdminPage() {
  const results = await db
    .select({
      post: posts,
      author: profiles,
      event: events,
      flagCount: sql`(SELECT COUNT(*) FROM ${flags} WHERE ${flags.postId} = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(profiles, sql`${posts.authorId} = ${profiles.id}`)
    .leftJoin(events, sql`${posts.eventId} = ${events.id}`)
    .where(
      sql`EXISTS (SELECT 1 FROM ${flags} WHERE ${flags.postId} = ${posts.id})`,
    )
    .orderBy(
      sql`(SELECT COUNT(*) FROM ${flags} WHERE ${flags.postId} = ${posts.id}) DESC`,
    );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
      {results.length === 0 ? (
        <p className="max-w-prose text-center text-sm text-gray-600">
          There aren’t any flagged posts yet.
        </p>
      ) : (
        results.map(({ post, author, event, flagCount }) => (
          <Post
            key={post.id}
            post={{
              id: post.id,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              content: post.content,
              authorId: post.authorId,
              eventId: post.eventId,
              score: post.score ?? 0,
              commentCount: post.commentCount ?? 0,
              flagCount: Number(flagCount) ?? 0,
            }}
            profile={author!}
            event={event!}
            vote={null}
            session={null}
          />
        ))
      )}
    </div>
  );
}
