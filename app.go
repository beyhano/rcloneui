package main

import (
	"context"
	"encoding/json"

	"github.com/rclone/rclone/librclone/librclone"

	// Common backends - only what we need
	_ "github.com/rclone/rclone/backend/local"
	_ "github.com/rclone/rclone/backend/s3"
	_ "github.com/rclone/rclone/backend/drive"
	_ "github.com/rclone/rclone/backend/dropbox"
	_ "github.com/rclone/rclone/backend/sftp"
	_ "github.com/rclone/rclone/backend/webdav"
	_ "github.com/rclone/rclone/backend/onedrive"
	_ "github.com/rclone/rclone/backend/googlecloudstorage"
	_ "github.com/rclone/rclone/backend/azureblob"
	_ "github.com/rclone/rclone/backend/b2"
	_ "github.com/rclone/rclone/backend/smb"
	_ "github.com/rclone/rclone/backend/http"
	_ "github.com/rclone/rclone/backend/ftp"
	_ "github.com/rclone/rclone/backend/crypt"
	_ "github.com/rclone/rclone/backend/compress"
	_ "github.com/rclone/rclone/backend/combine"
	_ "github.com/rclone/rclone/backend/alias"
	_ "github.com/rclone/rclone/backend/chunker"
	_ "github.com/rclone/rclone/backend/union"
	_ "github.com/rclone/rclone/backend/memory"
	_ "github.com/rclone/rclone/backend/pcloud"
	_ "github.com/rclone/rclone/backend/mega"
	_ "github.com/rclone/rclone/backend/box"
	_ "github.com/rclone/rclone/backend/jottacloud"
	_ "github.com/rclone/rclone/backend/koofr"
	_ "github.com/rclone/rclone/backend/putio"
	_ "github.com/rclone/rclone/backend/premiumizeme"
	_ "github.com/rclone/rclone/backend/yandex"
	_ "github.com/rclone/rclone/backend/hdfs"
	_ "github.com/rclone/rclone/backend/internetarchive"
	_ "github.com/rclone/rclone/backend/pikpak"
	_ "github.com/rclone/rclone/backend/protondrive"
	_ "github.com/rclone/rclone/backend/seafile"
	_ "github.com/rclone/rclone/backend/storj"
	_ "github.com/rclone/rclone/backend/sugarsync"
	_ "github.com/rclone/rclone/backend/opendrive"
	_ "github.com/rclone/rclone/backend/hidrive"
	_ "github.com/rclone/rclone/backend/filefabric"
	_ "github.com/rclone/rclone/backend/filescom"
	_ "github.com/rclone/rclone/backend/linkbox"
	_ "github.com/rclone/rclone/backend/zoho"
	_ "github.com/rclone/rclone/backend/cloudinary"
	_ "github.com/rclone/rclone/backend/imagekit"
	_ "github.com/rclone/rclone/backend/shade"
	_ "github.com/rclone/rclone/backend/huaweidrive"
	_ "github.com/rclone/rclone/backend/iclouddrive"
	_ "github.com/rclone/rclone/backend/filelu"
	_ "github.com/rclone/rclone/backend/pixeldrain"
	_ "github.com/rclone/rclone/backend/gofile"
	_ "github.com/rclone/rclone/backend/filen"
	_ "github.com/rclone/rclone/backend/googlephotos"
	_ "github.com/rclone/rclone/backend/swift"
	_ "github.com/rclone/rclone/backend/oracleobjectstorage"
	_ "github.com/rclone/rclone/backend/quatrix"
	_ "github.com/rclone/rclone/backend/ulozto"
	_ "github.com/rclone/rclone/backend/internxt"
	_ "github.com/rclone/rclone/backend/netstorage"

	// Skip: sharefile (build issue with tzdata on Go 1.25)
	// Skip: fichier (may be unstable)

	_ "github.com/rclone/rclone/fs/operations"
	_ "github.com/rclone/rclone/fs/sync"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	librclone.Initialize()
	if err := initDB(); err != nil {
		println("DB init error:", err.Error())
	}
	a.startTray(ctx)
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	librclone.Finalize()
	closeDB()
}

// RpcCall calls any rclone RC method with a JSON request body.
// Returns JSON response string.
func (a *App) RpcCall(method string, request string) (string, error) {
	output, status := librclone.RPC(method, request)
	if status != 200 {
		var errResp struct {
			Error  string `json:"error"`
			Status int    `json:"status"`
		}
		json.Unmarshal([]byte(output), &errResp)
		if errResp.Error != "" {
			return "", &rpcError{method: method, msg: errResp.Error, status: status}
		}
		return "", &rpcError{method: method, msg: output, status: status}
	}
	return output, nil
}

// ListRemotes returns all configured rclone remotes
func (a *App) ListRemotes() ([]string, error) {
	out, err := a.RpcCall("config/listremotes", "")
	if err != nil {
		return nil, err
	}
	var resp struct {
		Remotes []string `json:"remotes"`
	}
	if err := json.Unmarshal([]byte(out), &resp); err != nil {
		return nil, err
	}
	return resp.Remotes, nil
}

// ScheduledTask represents a scheduled sync/copy/backup job
type ScheduledTask struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Enabled  bool   `json:"enabled"`
	Source   string `json:"source"`
	Dest     string `json:"dest"`
	Mode     string `json:"mode"`
	CronExpr string `json:"cron_expr"`
}

// ListScheduledTasks returns all scheduled tasks
func (a *App) ListScheduledTasks() ([]ScheduledTask, error) {
	rows, err := DB.Query(`SELECT id, name, enabled, source, dest, mode, cron_expr FROM scheduled_tasks ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []ScheduledTask
	for rows.Next() {
		var t ScheduledTask
		var enabled int
		if err := rows.Scan(&t.ID, &t.Name, &enabled, &t.Source, &t.Dest, &t.Mode, &t.CronExpr); err != nil {
			return nil, err
		}
		t.Enabled = enabled == 1
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

// SaveScheduledTask inserts or updates a scheduled task
func (a *App) SaveScheduledTask(t ScheduledTask) (int64, error) {
	if t.ID > 0 {
		_, err := DB.Exec(`UPDATE scheduled_tasks SET name=?, enabled=?, source=?, dest=?, mode=?, cron_expr=?, updated_at=datetime('now') WHERE id=?`,
			t.Name, boolToInt(t.Enabled), t.Source, t.Dest, t.Mode, t.CronExpr, t.ID)
		return t.ID, err
	}
	res, err := DB.Exec(`INSERT INTO scheduled_tasks (name, enabled, source, dest, mode, cron_expr) VALUES (?, ?, ?, ?, ?, ?)`,
		t.Name, boolToInt(t.Enabled), t.Source, t.Dest, t.Mode, t.CronExpr)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// DeleteScheduledTask removes a scheduled task by ID
func (a *App) DeleteScheduledTask(id int64) error {
	_, err := DB.Exec(`DELETE FROM scheduled_tasks WHERE id=?`, id)
	return err
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// rpcError implements error for RPC failures
type rpcError struct {
	method string
	msg    string
	status int
}

func (e *rpcError) Error() string {
	return e.msg
}

func (e *rpcError) Status() int {
	return e.status
}
