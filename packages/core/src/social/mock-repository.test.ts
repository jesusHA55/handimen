import { describe, expect, it } from "vitest";

import { MockSocialRepository } from "./mock-repository";

const AUTHOR = "profile_marta";
const OTHER = "profile_jordi";

function repo() {
  return new MockSocialRepository();
}

describe("MockSocialRepository (reference implementation)", () => {
  it("lists the seeded board newest first", async () => {
    const feed = await repo().listFeed();
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0]!.createdAt >= feed[feed.length - 1]!.createdAt).toBe(true);
  });

  it("creates a post and puts it on the board", async () => {
    const social = repo();
    const created = await social.createPost({
      authorId: AUTHOR,
      body: "  ¿Alguien tiene una carretilla?  ",
      visibility: "city",
    });

    expect(created.body).toBe("¿Alguien tiene una carretilla?");
    expect(created.reactionCount).toBe(0);

    const feed = await social.listFeed();
    expect(feed[0]?.id).toBe(created.id);
  });

  it("refuses an empty post", async () => {
    await expect(
      repo().createPost({ authorId: AUTHOR, body: "   ", visibility: "city" }),
    ).rejects.toThrow(/empty/i);
  });

  it("only lets the author delete a post", async () => {
    const social = repo();
    const created = await social.createPost({
      authorId: AUTHOR,
      body: "Presto mi proyector",
      visibility: "city",
    });

    await expect(social.deletePost(created.id, OTHER)).rejects.toThrow(/author/i);
    await social.deletePost(created.id, AUTHOR);
    expect(await social.getPost(created.id)).toBeNull();
  });

  it("adds comments and reflects them in the post count", async () => {
    const social = repo();
    const created = await social.createPost({
      authorId: AUTHOR,
      body: "¿Nivel láser?",
      visibility: "city",
    });

    await social.addComment({ postId: created.id, authorId: OTHER, body: "Yo lo tengo" });
    await social.addComment({ postId: created.id, authorId: AUTHOR, body: "¡Genial!" });

    const comments = await social.listComments(created.id);
    expect(comments).toHaveLength(2);
    expect((await social.getPost(created.id))?.commentCount).toBe(2);
  });

  it("only lets the author delete a comment", async () => {
    const social = repo();
    const post = await social.createPost({ authorId: AUTHOR, body: "Hola", visibility: "city" });
    const comment = await social.addComment({
      postId: post.id,
      authorId: OTHER,
      body: "Buenas",
    });

    await expect(social.deleteComment(comment.id, AUTHOR)).rejects.toThrow(/author/i);
    await social.deleteComment(comment.id, OTHER);
    expect(await social.listComments(post.id)).toHaveLength(0);
  });

  it("toggles likes and counts them", async () => {
    const social = repo();
    const post = await social.createPost({ authorId: AUTHOR, body: "¡Bici libre!", visibility: "city" });

    expect(await social.hasLiked(post.id, OTHER)).toBe(false);
    expect(await social.toggleLike(post.id, OTHER)).toBe(true);
    expect(await social.hasLiked(post.id, OTHER)).toBe(true);
    expect(await social.reactionCount(post.id)).toBe(1);

    await social.toggleLike(post.id, OTHER);
    expect(await social.reactionCount(post.id)).toBe(0);
  });
});
