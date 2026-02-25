import { NextResponse } from "next/server";
import { BookService } from "@/libs/services/bookService";


//this GET handles both listing all books and searching (local or external) based on query params.
//its used in both admin and user side, but the external search is only for admin side to add new books.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const external = searchParams.get("external");

  if (!query) {
    const books = BookService.getAll();
    return NextResponse.json(books);
  }

  //only used in admin side.
  if (external === "true") {
    const results = await BookService.searchExternal(query);
    return NextResponse.json(results);
  }

  const results = BookService.searchLocal(query);
  return NextResponse.json(results);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const book = await BookService.importBook(body);

    return NextResponse.json(book, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}