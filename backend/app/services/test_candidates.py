from real_database import get_real_database_connection


connection = get_real_database_connection()
cursor = connection.cursor()


candidates = [
    {
        "name": "idx_customer_country",
        "table": "Customer",
        "columns": "Country",
        "query": """
            SELECT CustomerId, FirstName, LastName, Email
            FROM Customer
            WHERE Country = 'USA'
        """
    },
    {
        "name": "idx_invoice_date",
        "table": "Invoice",
        "columns": "InvoiceDate",
        "query": """
            SELECT InvoiceId, CustomerId, InvoiceDate, Total
            FROM Invoice
            WHERE InvoiceDate >= '2010-01-01'
              AND InvoiceDate < '2011-01-01'
        """
    },
    {
        "name": "idx_invoice_customer_date",
        "table": "Invoice",
        "columns": "CustomerId, InvoiceDate DESC",
        "query": """
            SELECT InvoiceId, InvoiceDate, Total
            FROM Invoice
            WHERE CustomerId = 5
            ORDER BY InvoiceDate DESC
        """
    },
    {
        "name": "idx_artist_name",
        "table": "Artist",
        "columns": "Name",
        "query": """
            SELECT t.TrackId,
                   t.Name AS TrackName,
                   a.Title AS AlbumTitle,
                   ar.Name AS ArtistName
            FROM Track t
            JOIN Album a
              ON t.AlbumId = a.AlbumId
            JOIN Artist ar
              ON a.ArtistId = ar.ArtistId
            WHERE ar.Name = 'Iron Maiden'
        """
    },
    {
        "name": "idx_track_unitprice",
        "table": "Track",
        "columns": "UnitPrice",
        "query": """
            SELECT TrackId, Name, UnitPrice
            FROM Track
            WHERE UnitPrice >= 0.99
              AND UnitPrice <= 1.99
        """
    },
    {
        "name": "idx_track_album_name",
        "table": "Track",
        "columns": "AlbumId, Name",
        "query": """
            SELECT TrackId, Name, UnitPrice
            FROM Track
            WHERE AlbumId = 10
            ORDER BY Name
        """
    }
]


for candidate in candidates:

    print("\n" + "=" * 70)
    print("CANDIDATE:", candidate["name"])
    print("=" * 70)

    print("CREATE INDEX:")
    print(
        f"CREATE INDEX {candidate['name']} "
        f"ON {candidate['table']} "
        f"({candidate['columns']});"
    )

    print("\nPLAN BEFORE:")

    cursor.execute(
        "EXPLAIN QUERY PLAN " + candidate["query"]
    )

    before_plan = cursor.fetchall()

    for row in before_plan:
        print(row)

    # Create candidate index
    cursor.execute(
        f"""
        CREATE INDEX {candidate['name']}
        ON {candidate['table']} ({candidate['columns']})
        """
    )

    print("\nPLAN AFTER:")

    cursor.execute(
        "EXPLAIN QUERY PLAN " + candidate["query"]
    )

    after_plan = cursor.fetchall()

    for row in after_plan:
        print(row)

    # Remove candidate so the next test starts clean
    cursor.execute(
        f"DROP INDEX {candidate['name']}"
    )

    connection.commit()


connection.close()