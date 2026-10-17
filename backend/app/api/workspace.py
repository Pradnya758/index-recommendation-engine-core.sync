
import secrets
import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.sql_workspace import (
    WorkspaceError,
    create_workspace,
    execute_workspace_sql,
    explain_workspace_query,
    inspect_workspace_schema,
)

router = APIRouter(prefix="/workspace", tags=["SQL Workspace"])

# In-memory connections are kept alive while the API process is running.
# A random token is required to access each workspace.
_workspaces: dict[str, sqlite3.Connection] = {}


class CreateWorkspaceResponse(BaseModel):
    session_id: str
    workspace_schema: dict[str, Any] = Field(serialization_alias="schema")


class ExecuteRequest(BaseModel):
    session_id: str = Field(min_length=32, max_length=128)
    sql: str = Field(min_length=1, max_length=20_000)
    parameters: list[Any] = Field(default_factory=list)


class WorkspaceQueryRequest(BaseModel):
    session_id: str = Field(min_length=32, max_length=128)
    query: str = Field(min_length=1, max_length=20_000)


def _get_workspace(session_id: str) -> sqlite3.Connection:
    connection = _workspaces.get(session_id)

    if connection is None:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found. Create a new workspace first.",
        )

    return connection



import secrets
import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.sql_workspace import (
    WorkspaceError,
    create_workspace,
    execute_workspace_sql,
    explain_workspace_query,
    inspect_workspace_schema,
)

router = APIRouter(prefix="/workspace", tags=["SQL Workspace"])

# In-memory connections are kept alive while the API process is running.
# A random token is required to access each workspace.
_workspaces: dict[str, sqlite3.Connection] = {}


class CreateWorkspaceResponse(BaseModel):
    session_id: str
    workspace_schema: dict[str, Any] = Field(serialization_alias="schema")


class ExecuteRequest(BaseModel):
    session_id: str = Field(min_length=32, max_length=128)
    sql: str = Field(min_length=1, max_length=20_000)
    parameters: list[Any] = Field(default_factory=list)


class WorkspaceQueryRequest(BaseModel):
    session_id: str = Field(min_length=32, max_length=128)
    query: str = Field(min_length=1, max_length=20_000)


def _get_workspace(session_id: str) -> sqlite3.Connection:
    connection = _workspaces.get(session_id)

    if connection is None:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found. Create a new workspace first.",
        )

    return connection


@router.post("", response_model=CreateWorkspaceResponse, status_code=201)
def create_new_workspace() -> CreateWorkspaceResponse:
    try:
        connection = create_workspace()
        session_id = secrets.token_urlsafe(32)
        _workspaces[session_id] = connection

        return CreateWorkspaceResponse(
    session_id=session_id,
    workspace_schema=inspect_workspace_schema(connection)
    )
    except Exception as error:
        raise HTTPException(
        status_code=500,
        detail=f"Could not create a workspace: {type(error).__name__}: {error}"
        ) from error
    
@router.get("/{session_id}/schema")
def get_workspace_schema(session_id: str) -> dict[str, Any]:
    connection = _get_workspace(session_id)

    try:
        return inspect_workspace_schema(connection)
    except sqlite3.Error as error:
        raise HTTPException(
            status_code=400,
            detail="Could not inspect workspace schema.",
        ) from error

@router.post("/execute")
def execute_sql(request: ExecuteRequest) -> dict[str, Any]:
    connection = _get_workspace(request.session_id)

    try:
        return execute_workspace_sql(
            connection,
            request.sql,
            request.parameters,
        )
    except WorkspaceError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

@router.delete("/{session_id}", status_code=204)
def delete_workspace(session_id: str) -> None:
    connection = _get_workspace(session_id)

    try:
        connection.close()
    finally:
        _workspaces.pop(session_id, None)

@router.post("/query-plan")
def explain_query(request: WorkspaceQueryRequest) -> dict[str, Any]:
    connection = _get_workspace(request.session_id)

    try:
        return explain_workspace_query(connection, request.query)
    except WorkspaceError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error






