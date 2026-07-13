import {useCallback, useEffect, useState} from "react";
import {RpcCall} from "../../wailsjs/go/main/App";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {FolderOpen, File, ChevronRight, ArrowUp, Loader2, Eye, EyeOff} from "lucide-react";

type Entry = {
    Name: string;
    Path: string;
    IsDir: boolean;
    Size: number;
};

export default function PathBrowser({
    remote, path, onPathChange,
}: {
    remote: string;
    path: string;
    onPathChange: (p: string) => void;
}) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [manualPath, setManualPath] = useState(path);
    const [showHidden, setShowHidden] = useState(false);

    const actualPath = path || "";
    const isLocal = !remote || remote === "local";
    const fsBase = isLocal ? "/" : `${remote}:`;

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const remotePath = actualPath ? `/${actualPath}` : "";
            const raw = await RpcCall("operations/list", JSON.stringify({fs: fsBase, remote: remotePath}));
            const data = JSON.parse(raw);
            if (data.error) { setError(data.error); setEntries([]); }
            else setEntries(data.list || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [fsBase, actualPath]);

    useEffect(() => { load(); }, [load]);

    const enterDir = (name: string) => {
        const newPath = path ? `${path}/${name}` : name;
        setManualPath(newPath);
        onPathChange(newPath);
    };

    const goUp = () => {
        const parts = path.split("/").filter(Boolean);
        parts.pop();
        const newPath = parts.join("/");
        setManualPath(newPath);
        onPathChange(newPath);
    };

    const visible = entries.filter((e) => showHidden || !e.Name.startsWith("."));
    const dirs = visible.filter((e) => e.IsDir);
    const files = visible.filter((e) => !e.IsDir);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FolderOpen className="size-3.5 shrink-0"/>
                {remote && <span className="font-mono text-xs">{remote}:</span>}
                <span className="font-mono text-xs truncate">/{path}</span>
            </div>

            <div className="flex items-center gap-1">
                <Input
                    className="font-mono text-xs h-8"
                    value={manualPath}
                    onChange={(e) => setManualPath(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onPathChange(manualPath)}
                    placeholder={remote ? `${remote}:/path` : "/path"}
                />
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => onPathChange(manualPath)}>
                    Git
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowHidden(!showHidden)}
                    aria-label={showHidden ? "Gizli dosyaları gizle" : "Gizli dosyaları göster"}>
                    {showHidden ? <EyeOff className="size-3.5"/> : <Eye className="size-3.5"/>}
                </Button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground"/>
                </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            {!loading && !error && (
                <div className="border rounded-lg overflow-hidden">
                    {path && (
                        <button
                            onClick={goUp}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent border-b"
                        >
                            <ArrowUp className="size-3"/> ..
                        </button>
                    )}
                    <ScrollArea className="h-48">
                        {dirs.map((e) => (
                            <button key={e.Path}
                                onClick={() => enterDir(e.Name)}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left border-b border-border/50 last:border-0"
                            >
                                <FolderOpen className="size-3.5 shrink-0 text-amber-500"/>
                                <span className="truncate">{e.Name}</span>
                                <ChevronRight className="size-3 ml-auto shrink-0 text-muted-foreground"/>
                            </button>
                        ))}
                        {files.map((e) => (
                            <div key={e.Path}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground border-b border-border/50 last:border-0"
                            >
                                <File className="size-3.5 shrink-0"/>
                                <span className="truncate">{e.Name}</span>
                            </div>
                        ))}
                        {entries.length === 0 && (
                            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                                Boş
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
