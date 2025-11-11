This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Database Backup

### Manual Backup

To manually backup the SQLite database, run:

```bash
./scripts/backup-db.sh
```

This will create a timestamped backup file in the `./backups` directory and automatically clean up backups older than 7 days.

### Automatic Backup with Cron Job

To schedule automatic database backups on a server, you can set up a cron job:

1. Open the crontab editor:
   ```bash
   crontab -e
   ```

2. Add one of the following lines depending on your preferred backup frequency:

   **Daily backup at 2:00 AM:**
   ```cron
   0 2 * * * cd /home/userhyeseon28/projects/cruise-guide && ./scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
   ```

   **Every 6 hours:**
   ```cron
   0 */6 * * * cd /home/userhyeseon28/projects/cruise-guide && ./scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
   ```

   **Weekly backup every Sunday at 3:00 AM:**
   ```cron
   0 3 * * 0 cd /home/userhyeseon28/projects/cruise-guide && ./scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
   ```

3. Save and exit the editor. The cron job will now run automatically at the scheduled times.

**Note:** Make sure to replace `/home/userhyeseon28/projects/cruise-guide` with the actual path to your project directory on the server.

## Session Management

### Manual Session Cleanup

To manually cleanup expired sessions, run:

```bash
./scripts/cleanup-sessions.sh
```

Or directly with TypeScript:

```bash
npx tsx scripts/cleanup-sessions.ts
```

This will:
- Delete all sessions that have passed their expiration time
- Remove legacy sessions older than 30 days without expiration
- Display cleanup statistics

### Automatic Session Cleanup with Cron Job

To schedule automatic session cleanup, add to crontab:

1. Open the crontab editor:
   ```bash
   crontab -e
   ```

2. Add one of the following lines:

   **Daily cleanup at 3:00 AM:**
   ```cron
   0 3 * * * cd /home/userhyeseon28/projects/cruise-guide && ./scripts/cleanup-sessions.sh >> /var/log/session-cleanup.log 2>&1
   ```

   **Every 6 hours:**
   ```cron
   0 */6 * * * cd /home/userhyeseon28/projects/cruise-guide && ./scripts/cleanup-sessions.sh >> /var/log/session-cleanup.log 2>&1
   ```

**Note:** Sessions automatically expire after 30 days from creation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
