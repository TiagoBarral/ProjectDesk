# ProjectDesk Migration

This temporary folder carries the local ProjectDesk context and encrypted local-only files to a new computer through Git.

## What Is Here

- `NEW_COMPUTER_HANDOFF.md` - project background and a ready-to-paste first message for a new Codex chat
- `extensions.txt` - optional VS Code extension list
- `projectdesk-private.7z` - encrypted archive containing:
  - `.env`
  - `_private/CREDENTIALS.md`
  - `_private/JOURNAL.md`
  - `_private/NEW_COMPUTER_HANDOFF.md`
- `restore-private-files.ps1` - extracts and restores the encrypted files into the new clone

The archive password is intentionally not stored in Git. It is saved on the old computer at:

```text
D:\PERSONAL\ProjectDesk-Transfer-2026-10-28\MIGRATION-ARCHIVE-PASSWORD.txt
```

Transfer that password separately using a trusted USB drive, password manager, or another private channel.

## Next Steps on the New Computer

1. Install Git, Node.js LTS, 7-Zip, VS Code or Codex, and Chrome or Edge.
2. Transfer `MIGRATION-ARCHIVE-PASSWORD.txt` privately from the old computer.
3. Clone ProjectDesk and enter the project folder:

   ```powershell
   git clone https://github.com/TiagoBarral/ProjectDesk.git
   cd ProjectDesk
   ```

4. Restore the private files:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\migration\restore-private-files.ps1
   ```

5. Enter the password from `MIGRATION-ARCHIVE-PASSWORD.txt` when prompted.
6. Install dependencies:

   ```powershell
   npm install
   ```

7. Verify the project:

   ```powershell
   npm run test:run
   npm run lint
   npm run build
   ```

8. Start ProjectDesk:

   ```powershell
   npm run dev
   ```

9. Open `http://localhost:5173`, sign in, and confirm projects, sync, private files, and AI Improve work.
10. Keep the old computer and JSON data export until the new setup is fully verified, then follow the cleanup steps below.

## Restore on the New Computer

Install 7-Zip, clone ProjectDesk, and open PowerShell in the clone:

```powershell
git clone https://github.com/TiagoBarral/ProjectDesk.git
cd ProjectDesk
```

Run the restore script. It will ask for the archive password without displaying it:

```powershell
powershell -ExecutionPolicy Bypass -File .\migration\restore-private-files.ps1
```

The script refuses to overwrite an existing `.env` or `_private` file unless you explicitly add `-Force`.

Then install and verify the project:

```powershell
npm install
npm run test:run
npm run lint
npm run build
npm run dev
```

Optional VS Code extension restore:

```powershell
Get-Content .\migration\extensions.txt | ForEach-Object { code --install-extension $_ }
```

Before retiring the old computer, export a JSON backup from ProjectDesk's Data menu. Browser localStorage is not part of Git or this encrypted archive.

## After Migration

After the new computer is fully working:

1. Delete the `migration/` folder from the repository working tree.
2. Commit and push that deletion so the temporary migration folder is no longer present on `main`.
3. Add `migration/` to `.gitignore` only if you plan to keep a local migration folder afterward.
4. Delete extra copies of the password and encrypted archive when you no longer need them.

Important: adding `migration/` to `.gitignore` alone does not remove files already committed to Git history. The sensitive files are encrypted for that reason, and the password must never be committed.
