#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

from AnsibleInventory import AnsibleInventory
from HostProbe import HostProbe
from PlaybookExecutor import PlaybookExecutor

IPA_USER = "service_legacyupdater"
IPA_PASS = "hemligt"
DEFAULT_USER = "ansible"
DEFAULT_PASS = "vanligt"
DRY_RUN = True

MAX_WORKERS = 20
PROBE_TIMEOUT = 2.5


def is_autopatch_enabled(vars_dict):
    val = str(vars_dict.get("autopatch", "true")).strip().lower()
    return val not in ("false", "no", "0")


def probe_host(inv, hp, host):
    vars = inv.get_host_vars(host)
    freeipa = bool(vars.get("freeipa_managed"))
    user = IPA_USER if freeipa else DEFAULT_USER
    pw = IPA_PASS if freeipa else DEFAULT_PASS
    res = hp.probe(host, vars, user, pw)
    return {
        "host": host,
        "vars": vars,
        "freeipa": freeipa,
        "user": user,
        "password": pw,
        "result": res,
        "autopatch_enabled": is_autopatch_enabled(vars),
    }


def cluster_status(member_dicts):
    for d in member_dicts:
        if not d["autopatch_enabled"]:
            continue
        r = d["result"]
        if (not r.ping_ok) or (not r.ssh_ok) or (r.ssh_login_ok is False):
            return "FAILED"
    return "OK"


def print_table(title, rows):
    if not rows:
        print(f"\n[{title}] (inga värdar)")
        return
    print(f"\n[{title}]")
    print("".ljust(98, "─"))
    header = f"{'HOST':45} {'PING':^6} {'SSH':^6} {'LOGIN':^7} {'USER':18} {'AUTOPATCH':^10}"
    print(header)
    print("".ljust(98, "─"))
    for d in rows:
        r = d["result"]
        ap = d["autopatch_enabled"]
        print(f"{r.host:45} {str(r.ping_ok):^6} {str(r.ssh_ok):^6} {str(r.ssh_login_ok):^7} {r.used_user:18} {str(ap):^10}")
    print("".ljust(98, "─"))


def main():
    inv = AnsibleInventory(env="qa", base_path="../../../Ansible/environments")
    hp = HostProbe(timeout=PROBE_TIMEOUT)

    clusters = inv.cluster_groups()
    standalone = inv.standalone_hosts()

    standalone_rows = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futs = {ex.submit(probe_host, inv, hp, h): h for h in standalone}
        for f in as_completed(futs):
            standalone_rows.append(f.result())
    standalone_rows.sort(key=lambda x: x["result"].host)

    cluster_rows = {}  # cname -> [rows]
    for cname, members in clusters.items():
        rows = []
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
            futs = {ex.submit(probe_host, inv, hp, h): h for h in members}
            for f in as_completed(futs):
                rows.append(f.result())
        rows.sort(key=lambda x: x["result"].host)
        cluster_rows[cname] = rows

    print("\n" + "=" * 30)
    print(" STANDALONE SERVRAR (probe)")
    print("=" * 30)
    print_table("Standalone", standalone_rows)

    print("\n" + "=" * 30)
    print(f" KLUSTER (probe)  ({len(clusters)}) ")
    print("=" * 30)
    if not clusters:
        print("(inga kluster)")
    else:
        for cname, rows in cluster_rows.items():
            status = cluster_status(rows)
            color = "\033[92m" if status == "OK" else "\033[91m"
            reset = "\033[0m"
            print(f"\n{cname} -> {color}{status}{reset}")
            print_table(cname, rows)

    pb = PlaybookExecutor(inv.path)

    print("\n" + "=" * 30)
    print(f" STANDALONE PATCH (dry-run={DRY_RUN}) ")
    print("=" * 30)

    for d in standalone_rows:
        r = d["result"]
        if not d["autopatch_enabled"]:
            print(f"{r.host}: SKIPPED (autopatch=False)")
            continue
        if (not r.ping_ok) or (not r.ssh_ok) or (r.ssh_login_ok is False):
            print(f"{r.host}: SKIPPED (probe failed)")
            continue

        playbook = pb.get_playbook("standalone")
        ok, duration, failed_hosts = pb.run(playbook, [r.host], d["user"], d["password"], dry_run=DRY_RUN)
        status = "OK" if ok and not failed_hosts else "FAILED"
        print(f"{r.host}: {status} ({duration:.1f}s)", end="")
        if failed_hosts:
            print(f"  failed_hosts={','.join(failed_hosts)}")
        else:
            print()

    print("\n" + "=" * 30)
    print(f" KLUSTER PATCH (dry-run={DRY_RUN}) ")
    print("=" * 30)

    for cname, rows in cluster_rows.items():
        probe_ok = (cluster_status(rows) == "OK")
        if not probe_ok:
            print(f"{cname}: SKIPPED (probe failed)")
            continue

        targets = [d["result"].host for d in rows if d["autopatch_enabled"]]
        if not targets:
            print(f"{cname}: SKIPPED (inga autopatch=True)")
            continue

        batches = defaultdict(list)
        creds = {}
        for d in rows:
            if d["result"].host in targets:
                key = (d["user"], d["password"])
                batches[key].append(d["result"].host)
                creds[key] = key

        playbook = pb.get_playbook(cname)
        cluster_ok = True
        bad_hosts_total = []

        for (user, pw), hostlist in batches.items():
            ok, duration, failed_hosts = pb.run(playbook, hostlist, user, pw, dry_run=DRY_RUN)
            status = "OK" if ok and not failed_hosts else "FAILED"
            print(f"{cname} [{user}] -> {status} ({duration:.1f}s)  hosts={','.join(hostlist)}")
            if not ok or failed_hosts:
                cluster_ok = False
                bad_hosts_total.extend(failed_hosts)

        if cluster_ok:
            print(f"{cname}: \033[92mPATCH OK\033[0m")
        else:
            bad = f" failed_hosts={','.join(sorted(set(bad_hosts_total)))}" if bad_hosts_total else ""
            print(f"{cname}: \033[91mPATCH FAILED\033[0m{bad}")


if __name__ == "__main__":
    main()
