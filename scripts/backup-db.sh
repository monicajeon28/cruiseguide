#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_PATH="./prisma/dev.db" # 실제 DB 파일 경로 확인 필요
mkdir -p $BACKUP_DIR
if [ -f "$DB_PATH" ]; then
  # SQLite 백업 실행
  sqlite3 $DB_PATH ".backup '$BACKUP_DIR/db_backup_$DATE.sqlite'"
  echo "Backup completed: db_backup_$DATE.sqlite"
  
  # 7일 이상 된 백업 파일 삭제
  find $BACKUP_DIR -name "db_backup_*.sqlite" -mtime +7 -delete
  echo "Old backups cleaned up."
else
  echo "Error: Database file not found at $DB_PATH"
  exit 1
fi

