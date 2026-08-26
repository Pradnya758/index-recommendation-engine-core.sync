export const EXAMPLES = [
  {
    label: "WHERE filter",
    description: "Find paid orders without an index on status.",
    query: "SELECT * FROM orders WHERE status = 'paid';",
  },
  {
    label: "JOIN lookup",
    description: "Match order rows to product rows.",
    query: "SELECT o.order_id, p.product_name FROM orders o JOIN products p ON o.product_id = p.product_id;",
  },
  {
    label: "ORDER BY",
    description: "Sort a large orders result by date.",
    query: "SELECT order_id, customer_id, order_date FROM orders ORDER BY order_date DESC;",
  },
  {
    label: "Composite WHERE",
    description: "Equality followed by a date range.",
    query: "SELECT * FROM orders WHERE status = 'paid' AND order_date >= '2025-01-01';",
  },
  {
    label: "No opportunity",
    description: "A primary-key lookup should not need another index.",
    query: "SELECT * FROM orders WHERE order_id = 1;",
  },
];
