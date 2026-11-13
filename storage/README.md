# Local upload storage

Uploads are private filesystem files outside `public/`; PostgreSQL stores their relative paths and metadata. Local development defaults to `storage/uploads/` unless `UPLOAD_DIR` is set. Production should use the persistent VPS directory `/var/www/vsource-storage`.

The app creates the folder structure (`destinations/`, `universities/`, `gallery/`, `courses/`, `banners/`, and `general/`) on demand. Give the Next.js service account read/write permissions on the configured root. Back up this directory independently of application deployments and the database.

Do not commit upload contents. The `/media/*` route accepts only validated relative paths beneath the configured storage root.
