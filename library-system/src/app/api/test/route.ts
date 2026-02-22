import { BookService } from "@/services/bookService";
import { BorrowService } from "@/services/borrowService";

export async function GET() {
  try {
    // 1. Create book
    const book = BookService.createBook({
      title: "Test Book",
      author: "Test Author",
      isbn: "1234567890",
      publishedYear: 2024,
      totalCopies: 2,
      coverUrl: "",
      summary: ""
    });

    // 2. Borrow book
    const borrow = BorrowService.borrowBook("user-1", book.id);

    return Response.json({
      success: true,
      book,
      borrow
    });

  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message
    });
  }
}