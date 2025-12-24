// Format currency in Indian Rupees
export function formatCurrency(amount: number | null | undefined): string {
    const val = amount || 0;
    return `₹${val.toLocaleString('en-IN')}`;
}

// Format date to display format
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// Format date for input fields
export function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Calculate rental days between two dates
export function calculateRentalDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Get tomorrow's date
export function getTomorrow(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
}

// Get date N days from now
export function getDateFromNow(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}
