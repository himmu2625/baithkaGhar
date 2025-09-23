# Comprehensive Backup and Recovery Documentation

## Table of Contents

1. [Backup Strategy Overview](#backup-strategy-overview)
2. [Data Classification](#data-classification)
3. [Backup Types and Schedules](#backup-types-and-schedules)
4. [Database Backup Procedures](#database-backup-procedures)
5. [Application Data Backup](#application-data-backup)
6. [File System Backup](#file-system-backup)
7. [Configuration Backup](#configuration-backup)
8. [Recovery Procedures](#recovery-procedures)
9. [Disaster Recovery Planning](#disaster-recovery-planning)
10. [Testing and Validation](#testing-and-validation)
11. [Monitoring and Alerting](#monitoring-and-alerting)
12. [Compliance and Retention](#compliance-and-retention)

---

## Backup Strategy Overview

### Business Requirements

#### Recovery Time Objective (RTO)
- **Critical Systems**: 1 hour maximum downtime
- **Standard Systems**: 4 hours maximum downtime
- **Non-Critical Systems**: 24 hours maximum downtime

#### Recovery Point Objective (RPO)
- **Booking Data**: Maximum 15 minutes data loss
- **Guest Profiles**: Maximum 1 hour data loss
- **Financial Data**: Maximum 5 minutes data loss
- **Reporting Data**: Maximum 4 hours data loss

### 3-2-1 Backup Strategy

```
3 Copies of Data:
├── 1 Primary (Production System)
├── 1 Local Backup (On-site NAS/Storage)
└── 1 Remote Backup (Cloud Storage)

2 Different Media Types:
├── Disk Storage (Fast Recovery)
└── Cloud Storage (Long-term Retention)

1 Offsite Copy:
└── Geographic Redundancy (Different Region)
```

### Backup Infrastructure

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Production    │    │   Local Backup  │    │   Cloud Backup  │
│   Environment   │───►│   Storage       │───►│   (AWS S3/Azure)│
│                 │    │                 │    │                 │
│ • Database      │    │ • 30-day        │    │ • 90-day        │
│ • App Files     │    │   Retention     │    │   Retention     │
│ • User Data     │    │ • Fast Recovery │    │ • Compliance    │
│ • Configs       │    │ • RAID 6        │    │ • Geo-redundant │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Data Classification

### Critical Data (Tier 1)
**Recovery Requirements**: RTO ≤ 1 hour, RPO ≤ 15 minutes

- **Booking Reservations**
  - Guest details and contact information
  - Check-in/check-out dates
  - Room assignments and preferences
  - Payment information and status

- **Financial Transactions**
  - Payment records and receipts
  - Refund transactions
  - Account balances
  - Audit trails

- **Real-time Inventory**
  - Room availability
  - Rate information
  - Booking restrictions

### Important Data (Tier 2)
**Recovery Requirements**: RTO ≤ 4 hours, RPO ≤ 1 hour

- **Guest Profiles**
  - Historical booking data
  - Preferences and notes
  - Loyalty program information
  - Communication history

- **Property Configuration**
  - Room types and amenities
  - Rate plans and policies
  - User accounts and permissions
  - Integration settings

### Standard Data (Tier 3)
**Recovery Requirements**: RTO ≤ 24 hours, RPO ≤ 4 hours

- **Reporting and Analytics**
  - Historical reports
  - Performance metrics
  - Usage statistics
  - Archived data

- **System Logs**
  - Application logs
  - Access logs
  - Error logs
  - Audit logs

---

## Backup Types and Schedules

### Production Backup Schedule

#### Database Backups
```bash
# Full Backup - Daily at 2:00 AM
0 2 * * * /scripts/db_full_backup.sh

# Incremental Backup - Every 4 hours
0 */4 * * * /scripts/db_incremental_backup.sh

# Transaction Log Backup - Every 15 minutes
*/15 * * * * /scripts/db_log_backup.sh

# Weekly Archive - Sundays at 1:00 AM
0 1 * * 0 /scripts/db_weekly_archive.sh
```

#### Application Data Backups
```bash
# Application files - Daily at 3:00 AM
0 3 * * * /scripts/app_backup.sh

# User uploads - Every 6 hours
0 */6 * * * /scripts/uploads_backup.sh

# Configuration files - Daily at 4:00 AM
0 4 * * * /scripts/config_backup.sh

# SSL certificates - Weekly
0 5 * * 1 /scripts/ssl_backup.sh
```

#### System Backups
```bash
# Full system image - Weekly
0 1 * * 0 /scripts/system_image_backup.sh

# Critical system files - Daily
0 6 * * * /scripts/system_files_backup.sh
```

### Backup Retention Policy

| Backup Type | Frequency | Local Retention | Cloud Retention | Archive |
|-------------|-----------|-----------------|-----------------|---------|
| **Transaction Logs** | 15 minutes | 7 days | 30 days | N/A |
| **Incremental DB** | 4 hours | 14 days | 60 days | N/A |
| **Full Database** | Daily | 30 days | 90 days | 7 years |
| **Application Data** | Daily | 30 days | 90 days | 1 year |
| **System Image** | Weekly | 4 weeks | 12 weeks | 1 year |
| **Configuration** | Daily | 30 days | 90 days | 3 years |

---

## Database Backup Procedures

### MongoDB Backup Scripts

#### Full Database Backup
```bash
#!/bin/bash
# db_full_backup.sh - Complete MongoDB backup

# Configuration
DB_NAME="booking_system"
BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/full_${DB_NAME}_${TIMESTAMP}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Perform backup
echo "Starting full backup of ${DB_NAME} at $(date)"

mongodump \
  --host localhost:27017 \
  --db "${DB_NAME}" \
  --out "${BACKUP_FILE}" \
  --gzip \
  --oplog

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: ${BACKUP_FILE}"

  # Compress backup
  tar -czf "${BACKUP_FILE}.tar.gz" -C "${BACKUP_DIR}" "$(basename ${BACKUP_FILE})"
  rm -rf "${BACKUP_FILE}"

  # Upload to cloud storage
  aws s3 cp "${BACKUP_FILE}.tar.gz" "s3://backup-bucket/mongodb/full/" \
    --storage-class STANDARD_IA

  # Verify backup integrity
  if [ -f "${BACKUP_FILE}.tar.gz" ]; then
    tar -tzf "${BACKUP_FILE}.tar.gz" > /dev/null
    if [ $? -eq 0 ]; then
      echo "Backup integrity verified"

      # Log successful backup
      echo "$(date): Full backup completed - ${BACKUP_FILE}.tar.gz" >> /var/log/backup.log
    else
      echo "ERROR: Backup integrity check failed"
      exit 1
    fi
  fi

  # Clean up old backups
  find "${BACKUP_DIR}" -name "full_${DB_NAME}_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

else
  echo "ERROR: Backup failed"
  exit 1
fi
```

#### Incremental Backup Script
```bash
#!/bin/bash
# db_incremental_backup.sh - MongoDB incremental backup

# Configuration
DB_NAME="booking_system"
BACKUP_DIR="/backups/mongodb/incremental"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OPLOG_FILE="${BACKUP_DIR}/oplog_${TIMESTAMP}.bson"
LAST_BACKUP_FILE="/var/lib/backup/last_backup_timestamp"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Get last backup timestamp
if [ -f "${LAST_BACKUP_FILE}" ]; then
  LAST_TIMESTAMP=$(cat "${LAST_BACKUP_FILE}")
else
  # If no previous backup, start from 1 hour ago
  LAST_TIMESTAMP=$(date -d "1 hour ago" -u +%s)
fi

# Convert to MongoDB timestamp format
MONGO_TIMESTAMP="Timestamp(${LAST_TIMESTAMP}, 1)"

echo "Starting incremental backup from timestamp: ${MONGO_TIMESTAMP}"

# Dump oplog since last backup
mongodump \
  --host localhost:27017 \
  --collection oplog.rs \
  --db local \
  --query "{ 'ts': { '\$gte': ${MONGO_TIMESTAMP} } }" \
  --out "${BACKUP_DIR}/temp_${TIMESTAMP}"

if [ $? -eq 0 ]; then
  # Move oplog file to final location
  mv "${BACKUP_DIR}/temp_${TIMESTAMP}/local/oplog.rs.bson" "${OPLOG_FILE}"
  rm -rf "${BACKUP_DIR}/temp_${TIMESTAMP}"

  # Compress and upload
  gzip "${OPLOG_FILE}"
  aws s3 cp "${OPLOG_FILE}.gz" "s3://backup-bucket/mongodb/incremental/"

  # Update last backup timestamp
  date -u +%s > "${LAST_BACKUP_FILE}"

  echo "Incremental backup completed: ${OPLOG_FILE}.gz"
else
  echo "ERROR: Incremental backup failed"
  exit 1
fi
```

### PostgreSQL Backup (Alternative)

#### Full Backup Script
```bash
#!/bin/bash
# postgres_backup.sh - PostgreSQL backup

# Configuration
DB_NAME="booking_system"
DB_USER="backup_user"
BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

# Set password from environment
export PGPASSWORD="${POSTGRES_BACKUP_PASSWORD}"

# Create backup
echo "Starting PostgreSQL backup at $(date)"

pg_dump \
  -h localhost \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --verbose \
  --no-password \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "Backup completed: ${BACKUP_FILE}"

  # Upload to cloud
  aws s3 cp "${BACKUP_FILE}" "s3://backup-bucket/postgresql/"

  # Verify backup
  pg_restore --list "${BACKUP_FILE}" > /dev/null
  if [ $? -eq 0 ]; then
    echo "Backup verification successful"
  else
    echo "ERROR: Backup verification failed"
    exit 1
  fi
else
  echo "ERROR: PostgreSQL backup failed"
  exit 1
fi
```

---

## Application Data Backup

### File System Backup Script

```bash
#!/bin/bash
# app_backup.sh - Application files backup

# Configuration
APP_DIR="/var/www/booking-system"
BACKUP_DIR="/backups/application"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/app_${TIMESTAMP}.tar.gz"
EXCLUDE_FILE="/etc/backup/app_exclude.txt"

# Create exclude file if it doesn't exist
cat > "${EXCLUDE_FILE}" << EOF
# Exclude patterns for application backup
node_modules/
.git/
*.log
*.tmp
.env
/uploads/temp/
/cache/
/.next/cache/
EOF

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "Starting application backup at $(date)"

# Create compressed archive
tar -czf "${BACKUP_FILE}" \
  -C "$(dirname ${APP_DIR})" \
  --exclude-from="${EXCLUDE_FILE}" \
  "$(basename ${APP_DIR})"

if [ $? -eq 0 ]; then
  echo "Application backup completed: ${BACKUP_FILE}"

  # Calculate checksum
  sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

  # Upload to cloud storage
  aws s3 cp "${BACKUP_FILE}" "s3://backup-bucket/application/" \
    --metadata "checksum=$(cat ${BACKUP_FILE}.sha256 | cut -d' ' -f1)"

  aws s3 cp "${BACKUP_FILE}.sha256" "s3://backup-bucket/application/"

  # Verify upload
  aws s3 ls "s3://backup-bucket/application/$(basename ${BACKUP_FILE})" > /dev/null
  if [ $? -eq 0 ]; then
    echo "Cloud upload verified"
  else
    echo "ERROR: Cloud upload verification failed"
    exit 1
  fi

  # Clean up old local backups
  find "${BACKUP_DIR}" -name "app_*.tar.gz" -mtime +7 -delete

else
  echo "ERROR: Application backup failed"
  exit 1
fi
```

### User Uploads Backup

```bash
#!/bin/bash
# uploads_backup.sh - User uploads backup with rsync

# Configuration
UPLOADS_DIR="/var/www/booking-system/public/uploads"
BACKUP_DIR="/backups/uploads"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/uploads_backup.log"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "Starting uploads backup at $(date)" | tee -a "${LOG_FILE}"

# Sync uploads with rsync (incremental)
rsync -avz \
  --delete \
  --exclude='temp/' \
  --exclude='*.tmp' \
  --log-file="${LOG_FILE}" \
  "${UPLOADS_DIR}/" \
  "${BACKUP_DIR}/current/"

if [ $? -eq 0 ]; then
  echo "Uploads sync completed" | tee -a "${LOG_FILE}"

  # Create dated snapshot
  cp -al "${BACKUP_DIR}/current" "${BACKUP_DIR}/${TIMESTAMP}"

  # Upload changed files to cloud
  aws s3 sync "${BACKUP_DIR}/current/" "s3://backup-bucket/uploads/" \
    --delete \
    --exclude="*.tmp"

  # Clean up old snapshots (keep 30 days)
  find "${BACKUP_DIR}" -maxdepth 1 -type d -name "20*" -mtime +30 -exec rm -rf {} \;

else
  echo "ERROR: Uploads backup failed" | tee -a "${LOG_FILE}"
  exit 1
fi
```

---

## Configuration Backup

### System Configuration Backup

```bash
#!/bin/bash
# config_backup.sh - System and application configuration backup

# Configuration
CONFIG_DIRS=(
  "/etc/nginx"
  "/etc/ssl"
  "/etc/systemd/system"
  "/var/www/booking-system/config"
  "/var/www/booking-system/.env"
  "/home/app/.ssh"
)

BACKUP_DIR="/backups/configuration"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/config_${TIMESTAMP}.tar.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "Starting configuration backup at $(date)"

# Create temporary directory for staging
TEMP_DIR=$(mktemp -d)
CONFIG_STAGE="${TEMP_DIR}/config"
mkdir -p "${CONFIG_STAGE}"

# Copy configuration files
for dir in "${CONFIG_DIRS[@]}"; do
  if [ -e "${dir}" ]; then
    # Create directory structure
    mkdir -p "${CONFIG_STAGE}$(dirname ${dir})"

    # Copy files/directories
    cp -a "${dir}" "${CONFIG_STAGE}${dir}"
    echo "Backed up: ${dir}"
  else
    echo "Warning: ${dir} not found, skipping"
  fi
done

# Add system information
cat > "${CONFIG_STAGE}/system_info.txt" << EOF
# System Information - $(date)
Hostname: $(hostname)
OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
Kernel: $(uname -r)
Architecture: $(uname -m)
Uptime: $(uptime)
Disk Usage: $(df -h / | tail -1)
Memory: $(free -h | grep Mem:)

# Installed Packages
$(dpkg -l | grep -E "nginx|node|mongo" || rpm -qa | grep -E "nginx|node|mongo")

# Running Services
$(systemctl list-units --type=service --state=running | grep -E "nginx|booking|mongo")

# Network Configuration
$(ip addr show | grep -E "inet |inet6")
EOF

# Create compressed archive
tar -czf "${BACKUP_FILE}" -C "${TEMP_DIR}" config

if [ $? -eq 0 ]; then
  echo "Configuration backup completed: ${BACKUP_FILE}"

  # Clean up temp directory
  rm -rf "${TEMP_DIR}"

  # Encrypt backup for security
  gpg --cipher-algo AES256 --compress-algo 1 --symmetric \
    --output "${BACKUP_FILE}.gpg" "${BACKUP_FILE}"

  if [ $? -eq 0 ]; then
    # Upload encrypted backup
    aws s3 cp "${BACKUP_FILE}.gpg" "s3://backup-bucket/configuration/"

    # Remove unencrypted local copy
    rm -f "${BACKUP_FILE}"

    echo "Encrypted configuration backup uploaded"
  else
    echo "ERROR: Configuration backup encryption failed"
    exit 1
  fi

else
  echo "ERROR: Configuration backup failed"
  rm -rf "${TEMP_DIR}"
  exit 1
fi
```

### Database Configuration Backup

```bash
#!/bin/bash
# db_config_backup.sh - Database configuration backup

# MongoDB configuration backup
echo "Backing up MongoDB configuration..."

# Backup MongoDB config file
cp /etc/mongod.conf "/backups/configuration/mongod_$(date +%Y%m%d).conf"

# Export user accounts and roles
mongo --eval "
  printjson(db.runCommand('usersInfo'));
  printjson(db.runCommand('rolesInfo'));
" > "/backups/configuration/mongo_users_$(date +%Y%m%d).json"

# Backup replica set configuration
mongo --eval "
  rs.conf();
" > "/backups/configuration/mongo_replica_$(date +%Y%m%d).json"

echo "MongoDB configuration backup completed"
```

---

## Recovery Procedures

### Database Recovery

#### Complete Database Restore (MongoDB)

```bash
#!/bin/bash
# restore_mongodb.sh - Complete MongoDB restore from backup

# Configuration
DB_NAME="booking_system"
BACKUP_FILE="$1"  # Pass backup file as argument
TEMP_DIR="/tmp/restore_$(date +%s)"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup_file.tar.gz>"
  exit 1
fi

echo "Starting MongoDB restore from: ${BACKUP_FILE}"
echo "WARNING: This will replace the current database!"
read -p "Continue? (yes/no): " confirm

if [ "${confirm}" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# Create temporary directory
mkdir -p "${TEMP_DIR}"

# Extract backup
echo "Extracting backup..."
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to extract backup"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Stop application services
echo "Stopping application services..."
systemctl stop booking-app
systemctl stop nginx

# Drop existing database (with confirmation)
echo "Dropping existing database..."
mongo --eval "db.getSiblingDB('${DB_NAME}').dropDatabase()"

# Restore database
echo "Restoring database..."
mongorestore \
  --host localhost:27017 \
  --db "${DB_NAME}" \
  --gzip \
  "${TEMP_DIR}/$(basename ${BACKUP_FILE} .tar.gz)/${DB_NAME}"

if [ $? -eq 0 ]; then
  echo "Database restore completed successfully"

  # Start services
  echo "Starting application services..."
  systemctl start booking-app
  systemctl start nginx

  # Verify restore
  echo "Verifying restore..."
  COLLECTION_COUNT=$(mongo --quiet --eval "db.getSiblingDB('${DB_NAME}').stats().collections")
  echo "Restored collections: ${COLLECTION_COUNT}"

  # Clean up
  rm -rf "${TEMP_DIR}"

  echo "Restore completed successfully"
else
  echo "ERROR: Database restore failed"
  rm -rf "${TEMP_DIR}"
  exit 1
fi
```

#### Point-in-Time Recovery (MongoDB)

```bash
#!/bin/bash
# restore_pit_mongodb.sh - MongoDB Point-in-Time Recovery

# Configuration
DB_NAME="booking_system"
FULL_BACKUP="$1"
TARGET_TIME="$2"  # Format: "YYYY-MM-DD HH:MM:SS"
OPLOG_DIR="/backups/mongodb/incremental"
TEMP_DIR="/tmp/pit_restore_$(date +%s)"

if [ -z "${FULL_BACKUP}" ] || [ -z "${TARGET_TIME}" ]; then
  echo "Usage: $0 <full_backup.tar.gz> 'YYYY-MM-DD HH:MM:SS'"
  exit 1
fi

# Convert target time to Unix timestamp
TARGET_TIMESTAMP=$(date -d "${TARGET_TIME}" +%s)

echo "Starting Point-in-Time Recovery"
echo "Target time: ${TARGET_TIME} (${TARGET_TIMESTAMP})"

# Extract full backup
mkdir -p "${TEMP_DIR}"
tar -xzf "${FULL_BACKUP}" -C "${TEMP_DIR}"

# Restore full backup first
mongorestore --drop "${TEMP_DIR}/$(basename ${FULL_BACKUP} .tar.gz)/${DB_NAME}"

# Apply oplog entries up to target time
echo "Applying oplog entries up to target time..."

find "${OPLOG_DIR}" -name "oplog_*.bson.gz" | sort | while read oplog_file; do
  # Extract timestamp from filename
  file_timestamp=$(basename "${oplog_file}" | sed 's/oplog_\([0-9]*\)_[0-9]*.bson.gz/\1/')

  if [ "${file_timestamp}" -le "${TARGET_TIMESTAMP}" ]; then
    echo "Applying oplog: ${oplog_file}"

    # Decompress and apply oplog
    gunzip -c "${oplog_file}" > "${TEMP_DIR}/temp_oplog.bson"

    mongorestore \
      --oplogReplay \
      --oplogLimit "${TARGET_TIMESTAMP}:1" \
      "${TEMP_DIR}/temp_oplog.bson"

    rm -f "${TEMP_DIR}/temp_oplog.bson"
  fi
done

echo "Point-in-Time Recovery completed"
rm -rf "${TEMP_DIR}"
```

### Application Recovery

#### Application Files Restore

```bash
#!/bin/bash
# restore_application.sh - Application files restore

# Configuration
APP_DIR="/var/www/booking-system"
BACKUP_FILE="$1"
BACKUP_DIR="${APP_DIR}_backup_$(date +%s)"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <app_backup.tar.gz>"
  exit 1
fi

echo "Starting application restore from: ${BACKUP_FILE}"

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Verify backup integrity
echo "Verifying backup integrity..."
if [ -f "${BACKUP_FILE}.sha256" ]; then
  sha256sum -c "${BACKUP_FILE}.sha256"
  if [ $? -ne 0 ]; then
    echo "ERROR: Backup integrity check failed"
    exit 1
  fi
  echo "Backup integrity verified"
fi

# Stop application services
echo "Stopping services..."
systemctl stop booking-app
systemctl stop nginx

# Backup current application (safety measure)
echo "Creating safety backup of current application..."
mv "${APP_DIR}" "${BACKUP_DIR}"

# Extract new application
echo "Extracting application backup..."
mkdir -p "$(dirname ${APP_DIR})"
tar -xzf "${BACKUP_FILE}" -C "$(dirname ${APP_DIR})"

if [ $? -eq 0 ]; then
  echo "Application files restored successfully"

  # Set proper permissions
  chown -R app:app "${APP_DIR}"
  chmod -R 755 "${APP_DIR}"

  # Restore environment configuration
  if [ -f "${BACKUP_DIR}/.env" ]; then
    cp "${BACKUP_DIR}/.env" "${APP_DIR}/"
  fi

  # Install dependencies
  echo "Installing dependencies..."
  cd "${APP_DIR}"
  npm ci --production

  # Start services
  echo "Starting services..."
  systemctl start booking-app
  systemctl start nginx

  # Verify application
  sleep 10
  curl -f http://localhost/health
  if [ $? -eq 0 ]; then
    echo "Application restore completed successfully"

    # Clean up old backup after successful restore
    read -p "Remove old application backup? (${BACKUP_DIR}) [y/N]: " cleanup
    if [ "${cleanup}" = "y" ]; then
      rm -rf "${BACKUP_DIR}"
    fi
  else
    echo "ERROR: Application health check failed"
    echo "Rolling back to previous version..."

    systemctl stop booking-app nginx
    rm -rf "${APP_DIR}"
    mv "${BACKUP_DIR}" "${APP_DIR}"
    systemctl start booking-app nginx
    exit 1
  fi
else
  echo "ERROR: Failed to extract application backup"

  # Restore previous version
  mv "${BACKUP_DIR}" "${APP_DIR}"
  systemctl start booking-app nginx
  exit 1
fi
```

### Configuration Recovery

#### System Configuration Restore

```bash
#!/bin/bash
# restore_configuration.sh - System configuration restore

# Configuration
CONFIG_BACKUP="$1"
TEMP_DIR="/tmp/config_restore_$(date +%s)"

if [ -z "${CONFIG_BACKUP}" ]; then
  echo "Usage: $0 <config_backup.tar.gz.gpg>"
  exit 1
fi

echo "Starting configuration restore from: ${CONFIG_BACKUP}"

# Create temp directory
mkdir -p "${TEMP_DIR}"

# Decrypt backup
echo "Decrypting configuration backup..."
gpg --output "${TEMP_DIR}/config.tar.gz" --decrypt "${CONFIG_BACKUP}"

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to decrypt configuration backup"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Extract configuration
tar -xzf "${TEMP_DIR}/config.tar.gz" -C "${TEMP_DIR}"

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to extract configuration"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Restore configuration files
echo "Restoring configuration files..."

# Create backup of current configuration
CURRENT_BACKUP="/tmp/current_config_$(date +%s).tar.gz"
tar -czf "${CURRENT_BACKUP}" \
  /etc/nginx \
  /etc/ssl \
  /etc/systemd/system \
  /var/www/booking-system/config 2>/dev/null

# Restore files
rsync -av "${TEMP_DIR}/config/" /

# Reload services
echo "Reloading services..."
systemctl daemon-reload
systemctl reload nginx

# Test configuration
echo "Testing configuration..."
nginx -t
if [ $? -eq 0 ]; then
  echo "Nginx configuration valid"
else
  echo "ERROR: Nginx configuration invalid, rolling back..."
  tar -xzf "${CURRENT_BACKUP}" -C /
  systemctl reload nginx
  rm -rf "${TEMP_DIR}"
  exit 1
fi

echo "Configuration restore completed successfully"
rm -rf "${TEMP_DIR}"
```

---

## Disaster Recovery Planning

### Disaster Recovery Scenarios

#### Scenario 1: Complete Data Center Failure

**Recovery Steps:**

1. **Immediate Response (0-15 minutes)**
   ```bash
   # Activate disaster recovery site
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456789 \
     --change-batch file://failover-dns.json

   # Scale up DR environment
   kubectl scale deployment booking-app --replicas=3 -n production
   kubectl scale deployment mongodb --replicas=3 -n production
   ```

2. **Data Recovery (15-60 minutes)**
   ```bash
   # Restore latest database backup to DR site
   ./scripts/restore_latest_backup.sh

   # Verify data integrity
   ./scripts/verify_data_integrity.sh

   # Update configuration for DR environment
   ./scripts/update_dr_config.sh
   ```

3. **Service Validation (60-90 minutes)**
   ```bash
   # Run health checks
   ./scripts/health_check_all.sh

   # Validate booking flow
   ./scripts/test_booking_flow.sh

   # Notify stakeholders
   ./scripts/send_dr_notification.sh
   ```

#### Scenario 2: Database Corruption

**Recovery Steps:**

1. **Immediate Isolation (0-5 minutes)**
   ```bash
   # Stop all write operations
   kubectl patch deployment booking-app -p '{"spec":{"replicas":0}}'

   # Put system in maintenance mode
   kubectl create configmap maintenance-mode --from-literal=enabled=true
   ```

2. **Damage Assessment (5-30 minutes)**
   ```bash
   # Check database integrity
   mongod --dbpath /data/db --repair --repairpath /data/repair

   # Identify corrupted collections
   ./scripts/check_db_integrity.sh

   # Determine recovery point
   ./scripts/find_last_good_backup.sh
   ```

3. **Data Recovery (30-120 minutes)**
   ```bash
   # Restore from last known good backup
   ./scripts/restore_database.sh /backups/last_good_backup.tar.gz

   # Apply incremental changes if available
   ./scripts/apply_incremental_restore.sh

   # Validate restored data
   ./scripts/validate_restored_data.sh
   ```

### DR Testing Schedule

#### Monthly DR Tests
```bash
#!/bin/bash
# monthly_dr_test.sh - Monthly disaster recovery test

echo "Starting monthly DR test - $(date)"

# Test 1: Backup Restoration Test
echo "Testing backup restoration..."
./scripts/test_backup_restore.sh

# Test 2: Application Failover Test
echo "Testing application failover..."
./scripts/test_application_failover.sh

# Test 3: Database Recovery Test
echo "Testing database recovery..."
./scripts/test_database_recovery.sh

# Test 4: Network Failover Test
echo "Testing network failover..."
./scripts/test_network_failover.sh

# Generate DR test report
./scripts/generate_dr_report.sh

echo "Monthly DR test completed - $(date)"
```

#### Quarterly Full DR Simulation
```bash
#!/bin/bash
# quarterly_full_dr_test.sh - Complete disaster recovery simulation

echo "Starting quarterly full DR simulation - $(date)"

# Simulate primary site failure
echo "Simulating primary site failure..."
./scripts/simulate_site_failure.sh

# Execute full failover procedure
echo "Executing failover procedure..."
./scripts/execute_full_failover.sh

# Validate all systems in DR mode
echo "Validating DR systems..."
./scripts/validate_dr_systems.sh

# Test business operations
echo "Testing business operations..."
./scripts/test_business_operations.sh

# Execute failback procedure
echo "Testing failback procedure..."
./scripts/test_failback_procedure.sh

# Generate comprehensive report
./scripts/generate_full_dr_report.sh

echo "Quarterly full DR simulation completed - $(date)"
```

---

## Testing and Validation

### Backup Validation Scripts

#### Database Backup Test

```bash
#!/bin/bash
# test_db_backup.sh - Database backup validation

# Configuration
BACKUP_FILE="$1"
TEST_DB="booking_system_test"
TEMP_DIR="/tmp/backup_test_$(date +%s)"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup_file.tar.gz>"
  exit 1
fi

echo "Testing database backup: ${BACKUP_FILE}"

# Extract backup
mkdir -p "${TEMP_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

# Restore to test database
mongorestore \
  --host localhost:27017 \
  --db "${TEST_DB}" \
  --drop \
  "${TEMP_DIR}/$(basename ${BACKUP_FILE} .tar.gz)/booking_system"

if [ $? -eq 0 ]; then
  echo "Test restore successful"

  # Run validation queries
  echo "Running validation queries..."

  # Count collections
  COLLECTIONS=$(mongo --quiet "${TEST_DB}" --eval "db.getCollectionNames().length")
  echo "Collections restored: ${COLLECTIONS}"

  # Count documents in key collections
  BOOKINGS=$(mongo --quiet "${TEST_DB}" --eval "db.bookings.count()")
  GUESTS=$(mongo --quiet "${TEST_DB}" --eval "db.guests.count()")

  echo "Bookings: ${BOOKINGS}"
  echo "Guests: ${GUESTS}"

  # Validate data integrity
  INVALID_BOOKINGS=$(mongo --quiet "${TEST_DB}" --eval "
    db.bookings.count({
      \$or: [
        { checkInDate: null },
        { checkOutDate: null },
        { guestId: null }
      ]
    })
  ")

  if [ "${INVALID_BOOKINGS}" -eq 0 ]; then
    echo "Data integrity check passed"
    RESULT="PASS"
  else
    echo "WARNING: Found ${INVALID_BOOKINGS} invalid bookings"
    RESULT="WARN"
  fi

  # Clean up test database
  mongo --quiet "${TEST_DB}" --eval "db.dropDatabase()"

else
  echo "ERROR: Test restore failed"
  RESULT="FAIL"
fi

# Clean up
rm -rf "${TEMP_DIR}"

# Log results
echo "$(date): Backup test - ${BACKUP_FILE} - ${RESULT}" >> /var/log/backup_tests.log

echo "Backup test completed: ${RESULT}"
```

#### Application Backup Test

```bash
#!/bin/bash
# test_app_backup.sh - Application backup validation

# Configuration
BACKUP_FILE="$1"
TEST_DIR="/tmp/app_test_$(date +%s)"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <app_backup.tar.gz>"
  exit 1
fi

echo "Testing application backup: ${BACKUP_FILE}"

# Verify checksum if available
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "Verifying checksum..."
  sha256sum -c "${BACKUP_FILE}.sha256"
  if [ $? -ne 0 ]; then
    echo "ERROR: Checksum verification failed"
    exit 1
  fi
  echo "Checksum verified"
fi

# Extract backup
mkdir -p "${TEST_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${TEST_DIR}"

if [ $? -eq 0 ]; then
  echo "Extraction successful"

  # Validate critical files
  CRITICAL_FILES=(
    "package.json"
    "next.config.js"
    "app/page.tsx"
    "lib/mongodb.ts"
  )

  MISSING_FILES=0
  for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "${TEST_DIR}/booking-system/${file}" ]; then
      echo "ERROR: Missing critical file: ${file}"
      MISSING_FILES=$((MISSING_FILES + 1))
    fi
  done

  if [ "${MISSING_FILES}" -eq 0 ]; then
    echo "All critical files present"

    # Test dependency installation
    echo "Testing dependency installation..."
    cd "${TEST_DIR}/booking-system"
    npm ci --production --silent

    if [ $? -eq 0 ]; then
      echo "Dependencies installed successfully"
      RESULT="PASS"
    else
      echo "ERROR: Dependency installation failed"
      RESULT="FAIL"
    fi
  else
    echo "ERROR: ${MISSING_FILES} critical files missing"
    RESULT="FAIL"
  fi
else
  echo "ERROR: Backup extraction failed"
  RESULT="FAIL"
fi

# Clean up
rm -rf "${TEST_DIR}"

# Log results
echo "$(date): App backup test - ${BACKUP_FILE} - ${RESULT}" >> /var/log/backup_tests.log

echo "Application backup test completed: ${RESULT}"
```

### Automated Backup Monitoring

```bash
#!/bin/bash
# monitor_backups.sh - Automated backup monitoring

# Configuration
BACKUP_DIRS=(
  "/backups/mongodb"
  "/backups/application"
  "/backups/configuration"
  "/backups/uploads"
)

ALERT_EMAIL="admin@yourhotel.com"
LOG_FILE="/var/log/backup_monitoring.log"

echo "Starting backup monitoring - $(date)" | tee -a "${LOG_FILE}"

# Check each backup directory
for backup_dir in "${BACKUP_DIRS[@]}"; do
  echo "Checking: ${backup_dir}" | tee -a "${LOG_FILE}"

  if [ ! -d "${backup_dir}" ]; then
    echo "ERROR: Backup directory not found: ${backup_dir}" | tee -a "${LOG_FILE}"
    continue
  fi

  # Check for recent backups (within last 25 hours)
  RECENT_BACKUPS=$(find "${backup_dir}" -name "*.tar.gz" -mtime -1 | wc -l)

  if [ "${RECENT_BACKUPS}" -eq 0 ]; then
    echo "WARNING: No recent backups found in ${backup_dir}" | tee -a "${LOG_FILE}"

    # Send alert email
    echo "No recent backups found in ${backup_dir} on $(hostname)" | \
      mail -s "Backup Alert: Missing Recent Backups" "${ALERT_EMAIL}"
  else
    echo "Recent backups found: ${RECENT_BACKUPS}" | tee -a "${LOG_FILE}"
  fi

  # Check backup sizes (should not be zero)
  ZERO_SIZE_BACKUPS=$(find "${backup_dir}" -name "*.tar.gz" -size 0 | wc -l)

  if [ "${ZERO_SIZE_BACKUPS}" -gt 0 ]; then
    echo "ERROR: Found ${ZERO_SIZE_BACKUPS} zero-size backups in ${backup_dir}" | tee -a "${LOG_FILE}"

    # Send alert email
    echo "Found ${ZERO_SIZE_BACKUPS} zero-size backups in ${backup_dir} on $(hostname)" | \
      mail -s "Backup Alert: Zero-Size Backups" "${ALERT_EMAIL}"
  fi
done

# Check cloud storage sync
echo "Checking cloud storage sync..." | tee -a "${LOG_FILE}"

aws s3 ls s3://backup-bucket/ --recursive | tail -10 | while read line; do
  echo "Cloud: ${line}" | tee -a "${LOG_FILE}"
done

echo "Backup monitoring completed - $(date)" | tee -a "${LOG_FILE}"
```

---

## Monitoring and Alerting

### Backup Status Dashboard

```bash
#!/bin/bash
# backup_dashboard.sh - Generate backup status dashboard

# Configuration
DASHBOARD_FILE="/var/www/html/backup_status.html"
BACKUP_DIRS=(
  "/backups/mongodb"
  "/backups/application"
  "/backups/configuration"
  "/backups/uploads"
)

# Generate HTML dashboard
cat > "${DASHBOARD_FILE}" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Backup Status Dashboard</title>
    <meta http-equiv="refresh" content="300">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status-ok { color: green; }
        .status-warning { color: orange; }
        .status-error { color: red; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Backup Status Dashboard</h1>
    <p>Last Updated: $(date)</p>

    <h2>Backup Status</h2>
    <table>
        <tr>
            <th>Backup Type</th>
            <th>Last Backup</th>
            <th>Status</th>
            <th>Size</th>
            <th>Cloud Sync</th>
        </tr>
EOF

# Add status for each backup type
for backup_dir in "${BACKUP_DIRS[@]}"; do
  BACKUP_TYPE=$(basename "${backup_dir}")

  if [ -d "${backup_dir}" ]; then
    # Find latest backup
    LATEST_BACKUP=$(find "${backup_dir}" -name "*.tar.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -n "${LATEST_BACKUP}" ]; then
      BACKUP_TIME=$(stat -c %y "${LATEST_BACKUP}" | cut -d'.' -f1)
      BACKUP_SIZE=$(du -h "${LATEST_BACKUP}" | cut -f1)

      # Check if backup is recent (within 25 hours)
      BACKUP_AGE=$(find "${LATEST_BACKUP}" -mtime -1 | wc -l)

      if [ "${BACKUP_AGE}" -gt 0 ]; then
        STATUS="<span class='status-ok'>OK</span>"
      else
        STATUS="<span class='status-warning'>OLD</span>"
      fi

      # Check cloud sync
      CLOUD_FILE="s3://backup-bucket/${BACKUP_TYPE}/$(basename ${LATEST_BACKUP})"
      aws s3 ls "${CLOUD_FILE}" > /dev/null 2>&1
      if [ $? -eq 0 ]; then
        CLOUD_STATUS="<span class='status-ok'>Synced</span>"
      else
        CLOUD_STATUS="<span class='status-error'>Not Synced</span>"
      fi

    else
      BACKUP_TIME="No backups found"
      BACKUP_SIZE="N/A"
      STATUS="<span class='status-error'>ERROR</span>"
      CLOUD_STATUS="<span class='status-error'>N/A</span>"
    fi
  else
    BACKUP_TIME="Directory not found"
    BACKUP_SIZE="N/A"
    STATUS="<span class='status-error'>ERROR</span>"
    CLOUD_STATUS="<span class='status-error'>N/A</span>"
  fi

  cat >> "${DASHBOARD_FILE}" << EOF
        <tr>
            <td>${BACKUP_TYPE}</td>
            <td>${BACKUP_TIME}</td>
            <td>${STATUS}</td>
            <td>${BACKUP_SIZE}</td>
            <td>${CLOUD_STATUS}</td>
        </tr>
EOF
done

# Close HTML
cat >> "${DASHBOARD_FILE}" << 'EOF'
    </table>

    <h2>Storage Usage</h2>
    <table>
        <tr>
            <th>Location</th>
            <th>Used</th>
            <th>Available</th>
            <th>Usage %</th>
        </tr>
EOF

# Add storage usage information
df -h /backups | tail -1 | while read filesystem size used avail percent mount; do
  cat >> "${DASHBOARD_FILE}" << EOF
        <tr>
            <td>Local Backup Storage</td>
            <td>${used}</td>
            <td>${avail}</td>
            <td>${percent}</td>
        </tr>
EOF
done

# Get S3 bucket size (requires aws cli with CloudWatch permissions)
S3_SIZE=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=backup-bucket Name=StorageType,Value=StandardStorage \
  --statistics Average \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --query 'Datapoints[0].Average' \
  --output text 2>/dev/null)

if [ "${S3_SIZE}" != "None" ] && [ -n "${S3_SIZE}" ]; then
  S3_SIZE_GB=$(echo "scale=2; ${S3_SIZE} / 1024 / 1024 / 1024" | bc)
  cat >> "${DASHBOARD_FILE}" << EOF
        <tr>
            <td>Cloud Backup Storage (S3)</td>
            <td>${S3_SIZE_GB} GB</td>
            <td>Unlimited</td>
            <td>N/A</td>
        </tr>
EOF
fi

cat >> "${DASHBOARD_FILE}" << 'EOF'
    </table>
</body>
</html>
EOF

echo "Backup dashboard updated: ${DASHBOARD_FILE}"
```

### Backup Alert System

```bash
#!/bin/bash
# backup_alerts.sh - Automated backup alerting system

# Configuration
ALERT_EMAIL="admin@yourhotel.com"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
LOG_FILE="/var/log/backup_alerts.log"

# Function to send Slack notification
send_slack_notification() {
  local message="$1"
  local color="$2"

  if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{
        \"attachments\": [{
          \"color\": \"${color}\",
          \"text\": \"${message}\",
          \"footer\": \"Backup Monitoring System\",
          \"ts\": $(date +%s)
        }]
      }" \
      "${SLACK_WEBHOOK_URL}"
  fi
}

# Function to send email alert
send_email_alert() {
  local subject="$1"
  local message="$2"

  echo "${message}" | mail -s "${subject}" "${ALERT_EMAIL}"
}

# Check backup health
check_backup_health() {
  local backup_type="$1"
  local backup_dir="$2"
  local max_age_hours="$3"

  echo "Checking ${backup_type} backups..." | tee -a "${LOG_FILE}"

  # Find latest backup
  LATEST_BACKUP=$(find "${backup_dir}" -name "*.tar.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

  if [ -z "${LATEST_BACKUP}" ]; then
    # No backups found
    local alert_msg="CRITICAL: No ${backup_type} backups found in ${backup_dir}"
    echo "${alert_msg}" | tee -a "${LOG_FILE}"

    send_email_alert "CRITICAL: Missing ${backup_type} Backups" "${alert_msg}"
    send_slack_notification "${alert_msg}" "danger"

    return 1
  fi

  # Check backup age
  local backup_age_seconds=$(( $(date +%s) - $(stat -c %Y "${LATEST_BACKUP}") ))
  local backup_age_hours=$(( backup_age_seconds / 3600 ))

  if [ "${backup_age_hours}" -gt "${max_age_hours}" ]; then
    # Backup too old
    local alert_msg="WARNING: ${backup_type} backup is ${backup_age_hours} hours old (max: ${max_age_hours})"
    echo "${alert_msg}" | tee -a "${LOG_FILE}"

    send_email_alert "WARNING: Old ${backup_type} Backup" "${alert_msg}"
    send_slack_notification "${alert_msg}" "warning"

    return 1
  fi

  # Check backup size
  local backup_size=$(stat -c %s "${LATEST_BACKUP}")

  if [ "${backup_size}" -lt 1024 ]; then
    # Backup too small (less than 1KB)
    local alert_msg="ERROR: ${backup_type} backup suspiciously small: ${backup_size} bytes"
    echo "${alert_msg}" | tee -a "${LOG_FILE}"

    send_email_alert "ERROR: Small ${backup_type} Backup" "${alert_msg}"
    send_slack_notification "${alert_msg}" "danger"

    return 1
  fi

  echo "${backup_type} backup OK: ${LATEST_BACKUP} (${backup_age_hours}h old)" | tee -a "${LOG_FILE}"
  return 0
}

# Main monitoring
echo "Starting backup health monitoring - $(date)" | tee -a "${LOG_FILE}"

# Check different backup types with different age thresholds
BACKUP_CHECKS=(
  "Database:/backups/mongodb:25"
  "Application:/backups/application:25"
  "Configuration:/backups/configuration:25"
  "Uploads:/backups/uploads:7"
)

FAILED_CHECKS=0

for check in "${BACKUP_CHECKS[@]}"; do
  IFS=':' read -r backup_type backup_dir max_age <<< "${check}"

  if ! check_backup_health "${backup_type}" "${backup_dir}" "${max_age}"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
done

# Summary notification
if [ "${FAILED_CHECKS}" -eq 0 ]; then
  echo "All backup checks passed - $(date)" | tee -a "${LOG_FILE}"
  send_slack_notification "✅ All backup checks passed" "good"
else
  local summary_msg="❌ ${FAILED_CHECKS} backup checks failed"
  echo "${summary_msg} - $(date)" | tee -a "${LOG_FILE}"
  send_slack_notification "${summary_msg}" "danger"
fi

echo "Backup monitoring completed - $(date)" | tee -a "${LOG_FILE}"
```

---

## Compliance and Retention

### Data Retention Policy

#### Legal Requirements
```
Financial Records: 7 years (IRS, SOX compliance)
Guest Data: 3 years (GDPR, CCPA compliance)
Transaction Logs: 5 years (PCI DSS)
System Logs: 1 year (Security compliance)
Backup Data: Variable by data type
```

#### Automated Retention Management

```bash
#!/bin/bash
# retention_management.sh - Automated data retention management

# Configuration
declare -A RETENTION_POLICIES=(
  ["/backups/mongodb"]="90"           # 90 days local, longer in archive
  ["/backups/application"]="30"       # 30 days local
  ["/backups/configuration"]="180"    # 6 months local
  ["/backups/uploads"]="60"          # 60 days local
  ["/var/log"]="365"                 # 1 year for logs
)

LOG_FILE="/var/log/retention_management.log"

echo "Starting retention management - $(date)" | tee -a "${LOG_FILE}"

# Apply retention policies
for path in "${!RETENTION_POLICIES[@]}"; do
  retention_days="${RETENTION_POLICIES[$path]}"

  echo "Applying ${retention_days}-day retention to ${path}" | tee -a "${LOG_FILE}"

  if [ -d "${path}" ]; then
    # Find and list files to be deleted
    files_to_delete=$(find "${path}" -type f -mtime +${retention_days} | wc -l)

    if [ "${files_to_delete}" -gt 0 ]; then
      echo "Deleting ${files_to_delete} files older than ${retention_days} days from ${path}" | tee -a "${LOG_FILE}"

      # Create list of files being deleted for audit
      find "${path}" -type f -mtime +${retention_days} -ls >> "/var/log/deleted_files_$(date +%Y%m%d).log"

      # Delete old files
      find "${path}" -type f -mtime +${retention_days} -delete

      # Clean up empty directories
      find "${path}" -type d -empty -delete
    else
      echo "No files to delete from ${path}" | tee -a "${LOG_FILE}"
    fi
  else
    echo "Warning: Path ${path} does not exist" | tee -a "${LOG_FILE}"
  fi
done

# Cloud storage retention
echo "Managing cloud storage retention..." | tee -a "${LOG_FILE}"

# S3 lifecycle policies are configured via AWS CLI or console
# Here we can verify and report on them

aws s3api get-bucket-lifecycle-configuration --bucket backup-bucket > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "S3 lifecycle policies are active" | tee -a "${LOG_FILE}"
else
  echo "Warning: No S3 lifecycle policies found" | tee -a "${LOG_FILE}"
fi

echo "Retention management completed - $(date)" | tee -a "${LOG_FILE}"
```

### Compliance Reporting

```bash
#!/bin/bash
# compliance_report.sh - Generate compliance report for backups

# Configuration
REPORT_DIR="/var/reports/compliance"
REPORT_FILE="${REPORT_DIR}/backup_compliance_$(date +%Y%m%d).html"
AUDIT_PERIOD_DAYS=30

mkdir -p "${REPORT_DIR}"

# Generate HTML report
cat > "${REPORT_FILE}" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Backup Compliance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .compliant { color: green; font-weight: bold; }
        .non-compliant { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
EOF

echo "<h1>Backup Compliance Report</h1>" >> "${REPORT_FILE}"
echo "<p>Report Generated: $(date)</p>" >> "${REPORT_FILE}"
echo "<p>Audit Period: Last ${AUDIT_PERIOD_DAYS} days</p>" >> "${REPORT_FILE}"

# Executive Summary
echo "<div class='summary'>" >> "${REPORT_FILE}"
echo "<h2>Executive Summary</h2>" >> "${REPORT_FILE}"

# Calculate compliance metrics
TOTAL_BACKUPS=$(find /backups -name "*.tar.gz" -mtime -${AUDIT_PERIOD_DAYS} | wc -l)
SUCCESSFUL_TESTS=$(grep "PASS" /var/log/backup_tests.log | grep -c "$(date +%Y-%m)")
FAILED_TESTS=$(grep "FAIL" /var/log/backup_tests.log | grep -c "$(date +%Y-%m)")

echo "<p>Total Backups in Period: ${TOTAL_BACKUPS}</p>" >> "${REPORT_FILE}"
echo "<p>Successful Backup Tests: ${SUCCESSFUL_TESTS}</p>" >> "${REPORT_FILE}"
echo "<p>Failed Backup Tests: ${FAILED_TESTS}</p>" >> "${REPORT_FILE}"

if [ "${FAILED_TESTS}" -eq 0 ] && [ "${TOTAL_BACKUPS}" -gt 0 ]; then
  echo "<p class='compliant'>Overall Status: COMPLIANT</p>" >> "${REPORT_FILE}"
else
  echo "<p class='non-compliant'>Overall Status: NON-COMPLIANT</p>" >> "${REPORT_FILE}"
fi

echo "</div>" >> "${REPORT_FILE}"

# Detailed backup status
echo "<h2>Backup Status by Type</h2>" >> "${REPORT_FILE}"
echo "<table>" >> "${REPORT_FILE}"
echo "<tr><th>Backup Type</th><th>Frequency</th><th>Last Backup</th><th>Status</th><th>Retention</th></tr>" >> "${REPORT_FILE}"

# Check each backup type
BACKUP_TYPES=("mongodb" "application" "configuration" "uploads")

for backup_type in "${BACKUP_TYPES[@]}"; do
  backup_dir="/backups/${backup_type}"

  if [ -d "${backup_dir}" ]; then
    latest_backup=$(find "${backup_dir}" -name "*.tar.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -n "${latest_backup}" ]; then
      backup_date=$(stat -c %y "${latest_backup}" | cut -d'.' -f1)
      backup_age_hours=$(( ($(date +%s) - $(stat -c %Y "${latest_backup}")) / 3600 ))

      # Determine compliance based on backup type
      case "${backup_type}" in
        "mongodb")
          if [ "${backup_age_hours}" -le 24 ]; then
            status="<span class='compliant'>COMPLIANT</span>"
          else
            status="<span class='non-compliant'>NON-COMPLIANT</span>"
          fi
          frequency="Daily"
          retention="90 days local, 7 years archive"
          ;;
        "application")
          if [ "${backup_age_hours}" -le 24 ]; then
            status="<span class='compliant'>COMPLIANT</span>"
          else
            status="<span class='non-compliant'>NON-COMPLIANT</span>"
          fi
          frequency="Daily"
          retention="30 days local, 1 year archive"
          ;;
        *)
          if [ "${backup_age_hours}" -le 48 ]; then
            status="<span class='compliant'>COMPLIANT</span>"
          else
            status="<span class='non-compliant'>NON-COMPLIANT</span>"
          fi
          frequency="Daily"
          retention="Variable"
          ;;
      esac
    else
      backup_date="No backups found"
      status="<span class='non-compliant'>NON-COMPLIANT</span>"
      frequency="Daily"
      retention="Variable"
    fi
  else
    backup_date="Directory not found"
    status="<span class='non-compliant'>NON-COMPLIANT</span>"
    frequency="Daily"
    retention="Variable"
  fi

  echo "<tr><td>${backup_type}</td><td>${frequency}</td><td>${backup_date}</td><td>${status}</td><td>${retention}</td></tr>" >> "${REPORT_FILE}"
done

echo "</table>" >> "${REPORT_FILE}"

# Recovery testing status
echo "<h2>Recovery Testing Status</h2>" >> "${REPORT_FILE}"
echo "<table>" >> "${REPORT_FILE}"
echo "<tr><th>Test Type</th><th>Last Test Date</th><th>Result</th><th>Next Due</th></tr>" >> "${REPORT_FILE}"

# Monthly DR test
LAST_DR_TEST=$(grep "Monthly DR test" /var/log/backup_tests.log | tail -1 | cut -d':' -f1)
if [ -n "${LAST_DR_TEST}" ]; then
  dr_test_date="${LAST_DR_TEST}"
  dr_test_result="PASS"
  next_dr_test=$(date -d "${LAST_DR_TEST} + 1 month" +%Y-%m-%d)
else
  dr_test_date="No tests found"
  dr_test_result="UNKNOWN"
  next_dr_test="Overdue"
fi

echo "<tr><td>Monthly DR Test</td><td>${dr_test_date}</td><td>${dr_test_result}</td><td>${next_dr_test}</td></tr>" >> "${REPORT_FILE}"

# Quarterly full test
LAST_FULL_TEST=$(grep "Quarterly full DR" /var/log/backup_tests.log | tail -1 | cut -d':' -f1)
if [ -n "${LAST_FULL_TEST}" ]; then
  full_test_date="${LAST_FULL_TEST}"
  full_test_result="PASS"
  next_full_test=$(date -d "${LAST_FULL_TEST} + 3 months" +%Y-%m-%d)
else
  full_test_date="No tests found"
  full_test_result="UNKNOWN"
  next_full_test="Overdue"
fi

echo "<tr><td>Quarterly Full DR Test</td><td>${full_test_date}</td><td>${full_test_result}</td><td>${next_full_test}</td></tr>" >> "${REPORT_FILE}"

echo "</table>" >> "${REPORT_FILE}"

# Close HTML
echo "</body></html>" >> "${REPORT_FILE}"

echo "Compliance report generated: ${REPORT_FILE}"

# Email report to compliance team
if [ -f "${REPORT_FILE}" ]; then
  echo "Backup compliance report for $(date +%B\ %Y)" | \
    mail -s "Monthly Backup Compliance Report" \
         -a "${REPORT_FILE}" \
         compliance@yourhotel.com
fi
```

---

*Last Updated: January 15, 2024*
*Version: 2.1.0*

This comprehensive backup and recovery documentation provides detailed procedures for protecting your booking system data. For questions or assistance with backup/recovery procedures, contact our infrastructure team at infrastructure@yourdomain.com or call our 24/7 emergency support line.