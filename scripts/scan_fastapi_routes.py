#!/usr/bin/env python3
"""
Scan FastAPI routers under apps/api/src/*/routes.py and emit a concise
inventory of endpoints plus auth/CORS/OpenAPI notes.

Outputs:
  - docs/api/inventory.local.md
  - docs/api/auth.local.md

AST-based and handles multi-line decorators. Collects:
  - Router prefix and tags
  - Each @router.<method>("/path", summary=..., dependencies=[...])
  - Function name, status_code, response_model
  - Basic parameter names/types and Depends() usage
  - Global CORS/OpenAPI settings from apps/api/main.py
"""

from __future__ import annotations

import ast
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

ROOT = Path(__file__).resolve().parents[1]
API_SRC = ROOT / "apps" / "api" / "src"


def literal_str(node: ast.AST) -> Optional[str]:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):  # f-string -> best effort
        parts: List[str] = []
        for v in node.values:
            if isinstance(v, ast.Constant) and isinstance(v.value, str):
                parts.append(v.value)
            else:
                parts.append("{expr}")
        return "".join(parts)
    return None


def name_of(node: ast.AST) -> Optional[str]:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        base = name_of(node.value)
        return f"{base}.{node.attr}" if base else node.attr
    return None


@dataclass
class Endpoint:
    method: str
    path: str
    full_path: str
    function: str
    summary: Optional[str] = None
    response_model: Optional[str] = None
    status_code: Optional[str] = None
    params: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)


@dataclass
class RouterInfo:
    file: Path
    prefix: str
    tags: List[str]
    endpoints: List[Endpoint] = field(default_factory=list)


def parse_router(path: Path) -> RouterInfo:
    src = path.read_text(encoding="utf-8")
    mod = ast.parse(src, filename=str(path))

    prefix = ""
    tags: List[str] = []

    # Find router = APIRouter(prefix="...", tags=[...])
    for node in ast.walk(mod):
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id == "router" and isinstance(node.value, ast.Call):
                    fn = node.value.func
                    if isinstance(fn, ast.Name) and fn.id == "APIRouter":
                        for kw in node.value.keywords:
                            if kw.arg == "prefix":
                                v = literal_str(kw.value)
                                if v:
                                    prefix = v
                            if kw.arg == "tags" and isinstance(kw.value, ast.List):
                                vals = []
                                for e in kw.value.elts:
                                    s = literal_str(e)
                                    if s:
                                        vals.append(s)
                                tags = vals

    endpoints: List[Endpoint] = []

    def collect_deps_from_kw(call: ast.Call) -> List[str]:
        out: List[str] = []
        for kw in call.keywords:
            if kw.arg == "dependencies" and isinstance(kw.value, (ast.List, ast.Tuple)):
                for e in kw.value.elts:
                    if isinstance(e, ast.Call) and name_of(e.func) and name_of(e.func).endswith("Depends"):
                        if e.args:
                            out.append(name_of(e.args[0]) or "Depends(?)")
                        else:
                            out.append("Depends")
        return out

    def collect_deps_from_params(fn: ast.AST) -> List[str]:
        out: List[str] = []
        args = getattr(fn, "args", None)
        if not args:
            return out
        all_args = list(getattr(args, "args", [])) + list(getattr(args, "kwonlyargs", []))
        defaults = list(getattr(args, "defaults", [])) + list(getattr(args, "kw_defaults", []))
        pad = [None] * (len(all_args) - len(defaults))
        defaults = pad + defaults
        for a, d in zip(all_args, defaults):
            if isinstance(d, ast.Call) and name_of(d.func) and name_of(d.func).endswith("Depends"):
                if d.args:
                    out.append(name_of(d.args[0]) or "Depends(?)")
                else:
                    out.append("Depends")
        return out

    def render_param(p: ast.arg, ann: Optional[ast.AST]) -> str:
        t = None
        if ann is not None:
            t = name_of(ann)
        return f"{p.arg}: {t or 'Any'}"

    for node in ast.walk(mod):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        for dec in node.decorator_list:
            if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                recv = dec.func.value
                if isinstance(recv, ast.Name) and recv.id == "router" and dec.func.attr.lower() in {"get","post","put","patch","delete","add_api_route"}:
                    method = dec.func.attr.upper()
                    path_str = None
                    summary = None
                    resp_model = None
                    status_code = None
                    for i, arg in enumerate(dec.args):
                        if i == 0:
                            path_str = literal_str(arg) or "<dynamic>"
                    for kw in dec.keywords:
                        if kw.arg == "summary":
                            summary = literal_str(kw.value)
                        elif kw.arg == "response_model":
                            resp_model = name_of(kw.value)
                        elif kw.arg == "status_code":
                            if isinstance(kw.value, ast.Constant):
                                status_code = str(kw.value.value)
                            else:
                                status_code = name_of(kw.value)

                    fn_params = []
                    for a in node.args.args:
                        fn_params.append(render_param(a, a.annotation))

                    deps = set(collect_deps_from_kw(dec)) | set(collect_deps_from_params(node))

                    full_path = "/".join([prefix.strip("/"), (path_str or "").strip("/")]).strip("/")
                    full_path = "/" + full_path if full_path else prefix or "/"

                    endpoints.append(
                        Endpoint(
                            method=method,
                            path=path_str or "",
                            full_path=full_path,
                            function=node.name,
                            summary=summary,
                            response_model=resp_model,
                            status_code=status_code,
                            params=fn_params,
                            dependencies=sorted(deps),
                        )
                    )

    return RouterInfo(file=path, prefix=prefix or "", tags=tags, endpoints=endpoints)


def scan_main_config():
    main_py = ROOT / "apps" / "api" / "main.py"
    cfg = {"docs_url": None, "redoc_url": None, "openapi_url": None, "cors": {}}
    if not main_py.exists():
        return cfg
    mod = ast.parse(main_py.read_text(encoding="utf-8"), filename=str(main_py))
    # Find FastAPI(...)
    for node in ast.walk(mod):
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
            if isinstance(node.value.func, ast.Name) and node.value.func.id == "FastAPI":
                for kw in node.value.keywords:
                    if kw.arg in {"docs_url", "redoc_url", "openapi_url"}:
                        cfg[kw.arg] = literal_str(kw.value)
        # app.add_middleware(CORSMiddleware, ...)
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            call = node.value
            if isinstance(call.func, ast.Attribute) and call.func.attr == "add_middleware":
                if call.args and name_of(call.args[0]) and name_of(call.args[0]).endswith("CORSMiddleware"):
                    for kw in call.keywords:
                        v = None
                        if isinstance(kw.value, ast.Constant):
                            v = kw.value.value
                        elif isinstance(kw.value, (ast.List, ast.Tuple)):
                            items = []
                            for e in kw.value.elts:
                                s = literal_str(e)
                                if s is not None:
                                    items.append(s)
                            v = items
                        elif isinstance(kw.value, ast.Name):
                            v = kw.value.id
                        cfg["cors"][kw.arg] = v
    return cfg


def ensure_dir(p: Path) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)


def main():
    router_files = sorted(Path(API_SRC).glob("*/routes.py"))
    routers = [parse_router(p) for p in router_files]
    cors_openapi = scan_main_config()

    inv_md = ["# Backend API Inventory (local scan)", ""]
    for r in routers:
        inv_md.append(f"## {r.prefix or '/'} — {r.file}")
        if r.tags:
            inv_md.append(f"- Tags: {', '.join(r.tags)}")
        inv_md.append(f"- Endpoints: {len(r.endpoints)}")
        if not r.endpoints:
            inv_md.append("- Note: No endpoints detected (check parsing)\n")
            continue
        inv_md.append("")
        inv_md.append("method path — function [status] → response_model")
        inv_md.append("- Params | Dependencies | Summary")
        for ep in r.endpoints:
            line = f"- {ep.method:5} {ep.full_path:40} — {ep.function}"
            if ep.status_code:
                line += f" [{ep.status_code}]"
            if ep.response_model:
                line += f" → {ep.response_model}"
            inv_md.append(line)
            p = ", ".join(ep.params) or "(none)"
            d = ", ".join(ep.dependencies) or "(none)"
            s = ep.summary or ""
            inv_md.append(f"  - Params: {p}")
            inv_md.append(f"  - Deps: {d}")
            if s:
                inv_md.append(f"  - Summary: {s}")
        inv_md.append("")

    auth_md = ["# Auth, CORS, and OpenAPI (local scan)", ""]
    # Basic auth hints by AST for security usage
    security_hints: List[str] = []
    for py in API_SRC.rglob("*.py"):
        try:
            mod = ast.parse(py.read_text(encoding="utf-8"), filename=str(py))
        except Exception:
            continue
        for node in ast.walk(mod):
            if isinstance(node, ast.Name) and node.id in {"OAuth2PasswordBearer", "HTTPBearer", "APIKeyHeader", "APIKeyQuery"}:
                security_hints.append(f"{node.id} in {py}")
            if isinstance(node, ast.Attribute) and node.attr in {"OAuth2PasswordBearer", "HTTPBearer"}:
                security_hints.append(f"{node.attr} in {py}")
    auth_md.append("## Security")
    if security_hints:
        for h in sorted(set(security_hints)):
            auth_md.append(f"- {h}")
    else:
        auth_md.append("- No explicit FastAPI security dependencies (OAuth2/JWT/APIKey) detected in source.")
        auth_md.append("- Likely unauthenticated APIs for now or auth handled upstream (e.g., reverse proxy/session).")

    auth_md.append("")
    auth_md.append("## CORS (apps/api/main.py)")
    auth_md.append(f"- docs_url: {cors_openapi.get('docs_url')}")
    auth_md.append(f"- redoc_url: {cors_openapi.get('redoc_url')}")
    auth_md.append(f"- openapi_url: {cors_openapi.get('openapi_url') or '/openapi.json (default)'}")
    if cors_openapi.get("cors"):
        for k, v in cors_openapi["cors"].items():
            auth_md.append(f"- {k}: {v}")

    out1 = ROOT / "docs" / "api" / "inventory.local.md"
    out2 = ROOT / "docs" / "api" / "auth.local.md"
    ensure_dir(out1)
    out1.write_text("\n".join(inv_md) + "\n", encoding="utf-8")
    ensure_dir(out2)
    out2.write_text("\n".join(auth_md) + "\n", encoding="utf-8")
    print(f"Wrote {out1}\nWrote {out2}")


if __name__ == "__main__":
    main()

