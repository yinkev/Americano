#!/usr/bin/env python3
"""
Example MLflow analysis script for Americano.

Demonstrates:
- Configuring tracking URI and experiment
- Starting a run and logging params/metrics/artifacts
- Tagging run with provenance (git commit, DVC hash)
- Linking the run to Prisma's AnalysisRun via PostgreSQL

This script is defensive: if optional dependencies (e.g., matplotlib) or
database connectivity are missing, it will continue and log useful warnings.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import pathlib
import subprocess
import sys
import time
from dataclasses import dataclass

import mlflow
import numpy as np
import pandas as pd
from dotenv import load_dotenv

try:
    from sqlalchemy import create_engine, text
    HAVE_SQLA = True
except Exception:  # pragma: no cover - optional
    HAVE_SQLA = False

try:  # optional plotting
    import matplotlib.pyplot as plt  # type: ignore
    HAVE_MPL = True
except Exception:  # pragma: no cover - optional
    HAVE_MPL = False


def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def get_env(name: str, default: str | None = None) -> str | None:
    val = os.getenv(name, default)
    return val


def run_cmd(cmd: list[str]) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(
            cmd, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except Exception as e:  # pragma: no cover - subprocess fallback
        return 1, "", str(e)


def git_commit_sha() -> str | None:
    code, out, _ = run_cmd(["git", "rev-parse", "HEAD"])
    return out if code == 0 else None


def dvc_lock_hash() -> str | None:
    lock_path = pathlib.Path("dvc.lock")
    if not lock_path.exists():
        return None
    data = lock_path.read_bytes()
    return hashlib.sha256(data).hexdigest()


@dataclass
class DBLinkConfig:
    enabled: bool
    database_url: str | None
    table: str = '"AnalysisRun"'  # Prisma default quoted identifier
    create_if_missing: bool = True


def link_run_to_db(cfg: DBLinkConfig, analysis_run_id: str, mlflow_run_id: str) -> None:
    if not cfg.enabled:
        logging.info("DB link disabled; skipping AnalysisRun link")
        return
    if not HAVE_SQLA:
        logging.warning("sqlalchemy not installed; cannot link AnalysisRun to DB")
        return
    if not cfg.database_url:
        logging.warning("DATABASE_URL not set; cannot link AnalysisRun to DB")
        return

    engine = create_engine(cfg.database_url)
    with engine.begin() as conn:
        # Try update first (if record exists), else insert (if allowed)
        updated = False
        try:
            sql_update = text(
                f"UPDATE {cfg.table} SET \"mlflowRunId\" = :run_id WHERE \"id\" = :id"
            )
            res = conn.execute(sql_update, {"run_id": mlflow_run_id, "id": analysis_run_id})
            updated = res.rowcount > 0
            if updated:
                logging.info("Linked MLflow run to existing AnalysisRun id=%s", analysis_run_id)
        except Exception as e:
            logging.warning("Update failed: %s", e)

        if not updated and cfg.create_if_missing:
            try:
                # Minimal insert; adjust columns as needed for your schema
                sql_insert = text(
                    f"""
                    INSERT INTO {cfg.table} ("id", "mlflowRunId", "status")
                    VALUES (:id, :run_id, COALESCE(:status, 'COMPLETED'))
                    ON CONFLICT ("id") DO UPDATE SET "mlflowRunId" = EXCLUDED."mlflowRunId"
                    """
                )
                conn.execute(sql_insert, {"id": analysis_run_id, "run_id": mlflow_run_id, "status": "COMPLETED"})
                logging.info("Inserted AnalysisRun id=%s and linked MLflow run", analysis_run_id)
            except Exception as e:
                logging.warning("Insert failed (schema mismatch?). Please adjust SQL: %s", e)


def log_example_artifacts(artifact_dir: pathlib.Path) -> None:
    artifact_dir.mkdir(parents=True, exist_ok=True)

    # Save a small JSON artifact
    meta = {"created_at": int(time.time()), "note": "Americano example run"}
    (artifact_dir / "run_meta.json").write_text(json.dumps(meta, indent=2))

    # Save a CSV of a fake learning curve
    steps = np.arange(0, 11)
    losses = np.exp(-steps / 5.0) + 0.02 * np.random.randn(len(steps))
    df = pd.DataFrame({"step": steps, "loss": losses})
    df.to_csv(artifact_dir / "learning_curve.csv", index=False)

    # Optional: save a plot if matplotlib is present
    if HAVE_MPL:
        try:
            fig, ax = plt.subplots(figsize=(5, 3))
            ax.plot(steps, losses, marker="o")
            ax.set_title("Learning Curve (loss vs step)")
            ax.set_xlabel("step")
            ax.set_ylabel("loss")
            fig.tight_layout()
            mlflow.log_figure(fig, "plots/learning_curve.png")
            plt.close(fig)
        except Exception as e:  # pragma: no cover
            logging.warning("Failed to log matplotlib figure: %s", e)

    # Log the directory of basic artifacts
    mlflow.log_artifacts(str(artifact_dir), artifact_path="artifacts")


def main() -> int:
    load_dotenv(override=False)
    configure_logging(get_env("LOG_LEVEL", "INFO"))

    parser = argparse.ArgumentParser(description="Americano MLflow analysis example")
    parser.add_argument("--run-name", default="day4-research-demo", help="MLflow run name")
    parser.add_argument("--analysis-run-id", default=None, help="Existing AnalysisRun.id to link")
    parser.add_argument("--model-type", default=os.getenv("MODEL_TYPE", "logistic_regression"))
    parser.add_argument("--learning-rate", type=float, default=0.05)
    parser.add_argument("--epochs", type=int, default=10)
    args = parser.parse_args()

    tracking_uri = get_env("MLFLOW_TRACKING_URI", "http://localhost:5000")
    experiment_name = get_env("MLFLOW_EXPERIMENT_NAME", "Americano/Research")
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(experiment_name)
    logging.info("Using MLflow tracking URI: %s", tracking_uri)

    # Provenance
    commit = git_commit_sha()
    dvc_hash = dvc_lock_hash()

    with mlflow.start_run(run_name=args.run_name) as run:
        run_id = run.info.run_id
        logging.info("Started MLflow run: %s", run_id)

        # Tags for provenance and cross-linking
        mlflow.set_tags(
            {
                "service": "americano-ml-service",
                "analysis_run_id": args.analysis_run_id or "",
                "git.commit": commit or "unknown",
                "dvc.lock.sha256": dvc_hash or "missing",
                "env": get_env("ENVIRONMENT", "development"),
            }
        )

        # Parameters
        mlflow.log_params(
            {
                "model_type": args.model_type,
                "learning_rate": args.learning_rate,
                "epochs": args.epochs,
            }
        )

        # Metrics (log over steps so the UI shows a curve)
        np.random.seed(42)
        best_acc = 0.0
        for step in range(args.epochs):
            acc = 0.6 + 0.4 * (1 - np.exp(-step / 5.0)) + 0.01 * np.random.randn()
            loss = float(np.exp(-(step + 1) / 5.0))
            best_acc = max(best_acc, acc)
            mlflow.log_metric("accuracy", float(acc), step=step)
            mlflow.log_metric("loss", float(loss), step=step)

        mlflow.log_metric("best_accuracy", float(best_acc))

        # Artifacts
        artifacts_dir = pathlib.Path("./data/mlflow/examples") / run_id
        log_example_artifacts(artifacts_dir)

        # Optional DB link to Prisma's AnalysisRun
        db_cfg = DBLinkConfig(
            enabled=bool(args.analysis_run_id),
            database_url=get_env("DATABASE_URL"),
        )
        if args.analysis_run_id:
            try:
                link_run_to_db(db_cfg, args.analysis_run_id, run_id)
            except Exception as e:
                logging.warning("Failed to link AnalysisRun: %s", e)

        logging.info("Run complete: %s", run_id)

    return 0


if __name__ == "__main__":
    sys.exit(main())

