import {useEffect, useState} from 'react';
import {ListRemotes, ListScheduledTasks} from "../wailsjs/go/main/App";
import {Button} from "@/components/ui/button";
import {Moon, Sun, Plus, RefreshCw, Pencil, Trash2, Clock, List, Play} from "lucide-react";
import {RpcCall, DeleteScheduledTask} from "../wailsjs/go/main/App";
import {useTheme} from "@/lib/use-theme";
import {confirm, toastSuccess, toastError, alertError} from "@/lib/swal";
import Wizard from "@/pages/Wizard";
import NewTask from "@/pages/NewTask";

type Page = "home" | "new-task" | "schedules";

function App() {
    const [remotes, setRemotes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState<Page>("home");
    const [wizardOpen, setWizardOpen] = useState(false);
    const [editRemote, setEditRemote] = useState<string | undefined>(undefined);
    const [tasks, setTasks] = useState<any[]>([]);
    const [tasksError, setTasksError] = useState("");
    const {theme, toggleTheme} = useTheme();

    const loadRemotes = () => {
        setLoading(true);
        setError('');
        ListRemotes()
            .then(setRemotes)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    };

    const loadTasks = async () => {
        try {
            const r = await ListScheduledTasks();
            if (Array.isArray(r)) setTasks(r);
            else setTasks([]);
            setTasksError("");
        } catch (e: unknown) {
            setTasksError(e instanceof Error ? e.message : String(e));
            setTasks([]);
        }
    };

    useEffect(() => { loadRemotes(); loadTasks().catch(() => {}); }, []);

    if (page === "new-task") {
        return <div className="h-screen p-4"><NewTask onBack={() => setPage("home")}/></div>;
    }

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden" style={{height: '100vh'}}>
            <div className="flex flex-col p-4 flex-1 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h1 className="text-xl font-bold">rcloneui</h1>
                    <div className="flex items-center gap-1">
                        <Button onClick={() => setPage("home")} variant={page === "home" ? "secondary" : "ghost"} size="sm">
                            <List className="size-3.5 mr-1"/> Remote
                        </Button>
                        <Button onClick={() => { loadTasks(); setPage("schedules"); }} variant={page === "schedules" ? "secondary" : "ghost"} size="sm">
                            <Clock className="size-3.5 mr-1"/> Görev
                        </Button>
                        <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Tema">
                            {theme === 'dark' ? <Sun className="size-4"/> : <Moon className="size-4"/>}
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {page === "home" && (
                    <div className="flex flex-1 flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-3 shrink-0">
                            <Button size="sm" onClick={() => { setEditRemote(undefined); setWizardOpen(true); }}>
                                <Plus className="size-3.5 mr-1"/> Yeni Remote
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setPage("new-task")}>
                                <Clock className="size-3.5 mr-1"/> Görev Ekle
                            </Button>
                            <Button onClick={loadRemotes} variant="outline" size="icon" className="size-8" aria-label="Yenile">
                                <RefreshCw className="size-3.5"/>
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {loading && <p className="text-muted-foreground text-sm">Yükleniyor...</p>}
                            {error && <p className="text-destructive text-sm mb-2">{error}</p>}
                            {!loading && !error && remotes.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                                    <p className="mb-1">Henüz remote yapılandırılmamış.</p>
                                    <p>"Yeni Remote" ile başlayın.</p>
                                </div>
                            )}
                            {remotes.length > 0 && (
                                <div className="grid gap-1">
                                    {remotes.map(r => {
                                        const [name, type] = r.split(":");
                                        return (
                                            <div key={r} className="flex items-center justify-between p-2.5 rounded-lg bg-muted group text-sm">
                                                <div><span className="font-medium">{name}</span>{type && <span className="text-xs text-muted-foreground ml-2">({type})</span>}</div>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon-xs" onClick={() => { setEditRemote(name); setWizardOpen(true); }}><Pencil className="size-3"/></Button>
                                                    <Button variant="ghost" size="icon-xs" onClick={async () => {
                                                        if (await confirm(`"${name}" silinsin mi?`)) {
                                                            try {
                                                                await RpcCall("config/delete", JSON.stringify({name}));
                                                                toastSuccess(`"${name}" silindi`);
                                                                loadRemotes();
                                                            } catch (e: unknown) { toastError(e instanceof Error ? e.message : String(e)); }
                                                        }
                                                    }}><Trash2 className="size-3 text-destructive"/></Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {page === "schedules" && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <Button size="sm" variant="outline" onClick={() => setPage("new-task")}>
                                <Clock className="size-3.5 mr-1"/> Yeni Görev
                            </Button>
                            <Button size="sm" variant="outline" onClick={loadTasks}>
                                <RefreshCw className="size-3.5"/>
                            </Button>
                        </div>
                        {tasksError && <p className="text-destructive text-sm mb-2">{tasksError}</p>}
                        {!tasksError && tasks.length === 0 && (
                            <p className="text-muted-foreground text-sm">Henüz zamanlanmış görev yok.</p>
                        )}
                        {tasks.map((t: any) => (
                            <div key={t.id} className="p-3 rounded-lg bg-muted text-sm mb-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{t.name}</span>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon-xs" onClick={async () => {
                                            try {
                                                const fix = (p: string) => p.replace(/^local:/, "");
                                                const m = t.mode === "bisync" ? "sync/bisync" : t.mode === "copy" ? "sync/copy" : t.mode === "move" ? "sync/move" : "sync/sync";
                                                const raw = await RpcCall(m, JSON.stringify({srcFs: fix(t.source), dstFs: fix(t.dest)}));
                                                const res = JSON.parse(raw);
                                                if (res.error) {
                                                    await alertError("Hata", res.error);
                                                } else if (res.jobid) {
                                                    toastSuccess(`Başlatıldı (job #${res.jobid})`);
                                                    // poll a couple times
                                                    for (let i = 0; i < 6; i++) {
                                                        await new Promise(r => setTimeout(r, 2000));
                                                        const st = JSON.parse(await RpcCall("job/status", JSON.stringify({jobid: res.jobid})));
                                                        if (st.finished) {
                                                            if (st.success) toastSuccess(`"${t.name}" tamam`);
                                                            else await alertError("Hata", st.error || "Bilinmeyen hata");
                                                            break;
                                                        }
                                                    }
                                                } else {
                                                    toastSuccess(`"${t.name}" tamam`);
                                                }
                                            } catch (e: unknown) {
                                                toastError(e instanceof Error ? e.message : String(e));
                                            }
                                        }}>
                                            <Play className="size-3.5 text-green-500"/>
                                        </Button>
                                        <Button variant="ghost" size="icon-xs" onClick={async () => {
                                            if (await confirm(`"${t.name}" silinsin mi?`)) {
                                                await DeleteScheduledTask(t.id);
                                                toastSuccess("Silindi");
                                                loadTasks();
                                            }
                                        }}>
                                            <Trash2 className="size-3.5 text-destructive"/>
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 font-mono">
                                    {t.mode}: {t.source} → {t.dest}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    ⏰ {t.cron_expr}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Wizard open={wizardOpen} editRemote={editRemote} onClose={() => { setWizardOpen(false); loadRemotes(); }}/>
        </div>
    );
}

export default App
