import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '#/lib/api-client.js'
import { Button } from '#/components/ui/button.js'
import { Input } from '#/components/ui/input.js'
import { Label } from '#/components/ui/label.js'
import { Wallet, Send, History, UserPlus, RefreshCw, ArrowRightLeft, CheckCircle2, AlertCircle, ChevronDown, Search } from 'lucide-react'
import type { WalletAccount, LedgerHistoryItem } from '@repo/shared-types'

export const Route = createFileRoute('/')({
  component: WalletDashboard,
})

// Helper to generate RFC4122 v4 compliant strict UUIDs
function generateUuidV4() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
}

interface SearchDropdownProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

function SearchDropdown({ options, value, onChange, placeholder = 'Select option...', disabled = false }: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-full px-3 py-2 flex items-center justify-between rounded-md border border-[var(--line)] bg-[rgba(255,255,255,0.4)] text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-50 text-left"
      >
        <span className={selectedOption ? 'text-[var(--sea-ink)] font-medium' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--line)] rounded-md shadow-lg overflow-hidden flex flex-col max-h-60 animate-in fade-in-50 duration-100">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--line)] bg-gray-50/50">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none border-none p-0 focus:ring-0 placeholder:text-gray-400"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    opt.value === value ? 'bg-[rgba(23,58,64,0.04)] font-semibold text-[var(--sea-ink)]' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-gray-400 italic text-center">
                No accounts found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function WalletDashboard() {
  const [wallets, setWallets] = useState<WalletAccount[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string>('')
  const [activeBalance, setActiveBalance] = useState<number | null>(null)
  const [activeHistory, setActiveHistory] = useState<LedgerHistoryItem[]>([])

  // Loading states
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Message states
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New wallet form
  const [newAccountId, setNewAccountId] = useState('')
  const [newInitialBalance, setNewInitialBalance] = useState('')

  // Transfer form
  const [toAccountId, setToAccountId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')

  // Initial load
  const fetchWallets = async (selectFirst = false) => {
    try {
      setLoadingWallets(true)
      const data = await api.getWallets()
      setWallets(data)
      if (selectFirst && data.length > 0) {
        setActiveAccountId(data[0].accountId)
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg = err?.message || ''
      if (
        errorMsg.toLowerCase().includes('database') ||
        errorMsg.toLowerCase().includes('sqlite') ||
        errorMsg.toLowerCase().includes('prisma') ||
        errorMsg.toLowerCase().includes('table') ||
        errorMsg.toLowerCase().includes('relation') ||
        errorMsg.toLowerCase().includes('dev.db')
      ) {
        setError('Failed to fetch wallets: Database file not found or not initialized. Please ensure "apps/be/dev.db" is created and configured by running "pnpm --filter be db:push" (or "docker compose exec be pnpm --filter be db:push" if running in Docker).')
      } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch failed')) {
        setError('Failed to fetch wallets. Unable to connect to the backend server. Make sure it is running.')
      } else {
        setError(`Failed to fetch wallets: ${errorMsg}`)
      }
    } finally {
      setLoadingWallets(false)
    }
  }

  useEffect(() => {
    fetchWallets(true)
  }, [])

  // Fetch active wallet balance & history
  const fetchActiveWalletDetails = async (accountId: string) => {
    if (!accountId) return
    try {
      setLoadingDetails(true)
      const balanceData = await api.getWalletBalance(accountId)
      const historyData = await api.getWalletHistory(accountId)
      setActiveBalance(balanceData.balance)
      setActiveHistory(historyData)
    } catch (err: any) {
      console.error(err)
      const errorMsg = err?.message || ''
      if (
        errorMsg.toLowerCase().includes('database') ||
        errorMsg.toLowerCase().includes('sqlite') ||
        errorMsg.toLowerCase().includes('prisma') ||
        errorMsg.toLowerCase().includes('table') ||
        errorMsg.toLowerCase().includes('relation') ||
        errorMsg.toLowerCase().includes('dev.db')
      ) {
        setError('Failed to load wallet details: Database file not found or not initialized. Please ensure "apps/be/dev.db" is created and configured by running "pnpm --filter be db:push" (or "docker compose exec be pnpm --filter be db:push" if running in Docker).')
      } else {
        setError(errorMsg || 'Failed to load wallet details.')
      }
      setActiveBalance(null)
      setActiveHistory([])
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    if (activeAccountId) {
      fetchActiveWalletDetails(activeAccountId)
    } else {
      setActiveBalance(null)
      setActiveHistory([])
    }
  }, [activeAccountId])

  // Handle wallet creation
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountId.trim()) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const initial = parseFloat(newInitialBalance) || 0
      const created = await api.createWallet(newAccountId.trim(), initial)
      setSuccess(`Wallet account '${created.accountId}' successfully created!`)
      setNewAccountId('')
      setNewInitialBalance('')

      // Refresh list and select the new wallet
      await fetchWallets(false)
      setActiveAccountId(created.accountId)
    } catch (err: any) {
      setError(err?.message || 'Failed to create wallet.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle fund transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAccountId || !toAccountId.trim() || !transferAmount) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const amount = parseFloat(transferAmount)
      const transactionId = generateUuidV4()
      const result = await api.transfer({
        transactionId,
        fromAccountId: activeAccountId,
        toAccountId: toAccountId.trim(),
        amount
      })

      if (result.idempotent) {
        setSuccess(`Idempotent response: transaction '${result.transactionId}' was already processed successfully!`)
      } else {
        setSuccess(`Transfer of $${amount.toFixed(2)} to '${toAccountId.trim()}' was successful!`)
        setToAccountId('')
        setTransferAmount('')
      }

      // Refresh current wallet details
      await fetchActiveWalletDetails(activeAccountId)
    } catch (err: any) {
      setError(err?.message || 'Transfer failed.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-10 rise-in">
      {/* Hero Header */}
      <div className="text-center py-4">
        <h1 className="display-title text-4xl font-extrabold text-[var(--sea-ink)] tracking-tight flex items-center justify-center gap-2">
          <span>💳</span> Mini Wallet Dashboard
        </h1>
      </div>

      {/* Global Toast Error/Success */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 flex items-center gap-3 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Account Selector and Balance Card */}
        <div className="lg:col-span-1 space-y-6">

          {/* Account Selector */}
          <div className="island-shell rounded-2xl p-6 space-y-4 relative z-20">
            <h2 className="display-title text-lg font-bold text-[var(--sea-ink)] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[var(--lagoon-deep)]" /> Select Wallet
            </h2>

            <div className="space-y-3">
              <Label>Choose Active Wallet</Label>
              {loadingWallets ? (
                <div className="h-10 bg-[rgba(23,58,64,0.06)] rounded-lg animate-pulse" />
              ) : wallets.length > 0 ? (
                <SearchDropdown
                  options={wallets.map(w => ({ label: w.accountId, value: w.accountId }))}
                  value={activeAccountId}
                  onChange={(val) => {
                    setActiveAccountId(val)
                    setError(null)
                    setSuccess(null)
                  }}
                  placeholder="Select active wallet..."
                />
              ) : (
                <div className="text-xs text-[var(--sea-ink-soft)] italic py-1">
                  No accounts found. Create one below.
                </div>
              )}
            </div>
          </div>

          {/* Balance display */}
          <div className="island-shell rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-[var(--surface-strong)] to-[rgba(79,184,178,0.15)]">
            <div className="absolute right-4 top-4">
              <Button
                variant="outline"
                size="icon"
                disabled={loadingDetails || !activeAccountId}
                onClick={() => fetchActiveWalletDetails(activeAccountId)}
                className="h-8 w-8 rounded-full border-[var(--line)] text-[var(--sea-ink-soft)] cursor-pointer"
                title="Refresh Details"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDetails ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <span className="island-kicker text-xs">Available Funds</span>
            <h2 className="display-title text-xl font-bold text-[var(--sea-ink)] mt-1 mb-4">
              {activeAccountId ? `Account: ${activeAccountId}` : 'No Account Selected'}
            </h2>

            {loadingDetails ? (
              <div className="space-y-2 py-4">
                <div className="h-8 w-2/3 bg-[rgba(23,58,64,0.06)] rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-[rgba(23,58,64,0.06)] rounded animate-pulse" />
              </div>
            ) : activeBalance !== null ? (
              <div className="py-2">
                <div className="text-4xl font-extrabold text-[var(--sea-ink)] tracking-tight">
                  ${activeBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-[var(--sea-ink-soft)] mt-2 flex items-center gap-1">
                  <span>🟢 Active Ledger Sync</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--sea-ink-soft)] py-6 italic">
                Select a wallet to view balance.
              </div>
            )}
          </div>

          {/* Create Account Card */}
          <div className="island-shell rounded-2xl p-6">
            <h2 className="display-title text-lg font-bold text-[var(--sea-ink)] mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[var(--palm)]" /> Create Account
            </h2>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-account-id">Unique Account ID</Label>
                <Input
                  id="new-account-id"
                  placeholder="e.g. acc_alpha"
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  disabled={actionLoading}
                  required
                  className="bg-[rgba(255,255,255,0.4)] border-[var(--line)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-initial-balance">Initial Deposit ($)</Label>
                <Input
                  id="new-initial-balance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newInitialBalance}
                  onChange={(e) => setNewInitialBalance(e.target.value)}
                  disabled={actionLoading}
                  className="bg-[rgba(255,255,255,0.4)] border-[var(--line)]"
                />
              </div>

              <Button
                type="submit"
                disabled={actionLoading || !newAccountId.trim()}
                className="w-full bg-[var(--sea-ink)] hover:bg-[var(--sea-ink-soft)] text-white font-medium cursor-pointer"
              >
                {actionLoading ? 'Creating...' : 'Register Account'}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Columns: Transfer Form and Ledger History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Transfer Funds Panel */}
          <div className="island-shell rounded-2xl p-6 relative z-20">
            <h2 className="display-title text-lg font-bold text-[var(--sea-ink)] mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-[var(--lagoon-deep)]" /> Transfer Funds
            </h2>

            {!activeAccountId ? (
              <div className="p-4 rounded-xl bg-[rgba(23,58,64,0.04)] text-sm text-[var(--sea-ink-soft)] text-center">
                Please select a source wallet in the left panel to authorize a transfer.
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Source Account (Disabled) */}
                <div className="space-y-1.5">
                  <Label>Source Account</Label>
                  <Input
                    value={activeAccountId}
                    disabled
                    className="bg-[rgba(23,58,64,0.06)] border-[var(--line)]"
                  />
                </div>

                {/* Destination Account */}
                <div className="space-y-1.5">
                  <Label>Destination Account</Label>
                  <SearchDropdown
                    options={wallets
                      .filter(w => w.accountId !== activeAccountId)
                      .map(w => ({ label: w.accountId, value: w.accountId }))}
                    value={toAccountId}
                    onChange={setToAccountId}
                    placeholder="Select destination account..."
                    disabled={actionLoading}
                  />
                </div>

                {/* Transfer Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="transfer-amount">Amount ($)</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    disabled={actionLoading}
                    required
                    className="bg-[rgba(255,255,255,0.4)] border-[var(--line)]"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <Button
                    type="submit"
                    disabled={actionLoading || !toAccountId.trim() || !transferAmount}
                    className="w-full bg-[var(--sea-ink)] hover:bg-[var(--sea-ink-soft)] text-white font-medium cursor-pointer flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      'Processing Transaction...'
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4" /> Execute Transfer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Ledger History List */}
          <div className="island-shell rounded-2xl p-6">
            <h2 className="display-title text-lg font-bold text-[var(--sea-ink)] mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--palm)]" /> Ledger Entries
            </h2>

            {loadingDetails ? (
              <div className="space-y-3">
                <div className="h-10 bg-[rgba(23,58,64,0.04)] rounded-lg animate-pulse" />
                <div className="h-10 bg-[rgba(23,58,64,0.04)] rounded-lg animate-pulse" />
                <div className="h-10 bg-[rgba(23,58,64,0.04)] rounded-lg animate-pulse" />
              </div>
            ) : activeHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--sea-ink)]">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-xs text-[var(--sea-ink-soft)] uppercase font-semibold">
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Amount</th>
                      <th className="py-3 px-2">Transaction ID</th>
                      <th className="py-3 px-2 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {activeHistory.map((item) => (
                      <tr key={item.id} className="group hover:bg-[rgba(255,255,255,0.25)] transition-colors duration-150">
                        <td className="py-3 px-2 font-medium">
                          {item.type === 'credit' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Credit
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                              Debit
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-2 font-bold ${item.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.type === 'credit' ? '+' : '-'}${item.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 font-mono text-xs text-[var(--sea-ink-soft)] select-all truncate max-w-[180px]" title={item.transactionId}>
                          {item.transactionId}
                        </td>
                        <td className="py-3 px-2 text-right text-xs text-[var(--sea-ink-soft)]">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--sea-ink-soft)] text-sm italic">
                    {activeAccountId
                      ? 'No transactions found for this account. Create a transfer to start.'
                  : 'Select an account to view transaction history.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
