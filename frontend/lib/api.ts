import { ApiError } from "next/dist/server/api-utils"

const API_URL = process.env.NEXT_PUBLIC_API || 'http://localhost:3001/api'

export class APiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
    }
}
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }))
        throw new ApiError(response.status, error.message || "Request failed")

    }
    return response.json();
}

export async function uploadInvoice(file: File) {
    const formData = new FormData();
    formData.append('invoice', file);

    const response = await fetch(`${API_URL}/invoices/upload`, {
        method: "POST",
        body: formData
    })
    return handleResponse<{
        success: boolean,
        message: string,
        data: {
            id: string;
            filename: string;
            size: number;
            type: string;

        }
    }>(response)


}

export async function analyzeInvoice(id: string) {
    
    const response = await fetch(`${API_URL}/invoices/${id}/analyze`, {
        method: 'POST',

    })

    return handleResponse<{
        success: boolean,
        message: string,
        data: any
    }>(response)
}  


export async function getInvoices() {
    const response = await fetch(`${API_URL}/invoices`, {
        method: 'GET'
    })
    return handleResponse<{
        success: boolean;
        data: any[]
    }>(response)
}
export async function getInvoice(id: string) {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'PUT',
    })
    return handleResponse<{
        success: true;
        data: any
    }>(response)
}

// Vendors



export async function getVendors() {
    const response = await fetch(`${API_URL}/vendors}`, {
        method: 'GET'
    })
    return handleResponse<{
        success: true;
        data: any[]
    }>(response)
}
export async function getVendor(id: string) {
    const response = await fetch(`${API_URL}/vendors/${id}}`, {
        method: 'GET'
    })
    return handleResponse<{
        success: true;
        data: any
    }>(response)

}
export async function addVendor(vendor: {
    name: string;
    vatNumber?: string;
    iban?: string;
    email?: string;
    phone?: string;
    address?: string;
}) {
    const response = await fetch(`${API_URL}/vendors`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendor),

    })
    return handleResponse<{
        success: boolean;
        data: any;
    }>(response);
}