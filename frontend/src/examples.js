export const EXAMPLES = [
  {
    label: "WHERE Filter",
    description:
      "Find customers from the USA — demonstrates equality-filter indexing.",
    query:
      "SELECT CustomerId, FirstName, LastName, Email\n" +
      "FROM Customer\n" +
      "WHERE Country = 'USA';",
  },

  {
    label: "Existing Index",
    description:
      "Find invoices for a customer — demonstrates detection of an existing index.",
    query:
      "SELECT InvoiceId, InvoiceDate, Total\n" +
      "FROM Invoice\n" +
      "WHERE CustomerId = 5;",
  },

  {
    label: "Range Filter",
    description:
      "Find invoices within a date range — demonstrates range indexing.",
    query:
      "SELECT InvoiceId, CustomerId, InvoiceDate, Total\n" +
      "FROM Invoice\n" +
      "WHERE InvoiceDate >= '2010-01-01'\n" +
      "  AND InvoiceDate < '2011-01-01';",
  },

  {
    label: "Composite Filter + ORDER BY",
    description:
      "Filter invoices by customer and sort by date — demonstrates a composite index.",
    query:
      "SELECT InvoiceId, InvoiceDate, Total\n" +
      "FROM Invoice\n" +
      "WHERE CustomerId = 5\n" +
      "ORDER BY InvoiceDate DESC;",
  },

  {
    label: "JOIN + Filter",
    description:
      "Find USA customers and their invoices — demonstrates JOIN and filter analysis.",
    query:
      "SELECT c.CustomerId, c.FirstName, c.LastName,\n" +
      "       i.InvoiceId, i.InvoiceDate, i.Total\n" +
      "FROM Customer c\n" +
      "JOIN Invoice i ON c.CustomerId = i.CustomerId\n" +
      "WHERE c.Country = 'USA';",
  },

  {
    label: "Artist Lookup",
    description:
      "Find tracks by an artist — demonstrates indexing a filtered JOIN column.",
    query:
      "SELECT t.TrackId, t.Name AS TrackName,\n" +
      "       a.Title AS AlbumTitle, ar.Name AS ArtistName\n" +
      "FROM Track t\n" +
      "JOIN Album a ON t.AlbumId = a.AlbumId\n" +
      "JOIN Artist ar ON a.ArtistId = ar.ArtistId\n" +
      "WHERE ar.Name = 'Iron Maiden';",
  },

  {
    label: "GROUP BY",
    description:
      "Calculate total spending by customer — demonstrates grouping analysis.",
    query:
      "SELECT c.CustomerId, c.FirstName, c.LastName,\n" +
      "       SUM(i.Total) AS TotalSpent\n" +
      "FROM Customer c\n" +
      "JOIN Invoice i ON c.CustomerId = i.CustomerId\n" +
      "GROUP BY c.CustomerId, c.FirstName, c.LastName\n" +
      "ORDER BY TotalSpent DESC;",
  },

  {
    label: "ORDER BY Composite",
    description:
      "Find tracks from an album and sort by name — demonstrates filter plus sorting.",
    query:
      "SELECT TrackId, Name, UnitPrice\n" +
      "FROM Track\n" +
      "WHERE AlbumId = 10\n" +
      "ORDER BY Name;",
  },

  {
    label: "Existing Foreign-Key Index",
    description:
      "Find tracks by genre — demonstrates existing foreign-key index detection.",
    query:
      "SELECT TrackId, Name, UnitPrice\n" +
      "FROM Track\n" +
      "WHERE GenreId = 1;",
  },

  {
    label: "No Filter",
    description:
      "Read all tracks without a filter — demonstrates when an index is unnecessary.",
    query:
      "SELECT * FROM Track;",
  },
];