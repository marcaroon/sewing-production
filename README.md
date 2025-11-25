# Garment Production System - Prototype

Sistem manajemen produksi garment yang komprehensif dengan tracking lengkap dari cutting hingga packing, termasuk pencatatan surat jalan dan log aktivitas produksi.

## 🎯 Fitur Utama

### 1. **Order Management**
- Create order dengan detail buyer, style, dan size breakdown
- Tracking status produksi real-time
- Dashboard overview dengan statistik lengkap
- Filter dan search orders

### 2. **Production Tracking**
- Workflow lengkap: Cutting → Numbering → Shiwake → Sewing → QC → Ironing → Final QC → Packing
- Progress tracking per order
- WIP (Work In Progress) monitoring per department
- Lead time tracking per proses

### 3. **Transfer Log & Surat Jalan**
- Auto-generate surat jalan setiap perpindahan proses
- Tracking siapa yang menyerahkan dan menerima
- Bundle tracking
- Reject dan rework logging

### 4. **Buyer Management**
- Repeat buyer vs One-time buyer
- Leftover material policy berbeda per buyer
- Contact person tracking

### 5. **Process History**
- Timeline lengkap aktivitas produksi
- Audit trail setiap perubahan status
- Link ke surat jalan terkait

## 📁 Struktur Folder

```
garment-production-system/
├── app/
│   ├── layout.tsx                 # Root layout dengan header & footer
│   ├── page.tsx                   # Dashboard utama
│   ├── globals.css                # Global styles
│   ├── orders/
│   │   ├── page.tsx              # List semua orders
│   │   ├── [id]/
│   │   │   └── page.tsx          # Detail order dengan tabs
│   │   └── new/
│   │       └── page.tsx          # Create new order
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx            # Reusable button component
│   │   ├── Card.tsx              # Card components
│   │   ├── Badge.tsx             # Status badges
│   │   └── Modal.tsx             # Modal dialog
│   ├── OrderCard.tsx             # Order card untuk list view
│   ├── ProcessTimeline.tsx       # Timeline component
│   ├── TransferLogTable.tsx      # Table surat jalan
│   └── StatusUpdateForm.tsx      # Form update status
│
├── lib/
│   ├── types.ts                  # TypeScript type definitions
│   ├── constants.ts              # Constants & configurations
│   ├── storage.ts                # localStorage functions
│   ├── utils.ts                  # Utility functions
│   └── dummyData.ts              # Dummy data generator
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.mjs
```

## 🚀 Cara Install & Menjalankan

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Installation

1. **Create project folder dan copy semua file**
```bash
mkdir garment-production-system
cd garment-production-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Buka browser**
```
http://localhost:3000
```

### Build untuk Production

```bash
npm run build
npm start
```

## 📊 Data Model Overview

### Order
- Order number (auto-generated)
- Buyer info (repeat/one-time)
- Style info
- Size breakdown dengan quantity per size
- Current status & progress tracking
- WIP per department
- Lead time per process
- Reject & rework tracking

### Transfer Log (Surat Jalan)
- Transfer number (auto-generated)
- From → To department
- Handed over by / Received by
- Items dengan condition (good/defect/rework)
- Timestamp & notes

### Process History
- Complete audit trail
- Action descriptions
- Department & performer tracking
- Duration per process
- Link to transfer logs

## 🎨 Fitur UI/UX

### Dashboard
- Overview statistics (total orders, in progress, completed, WIP)
- Performance metrics (avg lead time, reject rate)
- Quick actions
- Active orders grid
- Recently completed orders

### Order List
- Search & filter by status
- Sort by date/status/buyer
- Grid view dengan cards
- Status indicators & progress bars

### Order Detail
- 4 Tabs: Overview, Timeline, Surat Jalan, Details
- Size breakdown table
- WIP distribution chart
- Lead time tracking
- Process history timeline
- Transfer log table dengan detail modal

### Create Order
- Step-by-step form
- Buyer selection dengan policy info
- Style selection dengan estimates
- Size breakdown grid
- Date scheduling
- Real-time validation

## 🔧 Customization untuk Klien

### 1. **Tambah Department Baru**
Edit `lib/constants.ts`:
```typescript
export const DEPARTMENTS = {
  // ... existing
  INSPECTION: 'Inspection',
  FINISHING: 'Finishing',
};
```

### 2. **Tambah Status Proses Baru**
Edit `lib/constants.ts`:
```typescript
export const PROCESS_FLOW: ProcessStatus[] = [
  // ... existing
  'inspection',
  'finishing',
  'completed',
];
```

### 3. **Customize Leftover Policy**
Edit buyer creation di `lib/dummyData.ts` atau form input.

### 4. **Tambah Field Custom**
Extend types di `lib/types.ts` dan update forms.

## 💡 Skenario Penggunaan Demo

### Scenario 1: Create & Track Order Baru
1. Klik "New Order" di dashboard
2. Pilih buyer (repeat/one-time)
3. Pilih style
4. Input size breakdown
5. Set target date
6. Submit → Order dibuat dengan status "draft"
7. Di order detail, klik "Update Status"
8. System auto-generate surat jalan
9. Repeat untuk setiap proses

### Scenario 2: Monitor Active Orders
1. Dashboard menampilkan semua active orders
2. Klik order untuk lihat detail
3. Tab "Timeline" untuk lihat history
4. Tab "Surat Jalan" untuk lihat semua transfer logs
5. Monitor WIP distribution per department

### Scenario 3: Handle One-Time Buyer
1. Create order dengan one-time buyer
2. System otomatis set leftover policy "must return"
3. Setelah production selesai, leftover harus diretur
4. Different workflow dari repeat buyer

## 🎯 Keunggulan Sistem

### 1. **Complete Traceability**
- Setiap perpindahan tercatat dengan surat jalan
- Audit trail lengkap dari awal sampai akhir
- Siapa, kapan, kemana, berapa quantity

### 2. **Automated Workflows**
- Auto-generate order number & transfer number
- Auto-create surat jalan saat update status
- Bundle number generation

### 3. **Real-time Monitoring**
- Dashboard real-time
- Progress tracking per order
- WIP monitoring per department
- Reject rate tracking

### 4. **Buyer-Specific Rules**
- Different leftover handling (repeat vs one-time)
- Policy enforcement dalam system
- Contact person tracking

### 5. **Production Insights**
- Lead time per process
- Average lead time calculation
- Reject rate analytics
- Completion rate tracking

## 📈 Pengembangan ke Production System

### Phase 1: Backend Integration
- Migrasi dari localStorage ke database (PostgreSQL/MySQL)
- API backend (Node.js/Express atau Laravel)
- Authentication & authorization
- Multi-user support dengan roles

### Phase 2: Advanced Features
- Real-time updates (WebSocket)
- Barcode/QR scanning untuk bundle tracking
- Photo upload untuk reject logging
- Report generation (PDF/Excel)
- Email notifications

### Phase 3: Mobile App
- Mobile app untuk supervisor (React Native/Flutter)
- Scan bundle barcodes
- Update status on-the-go
- Real-time notifications

### Phase 4: Analytics & AI
- Predictive analytics untuk lead time
- Anomaly detection untuk reject rates
- Capacity planning algorithms
- Production optimization suggestions

### Phase 5: Integration
- ERP integration
- Inventory management sync
- Financial system integration
- Customer portal

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + localStorage
- **Data Persistence**: localStorage (prototype only)

## 📝 Notes untuk Presentasi Klien

### Highlight Points:
1. ✅ **Complete workflow tracking** dari cutting sampai packing
2. ✅ **Surat jalan otomatis** setiap perpindahan proses
3. ✅ **Buyer-specific policies** (repeat vs one-time)
4. ✅ **Real-time progress monitoring**
5. ✅ **Audit trail lengkap** untuk compliance
6. ✅ **WIP monitoring** untuk capacity planning
7. ✅ **Reject tracking** untuk quality control
8. ✅ **Lead time analytics** untuk process improvement

### Demo Flow:
1. Show dashboard overview
2. Create new order step-by-step
3. Update status dan show auto-generated surat jalan
4. Show process timeline
5. Show transfer log details
6. Explain buyer type differences
7. Show analytics & metrics

## 🤝 Support & Contact

Prototype ini dibuat untuk demo kepada klien. Untuk pengembangan lebih lanjut ke production system, silakan diskusikan requirements detail.

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: Prototype for Client Demo