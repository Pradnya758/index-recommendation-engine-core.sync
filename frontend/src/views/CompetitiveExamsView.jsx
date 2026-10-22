import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

/*
 * Competitive exam practice for the Index Recommendation Engine project.
 *
 * Question policy:
 * - Each exam has its own question bank; pools are not shared between exams.
 * - Questions are original/adapted practice questions aligned with topics in
 *   the linked official syllabus/past-paper resources. They are NOT claimed
 *   to be verbatim official questions.
 * - The official exams do not test this individual project; project examples
 *   are used to make the syllabus topics relevant to the project.
 */

const EXAMS = [
  {
    id: "gate",
    title: "GATE CSE",
    subtitle: "Graduate Aptitude Test in Engineering",
    description: "DBMS, SQL, indexing, query processing, and test reasoning aligned with GATE CSE topics.",
    icon: GraduationCap,
    color: "blue",
    sourceLabel: "GATE official syllabus and past papers",
    sourceUrl: "https://gate2026.iitg.ac.in/exam-papers-and-syllabus.html",
    subjects: ["GATE PYQs: File Organization & Indexing"],
  },
  {
    id: "isro",
    title: "ISRO Computer Science",
    subtitle: "Scientist/Engineer technical recruitment",
    description: "Database and algorithmic reasoning for technical recruitment, applied to the project.",
    icon: Target,
    color: "purple",
    sourceLabel: "ISRO official recruitment and previous papers",
    sourceUrl: "https://www.isro.gov.in/ICRB_Recruitment13.html",
    subjects: ["ISRO PYQs: File Organization & Indexing"],
  },
  {
    id: "ugc-net",
    title: "UGC NET Computer Science",
    subtitle: "Computer Science and Applications",
    description: "Practice DBMS, SQL, and query-processing concepts from the Computer Science syllabus.",
    icon: BookOpen,
    color: "green",
    sourceLabel: "UGC NET Computer Science syllabus",
    sourceUrl: "https://ugcnetonline.in/syllabus-new.php",
    subjects: ["UGC NET PYQs: DBMS & Indexing"],
  },
  {
    id: "nielit",
    title: "NIELIT / NIC Technical",
    subtitle: "Technical recruitment practice",
    description: "Database fundamentals and evidence-based reasoning for relevant computing posts.",
    icon: Award,
    color: "orange",
    sourceLabel: "NIELIT/NIC DBMS MCQ question-bank compilation",
    sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank",
    subjects: ["NIELIT / NIC PYQs: DBMS & Indexing"],
  },
];

const BANKS = {
  gate: {
    "DBMS & SQL": [
      { question: "A query groups sales by product and then keeps only groups with total sales above 500. Which clause filters the grouped result?", options: ["WHERE", "HAVING", "ORDER BY", "DISTINCT"], answer: 1, explanation: "HAVING filters groups after GROUP BY and aggregate evaluation; WHERE filters input rows before grouping." },
      { question: "A table has a composite primary key (store_id, product_id). Which statement is correct?", options: ["Either column alone must be unique", "The pair uniquely identifies a row", "Both columns must be text", "The table cannot have other indexes"], answer: 1, explanation: "A composite key guarantees uniqueness for the combination; neither component must be unique by itself." },
      { question: "In a relational design for query logs, why should repeated database connection details generally be stored separately from each query record?", options: ["To enforce normalization and reduce duplication", "To make every query a primary key", "To prevent SELECT statements", "To remove all foreign keys"], answer: 0, explanation: "Separating repeated facts reduces update anomalies and supports a normalized relational design." },
    ],
    "GATE PYQs: File Organization & Indexing": [
      { year: 2026, paper: "Set 2", marks: 1, type: "MCQ", source: "GATE 2026 PYQ collection + supplied PDF", question: "Consider these statements about index density: (S1) a hash index must be dense; (S2) a B+ tree index can be sparse. Which option is correct?", options: ["Both S1 and S2 are true", "Both S1 and S2 are false", "S1 is true and S2 is false", "S1 is false and S2 is true"], answer: 0, explanation: "The supplied PDF's answer key marks option A. Hash indexes are represented with entries for search-key values, while an ordered B+ tree index can use sparse entries in suitable primary-index arrangements.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-2026-dbms-pyqs-file-organization-indexing/" },
      { year: 2024, paper: "Set 2", marks: 1, type: "MSQ", source: "GATE 2010–2025 PYQ collection + supplied PDF", question: "Which file organizations are I/O-efficient when the task is to scan the full data set? Select all that apply.", options: ["Sorted file", "Heap file", "Unclustered tree index", "Unclustered hash index"], answer: [0, 1], explanation: "The supplied answer key gives A and B. Sequential scans can read sorted and heap files efficiently; unclustered indexes may require scattered record accesses.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2023, paper: "CSE", marks: 2, type: "NAT", source: "Supplied PDF, page 6", question: "A primary index is built for 25,000 fixed-length records. Each record is 100 bytes, the key is 15 bytes, the block size is 1024 bytes, and a block pointer is 5 bytes. Records cannot cross blocks. If binary search on an index file of b blocks costs ceil(log2 b) block accesses, how many block accesses are needed in the worst case to identify the possible data block?", options: [], answer: 6, explanation: "A data block holds floor(1024/100) = 10 records, so there are 2,500 data blocks. Each primary-index entry is 15 + 5 = 20 bytes, giving floor(1024/20) = 51 entries per index block and ceil(2500/51) = 50 index blocks. ceil(log2 50) = 6 accesses.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2021, paper: "Set 2", marks: 1, type: "NAT", source: "Supplied PDF, page 2", question: "A file contains 150,000 records. An index entry stores a 12-byte candidate-key value and a 7-byte record pointer. With a 4096-byte block size and no index record crossing a block, how many blocks are required for this index file?", options: [], answer: 698, explanation: "Each index entry is 19 bytes. A block holds floor(4096/19) = 215 entries. Therefore, ceil(150000/215) = 698 blocks.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2020, paper: "CSE", marks: 2, type: "NAT", source: "GATE 2010–2025 PYQ collection + supplied PDF", question: "A B+ tree indexes one million records on disk. The block size is 4 KB, each search key is 12 bytes, and each tree/disk pointer is 8 bytes. No tree node or record is initially in memory, and each record fits in one block. What is the minimum number of disk accesses needed to retrieve a record?", options: [], answer: 4, explanation: "Using the maximum fan-out that fits a 4 KB node gives a shallow B+ tree for one million entries. The search traverses the index levels and then fetches the data block; the supplied answer key gives 4.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2019, paper: "CSE", marks: 1, type: "MCQ", source: "Supplied PDF, page 3", question: "Which statement about a B+ tree index is NOT correct?", options: ["A B+ tree is height-balanced", "Non-leaf nodes contain pointers directly to data records", "Each leaf node can point to the next leaf", "Keys in each node are kept in sorted order"], answer: 1, explanation: "In a typical B+ tree, internal nodes guide the search; data entries or record pointers are stored at the leaf level. The supplied answer key gives B.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2016, paper: "Set 2", marks: 1, type: "MCQ", source: "Supplied PDF, page 3", question: "Why is a B+ tree called balanced?", options: ["Every root-to-leaf path has the same length", "Root-to-leaf path lengths may differ by at most one", "Sibling internal nodes differ by at most one child", "Every leaf has almost the same number of records"], answer: 0, explanation: "All leaves of a B+ tree occur at the same depth, so every root-to-leaf path has equal length. The supplied answer key gives A.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2015, paper: "Set 1", marks: 1, type: "MCQ", source: "GATE 2010–2025 PYQ collection + supplied PDF", question: "An index is clustered when:", options: ["It is defined only on a candidate key", "It includes the primary key", "The data-record order is the same as or close to the index-entry order", "The data-record order differs from the index-entry order"], answer: 2, explanation: "A clustered index reflects the physical ordering of data records relative to the index entries. The supplied PDF's answer key gives C.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2010, paper: "CSE", marks: 1, type: "MCQ", source: "Supplied PDF, page 4", question: "A B+ tree node can contain at most five keys. What is the minimum number of keys in a non-root node?", options: ["1", "2", "3", "4"], answer: 1, explanation: "For this B+ tree definition, a non-root node must be at least half full; the minimum is 2 keys. The supplied answer key gives B.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2009, paper: "CSE", marks: 2, type: "MCQ", source: "Supplied PDF, page 7", question: "A B+ tree starts empty. Internal-node order is 3 and leaf capacity is 2. Keys are inserted in this order: 10, 3, 6, 8, 4, 2, 1. What is the maximum number of leaf-node splits during these insertions?", options: ["2", "3", "4", "5"], answer: 1, explanation: "Simulating the insertions with leaf capacity 2 gives a maximum of 3 leaf splits. The supplied answer key gives B.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2008, paper: "CSE", marks: 1, type: "MCQ", source: "Supplied PDF, page 4", question: "A clustering index is defined on fields that are:", options: ["Non-key and ordering", "Non-key and non-ordering", "Key and ordering", "Key and non-ordering"], answer: 0, explanation: "A clustering index is associated with an ordering non-key field, where multiple records may share a field value. The supplied answer key gives A.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2007, paper: "CSE", marks: 2, type: "MCQ", source: "Supplied PDF, page 7", question: "A B+ tree leaf node has a 1 KB block, 7-byte record pointers, 9-byte key values, and a 6-byte link pointer to the next leaf. What is the maximum number of (key, record-pointer) pairs the leaf can hold?", options: ["63", "64", "67", "68"], answer: 0, explanation: "Each pair needs 9 + 7 = 16 bytes, and the leaf link needs 6 bytes. Thus floor((1024 - 6)/16) = 63 pairs. The supplied answer key gives A.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2004, paper: "CSE", marks: 2, type: "MCQ", source: "Supplied PDF, page 9", question: "An internal B+ tree node has a 512-byte block. Each child pointer uses 6 bytes and each key uses 14 bytes. What is the maximum order (number of child pointers)?", options: ["24", "25", "26", "27"], answer: 2, explanation: "For order p, the node needs p pointer fields and p−1 key fields: 6p + 14(p−1) ≤ 512, so 20p ≤ 526 and p = 26. The supplied answer key gives C.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2002, paper: "CSE", marks: 2, type: "MCQ", source: "Supplied PDF, page 10", question: "A B+ tree indexes names of 8 bytes each. Disk blocks are 512 bytes and index pointers are 4 bytes. Which degree gives the maximum number of pointers per node while fitting within one block?", options: ["16", "42", "43", "44"], answer: 2, explanation: "For p pointers and p−1 keys, 4p + 8(p−1) ≤ 512, so 12p ≤ 520 and the maximum integer p is 43. The supplied answer key gives C.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 2000, paper: "CSE", marks: 1, type: "MCQ", source: "Supplied PDF, page 4", question: "Why are B+ trees generally preferred to binary trees for database indexes stored on disk?", options: ["Disk capacity is greater than memory capacity", "Disk access is much slower than memory access", "Disk transfer rates are lower than memory transfer rates in every case", "Disks are more reliable than memory"], answer: 1, explanation: "B+ trees have high fan-out and small height, reducing expensive disk I/O compared with a binary tree. The supplied answer key gives B.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
      { year: 1999, paper: "CSE", marks: 1, type: "MCQ", source: "Supplied PDF, page 4", question: "Which statement about B-trees and B+ trees is correct?", options: ["B-trees are for disk and B+ trees are for main memory", "Range queries are faster on B+ trees", "B-trees are only primary indexes and B+ trees only secondary indexes", "B+ tree height is independent of the number of records"], answer: 1, explanation: "Linked leaves support efficient sequential traversal for range queries in a B+ tree. The supplied answer key gives B.", sourceUrl: "https://www.geeksforgeeks.org/quizzes/gate-dbms-file-organizations-pyq-2010-to-2025/" },
    ],
    "Engine Testing": [
      { question: "A test for the recommendation engine should reject a candidate already covered by an existing index. What kind of test is this?", options: ["A regression/behavior test", "A UI color test only", "A network throughput test", "A compiler benchmark"], answer: 0, explanation: "It verifies a defined engine behavior and protects it from future regressions." },
      { question: "The engine's recommendation result differs after a code change. Which evidence best helps diagnose the difference?", options: ["Only the button color", "Candidate columns, existing indexes, and query-plan output", "The laptop wallpaper", "The browser zoom level"], answer: 1, explanation: "These are the inputs and database evidence that explain why a candidate was accepted or rejected." },
      { question: "Why should an automated test use a small controlled SQLite database?", options: ["To make results reproducible", "To guarantee every index improves every query", "To remove the need for assertions", "To test a different DBMS automatically"], answer: 0, explanation: "Controlled fixtures make tests repeatable and easier to diagnose." },
    ],
  },
  isro: {
    "ISRO PYQs: File Organization & Indexing": [
      { year: 2025, paper: "Scientist/Engineer SC", marks: 1, type: "MCQ", source: "Official ISRO Computer Science paper (2025)", question: "A table users(userid, country, city, street) has a composite index on (country, city, street). For which query is this index least useful?", options: ["SELECT userid FROM users WHERE country = 'IN'", "SELECT userid FROM users WHERE street = 'MG Road'", "SELECT userid FROM users WHERE country = 'IN' AND city = 'Pune' AND street = 'MG Road'", "SELECT userid FROM users WHERE country = 'IN' AND city = 'Pune'"], answer: 1, explanation: "A composite B-tree index is most directly usable from its leftmost column(s). Filtering only by street skips the leading country and city columns, so the index is least useful for that predicate.", sourceUrl: "https://www.isro.gov.in/ICRB_Recruitment13.html" },
      { year: 2023, paper: "Scientist/Engineer SC", marks: 1, type: "MCQ", source: "Official ISRO Computer Science paper (2023), question 30", question: "A table T(X, Y) starts with (1, 1). Each new row is inserted with X = current maximum X + 1 and Y = 2 × current maximum Y + 1. After 128 insertions, what value is returned by SELECT Y FROM T WHERE X = 7?", options: ["127", "15", "129", "257"], answer: 0, explanation: "Starting from (1,1), the Y values for X = 2, 3, 4, 5, 6, 7 are 3, 7, 15, 31, 63, 127. Therefore, the query returns 127.", sourceUrl: "https://www.isro.gov.in/media_isro/pdf/recruitmentNotice/2025_May/CS_2023_merge.pdf" },
      { year: 2023, paper: "Scientist/Engineer SC · SQL", marks: 1, type: "MCQ", source: "Official ISRO Computer Science paper (2023), SQL question", question: "In SQL, which operation is equivalent to SELECT * FROM R, S when no join condition is specified?", options: ["NATURAL JOIN", "OUTER JOIN", "CROSS JOIN", "INNER JOIN with a matching condition"], answer: 2, explanation: "Listing two tables in the FROM clause without a join condition forms their Cartesian product, equivalent to CROSS JOIN.", sourceUrl: "https://www.isro.gov.in/media_isro/pdf/recruitmentNotice/2025_May/CS_2023_merge.pdf" },
      { year: 2023, paper: "Scientist/Engineer SC · SQL", marks: 1, type: "MCQ", source: "Official ISRO Computer Science paper (2023), SQL question", question: "Which SQL statement deletes teachers whose department belongs to a department located in the building named 'CSE'?", options: ["DELETE FROM teacher WHERE dept_name IN 'CSE'", "DELETE FROM department WHERE building = 'CSE'", "DELETE FROM teacher WHERE dept_name IN (SELECT dept_name FROM department WHERE building = 'CSE')", "None of the above"], answer: 2, explanation: "The subquery first finds department names in the CSE building. The outer DELETE then removes teacher rows whose dept_name is in that result.", sourceUrl: "https://www.isro.gov.in/media_isro/pdf/recruitmentNotice/2025_May/CS_2023_merge.pdf" },
      { year: 2023, paper: "Scientist/Engineer SC", marks: 2, type: "MCQ", source: "Official ISRO Computer Science paper (2023), DBMS", question: "The ACID property of durability requires changes made by a successful transaction to persist:", options: ["Only if the operating system does not crash", "Only if the disk does not crash", "Only if power is not interrupted", "Even after failures, subject to the database's recovery guarantees"], answer: 3, explanation: "Durability means committed changes are preserved despite failures; database recovery mechanisms are designed to provide this guarantee.", sourceUrl: "https://www.isro.gov.in/media_isro/pdf/recruitmentNotice/2025_May/CS_2023_merge.pdf" },
      { year: 2023, paper: "Scientist/Engineer SC", marks: 2, type: "MCQ", source: "Official ISRO Computer Science paper (2023), DBMS", question: "Fifth Normal Form (5NF) is primarily concerned with which dependency?", options: ["Functional dependency", "Multivalued dependency", "Join dependency", "Domain-key dependency"], answer: 2, explanation: "5NF addresses join dependencies and decompositions that cannot be further losslessly decomposed without introducing spurious tuples.", sourceUrl: "https://www.isro.gov.in/media_isro/pdf/recruitmentNotice/2025_May/CS_2023_merge.pdf" },
      { year: 2025, paper: "Scientist/Engineer SC", marks: 1, type: "MCQ", source: "Official ISRO Computer Science paper (2025), relational modeling", question: "Two entity tables A and B have a one-to-many relationship and a many-to-many relationship between them. Assuming no other entities, what is the minimum number of tables needed to represent both entities and relationships?", options: ["2", "3", "4", "5"], answer: 1, explanation: "A and B require two tables. The one-to-many relationship can be represented by a foreign key, while the many-to-many relationship needs a junction table, giving three tables.", sourceUrl: "https://www.isro.gov.in/ICRB_Recruitment13.html" },
      { year: 2025, paper: "Scientist/Engineer SC", marks: 1, type: "MCQ", source: "Official ISRO Computer Science paper (2025), transaction processing", question: "Two transactions transfer money in opposite directions between the same two accounts under REPEATABLE READ with standard locking. Which principle is most relevant when deciding whether a concurrent outcome is possible?", options: ["Transaction isolation and allowed interleavings", "Index leaf capacity only", "SQL column naming rules", "File compression ratio"], answer: 0, explanation: "Concurrent transaction outcomes depend on isolation semantics, locking, and which interleavings are allowed. This is relevant to safe database-backed applications.", sourceUrl: "https://www.isro.gov.in/ICRB_Recruitment13.html" },
      { year: 2023, paper: "ISRO DBMS practice · adapted", marks: 1, type: "MCQ", source: "Practice adaptation based on ISRO DBMS topics; not a verbatim PYQ", question: "A query frequently filters rows by product_id. What is the main purpose of creating an index on product_id?", options: ["To potentially reduce the rows/pages examined for lookup", "To automatically delete duplicate rows", "To guarantee every query runs in constant time", "To remove the need for a table"], answer: 0, explanation: "An index can provide a faster access path for selective lookups, although the optimizer may choose a scan when that is cheaper.", sourceUrl: "https://www.isro.gov.in/media_isro/pdf/recruitmentNotice/2025_May/CS_2023_merge.pdf" },
      { year: 2025, paper: "ISRO DBMS practice · adapted", marks: 1, type: "MCQ", source: "Practice adaptation based on ISRO DBMS topics; not a verbatim PYQ", question: "A composite B-tree index is defined on (store_id, product_id). Which query is most directly aligned with the index's leftmost-prefix rule?", options: ["WHERE product_id = 42", "WHERE store_id = 7", "WHERE price = 100", "WHERE quantity < 5"], answer: 1, explanation: "The leading column store_id can be used directly as a leftmost prefix. A predicate on product_id alone generally cannot use the composite index as directly.", sourceUrl: "https://www.isro.gov.in/ICRB_Recruitment13.html" },
    ],
  },
  "ugc-net": {
    "UGC NET PYQs: DBMS & Indexing": [
      { year: 2023, paper: "UGC NET June 2023", marks: 2, type: "MCQ", source: "Previous-year question reproduced in SamagraCS compilation", question: "A B-tree used as an index for a large database table has four levels including the root node. If a new key is inserted in this index, then maximum number of nodes that could be newly created in the process is", options: ["5", "4", "3", "2"], answer: 0, explanation: "In the worst case, a split can propagate from the leaf through every existing level, and a root split can create a new root. For a tree with four existing levels, up to five nodes may be newly created.", sourceUrl: "https://samagracs.com/database-management-system-nta-ugc-net-question-analysis/" },
      { year: 2023, paper: "UGC NET December 2023", marks: 2, type: "MCQ", source: "Previous-year question reproduced in SamagraCS compilation", question: "In relation to index structures for files, which of the following statements are correct? B. An index can be created in conjunction with virtually any primary record organization. D. An index can be used to enforce a key constraint on an attribute. E. An index can be created dynamically.", options: ["A, B and C only", "B, C and D only", "B, D and E only", "A, C, D and E only"], answer: 2, explanation: "An index is an auxiliary structure, can be used with different record organizations, can support key enforcement, and can be created dynamically. The correct combination is B, D and E.", sourceUrl: "https://samagracs.com/database-management-system-nta-ugc-net-question-analysis/" },
      { year: 2021, paper: "UGC NET November 2021", marks: 2, type: "MCQ", source: "Previous-year question reproduced in SamagraCS compilation", question: "The order of a leaf node in a B+ tree is the maximum number of (value, data-record-pointer) pairs it can hold. Given block size 1 KB (1024 bytes), data-record pointer 7 bytes, value field 9 bytes, and block pointer 6 bytes, what is the order of the leaf node?", options: ["63", "64", "67", "68"], answer: 0, explanation: "Each entry uses 9 + 7 = 16 bytes. Including the 6-byte pointer to the next leaf, 16m + 6 ≤ 1024, so m ≤ 63.6. The maximum integer order is 63.", sourceUrl: "https://samagracs.com/database-management-system-nta-ugc-net-question-analysis/" },
      { year: 2021, paper: "UGC NET November 2021", marks: 2, type: "MCQ", source: "Previous-year question reproduced in TheWholeTest compilation", question: "A B-tree indexes a database file. Search-key field = 10 bytes, block size = 1024 bytes, record pointer = 9 bytes, and block pointer = 8 bytes. Let K be the order of an internal node and L the order of a leaf node. Then (K, L) =", options: ["(57, 53)", "(50, 52)", "(60, 64)", "(34, 31)"], answer: 0, explanation: "For an internal node, 8K + 10(K − 1) ≤ 1024, giving K = 57. For a leaf node, each entry uses 10 + 9 bytes and the leaf pointer uses 8 bytes: 19L + 8 ≤ 1024, giving L = 53.", sourceUrl: "https://thewholetest.com/ugc-net/pyq/computer-science/topic/database-management-systems" },
      { year: 2023, paper: "UGC NET June 2023", marks: 2, type: "MCQ", source: "Previous-year question reproduced in TheWholeTest compilation", question: "The total cost of retrieving records in sorted order using an unclustered B+ tree index is given by which expression? (P = average number of records per data page, N = number of data pages, F = ratio of the size of a data entry to the size of a data record)", options: ["(F × N) + P", "(F + P) × N", "F × N × P", "F + P/N"], answer: 1, explanation: "The index leaf scan costs approximately F × N page accesses, and fetching records through an unclustered index can require about P × N data-page/record accesses under the stated model. The provided compilation gives (F + P) × N.", sourceUrl: "https://thewholetest.com/ugc-net/pyq/computer-science/topic/database-management-systems" },
      { year: 2023, paper: "UGC NET June 2023", marks: 2, type: "MCQ", source: "Previous-year question reproduced in SamagraCS compilation", question: "Which of the following is NOT an ACID property of a database transaction?", options: ["Atomicity", "Consistency", "Isolation", "Deadlock-freedom"], answer: 3, explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Deadlock-freedom is not one of the ACID properties.", sourceUrl: "https://samagracs.com/database-management-system-nta-ugc-net-question-analysis/" },
      { year: 2023, paper: "UGC NET June 2023", marks: 2, type: "MCQ", source: "Previous-year question reproduced in SamagraCS compilation", question: "Which situation may lead to an irrecoverable error in a database system?", options: ["A transaction reads a value written by an uncommitted transaction", "A transaction reads a value written by a committed transaction", "A transaction reads a value after another transaction has read it", "A transaction writes a value after another transaction reads it"], answer: 0, explanation: "If a transaction reads data written by an uncommitted transaction and the writer later aborts, the reader may have to abort too. If the reader has already committed, the schedule can be irrecoverable.", sourceUrl: "https://samagracs.com/database-management-system-nta-ugc-net-question-analysis/" },
      { year: 2019, paper: "UGC NET December 2019", marks: 2, type: "MCQ", source: "Previous-year question reproduced in TheWholeTest compilation", question: "Which DBMS component rearranges query operations, removes redundant operations, and chooses efficient algorithms and indexes for query execution?", options: ["Query compiler", "Query optimizer", "Stored data manager", "Database processor"], answer: 1, explanation: "The query optimizer compares alternative execution plans and chooses efficient access paths, join methods, and operation orderings, using available statistics and indexes.", sourceUrl: "https://thewholetest.com/ugc-net/pyq/computer-science/topic/database-management-systems" },
      { year: 2023, paper: "UGC NET December 2023", marks: 2, type: "MCQ", source: "Previous-year question reproduced in SamagraCS compilation", question: "Which of the following is/are NOT CORRECT statement? (A) The first record in each block of the data file is known as anchor record. (B) Dense index has index entries for every search key value in the data file. (C) Searching is harder in the B+ tree than B-tree as all external nodes are linked to each other. (D) In extendible hashing, the size of directory is an array of 2^(d−1), where d is global depth.", options: ["(A), (B) and (C) only", "(A), (C) and (D) only", "(A), (B) and (D) only", "(A), (B), (C) and (D)"], answer: 1, explanation: "The compilation gives (A), (C) and (D) only. A dense index does have entries for every search-key value, so (B) is correct. A B+ tree's linked leaves support efficient sequential traversal, and the stated directory-size expression is incorrect for global depth d.", sourceUrl: "https://samagracs.com/database-management-system-nta-ugc-net-question-analysis/" },
      { year: 2023, paper: "UGC NET December 2023", marks: 2, type: "MCQ", source: "Previous-year question reproduced in SamagraCS compilation", question: "Relations X and Y contain 4 tuples each. How many tuples are in the Cartesian product X × Y?", options: ["4", "8", "12", "16"], answer: 3, explanation: "The Cartesian product pairs every tuple of X with every tuple of Y, so the result has 4 × 4 = 16 tuples. This is a foundational relational operation used in query processing.", sourceUrl: "https://samagracs.com/database-management-system-nta-ugc-net-question-analysis/" },
    ],
  },
  nielit: {
    "NIELIT / NIC PYQs: DBMS & Indexing": [
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · B-tree insertion", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "A B-tree index has four levels, including the root. What is the maximum number of new nodes that may be created when one key is inserted?", options: ["5", "4", "3", "2"], answer: 1, explanation: "In the worst case, a full node may split at each level and a new root may be created. The maximum is four newly created nodes for a four-level tree.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · B+ tree index", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "Which statement is true about a B+ tree index?", options: ["Records must always be physically stored in primary-key order", "A B+ tree uses a hashing algorithm", "Updates may make the B+ tree unbalanced", "None of the above"], answer: 3, explanation: "A B+ tree is a balanced tree index, not a hashing algorithm, and the records need not be physically stored in primary-key order. Therefore none of the first three statements is true.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · Sequential access", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "Which index structure is most suitable for sequentially accessing data records?", options: ["B-tree", "B+ tree", "Both are equally suitable", "Neither"], answer: 1, explanation: "B+ tree leaf nodes are linked in key order, making sequential scans and range retrieval efficient.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · B-tree capacity", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "For a B-tree of order n, what is the maximum number of items that can be stored in a leaf node?", options: ["n/2", "(n−1)/2", "n−1", "n"], answer: 2, explanation: "A node of order n can have at most n child pointers and therefore at most n−1 keys.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · Index storage cost", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "Why is a search-key value not stored in the index for every record in all cases?", options: ["Each search-key entry adds CPU overhead", "Each search-key entry requires additional storage", "Both statements are true", "Neither statement is true"], answer: 2, explanation: "The supplied question-bank lists both additional processing overhead and storage cost as reasons. For index design, the central trade-off is lookup performance versus the space needed to maintain index entries.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · File organization", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "In sequential file organization, where is a record placed if it cannot fit into the available space in its target block?", options: ["The last block", "The first block", "An overflow block", "No location is used"], answer: 2, explanation: "Sequential and indexed-sequential file organizations may use overflow blocks when a record cannot be placed in its intended block.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · Dense index", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "What does an entry in a dense index typically contain?", options: ["A search-key value and a pointer to the corresponding record", "The longest key and a pointer to the final record", "The smallest key and a pointer to the first disk location", "No search key or pointer"], answer: 0, explanation: "A dense index has an index entry for every search-key value (or record, depending on duplicates), with a pointer to the matching record or data entry.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · B+ tree I/O cost", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "A B+ tree index contains K search keys and each leaf can hold about n records. Which expression best describes the order of the number of index nodes accessed for a lookup?", options: ["O(nK)", "O(logₙ K)", "O(K/n)", "O(log₂(nK))"], answer: 1, explanation: "The number of levels, and therefore the number of index-node accesses for a point lookup, grows logarithmically with the number of keys relative to the branching factor.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · B+ tree leaf capacity", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "For a B+ tree of order n, what is the maximum number of search-key values in a leaf node?", options: ["n−1", "n(n−1)/2", "n/2", "(n−1)/2"], answer: 0, explanation: "Under the common order-n convention, a leaf can hold up to n−1 search-key entries; minimum occupancy is a separate constraint.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
      { year: 2017, paper: "NIELIT/NIC exam question-bank compilation · Binary search over index blocks", marks: 1, type: "MCQ", source: "NIELIT MCQ Question Bank on Scribd; question listed in its DBMS section", question: "If an index occupies 100 blocks and binary search is used to locate a target block, approximately how many block reads are needed?", options: ["7", "6", "100", "10"], answer: 0, explanation: "Binary search needs about ceil(log₂ 100) = 7 block probes. This illustrates how an index can reduce the number of disk-block reads compared with a linear scan.", sourceUrl: "https://www.scribd.com/document/427934828/Nielit-Mcq-Question-Bank" },
    ],
  },
};

const EXAM_DURATION_MINUTES = 10;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function isAnswerCorrect(question, picked) {
  if (picked === undefined || picked === "") return false;
  if (question.type === "NAT") return Number(picked) === Number(question.answer);
  if (Array.isArray(question.answer)) {
    if (!Array.isArray(picked) || picked.length !== question.answer.length) return false;
    return [...picked].sort((a, b) => a - b).every((value, index) => value === [...question.answer].sort((a, b) => a - b)[index]);
  }
  return picked === question.answer;
}

function formatPickedAnswer(question, picked) {
  if (picked === undefined || picked === "") return "Not answered";
  if (question.type === "NAT") return String(picked);
  const indexes = Array.isArray(picked) ? picked : [picked];
  return indexes.map((index) => question.options[index]).join(", ");
}

export default function CompetitiveExamsView() {
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [checkedAnswers, setCheckedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(EXAM_DURATION_MINUTES * 60);
  const [testStarted, setTestStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    if (!testStarted || submitted) return undefined;
    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          setCheckedAnswers((previous) => ({ ...previous, ...answers }));
          setSubmitted(true);
          setTestStarted(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [testStarted, submitted, answers]);

  const score = useMemo(
    () => testQuestions.reduce((total, question, index) => total + (isAnswerCorrect(question, checkedAnswers[index]) ? 1 : 0), 0),
    [testQuestions, checkedAnswers],
  );
  const checkedCount = Object.keys(checkedAnswers).length;
  const correctCount = testQuestions.reduce((n, q, i) => n + (isAnswerCorrect(q, checkedAnswers[i]) ? 1 : 0), 0);
  const incorrectCount = testQuestions.reduce((n, q, i) => n + (checkedAnswers[i] !== undefined && !isAnswerCorrect(q, checkedAnswers[i]) ? 1 : 0), 0);
  const unansweredCount = Math.max(0, testQuestions.length - correctCount - incorrectCount);

  function startTest(exam, subject) {
    const questions = BANKS[exam.id]?.[subject] ?? [];
    setSelectedExam(exam);
    setSelectedSubject(subject);
    setTestQuestions(questions);
    setAnswers({});
    setCheckedAnswers({});
    setCurrentQuestion(0);
    setRemainingSeconds(EXAM_DURATION_MINUTES * 60);
    setSubmitted(false);
    setShowAllQuestions(false);
    setTestStarted(true);
  }

  function checkAnswer(index = currentQuestion) {
    if (answers[index] === undefined || (Array.isArray(answers[index]) && answers[index].length === 0)) return;
    setCheckedAnswers((previous) => ({ ...previous, [index]: answers[index] }));
  }

  function submitTest() {
    if (!testStarted || submitted) return;
    const finalChecked = { ...checkedAnswers, ...answers };
    setCheckedAnswers(finalChecked);
    setSubmitted(true);
    setTestStarted(false);
    const finalCorrect = testQuestions.reduce((n, q, i) => n + (isAnswerCorrect(q, finalChecked[i]) ? 1 : 0), 0);
    const finalIncorrect = testQuestions.reduce((n, q, i) => n + (finalChecked[i] !== undefined && !isAnswerCorrect(q, finalChecked[i]) ? 1 : 0), 0);
    const finalUnanswered = testQuestions.length - finalCorrect - finalIncorrect;
    setAttempts((previous) => [{
      id: `${Date.now()}-${selectedExam.id}-${selectedSubject}`,
      exam: selectedExam.title,
      subject: selectedSubject,
      score: finalCorrect,
      total: testQuestions.length,
      correct: finalCorrect,
      incorrect: finalIncorrect,
      unanswered: finalUnanswered,
      date: new Date().toLocaleString(),
    }, ...previous].slice(0, 8));
  }

  function backToExams() {
    setSelectedExam(null);
    setSelectedSubject(null);
    setTestQuestions([]);
    setAnswers({});
    setCheckedAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setTestStarted(false);
    setShowAllQuestions(false);
  }

  function restartTest() {
    if (selectedExam && selectedSubject) startTest(selectedExam, selectedSubject);
  }

  if (submitted) {
    return (
      <div className="ce-page">
        <div className="ce-topbar">
          <button className="ce-button ce-button-secondary" onClick={backToExams}><ArrowLeft size={16} /> All exams</button>
          <span className="ce-chip">RESULTS</span>
        </div>
        <section className="ce-results-hero">
          <div className="ce-hero-icon"><Trophy size={30} /></div>
          <span className="ce-eyebrow">PRACTICE COMPLETE</span>
          <h1>{selectedExam?.title}</h1>
          <p>{selectedSubject}</p>
          <div className="ce-score-number">{score}<span> / {testQuestions.length}</span></div>
          <p>{Math.round((score / Math.max(testQuestions.length, 1)) * 100)}% score</p>
        </section>
        <div className="ce-stats-grid">
          <div className="ce-stat-card"><CheckCircle2 size={20} /><strong>{correctCount}</strong><span>Correct</span></div>
          <div className="ce-stat-card"><XCircle size={20} /><strong>{incorrectCount}</strong><span>Incorrect</span></div>
          <div className="ce-stat-card"><Target size={20} /><strong>{unansweredCount}</strong><span>Unanswered</span></div>
        </div>
        <section className="ce-section">
          <div className="ce-section-heading">
            <div><h2>Answer review</h2><p>Compare your submitted answers with the correct answers and explanations.</p></div>
            <button className="ce-button ce-button-secondary" onClick={() => setShowAllQuestions((v) => !v)}>{showAllQuestions ? "Hide review" : "Show review"}</button>
          </div>
          {showAllQuestions && <div className="ce-review-list">
            {testQuestions.map((question, index) => {
              const picked = checkedAnswers[index];
              const isCorrect = picked !== undefined && picked === question.answer;
              return <article className="ce-review-card" key={`${index}-${question.question}`}>
                <div className="ce-review-status">{isCorrect ? <CheckCircle2 size={18} /> : picked === undefined ? <Target size={18} /> : <XCircle size={18} />} Question {index + 1} · {isCorrect ? "Correct" : picked === undefined ? "Unanswered" : "Incorrect"}</div>
                {question.year && <p className="ce-pyq-review-meta"><strong>{selectedExam?.id === "isro" ? "ISRO" : selectedExam?.id === "ugc-net" ? "UGC NET" : "GATE"} {question.year}{question.paper ? ` · ${question.paper}` : ""}</strong>{question.marks ? ` · ${question.marks} mark${question.marks === 1 ? "" : "s"}` : ""}</p>}
                <h3>{question.question}</h3>
                <p><strong>Your answer:</strong> {formatPickedAnswer(question, picked)}</p>
                <p><strong>Correct answer:</strong> {formatPickedAnswer(question, question.answer)}</p>
                <div className="ce-explanation">{question.explanation}</div>
              </article>;
            })}
          </div>}
        </section>
        <section className="ce-section">
          <div className="ce-section-heading"><div><h2>Recent attempts</h2><p>Your latest results in this session.</p></div></div>
          {attempts.map((attempt) => <div className="ce-attempt-row" key={attempt.id}><div><strong>{attempt.exam}</strong><p>{attempt.subject} · {attempt.date}</p></div><strong>{attempt.score}/{attempt.total}</strong></div>)}
        </section>
        <div className="ce-action-row">
          <button className="ce-button ce-button-primary" onClick={restartTest}><RotateCcw size={16} /> Try again</button>
          <button className="ce-button ce-button-secondary" onClick={backToExams}>Choose another exam <ArrowRight size={16} /></button>
        </div>
      </div>
    );
  }

  if (testStarted && testQuestions.length > 0) {
    const question = testQuestions[currentQuestion];
    const chosen = answers[currentQuestion];
    const checked = checkedAnswers[currentQuestion];
    const chosenIndexes = Array.isArray(chosen) ? chosen : chosen === undefined ? [] : [chosen];
    const correctIndexes = Array.isArray(question.answer) ? question.answer : [question.answer];
    return (
      <div className="ce-page">
        <div className="ce-topbar">
          <button className="ce-button ce-button-secondary" onClick={submitTest}>Finish test</button>
          <span className={`ce-timer ${remainingSeconds <= 60 ? "ce-timer-warning" : ""}`}><Clock3 size={16} /> {formatTime(remainingSeconds)}</span>
        </div>
        <section className="ce-test-hero">
          <span className="ce-eyebrow">{selectedExam.title} · {selectedSubject}</span>
          <h1>Practice test</h1>
          <p>Skip a question with Next, or select an answer and click Check. After checking, click Next to continue.</p>
          <div className="ce-progress-track"><div className="ce-progress-fill" style={{ width: `${((currentQuestion + 1) / testQuestions.length) * 100}%` }} /></div>
          <div className="ce-progress-label"><span>Question {currentQuestion + 1} of {testQuestions.length}</span><span>{Object.keys(answers).length} selected</span></div>
        </section>
        <section className="ce-question-card">
          <div className="ce-question-kicker">QUESTION {currentQuestion + 1}</div>
          {question.year && (
            <div className="ce-pyq-meta">
              <span className="ce-chip">{selectedExam.id === "isro" ? "ISRO" : selectedExam.id === "ugc-net" ? "UGC NET" : "GATE"} {question.year}{question.paper ? ` · ${question.paper}` : ""}</span>
              {question.marks ? <span className="ce-chip">{question.marks} mark{question.marks === 1 ? "" : "s"}</span> : null}
              {question.type ? <span className="ce-chip">{question.type}</span> : null}
            </div>
          )}
          <h2>{question.question}</h2>
          {question.type === "MSQ" && <p className="ce-source-note">Select all correct options.</p>}
          {question.type === "NAT" ? (
            <div className="ce-nat-answer">
              <label htmlFor={`ce-nat-${currentQuestion}`}>Enter your numerical answer</label>
              <input
                id={`ce-nat-${currentQuestion}`}
                className="ce-nat-input"
                style={{ width: "100%", maxWidth: "380px", minHeight: "58px", padding: "16px 18px", fontSize: "20px", marginTop: "12px", boxSizing: "border-box" }}
                type="number"
                value={chosen ?? ""}
                disabled={checked !== undefined}
                onChange={(event) => setAnswers((previous) => ({ ...previous, [currentQuestion]: event.target.value }))}
              />
            </div>
          ) : <div className="ce-options-list">
            {question.options.map((option, optionIndex) => {
              const isSelected = chosenIndexes.includes(optionIndex);
              const isCorrectOption = checked !== undefined && correctIndexes.includes(optionIndex);
              const isWrongSelected = checked !== undefined && isSelected && !correctIndexes.includes(optionIndex);
              return <button key={option} className={`ce-option ${isSelected ? "selected" : ""} ${isCorrectOption ? "correct" : ""} ${isWrongSelected ? "incorrect" : ""}`} onClick={() => {
                if (submitted || checked !== undefined) return;
                setAnswers((previous) => {
                  if (question.type === "MSQ") {
                    const current = Array.isArray(previous[currentQuestion]) ? previous[currentQuestion] : [];
                    const next = current.includes(optionIndex) ? current.filter((value) => value !== optionIndex) : [...current, optionIndex];
                    return { ...previous, [currentQuestion]: next };
                  }
                  return { ...previous, [currentQuestion]: optionIndex };
                });
              }}>
                <span className="ce-option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>
                {isCorrectOption && <CheckCircle2 size={18} />}{isWrongSelected && <XCircle size={18} />}
              </button>;
            })}
          </div>}
          {checked !== undefined && <div className={`ce-feedback ${isAnswerCorrect(question, checked) ? "ce-feedback-correct" : "ce-feedback-incorrect"}`}>
            <strong>{isAnswerCorrect(question, checked) ? "Correct answer" : "Not quite"}</strong>
            <p>{question.explanation}</p>
          </div>}
          <div className="ce-question-actions">
            <button className="ce-button ce-button-secondary" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion((v) => Math.max(0, v - 1))}><ArrowLeft size={16} /> Previous</button>
            {(() => {
              const hasChoice = chosen !== undefined && chosen !== "" && !(Array.isArray(chosen) && chosen.length === 0);
              const isLast = currentQuestion === testQuestions.length - 1;
              const label = checked !== undefined ? (isLast ? "Submit test" : "Next") : hasChoice ? "Check" : (isLast ? "Finish test" : "Next");
              return <button
                className="ce-button ce-button-primary"
                onClick={() => {
                  if (checked !== undefined) {
                    if (isLast) submitTest();
                    else setCurrentQuestion((v) => Math.min(testQuestions.length - 1, v + 1));
                  } else if (hasChoice) {
                    checkAnswer();
                  } else if (isLast) {
                    submitTest();
                  } else {
                    setCurrentQuestion((v) => Math.min(testQuestions.length - 1, v + 1));
                  }
                }}
              >{label} <ArrowRight size={16} /></button>;
            })()}
          </div>
        </section>
        <section className="ce-section">
          <div className="ce-section-heading"><div><h2>Question navigator</h2><p>Move between questions before finishing.</p></div></div>
          <div className="ce-question-navigator">{testQuestions.map((_, index) => <button key={index} className={`ce-question-number ${currentQuestion === index ? "active" : ""} ${checkedAnswers[index] !== undefined ? "answered" : answers[index] !== undefined ? "selected" : ""}`} onClick={() => setCurrentQuestion(index)}>{index + 1}</button>)}</div>
        </section>
      </div>
    );
  }

  if (selectedExam) {
    return (
      <div className="ce-page">
        <div className="ce-topbar"><button className="ce-button ce-button-secondary" onClick={backToExams}><ArrowLeft size={16} /> All exams</button><span className="ce-chip">EXAM PRACTICE</span></div>
        <section className="ce-exam-hero">
          <div className="ce-exam-icon"><selectedExam.icon size={30} /></div>
          <span className="ce-eyebrow">COMPETITIVE EXAMS</span>
          <h1>{selectedExam.title}</h1><h2>{selectedExam.subtitle}</h2><p>{selectedExam.description}</p>
          <p className="ce-source-note">{selectedExam.id === "gate" ? "Selected GATE previous-year questions are paraphrased for this practice interface; the year, paper/set and marks are retained where available." : `Question alignment: ${selectedExam.sourceLabel}. These are adapted practice questions, not verbatim official paper questions.`}</p>

        </section>
        <section className="ce-section">
          <div className="ce-section-heading"><div><h2>Choose a subject</h2><p>Each exam has its own distinct question bank for these project-related topics.</p></div></div>
          <div className="ce-subject-grid">
            {selectedExam.subjects.map((subject) => <button className="ce-subject-card" key={subject} onClick={() => startTest(selectedExam, subject)}><BookOpen size={20} /><span>{subject}</span><ArrowRight size={17} /></button>)}
          </div>
        </section>
        <section className="ce-info-banner"><Clock3 size={20} /><div><strong>Timed practice</strong><p>Each practice test has a {EXAM_DURATION_MINUTES}-minute countdown. Check answers for explanations, navigate questions, and review your result after submission.</p></div></section>
      </div>
    );
  }

  return (
    <div className="ce-page">
      <section className="ce-page-hero">
        <div className="ce-hero-icon"><GraduationCap size={30} /></div>
        <span className="ce-eyebrow">COMPETITIVE EXAM PREPARATION</span>
        <h1>Prepare. Practise. Progress.</h1>
        <p>Take distinct, project-focused practice tests aligned with DBMS, SQL, indexing, query processing, and software testing topics in competitive computer science exams.</p>
      </section>
      <section className="ce-section">
        <div className="ce-section-heading"><div><h2>Select an exam</h2><p>Each exam uses its own set of questions rather than reusing one common pool.</p></div></div>
        <div className="ce-exam-grid">
          {EXAMS.map((exam) => {
            const Icon = exam.icon;
            return <button className={`ce-exam-card ce-exam-${exam.color}`} key={exam.id} onClick={() => ["gate", "isro", "ugc-net", "nielit"].includes(exam.id) ? startTest(exam, exam.subjects[0]) : setSelectedExam(exam)}>
              <div className="ce-exam-card-icon"><Icon size={23} /></div>
              <div className="ce-exam-card-copy"><h3>{exam.title}</h3><p>{exam.subtitle}</p><span>{exam.id === "gate" ? "Start GATE PYQs" : exam.id === "isro" ? "Start ISRO PYQs" : exam.id === "ugc-net" ? "Start UGC NET DBMS PYQs" : exam.id === "nielit" ? "Start NIELIT / NIC PYQs " : `${exam.subjects.length} project-related subjects`}</span></div>
              <ArrowRight size={18} />
            </button>;
          })}
        </div>
      </section>
      {attempts.length > 0 && <section className="ce-section"><div className="ce-section-heading"><div><h2>Recent attempts</h2><p>Results from this session.</p></div></div>{attempts.map((attempt) => <div className="ce-attempt-row" key={attempt.id}><div><strong>{attempt.exam}</strong><p>{attempt.subject} · {attempt.date}</p></div><strong>{attempt.score}/{attempt.total}</strong></div>)}</section>}
    </div>
  );
}
