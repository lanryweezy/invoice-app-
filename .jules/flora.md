## 2026-08-06 - Added Max Retry Cap to Offline Sync
**Learning:** During network disruptions, offline queue flushes using Promise.allSettled can infinitely retry permanently failing mutations (e.g. malformed data or permission errors), causing retry storms that hammer the backend once connectivity is restored.
**Action:** Always constrain offline queues with a maximum attempt limit (e.g. 5) per item. Drop the item and log a specific telemetry event ('sync_item_dropped_max_retries') when the limit is reached instead of continuously trying.
