import Swal from "sweetalert2";

const theme = () => document.documentElement.classList.contains("dark") ? "dark" : "light";

export async function confirm(title: string, text?: string) {
    const result = await Swal.fire({
        title,
        text,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Evet",
        cancelButtonText: "İptal",
        background: theme() === "dark" ? "#1f2937" : "#fff",
        color: theme() === "dark" ? "#f3f4f6" : "#111827",
        reverseButtons: true,
    });
    return result.isConfirmed;
}

export async function toastSuccess(message: string) {
    Swal.fire({
        text: message,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: theme() === "dark" ? "#1f2937" : "#fff",
        color: theme() === "dark" ? "#f3f4f6" : "#111827",
    });
}

export async function toastError(message: string) {
    Swal.fire({
        text: message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        background: theme() === "dark" ? "#1f2937" : "#fff",
        color: theme() === "dark" ? "#f3f4f6" : "#111827",
    });
}

export async function alertError(title: string, text?: string) {
    await Swal.fire({
        title,
        text,
        icon: "error",
        confirmButtonText: "Tamam",
        background: theme() === "dark" ? "#1f2937" : "#fff",
        color: theme() === "dark" ? "#f3f4f6" : "#111827",
    });
}

export async function prompt(title: string, inputLabel: string, inputPlaceholder?: string) {
    const result = await Swal.fire({
        title,
        input: "text",
        inputLabel,
        inputPlaceholder,
        showCancelButton: true,
        confirmButtonText: "Tamam",
        cancelButtonText: "İptal",
        background: theme() === "dark" ? "#1f2937" : "#fff",
        color: theme() === "dark" ? "#f3f4f6" : "#111827",
        reverseButtons: true,
    });
    return result.isConfirmed ? result.value : null;
}
