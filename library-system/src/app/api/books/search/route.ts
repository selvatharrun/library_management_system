import { BookService } from "@/services/bookService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return Response.json({ error: "Query required" }, { status: 400 });
    }

    const results = await BookService.searchExternal(query);

    return Response.json(results);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}