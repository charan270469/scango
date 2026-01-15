
import React from 'react';

const SystemArchitecture: React.FC = () => {
  return (
    <div className="space-y-8 pb-10">
      <section>
        <h2 className="text-2xl font-black text-gray-900 border-l-4 border-green-500 pl-3 mb-4">1. High-Level Architecture</h2>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 font-mono text-xs overflow-x-auto whitespace-pre">
{`[Mobile App] --- SQL Queries ---> [Database Layer]
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
    [Master Data]          [Store Inventory Tables]   [Receipts Table]
    (Global Catalog)       (Store_001, Store_002...)  (Status Tracking)
            |                       |                       |
    [JSON Storage]         [Pricing Engine]        [Payment Status]
    (Full Receipt Blob)    (Dynamic Join)          (Audit Log)`}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black text-gray-900 mb-3">2. SQL Database Schema</h2>
        <div className="grid gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <span className="font-bold text-blue-800">TABLE Product_Master:</span> 
            <br/><code className="text-xs">id (PK), barcode, name, brand, category, image_url, base_mrp</code>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
             <span className="font-bold text-green-800">TABLE Store_XXX_Inventory:</span> 
             <br/><span className="text-xs text-green-700 italic">"Each store has its own table"</span>
             <br/><code className="text-xs">product_id (FK), store_price, store_discount, in_stock</code>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <span className="font-bold text-orange-800">TABLE Receipt_Status_Registry:</span> 
            <br/><code className="text-xs">receipt_number (PK), store_id, total_amount, payment_status, created_at</code>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black text-gray-900 mb-3">3. Query Logic</h2>
        <div className="space-y-4">
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black">SELECT</span>
              <span className="text-sm font-bold">Scanning an Item</span>
            </div>
            <div className="bg-gray-800 text-gray-200 p-2 rounded text-[10px] font-mono">
              SELECT p.name, i.store_price <br/>
              FROM Product_Master p <br/>
              JOIN Store_001_Inventory i ON p.id = i.product_id <br/>
              WHERE p.barcode = 'SCANNED_CODE'
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black">INSERT</span>
              <span className="text-sm font-bold">Checkout</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">1. Full receipt details saved to JSON file (LocalStorage).</p>
            <p className="text-xs text-gray-500">2. Transaction status saved to SQL:</p>
            <div className="bg-gray-800 text-gray-200 p-2 rounded text-[10px] font-mono mt-1">
              INSERT INTO Receipt_Status_Registry <br/>
              (receipt_number, store_id, total, status) <br/>
              VALUES ('RCP-123', 'store-001', 500, 'PAID');
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black text-gray-900 mb-3">4. Security & Compliance</h2>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
          <li><span className="font-bold">Data Isolation:</span> Separate inventory tables ensure pricing errors in one store do not affect others.</li>
          <li><span className="font-bold">Audit Trail:</span> The <code>Receipt_Status_Registry</code> table provides a rigid SQL-based audit log separate from the flexible JSON receipt document.</li>
        </ul>
      </section>
    </div>
  );
};

export default SystemArchitecture;
