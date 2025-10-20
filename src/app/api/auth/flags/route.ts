import { db } from "~/server/db";
import { posts, flags } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";


// Insert New Flag
export async function POST(request: Request) {
  try {
    const { userId, postId } = await request.json();

    if (!userId || !postId) {
      return new Response("Missing userId or postId", { status: 400 });
    }

    // Check if flag already exists
    const existingFlag = await db
      .select()
      .from(flags)
      .where(and(eq(flags.userId, userId), eq(flags.postId, postId)));

    if (existingFlag.length > 0) {
      return new Response("Flag already exists", { status: 200 });
    }

    // Insert new flag + increment flagCount
    await db.transaction(async (tx) => {
      await tx.insert(flags).values({ userId, postId });

      await tx
        .update(posts)
        .set({
          flagCount: sql`${posts.flagCount} + 1`,
        })
        .where(eq(posts.id, postId));
    });

    return new Response("Flag created", { status: 201 });
  } catch (error: any) {
    // Detect duplicate key errors specifically
    if (error.code === "ER_DUP_ENTRY") {
      return new Response("Flag already exists", { status: 200 });
    }

    console.error("Error creating flag:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Delete Existing Flag
export async function DELETE(request: Request) {
  try {
    const { userId, postId } = await request.json();
    
    if (!userId || !postId) {
      return new Response("Missing userId or postId", { status: 400 });
    }
    
    // Delete the flag
    const existingFlag = await db
      .select()
      .from(flags)
      .where(and(eq(flags.userId, userId), eq(flags.postId, postId)));

    if (existingFlag.length === 0) {
      return new Response("Flag not found", { status: 404 });       
    }

    // Delete the flag
    await db.transaction(async (tx) => {
      await tx
        .delete(flags)
        .where(and(eq(flags.userId, userId), eq(flags.postId, postId)));

      await tx
        .update(posts)
        .set({
          flagCount: sql`${posts.flagCount} - 1`,
        })
        .where(eq(posts.id, postId));
    });

    return new Response("Flag deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting flag:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}