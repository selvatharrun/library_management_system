import { NextResponse } from "next/server";
import { BookService } from "@/libs/services/bookService";

export function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const book = BookService.getById(params.id);
    return NextResponse.json(book);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 404 }
    );
  }
}

export function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    BookService.deleteBook(params.id);
    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 404 }
    );
  }
}