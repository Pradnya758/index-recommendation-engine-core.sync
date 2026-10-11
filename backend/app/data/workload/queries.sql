-- Q1: Find customers from a particular country
SELECT CustomerId, FirstName, LastName, Email
FROM Customer
WHERE Country = 'USA';


-- Q2: Find invoices belonging to a customer
SELECT InvoiceId, InvoiceDate, Total
FROM Invoice
WHERE CustomerId = 5;


-- Q3: Find invoices within a date range
SELECT InvoiceId, CustomerId, InvoiceDate, Total
FROM Invoice
WHERE InvoiceDate >= '2010-01-01'
  AND InvoiceDate < '2011-01-01';


-- Q4: Find a customer's invoices and sort by date
SELECT InvoiceId, InvoiceDate, Total
FROM Invoice
WHERE CustomerId = 5
ORDER BY InvoiceDate DESC;


-- Q5: Find albums belonging to an artist
SELECT AlbumId, Title
FROM Album
WHERE ArtistId = 50;


-- Q6: Find tracks belonging to a genre
SELECT TrackId, Name, UnitPrice
FROM Track
WHERE GenreId = 1;


-- Q7: Join customers and invoices
SELECT c.CustomerId,
       c.FirstName,
       c.LastName,
       i.InvoiceId,
       i.InvoiceDate,
       i.Total
FROM Customer c
JOIN Invoice i
  ON c.CustomerId = i.CustomerId
WHERE c.Country = 'USA';


-- Q8: Find invoice lines for a particular invoice
SELECT InvoiceLineId, TrackId, Quantity, UnitPrice
FROM InvoiceLine
WHERE InvoiceId = 10;


-- Q9: Find tracks with their album and artist
SELECT t.TrackId,
       t.Name AS TrackName,
       a.Title AS AlbumTitle,
       ar.Name AS ArtistName
FROM Track t
JOIN Album a
  ON t.AlbumId = a.AlbumId
JOIN Artist ar
  ON a.ArtistId = ar.ArtistId
WHERE ar.Name = 'Iron Maiden';


-- Q10: Calculate total spending by customer
SELECT c.CustomerId,
       c.FirstName,
       c.LastName,
       SUM(i.Total) AS TotalSpent
FROM Customer c
JOIN Invoice i
  ON c.CustomerId = i.CustomerId
GROUP BY c.CustomerId, c.FirstName, c.LastName
ORDER BY TotalSpent DESC;


-- Q11: Find tracks in a price range
SELECT TrackId, Name, UnitPrice
FROM Track
WHERE UnitPrice >= 0.99
  AND UnitPrice <= 1.99;


-- Q12: Find tracks of a particular media type
SELECT TrackId, Name
FROM Track
WHERE MediaTypeId = 1;


-- Q13: Find playlists containing a particular track
SELECT PlaylistId
FROM PlaylistTrack
WHERE TrackId = 100;


-- Q14: Find tracks in an album and sort by name
SELECT TrackId, Name, UnitPrice
FROM Track
WHERE AlbumId = 10
ORDER BY Name;


-- Q15: Find employees reporting to a particular employee
SELECT EmployeeId, FirstName, LastName, Title
FROM Employee
WHERE ReportsTo = 1;