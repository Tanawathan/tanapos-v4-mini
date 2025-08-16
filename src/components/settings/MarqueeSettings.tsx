import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type DBMarquee = {
	id: string
	message?: string | null
	href?: string | null
	priority?: number | null
	is_active?: boolean | null
	starts_at?: string | null
	ends_at?: string | null
	updated_at?: string | null
	created_at?: string | null
}

const InfoRow: React.FC<{label: string; children: React.ReactNode}> = ({ label, children }) => (
	<div className="flex items-center justify-between py-2">
		<div className="text-sm text-ui-muted">{label}</div>
		<div className="text-sm text-ui-primary">{children}</div>
	</div>
)

const MarqueeSettings: React.FC = () => {
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const [existing, setExisting] = useState<DBMarquee | null>(null)
	const [nowShowing, setNowShowing] = useState<DBMarquee | null>(null)
	const [message, setMessage] = useState('')
	const [href, setHref] = useState<string>('')
	const [priority, setPriority] = useState<number>(10)
	const [enabled, setEnabled] = useState(true)
	// 僅用於編輯預覽，不會寫入 DB
	const [speed, setSpeed] = useState(50)
	const [startsAt, setStartsAt] = useState<string>('')
	const [endsAt, setEndsAt] = useState<string>('')

	const speedCss = useMemo(()=>{
		// Map 1-100 -> animation duration seconds (smaller is faster)
		const clamped = Math.max(1, Math.min(100, speed || 50))
		const duration = 30 - (clamped/100)*25 // 30s..5s
		return { ['--marquee-duration' as any]: `${duration.toFixed(1)}s` }
	}, [speed])

	function isActive(m: DBMarquee, now: Date) {
		if (!m.is_active) return false
		if (!m.message) return false
		const s = m.starts_at ? new Date(m.starts_at) : null
		const e = m.ends_at ? new Date(m.ends_at) : null
		if (s && s > now) return false
		if (e && e < now) return false
		return true
	}

	// DB ISO -> datetime-local (YYYY-MM-DDTHH:mm)
	const toLocalInput = (iso?: string | null) => {
		if (!iso) return ''
		try { return new Date(iso).toISOString().slice(0,16) } catch { return '' }
	}

	// datetime-local -> ISO (UTC Z)
	const fromLocalInput = (local: string) => {
		if (!local) return null
		try { return new Date(local).toISOString() } catch { return null }
	}

	const loadData = async () => {
		setLoading(true); setError(null)
		try {
			// 取最新一筆做為編輯初值
			const { data: latest, error: loadErr } = await supabase
				.from('marquees')
				.select('*')
				.order('updated_at', { ascending: false })
				.limit(1)
			if (loadErr) throw loadErr
			const row = latest?.[0] as DBMarquee | undefined
			if (row) {
				setExisting(row)
				setMessage(row.message ?? '')
				setHref(row.href ?? '')
				setPriority(Number(row.priority ?? 10))
				setEnabled(!!row.is_active)
				setStartsAt(toLocalInput(row.starts_at))
				setEndsAt(toLocalInput(row.ends_at))
			}

			// 取最近 20 筆，前端判斷「目前顯示」
			const { data: candidates, error: listErr } = await supabase
				.from('marquees')
				.select('*')
				.order('priority', { ascending: false })
				.order('updated_at', { ascending: false })
				.limit(20)
			if (listErr) throw listErr
			const now = new Date()
			const active = (candidates as DBMarquee[] | null)?.find(m => isActive(m, now)) || null
			setNowShowing(active)
		} catch (e: any) {
			setError(e?.message || '載入失敗')
		} finally {
			setLoading(false)
		}
	}

	useEffect(()=>{ loadData() }, [])

	const save = async () => {
		setSaving(true); setError(null); setSuccess(null)
		try {
			const payload: Partial<DBMarquee> = {
				message,
				href: href || null,
				priority,
				is_active: enabled,
				starts_at: fromLocalInput(startsAt),
				ends_at: fromLocalInput(endsAt),
			}
			if (existing?.id) {
				const { error: upErr } = await supabase
					.from('marquees')
					.update(payload)
					.eq('id', existing.id)
				if (upErr) throw upErr
			} else {
				const { data, error: insErr } = await supabase
					.from('marquees')
					.insert(payload)
					.select('*')
					.limit(1)
				if (insErr) throw insErr
				if (data && data[0]) setExisting(data[0] as DBMarquee)
			}
			setSuccess('已儲存並同步到 Supabase')
			await loadData()
		} catch (e: any) {
			setError(e?.message || '儲存失敗')
		} finally {
			setSaving(false)
			setTimeout(()=>setSuccess(null), 3000)
		}
	}

	const isEditingActive = () => {
		const now = new Date()
		return isActive({ id: 'tmp', message, href, priority, is_active: enabled, starts_at: startsAt ? new Date(startsAt).toISOString() : null, ends_at: endsAt ? new Date(endsAt).toISOString() : null, updated_at: null, created_at: null }, now)
	}

	return (
		<div className="border border-ui rounded-lg overflow-hidden">
			<div className="p-4 bg-ui-secondary/60">
				<h3 className="text-lg font-medium text-ui-primary">📰 跑馬燈設定</h3>
				<p className="text-xs text-ui-muted mt-1">透過 Supabase 資料表 marquees 控制外部 APP 的跑馬燈內容</p>
			</div>
			<div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* 編輯區 */}
				<div className="lg:col-span-2 space-y-4">
					{error && <div className="p-3 text-sm rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
					{success && <div className="p-3 text-sm rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}

					<label className="block">
						<div className="text-sm font-medium text-ui-primary mb-1">跑馬燈訊息</div>
						<textarea
							value={message}
							onChange={e=>setMessage(e.target.value)}
							className="w-full min-h-[96px] border rounded-lg px-3 py-2 text-sm"
							placeholder="輸入要顯示的公告內容..."
						/>
						<div className="text-xs text-ui-muted mt-1">建議 10-100 字，會循環滾動顯示</div>
					</label>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<label className="flex items-center justify-between p-3 rounded border">
							<span className="text-sm text-ui-primary">啟用跑馬燈</span>
							<input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} />
						</label>
						<label className="flex items-center justify-between p-3 rounded border">
							<span className="text-sm text-ui-primary">速度（預覽）</span>
							<input type="range" min={1} max={100} value={speed} onChange={e=>setSpeed(parseInt(e.target.value))} />
						</label>
						<label className="flex items-center justify-between p-3 rounded border">
							<span className="text-sm text-ui-primary">優先序</span>
							<input type="number" className="w-24 border rounded px-2 py-1 text-sm" value={priority} onChange={e=>setPriority(parseInt(e.target.value || '0'))} />
						</label>
					</div>

					<label className="block">
						<div className="text-sm text-ui-primary mb-1">連結 (選填)</div>
						<input type="text" value={href} onChange={e=>setHref(e.target.value)} placeholder="/book 或 https://..." className="border rounded px-2 py-1 text-sm w-full" />
					</label>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label className="block">
							<div className="text-sm text-ui-primary mb-1">開始時間 (選填)</div>
							<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
						</label>
						<label className="block">
							<div className="text-sm text-ui-primary mb-1">結束時間 (選填)</div>
							<input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
						</label>
					</div>

					<div className="flex justify-end gap-3">
						<button disabled={loading || saving} onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
							{saving ? '儲存中...' : '儲存設定'}
						</button>
					</div>
				</div>

				{/* 右側狀態區 */}
				<div className="space-y-4">
					{/* 現在顯示的內容 */}
					<div className="border rounded-lg overflow-hidden">
						<div className="p-3 bg-ui-secondary/60 text-sm font-medium">現在顯示的內容</div>
						<div className="p-3">
							{nowShowing ? (
								<div className="space-y-2">
									<div className="relative overflow-hidden border rounded bg-ui-secondary">
										<div className="whitespace-nowrap animate-[marquee_linear_infinite] px-4 py-2" style={{animationDuration: `20s`}}>
											<span className="mr-8">🟢 {nowShowing.message || '（無訊息）'}</span>
										</div>
									</div>
									<div className="text-xs text-ui-muted">
										<div>優先序: {nowShowing.priority ?? '—'}</div>
										<div>連結: {nowShowing.href || '—'}</div>
										<div>更新: {nowShowing.updated_at ? new Date(nowShowing.updated_at).toLocaleString() : '—'}</div>
									</div>
								</div>
							) : (
								<div className="text-center py-4 text-ui-muted">
									<div className="text-2xl mb-2">🔴</div>
									<div className="text-sm">目前沒有啟用的跑馬燈</div>
								</div>
							)}
						</div>
					</div>

					{/* 編輯預覽 */}
					<div className="border rounded-lg overflow-hidden">
						<div className="p-3 bg-ui-secondary/60 text-sm">編輯預覽</div>
						<div className="p-3">
							<div className="relative overflow-hidden border rounded bg-ui-secondary">
								<div className="whitespace-nowrap animate-[marquee_linear_infinite] px-4 py-2" style={speedCss as React.CSSProperties}>
									<span className="mr-8">{isEditingActive() ? '🟢' : '🔴'} {message || '（尚未設定訊息）'}</span>
								</div>
							</div>
							<style>{`
								@keyframes marquee { 0% { transform: translateX(100%);} 100% { transform: translateX(-100%);} }
								.animate-[marquee_linear_infinite] { animation: marquee var(--marquee-duration, 20s) linear infinite; }
							`}</style>
						</div>
					</div>

					<div className="border rounded-lg p-3 text-xs text-ui-muted">
						<div className="font-medium text-ui-primary mb-2">同步狀態</div>
						<div className="space-y-1">
							<InfoRow label="最後更新">{existing?.updated_at ? new Date(existing.updated_at).toLocaleString() : '—'}</InfoRow>
							<InfoRow label="資料表">public.marquees</InfoRow>
							<InfoRow label="優先序">{priority}</InfoRow>
							<InfoRow label="連結">{href || '—'}</InfoRow>
							<InfoRow label="當前狀態">{isEditingActive() ? '🟢 啟用中' : '🔴 停用/未到時間'}</InfoRow>
						</div>
						<div className="mt-2">另一個 APP 讀取該表格後即可即時顯示/更新跑馬燈。</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default MarqueeSettings

