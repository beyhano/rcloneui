package main

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func initDB() error {
	dir, err := os.UserCacheDir()
	if err != nil {
		dir = os.TempDir()
	}
	dbDir := filepath.Join(dir, "rcloneui")
	os.MkdirAll(dbDir, 0755)
	dbPath := filepath.Join(dbDir, "rcloneui.db")

	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}
	DB.SetMaxOpenConns(1) // sqlite single-writer

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS scheduled_tasks (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			name        TEXT NOT NULL,
			enabled     INTEGER NOT NULL DEFAULT 1,
			source      TEXT NOT NULL,
			dest        TEXT NOT NULL,
			mode        TEXT NOT NULL DEFAULT 'sync',
			cron_expr   TEXT NOT NULL,
			created_at  TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
		);
	`)
	return err
}

func closeDB() {
	if DB != nil {
		DB.Close()
	}
}
