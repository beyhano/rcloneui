import {useEffect, useState} from 'react';
import {ListRemotes} from "../wailsjs/go/main/App";
import {Button} from "@/components/ui/button";
import {Moon, Sun, Plus, RefreshCw} from "lucide-react";
import {useTheme} from "@/lib/use-theme";
import Wizard from "@/pages/Wizard";

function App() {
    const [remotes, setRemotes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [wizardOpen, setWizardOpen] = useState(false);
    const {theme, toggleTheme} = useTheme();

    const load = () => {
        setLoading(true);
        setError('');
        ListRemotes()
            .then(setRemotes)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-svh flex flex-col p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">rcloneui</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Tema">
                        {theme === 'dark' ? <Sun className="size-4"/> : <Moon className="size-4"/>}
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-4">
                <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="size-4 mr-1"/> Yeni Remote
                </Button>
                <Button onClick={load} variant="outline" size="icon" aria-label="Yenile">
                    <RefreshCw className="size-4"/>
                </Button>
            </div>

            {/* Content */}
            {loading && <p className="text-muted-foreground">Yükleniyor...</p>}

            {error && (
                <div className="text-destructive mb-4">
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && remotes.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <p className="mb-2">Henüz remote yapılandırılmamış.</p>
                    <p className="text-sm">"Yeni Remote" ile başlayın.</p>
                </div>
            )}

            {remotes.length > 0 && (
                <div className="grid gap-2">
                    {remotes.map(r => (
                        <div key={r}
                            className="p-3 rounded-lg bg-muted text-foreground">
                            {r}
                        </div>
                    ))}
                </div>
            )}

            <Wizard open={wizardOpen} onClose={() => { setWizardOpen(false); load(); }}/>
        </div>
    );
}

export default App
