import {useCallback, useEffect, useMemo, useState} from "react";
import {RpcCall} from "../../wailsjs/go/main/App";
import {Button} from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
import {Dialog, DialogContent} from "@/components/ui/dialog";
import {toastSuccess, toastError} from "@/lib/swal";
import {
    Search,
    Check,
    ArrowLeft,
    ArrowRight,
    HardDrive,
    Globe,
    Shield,
    Database,
    Server,
    FolderTree,
    Archive,
} from "lucide-react";

type ProviderOption = {
    Name: string;
    Help: string;
    Default: unknown;
    DefaultStr: string;
    Required: boolean;
    Advanced: boolean;
    Type: string;
    IsPassword: boolean;
    Sensitive: boolean;
    Exclusive: boolean;
    Examples?: {Value: string; Help: string}[];
};

type Provider = {
    Name: string;
    Description: string;
    Prefix: string;
    Options: ProviderOption[];
};

type ProvidersResponse = {
    providers: Provider[];
};

const providerIcon = (name: string) => {
    const icons: Record<string, typeof HardDrive> = {
        drive: HardDrive, s3: Database, dropbox: Archive, onedrive: Archive,
        box: Archive, pcloud: Archive, mega: Archive, b2: Database,
        googlecloudstorage: Database, azureblob: Database, swift: Database,
        sftp: Server, ftp: Server, webdav: Server, smb: Server,
        http: Globe, hdfs: Server,
        crypt: Shield, compress: FolderTree, union: FolderTree,
        alias: FolderTree, combine: FolderTree, chunker: FolderTree,
        local: HardDrive,
    };
    return icons[name] || Server;
};

const providerGroups = [
    {label: "Bulut Depolama", match: (d: string, n: string) =>
        ["drive", "dropbox", "onedrive", "box", "pcloud", "mega", "b2",
         "jottacloud", "koofr", "yandex", "hidrive", "opendrive",
         "sugarsync", "zoho", "filefabric", "filescom", "linkbox",
         "iclouddrive", "huaweidrive", "googlephotos",
         "proton", "filen", "pixeldrain", "gofile", "filelu",
         "internxt", "ulozto"].some(k => n.includes(k) || d.toLowerCase().includes(k))},
    {label: "S3 ve Object Storage", match: (d: string, n: string) =>
        ["s3", "googlecloudstorage", "azureblob", "swift", "storj",
         "oracleobjectstorage", "netstorage", "cloudinary", "imagekit",
         "internetarchive", "quatrix", "shade"].some(k => n.includes(k))},
    {label: "Protokol (SFTP/FTP/WebDAV/SMB)", match: (d: string, n: string) =>
        ["sftp", "ftp", "webdav", "smb", "http", "hdfs", "seafile"].some(k => n.includes(k))},
    {label: "Özel (Crypt/Compress/Union/Alias)", match: (d: string, n: string) =>
        ["crypt", "compress", "union", "alias", "combine", "chunker", "memory"].some(k => n.includes(k))},
];

const categoryColors: Record<string, string> = {
    "Bulut Depolama": "border-l-blue-500",
    "S3 ve Object Storage": "border-l-amber-500",
    "Protokol (SFTP/FTP/WebDAV/SMB)": "border-l-green-500",
    "Özel (Crypt/Compress/Union/Alias)": "border-l-purple-500",
};

function groupProvider(p: Provider): string {
    const d = p.Description.toLowerCase();
    const n = p.Name;
    for (const g of providerGroups) {
        if (g.match(d, n)) return g.label;
    }
    return "Diğer";
}

export default function Wizard({open, editRemote, onClose}: {open: boolean; editRemote?: string; onClose: () => void}) {
    const [step, setStep] = useState(0);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Provider | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [remoteName, setRemoteName] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (!open) {
            setStep(0); setSelected(null); setValues({});
            setSearch(""); setRemoteName(""); setShowAdvanced(false);
            return;
        }
        (async () => {
            const res = await RpcCall("config/providers", "");
            const data: ProvidersResponse = JSON.parse(res);
            setProviders(data.providers.filter((p) => !p.Name.startsWith("local")));

            if (editRemote) {
                const dump = JSON.parse(await RpcCall("config/dump", ""));
                const cfg = dump[editRemote];
                if (cfg) {
                    const prov = data.providers.find((p) => p.Name === cfg.type);
                    if (prov) {
                        setSelected(prov);
                        const vals: Record<string, string> = {};
                        for (const o of prov.Options) {
                            const v = cfg[o.Name];
                            if (v !== undefined && v !== null) vals[o.Name] = String(v);
                            else if (o.DefaultStr) vals[o.Name] = o.DefaultStr;
                        }
                        setValues(vals);
                        setRemoteName(editRemote);
                        setStep(1);
                        return;
                    }
                }
            }
        })();
    }, [open, editRemote]);

    const grouped = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = providers.filter(
            (p) => p.Name.toLowerCase().includes(q) || p.Description.toLowerCase().includes(q),
        );
        const groups: Record<string, Provider[]> = {};
        for (const p of filtered) {
            const g = groupProvider(p);
            if (!groups[g]) groups[g] = [];
            groups[g].push(p);
        }
        return groups;
    }, [providers, search]);

    const reqFields = useMemo(
        () => selected?.Options.filter((o) => !o.Advanced) ?? [],
        [selected],
    );
    const advFields = useMemo(
        () => selected?.Options.filter((o) => o.Advanced) ?? [],
        [selected],
    );

    const selectProvider = useCallback((p: Provider) => {
        setSelected(p);
        const defaults: Record<string, string> = {};
        for (const o of p.Options) {
            if (o.DefaultStr) defaults[o.Name] = o.DefaultStr;
        }
        setValues(defaults);
    }, []);

    const save = useCallback(async () => {
        if (!selected || !remoteName.trim()) return;
        setSaving(true);
        try {
            const params: Record<string, string> = {};
            for (const o of selected.Options) {
                const v = values[o.Name];
                if (v && v !== o.DefaultStr) params[o.Name] = v;
            }
            const method = editRemote ? "config/update" : "config/create";
            const req = JSON.stringify({name: remoteName.trim(), type: selected.Name, parameters: params});
            const res = await RpcCall(method, req);
            const data = JSON.parse(res);
            if (data.error) {
                toastError(data.error);
            } else {
                toastSuccess(`"${remoteName.trim()}" ${editRemote ? "güncellendi" : "eklendi"}`);
                onClose();
            }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    }, [selected, remoteName, values, editRemote, onClose]);

    const setVal = useCallback((name: string, v: string | null) => {
        if (v === null) return;
        setValues((prev) => ({...prev, [name]: v}));
    }, []);

    const renderField = (o: ProviderOption) => {
        const val = values[o.Name] ?? o.DefaultStr ?? "";
        if ((o.Exclusive || o.Type === "CommaSepList") && o.Examples?.length) {
            return (
                <Select value={val} onValueChange={(v) => setVal(o.Name, v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Seçin..."/></SelectTrigger>
                    <SelectContent>
                        {o.Examples.map((ex) => (
                            <SelectItem key={ex.Value} value={ex.Value}>{ex.Help}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }
        if (o.Type === "bool") {
            return (
                <Select value={val || "false"} onValueChange={(v) => setVal(o.Name, v)}>
                    <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Evet</SelectItem>
                        <SelectItem value="false">Hayır</SelectItem>
                    </SelectContent>
                </Select>
            );
        }
        const isPw = o.IsPassword;
        return (
            <div className="relative">
                <Input
                    type={isPw ? "password" : "text"}
                    value={val}
                    onChange={(e) => setVal(o.Name, e.target.value)}
                    placeholder={o.DefaultStr || (o.Required ? "(zorunlu)" : "(opsiyonel)")}
                    className="w-full"
                />
                {o.Help.split("\n").slice(1).filter(Boolean).length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {o.Help.split("\n").slice(1).filter(Boolean).join(" ")}
                    </p>
                )}
            </div>
        );
    };

    const steps = [
        {num: 1, label: "Sağlayıcı"},
        {num: 2, label: "Ayarlar"},
        {num: 3, label: "Kaydet"},
    ];

    const Icon = selected ? providerIcon(selected.Name) : Server;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="!max-w-[900px] !w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Step indicator */}
                <div className="flex items-center gap-0 px-6 pt-4 pb-3 border-b shrink-0">
                    {steps.map((s, i) => (
                        <div key={s.num} className="flex items-center flex-1">
                            <div className={`flex items-center gap-2 ${step >= i ? "text-primary" : "text-muted-foreground"}`}>
                                <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold
                                    ${step > i ? "bg-primary text-primary-foreground" :
                                      step === i ? "bg-primary text-primary-foreground" :
                                      "bg-muted text-muted-foreground"}`}>
                                    {step > i ? <Check className="size-3.5"/> : s.num}
                                </div>
                                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-px mx-3 ${step > i ? "bg-primary" : "bg-border"}`}/>
                            )}
                        </div>
                    ))}
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto min-h-0 p-5">
                    {step === 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="relative shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"/>
                                <Input className="pl-9" placeholder="Sağlayıcı ara (örn: google, s3, sftp)..."
                                    value={search} onChange={(e) => setSearch(e.target.value)} autoFocus/>
                            </div>
                            {Object.entries(grouped).length === 0 && (
                                <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">Sonuç bulunamadı</div>
                            )}
                            {Object.entries(grouped).map(([group, items]) => (
                                <div key={group}>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{group}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                        {items.map((p) => {
                                            const Icn = providerIcon(p.Name);
                                            return (
                                                <Card key={p.Name}
                                                    className={`cursor-pointer hover:bg-accent transition-all border-l-4 ${categoryColors[group] || "border-l-border"}
                                                        ${selected?.Name === p.Name ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"}`}
                                                    onClick={() => selectProvider(p)}>
                                                    <CardHeader className="p-3 pb-2">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Icn className="size-4 text-muted-foreground shrink-0 mt-0.5"/>
                                                                <CardTitle className="text-sm font-medium leading-tight">{p.Description || p.Name}</CardTitle>
                                                            </div>
                                                            {selected?.Name === p.Name && <Check className="size-4 text-primary shrink-0"/>}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="px-3 pb-3">
                                                        <CardDescription className="text-[11px] font-mono">{p.Name}</CardDescription>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 1 && selected && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 pb-3 border-b shrink-0">
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Icon className="size-5 text-primary"/>
                                </div>
                                <div>
                                    <h2 className="font-semibold">{selected.Description || selected.Name}</h2>
                                    <p className="text-xs text-muted-foreground font-mono">{selected.Name}</p>
                                </div>
                            </div>
                            {reqFields.map((o) => (
                                <div key={o.Name}>
                                    <Label className="text-sm font-medium">{o.Help.split("\n")[0]}{o.Required && <span className="text-destructive ml-0.5">*</span>}</Label>
                                    <div className="mt-1.5">{renderField(o)}</div>
                                </div>
                            ))}
                            {advFields.length > 0 && (
                                <div className="pt-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="text-xs text-muted-foreground h-auto py-1 px-0 hover:text-foreground">
                                        {showAdvanced ? "Gizle" : `Göster`} — {advFields.length} gelişmiş ayar
                                    </Button>
                                    {showAdvanced && (
                                        <div className="space-y-4 mt-3 pl-3 border-l-2 border-muted">
                                            {advFields.map((o) => (
                                                <div key={o.Name}>
                                                    <Label className="text-sm">{o.Help.split("\n")[0]}</Label>
                                                    <div className="mt-1.5">{renderField(o)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <Label className="text-base font-semibold">Remote Adı</Label>
                                <Input className="mt-1.5 text-lg" value={remoteName}
                                    onChange={(e) => setRemoteName(e.target.value)}
                                    placeholder={selected ? `ornek-${selected.Name}` : ""} autoFocus/>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    Bu ad ile rclone komutlarında kullanacaksın. Örn:
                                    <code className="bg-muted px-1 rounded text-[11px] ml-1">rclone ls google-diskim:</code>
                                </p>
                            </div>
                            {selected && (
                                <Card className="bg-muted/30">
                                    <CardHeader className="p-4 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className="size-4 text-primary"/>
                                            <CardTitle className="text-sm">{selected.Description || selected.Name}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="space-y-1.5">
                                            {Object.entries(values).filter(([, v]) => v).map(([k, v]) => (
                                                <div key={k} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground font-mono text-xs">{k}</span>
                                                    <span className="font-mono text-xs truncate ml-4 max-w-[250px] text-right">
                                                        {k.toLowerCase().includes("secret") || k.toLowerCase().includes("pass") ? "\u2022\u2022\u2022\u2022\u2022\u2022" : v}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20 shrink-0">
                    <Button variant="outline" size="sm"
                        onClick={step === 0 ? onClose : () => setStep(step - 1)}>
                        {step === 0 ? <><ArrowLeft data-icon="inline-start"/> İptal</> : <><ArrowLeft data-icon="inline-start"/> Geri</>}
                    </Button>
                    <div className="flex items-center gap-2">
                        {step < 2 ? (
                            <Button size="sm" disabled={step === 0 && !selected} onClick={() => setStep(step + 1)}>
                                Devam <ArrowRight className="size-4 ml-1"/>
                            </Button>
                        ) : (
                            <Button size="sm" disabled={!remoteName.trim() || saving} onClick={save}>
                                {saving ? "Kaydediliyor..." : "Remote'u Kaydet"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
