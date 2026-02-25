# Inventory fixtures

These JSON files provide fake inventory data for quick UI testing when real Ansible inventory or Python/Ansible dependencies are unavailable.

## Files
- `prod.json`
- `qa.json`
- `dev.json`

The dashboard loader (`src/lib/inventory.ts`) automatically falls back to these fixtures if `inventory_summary.py` fails.

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
