export const EXAMPLES = [
  {
    label: "WHERE Filter",
    description: "Filter students by major — demonstrates single-column equality index.",
    query: "SELECT * FROM students\nWHERE major = 'Computer Science';",
  },
  {
    label: "JOIN Lookup",
    description: "Join orders to customers — demonstrates join-column indexing.",
    query: "SELECT o.order_id, c.full_name\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id;",
  },
  {
    label: "ORDER BY",
    description: "Sort products by price — demonstrates sort-column index.",
    query: "SELECT *\nFROM products\nORDER BY unit_price;",
  },
  {
    label: "Composite Filter",
    description: "Filter by customer and status, sort by date — demonstrates composite index.",
    query: "SELECT *\nFROM orders\nWHERE customer_id = 10\n  AND status = 'paid'\nORDER BY order_date;",
  },
  {
    label: "No Useful Index",
    description: "Full table select with no filter — no index can help.",
    query: "SELECT * FROM students;",
  },
];
