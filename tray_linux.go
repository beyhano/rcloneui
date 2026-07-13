//go:build linux

package main

/*
#cgo linux pkg-config: ayatana-appindicator3-0.1 gtk+-3.0
#cgo linux CFLAGS: -Wno-deprecated-declarations
#include <gtk/gtk.h>

extern GtkWidget *tray_setup(const char *icon_path);
extern void tray_add_item(GtkWidget *menu, const char *label, int id);
extern void tray_add_sep(GtkWidget *menu);
extern void tray_show_all(GtkWidget *menu);
extern void tray_present_window(void);
*/
import "C"
import (
	"context"
	"os"
	"path/filepath"
	"unsafe"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	trayChan  = make(chan int, 8)
	ctxHolder context.Context
)

//export goTrayClick
func goTrayClick(id C.int) {
	select {
	case trayChan <- int(id):
	default:
	}
}

func platformTray(ctx context.Context) {
	ctxHolder = ctx

	iconPath := writeTrayIcon()
	cIcon := C.CString(iconPath)
	menu := C.tray_setup(cIcon)
	C.free(unsafe.Pointer(cIcon))

	mOpen := C.CString("Pencereyi Aç")
	C.tray_add_item(menu, mOpen, 1)
	C.free(unsafe.Pointer(mOpen))

	C.tray_add_sep(menu)

	mQuit := C.CString("Çıkış")
	C.tray_add_item(menu, mQuit, 2)
	C.free(unsafe.Pointer(mQuit))

	C.tray_show_all(menu)

	go handleTrayClicks()
}

func writeTrayIcon() string {
	dir, err := os.UserCacheDir()
	if err != nil {
		dir = os.TempDir()
	}
	path := filepath.Join(dir, "rcloneui", "trayicon.png")
	os.MkdirAll(filepath.Dir(path), 0755)
	if err := os.WriteFile(path, trayIcon, 0644); err != nil {
		return ""
	}
	return path
}

func handleTrayClicks() {
	for id := range trayChan {
		switch id {
		case 1:
			runtime.WindowShow(ctxHolder)
			runtime.WindowUnminimise(ctxHolder)
			C.tray_present_window()
		case 2:
			quitApp()
		}
	}
}
