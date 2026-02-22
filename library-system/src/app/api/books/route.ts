import { BookService } from "@/services/bookService";

export async function GET() {
  try {
    const books = BookService.getAll();
    return Response.json(books);
  } 
  catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const book = BookService.createBook(body);
    return Response.json(book, { status: 201 });
  } 
  catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}