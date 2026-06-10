# Sync and Sharing Technical Plan

## Purpose

Let users back up, move, fork, and optionally share their wiki without centralizing the project. Sharing is a layer over portable files, not a hosted dependency.

## Technology Choices

- Zip/tar workspace bundles through small optional Node packages or plain directory export first.
- JSON privacy manifests that declare included and excluded page/source classes.
- Generated indexes omitted by default and rebuilt after import.
- Optional Git-backed sync later for users who want versioned sharing.

## Responsibilities

- Export and import wiki workspaces.
- Support backup-friendly folder structure.
- Record authorship, timestamps, and source provenance for shared edits.
- Detect conflicts between divergent page versions.
- Support read-only shared bundles.
- Keep personal wiki mode as the default.

## Public Interfaces

- `export_workspace(options)`
- `import_workspace(path, options)`
- `create_bundle(filter)`
- `apply_bundle(bundle, options)`
- `detect_conflicts(local, incoming)`
- `resolve_conflict(conflict_id, resolution)`

## Data Model

`Bundle`:

- `id`
- `created_at`
- `source_workspace_id`
- `pages`
- `sources`
- `error_entries`
- `indexes_included`: true or false
- `privacy_manifest`

`Conflict`:

- `id`
- `type`: page_edit, claim_status, link_edit, source_manifest
- `local_ref`
- `incoming_ref`
- `base_revision`
- `resolution_status`

## Implementation Milestones

1. Document manual backup and restore.
2. Implement export/import bundles.
3. Add privacy manifest and sensitive-source exclusion.
4. Add conflict detection for page edits.
5. Add authorship metadata.
6. Add team/shared wiki guidance.

## Tests

- Exported bundle imports into a fresh workspace.
- Sensitive sources can be excluded.
- Generated indexes can be omitted and rebuilt.
- Conflict detection catches divergent page edits.
- Read-only bundle cannot mutate original workspace.

## Risks

- Sharing personal memory can leak sensitive data. Privacy manifests and exclusion filters are mandatory before public sharing features.
- Conflict resolution can get complex quickly. Start with conservative detection and manual resolution.
- Sync should not become a cloud product requirement.
