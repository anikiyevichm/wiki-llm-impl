# Automation Notes

The project should automate every repeated wiki step as it becomes clear. The first scripts are intentionally small and local:

- `scripts/init-my-wiki.ps1`: create the local `my-wiki/` folder structure.
- `scripts/new-wiki-page.ps1`: create a Markdown page with JSON frontmatter.
- `scripts/check-wiki.ps1`: validate required page frontmatter fields.

These scripts are a bridge to the future TypeScript CLI. Once Storage Core exists, the Node CLI should replace script internals while preserving the same workflow:

```powershell
.\scripts\init-my-wiki.ps1
.\scripts\new-wiki-page.ps1 -Title "New Topic" -Type synthesis
.\scripts\check-wiki.ps1
```

`my-wiki/` is intentionally ignored by Git. It is a local dogfood workspace and may contain personal memory.
