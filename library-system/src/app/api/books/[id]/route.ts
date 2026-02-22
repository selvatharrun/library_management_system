import { BookService } from "@/services/bookService";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const book = BookService.getById(params.id);
    return Response.json(book);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 404 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    BookService.deleteBook(params.id);
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 404 });
  }
}