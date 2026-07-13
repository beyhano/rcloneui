#include <libayatana-appindicator/app-indicator.h>
#include <gtk/gtk.h>

static AppIndicator *ind;

extern void goTrayClick(int id);

static void suppress_log(const gchar *log_domain, GLogLevelFlags log_level, const gchar *message, gpointer user_data) {
}

static void click_cb(GtkWidget *widget, gpointer data) {
    goTrayClick(GPOINTER_TO_INT(data));
}

GtkWidget *tray_setup(const char *icon_path) {
    g_log_set_handler("libayatana-appindicator", G_LOG_LEVEL_WARNING | G_LOG_LEVEL_INFO | G_LOG_LEVEL_MESSAGE, suppress_log, NULL);

    ind = app_indicator_new("rcloneui", "", APP_INDICATOR_CATEGORY_APPLICATION_STATUS);
    app_indicator_set_status(ind, APP_INDICATOR_STATUS_ACTIVE);
    app_indicator_set_title(ind, "rcloneui");
    app_indicator_set_icon_full(ind, icon_path, "rcloneui");

    GtkWidget *menu = gtk_menu_new();
    app_indicator_set_menu(ind, GTK_MENU(menu));
    return menu;
}

void tray_add_item(GtkWidget *menu, const char *label, int id) {
    GtkWidget *item = gtk_menu_item_new_with_label(label);
    g_signal_connect(item, "activate", G_CALLBACK(click_cb), GINT_TO_POINTER(id));
    gtk_widget_show(item);
    gtk_menu_shell_append(GTK_MENU_SHELL(menu), item);
}

void tray_add_sep(GtkWidget *menu) {
    GtkWidget *sep = gtk_separator_menu_item_new();
    gtk_widget_show(sep);
    gtk_menu_shell_append(GTK_MENU_SHELL(menu), sep);
}

void tray_show_all(GtkWidget *menu) {
    gtk_widget_show_all(menu);
}

static gboolean present_window(gpointer data) {
    GList *toplevels = gtk_window_list_toplevels();
    for (GList *l = toplevels; l != NULL; l = l->next) {
        GtkWindow *win = GTK_WINDOW(l->data);
        if (gtk_widget_get_visible(GTK_WIDGET(win))) {
            gtk_window_present(win);
            break;
        }
    }
    g_list_free(toplevels);
    return G_SOURCE_REMOVE;
}

void tray_present_window(void) {
    g_idle_add(present_window, NULL);
}