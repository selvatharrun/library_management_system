import { BorrowService } from "@/services/borrowService";

export async function POST(req: Request) {
  try {
    const { recordId } = await req.json();
    const record = BorrowService.returnBook(recordId);

    return Response.json(record);
  } 
  catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}