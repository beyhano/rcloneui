package main

import (
	"context"
	_ "embed"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed build/trayicon.png
var trayIcon []byte

func (a *App) startTray(ctx context.Context) {
	platformTray(ctx)
}

func openWindow(ctx context.Context) {
	runtime.WindowShow(ctx)
	runtime.WindowUnminimise(ctx)
}

func quitApp() {
	os.Exit(0)
}
