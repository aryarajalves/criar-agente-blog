import pytest
from unittest.mock import patch, MagicMock
from scripts.validate_security import (
    parse_pip_audit_json,
    parse_npm_audit_json,
    format_security_report,
    run_pip_audit,
    run_npm_audit,
    run_full_security_audit,
)


def test_parse_pip_audit_json_clean():
    clean_data = {
        "dependencies": [
            {"name": "fastapi", "version": "0.110.0", "vulns": []},
            {"name": "pydantic", "version": "2.14.1", "vulns": []},
        ]
    }
    res = parse_pip_audit_json(clean_data)
    assert res["status"] == "clean"
    assert res["total_vulnerabilities"] == 0
    assert res["packages_affected"] == 0
    assert len(res["vulnerabilities"]) == 0


def test_parse_pip_audit_json_with_vulnerabilities():
    vuln_data = {
        "dependencies": [
            {
                "name": "starlette",
                "version": "0.36.3",
                "vulns": [
                    {
                        "id": "PYSEC-2026-249",
                        "fix_versions": ["1.3.1"],
                        "description": "DoS vulnerability in urlencoded form body parsing",
                        "aliases": ["CVE-2026-54283"],
                    }
                ],
            }
        ]
    }
    res = parse_pip_audit_json(vuln_data)
    assert res["status"] == "vulnerable"
    assert res["total_vulnerabilities"] == 1
    assert res["packages_affected"] == 1
    assert res["vulnerabilities"][0]["package"] == "starlette"
    assert res["vulnerabilities"][0]["id"] == "PYSEC-2026-249"
    assert res["vulnerabilities"][0]["fix_versions"] == ["1.3.1"]


def test_parse_pip_audit_json_invalid():
    res = parse_pip_audit_json("string-invalida")
    assert res["status"] == "error"
    assert res["total_vulnerabilities"] == 0


def test_parse_npm_audit_json_clean():
    clean_npm = {
        "metadata": {
            "vulnerabilities": {
                "info": 0,
                "low": 0,
                "moderate": 0,
                "high": 0,
                "critical": 0,
                "total": 0,
            }
        },
        "vulnerabilities": {},
    }
    res = parse_npm_audit_json(clean_npm)
    assert res["status"] == "clean"
    assert res["total_vulnerabilities"] == 0
    assert res["summary"]["total"] == 0
    assert len(res["vulnerabilities"]) == 0


def test_parse_npm_audit_json_with_vulnerabilities():
    vuln_npm = {
        "metadata": {
            "vulnerabilities": {
                "info": 0,
                "low": 1,
                "moderate": 1,
                "high": 0,
                "critical": 1,
                "total": 3,
            }
        },
        "vulnerabilities": {
            "tinypool": {
                "severity": "critical",
                "isDirect": False,
                "via": [
                    {
                        "title": "Prototype Pollution gadget leads to RCE",
                        "url": "https://github.com/advisories/GHSA-5gmw-xhrv-c9v3",
                    }
                ],
            }
        },
    }
    res = parse_npm_audit_json(vuln_npm)
    assert res["status"] == "vulnerable"
    assert res["total_vulnerabilities"] == 3
    assert res["summary"]["critical"] == 1
    assert len(res["vulnerabilities"]) == 1
    assert res["vulnerabilities"][0]["package"] == "tinypool"
    assert res["vulnerabilities"][0]["severity"] == "critical"
    assert "Prototype Pollution" in res["vulnerabilities"][0]["titles"][0]


def test_format_security_report_clean():
    b_res = {"status": "clean", "total_vulnerabilities": 0, "vulnerabilities": []}
    f_res = {"status": "clean", "total_vulnerabilities": 0, "summary": {"total": 0}, "vulnerabilities": []}

    report = format_security_report(b_res, f_res)
    assert "Nenhuma vulnerabilidade conhecida foi detectada no Backend" in report
    assert "Nenhuma vulnerabilidade detectada no Frontend" in report


def test_format_security_report_with_alerts():
    b_res = {
        "status": "vulnerable",
        "total_vulnerabilities": 1,
        "packages_affected": 1,
        "vulnerabilities": [
            {"package": "passlib", "version": "1.7.4", "id": "PYSEC-2024-1", "fix_versions": ["1.7.5"]}
        ],
    }
    f_res = {
        "status": "vulnerable",
        "total_vulnerabilities": 1,
        "summary": {"critical": 1, "high": 0, "moderate": 0, "low": 0, "total": 1},
        "vulnerabilities": [
            {"package": "tinypool", "severity": "critical", "titles": ["Prototype Pollution"]}
        ],
    }

    report = format_security_report(b_res, f_res)
    assert "Encontradas 1 vulnerabilidades em 1 pacote(s)" in report
    assert "PYSEC-2024-1" in report
    assert "Críticas: 1" in report
    assert "tinypool [CRITICAL]" in report


@patch("scripts.validate_security.subprocess.run")
def test_run_pip_audit_mocked_success(mock_subproc):
    mock_subproc.return_value = MagicMock(
        stdout='{"dependencies": [{"name": "fastapi", "version": "0.110.0", "vulns": []}]}',
        stderr="",
    )
    res = run_pip_audit()
    assert res["status"] == "clean"
    assert res["total_vulnerabilities"] == 0


@patch("scripts.validate_security.subprocess.run")
def test_run_npm_audit_mocked_success(mock_subproc):
    mock_subproc.return_value = MagicMock(
        stdout='{"metadata": {"vulnerabilities": {"total": 0}}, "vulnerabilities": {}}',
        stderr="",
    )
    res = run_npm_audit()
    assert res["status"] == "clean"
    assert res["total_vulnerabilities"] == 0


@patch("scripts.validate_security.run_pip_audit")
@patch("scripts.validate_security.run_npm_audit")
def test_run_full_security_audit_clean_pass(mock_npm, mock_pip):
    mock_pip.return_value = {"status": "clean", "total_vulnerabilities": 0}
    mock_npm.return_value = {"status": "clean", "total_vulnerabilities": 0, "summary": {"total": 0}}

    full_res = run_full_security_audit()
    assert full_res["passed"] is True
    assert "Nenhuma vulnerabilidade" in full_res["report"]


@patch("scripts.validate_security.run_pip_audit")
@patch("scripts.validate_security.run_npm_audit")
def test_run_full_security_audit_failure_on_vulns(mock_npm, mock_pip):
    mock_pip.return_value = {
        "status": "vulnerable",
        "total_vulnerabilities": 2,
        "packages_affected": 1,
        "vulnerabilities": [{"package": "starlette", "version": "0.36.3", "id": "CVE-TEST", "fix_versions": []}],
    }
    mock_npm.return_value = {"status": "clean", "total_vulnerabilities": 0, "summary": {"total": 0}}

    full_res = run_full_security_audit()
    assert full_res["passed"] is False
    assert "Encontradas 2 vulnerabilidades" in full_res["report"]
