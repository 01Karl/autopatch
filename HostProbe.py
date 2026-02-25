#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
import socket
import subprocess
import platform
from dataclasses import dataclass
from typing import Optional, Dict, Any

log = logging.getLogger(__name__)

@dataclass
class ProbeResult:
    host: str
    ip: str
    ping_ok: bool
    ssh_ok: bool
    ssh_login_ok: Optional[bool]
    used_user: str
    error: Optional[str] = None

class HostProbe:
    def __init__(self, timeout: float = 3.0):
        self.timeout = timeout

    def probe(self, host: str, vars: Dict[str, Any], ssh_user: str, ssh_pass: str) -> ProbeResult:
        ip = vars.get("ansible_host", host)
        ping_ok = self._ping(ip)
        ssh_ok = self._port_open(ip, 22)
        ssh_login_ok, err = (None, None)
        if ssh_ok:
            ssh_login_ok, err = self._ssh_login(ip, ssh_user, ssh_pass)
        if err:
            log.debug(f"probe error host={host} ip={ip}: {err}")
        return ProbeResult(host, ip, ping_ok, ssh_ok, ssh_login_ok, ssh_user, err)

    def _ping(self, ip: str) -> bool:
        sys = platform.system().lower()
        cmd = ["ping", "-n", "1", ip] if sys.startswith("win") else ["ping", "-c", "1", ip]
        rc = subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return rc == 0

    def _port_open(self, ip: str, port: int) -> bool:
        try:
            with socket.create_connection((ip, port), timeout=self.timeout):
                return True
        except OSError as e:
            log.debug(f"_port_open {ip}:{port} -> {e}")
            return False

    def _ssh_login(self, ip: str, user: str, password: str):
        try:
            res = subprocess.run(
                [
                    "sshpass", "-p", password,
                    "ssh", "-o", "BatchMode=no",
                    "-o", "StrictHostKeyChecking=no",
                    "-o", "UserKnownHostsFile=/dev/null",
                    "-o", f"ConnectTimeout={int(self.timeout)}",
                    f"{user}@{ip}", "true"
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return (res.returncode == 0, None)
        except Exception as e:
            return (False, str(e))
