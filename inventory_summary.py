#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import sys
from AnsibleInventory import AnsibleInventory


def main() -> int:
    parser = argparse.ArgumentParser(description='Summarize ansible inventory for dashboard use')
    parser.add_argument('--env', required=True)
    parser.add_argument('--base-path', default='../../../Ansible/environments')
    args = parser.parse_args()

    inventory = AnsibleInventory(env=args.env, base_path=args.base_path)
    hosts = sorted(inventory.get_all_hosts())
    clusters = inventory.cluster_groups()

    host_cluster = {}
    for cluster_name, cluster_hosts in clusters.items():
        for host in cluster_hosts:
            host_cluster.setdefault(host, cluster_name)

    servers = [
        {
            'hostname': host,
            'cluster': host_cluster.get(host, 'standalone'),
            'env': args.env,
        }
        for host in hosts
    ]

    payload = {
        'env': args.env,
        'inventory_path': f"{args.base_path}/{args.env}/inventory",
        'server_count': len(servers),
        'cluster_count': len(clusters),
        'servers': servers,
        'clusters': [
            {
                'name': name,
                'nodes': len(items),
                'hosts': sorted(items),
            }
            for name, items in sorted(clusters.items())
        ],
    }

    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
