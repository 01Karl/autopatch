export function buildPatchRoutineYaml({
  routineTemplate,
  routineName,
  routineHosts,
  routineSerial,
  elSecurityOnly,
}: {
  routineTemplate: string;
  routineName: string;
  routineHosts: string;
  routineSerial: number;
  elSecurityOnly: boolean;
}) {
  if (routineTemplate === 'cluster-rolling') {
    return `---
- name: ${routineName}
  hosts: ${routineHosts}
  gather_facts: false
  become: true
  serial: 1

  pre_tasks:
    - name: Drain node from cluster
      ansible.builtin.shell: /usr/local/bin/clusterctl drain {{ inventory_hostname }}
      changed_when: true

  tasks:
    - name: Apply OS updates (EL)
      ansible.builtin.dnf:
        name: "*"
        state: latest
        update_cache: true

    - name: Reboot node
      ansible.builtin.reboot:
        reboot_timeout: 1200

  post_tasks:
    - name: Wait for node to be healthy in cluster
      ansible.builtin.shell: /usr/local/bin/clusterctl wait-ready {{ inventory_hostname }}
      changed_when: false

    - name: Undrain node
      ansible.builtin.shell: /usr/local/bin/clusterctl undrain {{ inventory_hostname }}
      changed_when: true`;
  }

  if (routineTemplate === 'app-maintenance') {
    return `---
- name: ${routineName}
  hosts: ${routineHosts}
  gather_facts: false
  become: true
  serial: ${routineSerial}

  vars:
    app_service_name: myapp

  pre_tasks:
    - name: Stoppa applikationstjänst
      ansible.builtin.service:
        name: "{{ app_service_name }}"
        state: stopped

  tasks:
    - name: Uppdatera paket (Debian/Ubuntu)
      ansible.builtin.apt:
        update_cache: true
        upgrade: dist

    - name: Uppdatera paket (EL)
      ansible.builtin.dnf:
        name: "*"
        state: latest
        update_cache: true
        security: ${elSecurityOnly ? 'true' : 'false'}

  post_tasks:
    - name: Starta applikationstjänst
      ansible.builtin.service:
        name: "{{ app_service_name }}"
        state: started`;
  }

  return `---
- name: ${routineName}
  hosts: ${routineHosts}
  gather_facts: false
  become: true
  serial: ${routineSerial}

  vars:
    el_security_only: ${elSecurityOnly ? 'true' : 'false'}
    el_exclude: []
    lock_timeout: 120
    reboot_timeout: 900

  pre_tasks:
    - name: Gather minimal facts (works in --check)
      ansible.builtin.setup:
        gather_subset: [min]
        filter: [ansible_os_family]
      become: false
      check_mode: no
      ignore_errors: yes

    - name: Normalize OS family
      ansible.builtin.set_fact:
        os_family: "{{ ansible_facts.os_family | default(ansible_os_family | default('')) }}"

  tasks:
    - name: Update packages (EL)
      ansible.builtin.dnf:
        name: "*"
        state: latest
        update_cache: true
        security: "{{ el_security_only }}"
        exclude: "{{ el_exclude }}"
        lock_timeout: "{{ lock_timeout }}"
      when: os_family == "RedHat"

    - name: Update packages (Debian/Ubuntu)
      ansible.builtin.apt:
        update_cache: true
        upgrade: dist
        lock_timeout: "{{ lock_timeout }}"
      when: os_family == "Debian"

    - name: Reboot if needed (Debian/Ubuntu)
      ansible.builtin.reboot:
        reboot_timeout: "{{ reboot_timeout }}"
      when:
        - os_family == "Debian"
        - not (ansible_check_mode | default(false))`;
}
