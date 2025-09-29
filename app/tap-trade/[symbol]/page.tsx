"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TabNavigation from "../../components/ui/TabNavigation";

function generateInitialSeries(base: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 60; i++) {
    const drift = (Math.random() - 0.5) * 0.01; // +/-1%
    base = base * (1 + drift);
    arr.push(base);
  }
  return arr;
}

export default function TokenTapTradePage() {
  const params = useParams<{ symbol: string }>();
  const router = useRouter();
  const symbol = (params?.symbol || "asset").toUpperCase();

  const [prices, setPrices] = React.useState<number[]>(() => generateInitialSeries(100));
  const [last, setLast] = React.useState<number>(prices[prices.length - 1]);
  const [running, setRunning] = React.useState(true);
  const [positionQty, setPositionQty] = React.useState<number>(0);
  const [avgPrice, setAvgPrice] = React.useState<number>(0);
  const [orders, setOrders] = React.useState<Array<{ id:string; side:'buy'|'sell'; qty:number; price:number; usdt:number; pnl?:number }>>([]);
  const [bankroll, setBankroll] = React.useState<number>(() => {
    const s = sessionStorage.getItem('tap_trade_bankroll');
    return s ? parseFloat(s) : 1000;
  });
  const [resultModal, setResultModal] = React.useState<{open:boolean; pnl:number; pct:number}>({open:false, pnl:0, pct:0});

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setPrices(prev => {
        const lastPrice = prev[prev.length - 1];
        // random +/- 1% to 3%
        const sign = Math.random() < 0.5 ? -1 : 1;
        const pct = (Math.random() * 0.02 + 0.01) * sign; // 1-3%
        const next = lastPrice * (1 + pct);
        const updated = [...prev.slice(1), next];
        setLast(next);
        return updated;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  React.useEffect(()=>{
    sessionStorage.setItem('tap_trade_bankroll', bankroll.toFixed(2));
  }, [bankroll]);

  const isUp = last >= prices[0];
  const pnl = (last - avgPrice) * positionQty;
  const value = last * positionQty;

  const width = 360;
  const height = 300;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1e-6, max - min);
  const getX = (i: number) => (i / (prices.length - 1)) * width;
  const getY = (p: number) => height - ((p - min) / range) * height;

  const path = React.useMemo(() => {
    const pts = prices.map((p, i) => ({ x: getX(i), y: getY(p) }));
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cp1x = prev.x + (curr.x - prev.x) * 0.5;
      const cp1y = prev.y;
      const cp2x = curr.x - (pts[i + 1]?.x - curr.x || 0) * 0.5;
      const cp2y = curr.y;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    return d;
  }, [prices]);

  // Load tap preset (USDT amount) and expose trade actions
  const executeTrade = (side: 'buy' | 'sell') => {
    let preset: any = null;
    try { preset = JSON.parse(localStorage.getItem('tap_trade_preset') || 'null'); } catch {}
    const usdt = preset?.usdt && preset.usdt > 0 ? preset.usdt : 100; // default 100 USDT
    const qty = Math.max(0, usdt / last);
    if (side === 'buy') {
      const totalCost = avgPrice * positionQty + usdt;
      const newQty = positionQty + qty;
      const newAvg = newQty > 0 ? totalCost / newQty : 0;
      setPositionQty(newQty);
      setAvgPrice(newAvg);
      setBankroll(b => b - usdt);
      setOrders(prev => [{ id: Date.now()+"", side, qty, price: last, usdt }, ...prev]);
    } else {
      // Sell ALL current position
      const sellQty = positionQty;
      const proceeds = sellQty * last;
      const costBasis = sellQty * avgPrice;
      const realized = proceeds - costBasis;
      const newQty = positionQty - sellQty;
      setPositionQty(newQty);
      if (newQty === 0) setAvgPrice(0);
      setBankroll(b => b + proceeds);
      setOrders(prev => [{ id: Date.now()+"", side, qty: sellQty, price: last, usdt: proceeds, pnl: realized }, ...prev]);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold">{symbol}/USDT</div>
        </div>
        <div />
      </div>

      <div className="px-4 pb-32">
        {/* Price + Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Last Price</div>
            <div className={`text-xl font-semibold ${isUp ? 'text-green-600' : 'text-red-600'}`}>{last.toFixed(2)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">1s Delta</div>
            <div className="text-xl font-semibold">{((last / prices[prices.length-2] - 1) * 100).toFixed(2)}%</div>
          </div>
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-3">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-72">
              <defs>
                <linearGradient id="tapFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* area */}
              <path d={`${path} L ${width},${height} L 0,${height} Z`} fill="url(#tapFill)" />
              {/* line */}
              <path d={path} fill="none" stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth={3} strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Position / PnL */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-muted-foreground mb-2">Your Position</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">${value.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{positionQty.toFixed(4)} {symbol}</div>
              {positionQty > 0 && (
                <div className="text-xs text-muted-foreground mt-1">Avg: ${avgPrice.toFixed(2)}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">P&L</div>
              <div className={`text-lg font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        {/* Orders summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 max-h-48 overflow-y-auto">
          <div className="text-sm font-medium mb-2">Orders</div>
          {orders.length === 0 ? (
            <div className="text-xs text-muted-foreground">No orders yet</div>
          ) : (
            <div className="text-xs">
              <div className="grid grid-cols-4 gap-2 pb-2 border-b border-gray-200 text-muted-foreground">
                <div>Side</div>
                <div className="text-right">Price</div>
                <div className="text-right">Qty</div>
                <div className="text-right">P&L</div>
              </div>
              <div className="divide-y">
                {orders.map(o => (
                  <div key={o.id} className="grid grid-cols-4 gap-2 py-2">
                    <div className={`${o.side==='buy'?'text-green-600':'text-red-600'} font-medium`}>{o.side.toUpperCase()}</div>
                    <div className="text-right">{o.price.toFixed(2)}</div>
                    <div className="text-right">{o.qty.toFixed(4)}</div>
                    <div className={`text-right ${o.side==='sell' ? ((o.pnl||0)>=0?'text-green-600':'text-red-600') : 'text-muted-foreground'}`}>{o.side==='sell' ? `${(o.pnl||0)>=0?'+':''}$${(o.pnl||0).toFixed(2)}` : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 h-12 rounded-lg bg-black text-white font-semibold" onClick={()=>executeTrade('buy')}>Buy</button>
          <button className="flex-1 h-12 rounded-lg bg-white text-black border border-gray-300" onClick={()=>{ 
            // realize remaining
            const proceeds = positionQty * last; 
            const cost = positionQty * avgPrice;
            const realized = proceeds - cost;
            const netPnl = orders.reduce((s,o)=> s + (o.pnl||0), 0) + realized;
            const spent = orders.filter(o=>o.side==='buy').reduce((s,o)=> s+o.usdt, 0);
            const pct = spent>0 ? (netPnl/spent)*100 : 0;
            try { sessionStorage.setItem('tap_trade_result', JSON.stringify({ pnl: netPnl, pct })); } catch {}
            setResultModal({ open:true, pnl: netPnl, pct });
            setRunning(false); setPositionQty(0); setAvgPrice(0); setOrders([]);
            // Navigate after short delay to allow user to see modal and confirm
          }}>Close All</button>
          <button className="flex-1 h-12 rounded-lg bg-white text-black border border-gray-300" onClick={()=>executeTrade('sell')}>Sell</button>
        </div>

        {/* Auto-close if bankroll depleted */}
        {bankroll <= 0 && positionQty === 0 && (
          (()=>{ setTimeout(()=>{ try { sessionStorage.setItem('tap_trade_result', JSON.stringify({ pnl: -Math.abs(bankroll), pct: -100 })); } catch {}; setResultModal({open:true, pnl: -Math.abs(bankroll), pct: -100}); }, 0); return null; })()
        )}

        {/* Result Modal */}
        {resultModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl p-5 w-[85%] max-w-sm shadow-lg text-center">
              <div className="text-3xl mb-2">{resultModal.pnl >= 0 ? '🎉' : '😅'}</div>
              <div className="text-lg font-semibold mb-1">{resultModal.pnl >= 0 ? 'Congrats!' : 'Better luck next time'}</div>
              <div className="text-sm text-muted-foreground mb-4">Net PnL</div>
              <div className={`text-2xl font-bold ${resultModal.pnl>=0 ? 'text-green-600' : 'text-red-600'}`}>{resultModal.pnl>=0?'+$':'-$'}{Math.abs(resultModal.pnl).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">{resultModal.pct.toFixed(2)}%</div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button className="h-10 rounded-lg bg-black text-white font-semibold" onClick={()=>{ setResultModal({open:false,pnl:0,pct:0}); router.push('/tap-trade'); }}>OK</button>
                <button className="h-10 rounded-lg bg-white text-black border border-gray-300" onClick={()=>{ setResultModal({open:false,pnl:0,pct:0}); }}>Stay</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TabNavigation activeTab="tap-trade" />
    </main>
  );
}


