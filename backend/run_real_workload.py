
from app.services.real_sqlite_inspector import inspect_real_schema
from app.services.real_index_evidence import collect_real_candidate_evidence
from app.services.recommendation_engine import build_recommendations


WORKLOAD_FILE = "app/data/workload/queries.sql"


def load_workload():
    queries = []

    with open(WORKLOAD_FILE, "r", encoding="utf-8") as file:
        current_query = []

        for line in file:
            line = line.strip()

            if not line:
                continue

            if line.startswith("--"):
                if current_query:
                    queries.append(" ".join(current_query))
                    current_query = []
                continue

            current_query.append(line)

        if current_query:
            queries.append(" ".join(current_query))

    return queries


def main():
    schema = inspect_real_schema()
    queries = load_workload()

    print("=" * 80)
    print("REAL CHINOOK WORKLOAD")
    print("=" * 80)

    for number, query in enumerate(queries, start=1):
        print(f"\nQ{number}")
        print("-" * 80)
        print(query)

        try:
            result = build_recommendations(
                query,
                schema,
                collect_real_candidate_evidence,
            )

            print("\nRecommendations:")

            if not result.recommendations:
                print("  None")

            for recommendation in result.recommendations:
                print(
                    f"  {recommendation.table}"
                    f"({', '.join(recommendation.columns)})"
                    f" -> {recommendation.recommendation}"
                )

                print(
                    f"     - Priority: {recommendation.priority}"
                )

                for reason in recommendation.reasons:
                    print(f"     - {reason}")

            print("\nRejected candidates:")

            if not result.rejected_candidates:
                print("  None")

            for candidate in result.rejected_candidates:
                print(
                    f"  {candidate.table}"
                    f"({', '.join(candidate.columns)})"
                    f" -> {candidate.reason}"
                )

        except Exception as error:
            print(f"\nERROR TYPE: {type(error).__name__}")
            print(f"ERROR DETAILS: {error}")


if __name__ == "__main__":
    main()
