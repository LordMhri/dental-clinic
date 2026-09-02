#!/usr/bin/env bash
# ==============================================================================
# Lewi Dental Clinic ERP - Automated PostgreSQL Database Backup Script
# Creates a compressed, timestamped pg_dump of dental_clinic_db.
# Automatically rotates backups, retaining the most recent 7 daily dumps.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${HOME}/dental_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dental_clinic_db_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="sys-db-service"
DB_USER="sysadmin"
DB_NAME="dental_clinic_db"

mkdir -p "${BACKUP_DIR}"

echo "📦 [Backup] Initiating database backup for ${DB_NAME} at $(date)..."

# Perform pg_dump inside sys-db-service container, stream to gzip
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✅ [Backup] Backup completed successfully: ${BACKUP_FILE} (${FILESIZE})"

# Retention: Keep last 7 days of backups
echo "🧹 [Backup] Rotating backups (retaining latest 7 dumps)..."
find "${BACKUP_DIR}" -type f -name "dental_clinic_db_*.sql.gz" -mtime +7 -delete || true

echo "🎉 [Backup] Maintenance complete."
