#!/usr/bin/env python3
"""
Script de Validação de Segurança de Bibliotecas Externas
Audita dependências do Backend (Python via pip-audit) e Frontend (Node via npm audit).
"""

import sys
import json
import subprocess
import os
from typing import Dict, Any, Optional, List


def parse_pip_audit_json(data: Any) -> Dict[str, Any]:
    """
    Interpreta o JSON gerado pelo pip-audit e consolida os dados de vulnerabilidade.
    """
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = data.get("dependencies", [])
    else:
        return {
            "status": "error",
            "total_vulnerabilities": 0,
            "packages_affected": 0,
            "vulnerabilities": [],
            "error": "Formato de dados inválido",
        }

    vulnerabilities: List[Dict[str, Any]] = []
    affected_packages = 0

    for dep in items:
        pkg_name = dep.get("name", "desconhecido")
        pkg_version = dep.get("version", "desconhecido")
        vulns = dep.get("vulns", [])

        if vulns:
            affected_packages += 1
            for v in vulns:
                vulnerabilities.append({
                    "package": pkg_name,
                    "version": pkg_version,
                    "id": v.get("id"),
                    "fix_versions": v.get("fix_versions", []),
                    "description": v.get("description", ""),
                    "aliases": v.get("aliases", []),
                })

    return {
        "status": "vulnerable" if vulnerabilities else "clean",
        "total_vulnerabilities": len(vulnerabilities),
        "packages_affected": affected_packages,
        "vulnerabilities": vulnerabilities,
    }


def parse_npm_audit_json(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Interpreta o JSON gerado pelo npm audit e consolida os dados de vulnerabilidade.
    """
    if not isinstance(data, dict):
        return {
            "status": "error",
            "total_vulnerabilities": 0,
            "summary": {"info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0},
            "vulnerabilities": [],
            "error": "Formato de dados inválido",
        }

    metadata = data.get("metadata", {})
    vuln_meta = metadata.get("vulnerabilities", {})
    total = vuln_meta.get("total", 0)

    vuln_map = data.get("vulnerabilities", {})
    items: List[Dict[str, Any]] = []

    for name, details in vuln_map.items():
        if isinstance(details, dict):
            severity = details.get("severity", "unknown")
            via = details.get("via", [])
            titles = []
            urls = []
            for item in via:
                if isinstance(item, dict):
                    titles.append(item.get("title", ""))
                    urls.append(item.get("url", ""))
                elif isinstance(item, str):
                    titles.append(f"depende de {item}")

            items.append({
                "package": name,
                "severity": severity,
                "titles": [t for t in titles if t],
                "urls": [u for u in urls if u],
                "is_direct": details.get("isDirect", False),
            })

    summary = {
        "info": vuln_meta.get("info", 0),
        "low": vuln_meta.get("low", 0),
        "moderate": vuln_meta.get("moderate", 0),
        "high": vuln_meta.get("high", 0),
        "critical": vuln_meta.get("critical", 0),
        "total": total,
    }

    return {
        "status": "vulnerable" if total > 0 else "clean",
        "total_vulnerabilities": total,
        "summary": summary,
        "vulnerabilities": items,
    }


def run_pip_audit(requirements_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Executa pip-audit localmente ou dentro do container Docker caso não instalado no host.
    """
    cmd = ["pip-audit", "-f", "json"]
    if requirements_path and os.path.exists(requirements_path):
        cmd.extend(["-r", requirements_path])

    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        raw_output = proc.stdout.strip()
        if raw_output:
            data = json.loads(raw_output)
            return parse_pip_audit_json(data)
    except FileNotFoundError:
        pass
    except json.JSONDecodeError:
        pass

    # Fallback: tentar executar dentro do container Docker blog_backend
    try:
        docker_cmd = ["docker", "exec", "blog_backend", "pip-audit", "-f", "json"]
        proc = subprocess.run(docker_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        raw_output = proc.stdout.strip()
        if raw_output:
            data = json.loads(raw_output)
            return parse_pip_audit_json(data)
    except Exception:
        pass

    return {
        "status": "error",
        "total_vulnerabilities": 0,
        "error": "O utilitário 'pip-audit' não foi encontrado nem localmente nem via container Docker 'blog_backend'.",
        "vulnerabilities": [],
    }


def run_npm_audit(frontend_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Executa npm audit no diretório do frontend ou via container Docker caso npm não esteja no ambiente.
    """
    target_dir = frontend_dir or os.getcwd()
    cmd = ["npm", "audit", "--json"]
    is_windows = os.name == "nt"

    try:
        proc = subprocess.run(
            cmd,
            cwd=target_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=is_windows,
        )
        raw_output = proc.stdout.strip()
        if raw_output:
            data = json.loads(raw_output)
            return parse_npm_audit_json(data)
    except FileNotFoundError:
        pass
    except json.JSONDecodeError:
        pass

    # Fallback: tentar executar dentro do container Docker blog_frontend
    try:
        docker_cmd = ["docker", "exec", "blog_frontend", "npm", "audit", "--json"]
        proc = subprocess.run(docker_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        raw_output = proc.stdout.strip()
        if raw_output:
            data = json.loads(raw_output)
            return parse_npm_audit_json(data)
    except Exception:
        pass

    return {
        "status": "error",
        "total_vulnerabilities": 0,
        "summary": {"info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0},
        "error": "O comando 'npm' não foi encontrado nem localmente nem via container Docker 'blog_frontend'.",
        "vulnerabilities": [],
    }


def format_security_report(backend_res: Dict[str, Any], frontend_res: Dict[str, Any]) -> str:
    """
    Monta um relatório legível em texto puro com destaques para terminal e logs.
    """
    lines = [
        "============================================================",
        "   RELATÓRIO DE AUDITORIA DE SEGURANÇA DE BIBLIOTECAS       ",
        "============================================================",
        "",
        "--- BACKEND (Python / pip-audit) ---",
    ]

    if backend_res.get("status") == "error":
        lines.append(f"  [ERRO] Não foi possível concluir a auditoria: {backend_res.get('error')}")
    elif backend_res.get("status") == "clean":
        lines.append("  [OK] Nenhuma vulnerabilidade conhecida foi detectada no Backend.")
    else:
        total = backend_res.get("total_vulnerabilities", 0)
        pkgs = backend_res.get("packages_affected", 0)
        lines.append(f"  [ALERTA] Encontradas {total} vulnerabilidades em {pkgs} pacote(s):")
        for v in backend_res.get("vulnerabilities", [])[:10]:
            fix = ", ".join(v.get("fix_versions", [])) or "Sem correção listada"
            lines.append(f"   * Pacote {v['package']} ({v['version']}) -> {v['id']} | Correção: {fix}")
        if total > 10:
            lines.append(f"   ... e mais {total - 10} vulnerabilidades adicionais.")

    lines.extend([
        "",
        "--- FRONTEND (Node / npm audit) ---",
    ])

    if frontend_res.get("status") == "error":
        lines.append(f"  [ERRO] Não foi possível concluir a auditoria: {frontend_res.get('error')}")
    elif frontend_res.get("status") == "clean":
        lines.append("  [OK] Nenhuma vulnerabilidade detectada no Frontend.")
    else:
        summary = frontend_res.get("summary", {})
        lines.append(
            f"  [ALERTA] Total de {summary.get('total', 0)} vulnerabilidades encontradas: "
            f"Críticas: {summary.get('critical', 0)} | Altas: {summary.get('high', 0)} | "
            f"Moderadas: {summary.get('moderate', 0)} | Baixas: {summary.get('low', 0)}"
        )
        for item in frontend_res.get("vulnerabilities", [])[:8]:
            title = (item["titles"][0] if item["titles"] else "Advisory de segurança")[:60]
            lines.append(f"   * {item['package']} [{item['severity'].upper()}]: {title}")
        if len(frontend_res.get("vulnerabilities", [])) > 8:
            lines.append(f"   ... e mais {len(frontend_res.get('vulnerabilities', [])) - 8} pacotes.")

    lines.extend([
        "",
        "============================================================",
    ])
    return "\n".join(lines)


def run_full_security_audit(
    requirements_path: Optional[str] = None,
    frontend_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executa auditoria completa em Backend e Frontend e retorna dicionário consolidado.
    """
    b_res = run_pip_audit(requirements_path)
    f_res = run_npm_audit(frontend_dir)

    is_clean = (
        b_res.get("status") == "clean" and
        f_res.get("status") == "clean"
    )

    return {
        "passed": is_clean,
        "backend": b_res,
        "frontend": f_res,
        "report": format_security_report(b_res, f_res),
    }


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))

    req_file = os.path.join(root_dir, "backend", "requirements.txt")
    front_dir = os.path.join(root_dir, "frontend")

    audit_result = run_full_security_audit(req_file, front_dir)
    print(audit_result["report"])

    if "--json" in sys.argv:
        print(json.dumps({
            "passed": audit_result["passed"],
            "backend_vulns": audit_result["backend"].get("total_vulnerabilities", 0),
            "frontend_vulns": audit_result["frontend"].get("total_vulnerabilities", 0),
        }, indent=2))

    if "--strict" in sys.argv and not audit_result["passed"]:
        sys.exit(1)
    sys.exit(0)
