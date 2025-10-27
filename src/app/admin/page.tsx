import { db } from "~/server/db"; 
import { posts, profiles, events, likes, flags } from "~/server/db/schema"; 
import { sql } from "drizzle-orm"; 

import Post from "~/components/Post"; 

export default async function AdminPage() {
    const results = await db.query.posts.findMany({
        with: {
            author: true, 
            event: true, 
            flags: true,
            votes: true,
        }, 
        where: sql`EXISTS (SELECT 1 FROM ${flags} WHERE ${flags.postId} = ${posts.id})`, 
        orderBy: sql`(SELECT COUNT(*) FROM ${flags} WHERE ${flags.postId} = ${posts.id}) DESC`,
    }); 

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
            {results.map(({ id, createdAt, updatedAt, content, authorId, eventId, likeCount, event, votes, flags, author }) => (
                <Post key={id} post={{ id, createdAt, updatedAt, content, authorId, eventId, score: votes ? votes.length : 0, commentCount: 0, flagCount: flags ? flags.length : 0,}} profile={author} event={event!} vote={null} session={null}/>   
            ))}
        </div>
    ); 
}
