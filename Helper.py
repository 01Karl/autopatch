#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
from dataclasses import dataclass
from collections import defaultdict
from typing import List, Dict, Any, Tuple

log = logging.getLogger(__name__)

@dataclass
class HostOutcome:
    host: str
    status: str        # "OK" | "FAILED" | "SKIPPED"
    reason: str
    duration: float = 0.0
    user: str = ""
    failed_hosts: List[str] = None

@dataclass
class ClusterOutcome:
    cluster: str
    status: str        # "OK" | "FAILED" | "SKIPPED"
    reason: str
    duration_total: float = 0.0
    failed_hosts: List[str] = None
    batch_results: List[Tuple[str, float, List[str]]] = None

class Helper:
    def __init__(self, playbook_executor):
        self.pb = playbook_executor

    def _probe_reason(self, row: Dict[str, Any]) -> str:
        r = row["result"]
        if not r.ping_ok:
            return "probe: ping failed"
        if not r.ssh_ok:
            return "probe: ssh port closed"
        if r.ssh_login_ok is False:
            return "probe: ssh login failed"
        return ""

    def _targets_from_rows(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [d for d in rows if d["autopatch_enabled"]]

    def run_standalone(self, rows: List[Dict[str, Any]], dry_run: bool) -> List[HostOutcome]:
        out: List[HostOutcome] = []
        playbook = self.pb.get_playbook("standalone")

        for d in rows:
            r = d["result"]
            host = r.host
            user, pw = d["user"], d["password"]

            if not d["autopatch_enabled"]:
                log.info(f"SKIP standalone {host}: autopatch=False")
                out.append(HostOutcome(host=host, status="SKIPPED", reason="autopatch=False", user=user))
                continue

            probe_fail = self._probe_reason(d)
            if probe_fail:
                log.info(f"SKIP standalone {host}: {probe_fail}")
                out.append(HostOutcome(host=host, status="SKIPPED", reason=probe_fail, user=user))
                continue

            ok, duration, failed_hosts = self.pb.run(playbook, [host], user, pw, dry_run=dry_run)
            if ok and not failed_hosts:
                log.info(f"OK standalone {host} ({duration:.1f}s)")
                out.append(HostOutcome(host=host, status="OK", reason="patch ok", duration=duration, user=user))
            else:
                log.warning(f"FAILED standalone {host} ({duration:.1f}s) failed_hosts={failed_hosts}")
                out.append(HostOutcome(
                    host=host, status="FAILED",
                    reason="playbook failed", duration=duration, user=user,
                    failed_hosts=failed_hosts or []
                ))

        return out

    def run_cluster(self, cluster_name: str, rows: List[Dict[str, Any]], dry_run: bool) -> ClusterOutcome:
        probe_problems = []
        for d in rows:
            if not d["autopatch_enabled"]:
                continue
            reason = self._probe_reason(d)
            if reason:
                probe_problems.append((d["result"].host, reason))

        if probe_problems:
            text = "probe failed for: " + ", ".join(f"{h}({why})" for h, why in probe_problems)
            log.info(f"SKIP cluster {cluster_name}: {text}")
            return ClusterOutcome(cluster=cluster_name, status="SKIPPED", reason=text,
                                  failed_hosts=[h for h, _ in probe_problems], batch_results=[])

        targets = self._targets_from_rows(rows)
        if not targets:
            log.info(f"SKIP cluster {cluster_name}: no autopatch=True members")
            return ClusterOutcome(cluster=cluster_name, status="SKIPPED", reason="no autopatch=True members",
                                  failed_hosts=[], batch_results=[])

        playbook = self.pb.get_playbook(cluster_name)
        batches = defaultdict(list)
        for d in targets:
            batches[(d["user"], d["password"])].append(d["result"].host)

        any_failed = False
        all_failed_hosts: List[str] = []
        batch_results: List[Tuple[str, float, List[str]]] = []
        duration_total = 0.0

        for (user, pw), hostlist in batches.items():
            ok, duration, failed_hosts = self.pb.run(playbook, hostlist, user, pw, dry_run=dry_run)
            duration_total += duration
            batch_results.append((user, duration, failed_hosts))
            if (not ok) or failed_hosts:
                any_failed = True
                all_failed_hosts.extend(failed_hosts or [])
                log.warning(f"FAILED cluster {cluster_name} batch user={user} dur={duration:.1f}s hosts={','.join(hostlist)} "
                            f"failed_hosts={','.join(failed_hosts) if failed_hosts else ''}")
            else:
                log.info(f"OK cluster {cluster_name} batch user={user} dur={duration:.1f}s hosts={','.join(hostlist)}")

        if any_failed:
            reason = ("playbook failed on: " + ",".join(sorted(set(all_failed_hosts)))) if all_failed_hosts else "playbook failed"
            return ClusterOutcome(cluster=cluster_name, status="FAILED", reason=reason,
                                  duration_total=duration_total, failed_hosts=sorted(set(all_failed_hosts)),
                                  batch_results=batch_results)

        return ClusterOutcome(cluster=cluster_name, status="OK", reason="patch ok",
                              duration_total=duration_total, failed_hosts=[],
                              batch_results=batch_results)
