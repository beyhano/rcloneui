//go:build !linux

package main

import (
	"context"

	"github.com/getlantern/systray"
)

func platformTray(ctx context.Context) {
	go systray.Run(func() {
		systray.SetIcon(trayIcon)
		systray.SetTooltip("rcloneui")

		mOpen := systray.AddMenuItem("Pencereyi Aç", "Uygulamayı öne getir")
		systray.AddSeparator()
		mQuit := systray.AddMenuItem("Çıkış", "Uygulamayı kapat")

		go func() {
			for {
				select {
				case <-mOpen.ClickedCh:
					openWindow(ctx)
				case <-mQuit.ClickedCh:
					systray.Quit()
					quitApp()
				}
			}
		}()
	}, func() {})
}
