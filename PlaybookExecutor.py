#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
import datetime
import logging
from typing import List

logger = logging.getLogger(__name__)


class PlaybookExecutor:
    def __init__(self, inventory_path: str):
        self.inventory_path = inventory_path

    def get_playbook(self, group: str) -> str:
        playbook_map = {
            "galera_cluster": "../../../Ansible/playbooks/patchning/patch-galera.yml",
            "haproxy_cluster": "../../../Ansible/playbooks/patchning/patch-haproxy.yml",
            "packetfence_cluster": "../../../Ansible/playbooks/patchning/patch-packetfence.yml",
            "standalone": "../../../Ansible/playbooks/patchning/patch-single-linux.yml",
        }
        p = playbook_map.get(group, "../../../Ansible/playbooks/patchning/patch-clusters.yml")
        logger.debug(f"Selected playbook for group={group}: {p}")
        return p

    def run(self, playbook_path: str, hosts, ssh_user: str, ssh_pass: str, dry_run: bool = False):
        start = datetime.datetime.now()
        env = os.environ.copy()
        env["ANSIBLE_BECOME_PASS"] = ssh_pass
        env["ANSIBLE_ASK_BECOME_PASS"] = "false"

        cmd = [
            "ansible-playbook",
            "-i", self.inventory_path,
            playbook_path,
            "-l", ",".join(hosts),
            "--extra-vars",
            (
                f"ansible_user={ssh_user} ansible_ssh_pass={ssh_pass} "
                f"ansible_become=true ansible_become_pass={ssh_pass}"
            ),
        ]
        if dry_run:
            cmd.append("--check")

        logger.info(
            "Running playbook dry_run=%s hosts=%s playbook=%s user=%s",
            dry_run, hosts, playbook_path, ssh_user
        )

        try:
            if sys.version_info >= (3, 7):
                result = subprocess.run(cmd, capture_output=True, text=True, env=env)
            else:
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    env=env,
                )
        except Exception as e:
            logger.exception(f"Playbook subprocess failed: {e}")
            return False, 0.0, []

        duration = (datetime.datetime.now() - start).total_seconds()
        stdout = result.stdout or ""
        stderr = result.stderr or ""
        ok = result.returncode == 0
        failed_hosts = self._parse_failed_hosts(stdout, stderr)

        if ok:
            logger.info("Playbook OK (%.1fs) hosts=%s", duration, hosts)
            if failed_hosts:
                logger.warning(
                    "Playbook rc=0 men tolkade failed hosts: %s",
                    ",".join(failed_hosts),
                )
        else:
            logger.warning(
                "Playbook FAILED rc=%s (%.1fs) hosts=%s",
                result.returncode, duration, hosts,
            )
            self._log_failure_summary(stdout, stderr)

        if failed_hosts:
            logger.warning("Failed hosts detected: %s", ",".join(failed_hosts))

        logger.debug("Playbook full STDOUT:\n%s", stdout)
        logger.debug("Playbook full STDERR:\n%s", stderr)

        return ok, duration, failed_hosts

    def _parse_failed_hosts(self, stdout: str, stderr: str = "") -> List[str]:
        """
        Försök hitta riktiga hostnames i ansible-utdata.

        Exempelrad:
        fatal: [svlq-zabbixv01.linux.lnu.se]: FAILED! => ...
        """
        failed: List[str] = []

        for source in (stdout, stderr):
            if not source:
                continue
            for line in source.splitlines():
                line = line.strip()
                if not line:
                    continue

                # Vanlig fatal-rad från Ansible
                if line.startswith("fatal:"):
                    lbr = line.find("[")
                    rbr = line.find("]", lbr + 1)
                    if lbr != -1 and rbr != -1:
                        host = line[lbr + 1 : rbr]
                        if host:
                            failed.append(host)
                            continue

                # Andra rader med FAILED!/UNREACHABLE!
                if "FAILED!" in line or "UNREACHABLE!" in line:
                    parts = line.split()
                    if parts:
                        host = parts[0].rstrip(":")
                        if host and not host.lower().startswith("fatal"):
                            failed.append(host)

        seen = set()
        uniq: List[str] = []
        for h in failed:
            if h not in seen:
                seen.add(h)
                uniq.append(h)
        return uniq

    def _log_failure_summary(self, stdout: str, stderr: str) -> None:
        interesting_stdout = []
        for line in (stdout or "").splitlines():
            if any(
                key in line
                for key in ("FAILED!", "UNREACHABLE!", "MODULE FAILURE", "MSG:", "ERROR!")
            ):
                interesting_stdout.append(line.strip())

        if interesting_stdout:
            logger.warning("Playbook error summary (stdout):")
            for line in interesting_stdout[:20]:
                logger.warning("  %s", line)

        err_lines = [l.strip() for l in (stderr or "").splitlines() if l.strip()]
        if err_lines:
            logger.warning("Playbook stderr (första raderna):")
            for line in err_lines[:20]:
                logger.warning("  %s", line)
