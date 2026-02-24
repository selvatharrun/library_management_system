import { NextResponse } from "next/server";
import { BookService } from "@/libs/services/bookService";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = BookService.getById(id);
    return NextResponse.json(book);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = BookService.updateLocations(id, body.locations);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    BookService.deleteBook(id);
    return NextResponse.json({ message: "Deleted" });
  } 
  catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 404 }
    );
  }
}