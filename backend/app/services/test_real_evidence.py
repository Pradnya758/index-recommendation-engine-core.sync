
from app.services.real_index_evidence import collect_real_candidate_evidence
from app.services.sql_analyzer import extract_query_features


def test_real_candidate_evidence():
    query = """
    SELECT *
    FROM Customer
    WHERE Country = 'USA'
    """

    schema_columns = {
        "Customer": {
            "CustomerId",
            "FirstName",
            "LastName",
            "Company",
            "Address",
            "City",
            "State",
            "Country",
            "PostalCode",
            "Phone",
            "Fax",
            "Email",
            "SupportRepId",
        }
    }

    features = extract_query_features(query, schema_columns)

    evidence = collect_real_candidate_evidence(
        query=query,
        table="Customer",
        columns=("Country",),
        features=features,
    )

    print("Experiment succeeded:", evidence.experiment_succeeded)
    print("Table:", evidence.table)
    print("Columns:", evidence.columns)
    print("Rows:", evidence.table_row_count)
    print("Baseline plan:", evidence.baseline_plan)
    print("Candidate plan:", evidence.candidate_plan)
    print("Candidate used:", evidence.candidate_used)
    print("Scan replaced by search:", evidence.scan_replaced_by_search)
    print("Temporary B-tree removed:", evidence.temp_btree_removed)
    print("Plan changed:", evidence.plan_changed)
    print("Error:", evidence.error)

    assert evidence.experiment_succeeded, evidence.error
    assert evidence.table == "Customer"
    assert evidence.columns == ("Country",)
