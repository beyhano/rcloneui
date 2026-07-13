import {useCallback, useEffect, useState} from "react";
import {ListRemotes, SaveScheduledTask} from "../../wailsjs/go/main/App";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import PathBrowser from "@/components/PathBrowser";
import {toastSuccess, toastError} from "@/lib/swal";
import {ArrowLeft, Clock} from "lucide-react";

const modes = [
    {value: "sync", label: "Sync (tek yönlü)"},
    {value: "copy", label: "Copy (kopyala)"},
    {value: "move", label: "Move (taşı)"},
    {value: "bisync", label: "Bisync (çift yönlü)"},
];

const intervals = [
    {value: "*/5 * * * *", label: "5 dakikada bir"},
    {value: "*/15 * * * *", label: "15 dakikada bir"},
    {value: "*/30 * * * *", label: "30 dakikada bir"},
    {value: "0 * * * *", label: "Saat başı"},
    {value: "0 */3 * * *", label: "3 saatte bir"},
    {value: "0 0 * * *", label: "Günde bir (gece yarısı)"},
    {value: "0 6 * * *", label: "Günde bir (sabah 6)"},
    {value: "0 0 * * 0", label: "Haftada bir (pazar)"},
    {value: "custom", label: "Özel cron..."},
];

export default function NewTask({onBack}: {onBack: () => void}) {
    const [remotes, setRemotes] = useState<string[]>([]);
    const [name, setName] = useState("");
    const [srcRemote, setSrcRemote] = useState("");
    const [srcPath, setSrcPath] = useState("");
    const [dstRemote, setDstRemote] = useState("");
    const [dstPath, setDstPath] = useState("");
    const [mode, setMode] = useState("sync");
    const [cron, setCron] = useState("*/30 * * * *");
    const [customCron, setCustomCron] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        ListRemotes().then((r) => setRemotes(["local", ...r]));
    }, []);

    const cronValue = cron === "custom" ? customCron : cron;

    const save = useCallback(async () => {
        if (!srcRemote || !dstRemote || !cronValue) return;
        setSaving(true);
        try {
            const srcFs = srcRemote === "local" ? `/${srcPath}` : `${srcRemote}:${srcPath}`;
            const dstFs = dstRemote === "local" ? `/${dstPath}` : `${dstRemote}:${dstPath}`;
            const task = {
                id: 0,
                name: name || `${srcRemote} → ${dstRemote}`,
                enabled: true,
                source: srcFs,
                dest: dstFs,
                mode,
                cron_expr: cronValue,
            };
            await SaveScheduledTask(task);
            toastSuccess("Görev kaydedildi");
            onBack();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    }, [name, srcRemote, srcPath, dstRemote, dstPath, mode, cronValue, onBack]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="size-4"/>
                </Button>
                <h1 className="text-xl font-bold">Yeni Zamanlanmış Görev</h1>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Task name */}
                <div>
                    <Label className="text-sm font-medium">Görev Adı</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: Yedekleme" className="mt-1"/>
                </div>

                {/* Mode */}
                <div>
                    <Label className="text-sm font-medium">İşlem Türü</Label>
                    <Select value={mode} onValueChange={(v) => v && setMode(v)}>
                        <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {modes.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Source */}
                <Card>
                    <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-medium">Kaynak</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                        <Select value={srcRemote} onValueChange={(v) => v && setSrcRemote(v)}>
                            <SelectTrigger><SelectValue placeholder="Remote seçin..."/></SelectTrigger>
                            <SelectContent>
                                {remotes.map((r) => (
                                    <SelectItem key={r} value={r.split(":")[0]}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {srcRemote && (
                            <PathBrowser remote={srcRemote} path={srcPath} onPathChange={setSrcPath}/>
                        )}
                    </CardContent>
                </Card>

                {/* Destination */}
                <Card>
                    <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-medium">Hedef</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                        <Select value={dstRemote} onValueChange={(v) => v && setDstRemote(v)}>
                            <SelectTrigger><SelectValue placeholder="Remote seçin..."/></SelectTrigger>
                            <SelectContent>
                                {remotes.map((r) => (
                                    <SelectItem key={r} value={r.split(":")[0]}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {dstRemote && (
                            <PathBrowser remote={dstRemote} path={dstPath} onPathChange={setDstPath}/>
                        )}
                    </CardContent>
                </Card>

                {/* Schedule */}
                <Card>
                    <CardHeader className="p-3 pb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-muted-foreground"/>
                            <CardTitle className="text-sm font-medium">Zamanlama</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                        <Select value={cron} onValueChange={(v) => v && setCron(v)}>
                            <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {intervals.map((i) => (
                                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {cron === "custom" && (
                            <Input value={customCron} onChange={(e) => setCustomCron(e.target.value)}
                                placeholder="Cron ifadesi (örn: */10 * * * *)" className="font-mono text-xs"/>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                            {cronValue} — şu anki zamanlama
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
                <Button onClick={save} disabled={!srcRemote || !dstRemote || !cronValue || saving}>
                    {saving ? "Kaydediliyor..." : "Görevi Kaydet"}
                </Button>
            </div>
        </div>
    );
}
