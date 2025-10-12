import type { CommentStatus } from "@/server/types/comment";

export type MockComment = {
  id: string;
  postId: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
};

const store = new Map<string, MockComment>();

export function addComment(comment: MockComment) {
  store.set(comment.id, comment);
}

export function listComments(filter?: { postId?: string }) {
  const items = Array.from(store.values());
  if (filter?.postId) {
    return items.filter((item) => item.postId === filter.postId);
  }
  return items;
}

export function updateCommentStatus(id: string, status: CommentStatus) {
  const comment = store.get(id);
  if (!comment) return null;
  const updated = { ...comment, status };
  store.set(id, updated);
  return updated;
}

export function getComment(id: string) {
  return store.get(id) ?? null;
}
