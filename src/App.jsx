import React, { useState, useRef } from 'react'

const GST_RATES = [0, 5, 12, 18, 28]

const defaultItem = () => ({
  id: Date.now() + Math.random(),
  description: '',
  hsn: '',
  qty: 1,
  rate: 0,
  gstRate: 18,
})

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0)

export default function App() {
  const [invoice, setInvoice] = useState({
    invoiceNo: 'INV-001',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    sellerName: '',
    sellerGST: '',
    sellerAddress: '',
    buyerName: '',
    buyerGST: '',
    buyerAddress: '',
    notes: '',
    igst: false, // if true use IGST, else CGST+SGST
  })
  const [items, setItems] = useState([defaultItem()])
  const printRef = useRef()

  const updateInvoice = (k, v) => setInvoice((p) => ({ ...p, [k]: v }))

  const updateItem = (id, k, v) =>
    setItems((p) => p.map((it) => (it.id === id ? { ...it, [k]: v } : it)))

  const addItem = () => setItems((p) => [...p, defaultItem()])
  const removeItem = (id) => setItems((p) => p.filter((it) => it.id !== id))

  const calcItem = (it) => {
    const subtotal = parseFloat(it.qty || 0) * parseFloat(it.rate || 0)
    const gstAmt = subtotal * (parseFloat(it.gstRate) / 100)
    return { subtotal, gstAmt, total: subtotal + gstAmt }
  }

  const totals = items.reduce(
    (acc, it) => {
      const c = calcItem(it)
      return {
        subtotal: acc.subtotal + c.subtotal,
        gst: acc.gst + c.gstAmt,
        total: acc.total + c.total,
      }
    },
    { subtotal: 0, gst: 0, total: 0 }
  )

  const handlePrint = () => window.print()

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f0f4f8; color: #1a202c; }

        .app { max-width: 960px; margin: 0 auto; padding: 24px 16px 80px; }

        /* Header */
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; border-radius: 16px; padding: 28px 32px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 24px; font-weight: 700; }
        .header p { font-size: 13px; opacity: 0.8; margin-top: 4px; }
        .btn-primary { background: white; color: #2563eb; border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
        .btn-primary:hover { background: #eff6ff; transform: translateY(-1px); }

        /* Cards */
        .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 24px; margin-bottom: 20px; }
        .card h2 { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 16px; }

        /* Grid */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

        /* Inputs */
        label { display: block; font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px; }
        input, select, textarea { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 9px 12px; font-size: 14px; color: #1a202c; font-family: inherit; outline: none; transition: border-color .15s; background: white; }
        input:focus, select:focus, textarea:focus { border-color: #2563eb; }
        textarea { resize: vertical; min-height: 72px; }

        /* Toggle */
        .toggle-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .toggle { position: relative; width: 44px; height: 24px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; inset: 0; background: #d1d5db; border-radius: 24px; cursor: pointer; transition: .2s; }
        .slider:before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: .2s; }
        input:checked + .slider { background: #2563eb; }
        input:checked + .slider:before { transform: translateX(20px); }

        /* Items table */
        .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .items-table th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
        .items-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .items-table input, .items-table select { border-radius: 6px; padding: 7px 8px; font-size: 13px; }
        .items-table .num { text-align: right; }
        .btn-remove { background: none; border: none; cursor: pointer; color: #ef4444; font-size: 18px; padding: 4px 8px; border-radius: 6px; }
        .btn-remove:hover { background: #fef2f2; }
        .btn-add { margin-top: 12px; background: #eff6ff; border: 1.5px dashed #93c5fd; color: #2563eb; border-radius: 8px; padding: 10px; width: 100%; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; }
        .btn-add:hover { background: #dbeafe; }

        /* Totals */
        .totals { display: flex; justify-content: flex-end; }
        .totals-box { min-width: 320px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
        .totals-row.grand { border-bottom: none; background: #1e3a5f; color: white; padding: 14px 16px; border-radius: 8px; margin-top: 8px; font-size: 16px; font-weight: 700; }

        /* Built for badge */
        .built-for { text-align: center; margin-top: 32px; }
        .built-for a { display: inline-flex; align-items: center; gap: 8px; background: #1e3a5f; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; transition: all .15s; }
        .built-for a:hover { background: #2563eb; transform: translateY(-1px); }

        /* Print styles */
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .app { padding: 0; max-width: 100%; }
          .card { box-shadow: none; border: 1px solid #e5e7eb; margin-bottom: 12px; }
          .header { background: #1e3a5f !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="app" ref={printRef}>
        {/* Header */}
        <div className="header">
          <div>
            <h1>🧾 GST Invoice Calculator</h1>
            <p>Create, calculate & print GST invoices instantly — free, no signup</p>
          </div>
          <button className="btn-primary no-print" onClick={handlePrint}>
            🖨️ Print / Save PDF
          </button>
        </div>

        {/* Invoice meta */}
        <div className="card">
          <h2>Invoice Details</h2>
          <div className="grid-3">
            <div>
              <label>Invoice Number</label>
              <input value={invoice.invoiceNo} onChange={e => updateInvoice('invoiceNo', e.target.value)} />
            </div>
            <div>
              <label>Invoice Date</label>
              <input type="date" value={invoice.date} onChange={e => updateInvoice('date', e.target.value)} />
            </div>
            <div>
              <label>Due Date</label>
              <input type="date" value={invoice.dueDate} onChange={e => updateInvoice('dueDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid-2">
          <div className="card">
            <h2>Seller (From)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label>Business Name</label><input placeholder="Your Company Pvt. Ltd." value={invoice.sellerName} onChange={e => updateInvoice('sellerName', e.target.value)} /></div>
              <div><label>GSTIN</label><input placeholder="29AAAAA0000A1Z5" value={invoice.sellerGST} onChange={e => updateInvoice('sellerGST', e.target.value)} /></div>
              <div><label>Address</label><textarea placeholder="Street, City, State - PIN" value={invoice.sellerAddress} onChange={e => updateInvoice('sellerAddress', e.target.value)} /></div>
            </div>
          </div>
          <div className="card">
            <h2>Buyer (Bill To)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label>Business / Customer Name</label><input placeholder="Client Name" value={invoice.buyerName} onChange={e => updateInvoice('buyerName', e.target.value)} /></div>
              <div><label>GSTIN (optional)</label><input placeholder="29BBBBB0000B1Z5" value={invoice.buyerGST} onChange={e => updateInvoice('buyerGST', e.target.value)} /></div>
              <div><label>Address</label><textarea placeholder="Street, City, State - PIN" value={invoice.buyerAddress} onChange={e => updateInvoice('buyerAddress', e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* GST type toggle */}
        <div className="card">
          <h2>GST Type</h2>
          <div className="toggle-row">
            <label className="toggle">
              <input type="checkbox" checked={invoice.igst} onChange={e => updateInvoice('igst', e.target.checked)} />
              <span className="slider"></span>
            </label>
            <span style={{ fontSize: 14 }}>
              {invoice.igst
                ? '🔀 IGST (Inter-state supply)'
                : '🏠 CGST + SGST (Intra-state supply)'}
            </span>
          </div>

          {/* Items */}
          <div style={{ overflowX: 'auto' }}>
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th>Description</th>
                  <th style={{ width: 100 }}>HSN/SAC</th>
                  <th style={{ width: 70 }}>Qty</th>
                  <th style={{ width: 110 }}>Rate (₹)</th>
                  <th style={{ width: 90 }}>GST %</th>
                  <th className="num" style={{ width: 110 }}>Taxable</th>
                  <th className="num" style={{ width: 110 }}>GST Amt</th>
                  <th className="num" style={{ width: 110 }}>Total</th>
                  <th className="no-print" style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const c = calcItem(it)
                  return (
                    <tr key={it.id}>
                      <td style={{ color: '#9ca3af', fontSize: 12 }}>{idx + 1}</td>
                      <td><input value={it.description} onChange={e => updateItem(it.id, 'description', e.target.value)} placeholder="Item / Service" /></td>
                      <td><input value={it.hsn} onChange={e => updateItem(it.id, 'hsn', e.target.value)} placeholder="998313" /></td>
                      <td><input type="number" min="0" value={it.qty} onChange={e => updateItem(it.id, 'qty', e.target.value)} /></td>
                      <td><input type="number" min="0" step="0.01" value={it.rate} onChange={e => updateItem(it.id, 'rate', e.target.value)} /></td>
                      <td>
                        <select value={it.gstRate} onChange={e => updateItem(it.id, 'gstRate', e.target.value)}>
                          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="num">{formatINR(c.subtotal)}</td>
                      <td className="num">{formatINR(c.gstAmt)}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{formatINR(c.total)}</td>
                      <td className="no-print">
                        <button className="btn-remove" onClick={() => removeItem(it.id)} title="Remove">×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button className="btn-add no-print" onClick={addItem}>+ Add Line Item</button>
        </div>

        {/* Totals */}
        <div className="card">
          <div className="totals">
            <div className="totals-box">
              <div className="totals-row"><span>Subtotal (Taxable)</span><span>{formatINR(totals.subtotal)}</span></div>
              {invoice.igst ? (
                <div className="totals-row"><span>IGST</span><span>{formatINR(totals.gst)}</span></div>
              ) : (
                <>
                  <div className="totals-row"><span>CGST</span><span>{formatINR(totals.gst / 2)}</span></div>
                  <div className="totals-row"><span>SGST</span><span>{formatINR(totals.gst / 2)}</span></div>
                </>
              )}
              <div className="totals-row grand"><span>Grand Total</span><span>{formatINR(totals.total)}</span></div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2>Notes / Terms</h2>
          <textarea placeholder="e.g. Payment due within 30 days. Bank details: ..." value={invoice.notes} onChange={e => updateInvoice('notes', e.target.value)} />
        </div>

        {/* Per-item GST breakdown */}
        <div className="card">
          <h2>GST Slab Breakdown</h2>
          <table className="items-table">
            <thead>
              <tr>
                <th>GST Rate</th>
                <th className="num">Taxable Value</th>
                {invoice.igst ? (
                  <th className="num">IGST</th>
                ) : (
                  <>
                    <th className="num">CGST</th>
                    <th className="num">SGST</th>
                  </>
                )}
                <th className="num">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {GST_RATES.map(rate => {
                const slabItems = items.filter(it => parseFloat(it.gstRate) === rate)
                if (!slabItems.length) return null
                const taxable = slabItems.reduce((s, it) => s + calcItem(it).subtotal, 0)
                const tax = taxable * rate / 100
                return (
                  <tr key={rate}>
                    <td>{rate}%</td>
                    <td className="num">{formatINR(taxable)}</td>
                    {invoice.igst ? (
                      <td className="num">{formatINR(tax)}</td>
                    ) : (
                      <>
                        <td className="num">{formatINR(tax / 2)}</td>
                        <td className="num">{formatINR(tax / 2)}</td>
                      </>
                    )}
                    <td className="num" style={{ fontWeight: 600 }}>{formatINR(tax)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Author info (required by task) */}
        <div className="card" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Built by</p>
            <p style={{ fontWeight: 600 }}>Uttam Gupta</p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>uttam@example.com</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>About this tool</p>
            <p style={{ fontSize: 13 }}>Free GST invoice calculator — I use this every time I raise a freelance invoice and hate doing the CGST/SGST split math manually.</p>
          </div>
        </div>

        {/* Built for Digital Heroes button — MANDATORY */}
        <div className="built-for">
          <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">
            🦸 Built for Digital Heroes
          </a>
        </div>
      </div>
    </>
  )
}
