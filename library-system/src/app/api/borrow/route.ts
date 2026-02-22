import { BorrowService } from "@/services/borrowService";

export async function POST(req: Request) {
  try {
    const { userId, bookId } = await req.json();

    const record = BorrowService.borrowBook(userId, bookId);

    return Response.json(record, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}