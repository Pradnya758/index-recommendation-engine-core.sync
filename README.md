# Index Recommendation Engine

An interactive DBMS learning application that analyzes SQLite `SELECT` queries and recommends suitable indexes using transparent, rule-based scoring. It combines query analysis, explanations, and visualizations to make indexing decisions easier to understand.

## Overview

Choosing a useful database index requires reasoning about filters, joins, sorting, grouping, primary keys, and existing indexes. This can be difficult for learners because the database's decision-making is often hidden. The Index Recommendation Engine makes that process visible by analyzing a query, explaining its recommendation, and illustrating related query-execution and indexing concepts.

## Objectives

- Analyze SQL queries for index-relevant features.
- Identify possible single-column and composite index candidates.
- Rank candidates with transparent, rule-based scoring.
- Explain why an index is recommended or rejected.
- Visualize indexing and query-execution concepts.

## How It Works

```text
SQL Query
    |
    v
Validation & Parsing
    |
    v
Feature Extraction
    |
    v
Index Candidate Generation
    |
    v
Rule-Based Scoring & Ranking
    |
    v
Index Recommendation
    |
    v
Query Plan & Visualization
```

The application validates a single SQLite `SELECT` query and uses SQLGlot to parse it into a structured form. It extracts index-relevant features, generates and ranks candidates with deterministic rules, checks for redundant indexes, and presents the recommendation alongside the SQLite query plan and educational visualizations.

## Key Features

- SQL query analysis
- Explainable index recommendations
- Transparent candidate scoring
- Query-plan analysis
- Interactive execution-flow, table-scan, B+ tree, and plan-comparison visualizations
- Learning resources and examples
- Knowledge testing
- AI Tutor for concept explanations
- Analysis history
- JSON and report export

## Screenshots

<!-- TODO: Add 2-4 repository-hosted screenshots of the home, analysis, visualization, and learning interfaces. -->

## Technology Stack

**Frontend**

- React
- CSS and JavaScript
- D3.js

**Backend**

- Python
- FastAPI

**SQL Parsing**

- SQLGlot

**Database**

- SQLite

**Testing**

- Pytest

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Pradnya758/index-recommendation-engine-core.sync.git
cd index-recommendation-engine-core.sync
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

From the project root, create and activate a virtual environment, then install the requirements.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### 4. Start the backend

From the `backend` directory with the virtual environment activated:

```powershell
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

### 5. Start the frontend

In a second terminal from the project root:

```bash
cd frontend
npm run dev
```

### 6. Open the application

Visit `http://127.0.0.1:5173` in a browser. The Vite development server forwards `/api` requests to the backend on port `8000`.

## Documentation

- [Recommendation Algorithm](docs/ALGORITHM.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Visualizations](docs/VISUALIZATION.md)
- [Testing](docs/TESTING.md)
- [User Manual](docs/USER_MANUAL.md)

## Project Structure

```text
frontend/       React interface and visualizations
backend/        FastAPI application, engine, and tests
docs/           Technical and user documentation
README.md       Project overview and setup
```

## Team

| Role | Name | Register Number / Designation |
| --- | --- | --- |
| Team Member | Pradnya Lakshmi J R | 25BCE5165 |
| Team Member | Rindhu Anchuri | 25BCE1800 |
| Guided By | Dr. Swaminathan A | Assistant Professor |

## AI-Assisted Development

AI tools were used as development assistants for coding support, debugging and technical guidance. The project concepts, requirements, design decisions, recommendation methodology, testing and final implementation were reviewed and validated by the developers.

## Conclusion

The Index Recommendation Engine turns index selection into a visible, explainable learning process. It helps learners connect SQL query structure with index candidates, query plans, and the trade-offs behind database indexing decisions.