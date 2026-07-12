import {useEffect, useState} from 'react';
import {ListRemotes} from "../wailsjs/go/main/App";

function App() {
    const [remotes, setRemotes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        ListRemotes()
            .then(setRemotes)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div id="app">
            <h1>rcloneui</h1>
            {loading && <p>Yükleniyor...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && remotes.length === 0 && (
                <p>Henüz remote yapılandırılmamış.</p>
            )}
            {remotes.length > 0 && (
                <ul>
                    {remotes.map(r => <li key={r}>{r}</li>)}
                </ul>
            )}
        </div>
    );
}

export default App
