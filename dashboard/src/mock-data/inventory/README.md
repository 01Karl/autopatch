# Inventory fixtures

These JSON files provide fake inventory data for quick UI testing when real Ansible inventory or Python/Ansible dependencies are unavailable.

## Files
- `prod.json`
- `qa.json`
- `dev.json`

## Toggle mock/real inventory
Use environment variable `USE_MOCK_INVENTORY`:

- `USE_MOCK_INVENTORY=true` → always use fixture JSON files.
- `USE_MOCK_INVENTORY=false` → always use Python/Ansible (no fixture fallback).
- unset/other value → auto mode (try Python first, fallback to fixtures on error).

Example:

```bash
USE_MOCK_INVENTORY=true npm run dev
```

## Shape
Each file follows the `InventorySummary` contract:

```json
{
  "env": "prod",
  "inventory_path": "environments/prod/inventory",
  "server_count": 16,
  "cluster_count": 3,
  "servers": [{ "hostname": "...", "cluster": "...", "env": "prod" }],
  "clusters": [{ "name": "...", "nodes": 3, "hosts": ["..."] }]
}
```
