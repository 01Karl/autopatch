#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
from typing import Dict, List, Any
from ansible.parsing.dataloader import DataLoader
from ansible.inventory.manager import InventoryManager

logger = logging.getLogger(__name__)

class AnsibleInventory:
    def __init__(self, env="qa", base_path="../../../Ansible/environments"):
        self.env = env
        self.path = f"{base_path}/{env}/inventory"
        self.loader = DataLoader()
        self.inventory = InventoryManager(loader=self.loader, sources=[self.path])
        logger.info(f"Laddade inventory från {self.path}")

    def get_all_hosts(self) -> List[str]:
        return list(self.inventory.hosts.keys())

    def get_host_vars(self, hostname: str) -> Dict[str, Any]:
        host = self.inventory.get_host(hostname)
        return host.vars if host else {}

    def hosts_in_group(self, group: str) -> List[str]:
        g = self.inventory.groups.get(group)
        if not g:
            return []
        return [h.name for h in g.get_hosts()]

    def cluster_groups(self) -> Dict[str, List[str]]:
        out: Dict[str, List[str]] = {}
        for gname, grp in self.inventory.groups.items():
            if gname.endswith("_cluster"):
                out[gname] = [h.name for h in grp.get_hosts()]
        return {k: sorted(v) for k, v in out.items()}

    def standalone_hosts(self) -> List[str]:
        all_hosts = set(self.get_all_hosts())
        cluster_members = set()
        for hosts in self.cluster_groups().values():
            cluster_members.update(hosts)
        return sorted(all_hosts - cluster_members)
