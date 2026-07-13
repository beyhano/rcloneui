import {useEffect, useState} from 'react';
import {ListRemotes} from "../wailsjs/go/main/App";
import {Button} from "@/components/ui/button";
import {Moon, Sun} from "lucide-react";
import {useTheme} from "@/lib/use-theme";

function App() {
    const [remotes, setRemotes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const {theme, toggleTheme} = useTheme();

    useEffect(() => {
        ListRemotes()
            .then(setRemotes)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const refresh = () => {
        setLoading(true);
        setError('');
        ListRemotes()
            .then(setRemotes)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    };

    return (
        <div className="min-h-svh flex flex-col items-center justify-center p-8 relative">
            <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                aria-label="Tema değiştir"
            >
                {theme === 'dark' ? <Sun className="size-4"/> : <Moon className="size-4"/>}
            </Button>

            <h1 className="text-3xl font-bold mb-6">rcloneui</h1>

            {loading && <p className="text-muted-foreground">Yükleniyor...</p>}

            {error && (
                <div className="text-destructive mb-4">
                    <p>{error}</p>
                    <Button onClick={refresh} variant="outline" className="mt-2">
                        Tekrar dene
                    </Button>
                </div>
            )}

            {!loading && !error && remotes.length === 0 && (
                <p className="text-muted-foreground">Henüz remote yapılandırılmamış.</p>
            )}

            {remotes.length > 0 && (
                <ul className="space-y-2 w-full max-w-md">
                    {remotes.map(r => (
                        <li key={r}
                            className="p-3 rounded-lg bg-muted text-foreground text-center">
                            {r}
                        </li>
                    ))}
                </ul>
            )}

            <Button onClick={refresh} variant="ghost" className="mt-6">
                Yenile
            </Button>
        </div>
    );
}

export default App
