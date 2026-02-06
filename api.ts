import { Event, Equipment } from './types';

// Default to localhost for dev, but this should be set in .env
// Vite exposes env variables via import.meta.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

export const api = {
    // Inventory
    async getInventory(): Promise<Equipment[]> {
        try {
            const res = await fetch(`${API_URL}/inventory`);
            if (!res.ok) throw new Error('Failed to fetch inventory');
            const data = await res.json();
            return data || [];
        } catch (err) {
            console.error(err);
            return [];
        }
    },

    async syncInventory(items: Equipment[]) {
        await fetch(`${API_URL}/inventory/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
    },

    // Events
    async getEvents(): Promise<Event[]> {
        try {
            const res = await fetch(`${API_URL}/events`);
            if (!res.ok) throw new Error('Failed to fetch events');
            const data = await res.json();
            return data || [];
        } catch (err) {
            console.error(err);
            return [];
        }
    },

    async syncEvents(items: Event[]) {
        await fetch(`${API_URL}/events/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
    },

    // Images
    async uploadImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Image upload failed');
        const data = await res.json();
        return data.url; // Returns the public Supabase URL
    },

    // Delete
    async deleteInventory(id: string) {
        await fetch(`${API_URL}/inventory/${id}`, {
            method: 'DELETE'
        });
    },

    async deleteEvent(id: string) {
        await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE'
        });
    }
};
