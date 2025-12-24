import { apiClient } from './client';

export interface OwnerProfile {
    name: string;
    owner_name: string;
    email?: string;
    phone?: string;
    city?: string;
    supplier_link?: string;
}

export interface OwnerStats {
    total_items: number;
    active_items: number;
    total_rentals: number;
    total_sales_amount: number;
    commission_earned: number;
    commission_received: number;
    commission_pending: number;
}

export interface OwnerItem {
    name: string;
    item_name: string;
    item_group?: string;
    rental_rate_per_day: number;
    disabled: number;
    owner_commission_percent: number;
    owner_commission_fixed: number;
    image?: string;
    rental_count: number;
    total_revenue: number;
}

export interface OwnerSale {
    invoice_id: string;
    posting_date: string;
    formatted_date?: string;
    customer_name: string;
    booking_status: string;
    item_name: string;
    qty: number;
    amount: number;
    commission_amount: number;
}

export interface CommissionPayment {
    journal_entry: string;
    posting_date: string;
    formatted_date?: string;
    reference?: string;
    amount: number;
    remarks?: string;
}

export interface OwnerDashboardData {
    success: boolean;
    owner: OwnerProfile | null;
    stats: OwnerStats;
    items: OwnerItem[];
    recent_sales: OwnerSale[];
    commission_history: CommissionPayment[];
    message?: string;
    is_admin?: boolean;
}

export interface OwnerSummary {
    name: string;
    owner_name: string;
    email?: string;
    phone?: string;
    default_commission_rate?: number;
}

export async function getOwnerDashboardData(ownerId?: string): Promise<OwnerDashboardData> {
    const response = await apiClient.post<OwnerDashboardData>(
        '/api/method/rental_management.api.customer_portal.get_owner_dashboard_data',
        { owner_id: ownerId }
    );
    if (!response.data) throw new Error('No data received');
    return response.data;
}

export async function getAllOwners(): Promise<OwnerSummary[]> {
    const response = await apiClient.post<OwnerSummary[]>(
        '/api/method/rental_management.api.customer_portal.get_all_owners'
    );
    return response.data || [];
}

// Item Creation Types
export interface ItemGroup {
    name: string;
    item_group_name: string;
}

export interface Supplier {
    name: string;
    supplier_name: string;
}

export interface ItemCreationContext {
    item_groups: ItemGroup[];
    suppliers: Supplier[];
}

export interface NewSupplierData {
    supplier_name: string;
    mobile_no?: string;
    email_id?: string;
    address?: string;
}

export interface UploadedImage {
    name: string;
    content: string; // data URL
}

export interface CreateItemData {
    item_code: string;
    item_name: string;
    item_group: string;
    description?: string;
    rental_mrp_per_day: number;
    rental_rate_per_day: number;
    caution_deposit?: number;
    purchase_cost?: number;
    is_third_party_item: boolean;
    owner_commission_percent?: number;
    owner_commission_fixed?: number;
    owner_supplier_source?: string;
}

export async function getItemCreationContext(): Promise<ItemCreationContext> {
    const response = await apiClient.getClient().get(
        '/api/method/rental_management.api.customer_portal.get_item_creation_context'
    );
    // Frappe GET wrapper handling might differ, let's use standard handling or manual
    if (response.data?.message) return response.data.message;
    return response.data || { item_groups: [], suppliers: [] };
}

export async function createRentalItem(
    itemData: CreateItemData,
    newSupplier: NewSupplierData | null,
    images: UploadedImage[]
): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
        '/api/method/rental_management.api.customer_portal.create_rental_item',
        {
            item_data: JSON.stringify(itemData), // Backend expects stringified JSON
            new_supplier: newSupplier ? JSON.stringify(newSupplier) : null,
            images: images && images.length > 0 ? JSON.stringify(images) : null
        }
    );

    // Check nested message structure if any
    const data = response.data as any;
    if (data && data.success !== undefined) return data;
    if (data?.message?.success !== undefined) return data.message;

    return { success: false, message: 'Unknown response format' };
}
