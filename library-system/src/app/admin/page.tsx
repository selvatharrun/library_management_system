import { BookService } from "@/libs/services/bookService";
import styles from "./dashboard.module.css";

export default function AdminDashboard() {

  const books = BookService.getAll();

  const getTotal = (book: any) =>
    Object.values(book.locations)
      .reduce((sum: number, loc: any) => sum + loc.total, 0);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Library Inventory</h1>

      <div className={styles.grid}>
        {books.map((book) => (
          <div key={book.id} className={styles.card}>

            {
            book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className={styles.cover}
              />
            ) : (
              <div className={styles.cover}></div>
            )}

            <div className={styles.info}>
              {book.workKey ? (
                <a
                  href={`https://openlibrary.org${book.workKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.bookTitle}
                >
                  {book.title}
                </a>
              ) : (
                <div className={styles.bookTitle}>{book.title}</div>
              )}

              <div className={styles.author}>
                {book.author}
              </div>

              <div className={styles.stock}>
                <div>Chennai: {book.locations.Chennai.total}</div>
                <div>Bangalore: {book.locations.Bangalore.total}</div>
                <div>Delhi: {book.locations.Delhi.total}</div>
                <div>Mumbai: {book.locations.Mumbai.total}</div>

                <div className={styles.total}>
                  Total: {getTotal(book)}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}