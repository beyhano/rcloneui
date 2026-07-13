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
	a.startTray(ctx)
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	librclone.Finalize()
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
