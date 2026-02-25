#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import logging
from logging.handlers import RotatingFileHandler
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from AnsibleInventory import AnsibleInventory
from HostProbe import HostProbe
from PlaybookExecutor import PlaybookExecutor
from Helper import Helper

from ReportGenerator import ReportGenerator

IPA_USER = "KONTO"
IPA_PASS = "standard"
DEFAULT_USER = "ansible"
DEFAULT_PASS = "standard"


def setup_logging(log_file: str, console_level: str = "INFO", file_level: str = "DEBUG"):
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)

    ch = logging.StreamHandler()
    ch.setLevel(getattr(logging, console_level.upper(), logging.INFO))
    ch.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))

    fh = RotatingFileHandler(log_file, maxBytes=5*1024*1024, backupCount=5, encoding="utf-8")
    fh.setLevel(getattr(logging, file_level.upper(), logging.DEBUG))
    fh.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    ))

    logger.handlers.clear()
    logger.addHandler(ch)
    logger.addHandler(fh)
    logging.debug("Logging initialized")


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


def print_table(title, rows, width=98, no_color=False):
    if not rows:
        print(f"\n[{title}] (inga värdar)")
        return
    print(f"\n[{title}]")
    print("".ljust(width, "─"))
    header = f"{'HOST':45} {'PING':^6} {'SSH':^6} {'LOGIN':^7} {'USER':18} {'AUTOPATCH':^10}"
    print(header)
    print("".ljust(width, "─"))
    for d in rows:
        r = d["result"]
        ap = d["autopatch_enabled"]
        print(f"{r.host:45} {str(r.ping_ok):^6} {str(r.ssh_ok):^6} {str(r.ssh_login_ok):^7} {r.used_user:18} {str(ap):^10}")
    print("".ljust(width, "─"))


def main():
    parser = argparse.ArgumentParser(prog="Main.py", description="Autopatch probe + patch runner")
    parser.add_argument("--env", default="qa", help="miljö (t.ex. qa, prod)")
    parser.add_argument("--base-path", default="../../../Ansible/environments", help="bas-sökväg till environments")
    parser.add_argument("--dry-run", action="store_true", help="kör ansible-playbooks i --check-läge")
    parser.add_argument("--max-workers", type=int, default=2, help="antal trådar för probe")
    parser.add_argument("--probe-timeout", type=float, default=5, help="timeout för ping/ssh (sek)")
    parser.add_argument("--no-color", action="store_true", help="ingen färg i statusutskrifter")
    parser.add_argument("--log-file", default="autopatch.log", help="sökväg till loggfil")
    args = parser.parse_args()

    setup_logging(args.log_file)
    log = logging.getLogger("Main")

    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    log.info(f"=== Autopatch run start [{run_id}] env={args.env} dry_run={args.dry_run} ===")

    inv = AnsibleInventory(env=args.env, base_path=args.base_path)
    hp = HostProbe(timeout=args.probe_timeout)
    pb = PlaybookExecutor(inv.path)
    helper = Helper(pb)

    clusters = inv.cluster_groups()
    standalone = inv.standalone_hosts()
    log.info(f"Inventory loaded: {len(standalone)} standalone, {len(clusters)} clusters")

    log.info("Probing standalone hosts...")
    standalone_rows = []
    with ThreadPoolExecutor(max_workers=args.max_workers) as ex:
        futs = {ex.submit(probe_host, inv, hp, h): h for h in standalone}
        for f in as_completed(futs):
            d = f.result()
            r = d["result"]
            logging.getLogger("probe").debug(
                f"standalone {r.host} ping={r.ping_ok} ssh={r.ssh_ok} login={r.ssh_login_ok} user={r.used_user}"
            )
            standalone_rows.append(d)
    standalone_rows.sort(key=lambda x: x["result"].host)

    log.info("Probing cluster members...")
    cluster_rows = {}
    for cname, members in clusters.items():
        rows = []
        with ThreadPoolExecutor(max_workers=args.max_workers) as ex:
            futs = {ex.submit(probe_host, inv, hp, h): h for h in members}
            for f in as_completed(futs):
                d = f.result()
                r = d["result"]
                logging.getLogger("probe").debug(
                    f"{cname} {r.host} ping={r.ping_ok} ssh={r.ssh_ok} login={r.ssh_login_ok} user={r.used_user}"
                )
                rows.append(d)
        rows.sort(key=lambda x: x["result"].host)
        cluster_rows[cname] = rows

    print("\n" + "=" * 30)
    print(" STANDALONE SERVRAR (probe) ")
    print("=" * 30)
    print_table("Standalone", standalone_rows, no_color=args.no_color)

    print("\n" + "=" * 30)
    print(f" KLUSTER (probe)  ({len(clusters)}) ")
    print("=" * 30)
    if not clusters:
        print("(inga kluster)")
    else:
        for cname, rows in cluster_rows.items():
            status = cluster_status(rows)
            log.info(f"Cluster probe status {cname} -> {status}")
            green, red, reset = ("\033[92m", "\033[91m", "\033[0m")
            tag = status
            if not args.no_color:
                tag = (green + "OK" + reset) if status == "OK" else (red + "FAILED" + reset)
            print(f"\n{cname} -> {tag}")
            print_table(cname, rows, no_color=args.no_color)

    print("\n" + "=" * 30)
    print(f" STANDALONE PATCH (dry-run={args.dry_run}) ")
    print("=" * 30)
    standalone_outcomes = helper.run_standalone(standalone_rows, dry_run=args.dry_run)
    for o in standalone_outcomes:
        logging.getLogger("patch").info(
            f"standalone {o.host} -> {o.status} ({o.duration:.1f}s) reason={o.reason} "
            f"{'failed_hosts='+','.join(o.failed_hosts) if o.failed_hosts else ''}"
        )
        extra = f" failed_hosts={','.join(o.failed_hosts)}" if o.failed_hosts else ""
        print(f"{o.host}: {o.status} ({o.duration:.1f}s) - {o.reason}{extra}")

    print("\n" + "=" * 30)
    print(f" KLUSTER PATCH (dry-run={args.dry_run}) ")
    print("=" * 30)
    cluster_outcomes = []
    for cname, rows in cluster_rows.items():
        co = helper.run_cluster(cname, rows, dry_run=args.dry_run)
        cluster_outcomes.append(co)
        logging.getLogger("patch").info(
            f"cluster {cname} -> {co.status} ({co.duration_total:.1f}s) reason={co.reason} "
            f"{'failed_hosts='+','.join(co.failed_hosts) if co.failed_hosts else ''}"
        )
        print(f"{cname}: {co.status} ({co.duration_total:.1f}s) - {co.reason}")
        for user, dur, failed in (co.batch_results or []):
            logging.getLogger("patch").debug(
                f"  batch user={user} dur={dur:.1f}s failed_hosts={','.join(failed) if failed else ''}"
            )
            extra = f" failed_hosts={','.join(failed)}" if failed else ""
            print(f"  [{user}] ({dur:.1f}s){extra}")

    def _count_status(items):
        ok = failed = skipped = 0
        for x in items:
            if x.status == "OK":
                ok += 1
            elif x.status == "FAILED":
                failed += 1
            elif x.status == "SKIPPED":
                skipped += 1
        return ok, failed, skipped

    s_ok, s_fail, s_skip = _count_status(standalone_outcomes)
    c_ok, c_fail, c_skip = _count_status(cluster_outcomes)

    print("\n" + "=" * 30)
    print(" SAMMANFATTNING ")
    print("=" * 30)
    print(f"Standalone: OK={s_ok} FAILED={s_fail} SKIPPED={s_skip}")
    print(f"Kluster:    OK={c_ok} FAILED={c_fail} SKIPPED={c_skip}")

    failed_hosts = [o.host for o in standalone_outcomes if o.status == "FAILED"]
    failed_clusters = [co.cluster for co in cluster_outcomes if co.status == "FAILED"]

    if failed_hosts:
        print("\nMisslyckade standalone-värdar:")
        for h in failed_hosts:
            print(f"  - {h}")
    if failed_clusters:
        print("\nMisslyckade kluster:")
        for cname in failed_clusters:
            print(f"  - {cname}")

    log.info(
        "Summary standalone: OK=%d FAILED=%d SKIPPED=%d",
        s_ok, s_fail, s_skip,
    )
    log.info(
        "Summary clusters:   OK=%d FAILED=%d SKIPPED=%d",
        c_ok, c_fail, c_skip,
    )

    log.info(f"=== Autopatch run end [{run_id}] ===")


    rep = ReportGenerator(
        env=args.env,
        run_id=run_id,
        dry_run=args.dry_run
    )

    report_file = rep.generate(
        standalone_outcomes=standalone_outcomes,
        cluster_outcomes=cluster_outcomes,
        standalone_probe=standalone_rows,
        cluster_probe=cluster_rows
    )

    print(f"\nExcel-rapport skapad: {report_file}")
    logging.getLogger("Main").info(f"Excel report written: {report_file}")


if __name__ == "__main__":
    main()
