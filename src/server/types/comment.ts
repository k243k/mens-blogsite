export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Comment = {
  id: string;
  postId: string;
  body: string;
  status: CommentStatus;
  createdAt: Date;
};
